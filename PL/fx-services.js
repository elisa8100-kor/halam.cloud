// fx-service.js
// USD/KRW 환율 서비스 (현재환율 + 캐싱)
// - 기본 Provider: Frankfurter (키 없음)
// - localStorage 캐시 TTL 적용
//
// 사용 예)
// import { createFxService } from "./fx-service.js";
// const fx = createFxService({ provider: "frankfurter", cacheTtlMs: 30*60*1000 });
// const rate = await fx.getUsdKrwNow();

export function createFxService({
  provider = "frankfurter",   // "frankfurter" | "exchangerate_host"
  cacheKey = "fx_usdkrw_cache_v1",
  cacheTtlMs = 30 * 60 * 1000,
} = {}) {
  const readCache = () => {
    try {
      const raw = localStorage.getItem(cacheKey);
      if (!raw) return null;
      const obj = JSON.parse(raw);
      if (!obj || !Number.isFinite(obj.rate) || !Number.isFinite(obj.ts)) return null;
      if (Date.now() - obj.ts > cacheTtlMs) return null;
      return obj.rate;
    } catch {
      return null;
    }
  };

  const writeCache = (rate) => {
    try {
      localStorage.setItem(cacheKey, JSON.stringify({ rate, ts: Date.now() }));
    } catch {
      // ignore
    }
  };

  const fetchFrankfurter = async () => {
    const url = "https://api.frankfurter.dev/v1/latest?from=USD&to=KRW";
    const res = await fetch(url, { method: "GET" });
    if (!res.ok) throw new Error("FX fetch failed (frankfurter)");
    const data = await res.json();
    const rate = data?.rates?.KRW;
    if (!Number.isFinite(rate)) throw new Error("FX invalid (frankfurter)");
    return rate;
  };

  const fetchExchangeRateHost = async () => {
    // base=USD, symbols=KRW
    const url = "https://api.exchangerate.host/latest?base=USD&symbols=KRW";
    const res = await fetch(url, { method: "GET" });
    if (!res.ok) throw new Error("FX fetch failed (exchangerate.host)");
    const data = await res.json();
    const rate = data?.rates?.KRW;
    if (!Number.isFinite(rate)) throw new Error("FX invalid (exchangerate.host)");
    return rate;
  };

  const fetchNow = async () => {
    if (provider === "exchangerate_host") return fetchExchangeRateHost();
    return fetchFrankfurter();
  };

  const getUsdKrwNow = async () => {
    const cached = readCache();
    if (Number.isFinite(cached)) return cached;

    const rate = await fetchNow();
    writeCache(rate);
    return rate;
  };

  const clearCache = () => {
    try {
      localStorage.removeItem(cacheKey);
    } catch {
      // ignore
    }
  };

  return {
    getUsdKrwNow,
    clearCache,
  };
}
