/* MADAR — تم فعال از بک‌اند روی کل سایت */
(function () {
  var API = "https://madar-jmy5.onrender.com/api/themes/active";
  var FONT_MAP = {
    vazir: "'Vazirmatn',Tahoma,sans-serif",
    tahoma: "Tahoma,sans-serif",
    system: "system-ui,-apple-system,sans-serif"
  };

  function apply(theme) {
    if (!theme || !theme.colors) return;
    var c = theme.colors;
    var root = document.documentElement;
    var pairs = [
      ["--navy", c.navy],
      ["--primary", c.navy],
      ["--blue", c.navy],
      ["--gold", c.gold],
      ["--bg", c.bg],
      ["--bg2", c.bg],
      ["--green", c.green],
      ["--ok", c.green],
      ["--text", c.text],
      ["--muted", c.muted],
      ["--surface", c.surface],
      ["--card", c.surface],
      ["--panel", c.surface],
      ["--field", c.surface],
      ["--line", c.line],
      ["--border", c.line]
    ];
    pairs.forEach(function (p) {
      if (p[1]) root.style.setProperty(p[0], p[1]);
    });
    if (theme.font && FONT_MAP[theme.font]) {
      root.style.setProperty("--font-main", FONT_MAP[theme.font]);
      if (document.body) document.body.style.fontFamily = FONT_MAP[theme.font];
    }
    if (theme.mode === "dark") {
      root.dataset.theme = "dark";
      if (document.body) document.body.classList.add("dark");
    } else {
      root.dataset.theme = "light";
      if (document.body) document.body.classList.remove("dark");
    }
    try { localStorage.setItem("madar_active_theme", JSON.stringify(theme)); } catch (e) {}
  }

  try {
    var raw = localStorage.getItem("madar_active_theme");
    if (raw) apply(JSON.parse(raw));
  } catch (e) {}

  fetch(API)
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (d) { if (d && d.theme) apply(d.theme); })
    .catch(function () {});
})();
