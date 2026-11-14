
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

  // پنل مدیریت — بعد از ورود با نقش admin به اینجا می‌رود
  // اگر GitHub Pages روی مخزن A- فعال است:
  adminDashboard: "https://rjrbyjtj-creator.github.io/A-/modir.html",
});

const API_CONFIG = Object.freeze({
  baseURL: API_BASE_URL,
  timeout: 15000,
});
