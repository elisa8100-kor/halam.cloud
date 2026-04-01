// 게임 시작 및 튜토리얼 관리
let tutorialStep = 0;
const tutorialText = [
  "환영합니다! 두더지 잡기 게임에 오신 것을 환영합니다.",
  "화면을 터치하거나 스페이스 바를 눌러 두더지를 칩니다!",
  "콤보를 이어가면 더 많은 점수를 얻습니다!",
  "폭탄 두더지를 클릭하면 점수가 감소하고 콤보가 초기화됩니다.",
  "준비되셨나요? 게임을 시작합니다!"
];

// 튜토리얼 오버레이 설정
const tutorialOverlay = document.getElementById("tutorialOverlay");
const tutorialTextElement = document.getElementById("tutorialText");

function showTutorial() {
  tutorialOverlay.classList.add("show");
  tutorialStep = 0;
  displayTutorialText();
}

function displayTutorialText() {
  tutorialTextElement.textContent = tutorialText[tutorialStep];
}

function nextTutorialStep() {
  tutorialStep++;
  if (tutorialStep < tutorialText.length) {
    displayTutorialText();
  } else {
    tutorialOverlay.classList.remove("show");
    startGame();
  }
}

document.getElementById("tutorialNextButton").addEventListener("click", nextTutorialStep);

// 게임 객체 생성
const canvas = document.getElementById("game");
const btnStart = document.getElementById("btnStart");
const btnRestart = document.getElementById("btnRestart");
const toastEl = document.getElementById("toast");

let toastTimer = null;
function showToast(msg, ms = 2200) {
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), ms);
}

btnStart.addEventListener("click", () => {
  showTutorial();  // 게임 시작 전에 튜토리얼 화면을 먼저 보여주기
});

btnRestart.addEventListener("click", () => {
  game.restart();
});

// 게임 생성 및 로직
const game = createGame(canvas, {
  toast: showToast,
  onGameOver: async (score, maxCombo) => {
    if ((Number(score) || 0) <= 0) {
      refreshLeaderboard(showToast);
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

function startGame() {
  game.start();
}

// 게임 시작 전에 튜토리얼을 보여주기
showTutorial();
