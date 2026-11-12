/* =================================
   MADAR - FRONTEND CONFIGURATION
================================= */

/* آدرس بک‌اند. روی سرور واقعی به آدرس دامنه‌ی خودت عوض کن، مثل https://api.example.com/api */
const API_BASE_URL = "http://localhost:5000/api";

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

  // مراحل نوار پیشرفت بعد از تأیید کد (فعلاً نمایشی؛ حساب در مرحله‌ی verify ساخته می‌شود)
  createAccount: "",
  runTasks: "",
  saveProfile: "",
  prepare: "",

  // Dashboard
  dashboard: "../داشبورد/رستا _ فضای کار (1).html",
});

const API_CONFIG = Object.freeze({
  baseURL: API_BASE_URL,
  timeout: 15000,
});