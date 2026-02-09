import { createGame, STATE_PLAY } from "./game.js";
import { refreshLeaderboard, saveScore } from "./leaderboard.js";

const ACCESS_PASSWORD = "halam0202";

const pwOverlay = document.getElementById("pwOverlay");
const pwInput = document.getElementById("pwInput");
const pwSubmit = document.getElementById("pwSubmit");
const pwMsg = document.getElementById("pwMsg");

pwSubmit.onclick = async ()=>{
  if(pwInput.value === ACCESS_PASSWORD){
    pwOverlay.style.display = "none";
    await refreshLeaderboard();
  }else{
    pwMsg.textContent = "비밀번호 틀림";
  }
};

const canvas = document.getElementById("game");
const { game } = createGame(canvas);

document.getElementById("btnStart").onclick = ()=>{
  game.state = STATE_PLAY;
};
