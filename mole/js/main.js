import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";
import { startGame } from "./game.js";
import { loadLeaderboard } from "./leaderboard.js";

export const supabase = createClient(
  "https://oykepnxnbyltcvcqnfbe.supabase.co",
  "sb_publishable_85W1hHMVmhILGBbrX-l4wg_qmLCn987"
);

startGame();
loadLeaderboard();
