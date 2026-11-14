/* MADAR ADMIN — independent, persistent light/dark mode */
(function () {
  "use strict";
  var KEY = "madar_admin_mode";
  var button = document.getElementById("themeToggle");
  var root = document.documentElement;

  function currentMode() {
    try {
      var saved = localStorage.getItem(KEY);
      if (saved === "dark" || saved === "light") return saved;
    } catch (e) {}
    return "light";
  }

  function applyMode(mode, persist) {
    var dark = mode === "dark";
    document.body.classList.toggle("dark", dark);
    root.dataset.adminMode = dark ? "dark" : "light";
    if (button) {
      var use = button.querySelector("use");
      if (use) use.setAttribute("href", dark ? "#sun" : "#moon");
      button.title = dark ? "فعال‌سازی حالت روشن" : "فعال‌سازی حالت تاریک";
      button.setAttribute("aria-label", button.title);
      button.setAttribute("aria-pressed", dark ? "true" : "false");
    }
    if (persist) {
      try { localStorage.setItem(KEY, dark ? "dark" : "light"); } catch (e) {}
    }
  }

  applyMode(currentMode(), false);
  if (button) button.addEventListener("click", function () {
    applyMode(document.body.classList.contains("dark") ? "light" : "dark", true);
  });
  window.addEventListener("storage", function (event) {
    if (event.key === KEY) applyMode(event.newValue === "dark" ? "dark" : "light", false);
  });

  async function loadStats() {
    var nodes = document.querySelectorAll("[data-stat]");
    if (!nodes.length) return;
    var token = null;
    try { token = localStorage.getItem("madar_token") || sessionStorage.getItem("madar_token"); } catch (e) {}
    if (!token) {
      nodes.forEach(function (node) { if (!node.closest(".stat-unavailable")) node.textContent = "—"; });
      return;
    }
    try {
      var response = await fetch("https://madar-jmy5.onrender.com/api/admin/stats", {
        headers: { Authorization: "Bearer " + token }, cache: "no-store"
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