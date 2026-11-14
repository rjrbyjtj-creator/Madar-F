/* =================================
   MADAR - FRONTEND CONFIGURATION
================================= */

/* آدرس بک‌اند روی سرور Render */
const API_BASE_URL = "https://madar-jmy5.onrender.com/api";

const API = Object.freeze({
  // Authentication
  sendCode: `${API_BASE_URL}/auth/register/send-code`,
  verify: `${API_BASE_URL}/auth/register/verify`,
  login: `${API_BASE_URL}/auth/login`,

  // Password recovery
  forgotPassword: `${API_BASE_URL}/auth/forgot-password/send-code`,
  resetPassword: `${API_BASE_URL}/auth/forgot-password/reset`,

  // User
  profile: `${API_BASE_URL}/users/me`,

  // مراحل نوار پیشرفت بعد از تأیید کد
  createAccount: "",
  runTasks: "",
  saveProfile: "",
  prepare: "",

  // Dashboard دانش‌آموز / کاربر عادی
  dashboard: "../داشبورد/رستا _ فضای کار (1).html",

  // پنل مدیریت — بعد از ورود با نقش admin
  adminDashboard: "https://rjrbyjtj-creator.github.io/A-/",
});

const API_CONFIG = Object.freeze({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

/* بارگذاری خودکار تم + لودر انتقال صفحه */
(function () {
  function sibling(name) {
    var src = "../js/" + name;
    try {
      var scripts = document.getElementsByTagName("script");
      for (var i = 0; i < scripts.length; i++) {
        var s = scripts[i].src || "";
        if (s.indexOf("config.js") !== -1) {
          src = s.replace(/config\.js(\?.*)?$/, name);
          break;
        }
      }
    } catch (e) {}
    return src;
  }
  function load(name, flag) {
    if (window[flag]) return;
    window[flag] = true;
    var el = document.createElement("script");
    el.src = sibling(name);
    el.async = true;
    document.head.appendChild(el);
  }
  load("theme.js", "__madarThemeLoaded");
  load("page-loader.js", "__madarPageLoaderScript");
})();
