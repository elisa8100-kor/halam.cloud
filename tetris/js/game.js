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

        if(bx < 0 || bx >= this.COLS || by >= this.ROWS) return tru
