import { saveScore } from "./leaderboard.js";

const mole = document.getElementById("mole");
const scoreEl = document.getElementById("score");
const fx = document.getElementById("fx");
const ctx = fx.getContext("2d");

fx.width = window.innerWidth;
fx.height = 320;

let score = 0;
let speed = 1200;
let visible = false;

function updateScore() {
  scoreEl.textContent = `Score : ${score}`;
}

function showMole() {
  visible = true;
  mole.classList.add("show");

  setTimeout(() => {
    visible = false;
    mole.classList.remove("show");
  }, speed * 0.6);
}

function loop() {
  showMole();
  speed = Math.max(350, speed - 40); // 점점 빨라짐
  setTimeout(loop, speed);
}

mole.addEventListener("click", (e) => {
  if (!visible) return;

  score++;
  updateScore();
  visible = false;
  mole.classList.remove("show");
  firework(e.clientX, e.clientY);
});

setInterval(() => {
  if (score > 0) {
    score--;
    updateScore();
  }
}, 1000);

function firework(x, y) {
  for (let i = 0; i < 12; i++) {
    ctx.fillStyle = "rgba(255,215,0,0.8)";
    ctx.beginPath();
    ctx.arc(
      x + Math.cos(i) * 12,
      y + Math.sin(i) * 12,
      2,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  setTimeout(() => ctx.clearRect(0, 0, fx.width, fx.height), 200);
}

loop();

window.addEventListener("beforeunload", () => {
  saveScore(score);
});
