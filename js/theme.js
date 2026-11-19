/* MADAR GLOBAL THEME — site-wide palette pack + per-visitor light/dark mode */
(function () {
  "use strict";
  var API = "https://madar-jmy5.onrender.com/api/themes/active";
  var CACHE = "madar_active_theme";
  var KEYS = ["madar-theme", "theme", "answer-sheet-theme"];
  var root = document.documentElement;
  var currentTheme = null;
  var FONT_MAP = { vazir: "'Vazirmatn',Tahoma,sans-serif", tahoma: "Tahoma,sans-serif", system: "system-ui,-apple-system,sans-serif" };
  var MAP = {
    bg: ["--bg", "--bg2", "--hdr", "--bg-header", "--bg-body", "--bg-hero-left"],
    surface: ["--surface", "--surface-2", "--panel", "--field", "--card", "--sf", "--sb", "--inner", "--tile", "--chip", "--bg-white", "--btn-circle-bg"],
    line: ["--line", "--border", "--ln", "--border-color"],
    text: ["--text", "--tx", "--text-main"],
    muted: ["--muted", "--mu", "--text-muted", "--text-light"],
    navy: ["--navy", "--primary", "--blue", "--pr", "--pr2", "--primary-navy", "--primary-navy-hover", "--login"],
    gold: ["--gold", "--accent", "--acc", "--ac", "--accent-gold"],
    green: ["--green", "--ok", "--status-green"]
  };
  var DARK = { bg: "#0f172a", surface: "#172238", line: "#2a3850", text: "#e7edf6", muted: "#9aa7bc" };
  var GRAY_DARK = {
    bg: "#202423", surface: "#292F2D", line: "#3A4340",
    text: "#E8ECE9", muted: "#A0AAA5", navy: "#82928B",
    gold: "#91B5AA", green: "#91B5AA"
  };

  function readMode() {
    try {
      for (var i = 0; i < KEYS.length; i++) {
        var value = localStorage.getItem(KEYS[i]);
        if (value === "dark" || value === "light") return value;
      }
    } catch (e) {}
    return root.dataset.theme === "dark" ? "dark" : "light";
  }
  function saveMode(mode) {
    try { KEYS.forEach(function (key) { localStorage.setItem(key, mode); }); } catch (e) {}
  }
  function setVar(name, value) { if (value) { root.style.setProperty(name, value); if (document.body) document.body.style.setProperty(name, value); } }
  function paintMode(mode) {
    var dark = mode === "dark";
    root.dataset.theme = mode;
    root.classList.toggle("dark", dark);
    if (document.body) {
      document.body.classList.toggle("dark", dark);
      document.body.classList.toggle("dark-mode", dark);
    }
    root.style.colorScheme = dark ? "dark" : "light";
  }
  function applyColors(theme, mode) {
    if (!theme || !theme.colors) return;
    var colors = theme.colors;
    var dark = mode === "dark";
    var isGray = theme.slug === "gray";
    var palette = Object.assign({}, colors);
    if (dark && isGray) palette = Object.assign(palette, GRAY_DARK);
    else if (dark) palette = Object.assign(palette, DARK);
    Object.keys(MAP).forEach(function (key) {
      var value = palette[key];
      MAP[key].forEach(function (name) { setVar(name, value); });
    });
    setVar("--bg2", dark ? (isGray ? "#242A28" : "#172238") : (isGray ? "#F0F1F0" : "#FBFBFC"));
    setVar("--sb", isGray ? (dark ? "#242A28" : "#F0F1F0") : palette.surface);
    setVar("--hv", isGray ? (dark ? "#343C38" : "#E1E5E3") : palette.surface);
    setVar("--on-primary", "#ffffff");
    setVar("--on", "#ffffff");
    setVar("--navy-hover", palette.navy);
    var font = FONT_MAP[theme.font] || FONT_MAP.vazir;
    setVar("--font-main", font);
    root.style.fontFamily = font;
    if (document.body) document.body.style.fontFamily = font;
    root.classList.toggle("gray-theme", isGray);
    if (document.body) document.body.classList.toggle("gray-theme", isGray);
  }
  function apply(theme) {
    if (!theme || !theme.colors) return;
    var mode = readMode();
    currentTheme = Object.assign({}, theme, { mode: mode });
    applyColors(currentTheme, mode);
    paintMode(mode);
    try { localStorage.setItem(CACHE, JSON.stringify(currentTheme)); } catch (e) {}
    window.dispatchEvent(new CustomEvent("madar:theme-applied", { detail: currentTheme }));
  }
  function setMode(mode) {
    if (mode !== "light" && mode !== "dark") return;
    saveMode(mode);
    paintMode(mode);
    if (currentTheme) {
      currentTheme = Object.assign({}, currentTheme, { mode: mode });
      applyColors(currentTheme, mode);
      try { localStorage.setItem(CACHE, JSON.stringify(currentTheme)); } catch (e) {}
      window.dispatchEvent(new CustomEvent("madar:theme-applied", { detail: currentTheme }));
    }
    window.dispatchEvent(new CustomEvent("madar:mode-changed", { detail: { mode: mode } }));
  }
  window.MadarTheme = {
    apply: apply,
    getActive: function () {
      return fetch(API, { cache: "no-store" }).then(function (response) {
        if (!response.ok) throw new Error("Theme request failed");
        return response.json();
      }).then(function (data) {
        if (data && data.theme) apply(data.theme);
        return data && data.theme;
      });
    },
    refresh: function () { return this.getActive(); },
    getMode: readMode,
    setMode: setMode,
    getPack: function () { return currentTheme && currentTheme.slug || "madar"; }
  };

  var initialMode = readMode();
  saveMode(initialMode);
  paintMode(initialMode);
  try {
    var cached = localStorage.getItem(CACHE);
    if (cached) apply(JSON.parse(cached));
  } catch (e) {}
  window.addEventListener("storage", function (event) {
    if (KEYS.indexOf(event.key) !== -1 && (event.newValue === "dark" || event.newValue === "light")) {
      setMode(event.newValue);
    }
  });
  window.MadarTheme.getActive().catch(function () {});
})();