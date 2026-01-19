// calc-us.js
// 미국주식 단일 포지션(단일 매수 기준) 손익 계산
// - USD 기준 손익 + KRW 환산 손익(매수환율/매도환율 분리)
// - 주가손익/환차손익(원화) 분해 값 제공
//
// 입력:
//  buyUSD, qty, nowUSD
//  feeBuyUSD, feeSellUSD
//  fxBuy, fxSell
//  unrealized (평가손익 모드 여부: fxSell을 '현재환율'로 해석)
//
// 출력은 results.js에서 쓰기 좋은 필드명으로 반환

export function calcUS({
  buyUSD,       // 매수단가 (USD)
  qty,          // 수량
  nowUSD,       // 현재가/매도단가 (USD)
  feeBuyUSD = 0,// 매수 수수료 (USD)
  feeSellUSD = 0,// 매도 수수료 (USD)
  fxBuy,        // 매수환율 (KRW/USD)
  fxSell,       // 매도환율 or 현재환율 (KRW/USD)
  unrealized = false,
} = {}) {
  // ---------- USD 기준 (수수료 포함) ----------
  const costUSD = (buyUSD * qty) + feeBuyUSD;
  const grossUSD = nowUSD * qty;           // 평가/매도 총액(수수료 전)
  const proceedsUSD = grossUSD - feeSellUSD;

  const pnlUSD = proceedsUSD - costUSD;
  const rateUSD = (pnlUSD / costUSD) * 100;
  const avgUSD = costUSD / qty;

  // ---------- KRW 기준 (환율 분리) ----------
  // 매수원가(원화) = USD 원가 * 매수환율
  const costKRW = costUSD * fxBuy;

  // 매도/평가금액(원화) = USD proceeds * 매도/현재환율
  const proceedsKRW = proceedsUSD * fxSell;

  const pnlKRW = proceedsKRW - costKRW;
  const ratePct = (pnlKRW / costKRW) * 100;

  // "원화 기준 평균단가"는 매수환율을 기준으로 보는 게 일반적
  const avgPrice = costKRW / qty;

  // ---------- 손익 분해 (원화) ----------
  // 1) 주가손익: 가격 변화만 반영(환율은 매수환율로 고정)
  //   (nowUSD - buyUSD) * qty * fxBuy
  const pricePnLKRW = (nowUSD - buyUSD) * qty * fxBuy;

  // 2) 환차손익: 환율 변화만 반영(평가/매도 규모 기준)
  //   (fxSell - fxBuy) * (nowUSD * qty)
  //   * 참고: 이 분해는 "수수료/비용 영향"은 별도로 빠짐
  const fxPnLKRW = (fxSell - fxBuy) * (nowUSD * qty);

  // 메타 정보(옵션)
  const meta = `US · 수량 ${qty}주 · 매수환율 ${fxBuy.toFixed(2)} / ${
    unrealized ? "현재환율" : "매도환율"
  } ${fxSell.toFixed(2)}`;

  return {
    // main
    pnlKRW,
    ratePct,
    avgPrice,   // KRW 기준 평단
    gross: proceedsKRW, // KRW 기준(매도수수료 반영 후) 금액

    // USD reference
    pnlUSD,
    rateUSD,
    avgUSD,
    grossUSD: proceedsUSD, // USD 기준(매도수수료 반영 후) 금액

    // split
    pricePnLKRW,
    fxPnLKRW,

    // useful debug/extra
    costUSD,
    proceedsUSD,
    costKRW,
    proceedsKRW,
    unrealized,
    meta,
  };
}
