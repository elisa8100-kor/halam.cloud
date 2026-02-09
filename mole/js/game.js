const board = document.getElementById("gameBoard");
const scoreEl = document.getElementById("score");
const comboEl = document.getElementById("combo");
const timeEl = document.getElementById("time");

let score = 0;
let combo = 0;
let time = 10;
let playing = false;

for (let i = 0; i < 9; i++) {
  const hole = document.createElement("div");
  hole.className = "hole";

  const mole = document.createElement("div");
  mole.className = "mole";
  mole.innerHTML = `
    <div class="face">
      <div class="eye left"></div>
      <div class="eye right"></div>
      <div class="nose"></div>
    </div>
  `;

  hole.appendChild(mole);
  board.appendChild(hole);

  hole.onclick = () => {
    if (!mole.classList.contains("show")) return;
    score += 100 + combo * 20;
    combo++;
    scoreEl.textContent = score;
    comboEl.textContent = combo;
    mole.classList.remove("show");
  };
}

function popMole() {
  if (!playing) return;
  const moles = document.querySelectorAll(".mole");
  const mole = moles[Math.floor(Math.random() * moles.length)];
  mole.classList.add("show");
  setTimeout(() => mole.classList.remove("show"), 700);
}

export function startGame() {
  playing = true;
  score = 0;
  combo = 0;
  time = 10;

  scoreEl.textContent = 0;
  comboEl.textContent = 0;
  timeEl.textContent = time;

  const timer = setInterval(() => {
    time--;
    timeEl.textContent = time;
    if (time <= 0) {
      playing = false;
      clearInterval(timer);
    }
  }, 1000);

  setInterval(popMole, 600);
}
