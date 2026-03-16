const SUPABASE_URL = "https://hkswzghtmeeftjmnnsmx.supabase.co";
const SUPABASE_KEY = "sb_publishable_5YfaypCKMP8y_H_u3_dBGw_MZ9CIPG9";

const { createClient } = window.supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

let notices = [];
let currentFilter = "all";
let refreshTimer = null;

const DEFAULT_SETTINGS = {
  darkMode: false,
  mute: false,
  notify: false,
  rememberCollapse: true,
  autoRefresh: true,
  dataSaver: false,
  fontSize: "normal",
  collapsed: {
    homeworkList: false,
    supplyList: false,
    lostList: false,
    noticeList: false
  }
};

function getSettings() {
  const saved = localStorage.getItem("donghaeSettings");
  if (!saved) return { ...DEFAULT_SETTINGS };
  try {
    const parsed = JSON.parse(saved);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      collapsed: {
        ...DEFAULT_SETTINGS.collapsed,
        ...(parsed.collapsed || {})
      }
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function saveSettings(settings) {
  localStorage.setItem("donghaeSettings", JSON.stringify(settings));
}

let settings = getSettings();

function applySettings() {
  document.body.classList.toggle("dark", settings.darkMode);
  document.body.classList.remove("font-small", "font-normal", "font-large");
  document.body.classList.add(`font-${settings.fontSize}`);

  document.getElementById("darkModeToggle").checked = settings.darkMode;
  document.getElementById("muteToggle").checked = settings.mute;
  document.getElementById("notifyToggle").checked = settings.notify;
  document.getElementById("rememberCollapseToggle").checked = settings.rememberCollapse;
  document.getElementById("autoRefreshToggle").checked = settings.autoRefresh;
  document.getElementById("dataSaverToggle").checked = settings.dataSaver;
  document.getElementById("fontSizeSelect").value = settings.fontSize;

  applyCollapsedState();
  setupRefreshTimer();
}

function applyCollapsedState() {
  const collapseButtons = document.querySelectorAll(".collapse-btn");
  collapseButtons.forEach(btn => {
    const targetId = btn.dataset.target;
    const area = document.getElementById(targetId);
    const isCollapsed = !!settings.collapsed[targetId];
    area.classList.toggle("hidden", isCollapsed);
    btn.textContent = isCollapsed ? "+" : "−";
  });
}

function setupRefreshTimer() {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }

  if (settings.dataSaver) return;
  if (!settings.autoRefresh) return;

  refreshTimer = setInterval(() => {
    loadNotices(false);
  }, 60000);
}

function openMenu() {
  document.getElementById("sideMenu").classList.add("open");
  document.getElementById("menuOverlay").classList.add("show");
}

function closeMenu() {
  document.getElementById("sideMenu").classList.remove("open");
  document.getElementById("menuOverlay").classList.remove("show");
}

function showSettings() {
  document.getElementById("settingsPanel").classList.remove("hidden");
  document.getElementById("contentPanel").classList.add("hidden");
}

function showContent() {
  document.getElementById("settingsPanel").classList.add("hidden");
  document.getElementById("contentPanel").classList.remove("hidden");
}

function shortText(text = "", limit = 70) {
  if (text.length <= limit) return text;
  return text.slice(0, limit) + "...";
}

function formatDateText(dateText) {
  if (!dateText) return "날짜 없음";
  return dateText;
}

function isAfterNoon() {
  const now = new Date();
  return now.getHours() >= 12;
}

function isToday(dateText) {
  const today = new Date().toISOString().split("T")[0];
  return dateText === today;
}

function isTomorrow(dateText) {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const tomorrow = d.toISOString().split("T")[0];
  return dateText === tomorrow;
}

function filterVisibleData() {
  let homeworkItems = notices.filter(n => n.type === "homework");
  let supplyItems = notices.filter(n => n.type === "supply");
  const lostItems = notices.filter(n => n.type === "lost");
  const noticeItems = notices.filter(n => n.type === "notice");

  if (isAfterNoon()) {
    homeworkItems = [];
    supplyItems = [];
  } else {
    homeworkItems = homeworkItems.filter(n => isToday(n.due_date));
    supplyItems = supplyItems.filter(n => isTomorrow(n.due_date));
  }

  return { homeworkItems, supplyItems, lostItems, noticeItems };
}

function makeEmptyBox() {
  return `<div class="empty-box">아직 업데이트되지 않았습니다.</div>`;
}

function renderList(targetId, items, icon, clickable = true) {
  const box = document.getElementById(targetId);
  box.innerHTML = "";

  if (!items.length) {
    box.innerHTML = makeEmptyBox();
    return;
  }

  items.forEach(item => {
    const div = document.createElement("div");
    div.className = "notice-card";

    const tagHtml = (item.tags || "")
      .split(",")
      .map(t => t.trim())
      .filter(Boolean)
      .map(t => `<span class="badge">#${escapeHtml(t)}</span>`)
      .join("");

    div.innerHTML = `
      <h3>${icon} ${escapeHtml(item.title || "")}</h3>
      <p>${escapeHtml(shortText(item.content || ""))}</p>
      ${tagHtml ? `<div>${tagHtml}</div>` : ""}
      <div class="notice-meta">${formatDateText(item.due_date || (item.created_at ? item.created_at.slice(0,10) : ""))}</div>
    `;

    if (clickable) {
      div.onclick = () => {
        alert(`${item.title || ""}\n\n${item.content || ""}`);
      };
    }

    box.appendChild(div);
  });
}

function renderByFilter() {
  const { homeworkItems, supplyItems, lostItems, noticeItems } = filterVisibleData();

  const homeworkSection = document.getElementById("homeworkSection");
  const supplySection = document.getElementById("supplySection");
  const lostSection = document.getElementById("lostSection");
  const noticeSection = document.getElementById("noticeSection");

  homeworkSection.style.display = "block";
  supplySection.style.display = "block";
  lostSection.style.display = "block";
  noticeSection.style.display = "block";

  if (currentFilter === "homework") {
    supplySection.style.display = "none";
    lostSection.style.display = "none";
    noticeSection.style.display = "none";
  } else if (currentFilter === "supply") {
    homeworkSection.style.display = "none";
    lostSection.style.display = "none";
    noticeSection.style.display = "none";
  } else if (currentFilter === "lost") {
    homeworkSection.style.display = "none";
    supplySection.style.display = "none";
    noticeSection.style.display = "none";
  } else if (currentFilter === "notice") {
    homeworkSection.style.display = "none";
    supplySection.style.display = "none";
    lostSection.style.display = "none";
  }

  renderList("homeworkList", homeworkItems, "📚");
  renderList("supplyList", supplyItems, "🎒");
  renderList("lostList", lostItems, "🧢");
  renderList("noticeList", noticeItems, "📢");
}

async function loadNotices(firstLoad = true) {
  try {
    const { data, error } = await db
      .from("notices")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const previousIds = new Set(notices.map(n => n.id));
    notices = data || [];
    renderByFilter();

    if (!firstLoad && settings.notify && !settings.mute && !settings.dataSaver) {
      const newItems = notices.filter(n => !previousIds.has(n.id));
      if (newItems.length) {
        tryBrowserNotify(newItems[0]);
      }
    }
  } catch (err) {
    document.getElementById("noticeList").innerHTML =
      `<div class="empty-box">불러오기 실패: ${escapeHtml(err.message || "오류")}</div>`;
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

async function tryBrowserNotify(item) {
  if (!("Notification" in window)) return;
  if (Notification.permission === "default") {
    try {
      await Notification.requestPermission();
    } catch {
      return;
    }
  }
  if (Notification.permission === "granted") {
    new Notification("새 알림", {
      body: item.title || "새 글이 등록되었습니다."
    });
  }
}

function bindEvents() {
  document.getElementById("menuBtn").onclick = openMenu;
  document.getElementById("closeMenuBtn").onclick = closeMenu;
  document.getElementById("menuOverlay").onclick = closeMenu;

  document.querySelectorAll(".menu-item").forEach(btn => {
    btn.addEventListener("click", () => {
      const filter = btn.dataset.filter;
      if (filter === "settings") {
        showSettings();
      } else {
        currentFilter = filter;
        showContent();
        renderByFilter();
      }
      closeMenu();
    });
  });

  document.querySelectorAll(".collapse-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const targetId = btn.dataset.target;
      const area = document.getElementById(targetId);
      const willCollapse = !area.classList.contains("hidden");
      area.classList.toggle("hidden", willCollapse);
      btn.textContent = willCollapse ? "+" : "−";

      if (settings.rememberCollapse) {
        settings.collapsed[targetId] = willCollapse;
        saveSettings(settings);
      }
    });
  });

  document.getElementById("darkModeToggle").onchange = e => {
    settings.darkMode = e.target.checked;
    saveSettings(settings);
    applySettings();
  };

  document.getElementById("muteToggle").onchange = e => {
    settings.mute = e.target.checked;
    saveSettings(settings);
  };

  document.getElementById("notifyToggle").onchange = async e => {
    settings.notify = e.target.checked;
    saveSettings(settings);

    if (e.target.checked && "Notification" in window && Notification.permission === "default") {
      try {
        await Notification.requestPermission();
      } catch {}
    }
  };

  document.getElementById("rememberCollapseToggle").onchange = e => {
    settings.rememberCollapse = e.target.checked;
    if (!settings.rememberCollapse) {
      settings.collapsed = { ...DEFAULT_SETTINGS.collapsed };
    }
    saveSettings(settings);
    applySettings();
  };

  document.getElementById("autoRefreshToggle").onchange = e => {
    settings.autoRefresh = e.target.checked;
    saveSettings(settings);
    applySettings();
  };

  document.getElementById("dataSaverToggle").onchange = e => {
    settings.dataSaver = e.target.checked;
    if (settings.dataSaver) {
      settings.autoRefresh = false;
      document.getElementById("autoRefreshToggle").checked = false;
    }
    saveSettings(settings);
    applySettings();
  };

  document.getElementById("fontSizeSelect").onchange = e => {
    settings.fontSize = e.target.value;
    saveSettings(settings);
    applySettings();
  };

  document.getElementById("resetSettingsBtn").onclick = () => {
    settings = { ...DEFAULT_SETTINGS, collapsed: { ...DEFAULT_SETTINGS.collapsed } };
    saveSettings(settings);
    applySettings();
  };
}

bindEvents();
applySettings();
loadNotices(true);
