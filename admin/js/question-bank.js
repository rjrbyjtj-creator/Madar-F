(function () {
  "use strict";
  var API = "https://madar-jmy5.onrender.com/api/admin/question-bank";
  var $ = function (id) { return document.getElementById(id); };
  function token() {
    try { return localStorage.getItem("madar_token") || sessionStorage.getItem("madar_token") || ""; }
    catch (_) { return ""; }
  }
  function authHeaders(json) {
    var headers = { Authorization: "Bearer " + token() };
    if (json) headers["Content-Type"] = "application/json";
    return headers;
  }
  async function request(url, options) {
    var response = await fetch(url, options || {});
    var data = await response.json().catch(function () { return {}; });
    if (!response.ok) throw new Error(data.message || "ارتباط با سرور ناموفق بود.");
    return data;
  }
  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, function (char) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char];
    });
  }
  function formData(question) {
    return {
      question: question,
      subject: $("subject").value.trim(),
      grade: $("grade").value.trim(),
      chapter: $("chapter").value.trim(),
      questionType: $("type").value,
      difficulty: $("difficulty").value,
      source: $("source").value.trim()
    };
  }
  function status(message, error) {
    $("formStatus").textContent = message || "";
    $("formStatus").classList.toggle("error", Boolean(error));
  }
  function render(items, total) {
    $("totalCount").textContent = Number(total || 0).toLocaleString("fa-IR");
    $("listCount").textContent = Number(total || 0).toLocaleString("fa-IR") + " مورد";
    $("subjectCount").textContent = new Set(items.map(function (x) { return x.subject; })).size.toLocaleString("fa-IR");
    if (!items.length) {
      $("questionList").innerHTML = '<div class="qb-empty">هنوز نمونه سؤالی ثبت نشده است.<br>از فرم کنار صفحه اولین نمونه را اضافه کن.</div>';
      return;
    }
    $("questionList").innerHTML = items.map(function (item) {
      var tags = [item.subject, item.grade, item.chapter, item.questionType, item.difficulty, item.source]
        .filter(Boolean).map(function (tag) { return '<span class="qb-tag">' + escapeHtml(tag) + '</span>'; }).join("");
      return '<article class="qb-item"><div class="qb-meta">' + tags + '</div><div class="qb-question">' + escapeHtml(item.question) +
        '</div><div class="qb-item-foot"><span>ثبت‌شده در بانک اختصاصی مدار</span><button class="qb-delete" type="button" data-delete="' +
        escapeHtml(item.id) + '">حذف نمونه</button></div></article>';
    }).join("");
    $("questionList").querySelectorAll("[data-delete]").forEach(function (button) {
      button.addEventListener("click", async function () {
        if (!confirm("این نمونه از بانک سؤال غیرفعال شود؟")) return;
        button.disabled = true;
        try { await request(API + "/" + encodeURIComponent(button.dataset.delete), { method: "DELETE", headers: authHeaders(false) }); await load(); }
        catch (error) { alert(error.message); button.disabled = false; }
      });
    });
  }
  async function load() {
    if (!token()) { $("questionList").innerHTML = '<div class="qb-empty">برای مشاهده بانک سؤال وارد حساب مدیر شوید.</div>'; return; }
    $("questionList").innerHTML = '<div class="qb-empty">در حال دریافت…</div>';
    try {
      var query = $("searchInput").value.trim();
      var data = await request(API + (query ? "?q=" + encodeURIComponent(query) : ""), { headers: authHeaders(false), cache: "no-store" });
      render(data.items || [], data.total || 0);
    } catch (error) {
      $("questionList").innerHTML = '<div class="qb-empty">' + escapeHtml(error.message) + '</div>';
    }
  }
  $("questionForm").addEventListener("submit", async function (event) {
    event.preventDefault();
    var payload = formData($("question").value.trim());
    if (!payload.subject || payload.question.length < 10) { status("درس و متن کامل سؤال را وارد کن.", true); return; }
    $("saveBtn").disabled = true; status("در حال ثبت نمونه سؤال…");
    try {
      await request(API, { method: "POST", headers: authHeaders(true), body: JSON.stringify(payload) });
      $("question").value = "";
      status("نمونه سؤال با موفقیت به بانک اضافه شد.");
      await load();
    } catch (error) { status(error.message, true); }
    finally { $("saveBtn").disabled = false; }
  });
  $("bulkBtn").addEventListener("click", async function () {
    var file = $("bulkFile").files && $("bulkFile").files[0];
    if (!file) { status("ابتدا یک فایل TXT یا CSV انتخاب کن.", true); return; }
    if (!$("subject").value.trim()) { status("برای ورود گروهی، ابتدا درس را مشخص کن.", true); return; }
    $("bulkBtn").disabled = true; status("در حال خواندن فایل…");
    try {
      var text = await file.text();
      var blocks = text.replace(/\r/g, "").split(/\n\s*\n+/).map(function (part) { return part.trim(); }).filter(function (part) { return part.length >= 10; });
      if (blocks.length < 1) throw new Error("سؤال قابل‌خواندنی در فایل پیدا نشد. هر سؤال را با یک خط خالی جدا کن.");
      var created = 0;
      for (var i = 0; i < blocks.length; i++) {
        var payload = formData(blocks[i]);
        await request(API, { method: "POST", headers: authHeaders(true), body: JSON.stringify(payload) });
        created++;
        status("ثبت " + created.toLocaleString("fa-IR") + " از " + blocks.length.toLocaleString("fa-IR") + " سؤال…");
      }
      $("bulkFile").value = "";
      status(created.toLocaleString("fa-IR") + " نمونه سؤال وارد بانک شد.");
      await load();
    } catch (error) { status(error.message, true); }
    finally { $("bulkBtn").disabled = false; }
  });
  var timer;
  $("searchInput").addEventListener("input", function () {
    clearTimeout(timer);
    timer = setTimeout(load, 350);
  });
  $("refreshBtn").addEventListener("click", load);
  load();
})();