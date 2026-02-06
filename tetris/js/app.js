const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const COLS = 10;
const ROWS = 20;
const BLOCK = 30;

canvas.width = COLS * BLOCK;
canvas.height = ROWS * BLOCK;

// 🎨 Guideline colors
const COLORS = {
  I: "#00f0f0",
  J: "#0000f0",
  L: "#f0a000",
  O: "#f0f000",
  S: "#00f000",
  T: "#a000f0",
  Z: "#f00000"
};

const TETROMINOS = {
  I: [[1,1,1,1]],
  J: [[1,0,0],[1,1,1]],
  L: [[0,0,1],[1,1,1]],
  O: [[1,1],[1,1]],
  S: [[0,1,1],[1,1,0]],
  T: [[0,1,0],[1,1,1]],
  Z: [[1,1,0],[0,1,1]]
};

let board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
let dropInterval = 800;
let lastTime = 0;
let gameOver = false;

function newPiece() {
  const keys = Object.keys(TETROMINOS);
  const type = keys[Math.floor(Math.random() * keys.length)];
  return {
    type,
    shape: TETROMINOS[type],
    color: COLORS[type],
    x: Math.floor(COLS / 2) - 1,
    y: 0
  };
}

let piece = newPiece();

function drawCell(x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x * BLOCK, y * BLOCK, BLOCK, BLOCK);
  ctx.strokeStyle = "#111";
  ctx.strokeRect(x * BLOCK, y * BLOCK, BLOCK, BLOCK);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  board.forEach((row, y) =>
    row.forEach((cell, x) => {
      if (cell) drawCell(x, y, cell);
    })
  );

  piece.shape.forEach((row, dy) =>
    row.forEach((v, dx) => {
      if (v) drawCell(piece.x + dx, piece.y + dy, piece.color);
    })
  );

  if (gameOver) {
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fff";
    ctx.font = "36px system-ui";
    ctx.fillText("GAME OVER", 20, 300);
  }
}

function collide(px, py, shape) {
  return shape.some((row, dy) =>
    row.some((v, dx) => {
      if (!v) return false;
      const x = px + dx;
      const y = py + dy;
      return x < 0 || x >= COLS || y >= ROWS || board[y]?.[x];
    })
  );
}

function merge() {
  piece.shape.forEach((row, dy) =>
    row.forEach((v, dx) => {
      if (v) board[piece.y + dy][piece.x + dx] = piece.color;
    })
  );
}

function clearLines() {
  board = board.filter(row => row.some(cell => !cell));
  while (board.length < ROWS) {
    board.unshift(Array(COLS).fill(null));
    dropInterval = Math.max(150, dropInterval - 25);
  }
}

function rotate() {
  const rotated = piece.shape[0].map((_, i) =>
    piece.shape.map(row => row[i]).reverse()
  );
  if (!collide(piece.x, piece.y, rotated)) {
    piece.shape = rotated;
  }
}

function drop() {
  if (!collide(piece.x, piece.y + 1, piece.shape)) {
    piece.y++;
  } else {
    merge();
    clearLines();
    piece = newPiece();
    if (collide(piece.x, piece.y, piece.shape)) {
      gameOver = true;
    }
  }
}

function handleAction(action) {
  if (gameOver) return;
  if (action === "left" && !collide(piece.x - 1, piece.y, piece.shape)) piece.x--;
  if (action === "right" && !collide(piece.x + 1, piece.y, piece.shape)) piece.x++;
  if (action === "down") drop();
  if (action === "rotate") rotate();
}

// 키보드
document.addEventListener("keydown", e => {
  if (e.key === "ArrowLeft") handleAction("left");
  if (e.key === "ArrowRight") handleAction("right");
  if (e.key === "ArrowDown") handleAction("down");
  if (e.key === "ArrowUp") handleAction("rotate");
});

// 터치 버튼
document.querySelectorAll("#controls button").forEach(btn => {
  btn.addEventListener("touchstart", e => {
    e.preventDefault();
    handleAction(btn.dataset.action);
  });
});

function loop(time = 0) {
  if (!gameOver && time - lastTime > dropInterval) {
    drop();
    lastTime = time;
  }
  draw();
  requestAnimationFrame(loop);
}

loop();
