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

class Particle {
  constructor() { this.active = false; }
  init(x, y) {
    const ang = rand(0, TAU);
    const spd = rand(140, 320);
    this.x = x; this.y = y;
    this.vx = Math.cos(ang) * spd;
    this.vy = Math.sin(ang) * spd;
    this.life = rand(0.22, 0.38);
    this.maxLife = this.life;
    this.size = rand(2.0, 4.2);
    this.active = true;
  }
  update(dt) {
    if (!this.active) return;
    this.life -= dt;
    if (this.life <= 0) { this.active = false; return; }
    this.vx *= 0.92;
    this.vy = this.vy * 0.92 + 520 * dt; // 중력
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }
  draw(ctx) {
    if (!this.active) return;
    const k = clamp(this.life / this.maxLife, 0, 1);
    const r = Math.max(1, this.size * k);
    ctx.globalAlpha = k;
    ctx.beginPath();
    ctx.arc(this.x, this.y, r, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

class ParticlePool {
  constructor(cap = 240) {
    this.pool = Array.from({ length: cap }, () => new Particle());
    this.cursor = 0;
  }
  burst(x, y, count = 18) {
    for (let i = 0; i < count; i++) {
      const p = this.pool[this.cursor];
      this.cursor = (this.cursor + 1) % this.pool.length;
      p.init(x, y);
    }
  }
  update(dt) {
    for (const p of this.pool) p.update(dt);
  }
  draw(ctx) {
    for (const p of this.pool) p.draw(ctx);
  }
}

class Mole {
  constructor(cx, cy) {
    this.cx = cx;
    this.cy = cy;

    this.baseR = 36;
    this.appearDur = 0.18;
    this.visibleDur = 0.75;
    this.disappearDur = 0.14;

    this.state = "hidden";
    this.t = 0;
    this.hitOnce = false;

    this.hitPopT = 0; // 맞았을 때 순간 팝(스케일)
  }

  spawn(visibleSec) {
    this.state = "appearing";
    this.t = 0;
    this.hitOnce = false;
    this.visibleDur = visibleSec;
    this.hitPopT = 0;
  }

  isActive() { return this.state !== "hidden"; }
  isClickable() { return this.state === "appearing" || this.state === "visible"; }

  progress() {
    if (this.state === "appearing") return clamp(this.t / this.appearDur, 0, 1);
    if (this.state === "visible") return 1;
    if (this.state === "disappearing") return 1 - clamp(this.t / this.disappearDur, 0, 1);
    return 0;
  }

  currentRadius() {
    const p = this.progress();
    const k = 0.2 + 0.8 * p;
    const pop = this.hitPopT > 0 ? (1 + 0.22 * (this.hitPopT / 0.12)) : 1;
    return this.baseR * k * pop;
  }

  update(dt) {
    if (this.state === "hidden") return;

    this.t += dt;
    if (this.hitPopT > 0) this.hitPopT = Math.max(0, this.hitPopT - dt);

    if (this.state === "appearing" && this.t >= this.appearDur) {
      this.state = "visible"; this.t = 0;
    } else if (this.state === "visible" && this.t >= this.visibleDur) {
      this.state = "disappearing"; this.t = 0;
    } else if (this.state === "disappearing" && this.t >= this.disappearDur) {
      this.state = "hidden"; this.t = 0;
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
    this.hitPopT = 0.12;
    this.state = "disappearing";
    this.t = 0;
    return true;
  }

  draw(ctx) {
    if (!this.isActive()) return;

    const p = this.progress();
    const r = this.currentRadius();

    const lift = (1 - p) * 22;
    const cy = this.cy + lift;

    ctx.fillStyle = COLORS.MOLE_SHADOW;
    ctx.beginPath();
    ctx.arc(this.cx, cy + 4, r, 0, TAU);
    ctx.fill();

    ctx.fillStyle = COLORS.MOLE;
    ctx.beginPath();
    ctx.arc(this.cx, cy, r, 0, TAU);
    ctx.fill();

    const eyeR = Math.max(2, r * 0.12);
    const eyeY = cy - r * 0.18;
    const eyeXOff = r * 0.33;
    ctx.fillStyle = "#171717";
    ctx.beginPath();
    ctx.arc(this.cx - eyeXOff, eyeY, eyeR, 0, TAU);
    ctx.arc(this.cx + eyeXOff, eyeY, eyeR, 0, TAU);
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,.65)";
    ctx.beginPath();
    ctx.arc(this.cx - eyeXOff + eyeR * 0.25, eyeY - eyeR * 0.25, Math.max(1, eyeR * 0.35), 0, TAU);
    ctx.arc(this.cx + eyeXOff + eyeR * 0.25, eyeY - eyeR * 0.25, Math.max(1, eyeR * 0.35), 0, TAU);
    ctx.fill();

    const noseR = Math.max(3, r * 0.16);
    ctx.fillStyle = "#ffb2b2";
    ctx.beginPath();
    ctx.arc(this.cx, cy + r * 0.02, noseR, 0, TAU);
    ctx.fill();

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

  // ✅ 9개 구멍(3x3)
  const holes = [];
  const marginX = 90;
  const startY = 190;
  const gapX = (W - marginX * 2) / 2;
  const gapY = 135;
  for (let gy = 0; gy < 3; gy++) {
    for (let gx = 0; gx < 3; gx++) {
      holes.push({ x: marginX + gx * gapX, y: startY + gy * gapY });
    }
  }

  const moles = holes.map(h => new Mole(h.x, h.y));
  const particles = new ParticlePool(260);

  let state = "menu";
  let score = 0;
  let combo = 0;
  let maxCombo = 0;
  let elapsed = 0;

  const timeLimit = 30;
  let highScore = getHighScore();

  let spawnTimer = 0;
  let spawnInterval = 0.95;
  let visibleSec = 0.80;

  const pointer = { x: 0, y: 0, just: false, isTouch: false };

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
    pointer.just = true;
    if (state === "menu") start();
  }, { passive: false });

  window.addEventListener("keydown", (e) => {
    if (e.code === "Space" && state === "menu") start();
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
      m.hitPopT = 0;
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
    spawnInterval = Math.max(0.32, 0.95 - 0.62 * p);
    visibleSec = Math.max(0.26, 0.80 - 0.44 * p);
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

        // ✅ 작은 폭죽(파티클) 느낌
        particles.burst(m.cx, m.cy - 10, 20);
        break;
      }
    }

    if (!hit) {
      score = Math.max(0, score - 5);
      combo = 0;
    }
  }

  function drawBackground() {
    ctx.fillStyle = COLORS.BG;
    ctx.fillRect(0, 0, W, H);

    for (const h of holes) {
      ctx.fillStyle = "rgba(0,0,0,.35)";
      ctx.beginPath();
      ctx.ellipse(h.x, h.y + 10, 54, 22, 0, 0, TAU);
      ctx.fill();

      ctx.fillStyle = COLORS.HOLE;
      ctx.beginPath();
      ctx.ellipse(h.x, h.y + 8, 50, 20, 0, 0, TAU);
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

      particles.update(dt);

      if (elapsed >= timeLimit) gameOver();
    } else {
      particles.update(dt);
    }

    pointer.just = false;

    drawBackground();
    for (const m of moles) m.draw(ctx);

    // 폭죽 색상 (파츠 draw에서 ctx.fillStyle을 바꾸기 때문에, 여기서 다시 지정)
    ctx.fillStyle = COLORS.ACCENT;
    particles.draw(ctx);

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
