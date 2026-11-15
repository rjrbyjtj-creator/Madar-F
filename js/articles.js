(function () {
  "use strict";

  var grid = document.getElementById("articles-grid");
  if (!grid) return;

  var articleUrl = "https://rjrbyjtj-creator.github.io/Madar-F/articles/hesaban-11/index.html";
  var articleImage = "https://rjrbyjtj-creator.github.io/Madar-F/عکس%20ها/2.png";

  var fallbackArticles = [{
    slug: "hesaban-11",
    title: "بهترین روش مطالعه حسابان یازدهم",
    excerpt: "با رعایت سه نکته کلیدی، برنامه‌ریزی اصولی، یادگیری مفهومی و تمرین زیاد، در حسابان یازدهم بدرخشید.",
    category: "ریاضی و یادگیری",
    readTime: 5,
    coverImage: articleImage,
    url: articleUrl,
    featured: true
  }];


  var introArticles = [
  {
    "slug": "madar-platform-guide",
    "title": "سایت مدار چیست؟ راهنمای امکانات آموزشی و تحصیلی",
    "excerpt": "با سایت مدار آشنا شوید؛ راهنمای بخش‌های آموزشی، مقالات، آزمون‌ها، برنامه‌ریزی درسی و دستیار هوشمند برای دانش‌آموزان.",
    "category": "معرفی مدار",
    "readTime": 6,
    "coverImage": "https://rjrbyjtj-creator.github.io/Madar-F/عکس%20ها/2.png",
    "url": "https://rjrbyjtj-creator.github.io/Madar-F/articles/madar-platform-guide/",
    "featured": false
  },
  {
    "slug": "study-planning-with-madar",
    "title": "چگونه با برنامه‌ریزی درسی در مدار مطالعه منظم‌تری داشته باشیم؟",
    "excerpt": "راهنمای عملی برنامه‌ریزی درسی برای دانش‌آموزان؛ هدف‌گذاری، تقسیم زمان، ثبت فعالیت‌ها و بازبینی برنامه با کمک ابزار برنامه‌ریزی مدار.",
    "category": "برنامه‌ریزی درسی",
    "readTime": 7,
    "coverImage": "https://rjrbyjtj-creator.github.io/Madar-F/عکس%20ها/2.png",
    "url": "https://rjrbyjtj-creator.github.io/Madar-F/articles/study-planning-with-madar/",
    "featured": false
  },
  {
    "slug": "madar-ai-study-assistant",
    "title": "دستیار هوشمند مدار چگونه به دانش‌آموزان کمک می‌کند؟",
    "excerpt": "راهنمای استفاده بهتر از چت‌بات هوشمند مدار برای پرسش‌های درسی، توضیح مفاهیم و گفت‌وگو درباره برنامه مطالعه؛ همراه با نکات بررسی پاسخ‌ها.",
    "category": "دستیار هوشمند",
    "readTime": 6,
    "coverImage": "https://rjrbyjtj-creator.github.io/Madar-F/عکس%20ها/2.png",
    "url": "https://rjrbyjtj-creator.github.io/Madar-F/articles/madar-ai-study-assistant/",
    "featured": false
  }
];

  // تصاویر اختصاصی و یکپارچه مقالات؛ مستقل از coverImage دریافتی از API
  var articleCovers = {
    "hesaban-11": "./عکس ها/articles/hesaban.svg",
    "madar-platform-guide": "./عکس ها/articles/madar-platform.svg",
    "study-planning-with-madar": "./عکس ها/articles/study-planning.svg",
    "madar-ai-study-assistant": "./عکس ها/articles/ai-assistant.svg"
  };

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char];
    });
  }

  function card(article, className, index) {
    var url = escapeHtml(article.url || articleUrl);
    var title = escapeHtml(article.title || "مقاله آموزشی");
    var category = escapeHtml(article.category || "مقاله آموزشی");
    var readTime = escapeHtml(article.readTime || 5);
    var imageUrl = article.coverImage || article.image || "";
    var image = imageUrl
      ? '<img src="' + escapeHtml(imageUrl) + '" alt="' + title + '" loading="lazy" onerror="this.remove()">'
      : "";

    if (className === "a-big") {
      return '<a href="' + url + '" class="box acard lift a-big">' +
        '<div class="thumb">' + image + '</div>' +
        '<div class="abody"><span class="tag"><i></i>' + category + '</span>' +
        '<div><h3>' + title + '</h3></div>' +
        '<div class="afoot"><span class="abtn"><svg class="i"><use href="#i-back"/></svg></span>' +
        '<span class="meta"><span class="dt"><svg class="i"><use href="#i-clock"/></svg>' + readTime + ' دقیقه مطالعه</span></span></div></div></a>';
    }

    if (className === "a-tall") {
      return '<a href="' + url + '" class="box acard lift a-tall">' +
        '<div class="thumb">' + image + '</div>' +
        '<div class="abody"><h3>' + title + '</h3>' +
        '<div class="afoot"><span class="abtn"><svg class="i"><use href="#i-back"/></svg></span>' +
        '<span class="meta"><span class="dt"><svg class="i"><use href="#i-clock"/></svg>' + readTime + ' دقیقه مطالعه</span></span></div></div></a>';
    }

    return '<a href="' + url + '" class="box acard lift a-sm">' +
      '<div class="abody"><h3>' + title + '</h3>' +
      '<div class="afoot"><span class="abtn"><svg class="i"><use href="#i-back"/></svg></span>' +
      '<span class="meta"><span class="dt"><svg class="i"><use href="#i-clock"/></svg>' + readTime + ' دقیقه مطالعه</span></span></div></div>' +
      '<div class="thumb">' + image + '</div></a>';
  }

  function render(articles) {
    grid.setAttribute("aria-busy", "false");
    if (!Array.isArray(articles) || !articles.length) {
      grid.classList.add("art-grid--single");
      grid.innerHTML = '<div class="box acard a-big"><div class="abody"><h3>هنوز مقاله‌ای منتشر نشده است.</h3></div></div>';
      return;
    }

    var ordered = articles.slice(0, 4);
    ordered.forEach(function (article) {
      if (article && articleCovers[article.slug]) article.coverImage = articleCovers[article.slug];
    });
    grid.classList.toggle("art-grid--single", ordered.length === 1);

    // ترتیب DOM دقیقاً مانند طرح اولیه حفظ می‌شود تا جای‌گذاری CSS کارت‌ها تغییر نکند:
    // کارت بلند، دو کارت کوچک، سپس کارت شاخص بزرگ.
    var markup = [];
    if (ordered[1]) markup.push(card(ordered[1], "a-tall", 1));
    if (ordered[2]) markup.push(card(ordered[2], "a-sm", 2));
    if (ordered[3]) markup.push(card(ordered[3], "a-sm", 3));
    markup.push(card(ordered[0], "a-big", 0));
    grid.innerHTML = markup.join("");
  }

  var controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  var timeoutId = setTimeout(function () {
    if (controller) controller.abort();
  }, 7000);

  fetch("https://madar-jmy5.onrender.com/api/articles", {
    method: "GET",
    cache: "no-store",
    signal: controller ? controller.signal : undefined
  })
    .then(function (response) {
      if (!response.ok) throw new Error("ARTICLES_HTTP_" + response.status);
      return response.json();
    })
    .then(function (data) {
      if (!data || data.ok !== true || !Array.isArray(data.articles)) {
        throw new Error("INVALID_ARTICLES_RESPONSE");
      }
      var publishedArticle = data.articles.find(function (item) {
        return item.slug === "hesaban-11";
      });
      var otherArticles = data.articles.filter(function (item) {
        return item.slug !== "hesaban-11";
      });
      var seen = {};
      var combined = [publishedArticle || fallbackArticles[0]].concat(otherArticles, introArticles);
      render(combined.filter(function (item) {
        if (!item || seen[item.slug]) return false;
        seen[item.slug] = true;
        return true;
      }));
    })
    .catch(function () {
      render(fallbackArticles.concat(introArticles));
    })
    .finally(function () {
      clearTimeout(timeoutId);
    });
})();
