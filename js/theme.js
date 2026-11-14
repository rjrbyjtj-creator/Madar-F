/* MADAR GLOBAL THEME — shared by every public page */
(function () {
  "use strict";
  var API = "https://madar-jmy5.onrender.com/api/themes/active";
  var CACHE = "madar_active_theme";
  var root = document.documentElement;
  var FONT_MAP = {
    vazir: "'Vazirmatn',Tahoma,sans-serif",
    tahoma: "Tahoma,sans-serif",
    system: "system-ui,-apple-system,sans-serif"
  };
  var MAP = {
    bg: ["--bg", "--bg2", "--hdr", "--bg-header", "--bg-body"],
    surface: ["--surface", "--surface-2", "--panel", "--field", "--card", "--sf", "--sb", "--inner", "--tile", "--chip", "--bg-white"],
    line: ["--line", "--border", "--ln", "--border-color"],
    text: ["--text", "--tx", "--text-main"],
    muted: ["--muted", "--mu", "--text-muted", "--text-light"],
    navy: ["--navy", "--primary", "--blue", "--pr", "--pr2", "--primary-navy", "--primary-navy-hover", "--login"],
    gold: ["--gold", "--accent", "--acc", "--ac", "--accent-gold"],
    green: ["--green", "--ok", "--status-green"]
  };
  var DARK = { bg: "#0f172a", surface: "#172238", line: "#2a3850", text: "#e7edf6", muted: "#9aa7bc" };
  function setVar(name, value) { if (value) { root.style.setProperty(name, value); if (document.body) document.body.style.setProperty(name, value); } }
  function apply(theme) {
    if (!theme || !theme.colors) return;
    var c = theme.colors, dark = theme.mode === "dark";
    Object.keys(MAP).forEach(function (key) {
      var value = c[key];
      if (dark && Object.prototype.hasOwnProperty.call(DARK, key)) value = DARK[key];
      MAP[key].forEach(function (name) { setVar(name, value); });
    });
    setVar("--on-primary", "#ffffff");
    setVar("--on", "#ffffff");
    setVar("--navy-hover", c.navy);
    var font = FONT_MAP[theme.font] || FONT_MAP.vazir;
    setVar("--font-main", font);
    root.style.fontFamily = font;
    root.dataset.theme = dark ? "dark" : "light";
    root.classList.toggle("dark", dark);
    function syncBody() {
      if (!document.body) return;
      document.body.classList.toggle("dark", dark);
      document.body.classList.toggle("dark-mode", dark);
      document.body.style.fontFamily = font;
    }
    syncBody();
    if (!document.body) document.addEventListener("DOMContentLoaded", syncBody, { once: true });
    try { localStorage.setItem(CACHE, JSON.stringify(theme)); } catch (e) {}
    window.dispatchEvent(new CustomEvent("madar:theme-applied", { detail: theme }));
  }
  window.MadarTheme = {
    apply: apply,
    getActive: function () {
      return fetch(API, { cache: "no-store" }).then(function (r) {
        if (!r.ok) throw new Error("Theme request failed");
        return r.json();
      }).then(function (d) { if (d && d.theme) apply(d.theme); return d && d.theme; });
    },
    refresh: function () { return this.getActive(); }
  };
  try { var cached = localStorage.getItem(CACHE); if (cached) apply(JSON.parse(cached)); } catch (e) {}
  window.MadarTheme.getActive().catch(function () {});
})();