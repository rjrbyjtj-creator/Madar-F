/* MADAR ADMIN — shared site mode + administrator-only global theme pack control */
(function () {
  "use strict";
  var button = document.getElementById("themeToggle") || document.getElementById("theme");
  var root = document.documentElement;
  var API = "https://madar-jmy5.onrender.com/api";
  var packButtons = document.querySelectorAll("[data-theme-pack]");
  function token() {
    try { return localStorage.getItem("madar_token") || sessionStorage.getItem("madar_token") || ""; }
    catch (e) { return ""; }
  }
  function currentMode() {
    if (window.MadarTheme && window.MadarTheme.getMode) return window.MadarTheme.getMode();
    try {
      var saved = localStorage.getItem("madar-theme") || localStorage.getItem("madar_admin_mode");
      if (saved === "dark" || saved === "light") return saved;
    } catch (e) {}
    return "light";
  }
  function applyMode(mode, persist) {
    var dark = mode === "dark";
    if (window.MadarTheme && window.MadarTheme.setMode) window.MadarTheme.setMode(dark ? "dark" : "light");
    else {
      document.body.classList.toggle("dark", dark);
      document.body.classList.toggle("dark-mode", dark);
      root.dataset.theme = dark ? "dark" : "light";
      if (persist) try { localStorage.setItem("madar-theme", dark ? "dark" : "light"); } catch (e) {}
    }
    if (button) {
      var use = button.querySelector("use");
      if (use) use.setAttribute("href", dark ? "#sun" : "#moon");
      button.title = dark ? "فعال‌سازی حالت روشن" : "فعال‌سازی حالت تاریک";
      button.setAttribute("aria-label", button.title);
      button.setAttribute("aria-pressed", dark ? "true" : "false");
    }
  }
  applyMode(currentMode(), false);
  if (button) button.addEventListener("click", function () {
    applyMode(currentMode() === "dark" ? "light" : "dark", true);
  });

  function setPackStatus(message, error) {
    var status = document.getElementById("themePackStatus");
    if (status) { status.textContent = message; status.style.color = error ? "#c44" : ""; }
  }
  function markPack(slug) {
    packButtons.forEach(function (item) {
      var active = item.getAttribute("data-theme-pack") === slug;
      item.classList.toggle("active", active);
      item.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }
  async function loadThemePack() {
    if (!packButtons.length) return;
    var auth = token();
    if (!auth) { setPackStatus("برای تغییر پوسته، وارد حساب مدیر شوید.", true); return; }
    try {
      var response = await fetch(API + "/themes", { headers: { Authorization: "Bearer " + auth }, cache: "no-store" });
      var data = await response.json();
      if (!response.ok) throw new Error(data.message || "دریافت پوسته‌ها ناموفق بود.");
      var active = (data.themes || []).find(function (theme) { return theme.isActive; });
      markPack(active ? active.slug : "madar");
      setPackStatus(active ? "پوستهٔ فعال: " + active.name : "پوستهٔ پیش‌فرض مدار فعال است.");
    } catch (error) {
      setPackStatus(error.message || "دریافت پوسته‌ها ناموفق بود.", true);
    }
  }
  packButtons.forEach(function (item) {
    item.addEventListener("click", async function () {
      var slug = item.getAttribute("data-theme-pack");
      var auth = token();
      if (!auth) { setPackStatus("ورود مدیر برای این کار لازم است.", true); return; }
      packButtons.forEach(function (b) { b.disabled = true; });
      setPackStatus("در حال تغییر پوستهٔ پیش‌فرض…");
      try {
        var listResponse = await fetch(API + "/themes", { headers: { Authorization: "Bearer " + auth }, cache: "no-store" });
        var listData = await listResponse.json();
        if (!listResponse.ok) throw new Error(listData.message || "دریافت فهرست پوسته‌ها ناموفق بود.");
        var theme = (listData.themes || []).find(function (entry) { return entry.slug === slug; });
        if (!theme) throw new Error("بستهٔ پوسته پیدا نشد.");
        var response = await fetch(API + "/themes/" + encodeURIComponent(theme.id) + "/activate", {
          method: "POST", headers: { Authorization: "Bearer " + auth }
        });
        var data = await response.json();
        if (!response.ok) throw new Error(data.message || "ذخیره پوسته ناموفق بود.");
        if (window.MadarTheme && window.MadarTheme.refresh) await window.MadarTheme.refresh();
        markPack(slug);
        setPackStatus("پوستهٔ پیش‌فرض سایت روی «" + theme.name + "» تنظیم شد.");
      } catch (error) {
        setPackStatus(error.message || "تغییر پوسته انجام نشد.", true);
      } finally {
        packButtons.forEach(function (b) { b.disabled = false; });
      }
    });
  });
  loadThemePack();

  async function loadStats() {
    var nodes = document.querySelectorAll("[data-stat]");
    if (!nodes.length) return;
    var auth = token();
    if (!auth) {
      nodes.forEach(function (node) { if (!node.closest(".stat-unavailable")) node.textContent = "—"; });
      return;
    }
    try {
      var response = await fetch(API + "/admin/stats", {
        headers: { Authorization: "Bearer " + auth }, cache: "no-store"
      });
      var payload = {};
      try { payload = await response.json(); } catch (e) {}
      if (!response.ok) throw new Error(payload.message || ("HTTP " + response.status));
      var values = payload.stats || {};
      nodes.forEach(function (node) {
        var key = node.getAttribute("data-stat");
        node.textContent = Object.prototype.hasOwnProperty.call(values, key) && values[key] !== null
          ? Number(values[key]).toLocaleString("fa-IR") : "—";
      });
      var school = document.querySelector('[data-stat="schools"]');
      var tickets = document.querySelector('[data-stat="supportTickets"]');
      if (school && payload.unavailable && payload.unavailable.schools) school.title = payload.unavailable.schools;
      if (tickets && payload.unavailable && payload.unavailable.supportTickets) tickets.title = payload.unavailable.supportTickets;
    } catch (error) {
      nodes.forEach(function (node) { if (!node.closest(".stat-unavailable")) node.textContent = "—"; });
      var box = document.getElementById("adminStats");
      if (box) box.title = "آمار از سرور دریافت نشد: " + (error.message || "خطای ارتباط");
      console.error("Admin stats could not be loaded:", error);
    }
  }
  loadStats();
})();