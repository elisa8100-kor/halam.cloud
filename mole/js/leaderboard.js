import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  "https://oykepnxnbyltcvcqnfbe.supabase.co",
  "sb_publishable_85W1hHMVmhILGBbrX-l4wg_qmLCn987"
);

export async function refreshLeaderboard(){
  const ul = document.getElementById("leaderboard");
  ul.innerHTML = "";

  const { data } = await supabase
    .from("leaderboard")
    .select("*")
    .order("score", { ascending:false })
    .limit(10);

  data?.forEach(row=>{
    const li = document.createElement("li");
    li.textContent = `${row.name} - ${row.score}`;
    ul.appendChild(li);
  });
}

export async function saveScore(name, score, max_combo){
  await supabase.from("leaderboard")
    .insert([{ name, score, max_combo }]);
}

export function qualifiesTop10(){
  return { qualifies:true };
}

export function normalizeNickname(n){ return n.trim(); }
export function validateNickname(n){ return n.length >= 2; }
