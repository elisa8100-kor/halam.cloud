const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const COLS = 10;
const ROWS = 20;
const BLOCK = 30;

canvas.width = COLS * BLOCK;
canvas.height = ROWS * BLOCK;

const board = Array.from({ length: ROWS }, () =>
  Array(COLS).fill(0)
);

const piece = {
  x: 4,
  y: 0,
  shape: [
    [1, 1],
    [1, 1]
  ]
};

function drawCell(x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x * BLOCK, y * BLOCK, BLOCK, BLOCK);
  ctx.strokeStyle = "#111";
  ctx.strokeRect(x * BLOCK, y * BLOCK, BLOCK, BLOCK);
}

function drawBoard() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  board.forEach((row, y) =>
    row.forEach((value, x) => {
      if (value) drawCell(x, y, "#333");
    })
  );
}

function drawPiece() {
  piece.shape.forEach((row, dy) =>
    row.forEach((value, dx) => {
      if (value) drawCell(piece.x + dx, piece.y + dy, "#00ffd5");
    })
  );
}

function update() {
  piece.y++;
  drawBoard();
  drawPiece();
}

setInterval(update, 500);
