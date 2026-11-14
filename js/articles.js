(function () {
  "use strict";
  var grid = document.getElementById("articles-grid");
  if (!grid) return;

  var fallbackArticles = [{
    slug: "hesaban-11",
    title: "بهترین روش مطالعه حسابان یازدهم",
    excerpt: "راهنمایی کاربردی برای یادگیری مفهومی حسابان یازدهم؛ از فهم درس و حل تمرین تا مرور هدفمند.",
    category: "ریاضی و یادگیری",
    readTime: 8,
    coverImage: "https://rjrbyjtj-creator.github.io/Madar-F/عکس%20ها/2.png",
    url: "./articles/hesaban-11/index.html",
    featured: true
  }];

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char];
    });
  }

  function render(articles) {
    if (!Array.isArray(articles) || !articles.length) {
      grid.innerHTML = '<div class="articles-empty">هنوز مقاله‌ای منتشر نشده است.</div>';
      return;
    }

    grid.innerHTML = articles.slice(0, 6).map(function (article, index) {
      var url = article.url || ("./articles/" + encodeURIComponent(article.slug || "") + "/index.html");
      var image = article.coverImage
        ? '<img src="' + escapeHtml(article.coverImage) + '" alt="" loading="lazy" onerror="this.parentElement.classList.add(\'is-empty\');this.remove()">'
        : "";
      return '<a class="article-card' + (index === 0 ? ' article-card--featured' : '') + '" href="' + escapeHtml(url) + '">' +
        '<div class="article-card__cover">' + image + '<span class="article-card__category">' + escapeHtml(article.category || "مقاله آموزشی") + '</span></div>' +
        '<div class="article-card__content">' +
          '<div><span class="article-card__eyebrow">مجله آموزشی مدار</span><h3>' + escapeHtml(article.title) + '</h3>' +
          '<p>' + escapeHtml(article.excerpt || "") + '</p></div>' +
          '<div class="article-card__bottom"><span>' + escapeHtml(article.readTime || 5) + ' دقیقه مطالعه</span><span class="article-card__arrow" aria-hidden="true">←</span></div>' +
        '</div></a>';
    }).join("");
  }

  fetch("https://madar-jmy5.onrender.com/api/articles", { method: "GET", cache: "no-store" })
    .then(function (response) {
      if (!response.ok) throw new Error("ARTICLES_HTTP_" + response.status);
      return response.json();
    })
    .then(function (data) {
      if (!data || data.ok !== true || !Array.isArray(data.articles)) throw new Error("INVALID_ARTICLES_RESPONSE");
      render(data.articles);
    })
    .catch(function () {
      render(fallbackArticles);
    });
})();