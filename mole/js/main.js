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
  toastEl.textContent = msg;
  toastEl.style.display = 'block';
  clearTimeout(showToast._t);
  showToast._t = setTimeout(()=>{ toastEl.style.display='none'; }, 1800);
}
window.__showToast = showToast;

const canvas = document.getElementById('game');
const { game, setTopHint, setOnGameOver } = createGame(canvas);

const btnStart = document.getElementById('btnStart');
const btnPause = document.getElementById('btnPause');
const btnRestart = document.getElementById('btnRestart');

btnStart.addEventListener('click', ()=>{
  if(game.state===STATE_MENU || game.state===STATE_GAMEOVER){
    setTopHint("");
    game.reset(); game.state=STATE_PLAY;
  }
});
btnPause.addEventListener('click', ()=>{
  if(game.state===STATE_PLAY) game.state=STATE_PAUSE;
  else if(game.state===STATE_PAUSE) game.state=STATE_PLAY;
});
btnRestart.addEventListener('click', ()=>{
  setTopHint("");
  game.reset(); game.state=STATE_PLAY;
});

const hintEl = document.getElementById('hint');
setInterval(()=>{
  if(game.state === STATE_PLAY) hintEl.textContent = "타격: 클릭/터치 · P 일시정지 · R 재시작";
  else if(game.state === STATE_PAUSE) hintEl.textContent = "일시정지 중 · P 또는 일시정지 버튼으로 재개";
  else if(game.state === STATE_GAMEOVER) hintEl.textContent = "게임 오버 · R 또는 재시작 버튼으로 다시 시작";
  else hintEl.textContent = "Space 시작 · 시작 버튼 클릭 가능 · 모바일은 화면 터치로 시작/타격";
}, 300);

const nameOverlay = document.getElementById('nameOverlay');
const nicknameInput = document.getElementById('nickname');
const submitNameBtn = document.getElementById('submitName');
const cancelNameBtn = document.getElementById('cancelName');

let pendingScore = null;
let submitting = false;

async function probeAndMaybeAskName(score, maxCombo){
  try{
    const result = await qualifiesTop10(score, maxCombo);

    if(result.qualifies){
      setTopHint("");
      pendingScore = { score, maxCombo };
      nicknameInput.value = "";
      nameOverlay.style.display = "flex";
      nicknameInput.focus();
    }else{
      const cutoff = Number(result.cutoffScore);
      if(Number.isFinite(cutoff) && cutoff > score){
        setTopHint(`Top 10까지 ${cutoff - score}점 부족합니다.`);
      }else{
        setTopHint("Top 10에 들지 못했습니다. 더 높은 점수로 도전해보세요.");
      }
      showToast("Top 10에 들지 못했습니다.");
    }

    await refreshLeaderboard(showToast);
  }catch{
    showToast("점수 처리 중 네트워크 문제가 발생했습니다.");
  }
}

setOnGameOver(probeAndMaybeAskName);

submitNameBtn.addEventListener('click', async ()=>{
  if(submitting) return;

  const name = normalizeNickname(nicknameInput.value);
  if(!validateNickname(name)){
    showToast("닉네임 형식이 맞지 않습니다. (2~12자, 특수문자 제한)");
    return;
  }
  if(!pendingScore){
    nameOverlay.style.display='none';
    return;
  }

  submitting = true;
  submitNameBtn.disabled = true;
  cancelNameBtn.disabled = true;

  try{
    await saveScore(name, pendingScore.score, pendingScore.maxCombo);

    nameOverlay.style.display='none';
    showToast("리더보드에 저장 완료했습니다.");
    pendingScore = null;

    await refreshLeaderboard(showToast);
  }catch{
    showToast("저장 중 문제가 발생했습니다.");
  }finally{
    submitting = false;
    submitNameBtn.disabled = false;
    cancelNameBtn.disabled = false;
  }
});

cancelNameBtn.addEventListener('click', ()=>{
  pendingScore = null;
  nameOverlay.style.display='none';
  showToast("저장을 취소했습니다.");
});

nicknameInput.addEventListener('keydown', (e)=>{
  if(e.key==="Enter") submitNameBtn.click();
  if(e.key==="Escape") cancelNameBtn.click();
});

await refreshLeaderboard(showToast);


