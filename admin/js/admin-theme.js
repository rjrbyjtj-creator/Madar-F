/* MADAR ADMIN — inherit the active public-site theme */
(function () {
  "use strict";
  var API = "https://madar-jmy5.onrender.com/api/themes/active";
  var CACHE = "madar_active_theme";
  var root = document.documentElement;
  var aliases = {
    navy: ["--navy", "--navy-hover", "--primary", "--blue"],
    gold: ["--gold"],
    bg: ["--bg", "--blob"],
    surface: ["--surface"],
    text: ["--text"],
    muted: ["--muted", "--light"],
    line: ["--line"],
    green: ["--green"]
  };
  function apply(theme) {
    if (!theme || !theme.colors) return;
    var c = theme.colors, dark = theme.mode === "dark";
    var values = {
      navy: c.navy, gold: c.gold, bg: dark ? "#0f172a" : c.bg,
      surface: dark ? "#1e293b" : c.surface,
      text: dark ? "#f1f5f9" : c.text,
      muted: dark ? "#94a3b8" : c.muted,
      line: dark ? "#334155" : c.line,
      green: c.green
    };
    Object.keys(aliases).forEach(function (key) {
      aliases[key].forEach(function (name) {
        root.style.setProperty(name, values[key]);
        if (document.body) document.body.style.setProperty(name, values[key]);
      });
    });
    root.dataset.theme = dark ? "dark" : "light";
    if (document.body) document.body.classList.toggle("dark", dark);
    try { localStorage.setItem(CACHE, JSON.stringify(theme)); } catch (e) {}
  }
  try {
    var cached = localStorage.getItem(CACHE);
    if (cached) apply(JSON.parse(cached));
  } catch (e) {}
  fetch(API, { cache: "no-store" }).then(function (r) {
    if (!r.ok) throw new Error("theme unavailable");
    return r.json();
  }).then(function (d) { if (d && d.theme) apply(d.theme); }).catch(function () {});
  window.addEventListener("storage", function (e) {
    if (e.key === CACHE && e.newValue) {
      try { apply(JSON.parse(e.newValue)); } catch (err) {}
    }
  });
})();