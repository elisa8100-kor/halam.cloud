const SUPABASE_URL = "https://hkswzghtmeeftjmnnsmx.supabase.co";
const SUPABASE_KEY = "sb_publishable_5YfaypCKMP8y_H_u3_dBGw_MZ9CIPG9";

const { createClient } = window.supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

const ADMIN_PASSWORD = "donghae2026";
let editingId = null;

function login() {
  const pw = document.getElementById("pw").value.trim();
  const status = document.getElementById("loginStatus");

  if (pw === ADMIN_PASSWORD) {
    document.getElementById("login").style.display = "none";
    document.getElementById("panel").style.display = "block";
    status.textContent = "";
    loadList();
  } else {
    status.textContent = "비밀번호가 올바르지 않습니다.";
  }
}

function resetForm() {
  editingId = null;
  document.getElementById("title").value = "";
  document.getElementById("type").value = "notice";
  document.getElementById("date").value = "";
  document.getElementById("tags").value = "";
  document.getElementById("content").value = "";
  document.getElementById("saveBtn").textContent = "추가";
  document.getElementById("formStatus").textContent = "";
}

function getTypeLabel(type) {
  if (type === "homework") return "📚 숙제";
  if (type === "supply") return "🎒 준비물";
  if (type === "lost") return "🧢 분실물";
  return "📢 공지";
}

async function saveNotice() {
  const title = document.getElementById("title").value.trim();
  const type = document.getElementById("type").value;
  const due_date = document.getElementById("date").value || null;
  const tags = document.getElementById("tags").value.trim();
  const content = document.getElementById("content").value.trim();
  const status = document.getElementById("formStatus");

  if (!title || !content) {
    status.textContent = "제목과 내용을 모두 입력하세요.";
    return;
  }

  status.textContent = "저장 중...";

  try {
    if (editingId) {
      const { error } = await db
        .from("notices")
        .update({
          title,
          type,
          due_date,
          tags,
          content
        })
        .eq("id", editingId);

      if (error) throw error;
      resetForm();
      status.textContent = "수정되었습니다.";
    } else {
      const { error } = await db
        .from("notices")
        .insert([{
          title,
          type,
          due_date,
          tags,
          content
        }]);

      if (error) throw error;
      resetForm();
      status.textContent = "추가되었습니다.";
    }

    loadList();
  } catch (err) {
    status.textContent = "저장 실패: " + (err.message || "오류");
  }
}

async function loadList() {
  const box = document.getElementById("list");
  box.innerHTML = "<div>불러오는 중...</div>";

  try {
    const { data, error } = await db
      .from("notices")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    if (!data || !data.length) {
      box.innerHTML = "<div>등록된 글이 없습니다.</div>";
      return;
    }

    box.innerHTML = "";

    data.forEach(item => {
      const div = document.createElement("div");
      div.className = "item";

      const tagsHtml = (item.tags || "")
        .split(",")
        .map(t => t.trim())
        .filter(Boolean)
        .map(t => `<span class="badge">#${escapeHtml(t)}</span>`)
        .join("");

      div.innerHTML = `
        <div class="top">
          <div>
            <div>
              <span class="badge">${getTypeLabel(item.type)}</span>
              <span class="badge">${item.due_date || "날짜 없음"}</span>
            </div>
            <h3>${escapeHtml(item.title || "")}</h3>
            <p>${escapeHtml(item.content || "")}</p>
            <div>${tagsHtml}</div>
          </div>
          <div class="actions">
            <button class="btn warn" onclick="startEdit(${item.id})">수정</button>
            <button class="btn danger" onclick="deleteNotice(${item.id}, '${escapeJs(item.title || "")}')">삭제</button>
          </div>
        </div>
      `;

      box.appendChild(div);
    });
  } catch (err) {
    box.innerHTML = `<div>불러오기 실패: ${err.message || "오류"}</div>`;
  }
}

async function startEdit(id) {
  try {
    const { data, error } = await db
      .from("notices")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    editingId = id;
    document.getElementById("title").value = data.title || "";
    document.getElementById("type").value = data.type || "notice";
    document.getElementById("date").value = data.due_date || "";
    document.getElementById("tags").value = data.tags || "";
    document.getElementById("content").value = data.content || "";
    document.getElementById("saveBtn").textContent = "수정 완료";
    document.getElementById("formStatus").textContent = "수정 모드입니다.";
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (err) {
    document.getElementById("formStatus").textContent = "수정 불러오기 실패";
  }
}

async function deleteNotice(id, title) {
  const ok = confirm(`"${title}" 글을 삭제할까요?`);
  if (!ok) return;

  try {
    const { error } = await db
      .from("notices")
      .delete()
      .eq("id", id);

    if (error) throw error;

    if (editingId === id) {
      resetForm();
    }

    loadList();
  } catch (err) {
    alert("삭제 실패: " + (err.message || "오류"));
  }
}

function escapeHtml(str = "") {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeJs(str = "") {
  return str.replaceAll("\\", "\\\\").replaceAll("'", "\\'");
}
