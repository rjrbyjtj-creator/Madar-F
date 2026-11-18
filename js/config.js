/* =================================
   MADAR - FRONTEND CONFIGURATION
================================= */

/* آدرس بک‌اند عمومی سایت */
const API_BASE_URL = "https://madar-jmy5.onrender.com/api";

/* سرویس جدید ثبت‌نام و ارسال/تأیید کد ایمیل روی Railway */
const AUTH_API_BASE_URL = "https://madar-railway-production.up.railway.app/api";

const API = Object.freeze({
  // Authentication
  sendCode: `${AUTH_API_BASE_URL}/auth/register/send-code`,
  verify: `${AUTH_API_BASE_URL}/auth/register/verify`,
  login: `${API_BASE_URL}/auth/login`,

  // Password recovery
  forgotPassword: `${API_BASE_URL}/auth/forgot-password/send-code`,
  resetPassword: `${API_BASE_URL}/auth/forgot-password/reset`,

  // User
  profile: `${API_BASE_URL}/users/me`,
  plans: `${API_BASE_URL}/plans`,
  exams: `${AUTH_API_BASE_URL}/exams`,

  // مراحل نوار پیشرفت بعد از تأیید کد
  createAccount: "",
  runTasks: "",
  saveProfile: "",
  prepare: "",

  // Dashboard دانش‌آموز / کاربر عادی
  dashboard: "../داشبورد/رستا _ فضای کار (1).html",

  // پنل مدیریت — بعد از ورود با نقش admin
  adminDashboard: "https://rjrbyjtj-creator.github.io/Madar-F/admin/",
});

const API_CONFIG = Object.freeze({
  baseURL: API_BASE_URL,
  timeout: 15000,
});


