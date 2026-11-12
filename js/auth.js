/* =================================
   MADAR - AUTH HELPER
   بعد از config.js لود شود.
   توکن ورود را نگه می‌دارد؛ در صفحه‌های محافظت‌شده (مثل داشبورد) استفاده کن:

     <script src="../js/config.js"></script>
     <script src="../js/auth.js"></script>
     <script>Auth.requireAuth().then(user => { if (user) showPage(user); });</script>
================================= */

const Auth = (() => {
  const KEY = "madar_token";
  const LOGIN_PAGE = "../لاگین و ثبت نام/لاگین.html";

  function read(store) {
    try { return store.getItem(KEY); } catch { return null; }
  }

  function get() {
    return read(localStorage) || read(sessionStorage);
  }

  function clear() {
    try { localStorage.removeItem(KEY); } catch {}
    try { sessionStorage.removeItem(KEY); } catch {}
  }

  /** remember = true → بعد از بستن مرورگر هم می‌ماند؛ false → فقط تا بستن تب. */
  function save(token, remember = true) {
    clear();
    if (!token) return;
    try { (remember ? localStorage : sessionStorage).setItem(KEY, token); } catch {}
  }

  function headers() {
    const token = get();
    return token ? { Authorization: "Bearer " + token } : {};
  }

  /** کاربر فعلی را از سرور می‌گیرد؛ اگر وارد نشده یا توکن منقضی باشد null. */
  async function me() {
    if (!get()) return null;
    const res = await fetch(API.profile, { headers: headers() });
    if (res.status === 401) { clear(); return null; }
    if (!res.ok) throw new Error("PROFILE_REQUEST_FAILED");
    return (await res.json()).user;
  }

  /** اگر کاربر وارد نشده باشد به صفحه‌ی ورود می‌فرستد. */
  async function requireAuth(loginPage = LOGIN_PAGE) {
    if (!get()) { location.replace(loginPage); return null; }
    try {
      const user = await me();
      if (!user) location.replace(loginPage);
      return user;
    } catch {
      return null; // سرور در دسترس نیست؛ کاربر را بیرون نمی‌اندازیم.
    }
  }

  function logout(loginPage = LOGIN_PAGE) {
    clear();
    location.replace(loginPage);
  }

  return Object.freeze({ save, get, clear, headers, me, requireAuth, logout });
})();