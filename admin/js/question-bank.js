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
  function gradeLabel(value) { return ({ "10": "دهم", "11": "یازدهم", "12": "دوازدهم" })[String(value)] || String(value || ""); }
  function formData(question) {
    return {
      question: question, subject: $("subject").value.trim(), grade: $("grade").value,
      chapter: $("chapter").value.trim(), questionType: $("type").value,
      difficulty: $("difficulty").value, source: $("source").value.trim()
    };
  }
  function status(message, error) {
    $("formStatus").textContent = message || "";
    $("formStatus").classList.toggle("error", Boolean(error));
  }
  function render(items, total, files) {
    $("totalCount").textContent = Number(total || 0).toLocaleString("fa-IR");
    $("listCount").textContent = Number(items.length || 0).toLocaleString("fa-IR") + " مورد";
    $("subjectCount").textContent = new Set(items.map(function (x) { return x.subject; })).size.toLocaleString("fa-IR");
    if (!items.length) {
      $("questionList").innerHTML = '<div class="qb-empty">برای این فیلتر هنوز نمونه سؤالی ثبت نشده است.</div>';
    } else {
      var groups = {};
      items.forEach(function (item) {
        var key = item.grade + "||" + item.subject;
        (groups[key] = groups[key] || []).push(item);
      });
      $("questionList").innerHTML = Object.keys(groups).map(function (key) {
        var group = groups[key], first = group[0];
        return '<div class="qb-group"><h3 style="font-size:1.1rem;color:var(--navy);margin:.7rem 0">پایه ' + gradeLabel(first.grade) + ' · ' + escapeHtml(first.subject) + ' <small style="color:var(--muted)">(' + group.length.toLocaleString("fa-IR") + ')</small></h3>' +
          group.map(function (item) {
            var tags = [item.chapter, item.questionType, item.difficulty, item.source]
              .filter(Boolean).map(function (tag) { return '<span class="qb-tag">' + escapeHtml(tag) + '</span>'; }).join("");
            return '<article class="qb-item"><div class="qb-meta"><span class="qb-tag">پایه ' + gradeLabel(item.grade) + '</span><span class="qb-tag">' + escapeHtml(item.subject) + '</span>' + tags +
              '</div><div class="qb-question">' + escapeHtml(item.question) +
              '</div><div class="qb-item-foot"><span>ذخیره‌شده در Turso</span><button class="qb-delete" type="button" data-delete="' +
              escapeHtml(item.id) + '">حذف نمونه</button></div></article>';
          }).join("") + '</div>';
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
    files = files || [];
    $("filesList").innerHTML = files.length ? files.map(function (file) {
      return '<article class="qb-item"><div class="qb-meta"><span class="qb-tag">پایه ' + gradeLabel(file.grade) + '</span><span class="qb-tag">' + escapeHtml(file.subject) + '</span><span class="qb-tag">' + escapeHtml(file.mimeType) + '</span></div>' +
        '<div class="qb-question">' + escapeHtml(file.fileName) + '</div><div class="qb-item-foot"><span>' + (Number(file.fileSize) / 1024 / 1024).toFixed(2) + ' MB · ' + Number(file.questionCount || 0).toLocaleString("fa-IR") + ' سؤال استخراج‌شده</span>' +
        '<button class="qb-delete" type="button" data-file-delete="' + escapeHtml(file.id) + '">حذف فایل</button></div></article>';
    }).join("") : '<div class="qb-empty">هنوز فایلی بارگذاری نشده است.</div>';
    $("filesList").querySelectorAll("[data-file-delete]").forEach(function (button) {
      button.addEventListener("click", async function () {
        if (!confirm("فایل از فهرست فعال بانک سؤال حذف شود؟")) return;
        button.disabled = true;
        try { await request(API + "/files/" + encodeURIComponent(button.dataset.fileDelete), { method: "DELETE", headers: authHeaders(false) }); await load(); }
        catch (error) { alert(error.message); button.disabled = false; }
      });
    });
  }
  async function load() {
    if (!token()) { $("questionList").innerHTML = '<div class="qb-empty">برای مشاهده بانک سؤال وارد حساب مدیر شوید.</div>'; return; }
    $("questionList").innerHTML = '<div class="qb-empty">در حال دریافت…</div>';
    try {
      var params = new URLSearchParams();
      var query = $("searchInput").value.trim(), grade = $("gradeFilter").value, subject = $("subjectFilter").value.trim();
      if (query) params.set("q", query);
      if (grade) params.set("grade", grade);
      if (subject) params.set("subject", subject);
      var data = await request(API + (params.toString() ? "?" + params.toString() : ""), { headers: authHeaders(false), cache: "no-store" });
      render(data.items || [], data.total || 0, data.files || []);
    } catch (error) {
      $("questionList").innerHTML = '<div class="qb-empty">' + escapeHtml(error.message) + '</div>';
    }
  }
  $("questionForm").addEventListener("submit", async function (event) {
    event.preventDefault();
    var payload = formData($("question").value.trim());
    if (!payload.subject || !payload.grade || payload.question.length < 10) { status("درس، پایه و متن کامل سؤال را وارد کن.", true); return; }
    $("saveBtn").disabled = true; status("در حال ثبت نمونه سؤال در پایگاه داده…");
    try {
      await request(API, { method: "POST", headers: authHeaders(true), body: JSON.stringify(payload) });
      $("question").value = ""; status("نمونه سؤال در بانک ذخیره شد."); await load();
    } catch (error) { status(error.message, true); }
    finally { $("saveBtn").disabled = false; }
  });
  $("bulkBtn").addEventListener("click", async function () {
    var file = $("bulkFile").files && $("bulkFile").files[0];
    if (!file) { status("ابتدا یک فایل PDF یا TXT انتخاب کن.", true); return; }
    if (!$("subject").value.trim() || !$("grade").value) { status("برای فایل، درس و پایه را مشخص کن.", true); return; }
    var mime = file.type || (file.name.toLowerCase().endsWith(".pdf") ? "application/pdf" : "text/plain");
    if (mime !== "application/pdf" && mime !== "text/plain") { status("فرمت فایل پشتیبانی نمی‌شود.", true); return; }
    $("bulkBtn").disabled = true; status("در حال بارگذاری و ذخیره فایل در Turso…");
    try {
      var params = new URLSearchParams({ subject: $("subject").value.trim(), grade: $("grade").value, chapter: $("chapter").value.trim() });
      var result = await request(API + "/files?" + params.toString(), {
        method: "POST",
        headers: { Authorization: "Bearer " + token(), "Content-Type": mime, "X-File-Name": encodeURIComponent(file.name) },
        body: file
      });
      $("bulkFile").value = "";
      status(result.message || "فایل در پایگاه داده ذخیره شد.");
      await load();
    } catch (error) { status(error.message, true); }
    finally { $("bulkBtn").disabled = false; }
  });
  var timer;
  function scheduleLoad() { clearTimeout(timer); timer = setTimeout(load, 350); }
  $("searchInput").addEventListener("input", scheduleLoad);
  $("subjectFilter").addEventListener("input", scheduleLoad);
  $("gradeFilter").addEventListener("change", load);
  $("refreshBtn").addEventListener("click", load);
  load();
})();