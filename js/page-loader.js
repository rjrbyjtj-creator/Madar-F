/* MADAR — لودر مربعی بین صفحات (بدون هدر/متن) */
(function () {
  if (window.__madarPageLoader) return;
  window.__madarPageLoader = true;

  function syncTheme() {
    try {
      var t = localStorage.getItem("theme");
      if (t === "dark" || t === "light") {
        document.documentElement.dataset.theme = t;
        return;
      }
      var cached = localStorage.getItem("madar_active_theme");
      if (cached) {
        var th = JSON.parse(cached);
        if (th && th.mode) document.documentElement.dataset.theme = th.mode;
      }
    } catch (e) {}
  }
  syncTheme();

  function ensureCss() {
    if (document.getElementById("madar-page-loader-css")) return;
    var link = document.createElement("link");
    link.id = "madar-page-loader-css";
    link.rel = "stylesheet";
    var src = "./css/page-loader.css";
    try {
      var scripts = document.getElementsByTagName("script");
      for (var i = 0; i < scripts.length; i++) {
        var s = scripts[i].src || "";
        if (s.indexOf("page-loader.js") !== -1) {
          src = s.replace(/js\/page-loader\.js(\?.*)?$/, "css/page-loader.css");
          break;
        }
        if (s.indexOf("config.js") !== -1) {
          src = s.replace(/js\/config\.js(\?.*)?$/, "css/page-loader.css");
          break;
        }
      }
    } catch (e) {}
    link.href = src;
    document.head.appendChild(link);
  }
  ensureCss();

  function createGridLoader(root, opts) {
    opts = opts || {};
    var jelly = opts.jelly != null ? opts.jelly : 1.6;
    var duration = opts.duration != null ? opts.duration : 1.7;
    var SQ = 24, STEP = SQ + 5, OUT = 36, WIND = 10, BASE = 2.2, N = 264, W = 13, dt = BASE / N;
    var els = [].slice.call(root.children);
    var start = [[STEP, STEP], [STEP, 0], [0, 0], [0, STEP]];
    var moves = [
      [0, 0, OUT, 0.02],
      [1, 1, STEP, 0.09],
      [2, 0, STEP, 0.17],
      [3, 1, -STEP, 0.25],
      [0, 0, WIND, 0.45, 11, 0.9],
      [0, 0, -(OUT + WIND), 0.54, 20, 0.98],
      [1, 0, -STEP, 0.554, 22, 0.7]
    ];

    function build(j) {
      var z = Math.max(0.5, 0.95 - 0.27 * j);
      function spring(s, w, zz) {
        if (s <= 0) return 0;
        var wd = w * Math.sqrt(1 - zz * zz);
        return 1 - Math.exp(-zz * w * s) * (Math.cos(wd * s) + ((zz * w) / wd) * Math.sin(wd * s));
      }
      var k = 1 - Math.exp(-dt / 0.035);
      return els.map(function (_, e) {
        var P = [0, 1].map(function (a) {
          return Array.from({ length: N + 1 }, function (_, i) {
            var v = start[e][a];
            for (var mi = 0; mi < moves.length; mi++) {
              var m = moves[mi];
              if (m[0] === e && m[1] === a) {
                var w = m[4] != null ? m[4] : W;
                var zz = m[5] != null ? m[5] : z;
                v += m[2] * spring((i / N - m[3]) * BASE, w, zz);
              }
            }
            return v;
          });
        });
        var D = P.map(function (p) {
          function at(i) {
            return p[Math.min(Math.max(i, 0), N)];
          }
          var sp = p.map(function (_, i) {
            return Math.abs(at(i + 1) - at(i - 1)) / (2 * dt) / (0.5 * W * STEP);
          });
          var lp = 0;
          return sp.map(function (s, i) {
            var n = sp[Math.min(i + 1, N)] - sp[Math.max(i - 1, 0)];
            var dec = Math.max(0, -n / (2 * dt)) / (0.7 * W);
            lp += (j * (0.17 * s - 0.1 * dec) - lp) * k;
            return 0.3 * Math.tanh(lp / 0.3);
          });
        });
        return P[0].map(function (x, i) {
          var dx = D[0][i],
            dy = D[1][i];
          return {
            transform:
              "translate3d(" +
              x.toFixed(2) +
              "px," +
              P[1][i].toFixed(2) +
              "px,0) scale(" +
              (1 + dx - 0.8 * dy).toFixed(4) +
              "," +
              (1 + dy - 0.8 * dx).toFixed(4) +
              ")"
          };
        });
      });
    }

    var frames = build(jelly);
    var anims = els.map(function (el, i) {
      return el.animate(frames[i], {
        duration: BASE * 1000,
        iterations: Infinity,
        easing: "linear"
      });
    });
    var t0 = document.timeline ? document.timeline.currentTime : 0;
    anims.forEach(function (a) {
      a.startTime = t0;
      a.updatePlaybackRate(BASE / duration);
    });
    return {
      destroy: function () {
        anims.forEach(function (a) {
          a.cancel();
        });
      }
    };
  }

  var overlay = null;
  var animCtrl = null;
  var hideTimer = null;
  var navigating = false;

  function mount() {
    if (overlay) return overlay;
    overlay = document.createElement("div");
    overlay.id = "madar-page-loader";
    overlay.setAttribute("aria-hidden", "true");
    overlay.innerHTML =
      '<div class="mpl-stage"><div class="flat-grid-loader" role="status" aria-label="در حال بارگذاری">' +
      "<span></span><span></span><span></span><span></span></div></div>";
    (document.body || document.documentElement).appendChild(overlay);
    var reduce = false;
    try {
      reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch (e) {}
    var loader = overlay.querySelector(".flat-grid-loader");
    animCtrl = createGridLoader(loader, reduce ? { jelly: 0.3, duration: 3.2 } : { jelly: 1.6, duration: 1.7 });
    return overlay;
  }

  function show() {
    mount();
    syncTheme();
    clearTimeout(hideTimer);
    overlay.classList.remove("leaving");
    void overlay.offsetWidth;
    overlay.classList.add("on");
    overlay.setAttribute("aria-hidden", "false");
  }

  function hide(soft) {
    if (!overlay) return;
    clearTimeout(hideTimer);
    if (soft === false) {
      overlay.classList.remove("on", "leaving");
      return;
    }
    overlay.classList.add("leaving");
    overlay.classList.remove("on");
    hideTimer = setTimeout(function () {
      if (overlay) {
        overlay.classList.remove("leaving");
        overlay.setAttribute("aria-hidden", "true");
      }
    }, 400);
  }

  function sameOrigin(href) {
    try {
      var u = new URL(href, location.href);
      return u.origin === location.origin;
    } catch (e) {
      return false;
    }
  }

  function shouldHandle(a) {
    if (!a || a.target === "_blank" || a.hasAttribute("download")) return false;
    var href = a.getAttribute("href");
    if (!href || href.charAt(0) === "#" || href.indexOf("javascript:") === 0 || href.indexOf("mailto:") === 0)
      return false;
    if (a.dataset.noLoader === "1") return false;
    return sameOrigin(href);
  }

  document.addEventListener(
    "click",
    function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest && e.target.closest("a[href]");
      if (!shouldHandle(a)) return;
      var href = a.href;
      if (href === location.href) return;
      navigating = true;
      show();
      setTimeout(function () {
        location.href = href;
      }, 180);
      e.preventDefault();
    },
    true
  );

  function onReady() {
    if (navigating) return;
    mount();
    show();
    var done = function () {
      hideTimer = setTimeout(function () {
        hide(true);
      }, 320);
    };
    if (document.readyState === "complete") done();
    else window.addEventListener("load", done, { once: true });
  }

  if (document.body) onReady();
  else document.addEventListener("DOMContentLoaded", onReady);

  window.addEventListener("pageshow", function (ev) {
    navigating = false;
    if (ev.persisted) hide(false);
  });

  window.MadarLoader = { show: show, hide: hide };
})();
