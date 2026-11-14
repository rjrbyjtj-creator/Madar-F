/* MADAR — بارگذاری تم فعال از بک‌اند و اعمال روی کل سایت */
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
    var map = {
      "--navy": c.navy,
      "--primary": c.navy,
      "--gold": c.gold,
      "--bg": c.bg,
      "--green": c.green,
      "--ok": c.green,
      "--text": c.text || null,
      "--muted": c.muted || null,
      "--surface": c.surface || null,
      "--card": c.surface || null,
      "--line": c.line || null,
      "--blue": c.navy || null
    };
    Object.keys(map).forEach(function (k) {
      if (map[k]) root.style.setProperty(k, map[k]);
    });
    if (theme.font && FONT_MAP[theme.font]) {
      root.style.setProperty("--font-main", FONT_MAP[theme.font]);
      document.body && (document.body.style.fontFamily = FONT_MAP[theme.font]);
    }
    if (theme.mode === "dark") {
      root.dataset.theme = "dark";
      document.body && document.body.classList.add("dark");
    } else {
      root.dataset.theme = "light";
      document.body && document.body.classList.remove("dark");
    }
    try {
      localStorage.setItem("madar_active_theme", JSON.stringify(theme));
    } catch (e) {}
  }

  function fromCache() {
    try {
      var raw = localStorage.getItem("madar_active_theme");
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  var cached = fromCache();
  if (cached) apply(cached);

  fetch(API)
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (d) {
      if (d && d.theme) apply(d.theme);
    })
    .catch(function () {});
})();
