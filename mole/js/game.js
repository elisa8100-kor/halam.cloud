export const STATE_MENU = 0;
export const STATE_PLAY = 1;
export const STATE_PAUSE = 2;
export const STATE_GAMEOVER = 3;

export function createGame(canvas){
  const ctx = canvas.getContext("2d");
  const game = {
    state: STATE_MENU,
    score: 0,
    maxCombo: 0
  };

  function draw(){
    ctx.clearRect(0,0,400,400);
    ctx.fillStyle = "white";
    ctx.fillText("점수: " + game.score, 10, 20);
  }

  function loop(){
    if(game.state === STATE_PLAY){
      draw();
    }
    requestAnimationFrame(loop);
  }

  loop();

  return {
    game,
    setTopHint(){},
    setOnGameOver(cb){
      game._onGameOver = cb;
    }
  };
}
