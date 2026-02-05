import { createGame, STATE_MENU, STATE_PLAY, STATE_PAUSE, STATE_GAMEOVER } from "./game.js";
import {
  refreshLeaderboard,
  qualifiesTop10,
  normalizeNickname,
  validateNickname,
  saveScore
} from "./leaderboard.js";

const toastEl = document.getElementById('toast');
function showToast(msg){
  if(!toastEl) return;
  toastEl.textContent = msg;
  toastEl.style.display = 'block';
  clearTimeout(showToast._t);
  showToast._t = setTimeout(()=>{ toastEl.style.display='none'; }, 1800);
}
window.__showToast = showToast;

const canvas = document.getElementById('game');
const { game, setTopHint, setOnGameOver } = createGame(canvas);

const ACCESS_PASSWORD = "halam0202";
const ACCESS_KEY = "wam_access_ok_v1";

const pwOverlay = document.getElementById("pwOverlay");
const pwInput = document.getElementById("pwInput");
const pwSubmit = document.getElementById("pwSubmit");
const pwMsg = document.getElementById("pwMsg");

let accessOk = localStorage.getItem(ACCESS_KEY) === "1";

async function doRefreshLeaderboard(){
  try{
    await refreshLeaderboard(showToast);
  }catch{}
}

async function unlock(){
  accessOk = true;
  localStorage.setItem(ACCESS_KEY, "1");
  if(pwOverlay) pwOverlay.style.display = "none";
  await doRefreshLeaderboard();
}

function lockMsg(msg){
  if(pwMsg) pwMsg.textContent = msg;
}

function initPasswordGate(){
  if(!pwOverlay || !pwInput || !pwSubmit || !pwMsg){
    doRefreshLeaderboard();
    return;
  }

  if(accessOk){
    pwOverlay.style.display = "none";
    doRefreshLeaderboard();
  } else {
    pwOverlay.style.display = "flex";
    pwInput.focus();
  }

  pwSubmit.addEventListener("click", ()=>{
    const v = pwInput.value.trim();
    if(v === ACCESS_PASSWORD){
      unlock();
    } else {
      lockMsg("비밀번호가 틀렸습니다.");
      pwInput.value = "";
      pwInput.focus();
    }
  });

  pwInput.addEventListener("keydown", (e)=>{
    if(e.key === "Enter") pwSubmit.click();
  });
}

initPasswordGate();

const btnStart = document.getElementById('btnStart');
const btnPause = document.getElementById('btnPause');
const btnRestart = document.getElementById('btnRestart');

if(btnStart){
  btnStart.addEventListener('click', ()=>{
    if(game.state===STATE_MENU || game.state===STATE_GAMEOVER){
      setTopHint("");
      game.reset(); game.state=STATE_PLAY;
    }
  });
}
if(btnPause){
  btnPause.addEventListener('click', ()=>{
    if(game.state===STATE_PLAY) game.state=STATE_PAUSE;
    else if(game.state===STATE_PAUSE) game.state=STATE_PLAY;
  });
}
if(btnRestart){
  btnRestart.addEventListener('click', ()=>{
    setTopHint("");
    game.reset(); game.state=STATE_PLAY;
  });
}

const hintEl = document.getElementById('hint');
if(hintEl){
  setInterval(()=>{
    if(game.state === STATE_PLAY) hintEl.textContent = "타격: 클릭/터치 · P 일시정지 · R 재시작";
    else if(game.state === STATE_PAUSE) hintEl.textContent = "일시정지 중 · P 또는 일시정지 버튼으로 재개";
    else if(game.state === STATE_GAMEOVER) hintEl.textContent = "게임 오버 · R 또는 재시작 버튼으로 다시 시작";
    else hintEl.textContent = "Space 시작 · 시작 버튼 클릭 가능 · 모바일은 화면 터치로 시작/타격";
  }, 300);
}

const nameOverlay = document.getElementById('nameOverlay');
const nicknameInput = document.getElementById('nickname');
const submitNameBtn = document.getElementById('submitName');
const cancelNameBtn = document.getElementById('cancelName');

let pendingScore = null;
let submitting = false;

async function probeAndMaybeAskName(score, maxCombo){
  if(pwOverlay && !accessOk){
    showToast("비밀번호를 입력해주세요.");
    return;
  }

  try{
    const result = await qualifiesTop10(score, maxCombo);

    if(result.qualifies){
      setTopHint("");
      pendingScore = { score, maxCombo };
      if(nicknameInput) nicknameInput.value = "";
      if(nameOverlay) nameOverlay.style.display = "flex";
      if(nicknameInput) nicknameInput.focus();
    }else{
      const cutoff = Number(result.cutoffScore);
      if(Number.isFinite(cutoff) && cutoff > score){
        setTopHint(`Top 10까지 ${cutoff - score}점 부족합니다.`);
      }else{
        setTopHint("Top 10에 들지 못했습니다. 더 높은 점수로 도전해보세요.");
      }
      showToast("Top 10에 들지 못했습니다.");
    }

    await doRefreshLeaderboard();
  }catch{
    showToast("점수 처리 중 네트워크 문제가 발생했습니다.");
  }
}

setOnGameOver(probeAndMaybeAskName);

if(submitNameBtn){
  submitNameBtn.addEventListener('click', async ()=>{
    if(submitting) return;

    const name = normalizeNickname(nicknameInput?.value || "");
    if(!validateNickname(name)){
      showToast("닉네임 형식이 맞지 않습니다. (2~12자, 특수문자 제한)");
      return;
    }
    if(!pendingScore){
      if(nameOverlay) nameOverlay.style.display='none';
      return;
    }

    submitting = true;
    submitNameBtn.disabled = true;
    if(cancelNameBtn) cancelNameBtn.disabled = true;

    try{
      await saveScore(name, pendingScore.score, pendingScore.maxCombo);
      if(nameOverlay) nameOverlay.style.display='none';
      showToast("리더보드에 저장 완료했습니다.");
      pendingScore = null;
      await doRefreshLeaderboard();
    }catch{
      showToast("리더보드에 저장 완료했습니다.");
    }finally{
      submitting = false;
      submitNameBtn.disabled = false;
      if(cancelNameBtn) cancelNameBtn.disabled = false;
    }
  });
}

if(cancelNameBtn){
  cancelNameBtn.addEventListener('click', ()=>{
    pendingScore = null;
    if(nameOverlay) nameOverlay.style.display='none';
    showToast("저장을 취소했습니다.");
  });
}

if(nicknameInput){
  nicknameInput.addEventListener('keydown', (e)=>{
    if(e.key==="Enter" && submitNameBtn) submitNameBtn.click();
    if(e.key==="Escape" && cancelNameBtn) cancelNameBtn.click();
  });
}
