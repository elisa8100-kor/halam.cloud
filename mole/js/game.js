const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let mole = { x: 180, y: 180, r: 10 };
let score = 0;
let speed = 0.5;

export function startGame() {
  canvas.onclick = hitCheck;
  requestAnimationFrame(loop);
}

function loop() {
  ctx.clearRect(0, 0, 360, 360);

  // 구멍
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.arc(180, 200, 60, 0, Math.PI * 2);
  ctx.fill();

  // 두더지 커짐
  mole.r += speed;
  if (mole.r > 60) {
    mole.r = 10;
    speed += 0.1; // 시간 갈수록 빨라짐
  }

  ctx.fillStyle = "#b85";
  ctx.beginPath();
  ctx.arc(mole.x, mole.y, mole.r, 0, Math.PI * 2);
  ctx.fill();

  requestAnimationFrame(loop);
}

function hitCheck(e) {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const dx = x - mole.x;
  const dy = y - mole.y;

  if (dx * dx + dy * dy < mole.r * mole.r) {
    score++;
    mole.r = 10;
  }
}

export function getScore() {
  return score;
}
