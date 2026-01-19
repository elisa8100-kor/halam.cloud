// form-us.js
// 미국주식 폼: 입력 읽기/검증/초기화 + 계산 호출 + 환율 버튼 핸들
// (UI 렌더링은 results.js가 담당하는 구조 추천)

import { toNum } from "./utils.js";
import { calcUS } from "./calc-us.js";
import { createFxService } from "./fx-service.js";

export function createUsFormController({
  formEl,
  inputs,
  fxButtons,
  onResult,
  onError,
  onInfo,
  fxOptions, // { provider: "frankfurter", cacheTtlMs: 1800000 }
} = {}) {
  if (!formEl) throw new Error("formEl is required");
  if (!inputs) throw new Error("inputs is required");

  const fx = createFxService(fxOptions);

  const read = () => {
    const buyUSD = toNum(inputs.buyPrice.value);
    const qty = toNum(inputs.qty.value);
    const nowUSD = toNum(inputs.nowPrice.value);

    const feeBuyUSD = toNum(inputs.feeBuy.value) || 0;
    const feeSellUSD = toNum(inputs.feeSell.value) || 0;

    const fxBuy = toNum(inputs.fxBuy.value);
    const fxSell = toNum(inputs.fxSell.value);

    const unrealized = !!inputs.isUnrealized.checked;

    return {
      buyUSD,
      qty,
      nowUSD,
      feeBuyUSD,
      feeSellUSD,
      fxBuy,
      fxSell,
      unrealized,
    };
  };

  const validate = (v) => {
    if (!Number.isFinite(v.buyUSD) || v.buyUSD <= 0) return "매수단가(USD)를 확인해줘.";
    if (!Number.isFinite(v.qty) || v.qty <= 0) return "수량을 확인해줘.";
    if (!Number.isFinite(v.nowUSD) || v.nowUSD <= 0) return "현재가/매도단가(USD)를 확인해줘.";
    if (!Number.isFinite(v.fxBuy) || v.fxBuy <= 0) return "매수환율을 확인해줘.";
    if (!Number.isFinite(v.fxSell) || v.fxSell <= 0) return v.unrealized ? "현재환율을 확인해줘." : "매도환율을 확인해줘.";
    if (v.feeBuyUSD < 0 || v.feeSellUSD < 0) return "수수료는 0 이상이어야 해.";
    return null;
  };

  const reset = () => {
    inputs.buyPrice.value = "";
    inputs.qty.value = "";
    inputs.nowPrice.value = "";
    inputs.feeBuy.value = "";
    inputs.feeSell.value = "";
    inputs.fxBuy.value = "";
    inputs.fxSell.value = "";
    inputs.isUnrealized.checked = false;

    // 라벨 원복(외부에서 안 해도 되게)
    const fxSellLabel = formEl.querySelector('label[for="usFxSell"]');
    if (fxSellLabel) fxSellLabel.textContent = "매도환율 (KRW/USD)";
  };

  const submit = () => {
    const v = read();
    const err = validate(v);
    if (err) {
      if (typeof onError === "function") onError(err);
      return null;
    }
    const result = calcUS(v);
    if (typeof onResult === "function") onResult(result);
    return result;
  };

  // --- FX actions ---
  const fillFxBuy = async () => {
    try {
      const rate = await fx.getUsdKrwNow();
      inputs.fxBuy.value = rate.toFixed(2);
      if (typeof onInfo === "function") onInfo(`매수환율 반영: ${rate.toFixed(2)}`);
    } catch {
      if (typeof onError === "function") onError("환율 불러오기 실패. 직접 입력해줘.");
    }
  };

  const fillFxSell = async () => {
    try {
      const rate = await fx.getUsdKrwNow();
      inputs.fxSell.value = rate.toFixed(2);
      const label = inputs.isUnrealized.checked ? "현재환율" : "매도환율";
      if (typeof onInfo === "function") onInfo(`${label} 반영: ${rate.toFixed(2)}`);
    } catch {
      if (typeof onError === "function") onError("환율 불러오기 실패. 직접 입력해줘.");
    }
  };

  const bindFxButtons = () => {
    if (fxButtons?.buyBtn) fxButtons.buyBtn.addEventListener("click", (e) => { e.preventDefault(); fillFxBuy(); });
    if (fxButtons?.sellBtn) fxButtons.sellBtn.addEventListener("click", (e) => { e.preventDefault(); fillFxSell(); });
  };

  // “평가손익” 체크 시 라벨 변경
  const bindUnrealizedToggle = () => {
    if (!inputs.isUnrealized) return;
    inputs.isUnrealized.addEventListener("change", () => {
      const fxSellLabel = formEl.querySelector('label[for="usFxSell"]');
      if (!fxSellLabel) return;
      fxSellLabel.textContent = `${inputs.isUnrealized.checked ? "현재환율" : "매도환율"} (KRW/USD)`;
      if (typeof onInfo === "function") {
        onInfo(inputs.isUnrealized.checked ? "평가손익 모드: 매도환율 칸을 현재환율로 사용" : "실현손익 모드: 매도환율 사용");
      }
    });
  };

  // Enter submit 방지
  formEl.addEventListener("submit", (e) => e.preventDefault());

  bindFxButtons();
  bindUnrealizedToggle();

  return {
    read,
    validate,
    reset,
    submit,
    fillFxBuy,
    fillFxSell,
  };
}
