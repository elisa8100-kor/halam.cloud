console.log("JS LOADED");

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const status = document.getElementById("status");

// 배경
ctx.fillStyle = "#111";
ctx.fillRect(0, 0, canvas.width, canvas.height);

// 테스트 블록
ctx.fillStyle = "#00ffd5";
ctx.fillRect(80, 100, 140, 140);

// 텍스트
ctx.fillStyle = "#ffffff";
ctx.font = "20px system-ui";
ctx.fillText("TETRIS READY", 60, 280);

status.textContent = "ALL SYSTEMS OK";
