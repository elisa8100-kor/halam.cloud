const SUPABASE_URL = "https://oykepnxnbyltcvcqnfbe.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_85W1hHMVmhILGBbrX-l4wg_qmLCn987";

const boardBody = document.getElementById('board-body');
const LB_CACHE_KEY = "wam_leaderboard_cache_v1";

function escapeHTML(s){
  return String(s).replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));
}

function formatDate(createdAt){
  try{
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
    const maxCombo = Number(r.max_combo)||0;
    const when = formatDate(r.created_at);
    return `<tr>
      <td>${i+1}</td>
      <td>${safeName}</td>
      <td>${score}</td>
      <td>${maxCombo}</td>
      <td>${when}</td>
    </tr>`;
  }).join("");
}

async function supabaseFetch(path, { method="GET", body=null } = {}){
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : null
  });

  if(!res.ok){
    const text = await res.text().catch(()=> "");
    throw new Error(text || `HTTP ${res.status}`);
  }

  if(res.status === 204) return null;
  return res.json();
}

export async function getTop10(){
  return supabaseFetch(
    `leaderboard?select=name,score,max_combo,created_at&order=score.desc,max_combo.desc,created_at.asc&limit=10`
  );
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
  const lastCombo = Number(last.max_combo) || 0;

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
  await supabaseFetch("leaderboard", {
    method: "POST",
    body: {
      name,
      score: Number(score) || 0,
      max_combo: Number(maxCombo) || 0
    }
  });
}
