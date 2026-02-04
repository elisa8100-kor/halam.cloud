import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { db, LB_COLLECTION } from "./firebase.js";

const boardBody = document.getElementById('board-body');
const LB_CACHE_KEY = "wam_leaderboard_cache_v1";

function escapeHTML(s){
  return String(s).replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));
}

function formatDateFromFirestore(createdAt){
  try{
    if(createdAt && typeof createdAt.toDate === "function"){
      return createdAt.toDate().toLocaleDateString('ko-KR');
    }
    return new Date(createdAt).toLocaleDateString('ko-KR');
  }catch{
    return "-";
  }
}

function renderBoard(rows){
  if(!rows || rows.length===0){
    boardBody.innerHTML = `<tr><td colspan="5">아직 등록된 점수가 없습니다.</td></tr>`;
    return;
  }
  boardBody.innerHTML = rows.slice(0,10).map((r,i)=>{
    const safeName = escapeHTML(r.name);
    const score = Number(r.score)||0;
    const maxCombo = Number(r.maxCombo)||0;
    const when = formatDateFromFirestore(r.createdAt);
    return `<tr>
      <td>${i+1}</td>
      <td>${safeName}</td>
      <td>${score}</td>
      <td>${maxCombo}</td>
      <td>${when}</td>
    </tr>`;
  }).join("");
}

export async function getTop10(){
  const q = query(
    collection(db, LB_COLLECTION),
    orderBy("score", "desc"),
    limit(10)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function refreshLeaderboard(showToast){
  try{
    const data = await getTop10();
    renderBoard(data);
    localStorage.setItem(LB_CACHE_KEY, JSON.stringify({ at:Date.now(), data }));
  }catch{
    const cached = localStorage.getItem(LB_CACHE_KEY);
    if(cached){
      try{
        const obj = JSON.parse(cached);
        renderBoard(obj.data);
        if(showToast) showToast("리더보드 네트워크가 불안정합니다. 최근 캐시를 표시합니다.");
        return;
      }catch{}
    }
    boardBody.innerHTML = `<tr><td colspan="5">리더보드를 불러오지 못했습니다.</td></tr>`;
  }
}

export async function qualifiesTop10(score, maxCombo){
  const rows = await getTop10();
  if(rows.length < 10) return { qualifies:true, cutoffScore: 0 };

  const last = rows[rows.length - 1];
  const cutoff = Number(last.score) || 0;
  const lastCombo = Number(last.maxCombo) || 0;

  const qualifies = (score > cutoff) || (score === cutoff && maxCombo > lastCombo);
  return { qualifies, cutoffScore: cutoff };
}

export function normalizeNickname(name){
  return name.trim().replace(/\s+/g, " ");
}

export function validateNickname(name){
  return /^[\p{L}0-9 _-]{2,12}$/u.test(name);
}

export async function saveScore(name, score, maxCombo){
  await addDoc(collection(db, LB_COLLECTION), {
    name,
    score: Number(score) || 0,
    maxCombo: Number(maxCombo) || 0,
    createdAt: serverTimestamp()
  });
}
