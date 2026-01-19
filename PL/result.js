// results.js
// 결과 렌더링 전용 (KR/US 공용)
// - 숫자 포맷(원/달러/퍼센트/부호) 통일
// - +/−에 따라 색상( CSS var: --ok / --bad ) 자동 적용
//
// 사용 예)
// import { createResultsRenderer } from "./results.js";
// const results = createResultsRenderer({ els: {...} });
// results.renderKR(result);
// results.renderUS(result);

export function createResultsRenderer({ els } = {}) {
  if (!els) throw new Error("els is required");

  /* ----------------------------- formatting ------------------------------ */
  const fmtNumber = (n, digits = 2) => {
    if (!Number.isFinite(n)) return "-";
    return new Intl.NumberFormat("ko-KR", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(n);
  };

  const fmtMoney = (n, currency) => {
    if (!Number.isFinite(n)) return "-";
    const isKRW = currency === "KRW";
    return (
      new Intl.NumberFormat("ko-KR", {
        minimumFractionDigits: isKRW ? 0 : 2,
        maximumFractionDigits: isKRW ? 0 : 2,
      }).format(n) + (isKRW ? "원" : " USD")
    );
  };

  const fmtSignedMoney = (n, currency) => {
    if (!Number.isFinite(n)) return "-";
    const sign = n > 0 ? "+" : n < 0 ? "-" : "";
    return sign + fmtMoney(Math.abs(n), currency);
  };

  const fmtSignedPct = (n) => {
    if (!Number.isFinite(n)) return "-";
    const sign = n > 0 ? "+" : n < 0 ? "-" : "";
    return sign + fmtNumber(Math.abs(n), 2) + "%";
  };

  const paint = (el, n) => {
    if (!el) return;
    el.style.color = "";
    if (!Number.isFinite(n)) return;
    if (n > 0) el.style.color = "var(--ok)";
    else if (n < 0) el.style.color = "var(--bad)";
  };

  const clearMain = () => {
    if (els.resultMeta) els.resultMeta.textContent = "입력 후 “계산하기”를 누르세요.";
    if (els.rTotal) els.rTotal.textContent = "-";
    if (els.rRate) els.rRate.textContent = "-";
    if (els.rAvg) els.rAvg.textContent = "-";
    if (els.rGross) els.rGross.textContent = "-";

    paint(els.rTotal, NaN);
    paint(els.rRate, NaN);
  };

  /* ------------------------------ renderers ------------------------------ */
  const renderKR = (r) => {
    if (!r) return;

    if (els.resultMeta) els.resultMeta.textContent = r.meta || "KR 결과";

    if (els.rTotal) {
      els.rTotal.textContent = fmtSignedMoney(r.pnlKRW, "KRW");
      paint(els.rTotal, r.pnlKRW);
    }

    if (els.rRate) {
      els.rRate.textContent = fmtSignedPct(r.ratePct);
      paint(els.rRate, r.ratePct);
    }

    if (els.rAvg) els.rAvg.textContent = fmtMoney(r.avgPrice, "KRW");
    if (els.rGross) els.rGross.textContent = fmtMoney(r.gross, "KRW");

    // US 전용 분해 영역 숨김
    if (els.usSplit) els.usSplit.hidden = true;
  };

  const renderUS = (r, opts = {}) => {
    if (!r) return;

    const { showUsdMain = false } = opts;

    if (els.resultMeta) els.resultMeta.textContent = r.meta || "US 결과";

    // 메인: 기본은 KRW 총손익, 옵션으로 USD 메인도 가능
    if (els.rTotal) {
      els.rTotal.textContent = showUsdMain
        ? fmtSignedMoney(r.pnlUSD, "USD")
        : fmtSignedMoney(r.pnlKRW, "KRW");
      paint(els.rTotal, showUsdMain ? r.pnlUSD : r.pnlKRW);
    }

    if (els.rRate) {
      els.rRate.textContent = showUsdMain ? fmtSignedPct(r.rateUSD) : fmtSignedPct(r.ratePct);
      paint(els.rRate, showUsdMain ? r.rateUSD : r.ratePct);
    }

    // 평균단가/총액은 원화 기준(직관), 필요하면 r.avgUSD도 같이 표시 가능
    if (els.rAvg) els.rAvg.textContent = fmtMoney(r.avgPrice, "KRW");
    if (els.r
