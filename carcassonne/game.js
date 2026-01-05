import { db, initRoom } from "./firebase.js";
import { doc, onSnapshot, updateDoc } from
  "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");
const TILE = 80;

let roomRef;
let state;
let currentTile = { type: 1, rot: 0 };
let me = "A"; // 가족별로 A / B 수동 지정

// 타일 정의 (단순화)
const TILES = [
  ["field","field","field","field"],
  ["road","field","road","field"],
  ["city","road","city","road"]
];

function rotateEdges(edges, r) {
  let e = [...edges];
  for (let i=0;i<r;i++) e.unshift(e.pop());
  return e;
}

// 타일 그림 (제가 생성한 Canvas 스타일)
function drawTile(x,y,tile) {
  ctx.save();
  ctx.translate(x,y);
  ctx.fillStyle="#334155";
  ctx.fillRect(0,0,TILE,TILE);
  ctx.strokeStyle="#e5e7eb";
  ctx.strokeRect(0,0,TILE,TILE);

  const edges = rotateEdges(TILES[tile.type], tile.rot);
  ctx.strokeStyle="#22c55e";
  if (edges[0]==="road") ctx.beginPath(),ctx.moveTo(TILE/2,0),ctx.lineTo(TILE/2,TILE/2),ctx.stroke();
  if (edges[1]==="road") ctx.beginPath(),ctx.moveTo(TILE,TILE/2),ctx.lineTo(TILE/2,TILE/2),ctx.stroke();
  if (edges[2]==="road") ctx.beginPath(),ctx.moveTo(TILE/2,TILE),ctx.lineTo(TILE/2,TILE/2),ctx.stroke();
  if (edges[3]==="road") ctx.beginPath(),ctx.moveTo(0,TILE/2),ctx.lineTo(TILE/2,TILE/2),ctx.stroke();

  ctx.restore();
}

function render() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  for (const key in state.board) {
    const [x,y]=key.split(",").map(Number);
    drawTile(400+x*TILE,400+y*TILE,state.board[key]);
  }
}

canvas.onclick = async e => {
  if (state.turn !== me) return;

  const x = Math.floor((e.offsetX-400)/TILE);
  const y = Math.floor((e.offsetY-400)/TILE);
  const key = `${x},${y}`;
  if (state.board[key]) return;

  state.board[key] = currentTile;
  state.turn = me==="A"?"B":"A";
  state.scores[me]+=1;
  currentTile={ type:Math.floor(Math.random()*3), rot:0 };

  await updateDoc(roomRef,state);
};

window.rotateCurrent = ()=> currentTile.rot=(currentTile.rot+1)%4;

(async()=>{
  roomRef = await initRoom();
  onSnapshot(roomRef,snap=>{
    state=snap.data();
    document.getElementById("turn").textContent="턴: "+state.turn;
    document.getElementById("score").textContent=
      `A:${state.scores.A} / B:${state.scores.B}`;
    render();
  });
})();
