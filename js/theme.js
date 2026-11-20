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
    surface: ["--surface", "--surface-2", "--panel", "--field", "--card", "--sf", "--inner", "--tile", "--chip", "--cb", "--bg-white", "--btn-circle-bg"],
    line: ["--line", "--border", "--ln", "--border-color"],
    text: ["--text", "--tx", "--text-main", "--ink"],
    muted: ["--muted", "--mu", "--text-muted", "--text-light"],
    navy: ["--navy", "--primary", "--blue", "--pr", "--pr2", "--primary-navy", "--primary-navy-hover", "--login", "--ico"],
    gold: ["--gold", "--accent", "--acc", "--ac", "--accent-gold"],
    green: ["--green", "--ok", "--status-green"]
  };
  var DARK = { bg: "#0f172a", surface: "#172238", line: "#2a3850", text: "#e7edf6", muted: "#9aa7bc" };
  var GRAY_DARK = {
    bg: "#202423", surface: "#292F2D", line: "#3A4340",
    text: "#E8ECE9", muted: "#A0AAA5", navy: "#82928B",
    gold: "#91B5AA", green: "#91B5AA"
  };
  var CLAUDE_DARK = {
    bg: "#191919", surface: "#303030", line: "#414141",
    text: "#F2F2F2", muted: "#A1A1A1", navy: "#D0D0D0",
    gold: "#B8B8B8", green: "#A5A5A5"
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
    var isClaude = theme.slug === "claude";
    var palette = Object.assign({}, colors);
    if (dark && isGray) palette = Object.assign(palette, GRAY_DARK);
    else if (dark && isClaude) palette = Object.assign(palette, CLAUDE_DARK);
    else if (dark) palette = Object.assign(palette, DARK);
    Object.keys(MAP).forEach(function (key) {
      var value = palette[key];
      MAP[key].forEach(function (name) { setVar(name, value); });
    });
    setVar("--bg2", isClaude ? (dark ? "#1F1F1F" : "#EEEEEC") : (isGray ? (dark ? "#242A28" : "#F0F1F0") : (dark ? "#172238" : "#FBFBFC")));
    setVar("--bg-top", palette.bg);
    setVar("--bg-mid", isClaude ? (dark ? "#202020" : "#EEEEEC") : (isGray ? (dark ? "#242A28" : "#F0F1F0") : palette.surface));
    setVar("--bg-deep", isClaude ? (dark ? "#191919" : "#E7E7E5") : (isGray ? (dark ? "#202423" : "#E1E5E3") : palette.bg));
    setVar("--sb", isClaude ? (dark ? "#1F1F1F" : "#EEEEEC") : (isGray ? (dark ? "#242A28" : "#F0F1F0") : palette.surface));
    setVar("--hv", isClaude ? (dark ? "#3B3B3B" : "#E4E4E2") : (isGray ? (dark ? "#343C38" : "#E1E5E3") : palette.surface));
    setVar("--okbg", isClaude ? (dark ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.05)") : (isGray ? (dark ? "rgba(145,181,170,.14)" : "rgba(102,140,130,.12)") : "rgba(34,197,94,.10)"));
    setVar("--idbg", isClaude ? (dark ? "linear-gradient(145deg,#303030,#363636)" : "linear-gradient(145deg,#FFFFFF,#EEEEEC)") : (isGray ? (dark ? "linear-gradient(145deg,#292F2D,#343C38)" : "linear-gradient(145deg,#F8F8F7,#D4D7D6)") : "linear-gradient(145deg,#ffffff,#e3e8f0)"));
    setVar("--sh", isClaude ? (dark ? "rgba(0,0,0,.30)" : "rgba(0,0,0,.08)") : (isGray ? (dark ? "rgba(0,0,0,.38)" : "rgba(34,42,39,.12)") : "rgba(20,38,79,.14)"));
    setVar("--on-primary", "#ffffff");
    setVar("--on", "#ffffff");
    setVar("--navy-hover", palette.navy);
    var font = FONT_MAP[theme.font] || FONT_MAP.vazir;
    setVar("--font-main", font);
    root.style.fontFamily = font;
    if (document.body) document.body.style.fontFamily = font;
    root.classList.toggle("gray-theme", isGray);
    root.classList.toggle("claude-theme", isClaude);
    if (document.body) {
      document.body.classList.toggle("gray-theme", isGray);
      document.body.classList.toggle("claude-theme", isClaude);
    }
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