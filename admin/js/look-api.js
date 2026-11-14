document.getElementById('themeToggle').addEventListener('click', function () {
  var dark = !document.body.classList.contains('dark');
  if (window.MadarAdminSetMode) window.MadarAdminSetMode(dark ? "dark" : "light");
  else document.body.classList.toggle('dark', dark);
  document.getElementById('swDark').setAttribute('aria-checked', dark);
  document.getElementById('swLight').setAttribute('aria-checked', !dark);
});

(function () {
  var API = "https://madar-jmy5.onrender.com/api/themes";
  var KEY = "madar_token";
  var COLOR_KEYS = [
    { key: "navy", label: "اصلی / سرمه‌ای", css: "--navy" },
    { key: "gold", label: "طلایی / تاکید", css: "--gold" },
    { key: "bg", label: "پس‌زمینه", css: "--bg" },
    { key: "green", label: "سبز / موفقیت", css: "--green" },
    { key: "text", label: "متن", css: "--text" },
    { key: "muted", label: "متن کم‌رنگ", css: "--muted" },
    { key: "surface", label: "سطح کارت", css: "--surface" },
    { key: "line", label: "خط / حاشیه", css: "--line" }
  ];
  var DEF = {
    navy: "#1c2b4b", gold: "#d4b16a", bg: "#f5f7fb", green: "#22c55e",
    text: "#1e293b", muted: "#64748b", surface: "#ffffff", line: "#e3e8f0"
  };
  var SUGGESTED = [
    {
      id: "sug-madar", slug: "madar", name: "مدار (پیش‌فرض)", font: "vazir", mode: "light",
      colors: {
        navy: "#1c2b4b", gold: "#d4b16a", bg: "#f5f7fb", green: "#22c55e",
        text: "#1e293b", muted: "#64748b", surface: "#ffffff", line: "#e3e8f0"
      }
    },
    {
      id: "sug-gray", slug: "gray", name: "خاکستری", font: "vazir", mode: "light",
      colors: {
        navy: "#343a40", gold: "#858b93", bg: "#f3f4f6", green: "#64748b",
        text: "#24292f", muted: "#747b84", surface: "#ffffff", line: "#dfe3e8"
      }
    }
  ];
  var state = {
    colors: Object.assign({}, DEF),
    font: "vazir",
    mode: "light",
    selectedId: null,
    selectedName: "مدار",
    themes: []
  };
  window.MadarAdminSetMode = function (mode) { state.mode = mode; applyPreview(); };

  function token() {
    try { return localStorage.getItem(KEY) || sessionStorage.getItem(KEY); } catch (e) { return null; }
  }
  function headers(json) {
    var h = {};
    if (json) h["Content-Type"] = "application/json";
    var t = token();
    if (t) h.Authorization = "Bearer " + t;
    return h;
  }
  async function api(path, opt) {
    var r = await fetch(API + path, opt || {});
    var d = {};
    try { d = await r.json(); } catch (e) {}
    if (!r.ok) throw new Error(d.message || "خطای سرور");
    return d;
  }
  function say(m) {
    var t = document.getElementById("lkToast");
    if (!t) return;
    t.textContent = m;
    t.classList.add("show");
    clearTimeout(t._x);
    t._x = setTimeout(function () { t.classList.remove("show"); }, 2200);
  }
  function applyPreview() {
    var root = document.documentElement;
    COLOR_KEYS.forEach(function (c) {
      var v = state.colors[c.key];
      if (v) { root.style.setProperty(c.css, v); if (document.body) document.body.style.setProperty(c.css, v); }
    });
    root.style.setProperty("--primary", state.colors.navy);
    root.style.setProperty("--blue", state.colors.navy);
    if (document.body) { document.body.style.setProperty("--primary", state.colors.navy); document.body.style.setProperty("--blue", state.colors.navy); }
    var fonts = { vazir: "'Vazirmatn',sans-serif", tahoma: "Tahoma,sans-serif", system: "system-ui,sans-serif" };
    var fs = document.getElementById("fs");
    if (fs) {
      fs.style.fontFamily = fonts[state.font] || fonts.vazir;
      var sz = document.getElementById("sSize");
      if (sz) fs.style.setProperty("--fz", sz.value + "px");
    }
    var pv = document.getElementById("pv");
    if (pv) pv.dataset.mode = state.mode;
    document.body.classList.toggle("dark", state.mode === "dark");
    var sD = document.getElementById("swDark"), sL = document.getElementById("swLight");
    if (sD) sD.setAttribute("aria-checked", state.mode === "dark");
    if (sL) sL.setAttribute("aria-checked", state.mode !== "dark");
  }
  function renderColorVars() {
    var box = document.getElementById("colorVars");
    if (!box) return;
    box.innerHTML = COLOR_KEYS.map(function (c) {
      var val = state.colors[c.key] || DEF[c.key] || "#000000";
      return '<div class="cv" data-k="' + c.key + '">' +
        '<input type="color" value="' + val + '" aria-label="' + c.label + '" />' +
        '<div class="meta"><strong>' + c.label + '</strong><code>' + c.css + '</code></div>' +
        '<span class="hex">' + val + '</span></div>';
    }).join("");
    box.querySelectorAll("input[type=color]").forEach(function (inp) {
      inp.addEventListener("input", function () {
        var k = inp.closest(".cv").dataset.k;
        state.colors[k] = inp.value;
        inp.closest(".cv").querySelector(".hex").textContent = inp.value;
        applyPreview();
      });
    });
  }
  function miniDots(c) {
    c = c || {};
    return ["navy", "gold", "bg", "green"].map(function (k) {
      return '<b style="background:' + (c[k] || "#ccc") + '"></b>';
    }).join("");
  }
  function renderThemes() {
    var cards = document.getElementById("themeCards");
    if (cards) {
      cards.innerHTML = SUGGESTED.map(function (t) {
        var on = state.selectedId === t.id || state.selectedName === t.name;
        return '<button type="button" class="pv-pal' + (on ? ' on' : '') + '" data-sug="' + t.id + '">' +
          '<span class="dots">' + miniDots(t.colors) + '</span>' +
          '<span>' + t.name + '</span>' +
          (t.id === "sug-madar" ? '<span class="badge">پیش‌فرض</span>' : '') +
          '</button>';
      }).join("");
    }
    var list = document.getElementById("palList");
    if (!list) return;
    if (!state.themes.length) {
      list.innerHTML = "";
      return;
    }
    list.innerHTML = state.themes.map(function (t) {
      return '<button type="button" class="' + (t.isActive || t.id === state.selectedId ? 'on' : '') + '" data-id="' + t.id + '">' +
        (t.isActive ? '● ' : '') + t.name + '</button>';
    }).join("");
  }
  function pickSuggested(s) {
    state.selectedId = s.id;
    state.selectedName = s.name;
    state.colors = Object.assign({}, DEF, s.colors);
    state.font = s.font || "vazir";
    state.mode = s.mode || "light";
    var sf = document.getElementById("sFont");
    if (sf) sf.value = state.font;
    renderColorVars();
    renderThemes();
    applyPreview();
  }
  function selectTheme(t) {
    state.selectedId = t.id;
    state.selectedName = t.name;
    state.colors = Object.assign({}, DEF, t.colors || {});
    state.font = t.font || "vazir";
    state.mode = t.mode || "light";
    var sf = document.getElementById("sFont");
    if (sf) sf.value = state.font;
    renderColorVars();
    renderThemes();
    applyPreview();
  }
  async function load() {
    try {
      var d = await api("", { headers: headers() });
      state.themes = d.themes || [];
      var active = state.themes.find(function (t) { return t.isActive; });
      if (active) selectTheme(active);
      else pickSuggested(SUGGESTED[0]);
    } catch (e) {
      pickSuggested(SUGGESTED[0]);
    }
  }
  async function saveAndActivate() {
    var btn = document.getElementById("lkSave");
    if (btn) btn.disabled = true;
    try {
      var colors = {
        navy: state.colors.navy, gold: state.colors.gold, bg: state.colors.bg, green: state.colors.green,
        text: state.colors.text, muted: state.colors.muted, surface: state.colors.surface, line: state.colors.line
      };
      var font = (document.getElementById("sFont") || {}).value || state.font || "vazir";
      var mode = state.mode || "light";
      var preset = SUGGESTED.find(function (item) { return item.id === state.selectedId; });
      var id = state.selectedId;
      var payload = { colors: colors, font: font, mode: mode };
      if (preset) {
        var existingPreset = state.themes.find(function (t) { return t.slug === preset.slug; });
        if (existingPreset) {
          await api("/" + existingPreset.id, {
            method: "PUT", headers: headers(true),
            body: JSON.stringify({ name: preset.name, colors: colors, font: font, mode: mode })
          });
          id = existingPreset.id;
        } else {
          var createdPreset = await api("", {
            method: "POST", headers: headers(true),
            body: JSON.stringify({ name: preset.name, slug: preset.slug, colors: colors, font: font, mode: mode })
          });
          id = createdPreset.theme && createdPreset.theme.id;
        }
      } else if (id && state.themes.some(function (t) { return t.id === id; })) {
        await api("/" + id, {
          method: "PUT", headers: headers(true),
          body: JSON.stringify(Object.assign({ name: state.selectedName }, payload))
        });
      } else {
        throw new Error("ابتدا یکی از تم‌های موجود را انتخاب کن.");
      }
      if (!id) throw new Error("شناسه تم برای فعال‌سازی دریافت نشد.");
      await api("/" + id + "/activate", { method: "POST", headers: headers() });
      say("تم ذخیره شد و در همه صفحات سایت فعال شد");
      await load();
      if (window.MadarTheme && window.MadarTheme.refresh) window.MadarTheme.refresh().catch(function () {});
    } catch (e) {
      say(e.message || "ذخیره نشد");
    } finally {
      if (btn) btn.disabled = false;
    }
  }
  document.getElementById("themeCards").addEventListener("click", function (e) {
    var btn = e.target.closest(".pv-pal");
    if (!btn) return;
    var s = SUGGESTED.find(function (x) { return x.id === btn.dataset.sug; });
    if (s) pickSuggested(s);
  });
  document.getElementById("palList").addEventListener("click", function (e) {
    var btn = e.target.closest("button[data-id]");
    if (!btn) return;
    var t = state.themes.find(function (x) { return x.id === btn.dataset.id; });
    if (t) selectTheme(t);
  });
  document.getElementById("lkSave").onclick = saveAndActivate;
  document.getElementById("lkReset").onclick = function () {
    pickSuggested(SUGGESTED[0]);
    say("بازگشت به پالت پیش‌فرض مدار");
  };
  var sFont = document.getElementById("sFont");
  if (sFont) sFont.onchange = function () { state.font = this.value; applyPreview(); };
  var sSize = document.getElementById("sSize");
  if (sSize) sSize.onchange = applyPreview;
  var sRad = document.getElementById("sRad");
  if (sRad) sRad.onchange = function () {
    document.getElementById("look").style.setProperty("--rad", this.value + "rem");
  };
  var sGap = document.getElementById("sGap");
  if (sGap) sGap.onchange = function () {
    document.getElementById("look").style.setProperty("--gap", this.value + "rem");
  };
  document.getElementById("swDark").onclick = function () { state.mode = "dark"; applyPreview(); };
  document.getElementById("swLight").onclick = function () { state.mode = "light"; applyPreview(); };

  load();
})();
