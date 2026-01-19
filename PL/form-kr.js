// form-kr.js
// 한국주식 폼: 입력 읽기/검증/초기화 + 계산 호출 전용
// (UI 렌더링은 results.js가 담당하는 구조를 추천)

import { toNum } from "./utils.js";
import { calcKR } from "./calc-kr.js";

export function createKrFormController({
  formEl,
  inputs,
  onResult,
  onError,
} = {}) {
  if (!formEl) throw new Error("formEl is required");
  if (!inputs) throw new Error("inputs is required");

  const read = () => {
    const buy = toNum(inputs.buyPrice.value);
    const qty = toNum(inputs.qty.value);
    const now = toNum(inputs.nowPrice.value);

    const feeBuy = toNum(inputs.feeBuy.value) || 0;
    const feeSell = toNum(inputs.feeSell.value) || 0;
    const taxSell = toNum(inputs.taxSell.value) || 0;

    return { buy, qty, now, feeBuy, feeSell, taxSell };
  };

  const validate = (v) => {
    if (!Number.isFinite(v.buy) || v.buy <= 0) return "매수단가를 확인해줘.";
    if (!Number.isFinite(v.qty) || v.qty <= 0) return "수량을 확인해줘.";
    if (!Number.isFinite(v.now) || v.now <= 0) return "현재가/매도단가를 확인해줘.";
    if (v.feeBuy < 0 || v.feeSell < 0 || v.taxSell < 0) return "수수료/세금은 0 이상이어야 해.";
    return null;
  };

  const reset = () => {
    inputs.buyPrice.value = "";
    inputs.qty.value = "";
    inputs.nowPrice.value = "";
    inputs.feeBuy.value = "";
    inputs.feeSell.value = "";
    inputs.taxSell.value = "";
  };

  const submit = () => {
    const v = read();
    const err = validate(v);
    if (err) {
      if (typeof onError === "function") onError(err);
      return null;
    }
    const result = calcKR(v);
    if (typeof onResult === "function") onResult(result);
    return result;
  };

  // Enter key: submit 방지(외부에서 계산 버튼을 누르거나, 여기 submit 호출)
  formEl.addEventListener("submit", (e) => e.preventDefault());

  return { read, validate, reset, submit };
}
