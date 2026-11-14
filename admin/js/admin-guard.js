/* پنل مدیریت مدار — فقط نقش admin */
(function () {
  var API_BASE = "https://madar-jmy5.onrender.com/api";
  var LOGIN_URL =
    "https://rjrbyjtj-creator.github.io/Madar-F/%D9%84%D8%A7%DA%AF%DB%8C%D9%86%20%D9%88%20%D8%AB%D8%A8%D8%AA%20%D9%86%D8%A7%D9%85/%D9%84%D8%A7%DA%AF%DB%8C%D9%86.html";
  var KEY = "madar_token";

  function getToken() {
    try {
      return localStorage.getItem(KEY) || sessionStorage.getItem(KEY);
    } catch (e) {
      return null;
    }
  }

  function clearToken() {
    try {
      localStorage.removeItem(KEY);
      sessionStorage.removeItem(KEY);
    } catch (e) {}
  }

  async function guard() {
    var token = getToken();
    if (!token) {
      location.replace(LOGIN_URL);
      return;
    }
    try {
      var res = await fetch(API_BASE + "/users/me", {
        headers: { Authorization: "Bearer " + token },
      });
      if (res.status === 401) {
        clearToken();
        location.replace(LOGIN_URL);
        return;
      }
      if (!res.ok) return;
      var data = await res.json();
      var user = data.user;
      if (!user || user.role !== "admin") {
        alert("این صفحه فقط برای مدیر سامانه است.");
        location.replace(LOGIN_URL);
        return;
      }
      var nameEl = document.querySelector(".user-btn span");
      if (nameEl && user.name) nameEl.textContent = user.name;
      var hero = document.querySelector(".hero-body h1");
      if (hero && user.name) hero.textContent = "سلام، " + user.name + " عزیز!";
    } catch (e) {
      console.warn("Admin auth check failed", e);
    }
  }

  guard();

  var userBtn = document.querySelector(".user-btn");
  if (userBtn) {
    userBtn.addEventListener("dblclick", function () {
      if (confirm("خروج از حساب مدیر؟")) {
        clearToken();
        location.replace(LOGIN_URL);
      }
    });
  }
})();
