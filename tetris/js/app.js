const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const nextCanvas = document.getElementById("next");
const nctx = nextCanvas.getContext("2d");

const scoreEl = document.getElementById("score");
const levelEl = document.getElementById("level");

const COLS = 10, ROWS = 20, B = 30;
canvas.width = COLS * B;
canvas.height = ROWS * B;

// 🎨 TCC 표준 색
const COLORS = {
  I:"#00f0f0", J:"#0000f0", L:"#f0a000",
  O:"#f0f000", S:"#00f000", T:"#a000f0", Z:"#f00000"
};

const SHAPES = {
  I:[[1,1,1,1]],
  J:[[1,0,0],[1,1,1]],
  L:[[0,0,1],[1,1,1]],
  O:[[1,1],[1,1]],
  S:[[0,1,1],[1,1,0]],
  T:[[0,1,0],[1,1,1]],
  Z:[[1,1,0],[0,1,1]]
};

let board = Array.from({length:ROWS},()=>Array(COLS).fill(null));
let score = 0, level = 1, speed = 800;
let last = 0, over = false, pause = false;

function randomPiece(){
  const keys = Object.keys(SHAPES);
  const t = keys[Math.random()*keys.length|0];
  return { t, s: SHAPES[t], c: COLORS[t], x: 3, y: 0 };
}

let piece = randomPiece();
let next = randomPiece();

function drawCell(x,y,c){
  ctx.fillStyle = c;
  ctx.fillRect(x*B,y*B,B,B);
  ctx.strokeStyle="#111";
  ctx.strokeRect(x*B,y*B,B,B);
}

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  board.forEach((r,y)=>r.forEach((c,x)=>c&&drawCell(x,y,c)));
  piece.s.forEach((r,y)=>r.forEach((v,x)=>v&&drawCell(piece.x+x,piece.y+y,piece.c)));
}

function drawNext(){
  nctx.clearRect(0,0,120,120);
  next.s.forEach((r,y)=>r.forEach((v,x)=>{
    if(v){
      nctx.fillStyle = next.c;
      nctx.fillRect(x*30,y*30,30,30);
    }
  }));
}

function collide(px,py,s){
  return s.some((r,y)=>r.some((v,x)=>{
    if(!v) return false;
    const nx = px+x, ny = py+y;
    return nx<0 || nx>=COLS || ny>=ROWS || board[ny]?.[nx];
  }));
}

function merge(){
  piece.s.forEach((r,y)=>r.forEach((v,x)=>{
    if(v) board[piece.y+y][piece.x+x] = piece.c;
  }));
}

function clearLines(){
  let lines = 0;

  for(let y = ROWS-1; y >= 0; y--){
    if(board[y].every(c=>c)){
      board.splice(y,1);
      board.unshift(Array(COLS).fill(null));
      lines++;
      y++;
    }
  }

  if(lines){
    score += lines * 100;
    level = Math.floor(score / 500) + 1;
    speed = Math.max(120, 800 - (level-1)*80);
    scoreEl.textContent = score;
    levelEl.textContent = level;
  }
}

function rotate(){
  const r = piece.s[0].map((_,i)=>piece.s.map(r=>r[i]).reverse());
  if(!collide(piece.x,piece.y,r)) piece.s = r;
}

function drop(hard=false){
  if(!collide(piece.x,piece.y+1,piece.s)){
    piece.y++;
  } else {
    merge();
    clearLines();
    piece = next;
    next = randomPiece();
    drawNext();
    if(collide(piece.x,piece.y,piece.s)) over = true;
  }

  if(hard){
    while(!collide(piece.x,piece.y+1,piece.s)){
      piece.y++;
    }
  }
}

function act(a){
  if(over || pause) return;
  if(a==="left"&&!collide(piece.x-1,piece.y,piece.s)) piece.x--;
  if(a==="right"&&!collide(piece.x+1,piece.y,piece.s)) piece.x++;
  if(a==="down") drop();
  if(a==="rotate") rotate();
  if(a==="drop") drop(true);
}

// 🎮 키보드 (Pause 우선)
document.addEventListener("keydown",e=>{
  if(e.key==="p"||e.key==="P"){
    pause = !pause;
    return;
  }
  if(over || pause) return;

  if(e.key==="ArrowLeft") act("left");
  if(e.key==="ArrowRight") act("right");
  if(e.key==="ArrowDown") act("down");
  if(e.key==="ArrowUp") act("rotate");
  if(e.code==="Space") act("drop");
});

// 📱 터치
document.querySelectorAll("#controls button").forEach(b=>{
  b.addEventListener("touchstart",e=>{
    e.preventDefault();
    act(b.dataset.a);
  });
});

function loop(t=0){
  if(!over && !pause && t-last>speed){
    drop();
    last = t;
  }

  draw();

  if(pause){
    ctx.fillStyle="rgba(0,0,0,.6)";
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle="#fff";
    ctx.font="28px sans-serif";
    ctx.fillText("PAUSE",90,300);
  }

  if(over){
    ctx.fillStyle="rgba(0,0,0,.7)";
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle="#fff";
    ctx.font="28px sans-serif";
    ctx.fillText("GAME OVER",40,300);
  }

  requestAnimationFrame(loop);
}

drawNext();
loop();