/* =================================
   MADAR - SHARED API ROUTER
   Sticky client-side balancing between Render and Railway.
   Email OTP -> Railway; Telegram delivery -> Render.
================================= */
(function installMadarApiRouter() {
  if (window.__madarApiRouterInstalled) return;
  window.__madarApiRouterInstalled = true;

  var RENDER = "https://madar-jmy5.onrender.com/api";
  var RAILWAY = "https://madar-railway-production.up.railway.app/api";
  var KEY = "madar_api_primary_backend";
  var nativeFetch = window.fetch.bind(window);
  var primary = RENDER;

  function readPrimary() {
    try {
      var saved = localStorage.getItem(KEY);
      if (saved === "render") return RENDER;
      if (saved === "railway") return RAILWAY;
      // Existing sessions were previously authenticated against Render.
      if (localStorage.getItem("madar_token") || sessionStorage.getItem("madar_token")) return RENDER;
    } catch (e) {}
    return Math.random() < 0.5 ? RENDER : RAILWAY;
  }

  function savePrimary(origin) {
    primary = origin;
    try { localStorage.setItem(KEY, origin === RENDER ? "render" : "railway"); } catch (e) {}
  }

  savePrimary(readPrimary());

  var lastHealthCheck = 0;
  var healthPromise = null;

  function health(origin) {
    var url = origin.replace(/\/api$/, "") + "/health";
    var controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    var timer = controller ? setTimeout(function () { controller.abort(); }, 4500) : null;
    return nativeFetch(url, {
      method: "GET",
      cache: "no-store",
      ...(controller ? { signal: controller.signal } : {})
    }).then(function (response) {
      return response.ok;
    }).catch(function () {
      return false;
    }).finally(function () {
      if (timer) clearTimeout(timer);
    });
  }

  function refreshHealth() {
    if (Date.now() - lastHealthCheck < 20000) return Promise.resolve(primary);
    if (healthPromise) return healthPromise;
    healthPromise = Promise.all([health(RENDER), health(RAILWAY)]).then(function (states) {
      lastHealthCheck = Date.now();
      var currentIndex = primary === RENDER ? 0 : 1;
      var otherIndex = currentIndex === 0 ? 1 : 0;
      if (!states[currentIndex] && states[otherIndex]) {
        savePrimary(otherIndex === 0 ? RENDER : RAILWAY);
      }
      return primary;
    }).finally(function () {
      healthPromise = null;
    });
    return healthPromise;
  }

  function requestUrl(input) {
    if (typeof input === "string") return input;
    if (input && typeof input.url === "string") return input.url;
    return "";
  }

  function replaceOrigin(url, origin) {
    return url.replace(/^https:\/\/madar-jmy5\.onrender\.com\/api|^https:\/\/madar-railway-production\.up\.railway\.app\/api/, origin);
  }

  function specialRoute(url, init, input) {
    var path = "";
    try { path = new URL(url).pathname; } catch (e) {}
    var method = String((init && init.method) || (input && input.method) || "GET").toUpperCase();
    var body = init && init.body;
    if (typeof body !== "string" && input && typeof input.clone === "function") {
      // Most Madar JSON requests pass init.body; Request bodies are handled below when available.
      try { body = null; } catch (e) {}
    }
    var payload = {};
    if (typeof body === "string") {
      try { payload = JSON.parse(body); } catch (e) {}
    }

    if (method === "POST" && path.endsWith("/auth/register/send-code")) {
      return payload.channel === "telegram" ? RENDER : RAILWAY;
    }
    if (method === "POST" && path.endsWith("/auth/register/verify")) {
      return payload.channel === "telegram" ? RENDER : RAILWAY;
    }
    if (path.endsWith("/auth/forgot-password/send-code") || path.endsWith("/auth/forgot-password/reset")) {
      return RENDER; // Password recovery uses the Telegram OTP service.
    }
    return null;
  }

  function fetchAt(url, input, init) {
    if (typeof Request !== "undefined" && input instanceof Request) {
      return nativeFetch(new Request(url, input), init);
    }
    return nativeFetch(url, init);
  }

  function hasAuthorization(input, init) {
    var headers = (init && init.headers) || (input && input.headers);
    if (!headers) return false;
    if (typeof headers.get === "function") return Boolean(headers.get("Authorization"));
    if (Array.isArray(headers)) {
      return headers.some(function (entry) {
        return String(entry[0]).toLowerCase() === "authorization" && Boolean(entry[1]);
      });
    }
    return Object.keys(headers).some(function (key) {
      return key.toLowerCase() === "authorization" && Boolean(headers[key]);
    });
  }

  window.fetch = async function (input, init) {
    var url = requestUrl(input);
    if (!url || (!url.startsWith(RENDER) && !url.startsWith(RAILWAY))) {
      return nativeFetch(input, init);
    }

    var pinned = specialRoute(url, init, input);
    if (pinned) savePrimary(pinned);
    else await refreshHealth();
    var target = pinned || primary;

    var method = String((init && init.method) || (input && input.method) || "GET").toUpperCase();
    var safeToRetry = method === "GET" || method === "HEAD" || method === "OPTIONS";
    var firstUrl = replaceOrigin(url, target);

    try {
      var response = await fetchAt(firstUrl, input, init);
      var authFallback = response.status === 401 && hasAuthorization(input, init);
      var serviceFallback = [502, 503, 504].includes(response.status);
      if (pinned || !safeToRetry || (!authFallback && !serviceFallback)) return response;
      var alternate = target === RENDER ? RAILWAY : RENDER;
      var alternateHealthy = await health(alternate);
      if (!alternateHealthy) return response;
      var retry = await fetchAt(replaceOrigin(url, alternate), input, init);
      if (retry.ok) savePrimary(alternate);
      return retry.ok ? retry : response;
    } catch (error) {
      if (pinned || !safeToRetry) throw error;
      var fallback = target === RENDER ? RAILWAY : RENDER;
      if (!(await health(fallback))) throw error;
      var retry = await fetchAt(replaceOrigin(url, fallback), input, init);
      if (retry.ok) savePrimary(fallback);
      return retry;
    }
  };

  window.MadarApiRouter = Object.freeze({
    getPrimary: function () { return primary === RENDER ? "Render" : "Railway"; },
    refresh: refreshHealth
  });
})();

/* بارگذاری خودکار تم فعال سایت */
(function () {
  if (window.__madarThemeLoaded) return;
  window.__madarThemeLoaded = true;
  var src = "../js/theme.js";
  try {
    var scripts = document.getElementsByTagName("script");
    for (var i = 0; i < scripts.length; i++) {
      var s = scripts[i].src || "";
      if (s.indexOf("config.js") !== -1) {
        src = s.replace(/config\.js(\?.*)?$/, "theme.js");
        break;
      }
    }
  } catch (e) {}
  var el = document.createElement("script");
  el.src = src;
  el.async = true;
  document.head.appendChild(el);
})();
