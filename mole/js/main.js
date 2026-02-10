import { startGame, getScore } from "./game.js";
import { saveScore, loadLeaderboard } from "./leaderboard.js";

const btn = document.getElementById("saveBtn");
const nicknameInput = document.getElementById("nickname");
const msg = document.getElementById("msg");

startGame();
loadLeaderboard();

btn.onclick = async () => {
  const name = nicknameInput.value.trim();
  if (!name) {
    msg.textContent = "닉네임 입력해라";
    return;
  }

  msg.textContent = "저장 중...";

  const score = getScore();
  const ok = await saveScore(name, score);

  if (ok) {
    msg.textContent = "저장 완료";
    loadLeaderboard();
  } else {
    msg.textContent = "저장 실패";
  }
};
