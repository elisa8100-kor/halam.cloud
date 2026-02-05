import { CONFIG } from "./config.js";

export class TetrisGame {
  constructor({
    gameCanvas, nextCanvas, holdCanvas,
    scoreEl, levelEl, linesEl, bestEl,
    statusPill,
    onGameOver,
    sfx = true,
    shake = true,
  }){
    this.canvas = gameCanvas;
    this.ctx = this.canvas.getContext("2d");

    this.nextCanvas = nextCanvas;
    this.nctx = this.nextCanvas.getContext("2d");

    this.holdCanvas = holdCanvas;
    this.hctx = this.holdCanvas.getContext("2d");

    this.scoreEl = scoreEl;
    this.levelEl = levelEl;
    this.linesEl = linesEl;
    this.bestEl = bestEl;
    this.statusPill = statusPill;

    this.onGameOver = onGameOver;

    this.COLS = 10; this.ROWS = 20; this.CELL = 30;

    this.audioOn = sfx;
    this.shakeOn = shake;

    this.colors = {
      I:"#78a6ff", O:"#ffd36b", T:"#b38cff",
      S:"#7cf0c5", Z:"#ff7e7e", J:"#7aa6a6", L:"#ffb66b",
      GHOST:"rgba(255,255,255,.18)",
      GRID:"rgba(255,255,255,.08)",
    };

    this.shapes = {
      I:[[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
      O:[[0,1,1,0],[0,1,1,0],[0,0,0,0],[0,0,0,0]],
      T:[[0,1,0,0],[1,1,1,0],[0,0,0,0],[0,0,0,0]],
      S:[[0,1,1,0],[1,1,0,0],[0,0,0,0],[0,0,0,0]],
      Z:[[1,1,0,0],[0,1,1,0],[0,0,0,0],[0,0,0,0]],
      J:[[1,0,0,0],[1,1,1,0],[0,0,0,0],[0,0,0,0]],
      L:[[0,0,1,0],[1,1,1,0],[0,0,0,0],[0,0,0,0]],
    };

    // input repeat
    this.holdKeys = new Set();
    this.leftHeldAt = null;
    this.rightHeldAt = null;
    this.lastArrMove = 0;

    // gravity
    this.dropCounter = 0;
    this.dropInterval = 800;
    this.lastTime = 0;

    // state
    this.running = false;
    this.paused = false;
    this.gameOver = false;

    this._initAudio();
    this._loadBest();
    this.reset();
  }

  // ====== public getters for leaderboard
  getSnapshot(){
    return { score: this.score, lines: this.lines, level: this.level, gameOver: this.gameOver };
  }

  setSfx(v){ this.audioOn = v; }
  setShake(v){ this.shakeOn = v; }

  // ====== audio
  _initAudio(){
    this.AudioCtx = window.AudioContext || window.webkitAudioContext;
    this.actx = null;
  }
  _beep(freq=440, ms=55, type="square", gain=0.035){
    if(!this.audioOn) return;
    try{
      if(!this.actx) this.actx = new this.AudioCtx();
      const o = this.actx.createOscillator();
      const g = this.actx.createGain();
      o.type = type;
      o.frequency.value = freq;
      g.gain.value = gain;
      o.connect(g); g.connect(this.actx.destination);
      o.start();
      setTimeout(()=>{ try{o.stop();}catch(e){} }, ms);
    }catch(e){}
  }
  resumeAudio(){
    if(this.actx && this.actx.state === "suspended") this.actx.resume().catch(()=>{});
  }

  // ====== utils
  _clone(m){ return m.map(r => r.slice()); }

  _rotateCW(m){
    const res = Array.from({length:4}, ()=>Array(4).fill(0));
    for(let y=0;y<4;y++) for(let x=0;x<4;x++) res[x][3-y] = m[y][x];
    return res;
  }

  _emptyBoard(){
    return Array.from({length:this.ROWS}, ()=>Array(this.COLS).fill(null));
  }

  _refillBag(){
    this.bag = ["I","O","T","S","Z","J","L"];
    for(let i=this.bag.length-1;i>0;i--){
      const j = (Math.random()*(i+1))|0;
      [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
    }
  }

  _nextType(){
    if(!this.bag || this.bag.length===0) this._refillBag();
    return this.bag.pop();
  }

  _spawn(type){
    return { type, mat: this._clone(this.shapes[type]), x: (this.COLS/2|0)-2, y: -1 };
  }

  _loadBest(){
    this.best = Number(localStorage.getItem("tetris_best") || "0");
    if(this.bestEl) this.bestEl.textContent = String(this.best);
  }

  _saveBest(){
    if(this.score > this.best){
      this.best = this.score;
      localStorage.setItem("tetris_best", String(this.best));
      if(this.bestEl) this.bestEl.textContent = String(this.best);
    }
  }

  _setStatus(text){
    if(this.statusPill) this.statusPill.textContent = text;
  }

  reset(){
    this.board = this._emptyBoard();
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.dropInterval = 800;

    this._refillBag();
    this.current = this._spawn(this._nextType());
    this.queue = [this._spawn(this._nextType()), this._spawn(this._nextType()), this._spawn(this._nextType()), this._spawn(this._nextType()), this._spawn(this._nextType())];

    this.holdPiece = null;
    this.holdLocked = false;

    this.dropCounter = 0;
    this.lastTime = 0;

    this.running = false;
    this.paused = false;
    this.gameOver = false;

    this._updateUI();
    this._drawAll();
    this._drawMini(this.nctx, this.queue[0]);
    this._drawMini(this.hctx, this.holdPiece);
    this._setStatus("대기중");
  }

  start(){
    if(this.gameOver) return;
    if(!this.running){
      this.running = true;
      this.paused = false;
      this._setStatus("진행중");
      requestAnimationFrame((t)=>this._update(t));
    }
  }

  togglePause(){
    if(!this.running) return;
    this.paused = !this.paused;
    this._setStatus(this.paused ? "일시정지" : "진행중");
    this._beep(260, 40, "square", .03);
    if(!this.paused){
      this.lastTime = performance.now();
      requestAnimationFrame((t)=>this._update(t));
    }else{
      this._drawAll();
    }
  }

  // ===== collision
  _collides(piece, offX=0, offY=0, testMat=null){
    const mat = testMat || piece.mat;
    const px = piece.x + offX;
    const py = piece.y + offY;

    for(let y=0;y<4;y++){
      for(let x=0;x<4;x++){
        if(!mat[y][x]) continue;
        const bx = px + x;
        const by = py + y;

        if(bx < 0 || bx >= this.COLS || by >= this.ROWS) return true;
        if(by < 0) continue;
        if(this.board[by][bx]) return true;
      }
    }
    return false;
  }

  _merge(piece){
    for(let y=0;y<4;y++){
      for(let x=0;x<4;x++){
        if(!piece.mat[y][x]) continue;
        const bx = piece.x + x;
        const by = piece.y + y;
        if(by < 0){
          this._endGame();
          return;
        }
        this.board[by][bx] = piece.type;
      }
    }
  }

  _clearLines(){
    let cleared = 0;
    const rowsToClear = [];
    for(let y=this.ROWS-1; y>=0; y--){
      if(this.board[y].every(c => c !== null)){
        rowsToClear.push(y);
        cleared++;
      }
    }
    if(cleared === 0) return 0;

    // 작은 애니메이션: 해당 줄 반짝 후 제거
    this._flashRows(rowsToClear);

    for(const y of rowsToClear){
      this.board.splice(y,1);
      this.board.unshift(Array(this.COLS).fill(null));
    }

    const table = [0, 100, 300, 500, 800];
    this.score += (table[cleared] || 0) * this.level;
    this.lines += cleared;

    const newLevel = (this.lines / 10 | 0) + 1;
    if(newLevel !== this.level){
      this.level = newLevel;
      this.dropInterval = Math.max(90, 800 - (this.level-1)*60);
      this._beep(880, 80, "triangle", .04);
    }else{
      this._beep(520, 40, "square", .03);
    }

    if(this.shakeOn) this._shake(6 + cleared*2, 120);
    this._updateUI();
    return cleared;
  }

  _flashRows(rows){
    // 프레임 1회로 충분히 “섬세해 보이는” 효과
    this._drawAll();
    this.ctx.save();
    this.ctx.globalCompositeOperation = "screen";
    this.ctx.fillStyle = "rgba(255,255,255,.18)";
    for(const y of rows){
      this.ctx.fillRect(0, y*this.CELL, this.canvas.width, this.CELL);
    }
    this.ctx.restore();
  }

  _shake(px=6, ms=120){
    const el = this.canvas;
    const start = performance.now();
    const tick = (t)=>{
      const p = (t-start)/ms;
      if(p >= 1){ el.style.transform = ""; return; }
      const dx = (Math.random()*2-1) * px * (1-p);
      const dy = (Math.random()*2-1) * px * (1-p);
      el.style.transform = `translate(${dx}px, ${dy}px)`;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  _endGame(){
    if(this.gameOver) return;
    this.gameOver = true;
    this.running = false;
    this.paused = false;
    this._setStatus("게임오버");
    this._beep(140, 130, "sawtooth", .05);
    this._saveBest();
    this._updateUI();
    this._drawAll();
    this.onGameOver?.(this.getSnapshot());
  }

  // ===== piece actions
  move(dx){
    if(!this.running || this.paused || this.gameOver) return;
    if(!this._collides(this.current, dx, 0)){
      this.current.x += dx;
      this._beep(220, 16, "square", .02);
      this._drawAll();
    }
  }

  softDrop(){
    if(!this.running || this.paused || this.gameOver) return;
    if(!this._collides(this.current,0,1)){
      this.current.y++;
      this.score += 1;
      this._updateUI();
      this._drawAll();
    }else{
      this._lock();
    }
  }

  hardDrop(){
    if(!this.running || this.paused || this.gameOver) return;
    let d = 0;
    while(!this._collides(this.current,0,d+1)) d++;
    this.current.y += d;
    this.score += 2*d;
    this._beep(620, 40, "square", .03);
    this._updateUI();
    this._lock();
  }

  rotate(){
    if(!this.running || this.paused || this.gameOver) return;
    const rotated = this._rotateCW(this.current.mat);

    // SRS 느낌의 간단 킥
    const kicks = [0, -1, 1, -2, 2, -1];
    for(const k of kicks){
      if(!this._collides(this.current, k, 0, rotated)){
        this.current.mat = rotated;
        this.current.x += k;
        this._beep(330, 24, "triangle", .03);
        this._drawAll();
        return;
      }
    }
  }

  hold(){
    if(!this.running || this.paused || this.gameOver) return;
    if(this.holdLocked) return;

    this.holdLocked = true;
    this._beep(460, 40, "triangle", .03);

    const curType = this.current.type;
    if(!this.holdPiece){
      this.holdPiece = this._spawn(curType);
      this.current = this._shiftQueue();
    }else{
      const swapType = this.holdPiece.type;
      this.holdPiece = this._spawn(curType);
      this.current = this._spawn(swapType);
    }

    if(this._collides(this.current,0,0)){
      this._endGame();
      return;
    }

    this._drawMini(this.hctx, this.holdPiece);
    this._drawAll();
  }

  _shiftQueue(){
    const next = this.queue.shift();
    this.queue.push(this._spawn(this._nextType()));
    this._drawMini(this.nctx, this.queue[0]);
    return next;
  }

  _lock(){
    this._merge(this.current);
    if(this.gameOver) return;

    this._clearLines();

    this.current = this._shiftQueue();
    this.holdLocked = false;

    if(this._collides(this.current,0,0)){
      this._endGame();
      return;
    }
    this._drawAll();
  }

  // ===== rendering
  _drawGrid(){
    this.ctx.strokeStyle = this.colors.GRID;
    for(let x=0;x<=this.COLS;x++){
      this.ctx.beginPath();
      this.ctx.moveTo(x*this.CELL,0);
      this.ctx.lineTo(x*this.CELL,this.ROWS*this.CELL);
      this.ctx.stroke();
    }
    for(let y=0;y<=this.ROWS;y++){
      this.ctx.beginPath();
      this.ctx.moveTo(0,y*this.CELL);
      this.ctx.lineTo(this.COLS*this.CELL,y*this.CELL);
      this.ctx.stroke();
    }
  }

  _cell(x,y,color,alpha=1){
    this.ctx.globalAlpha = alpha;
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x*this.CELL, y*this.CELL, this.CELL, this.CELL);
    this.ctx.strokeStyle = "rgba(255,255,255,.10)";
    this.ctx.strokeRect(x*this.CELL+1, y*this.CELL+1, this.CELL-2, this.CELL-2);
    this.ctx.globalAlpha = 1;
  }

  _drawBoard(){
    this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
    this._drawGrid();
    for(let y=0;y<this.ROWS;y++){
      for(let x=0;x<this.COLS;x++){
        const t = this.board[y][x];
        if(t) this._cell(x,y,this.colors[t],0.95);
      }
    }
  }

  _ghostDistance(){
    let d=0;
    while(!this._collides(this.current,0,d+1)) d++;
    return d;
  }

  _drawPiece(piece, alpha=1, ghost=false){
    const mat = piece.mat;
    for(let y=0;y<4;y++){
      for(let x=0;x<4;x++){
        if(!mat[y][x]) continue;
        const bx = piece.x + x;
        const by = piece.y + y;
        if(by < 0) continue;
        const color = ghost ? this.colors.GHOST : this.colors[piece.type];
        this._cell(bx, by, color, alpha);
      }
    }
  }

  _drawAll(){
    this._drawBoard();

    if(!this.gameOver){
      // ghost
      const d = this._ghostDistance();
      const g = { ...this.current, y: this.current.y + d };
      this._drawPiece(g, 1, true);
      this._drawPiece(this.current, 0.98, false);
    }

    if(this.paused){
      this.ctx.fillStyle = "rgba(0,0,0,.42)";
      this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
      this.ctx.fillStyle = "rgba(255,255,255,.92)";
      this.ctx.font = "900 22px system-ui, sans-serif";
      this.ctx.textAlign = "center";
      this.ctx.fillText("일시정지", this.canvas.width/2, this.canvas.height/2 - 6);
      this.ctx.fillStyle = "rgba(255,255,255,.65)";
      this.ctx.font = "14px system-ui, sans-serif";
      this.ctx.fillText("P 또는 버튼으로 재개", this.canvas.width/2, this.canvas.height/2 + 18);
    }
  }

  _drawMini(ctx, piece){
    ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
    ctx.fillStyle = "rgba(0,0,0,.18)";
    ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);

    if(!piece) return;

    const size = 5;
    const cell = ctx.canvas.width / size;
    ctx.strokeStyle = "rgba(255,255,255,.08)";
    for(let i=0;i<=size;i++){
      ctx.beginPath(); ctx.moveTo(i*cell,0); ctx.lineTo(i*cell,ctx.canvas.height); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0,i*cell); ctx.lineTo(ctx.canvas.width,i*cell); ctx.stroke();
    }

    const mat = piece.mat;
    const offX = 1, offY = 1;
    for(let y=0;y<4;y++){
      for(let x=0;x<4;x++){
        if(!mat[y][x]) continue;
        ctx.fillStyle = this.colors[piece.type];
        ctx.globalAlpha = 0.95;
        ctx.fillRect((x+offX)*cell, (y+offY)*cell, cell, cell);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = "rgba(255,255,255,.12)";
        ctx.strokeRect((x+offX)*cell+1, (y+offY)*cell+1, cell-2, cell-2);
      }
    }
  }

  _updateUI(){
    this.scoreEl.textContent = String(this.score);
    this.levelEl.textContent = String(this.level);
    this.linesEl.textContent = String(this.lines);
    this.bestEl.textContent = String(this.best);
  }

  // ===== main loop
  _update(time=0){
    if(!this.running || this.paused || this.gameOver) return;

    const delta = time - this.lastTime;
    this.lastTime = time;
    this.dropCounter += delta;

    // input repeats (DAS/ARR)
    this._handleHeldKeys(time);

    if(this.dropCounter > this.dropInterval){
      if(!this._collides(this.current,0,1)){
        this.current.y++;
      }else{
        this._lock();
      }
      this.dropCounter = 0;
      this._drawAll();
    }

    requestAnimationFrame((t)=>this._update(t));
  }

  // ===== input held keys
  keyDown(code){
    this.holdKeys.add(code);

    if(code === "ArrowLeft") this.leftHeldAt = performance.now();
    if(code === "ArrowRight") this.rightHeldAt = performance.now();
  }

  keyUp(code){
    this.holdKeys.delete(code);

    if(code === "ArrowLeft") this.leftHeldAt = null;
    if(code === "ArrowRight") this.rightHeldAt = null;
  }

  _handleHeldKeys(time){
    // 좌우 ARR
    const doArr = (dir, heldAt) => {
      if(heldAt === null) return;
      const elapsed = time - heldAt;
      if(elapsed < CONFIG.dasMs) return;

      if(time - this.lastArrMove >= CONFIG.arrMs){
        this.move(dir);
        this.lastArrMove = time;
      }
    };

    doArr(-1, this.leftHeldAt);
    doArr( 1, this.rightHeldAt);

    // soft drop held
    if(this.holdKeys.has("ArrowDown")){
      if(!this._softHeldAt) this._softHeldAt = time;
      if(time - this._softHeldAt >= CONFIG.softDropMs){
        this.softDrop();
        this._softHeldAt = time;
      }
    }else{
      this._softHeldAt = null;
    }
  }
}
