const SUPABASE_URL = "https://oykepnxnbyltcvcqnfbe.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_85W1hHMVmhILGBbrX-l4wg_qmLCn987";

const boardBody = document.getElementById("board-body");

const LB_CACHE_KEY = "wam_leaderboard_cache_v3";
const CACHE_TTL_MS = 2 * 60 * 1000;
const SUBMIT_COOLDOWN_MS = 15 * 1000;
const LAST_SUBMIT_KEY = "wam_last_submit_at_v1";

function escapeHTML(s) {
  return String(s).replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[m]));
}

function formatDate(createdAt) {
  try { return new Date(createdAt).toLocaleDateString("ko-KR"); }
  catch { return "-"; }
}

function renderBoard(rows) {
  if (!rows || rows.length === 0) {
    boardBody.innerHTML = `<tr><td colspan="5">아직 등록된 점수가 없습니다.</td></tr>`;
    return;
  }
  boardBody.innerHTML = rows.slice(0, 10).map((r, i) => {
    const safeName = escapeHTML(r.name ?? "");
    const score = Number(r.score) || 0;
    const maxCombo = Number(r.max_combo) || 0;
    const when = formatDate(r.created_at);
    return `<tr>
      <td>${i + 1}</td>
      <td>${safeName}</td>
      <td>${score}</td>
      <td>${maxCombo}</td>
      <td>${when}</td>
    </tr>`;
  }).join("");
}

async function supabaseFetch(path, { method = "GET", body = null, headers = {} } = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      ...headers,
    },
    body: body ? JSON.stringify(body) : null,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }

  if (res.status === 204) return null;

  const text = await res.text().catch(() => "");
  if (!text) return null;

  try { return JSON.parse(text); }
  catch { return null; }
}

export async function getTop10() {
  return supabaseFetch(
    `leaderboard?select=name,score,max_combo,created_at&order=score.desc,max_combo.desc,created_at.asc&limit=10`
  );
}

export async function refreshLeaderboard(showToast) {
  try {
    const cached = localStorage.getItem(LB_CACHE_KEY);
    if (cached) {
      try {
        const obj = JSON.parse(cached);
        if (obj?.at && Date.now() - obj.at < CACHE_TTL_MS && Array.isArray(obj.data)) {
          renderBoard(obj.data);
          return;
        }
      } catch {}
    }

    const data = await getTop10();
    renderBoard(data);
    localStorage.setItem(LB_CACHE_KEY, JSON.stringify({ at: Date.now(), data }));
  } catch {
    const cached = localStorage.getItem(LB_CACHE_KEY);
    if (cached) {
      try {
        const obj = JSON.parse(cached);
        renderBoard(obj.data);
        showToast?.("리더보드 네트워크가 불안정합니다. 최근 캐시를 표시합니다.");
        return;
      } catch {}
    }
    boardBody.innerHTML = `<tr><td colspan="5">리더보드를 불러오지 못했습니다.</td></tr>`;
  }
}

export async function qualifiesTop10(score, maxCombo) {
  const rows = await getTop10();
  if (rows.length < 10) return { qualifies: true, cutoffScore: 0 };

  const last = rows[rows.length - 1];
  const cutoff = Number(last.score) || 0;
  const lastCombo = Number(last.max_combo) || 0;

  const qualifies = (score > cutoff) || (score === cutoff && maxCombo > lastCombo);
  return { qualifies, cutoffScore: cutoff };
}

export function normalizeNickname(name) {
  return String(name ?? "").trim().replace(/\s+/g, " ");
}

export function validateNickname(name) {
  return /^[\p{L}0-9 _-]{2,12}$/u.test(name);
}

function canSubmitNow() {
  const lastAt = Number(localStorage.getItem(LAST_SUBMIT_KEY) || 0);
  return !lastAt || (Date.now() - lastAt) >= SUBMIT_COOLDOWN_MS;
}

function markSubmitted() {
  localStorage.setItem(LAST_SUBMIT_KEY, String(Date.now()));
}

export async function saveScore(name, score, maxCombo) {
  const s = Number(score) || 0;
  const c = Number(maxCombo) || 0;

  if (!canSubmitNow()) throw new Error("잠시만요! 너무 빠르게 연속 등록 중입니다.");
  if (!validateNickname(name)) throw new Error("닉네임 형식이 올바르지 않습니다.");
  if (!(s >= 0 && s <= 999999)) throw new Error("점수 값이 비정상입니다.");
  if (!(c >= 0 && c <= 999999)) throw new Error("콤보 값이 비정상입니다.");

  await supabaseFetch("leaderboard", {
    method: "POST",
    body: { name, score: s, max_combo: c },
  });

  markSubmitted();
  localStorage.removeItem(LB_CACHE_KEY);
}
