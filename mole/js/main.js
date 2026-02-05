import { createGame, STATE_MENU, STATE_PLAY, STATE_GAMEOVER } from "./game.js";
import {
  refreshLeaderboard,
  qualifiesTop10,
  normalizeNickname,
  validateNickname,
  saveScore
} from "./leaderboard.js";

const canvas = document.getElementById("game");
const { game, setOnGameOver } = createGame(canvas);

const submitNameBtn = document.getElementById("submitName");
const cancelNameBtn = document.getElementById("cancelName");
const nicknameInput = document.getElementById("nickname");
const nameOverlay = document.getElementById("nameOverlay");
const toast = document.getElementById("toast");

function showToast(msg){
  toast.textContent = msg;
  toast.style.display = "block";
  setTimeout(()=>toast.style.display="none", 1500);
}

let pendingScore = null;
let submitting = false;

setOnGameOver(async (score, maxCombo)=>{
  const result = await qualifiesTop10(score, maxCombo);
  if(result.qualifies){
    pendingScore = { score, maxCombo };
    nicknameInput.value = "";
    nameOverlay.style.display = "flex";
  }else{
    showToast("Top 10에 들지 못했습니다.");
  }
  refreshLeaderboard(showToast);
});

submitNameBtn.addEventListener("click", async ()=>{
  if(submitting) return;

  const name = normalizeNickname(nicknameInput.value);
  if(!validateNickname(name)){
    showToast("닉네임 형식 오류");
    return;
  }

  submitting = true;
  try{
    await saveScore(name, pendingScore.score, pendingScore.maxCombo);
    pendingScore = null;
    nameOverlay.style.display = "none";
    showToast("저장 완료");
    await refreshLeaderboard(showToast);
  }catch(e){
    console.error(e);
    showToast("저장 실패");
  }finally{
    submitting = false;
  }
});

cancelNameBtn.addEventListener("click", ()=>{
  pendingScore = null;
  nameOverlay.style.display = "none";
});
