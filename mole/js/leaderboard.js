const KEY = "MOLE_RANK";

export function loadLeaderboard() {
  const list = document.getElementById("rankList");
  list.innerHTML = "";

  const data = JSON.parse(localStorage.getItem(KEY)) || [];
  data.slice(0, 20).forEach((s, i) => {
    const li = document.createElement("li");
    li.textContent = `${i + 1}위 - ${s}점`;
    list.appendChild(li);
  });
}

export function saveScore(score) {
  let data = JSON.parse(localStorage.getItem(KEY)) || [];
  data.push(score);
  data.sort((a, b) => b - a);
  localStorage.setItem(KEY, JSON.stringify(data.slice(0, 20)));
}
