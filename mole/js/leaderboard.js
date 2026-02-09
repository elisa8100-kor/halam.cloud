import { supabase } from "./main.js";

export async function loadLeaderboard() {
  const box = document.getElementById("leaderboard");

  const { data, error } = await supabase
    .from("leaderboard")
    .select("*")
    .order("score", { ascending: false })
    .limit(10);

  if (error) {
    box.textContent = "불러오기 실패";
    return;
  }

  if (!data.length) {
    box.textContent = "아직 기록이 없습니다.";
    return;
  }

  box.innerHTML = data
    .map((r, i) => `${i + 1}. ${r.name} - ${r.score}`)
    .join("<br>");
}
