export const W = 640, H = 720;
const TAU = Math.PI * 2;
const clamp = (v,min,max)=>Math.max(min,Math.min(max,v));
const rand = (a,b)=>Math.random()*(b-a)+a;
const font = (px=28)=>`${px}px "Malgun Gothic","Apple SD Gothic Neo",system-ui,-apple-system,Segoe UI,Roboto,"Noto Sans KR",Arial,sans-serif`;

export const STATE_MENU = 0, STATE_PLAY = 1, STATE_PAUSE = 2, STATE_GAMEOVER = 3;

export function createGame(canvas){
  const ctx = canvas.getContext('2d', { alpha:false });

  let DPR = 1;
  function setupCanvas(){
    DPR = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.imageSmoothingEnabled = true;
  }
  setupCanvas();
  window.addEventListener('resize', setupCanvas, { passive:true });

  const COLORS = {
    BG: getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || "#121621",
    HOLE: getComputedStyle(document.documentElement).getPropertyValue('--hole').trim() || "#1e2332",
    MOLE: getComputedStyle(document.documentElement).getPropertyValue('--mole').trim() || "#d25f5f",
    MOLE_SHADOW: getComputedStyle(document.documentElement).getPropertyValue('--mole-shadow').trim() || "#783737",
    WHITE: "#ffffff",
    HUD: getComputedStyle(document.documentElement).getPropertyValue('--hud').trim() || "#eaeaf0",
    RED: getComputedStyle(document.documentElement).getPropertyValue('--red').trim() || "#e66e6e",
    ACCENT: getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || "#ffd974"
  };

  function drawTextCenter(text, size, color, cx, cy){
    ctx.font = font(size);
    ctx.fillStyle = color;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(text, cx, cy);
  }

  let pointer = { x:0, y:0, justPressed:false, isTouch:false };
  function updatePointer(e){
    const rect = canvas.getBoundingClientRect();
    const sx = rect.width / W;
    const sy = rect.height / H;
    pointer.x = (e.clientX - rect.left) / sx;
    pointer.y = (e.clientY - rect.top) / sy;
  }

  canvas.addEventListener('pointermove', (e)=>{ updatePointer(e); }, { passive:true });
  canvas.addEventListener('pointerdown', (e)=>{
    e.preventDefault();
    pointer.isTouch = (e.pointerType === "touch");
    canvas.setPointerCapture(e.pointerId);
    updatePointer(e);
    pointer.justPressed = true;

    if(game.state === STATE_MENU){
      topHint = "";
      game.reset();
      game.state = STATE_PLAY;
    }
  }, { passive:false });

  class Particle {
    constructor(){ this.active=false; }
    init(x,y,color){
      const ang = rand(0,TAU), spd = rand(2,6);
      this.x=x; this.y=y;
      this.vx=Math.cos(ang)*spd; this.vy=Math.sin(ang)*spd;
      this.life = rand(0.25, 0.45);
      this.color=color;
      this.size=rand(2,4);
      this.active=true;
    }
    update(dt){
      if(!this.active) return;
      this.x += this.vx; this.y += this.vy;
      this.vx *= 0.96; this.vy *= 0.96;
      this.life -= dt;
      if(this.life <= 0) this.active=false;
    }
    draw(c){
      if(!this.active) return;
      const r = Math.max(1, this.size * (this.life/0.45));
      c.fillStyle=this.color;
      c.beginPath(); c.arc(this.x, this.y, r, 0, TAU); c.fill();
    }
  }

  class ParticlePool {
    constructor(cap=240){
      this.pool = Array.from({length:cap}, ()=>new Particle());
      this.cursor = 0;
    }
    emit(x,y,color,count=18){
      for(let i=0;i<count;i++){
        const p = this.pool[this.cursor];
        this.cursor = (this.cursor + 1) % this.pool.length;
        p.init(x,y,color);
      }
    }
    update(dt){ for(const p of this.pool) p.update(dt); }
    draw(c){ for(const p of this.pool) p.draw(c); }
  }

  class FloatText {
    constructor(){ this.active=false; }
    init(x,y,text,color){
      this.x=x; this.y=y;
      this.text=text; this.color=color;
      this.life=0.8;
      this.vy=-40;
      this.active=true;
    }
    update(dt){
      if(!this.active) return;
      this.life -= dt;
      this.y += this.vy*dt;
      if(this.life<=0) this.active=false;
    }
    draw(c){
      if(!this.active) return;
      c.font = font(18);
      c.textAlign="center"; c.textBaseline="middle";
      c.fillStyle = this.color;
      c.globalAlpha = clamp(this.life/0.8, 0, 1);
      c.fillText(this.text, this.x, this.y);
      c.globalAlpha = 1;
    }
  }

  class FloatTextPool {
    constructor(cap=40){
      this.pool = Array.from({length:cap}, ()=>new FloatText());
      this.cursor = 0;
    }
    pop(x,y,text,color){
      const f = this.pool[this.cursor];
      this.cursor = (this.cursor + 1) % this.pool.length;
      f.init(x,y,text,color);
    }
    update(dt){ for(const f of this.pool) f.update(dt); }
    draw(c){ for(const f of this.pool) f.draw(c); }
  }

  class Mole {
    constructor(cx,cy){
      this.cx=cx; this.cy=cy;
      this.baseR=36;
      this.state="hidden";
      this.t=0;
      this.visibleDur=0.7;
      this.appearDur=0.16;
      this.disappearDur=0.13;
      this.wasHit=false;
    }
    spawn(visibleSeconds){
      this.state="appearing"; this.t=0; this.wasHit=false;
      this.visibleDur = Math.max(0.28, visibleSeconds);
    }
    isClickable(){ return this.state==="appearing" || this.state==="visible"; }
    currentRadius(){
      if(this.state==="appearing"){
        const k = clamp(this.t/this.appearDur,0,1);
        return this.baseR*(0.2+0.8*k);
      }
      if(this.state==="visible"){
        const pulse = 0.04*Math.sin(this.t*10);
        return this.baseR*(1+pulse);
      }
      if(this.state==="disappearing"){
        const k = 1 - clamp(this.t/this.disappearDur,0,1);
        return this.baseR*(0.2+0.8*k);
      }
      return this.baseR*0.2;
    }
    contains(x,y,isTouch){
      const r=this.currentRadius();
      const bonus = isTouch ? 1.15 : 1.0;
      const rr = (r*0.9*bonus);
      const dx=x-this.cx, dy=y-this.cy;
      return dx*dx+dy*dy <= rr*rr;
    }
    update(dt){
      if(this.state==="hidden") return;
      this.t += dt;

      if(this.state==="appearing" && this.t>=this.appearDur){
        this.state="visible"; this.t=0;
      } else if(this.state==="visible" && this.t>=this.visibleDur){
        this.state="disappearing"; this.t=0;
      } else if(this.state==="disappearing" && this.t>=this.disappearDur){
        this.state="hidden"; this.t=0;
      }
    }
    hit(){
      if(this.isClickable() && !this.wasHit){
        this.wasHit=true;
        this.state="disappearing"; this.t=0;
        return true;
      }
      return false;
    }
    drawMole(c){
      if(this.state==="hidden") return;
      const r=this.currentRadius();

      c.fillStyle="#783737";
      c.beginPath(); c.arc(this.cx,this.cy+3,r,0,TAU); c.fill();

      c.fillStyle="#d25f5f";
      c.beginPath(); c.arc(this.cx,this.cy,r,0,TAU); c.fill();

      const eyeR=Math.max(2, r/8);
      c.fillStyle="#1e1e1e";
      c.beginPath(); c.arc(this.cx-r/3,this.cy-r/5,eyeR,0,TAU); c.fill();
      c.beginPath(); c.arc(this.cx+r/3,this.cy-r/5,eyeR,0,TAU); c.fill();

      const noseR=Math.max(2, r/6);
      c.fillStyle="#ffaaaa";
      c.beginPath(); c.arc(this.cx,this.cy,noseR,0,TAU); c.fill();
    }
  }

  const bgCanvas = document.createElement('canvas');
  bgCanvas.width = W; bgCanvas.height = H;
  const bgCtx = bgCanvas.getContext('2d');

  function renderStaticBackground(holeCenters){
    bgCtx.fillStyle = COLORS.BG;
    bgCtx.fillRect(0,0,W,H);

    bgCtx.fillStyle = COLORS.HOLE;
    for(const [x,y] of holeCenters){
      const shadowR = 36*1.15;
      bgCtx.beginPath();
      bgCtx.arc(x,y,shadowR,0,TAU);
      bgCtx.fill();
    }
  }

  class Game {
    constructor(){
      this.state = STATE_MENU;
      this.timeLimit = 30;
      this.highScore = Number(localStorage.getItem("wam_high_score") || 0);
      this.shakeT = 0;
      this.shakePower = 0;
      this.reset();
    }

    reset(){
      const marginX=80, marginY=160;
      const gapX=((W-marginX*2)/2);
      const gapY=((H-marginY-120)/2);

      this.centers=[];
      for(let gy=0; gy<3; gy++){
        for(let gx=0; gx<3; gx++){
          this.centers.push([marginX+gx*gapX+40, marginY+gy*gapY+40]);
        }
      }

      this.moles = this.centers.map(([x,y])=>new Mole(x,y));
      renderStaticBackground(this.centers);

      this.score=0; this.combo=0; this.maxCombo=0;
      this.elapsed=0; this.spawnTimer=0;

      this.baseVisible = 0.80;
      this.visible = this.baseVisible;
      this.spawnInterval = 0.95;

      this.warmup = 4.0;

      this.particles = new ParticlePool(240);
      this.floatText = new FloatTextPool(42);
    }

    updateDifficulty(){
      const p = clamp(this.elapsed/this.timeLimit, 0, 1);
      const warm = clamp(this.elapsed/this.warmup, 0, 1);

      const targetVisible = Math.max(0.28, this.baseVisible - 0.38*p);
      const targetInterval = Math.max(0.35, 0.95 - 0.60*p);

      this.visible = this.baseVisible*(1-warm) + targetVisible*warm;
      this.spawnInterval = 1.05*(1-warm) + targetInterval*warm;
    }

    spawnLogic(){
      const hidden = this.moles.filter(m=>m.state==="hidden");
      if(hidden.length){
        hidden[(Math.random()*hidden.length)|0].spawn(this.visible);
      }
    }

    missFeedback(){
      this.shakeT = 0.12;
      this.shakePower = 6;
    }

    updateShake(dt){
      if(this.shakeT>0){
        this.shakeT -= dt;
        if(this.shakeT<=0){ this.shakeT=0; this.shakePower=0; }
      }
    }

    getShakeOffset(){
      if(this.shakeT<=0) return {x:0,y:0};
      const k = this.shakeT / 0.12;
      const amp = this.shakePower * k;
      return { x: rand(-amp, amp), y: rand(-amp, amp) };
    }
  }

  const game = new Game();
  let last = performance.now();
  let topHint = "";
  let onGameOver = null;

  function update(dt){
    if(game.state===STATE_PLAY){
      game.elapsed += dt;
      game.spawnTimer += dt;

      game.updateDifficulty();

      while(game.spawnTimer >= game.spawnInterval){
        game.spawnTimer -= game.spawnInterval;
        game.spawnLogic();
      }

      for(const m of game.moles) m.update(dt);

      if(pointer.justPressed){
        let hit=false;

        for(const m of game.moles){
          if(m.contains(pointer.x, pointer.y, pointer.isTouch) && m.hit()){
            hit=true;
            const gain = 10 + game.combo*2;
            game.score += gain;
            game.combo += 1;
            game.maxCombo = Math.max(game.maxCombo, game.combo);

            game.particles.emit(pointer.x, pointer.y, COLORS.ACCENT, 18);
            game.floatText.pop(pointer.x, pointer.y-10, `+${gain}`, COLORS.ACCENT);
            break;
          }
        }

        if(!hit){
          const prevCombo = game.combo;
          game.combo = 0;
          game.score = Math.max(0, game.score-5);
          game.missFeedback();
          game.floatText.pop(pointer.x, pointer.y-10, `MISS`, COLORS.RED);
          if(prevCombo >= 8 && window.__showToast) window.__showToast(`콤보 ${prevCombo}에서 끊겼습니다.`);
        }
      }

      game.particles.update(dt);
      game.floatText.update(dt);
      game.updateShake(dt);

      if(game.elapsed >= game.timeLimit){
        game.state = STATE_GAMEOVER;

        if(game.score > game.highScore){
          game.highScore = game.score;
          localStorage.setItem("wam_high_score", String(game.highScore));
        }

        if(onGameOver) onGameOver(game.score, game.maxCombo);
      }
    } else if(game.state===STATE_PAUSE){
      game.updateShake(dt);
    }

    pointer.justPressed = false;
  }

  function draw(){
    ctx.drawImage(bgCanvas, 0, 0);

    const shake = (game.state===STATE_PLAY) ? game.getShakeOffset() : {x:0,y:0};
    ctx.save();
    ctx.translate(shake.x, shake.y);

    for(const m of game.moles) m.drawMole(ctx);
    game.particles.draw(ctx);
    game.floatText.draw(ctx);

    ctx.restore();

    if(game.state===STATE_MENU){
      drawTextCenter("두더지 잡기 게임", 64, COLORS.WHITE, W/2, H/2-90);
      drawTextCenter("Space 또는 시작 버튼으로 시작", 28, COLORS.WHITE, W/2, H/2-20);
      drawTextCenter("모바일은 화면을 터치해도 시작됩니다", 22, COLORS.HUD, W/2, H/2+20);
      drawTextCenter(`최대 점수: ${game.highScore}`, 24, COLORS.HUD, W/2, H/2+78);

    } else if(game.state===STATE_PLAY || game.state===STATE_PAUSE){
      ctx.font = font(28);
      ctx.fillStyle = COLORS.WHITE;
      ctx.textAlign="left"; ctx.textBaseline="middle";
      ctx.fillText(`점수: ${game.score}`, 18, 36);
      ctx.fillText(`콤보: ${game.combo}`, 18, 68);

      const remain = Math.max(0, Math.ceil(game.timeLimit - game.elapsed));
      ctx.textAlign="right";
      ctx.fillText(`남은 시간: ${remain}`, W-18, 36);
      ctx.fillText(`최대 점수: ${game.highScore}`, W-18, 68);

      if(game.state===STATE_PAUSE){
        ctx.fillStyle = "rgba(0,0,0,.35)";
        ctx.fillRect(0,0,W,H);
        drawTextCenter("일시정지", 60, COLORS.WHITE, W/2, H/2-20);
        drawTextCenter("P 또는 일시정지 버튼으로 재개", 26, COLORS.HUD, W/2, H/2+40);
      }

    } else if(game.state===STATE_GAMEOVER){
      drawTextCenter("게임 오버", 64, COLORS.RED, W/2, H/2-70);
      drawTextCenter(`최종 점수: ${game.score}`, 40, COLORS.WHITE, W/2, H/2-5);
      drawTextCenter(`최대 점수: ${game.highScore}`, 30, COLORS.WHITE, W/2, H/2+45);
      drawTextCenter("R 또는 재시작 버튼으로 다시 시작", 26, COLORS.HUD, W/2, H/2+120);

      if(topHint){
        drawTextCenter(topHint, 20, COLORS.HUD, W/2, H/2+160);
      }
    }
  }

  function loop(now){
    const dt = clamp((now-last)/1000, 0, 0.05);
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  window.addEventListener('keydown', (e)=>{
    if(e.code==='Space' && game.state===STATE_MENU){
      topHint="";
      game.reset(); game.state=STATE_PLAY;
    } else if(e.code==='KeyR' && (game.state===STATE_GAMEOVER || game.state===STATE_PAUSE || game.state===STATE_PLAY)){
      topHint="";
      game.reset(); game.state=STATE_PLAY;
    } else if(e.code==='KeyP'){
      if(game.state===STATE_PLAY) game.state=STATE_PAUSE;
      else if(game.state===STATE_PAUSE) game.state=STATE_PLAY;
    }
  });

  return {
    game,
    setTopHint: (t)=>{ topHint = t || ""; },
    setOnGameOver: (fn)=>{ onGameOver = fn; }
  };
}


