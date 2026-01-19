// calc-kr.js
// 한국주식 단일 포지션(단일 매수 기준) 손익 계산
// - 입력은 "금액(원)" 기준 수수료/세금 직접 입력 방식
// - 출력은 results.js에서 렌더링하기 좋은 형태로 반환

export function calcKR({
  buy,      // 매수단가 (KRW)
  qty,      // 수량
  now,      // 현재가/매도단가 (KRW)
  feeBuy=0, // 매수 수수료 (KRW)
  feeSell=0,// 매도 수수료 (KRW)
  taxSell=0 // 매도 세금 (KRW)
} = {}) {
  // 매수원가(수수료 포함)
  const cost = (buy * qty) + feeBuy;

  // 평가/매도금액(매도 비용 반영)
  const grossSell = now * qty;
  const proceeds = grossSell - feeSell - taxSell;

  // 손익/수익률
  const pnlKRW = proceeds - cost;
  const ratePct = (pnlKRW / cost) * 100;

  // 평균단가(수수료 포함 평단)
  const avgPrice = cost / qty;

  return {
    pnlKRW,
    ratePct,
    avgPrice,
    gross: grossSell,
    proceeds,   // 매도비용 반영 후 금액(원)
    cost,       // 매수원가(원)
  };
}
