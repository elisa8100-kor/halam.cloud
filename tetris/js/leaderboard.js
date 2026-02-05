import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { CONFIG } from "./config.js";

export class Leaderboard {
  constructor({ statusEl, listEl, netEl }){
    this.statusEl = statusEl;
    this.listEl = listEl;
    this.netEl = netEl;

    this.client = createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey);
  }

  esc(s){
    return String(s).replace(/[&<>"']/g, m => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
    }[m]));
  }

  medal(i){
    return i===0 ? "🥇" : i===1 ? "🥈" : i===2 ? "🥉" : String(i+1);
  }

  async ping(){
    try{
      // 가벼운 조회로 연결상태 확인
      const { error } = await this.client
        .from(CONFIG.table)
        .select("id", { count: "exact", head: true })
        .limit(1);

      if(error) throw error;
      if(this.netEl) this.netEl.textContent = "Supabase: 연결됨";
      return true;
    }catch(e){
      if(this.netEl) this.netEl.textContent = "Supabase: 연결 실패";
      return false;
    }
  }

  render(rows){
    if(!rows || rows.length === 0){
      this.listEl.innerHTML = `<div class="muted">아직 기록이 없어요. 첫 판을 열어주세요 🧱</div>`;
      return;
    }

    this.listEl.innerHTML = rows.map((r, i) => {
      const medal = this.medal(i);
      const when = new Date(r.created_at).toLocaleString("ko-KR");
      return `
        <div class="lbRow">
          <div class="lbRank">${medal}</div>
          <div>
            <div class="lbName">${this.esc(r.name)}</div>
            <div class="lbMeta">라인 ${r.lines} • 레벨 ${r.level} • ${when}</div>
          </div>
          <div class="lbScore">${Number(r.score).toLocaleString("ko-KR")}</div>
        </div>
      `;
    }).join("");
  }

  async fetchTop(){
    this.statusEl.textContent = `불러오는 중…`;
    const { data, error } = await this.client
      .from(CONFIG.table)
      .select("name, score, lines, level, created_at")
      .order("score", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(CONFIG.topN);

    if(error){
      this.statusEl.textContent = "불러오기 실패";
      this.listEl.innerHTML = `<div class="muted" style="color:#ffb3b3">에러: ${this.esc(error.message)}</div>`;
      return null;
    }

    this.statusEl.textContent = `Top ${CONFIG.topN}`;
    this.render(data);
    return data;
  }

  normalizeName(name){
    return String(name || "").trim().slice(0, 20);
  }

  async submit({ name, score, lines, level }){
    const clean = this.normalizeName(name);
    if(clean.length < 1) throw new Error("이름을 입력하세요.");

    const payload = {
      name: clean,
      score: Math.max(0, Math.floor(score)),
      lines: Math.max(0, Math.floor(lines)),
      level: Math.max(1, Math.floor(level)),
    };

    const { error } = await this.client
      .from(CONFIG.table)
      .insert(payload);

    if(error) throw error;
    return true;
  }
}
