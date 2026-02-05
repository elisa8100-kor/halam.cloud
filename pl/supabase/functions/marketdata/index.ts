// Deno / Supabase Edge Function
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const TD_BASE = "https://api.twelvedata.com";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
    },
  });
}

function bad(msg: string, status = 400) {
  return json({ error: msg }, status);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return json({ ok: true });

  const url = new URL(req.url);
  const path = url.pathname.split("/").pop(); // quote | search
  const apiKey = Deno.env.get("TWELVEDATA_API_KEY");

  if (!apiKey) return bad("Server missing TWELVEDATA_API_KEY env", 500);

  // country는 UX용. 실제로는 심볼이 알아서 결정되지만,
  // 필요하면 여기서 KR은 XKRX 심볼만, US는 US 심볼만 필터링 가능.
  const country = (url.searchParams.get("country") || "").toUpperCase();

  if (path === "quote") {
    const symbol = url.searchParams.get("symbol");
    if (!symbol) return bad("Missing symbol");

    // Twelve Data quote: /quote?symbol=...&apikey=...
    const tdUrl = `${TD_BASE}/quote?symbol=${encodeURIComponent(symbol)}&apikey=${encodeURIComponent(apiKey)}`;
    const r = await fetch(tdUrl);
    const j = await r.json();

    if (j?.status === "error") return json({ error: j?.message ?? "TwelveData error", raw: j }, 502);

    // normalize
    return json({
      symbol: j?.symbol ?? symbol,
      price: j?.close ?? j?.price ?? j?.last ?? null,
      currency: j?.currency ?? null,
      datetime: j?.datetime ?? null,
      raw: j,
    });
  }

  if (path === "search") {
    const q = url.searchParams.get("q");
    if (!q) return bad("Missing q");

    // Twelve Data symbol search is documented on their docs site,
    // commonly used endpoint: /symbol_search?symbol=...&apikey=...
    const tdUrl = `${TD_BASE}/symbol_search?symbol=${encodeURIComponent(q)}&apikey=${encodeURIComponent(apiKey)}`;
    const r = await fetch(tdUrl);
    const j = await r.json();

    if (j?.status === "error") return json({ error: j?.message ?? "TwelveData error", raw: j }, 502);

    // optional filter by country if you want:
    const data = Array.isArray(j?.data) ? j.data : [];
    const filtered = (country === "KR")
      ? data.filter((x: any) => String(x?.exchange ?? "").toUpperCase().includes("KRX") || String(x?.exchange ?? "").toUpperCase().includes("KOREA"))
      : (country === "US")
      ? data.filter((x: any) => String(x?.country ?? "").toUpperCase().includes("UNITED STATES") || String(x?.exchange ?? "").toUpperCase().includes("NASDAQ") || String(x?.exchange ?? "").toUpperCase().includes("NYSE"))
      : data;

    return json({ data: filtered.slice(0, 20) });
  }

  return bad("Unknown route. Use /quote or /search", 404);
});
