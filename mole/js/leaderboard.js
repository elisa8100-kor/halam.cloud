import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://YOUR_PROJECT_ID.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_PUBLIC_ANON_KEY";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const TABLE = "leaderboard";
const LIMIT = 10;

export function normalizeNickname(name){
  return name.trim().slice(0, 10);
}

export function validateNickname(name){
  return /^[a-zA-Z0-9가-힣]{2,10}$/.test(name);
}

export async function refreshLeaderboard(showToast){
  const { data, error } = await supabase
    .from(TABLE)
    .select("name, score, max_combo")
    .order("score", { ascending: false })
    .order("max_combo", { ascending: false })
    .limit(LIMIT);

  if(error){
    if(showToast) showToast("랭킹 불러오기 실패");
    return;
  }

  const list = document.getElementById("leaderboard");
  list.innerHTML = "";

  if(data.length === 0){
    list.innerHTML = "<li>아직 랭킹이 없습니다</li>";
    return;
  }

  data.forEach((row, i)=>{
    const li = document.createElement("li");
    li.textContent = `${i+1}. ${row.name} — ${row.score}점 (콤보 ${row.max_combo})`;
    list.appendChild(li);
  });
}

export async function qualifiesTop10(score, maxCombo){
  const { data, error } = await supabase
    .from(TABLE)
    .select("score, max_combo")
    .order("score", { ascending: false })
    .order("max_combo", { ascending: false })
    .limit(LIMIT);

  if(error) return { qualifies: false };

  if(data.length < LIMIT) return { qualifies: true };

  const last = data[data.length - 1];
  if(score > last.score) return { qualifies: true };
  if(score === last.score && maxCombo > last.max_combo) return { qualifies: true };

  return { qualifies: false };
}

export async function saveScore(name, score, maxCombo){
  const { error } = await supabase
    .from(TABLE)
    .insert([{
      name,
      score,
      max_combo: maxCombo
    }]);

  if(error) throw error;
}
