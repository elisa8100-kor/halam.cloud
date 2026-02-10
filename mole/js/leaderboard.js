import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY"
);

export async function saveScore(name, score) {
  const { error } = await supabase
    .from("leaderboard")
    .insert([{ nickname: name, score }]);

  return !error;
}

export async function loadLeaderboard() {
  const list = document.getElementById("rankList");
  list.innerHTML = "";

  const { data } = await supabase
    .from("leaderboard")
    .select("*")
    .order("score", { ascending: false })
    .limit(20);

  data.forEach((row, i) => {
    const li = document.createElement("li");
    li.textContent = `${i + 1}위 - ${row.nickname} (${row.score})`;
    list.appendChild(li);
  });
}
