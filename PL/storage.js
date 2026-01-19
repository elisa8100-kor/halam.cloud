// storage.js
// 로컬 저장소(localStorage) 래퍼
// - 폼 입력값 임시 저장/복원
// - 마지막 계산 결과 저장/복원
// - 키 네임스페이스로 충돌 방지
//
// 사용 예)
// import { createStorage } from "./storage.js";
// const store = createStorage({ namespace: "pl_calc_v1" });
// store.saveForm("KR", data); store.loadForm("KR");
// store.saveResult("US", result); store.loadResult("US");

export function createStorage({
  namespace = "pl_calc",
  version = 1,
} = {}) {
  const NS = `${namespace}@${version}`;

  const key = (k) => `${NS}:${k}`;

  const safeParse = (raw) => {
    try { return JSON.parse(raw); } catch { return null; }
  };

  const set = (k, v) => {
    try {
      localStorage.setItem(key(k), JSON.stringify(v));
      return true;
    } catch {
      return false;
    }
  };

  const get = (k, fallback = null) => {
    try {
      const raw = localStorage.getItem(key(k));
      if (!raw) return fallback;
      const v = safeParse(raw);
      return v ?? fallback;
    } catch {
      return fallback;
    }
  };

  const del = (k) => {
    try {
      localStorage.removeItem(key(k));
      return true;
    } catch {
      return false;
    }
  };

  /* --------------------------- Form persistence --------------------------- */
  // market: "KR" | "US"
  const saveForm = (market, data) => set(`form:${market}`, data);
  const loadForm = (market) => get(`form:${market}`, null);
  const clearForm = (market) => del(`form:${market}`);

  /* -------------------------- Result persistence -------------------------- */
  const saveResult = (market, result) => set(`result:${market}`, result);
  const loadResult = (market) => get(`result:${market}`, null);
  const clearResult = (market) => del(`result:${market}`);

  /* ------------------------------ Preferences ----------------------------- */
  // 예: US 결과 메인 통화, 환율 TTL 선택 등
  const savePref = (k, v) => set(`pref:${k}`, v);
  const loadPref = (k, fallback = null) => get(`pref:${k}`, fallback);
  const clearPref = (k) => del(`pref:${k}`);

  /* ------------------------------- Utilities ------------------------------ */
  const clearAll = () => {
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith(`${NS}:`))
        .forEach((k) => localStorage.removeItem(k));
      return true;
    } catch {
      return false;
    }
  };

  return {
    // raw
    set, get, del,

    // form
    saveForm, loadForm, clearForm,

    // result
    saveResult, loadResult, clearResult,

    // pref
    savePref, loadPref, clearPref,

    // util
    clearAll,
  };
}
