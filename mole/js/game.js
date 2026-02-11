// /js/game.js
import { getHighScore, setHighScore } from "./storage.js";

const W = 640, H = 720;
const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand = (a, b) => Math.random() * (b - a) + a;

function getCSS(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}
const COLORS = {
  BG: getCSS("--bg", "#0b0f1a"),
  HOLE: getCSS("--hole", "#0c1020"),
  MOLE: getCSS("--mole", "#d25f5f"),
  MOLE_SHADOW: getCSS("--mole-shadow", "#7b3535"),
  HUD: getCSS("--hud", "#eaf0ff"),
  RED: getCSS("--red", "#ff6b6b"),
  ACCENT: getCSS("--accent", "#ffd974"),
};

function font(px) {
  return `${px}px system-ui,-apple-system,"Pretendard","Malgun Gothic",sans-serif`;
}

class Mole {
  constructor(cx, cy) {
    this.cx = cx;
    this.cy = cy;

    this.baseR = 40;
    this.appearDur = 0.18;
    this.visibleDur = 0.75;
    this.disappearDur = 0.14;

    this.state = "hidden"; // hidden | appearing | visible | disappearing
    this.t = 0;
    this.hitOnce = false;
  }

  spawn(visibleSec) {
    this.state = "appearing";
    this.t = 0;
    this.hitOnce = false;
    this.visibleDur = visibleSec;
  }

  isActive() {
    return this.state !== "hidden";
  }

  isClickable() {
    return this.state === "appearing" || this.state === "visible";
  }

  progress() {
    if (this.state === "appearing") return clamp(this.t / this.appearDur, 0, 1);
    if (this.state === "visible") return 1;
    if (this.state === "disappearing") return 1 - clamp(this.t / this.disappearDur, 0, 1);
    return 0;
  }

  currentRadius() {
    const p = this.progress();
    // "점점 커지며 올라옴" 느낌: 초반 0.2 -> 1.0
    const k = 0.2 + 0.8 * p;
    return this.baseR * k;
  }

  update(dt) {
    if (this.state === "hidden") return;
    this.t += dt;

    if (this.state === "appearing" && this.t >= this.appearDur) {
      this.state = "visible";
      this.t = 0;
    } else if (this.state === "visible" && this.t >= this.visibleDur) {
      this.state = "disappearing";
      this.t = 0;
    } else if (this.state === "disappearing" && this.t >= this.disappearDur) {
      this.state = "hidden";
      this.t = 0;
    }
  }

  contains(x, y, touchBonus = 1.0) {
    const r = this.currentRadius() * 0.95 * touchBonus;
    const dx = x - this.cx;
    const dy = y - this.cy;
    return dx * dx + dy * dy <= r * r;
  }

  hit() {
    if (!this.isClickable() || this.hitOnce) return false;
    this.hitOnce = true;
    this.state = "disappearing";
    this.t = 0;
    return true;
  }

  draw(ctx) {
    if (!this.isActive()) return;

    const p = this.progress();
    const r = this.currentRadius();

    // 구멍에서 올라오는 느낌: p가 낮을수록 아래로 살짝 깔림
    const lift = (1 - p) * 26;
    const cy = this.cy + lift;

    // 그림자
    ctx.fillStyle = COLORS.MOLE_SHADOW;
    ctx.beginPath();
    ctx.arc(this.cx, cy + 4, r, 0, TAU);
    ctx.fill();

    // 몸통
    ctx.fillStyle = COLORS.MOLE;
    ctx.beginPath();
    ctx.arc(this.cx, cy, r, 0, TAU);
    ctx.fill();

    // ===== 파츠(눈/코/입) 개별 드로잉 =====
    // 눈 (2개)
    const eyeR = Math.max(2, r * 0.12);
    const eyeY = cy - r * 0.18;
    const eyeXOff = r * 0.33;
    ctx.fillStyle = "#171717";
    ctx.beginPath();
    ctx.arc(this.cx - eyeXOff, eyeY, eyeR, 0, TAU);
    ctx.arc(this.cx + eyeXOff, eyeY, eyeR, 0, TAU);
    ctx.fill();

    // 눈 하이라이트
    ctx.fillStyle = "rgba(255,255,255,.65)";
    ctx.beginPath();
    ctx.arc(this.cx - eyeXOff + eyeR * 0.25, eyeY - eyeR * 0.25, Math.max(1, eyeR * 0.35), 0, TAU);
    ctx.arc(this.cx + eyeXOff + eyeR * 0.25, eyeY - eyeR * 0.25, Math.max(1, eyeR * 0.35), 0, TAU);
    ctx.fill();

    // 코
    const noseR = Math.max(3, r * 0.16);
    ctx.fillStyle = "#ffb2b2";
    ctx.beginPath();
    ctx.arc(this.cx, cy + r * 0.02, noseR, 0, TAU);
    ctx.fill();

    // 입 (작은 곡선)
    ctx.strokeStyle = "rgba(0,0,0,.55)";
    ctx.lineWidth = Math.max(2, r * 0.06);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(this.cx - r * 0.10, cy + r * 0.20, r * 0.18, 0.15 * TAU, 0.45 * TAU);
    ctx.arc(this.cx + r * 0.10, cy + r * 0.20, r * 0.18, 0.55 * TAU, 0.85 * TAU);
    ctx.stroke();
  }
}

