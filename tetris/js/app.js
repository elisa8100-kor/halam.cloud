const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const nextCanvas = document.getElementById("next");
const nctx = nextCanvas.getContext("2d");

const scoreEl = document.getElementById("score");
const levelEl = document.getElementById("level");

const COLS = 10, ROWS = 20, BLOCK = 30;
canvas.width = COLS * BLOCK;
canvas.height = ROWS * BLOCK;

// 🎨 Guideline colors
const COLORS = {
  I:"#00f0f0", J:"#0000f0", L:"#f0a000",
  O:"#f0f000", S:"#00f000", T:"#a000f0", Z:"#f00000"
};

const TETROMINOS = {
  I:[[1,1,1,1]],
  J:[[1,0,0],[1,1,1]],
  L:[[0,0,1],[1,1,1]],
  O:[[1,1],[1,1]],
  S:[[0,1,1],[1,1,0]],
  T:[[0,1,0],[1,1,1]],
  Z:[[1,1,0],[0,1,1]]
};

let board = Array.from({length: ROWS}, ()=>Array(COLS).fill(null));
let score = 0;
let level = 1;
let dropInterval = 800;
let lastTime = 0;
let gameOver = false;

function randomPiece() {
  const keys = Object.keys(TETROMINOS);
  const type = keys[Math.floor(Math.random()*keys.length)];
  return {
    type,
    shape: TETROMINOS[type],
    color: COLORS[type],
    x: Math.floor(COLS/2)-1,
    y: 0
  };
}

let piece = randomPiece();
let nextPiece = randomPiece();

function drawCell(x,y,color){
  ctx.fillStyle = color;
  ctx.fillRect(x*BLOCK,y*BLOCK,BLOCK,BLOCK);
  ctx.strokeStyle="#111";
  ctx.strokeRect(x*BLOCK,y*BLOCK,BLOCK,BLOCK);
}

function drawNext(){
  nctx.clearRect(0,0,120,120);
  nextPiece.shape.forEach((row,y)=>
    row.forEach((v,x)=>{
      if(v){
        nctx.fillStyle = nextPiece.color;
        nctx.fillRect(x*30,y*30,30,30);
      }
    })
  );
}

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  board.forEach((row,y)=>
    row.forEach((cell,x)=>{
      if(cell) drawCell(x,y,cell);
    })
  );

  piece.shape.forEach((row,y)=>
    row.forEach((v,x)=>{
      if(v) drawCell(piece.x+x,piece.y+y,piece.color);
    })
  );
}

function collide(px,py,shape){
  return shape.some((row,y)=>
    row.some((v,x)=>{
      if(!v) return false;
      const nx=px+x, ny=py+y;
      return nx<0||nx>=COLS||ny>=ROWS||board[ny]?.[nx];
    })
  );
}

function merge(){
  piece.shape.forEach((row,y)=>
    row.forEach((v,x)=>{
      if(v) board[piece.y+y][piece.x+x]=piece.color;
    })
  );
}

function clearLines(){
  let cleared = 0;
  board = board.filter(row=>{
    if(row.every(cell=>cell)){
      cleared++;
      return false;
    }
    return true;
  });

  while(board.length<ROWS) board.unshift(Array(COLS).fill(null));

  if(cleared){
    score += cleared * 100;
    level = Math.floor(score / 500) + 1;
    dropInterval = Math.max(120, 800 - (level-1)*80);
    scoreEl.textContent = score;
    levelEl.textContent = level;
  }
}

function rotate(){
  const r = piece.shape[0].map((_,i)=>
    piece.shape.map(row=>row[i]).reverse()
  );
  if(!collide(piece.x,piece.y,r)) piece.shape = r;
}

function drop(){
  if(!collide(piece.x,piece.y+1,piece.shape)){
    piece.y++;
  } else {
    merge();
    clearLines();
    piece = nextPiece;
    nextPiece = randomPiece();
    drawNext();
    if(collide(piece.x,piece.y,piece.shape)) gameOver = true;
  }
}

function action(a){
  if(gameOver) return;
  if(a==="left"&&!collide(piece.x-1,piece.y,piece.shape)) piece.x--;
  if(a==="right"&&!collide(piece.x+1,piece.y,piece.shape)) piece.x++;
  if(a==="down") drop();
  if(a==="rotate") rotate();
}

document.addEventListener("keydown",e=>{
  if(e.key==="ArrowLeft") action("left");
  if(e.key==="ArrowRight") action("right");
  if(e.key==="ArrowDown") action("down");
  if(e.key==="ArrowUp") action("rotate");
});

document.querySelectorAll("#controls button").forEach(b=>{
  b.addEventListener("touchstart",e=>{
    e.preventDefault();
    action(b.dataset.action);
  });
});

function loop(t=0){
  if(!gameOver && t-lastTime>dropInterval){
    drop(); lastTime=t;
  }
  draw();
  requestAnimationFrame(loop);
}

drawNext();
loop();
