// /js/storage.js
const HS_KEY = "wam_high_score_v1";

export function getHighScore() {
  return Number(localStorage.getItem(HS_KEY) || 0);
}

export function setHighScore(v) {
  localStorage.setItem(HS_KEY, String(Number(v) || 0));
}