export function createGame(canvas, {
  onGameOver = () => {},
  toast = () => {}
} = {}) {
  const ctx = canvas.getContext("2d", { alpha: false });

  // DPR 세팅
  let DPR = 1;
  function setupCanvas() {
    DPR = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.imageSmoothingEnabled = true;
  }
  setupCanvas();
  window.addEventListener("resize", setupCanvas, { passive: true });

  // 구멍 좌표(2x3)
  const holes = [
    { x: 180, y: 260 },
    { x: 320, y: 240 },
    { x: 460, y: 260 },
    { x: 180, y: 430 },
    { x: 320, y: 410 },
    { x: 460, y: 430 },
  ];

  const moles = holes.map(h => new Mole(h.x, h.y));

  // 상태
  let state = "menu"; // menu | play | pause | over
  let score = 0;
  let combo = 0;
  let maxCombo = 0;
  let elapsed = 0;

  const timeLimit = 30;
  let highScore = getHighScore();

  // 난이도
  let spawnTimer = 0;
  let spawnInterval = 0.95;
  let visibleSec = 0.80;

  // 입력
  const pointer = { x: 0, y: 0, down: false, just: false, isTouch: false };
  function updatePointer(e) {
    const rect = canvas.getBoundingClientRect();
    const sx = rect.width / W;
    const sy = rect.height / H;
    pointer.x = (e.clientX - rect.left) / sx;
    pointer.y = (e.clientY - rect.top) / sy;
  }

  canvas.addEventListener("pointermove", (e) => updatePointer(e), { passive: true });
  canvas.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    pointer.isTouch = (e.pointerType === "touch");
    canvas.setPointerCapture?.(e.pointerId);
    updatePointer(e);
    pointer.down = true;
    pointer.just = true;

    if (state === "menu") start();
  }, { passive: false });

  // 키
  window.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
      if (state === "menu") start();
    }
    if (e.code === "KeyP") {
      if (state === "play") pause();
      else if (state === "pause") resume();
    }
    if (e.code === "KeyR") {
      if (state === "play" || state === "pause" || state === "over") restart();
    }
  });

  function reset() {
    score = 0;
    combo = 0;
    maxCombo = 0;
    elapsed = 0;

    spawnTimer = 0;
    spawnInterval = 0.95;
    visibleSec = 0.80;

    for (const m of moles) {
      m.state = "hidden";
      m.t = 0;
      m.hitOnce = false;
    }
  }

  function start() {
    reset();
    state = "play";
    toast("시작!");
  }

  function pause() {
    if (state !== "play") return;
    state = "pause";
    toast("일시정지");
  }

  function resume() {
    if (state !== "pause") return;
    state = "play";
    toast("재개");
  }

  function restart() {
    reset();
    state = "play";
    toast("재시작");
  }

  function gameOver() {
    state = "over";
    if (score > highScore) {
      highScore = score;
      setHighScore(highScore);
    }
    onGameOver(score, maxCombo);
  }

  function difficultyUpdate() {
    const p = clamp(elapsed / timeLimit, 0, 1);
    // 시간이 갈수록: 더 자주 나오고, 더 빨리 사라짐
    spawnInterval = Math.max(0.35, 0.95 - 0.60 * p);
    visibleSec = Math.max(0.28, 0.80 - 0.40 * p);
  }

  function spawnOne() {
    const hidden = moles.filter(m => m.state === "hidden");
    if (!hidden.length) return;
    hidden[(Math.random() * hidden.length) | 0].spawn(visibleSec);
  }

  function handleHit() {
    let hit = false;
    const touchBonus = pointer.isTouch ? 1.15 : 1.0;

    for (const m of moles) {
      if (m.contains(pointer.x, pointer.y, touchBonus) && m.hit()) {
        hit = true;
        combo += 1;
        maxCombo = Math.max(maxCombo, combo);
        const gain = 10 + (combo - 1) * 2;
        score += gain;
        break;
      }
    }

    if (!hit) {
      // 미스
      score = Math.max(0, score - 5);
      combo = 0;
    }
  }

  function drawBackground() {
    ctx.fillStyle = COLORS.BG;
    ctx.fillRect(0, 0, W, H);

    // 구멍
    for (const h of holes) {
      ctx.fillStyle = "rgba(0,0,0,.35)";
      ctx.beginPath();
      ctx.ellipse(h.x, h.y + 10, 58, 24, 0, 0, TAU);
      ctx.fill();

      ctx.fillStyle = COLORS.HOLE;
      ctx.beginPath();
      ctx.ellipse(h.x, h.y + 8, 54, 22, 0, 0, TAU);
      ctx.fill();
    }
  }

  function drawHUD() {
    ctx.textBaseline = "middle";
    ctx.font = font(24);
    ctx.fillStyle = COLORS.HUD;
    ctx.textAlign = "left";
    ctx.fillText(`점수: ${score}`, 18, 34);
    ctx.fillText(`콤보: ${combo}`, 18, 64);

    ctx.textAlign = "right";
    const remain = Math.max(0, Math.ceil(timeLimit - elapsed));
    ctx.fillText(`남은 시간: ${remain}`, W - 18, 34);
    ctx.fillText(`최대 점수: ${highScore}`, W - 18, 64);
  }

  function drawCenterText(title, sub) {
    ctx.fillStyle = "rgba(0,0,0,.45)";
    ctx.fillRect(0, 0, W, H);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.font = font(56);
    ctx.fillStyle = COLORS.HUD;
    ctx.fillText(title, W / 2, H / 2 - 40);

    ctx.font = font(22);
    ctx.fillStyle = "rgba(234,240,255,.75)";
    ctx.fillText(sub, W / 2, H / 2 + 28);
  }

  let last = performance.now();
  function loop(now) {
    const dt = clamp((now - last) / 1000, 0, 0.05);
    last = now;

    if (state === "play") {
      elapsed += dt;
      difficultyUpdate();

      spawnTimer += dt;
      while (spawnTimer >= spawnInterval) {
        spawnTimer -= spawnInterval;
        spawnOne();
      }

      for (const m of moles) m.update(dt);

      if (pointer.just) handleHit();

      if (elapsed >= timeLimit) gameOver();
    }

    pointer.just = false;

    // draw
    drawBackground();
    for (const m of moles) m.draw(ctx);
    drawHUD();

    if (state === "menu") {
      drawCenterText("두더지 잡기", "Space 또는 시작 버튼으로 시작");
    } else if (state === "pause") {
      drawCenterText("일시정지", "P 또는 일시정지 버튼으로 재개");
    } else if (state === "over") {
      drawCenterText("게임 오버", "R 또는 재시작 버튼으로 다시 시작");
      ctx.font = font(28);
      ctx.fillStyle = COLORS.ACCENT;
      ctx.textAlign = "center";
      ctx.fillText(`최종 점수: ${score}  |  최대 콤보: ${maxCombo}`, W / 2, H / 2 + 78);
    }

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  return {
    start, pause, resume, restart,
    getState: () => state,
    getScore: () => score,
    getMaxCombo: () => maxCombo,
  };
}
