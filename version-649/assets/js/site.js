(function () {
  function ready(fn) {
    if (document.readyState !== "loading") {
      fn();
    } else {
      document.addEventListener("DOMContentLoaded", fn);
    }
  }

  ready(function () {
    initImages();
    initMobileNav();
    initHero();
    initSearchForms();
    initSearchPage();
    initFilters();
    initPlayers();
  });

  function initImages() {
    document.querySelectorAll("img").forEach(function (img) {
      if (img.complete && img.naturalWidth === 0) {
        img.classList.add("is-missing");
      }
      img.addEventListener("error", function () {
        img.classList.add("is-missing");
      }, { once: true });
    });
  }

  function initMobileNav() {
    var toggle = document.querySelector("[data-mobile-toggle]");
    var panel = document.querySelector("[data-mobile-panel]");
    if (!toggle || !panel) {
      return;
    }
    toggle.addEventListener("click", function () {
      panel.classList.toggle("is-open");
    });
  }

  function initHero() {
    var hero = document.querySelector("[data-hero]");
    if (!hero) {
      return;
    }
    var slides = Array.prototype.slice.call(hero.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dots] button"));
    var prev = hero.querySelector("[data-hero-prev]");
    var next = hero.querySelector("[data-hero-next]");
    var active = 0;
    var timer = null;

    function show(index) {
      active = (index + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle("is-active", i === active);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle("is-active", i === active);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(active + 1);
      }, 5000);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    if (prev) {
      prev.addEventListener("click", function () {
        show(active - 1);
        start();
      });
    }
    if (next) {
      next.addEventListener("click", function () {
        show(active + 1);
        start();
      });
    }
    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () {
        show(i);
        start();
      });
    });
    hero.addEventListener("mouseenter", stop);
    hero.addEventListener("mouseleave", start);
    show(0);
    start();
  }

  function initSearchForms() {
    document.querySelectorAll("[data-site-search]").forEach(function (form) {
      form.addEventListener("submit", function (event) {
        var input = form.querySelector("input[name='q']");
        var root = form.getAttribute("data-root") || "";
        var query = input ? input.value.trim() : "";
        if (!query) {
          event.preventDefault();
          return;
        }
        event.preventDefault();
        window.location.href = root + "search.html?q=" + encodeURIComponent(query);
      });
    });
  }

  function initSearchPage() {
    var results = document.querySelector("[data-search-results]");
    var form = document.querySelector("[data-search-page-form]");
    var title = document.querySelector("[data-search-title]");
    var subtitle = document.querySelector("[data-search-subtitle]");
    var movies = window.SEARCH_MOVIES;
    if (!results || !form || !Array.isArray(movies)) {
      return;
    }
    var params = new URLSearchParams(window.location.search);
    var current = params.get("q") || "";
    var input = form.querySelector("input[name='q']");
    if (input) {
      input.value = current;
    }

    function render(query) {
      var keyword = query.trim().toLowerCase();
      if (!keyword) {
        return;
      }
      var items = movies.filter(function (movie) {
        var haystack = [
          movie.title,
          movie.summary,
          movie.year,
          movie.region,
          movie.type,
          movie.genre,
          movie.category,
          Array.isArray(movie.tags) ? movie.tags.join(" ") : ""
        ].join(" ").toLowerCase();
        return haystack.indexOf(keyword) !== -1;
      }).slice(0, 120);
      if (title) {
        title.textContent = "搜索结果";
      }
      if (subtitle) {
        subtitle.textContent = keyword ? "关键词：" + query.trim() : "可直接点击影片卡片进入详情页观看。";
      }
      if (!items.length) {
        results.innerHTML = '<p class="empty-state">暂无匹配内容</p>';
        return;
      }
      results.innerHTML = items.map(function (movie) {
        return [
          '<article class="movie-card">',
          '  <a class="poster-frame" href="' + escapeHtml(movie.url) + '" aria-label="' + escapeHtml(movie.title) + '">',
          '    <img src="' + escapeHtml(movie.cover) + '" alt="' + escapeHtml(movie.title) + '" loading="lazy">',
          '    <span class="play-badge">▶</span>',
          '  </a>',
          '  <div class="card-body">',
          '    <a class="card-title" href="' + escapeHtml(movie.url) + '">' + escapeHtml(movie.title) + '</a>',
          '    <p class="card-desc">' + escapeHtml(movie.summary || "") + '</p>',
          '    <div class="card-meta">',
          '      <span>★ ' + escapeHtml(String(movie.rating || "")) + '</span>',
          '      <span>' + escapeHtml(String(movie.year || "")) + '</span>',
          '      <span>' + escapeHtml(movie.region || "") + '</span>',
          '    </div>',
          '    <span class="card-category">' + escapeHtml(movie.category || "") + '</span>',
          '  </div>',
          '</article>'
        ].join("");
      }).join("");
      initImages();
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var query = input ? input.value.trim() : "";
      if (!query) {
        return;
      }
      var url = new URL(window.location.href);
      url.searchParams.set("q", query);
      window.history.replaceState({}, "", url.toString());
      render(query);
    });

    render(current);
  }

  function initFilters() {
    var toolbar = document.querySelector("[data-filter-toolbar]");
    var grid = document.querySelector("[data-filter-grid]");
    if (!toolbar || !grid) {
      return;
    }
    var cards = Array.prototype.slice.call(grid.querySelectorAll("[data-movie-card]"));
    var search = toolbar.querySelector("[data-filter-search]");
    var year = toolbar.querySelector("[data-filter-year]");
    var type = toolbar.querySelector("[data-filter-type]");
    var region = toolbar.querySelector("[data-filter-region]");
    var clear = toolbar.querySelector("[data-filter-clear]");
    var empty = document.querySelector("[data-empty-state]");

    function value(control) {
      return control ? control.value.trim().toLowerCase() : "";
    }

    function apply() {
      var keyword = value(search);
      var y = value(year);
      var t = value(type);
      var r = value(region);
      var visible = 0;
      cards.forEach(function (card) {
        var haystack = [
          card.getAttribute("data-title"),
          card.getAttribute("data-year"),
          card.getAttribute("data-region"),
          card.getAttribute("data-type"),
          card.getAttribute("data-genre"),
          card.getAttribute("data-tags")
        ].join(" ").toLowerCase();
        var ok = true;
        if (keyword && haystack.indexOf(keyword) === -1) {
          ok = false;
        }
        if (y && card.getAttribute("data-year") !== y) {
          ok = false;
        }
        if (t && (card.getAttribute("data-type") || "").toLowerCase() !== t) {
          ok = false;
        }
        if (r && (card.getAttribute("data-region") || "").toLowerCase() !== r) {
          ok = false;
        }
        card.hidden = !ok;
        if (ok) {
          visible += 1;
        }
      });
      if (empty) {
        empty.hidden = visible !== 0;
      }
    }

    [search, year, type, region].forEach(function (control) {
      if (control) {
        control.addEventListener("input", apply);
        control.addEventListener("change", apply);
      }
    });
    if (clear) {
      clear.addEventListener("click", function () {
        if (search) search.value = "";
        if (year) year.value = "";
        if (type) type.value = "";
        if (region) region.value = "";
        apply();
      });
    }
  }

  function initPlayers() {
    document.querySelectorAll(".js-player").forEach(function (video) {
      var source = video.querySelector("source");
      var src = source ? source.getAttribute("src") : "";
      if (!src) {
        return;
      }
      if (window.Hls && window.Hls.isSupported()) {
        var hls = new window.Hls({ enableWorker: true, lowLatencyMode: true });
        hls.loadSource(src);
        hls.attachMedia(video);
        video._hls = hls;
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = src;
      }
      var shell = video.closest(".video-shell");
      var overlay = shell ? shell.querySelector(".player-overlay") : null;
      if (overlay) {
        overlay.addEventListener("click", function () {
          overlay.classList.add("is-hidden");
          var playPromise = video.play();
          if (playPromise && typeof playPromise.catch === "function") {
            playPromise.catch(function () {});
          }
        });
        video.addEventListener("play", function () {
          overlay.classList.add("is-hidden");
        });
      }
    });
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
})();
