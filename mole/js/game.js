export function createGame(canvas){
  const ctx = canvas.getContext("2d");

  let score = 0;
  let elapsed = 0;
  let onGameOver = null;

  function update(dt){
    elapsed += dt;
    score += 1;

    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle="#fff";
    ctx.font="24px sans-serif";
    ctx.fillText(`Score: ${score}`, 20, 40);

    if(elapsed > 10){
      if(onGameOver) onGameOver(score, 0);
      elapsed = -999;
    }
  }

  let last = performance.now();
  function loop(now){
    const dt = (now-last)/1000;
    last = now;
    update(dt);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  return {
    setOnGameOver(fn){ onGameOver = fn; }
  };
}
