// ====== 설정 ======
const FX_API = "https://api.frankfurter.dev/v1/latest"; // 키 없이 사용 가능 :contentReference[oaicite:2]{index=2}

// 주가/추천은 "프록시"가 있어야 브라우저에서 안전하게 가능 (CORS 이슈)
// Supabase Edge Function을 쓰면: MARKET_PROXY_BASE를 아래처럼 설정
// 예) const MARKET_PROXY_BASE = "https://<프로젝트>.supabase.co/functions/v1/marketdata";
const MARKET_PROXY_BASE = ""; // 비워두면: 수동 입력 모드

// ====== 상태 ======
let country = null; // "KR" | "US"
let mode = "unrealized"; // unrealized | realized
let fx = { usdkrw: null, date: null };

// ====== 엘리먼트 ======
const $ = (id) => document.getElementById(id);

const screenPick = $("screenPick");
const screenCalc = $("screenCalc");

const fxLabel = $("fxLabel");
const fxValue = $("fxValue");
const fxHint = $("fxHint");

const btnBack = $("btnBack");
const countryBadge = $("countryBadge");
const ccyBadge = $("ccyBadge");
const panelTitle = $("panelTitle");
const panelDesc = $("panelDesc");

const ticker = $("ticker");
const btnSearch = $("btnSearch");
const btnQuote = $("btnQuote");
const suggestBox = $("suggestBox");
const tickerHint = $("tickerHint");

const buyPrice = $("buyPrice");
const sellPrice = $("sellPrice");
const qty = $("qty");
const feePct = $("feePct");
const taxPct = $("taxPct");
const priceHint = $("priceHint");

const buyTotal = $("buyTotal");
const sellTotal = $("sellTotal");
const pnl = $("pnl");
const roi = $("roi");
const converted = $("converted");
const convertedHint = $("convertedHint");
const apiStatus = $("apiStatus");

