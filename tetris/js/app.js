import { TetrisGame } from "./game.js";
import { Leaderboard } from "./leaderboard.js";

const $ = (id) => document.getElementById(id);

const el = {
  game: $("game"),
  next: $("next"),
  hold: $("hold"),
  score: $("score"),
  level: $("level"),
  lines: $("lines"),
  best: $("best"),
  statusPill: $("statusPill"),
  netPill: $("netPill"),

  overlay: $("overlay"),
  ovTitle: $("ovTitle"),
  ovText: $("ovText"),
  playerName: $("playerName"),

  btnStart: $("btnStart"),
  btnPause: $("btnPause"),
  btnRestart: $("btnRestart"),
  btnSound: $("btnSound"),
  btnShake: $("btnShake"),

  btnSubmit: $("btnSubmit"),
  btnPlayAgain: $("btnPlayAgain"),
  btnCloseOverlay: $("btnCloseOverlay"),

  lbStatus: $("lbStatus"),
  lbList: $("lbList"),
};

const leaderboard = new Leaderboard({
  statusEl: el.lbStatus,
  listEl: el.lbList,
  netEl: el.netPill,
});

let sfxOn = true;
let shakeOn = true;

const game = new TetrisGame({
  gameCanvas: el.game,
  nextCanvas: el.next,
  holdCanvas: el.hold,
  scoreEl: el.score,
  levelEl: el.level,
  linesEl: el.lines,
  bestEl: el.best,
  statusPill: el.statusPill,
  sfx: sfxOn,
  shake: shakeOn,
  onGameOver: (snap) => {
    el.ovTitle.textContent = "게임 오버";
    el.ovText.textContent = `점수 ${snap.score.toLocaleString("ko-KR")}점 • 라인 ${snap.lines} • 레벨 ${snap.level}`;
    el.overlay.classList.add("show");
    el.playerName.focus();
  }
});

// ===== Supabase load
await leaderboard.ping();
await leaderboard.fetchTop();

// ===== Overlay actions
function closeOverlay(){ el.overlay.classList.remove("show"); }
el.btnCloseOverlay.addEventListener("click", closeOverlay);

el.btnPlayAgain.addEventListener("click", async () => {
  closeOverlay();
  game.reset();
  game.start();
});

el.btnSubmit.addEventListener("click", async () => {
  const snap = game.getSnapshot();
  if(!snap.gameOver){
    alert("게임 오버 후 등록할 수 있어요!");
    return;
  }

  el.btnSubmit.disabled = true;
  try{
    await leaderboard.submit({
      name: el.playerName.value,
      score: snap.score,
      lines: snap.lines,
      level: snap.level
    });
    await leaderboard.fetchTop();
    alert("등록 완료! 🏆");
    closeOverlay();
  }catch(e){
    alert("등록 실패: " + (e?.message || e));
  }finally{
    el.btnSubmit.disabled = false;
  }
});

// ===== Buttons
el.btnStart.addEventListener("click", () => { game.resumeAudio(); game.start(); });
el.btnPause.addEventListener("click", () => { game.resumeAudio(); game.togglePause(); });
el.btnRestart.addEventListener("click", () => { game.resumeAudio(); closeOverlay(); game.reset(); game.start(); });

el.btnSound.addEventListener("click", () => {
  sfxOn = !sfxOn;
  game.setSfx(sfxOn);
  el.btnSound.textContent = sfxOn ? "🔊 사운드: 켬" : "🔇 사운드: 끔";
});

el.btnShake.addEventListener("click", () => {
  shakeOn = !shakeOn;
  game.setShake(shakeOn);
  el.btnShake.textContent = shakeOn ? "✨ 이펙트: 켬" : "🧊 이펙트: 끔";
});

// ===== Keyboard
window.addEventListener("keydown", (e) => {
  const k = e.key;

  if(["ArrowLeft","ArrowRight","ArrowDown","ArrowUp"," ","p","P","c","C"].includes(k)) e.preventDefault();
  game.resumeAudio();

  if(k === "p" || k === "P"){ game.togglePause(); return; }
  if(k === "c" || k === "C"){ game.hold(); return; }
  if(k === "ArrowLeft"){ game.move(-1); game.keyDown("ArrowLeft"); }
  if(k === "ArrowRight"){ game.move(1); game.keyDown("ArrowRight"); }
  if(k === "ArrowUp"){ game.rotate(); }
  if(k === "ArrowDown"){ game.keyDown("ArrowDown"); }
  if(k === " "){ game.hardDrop(); }
}, { passive:false });

window.addEventListener("keyup", (e) => {
  if(e.key === "ArrowLeft") game.keyUp("ArrowLeft");
  if(e.key === "ArrowRight") game.keyUp("ArrowRight");
  if(e.key === "ArrowDown") game.keyUp("ArrowDown");
});

// ===== Mobile pad
document.querySelectorAll("[data-pad]").forEach(btn => {
  const action = btn.getAttribute("data-pad");

  const doAction = () => {
    game.resumeAudio();
    if(action === "left") game.move(-1);
    if(action === "right") game.move(1);
    if(action === "down") game.softDrop();
    if(action === "rotate") game.rotate();
    if(action === "drop") game.hardDrop();
    if(action === "hold") game.hold();
    if(action === "pause") game.togglePause();
  };

  // tap
  btn.addEventListener("click", doAction);

  // hold repeats for left/right/down
  let t = null;
  const isRepeat = (action === "left" || action === "right" || action === "down");
  if(isRepeat){
    btn.addEventListener("touchstart", (e)=>{
      e.preventDefault();
      doAction();
      t = setInterval(doAction, action==="down" ? 65 : 80);
    }, {passive:false});
    btn.addEventListener("touchend", ()=>{ if(t) clearInterval(t); t=null; });
    btn.addEventListener("touchcancel", ()=>{ if(t) clearInterval(t); t=null; });
  }
});

// 첫 실행: 대기 상태 렌더는 game.reset()에서 이미 완료
