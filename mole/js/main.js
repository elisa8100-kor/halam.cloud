import { createGame } from "./game.js";
import {
  refreshLeaderboard,
  qualifiesTop10,
  saveScore,
  normalizeNickname,
  validateNickname,
} from "./leaderboard.js";

const canvas = document.getElementById("game");

const btnStart = document.getElementById("btnStart");
const btnPause = document.getElementById("btnPause");
const btnRestart = document.getElementById("btnRestart");

const toastEl = document.getElementById("toast");
let toastTimer = null;
function showToast(msg, ms = 2200) {
  if (!toastEl) return;
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), ms);
}
window.__showToast = showToast;

const overlay = document.getElementById("nameOverlay");
const nicknameInput = document.getElementById("nickname");
const submitNameBtn = document.getElementById("submitName");
const cancelNameBtn = document.getElementById("cancelName");

let pending = null;

function openOverlay() {
  overlay.classList.add("show");
  nicknameInput.value = "";
  nicknameInput.focus();
}
function closeOverlay() {
  overlay.classList.remove("show");
  pending = null;
}

closeOverlay();

const game = createGame(canvas, {
  toast: showToast,
  onGameOver: async (score, maxCombo) => {
    if ((Number(score) || 0) <= 0) {
      await refreshLeaderboard(showToast);
      return;
    }

    try {
      const q = await qualifiesTop10(score, maxCombo);
      if (q.qualifies) {
        pending = { score, maxCombo };
        showToast("Top 10 진입! 닉네임을 저장해보세요 🎉");
        openOverlay();
      } else {
        showToast(`Top 10 컷: ${q.cutoffScore}점`);
      }
    } catch (e) {
      console.error(e);
      showToast("Top 10 확인 실패(네트워크).");
    } finally {
      refreshLeaderboard(showToast);
    }
  }
});

function safeCloseOnAction() {
  if (overlay.classList.contains("show")) closeOverlay();
}

btnStart?.addEventListener("click", () => {
  safeCloseOnAction();
  game.start();
});

btnRestart?.addEventListener("click", () => {
  safeCloseOnAction();
  game.restart();
});

btnPause?.addEventListener("click", () => {
  safeCloseOnAction();
  const st = game.getState();
  if (st === "play") game.pause();
  else if (st === "pause") game.resume();
  else showToast("플레이 중에만 일시정지 가능");
});

cancelNameBtn?.addEventListener("click", () => {
  closeOverlay();
  showToast("저장을 취소했습니다.");
});

submitNameBtn?.addEventListener("click", async () => {
  if (!pending) return;

  const name = normalizeNickname(nicknameInput.value);
  if (!validateNickname(name)) {
    showToast("닉네임: 2~12자, 한글/영문/숫자/공백/_/- 만 가능");
    nicknameInput.focus();
    return;
  }

  submitNameBtn.disabled = true;
  try {
    await saveScore(name, pending.score, pending.maxCombo);
    showToast("저장 완료! 🏆");
    closeOverlay();
    await refreshLeaderboard(showToast);
  } catch (err) {
    console.error(err);
    showToast("저장 실패: 네트워크/RLS 설정 확인");
  } finally {
    submitNameBtn.disabled = false;
  }
});

nicknameInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") submitNameBtn.click();
  if (e.key === "Escape") cancelNameBtn.click();
});

refreshLeaderboard(showToast);