// ====== 유틸 ======
function fmtMoney(n, ccy){
  if (!Number.isFinite(n)) return "-";
  const opt = { maximumFractionDigits: ccy === "USD" ? 2 : 0 };
  return new Intl.NumberFormat("ko-KR", opt).format(n) + ` ${ccy}`;
}
function fmtPct(n){
  if (!Number.isFinite(n)) return "-";
  return (n * 100).toFixed(2) + "%";
}
function toNum(v){
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
function setSuggestVisible(on){
  suggestBox.classList.toggle("hidden", !on);
}
function setModeButtons(){
  document.querySelectorAll(".chip").forEach(ch => {
    ch.classList.toggle("active", ch.dataset.opt === mode);
  });
}

// ====== 화면 전환 ======
function enterCountry(c){
  country = c;

  screenPick.classList.add("hidden");
  screenCalc.classList.remove("hidden");

  countryBadge.textContent = country;

  const baseCcy = country === "KR" ? "KRW" : "USD";
  const convCcy = country === "KR" ? "USD" : "KRW";

  ccyBadge.textContent = baseCcy;

  panelTitle.textContent = country === "KR" ? "한국 주식 손익 계산" : "미국 주식 손익 계산";
  panelDesc.textContent = country === "KR"
    ? "KRW 중심 입력 + USD 환산을 함께 보여줘요"
    : "USD 중심 입력 + KRW 환산을 함께 보여줘요";

  ticker.placeholder = country === "KR"
    ? "예: 005930 (삼성전자) / 035420 / 068270"
    : "예: AAPL / TSLA / MSFT";

  tickerHint.textContent = MARKET_PROXY_BASE
    ? "추천/현재가: 사용 가능"
    : "추천/현재가: 미설정 (수동 입력만 가능)";

  apiStatus.textContent = MARKET_PROXY_BASE
    ? "주가 불러오기: 설정됨 ✅"
    : "주가 불러오기: 미설정(수동 입력만 가능)";

  // FX UI 라벨도 국가에 맞춰 변경
  fxLabel.textContent = country === "KR" ? "USD → KRW" : "USD → KRW";
  render();
}

function goBack(){
  country = null;
  screenCalc.classList.add("hidden");
  screenPick.classList.remove("hidden");
  setSuggestVisible(false);
}

// ====== 환율 ======
async function loadFX(){
  try{
    // USD -> KRW (기준통화 USD)
    const url = `${FX_API}?base=USD&symbols=KRW`;
    const r = await fetch(url);
    const j = await r.json();
    fx.usdkrw = j?.rates?.KRW ?? null;
    fx.date = j?.date ?? null;

    if (fx.usdkrw){
      fxValue.textContent = fx.usdkrw.toFixed(2);
      fxHint.textContent = fx.date ? `기준일: ${fx.date}` : "";
    } else {
      fxValue.textContent = "불러오기 실패";
      fxHint.textContent = "";
    }
    render();
  } catch(e){
    fxValue.textContent = "불러오기 실패";
    fxHint.textContent = "";
  }
}

// ====== 계산 ======
function calc(){
  if (!country) return null;

  const baseCcy = country === "KR" ? "KRW" : "USD";
  const convCcy = country === "KR" ? "USD" : "KRW";

  const b = toNum(buyPrice.value);
  const s = toNum(sellPrice.value);
  const q = toNum(qty.value);

  const fee = toNum(feePct.value) / 100;
  const tax = toNum(taxPct.value) / 100;

  const grossBuy = b * q;
  const grossSell = s * q;

  // 왕복 수수료: (매수+매도)*fee
  const fees = (grossBuy + grossSell) * fee;

  // 세금은 보통 "매도" 기준으로 잡는 UX가 직관적이라 그렇게 처리
  const taxes = grossSell * tax;

  const netPnl = (grossSell - grossBuy) - fees - taxes;
  const roiVal = grossBuy > 0 ? netPnl / grossBuy : null;

  // 환산
  let conv = null;
  let convRate = null;

  if (fx.usdkrw){
    if (baseCcy === "USD" && convCcy === "KRW"){
      convRate = fx.usdkrw;
      conv = netPnl * convRate;
    } else if (baseCcy === "KRW" && convCcy === "USD"){
      convRate = 1 / fx.usdkrw;
      conv = netPnl * convRate;
    }
  }

  return { baseCcy, convCcy, grossBuy, grossSell, fees, taxes, netPnl, roiVal, conv, convRate };
}

function render(){
  const r = calc();
  if (!r){
    buyTotal.textContent = "-";
    sellTotal.textContent = "-";
    pnl.textContent = "-";
    roi.textContent = "-";
    converted.textContent = "-";
    convertedHint.textContent = "";
    return;
  }

  buyTotal.textContent = fmtMoney(r.grossBuy, r.baseCcy);
  sellTotal.textContent = fmtMoney(r.grossSell, r.baseCcy);

  pnl.textContent = fmtMoney(r.netPnl, r.baseCcy);
  roi.textContent = fmtPct(r.roiVal);

  // 색감은 CSS를 안 건드리고, 기호로만 분위기 주기
  const sign = r.netPnl > 0 ? "▲ " : (r.netPnl < 0 ? "▼ " : "• ");
  pnl.textContent = sign + pnl.textContent;

  if (Number.isFinite(r.conv) && Number.isFinite(r.convRate)){
    converted.textContent = fmtMoney(r.conv, r.convCcy);
    convertedHint.textContent = `적용 환율: 1 USD = ${fx.usdkrw?.toFixed?.(2) ?? "-"} KRW`;
  } else {
    converted.textContent = "환율 불러오면 자동 환산";
    convertedHint.textContent = "";
  }
}

// ====== 종목 추천/현재가 (프록시 필요) ======
function proxyReady(){
  return typeof MARKET_PROXY_BASE === "string" && MARKET_PROXY_BASE.length > 0;
}

async function searchSymbols(){
  if (!proxyReady()){
    setSuggestVisible(true);
    suggestBox.innerHTML = `<button type="button"><div class="srow">
      <div>프록시 미설정</div><div class="muted">수동 입력만 가능</div>
    </div></button>`;
    return;
  }

  const q = ticker.value.trim();
  if (!q) return;

  setSuggestVisible(true);
  suggestBox.innerHTML = `<button type="button"><div class="srow">
    <div>찾는 중…</div><div class="muted">잠시만</div>
  </div></button>`;

  try{
    const url = `${MARKET_PROXY_BASE}/search?q=${encodeURIComponent(q)}&country=${country}`;
    const r = await fetch(url);
    const j = await r.json();

    const items = Array.isArray(j?.data) ? j.data : [];
    if (!items.length){
      suggestBox.innerHTML = `<button type="button"><div class="srow">
        <div>결과 없음</div><div class="muted">다른 키워드로</div>
      </div></button>`;
      return;
    }

    suggestBox.innerHTML = items.slice(0, 8).map(it => {
      const sym = it.symbol ?? "";
      const name = it.name ?? "";
      const ex = it.exchange ?? "";
      const ccy = it.currency ?? "";
      return `
        <button type="button" data-sym="${sym.replaceAll('"','')}">
          <div class="srow">
            <div><strong>${sym}</strong> <span class="muted">${name}</span></div>
            <div class="muted">${ex} ${ccy}</div>
          </div>
        </button>
      `;
    }).join("");

  } catch(e){
    suggestBox.innerHTML = `<button type="button"><div class="srow">
      <div>검색 실패</div><div class="muted">네트워크/프록시 확인</div>
    </div></button>`;
  }
}

async function fetchQuote(){
  if (!proxyReady()){
    priceHint.textContent = "현재가 불러오기는 프록시 설정이 필요해요.";
    return;
  }
  const sym = ticker.value.trim();
  if (!sym) return;

  priceHint.textContent = "현재가 불러오는 중…";

  try{
    const url = `${MARKET_PROXY_BASE}/quote?symbol=${encodeURIComponent(sym)}&country=${country}`;
    const r = await fetch(url);
    const j = await r.json();

    if (j?.price){
      sellPrice.value = Number(j.price);
      priceHint.textContent = `업데이트: ${j.datetime ?? "방금"} · 통화: ${j.currency ?? "-"}`;
      render();
    } else {
      priceHint.textContent = `불러오기 실패: ${j?.error ?? "응답 확인"}`;
    }
  } catch(e){
    priceHint.textContent = "불러오기 실패(프록시/CORS 확인)";
  }
}

// ====== 이벤트 ======
document.querySelectorAll(".countryCard").forEach(btn => {
  btn.addEventListener("click", () => enterCountry(btn.dataset.country));
});

btnBack.addEventListener("click", goBack);

document.querySelectorAll(".chip").forEach(ch => {
  ch.addEventListener("click", () => {
    mode = ch.dataset.opt;
    setModeButtons();
    render();
  });
});

[ticker, buyPrice, sellPrice, qty, feePct, taxPct].forEach(el => {
  el.addEventListener("input", () => {
    setSuggestVisible(false);
    render();
  });
});

btnSearch.addEventListener("click", (e) => {
  e.preventDefault();
  searchSymbols();
});

btnQuote.addEventListener("click", (e) => {
  e.preventDefault();
  fetchQuote();
});

suggestBox.addEventListener("click", (e) => {
  const b = e.target.closest("button[data-sym]");
  if (!b) return;
  ticker.value = b.dataset.sym;
  setSuggestVisible(false);
});

// ====== 시작 ======
setModeButtons();
loadFX();
render();
