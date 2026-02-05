export const W = 640, H = 720;
const clamp = (v,min,max)=>Math.max(min,Math.min(max,v));

export const STATE_MENU = 0, STATE_PLAY = 1, STATE_PAUSE = 2, STATE_GAMEOVER = 3;

export function createGame(canvas){
  const ctx = canvas.getContext('2d');

  class Game{
    constructor(){
      this.state = STATE_MENU;
      this.timeLimit = 30;
      this.highScore = Number(localStorage.getItem("wam_high_score") || 0);
      this.reset();
    }

    reset(){
      this.score = 0;
      this.combo = 0;
      this.maxCombo = 0;
      this.elapsed = 0;

      // ⬇️ 점수 감소 타이머
      this.decayTimer = 0;
    }

    update(dt){
      if(this.state !== STATE_PLAY) return;

      this.elapsed += dt;

      // ⬇️ 시간 경과 점수 감소 로직 (핵심)
      this.decayTimer += dt;
      if(this.decayTimer >= 1){
        this.decayTimer = 0;

        const progress = this.elapsed / this.timeLimit;
        const decay = 1 + Math.floor(progress * 2); // 1~3점

        this.score = Math.max(0, this.score - decay);
      }

      if(this.elapsed >= this.timeLimit){
        this.state = STATE_GAMEOVER;
        if(this.score > this.highScore){
          this.highScore = this.score;
          localStorage.setItem("wam_high_score", this.highScore);
        }
        if(this.onGameOver) this.onGameOver(this.score, this.maxCombo);
      }
    }
  }

  const game = new Game();
  let last = performance.now();
  let onGameOver = null;

  function loop(now){
    const dt = clamp((now - last) / 1000, 0, 0.05);
    last = now;
    game.update(dt);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  return {
    game,
    setOnGameOver(fn){ onGameOver = fn; }
  };
}
