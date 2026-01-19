// app.js
(() => {
  "use strict";

  /* ----------------------------- DOM helpers ----------------------------- */
  const $ = (sel) => document.querySelector(sel);

  const els = {
    // home cards
    cardKR: $("#cardKR"),
    cardUS: $("#cardUS"),

    // modals
    backdrop: $("#modalBackdrop"),
    calcModal: $("#calcModal"),
    aboutModal: $("#aboutModal"),
    btnCloseModal: $("#btnCloseModal"),
    btnOpenAbout: $("#btnOpenAbout"),
    btnCloseAbout: $("#btnCloseAbout"),

    // modal header labels
    modalKicker: $("#modalKicker"),
    modalTitle: $("#modalTitle"),

    // tabs/forms
    tabKR: $("#tabKR"),
    tabUS: $("#tabUS"),
    formKR: $("#formKR"),
    formUS: $("#formUS"),

    // KR inputs
    krBuyPrice: $("#krBuyPrice"),
    krQty: $("#krQty"),
    krNowPrice: $("#krNowPrice"),
    krFeeBuy: $("#krFeeBuy"),
    krFeeSell: $("#krFeeSell"),
    krTaxSell: $("#krTaxSell"),
    krReset: $("#krReset"),
    krCalc: $("#krCalc"),

    // US inputs
    usBuyPrice: $("#usBuyPrice"),
    usQty: $("#usQty"),
    usNowPrice: $("#usNowPrice"),
    usFeeBuy: $("#usFeeBuy"),
    usFeeSell: $("#usFeeSell"),
    usFxBuy: $("#usFxBuy"),
    usFxSell: $("#usFxSell"),
    usIsUnrealized: $("#usIsUnrealized"),
    btnFxBuy: $("#btnFxBuy"),
    btnFxSell: $("#btnFxSell"),
    usReset: $("#usReset"),
    usCalc: $("#usCalc"),

    // results
    resultMeta: $("#resultMeta"),
    rTotal: $("#rTotal"),
    rRate: $("#rRate"),
    rAvg: $("#rAvg"),
    rGross: $("#rGross"),

    usSplit: $("#usSplit"),
    rPricePnL: $("#rPricePnL"),
    rFxPnL: $("#rFxPnL"),
    rUsdPnL: $("#rUsdPnL"),

    toast: $("#toast"),
  };

  const state = {
    market: "KR", // KR | US
    lastFx: { rate: null, ts: 0 },
  };

  /* ----------------------------- formatting ------------------------------ */
  const toNum = (v) => {
    if (v === null || v === undefined) return NaN;
    const s = String(v).replace(/,/g, "").trim();
    if (s === "") return NaN;
    const n = Number(s);
    return Number.isFinite(n) ? n : NaN;
  };

  const fmtMoney = (n, currency = "KRW") => {
    if (!Number.isFinite(n)) return "-";
    const isKRW = currency === "KRW";
    const opts = {
      maximumFractionDigits: isKRW ? 0 : 2,
      minimumFractionDigits: isKRW ? 0 : 2,
    };
    return new Intl.NumberFormat("ko-KR", opts).format(n) + (isKRW ? "원" : " USD");
  };

  const fmtNumber = (n, digits = 2) => {
    if (!Number.isFinite(n)) return "-";
    return new Intl.NumberFormat("ko-KR", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(n);
  };

  const fmtSigned = (n, currency = "KRW") => {
    if (!Number.isFinite(n)) return "-";
    const sign = n > 0 ? "+" : n < 0 ? "-" : "";
    const abs = Math.abs(n);
    const base = currency === "KRW" ? fmtMoney(abs, "KRW") : fmtMoney(abs, "USD");
    return sign + base;
  };

  const setValueWithSignStyle = (el, n) => {
    el.textContent = n === undefined ? "-" : el.textContent;
    el.style.color = "";
    if (!Number.isFinite(n)) return;
    if (n > 0) el.style.color = "var(--ok)";
    if (n < 0) el.style.color = "var(--bad)";
  };

  /* ------------------------------- toast --------------------------------- */
  let toastTimer = null;
  const showToast = (msg) => {
    if (!els.toast) return;
    els.toast.hidden = false;
    els.toast.textContent = msg;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      els.toast.hidden = true;
      els.toast.textContent = "";
    }, 2200);
  };

  /* ------------------------------- modal --------------------------------- */
  const openBackdrop = () => {
    els.backdrop.hidden = false;
  };
  const closeBackdrop = () => {
    els.backdrop.hidden = true;
  };

  const openModal = (modalEl) => {
    openBackdrop();
    modalEl.hidden = false;
    document.body.style.overflow = "hidden";
  };

  const closeModal = (modalEl) => {
    modalEl.hidden = true;
    document.body.style.overflow = "";
    if (els.calcModal.hidden && els.aboutModal.hidden) closeBackdrop();
  };

  const closeAll = () => {
    closeModal(els.calcModal);
    closeModal(els.aboutModal);
  };

  /* ------------------------------- tabs ---------------------------------- */
  const setMarket = (m) => {
    state.market = m;

    const isKR = m === "KR";
    els.tabKR.setAttribute("aria-selected", String(isKR));
    els.tabUS.setAttribute("aria-selected", String(!isKR));

    els.formKR.classList.toggle("is-active", isKR);
    els.formUS.classList.toggle("is-active", !isKR);

    // header texts
    els.modalKicker.textContent = isKR ? "🇰🇷 한국주식" : "🇺🇸 미국주식";
    els.modalTitle.textContent = isKR ? "한국주식 P/L 계산기" : "미국주식 P/L 계산기";

    // US split visibility
    els.usSplit.hidden = isKR;

    // meta line reset
    els.resultMeta.textContent = "입력 후 “계산하기”를 누르세요.";
  };

  /* -------------------------- calculation logic -------------------------- */
  const calcKR = () => {
    const buy = toNum(els.krBuyPrice.value);
    const qty = toNum(els.krQty.value);
    const now = toNum(els.krNowPrice.value);

    const feeBuy = toNum(els.krFeeBuy.value) || 0;
    const feeSell = toNum(els.krFeeSell.value) || 0;
    const taxSell = toNum(els.krTaxSell.value) || 0;

    if (!Number.isFinite(buy) || !Number.isFinite(qty) || !Number.isFinite(now) || qty <= 0) {
      showToast("한국주식: 매수단가/수량/현재가를 확인해줘.");
      return null;
    }

    const grossSell = now * qty; // 평가금액/매도금액
    const cost = buy * qty + feeBuy;
    const proceeds = grossSell - feeSell - taxSell;

    const pnl = proceeds - cost;
    const rate = (pnl / cost) * 100;
    const avg = cost / qty;

    return {
      pnlKRW: pnl,
      ratePct: rate,
      avgPrice: avg,
      gross: grossSell,
      meta: `KR · 수량 ${fmtNumber(qty, 0)}주`,
    };
  };

  const calcUS = () => {
    const buyUSD = toNum(els.usBuyPrice.value);
    const qty = toNum(els.usQty.value);
    const nowUSD = toNum(els.usNowPrice.value);

    const feeBuyUSD = toNum(els.usFeeBuy.value) || 0;
    const feeSellUSD = toNum(els.usFeeSell.value) || 0;

    const fxBuy = toNum(els.usFxBuy.value);
    const fxSell = toNum(els.usFxSell.value);

    const unrealized = els.usIsUnrealized.checked;

    if (
      !Number.isFinite(buyUSD) ||
      !Number.isFinite(qty) ||
      !Number.isFinite(nowUSD) ||
      qty <= 0 ||
      !Number.isFinite(fxBuy) ||
      !Number.isFinite(fxSell) ||
      fxBuy <= 0 ||
      fxSell <= 0
    ) {
      showToast("미국주식: 단가/수량/환율(매수·매도)을 확인해줘.");
      return null;
    }

    // USD 기준 (수수료 반영)
    const costUSD = buyUSD * qty + feeBuyUSD;
    const grossUSD = nowUSD * qty;
    const proceedsUSD = grossUSD - feeSellUSD;
    const pnlUSD = proceedsUSD - costUSD;
    const rateUSD = (pnlUSD / costUSD) * 100;
    const avgUSD = costUSD / qty;

    // KRW 기준 (매수/매도 환율 분리)
    const costKRW = costUSD * fxBuy;
    const proceedsKRW = proceedsUSD * fxSell;
    const pnlKRW = proceedsKRW - costKRW;
    const rateKRW = (pnlKRW / costKRW) * 100;
    const avgKRW = costKRW / qty;

    // P/L 분해(원화)
    // 주가손익: (매도단가 - 매수단가) * qty * 매수환율 (가격 변화만)
    const pricePnLKRW = (nowUSD - buyUSD) * qty * fxBuy;

    // 환차손익: (매도환율 - 매수환율) * (매도금액USD) (환율 변화만, 매도규모 기준)
    const fxPnLKRW = (fxSell - fxBuy) * (nowUSD * qty);

    return {
      pnlKRW,
      ratePct: rateKRW,
      avgPrice: unrealized ? avgKRW : avgKRW, // 동일표시
      gross: proceedsKRW, // 원화 매도/평가금액(수수료 반영)
      pnlUSD,
      rateUSD,
      avgUSD,
      grossUSD: proceedsUSD,
      pricePnLKRW,
      fxPnLKRW,
      meta: `US · 수량 ${fmtNumber(qty, 0)}주 · 매수환율 ${fmtNumber(fxBuy, 2)} / ${
        unrealized ? "현재환율" : "매도환율"
      } ${fmtNumber(fxSell, 2)}`,
    };
  };

  /* ----------------------------- result view ----------------------------- */
  const renderKR = (r) => {
    els.resultMeta.textContent = r.meta;

    els.rTotal.textContent = fmtSigned(r.pnlKRW, "KRW");
    setValueWithSignStyle(els.rTotal, r.pnlKRW);

    els.rRate.textContent = `${fmtSigned(r.ratePct, "USD").replace(" USD", "")}%`;
    setValueWithSignStyle(els.rRate, r.ratePct);

    els.rAvg.textContent = fmtMoney(r.avgPrice, "KRW");
    els.rGross.textContent = fmtMoney(r.gross, "KRW");

    // US split off
    els.usSplit.hidden = true;
  };

  const renderUS = (r) => {
    els.resultMeta.textContent = r.meta;

    // main shows KRW total (원화가 주 사용자 기준)
    els.rTotal.textContent = fmtSigned(r.pnlKRW, "KRW");
    setValueWithSignStyle(els.rTotal, r.pnlKRW);

    els.rRate.textContent = `${fmtSigned(r.ratePct, "USD").replace(" USD", "")}%`;
    setValueWithSignStyle(els.rRate, r.ratePct);

    // average and gross: show KRW (원화 환산)
    els.rAvg.textContent = fmtMoney(r.avgPrice, "KRW");
    els.rGross.textContent = fmtMoney(r.gross, "KRW");

    // split
    els.usSplit.hidden = false;
    els.rPricePnL.textContent = fmtSigned(r.pricePnLKRW, "KRW");
    setValueWithSignStyle(els.rPricePnL, r.pricePnLKRW);

    els.rFxPnL.textContent = fmtSigned(r.fxPnLKRW, "KRW");
    setValueWithSignStyle(els.rFxPnL, r.fxPnLKRW);

    els.rUsdPnL.textContent = fmtSigned(r.pnlUSD, "USD");
    setValueWithSignStyle(els.rUsdPnL, r.pnlUSD);
  };

  /* ------------------------------ FX fetch ------------------------------- */
  // 캐싱: 30분
  const FX_TTL_MS = 30 * 60 * 1000;

  const getCachedFx = () => {
    try {
      const raw = localStorage.getItem("fx_usdkrw_cache");
      if (!raw) return null;
      const obj = JSON.parse(raw);
      if (!obj || !obj.rate || !obj.ts) return null;
      if (Date.now() - obj.ts > FX_TTL_MS) return null;
      return obj.rate;
    } catch {
      return null;
    }
  };

  const setCachedFx = (rate) => {
    try {
      localStorage.setItem("fx_usdkrw_cache", JSON.stringify({ rate, ts: Date.now() }));
    } catch {
      // ignore
    }
  };

  // Frankfurter (무료, 키 없음)
  const fetchUsdKrw = async () => {
    const cached = getCachedFx();
    if (Number.isFinite(cached)) return cached;

    const url = "https://api.frankfurter.dev/v1/latest?from=USD&to=KRW";
    const res = await fetch(url, { method: "GET" });
    if (!res.ok) throw new Error("FX fetch failed");
    const data = await res.json();
    const rate = data?.rates?.KRW;
    if (!Number.isFinite(rate)) throw new Error("FX invalid");
    setCachedFx(rate);
    return rate;
  };

  const fillFx = async (target) => {
    try {
      const rate = await fetchUsdKrw();
      const v = fmtNumber(rate, 2);
      if (target === "BUY") els.usFxBuy.value = v;
      if (target === "SELL") els.usFxSell.value = v;
      showToast(`환율 반영 완료: ${v}`);
    } catch {
      showToast("환율 불러오기 실패. 직접 입력해줘.");
    }
  };

  /* ----------------------------- reset forms ----------------------------- */
  const resetKR = () => {
    els.krBuyPrice.value = "";
    els.krQty.value = "";
    els.krNowPrice.value = "";
    els.krFeeBuy.value = "";
    els.krFeeSell.value = "";
    els.krTaxSell.value = "";
    els.resultMeta.textContent = "입력 후 “계산하기”를 누르세요.";
    els.rTotal.textContent = els.rRate.textContent = els.rAvg.textContent = els.rGross.textContent = "-";
    els.usSplit.hidden = true;
    showToast("한국주식 입력을 초기화했어.");
  };

  const resetUS = () => {
    els.usBuyPrice.value = "";
    els.usQty.value = "";
    els.usNowPrice.value = "";
    els.usFeeBuy.value = "";
    els.usFeeSell.value = "";
    els.usFxBuy.value = "";
    els.usFxSell.value = "";
    els.usIsUnrealized.checked = false;
    els.resultMeta.textContent = "입력 후 “계산하기”를 누르세요.";
    els.rTotal.textContent = els.rRate.textContent = els.rAvg.textContent = els.rGross.textContent = "-";
    els.usSplit.hidden = false;
    els.rPricePnL.textContent = els.rFxPnL.textContent = els.rUsdPnL.textContent = "-";
    showToast("미국주식 입력을 초기화했어.");
  };

  /* ------------------------------- events -------------------------------- */
  const bindEvents = () => {
    // open calculator by cards
    els.cardKR.addEventListener("click", () => {
      openModal(els.calcModal);
      setMarket("KR");
      els.krBuyPrice.focus();
    });

    els.cardUS.addEventListener("click", () => {
      openModal(els.calcModal);
      setMarket("US");
      els.usBuyPrice.focus();
    });

    // tabs
    els.tabKR.addEventListener("click", () => setMarket("KR"));
    els.tabUS.addEventListener("click", () => setMarket("US"));

    // modal close
    els.btnCloseModal.addEventListener("click", () => closeModal(els.calcModal));
    els.backdrop.addEventListener("click", closeAll);

    // about modal
    els.btnOpenAbout.addEventListener("click", () => openModal(els.aboutModal));
    els.btnCloseAbout.addEventListener("click", () => closeModal(els.aboutModal));

    // esc to close
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeAll();
    });

    // KR calculate/reset
    els.krCalc.addEventListener("click", () => {
      const r = calcKR();
      if (r) renderKR(r);
    });
    els.krReset.addEventListener("click", resetKR);

    // US calculate/reset
    els.usCalc.addEventListener("click", () => {
      const r = calcUS();
      if (r) renderUS(r);
    });
    els.usReset.addEventListener("click", resetUS);

    // FX buttons
    els.btnFxBuy.addEventListener("click", () => fillFx("BUY"));
    els.btnFxSell.addEventListener("click", () => fillFx("SELL"));

    // unrealized toggle label behavior
    els.usIsUnrealized.addEventListener("change", () => {
      const label = els.usIsUnrealized.checked ? "현재환율" : "매도환율";
      const fxSellLabel = els.formUS.querySelector('label[for="usFxSell"]');
      if (fxSellLabel) fxSellLabel.textContent = `${label} (KRW/USD)`;
    });

    // Enter key => calculate (active form)
    document.addEventListener("submit", (e) => e.preventDefault());
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      if (els.calcModal.hidden) return;
      e.preventDefault();
      if (state.market === "KR") els.krCalc.click();
      else els.usCalc.click();
    });
  };

  /* ------------------------------- init ---------------------------------- */
  const init = () => {
    // default: keep forms hidden until market set when modal opens
    els.formKR.classList.remove("is-active");
    els.formUS.classList.remove("is-active");
    els.tabKR.setAttribute("aria-selected", "false");
    els.tabUS.setAttribute("aria-selected", "false");
    els.usSplit.hidden = true;

    bindEvents();
  };

  init();
})();
