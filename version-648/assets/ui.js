(function () {
  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  function normalize(value) {
    return (value || "").toString().trim().toLowerCase();
  }

  ready(function () {
    var toggle = document.querySelector("[data-nav-toggle]");
    var nav = document.querySelector("[data-site-nav]");

    if (toggle && nav) {
      toggle.addEventListener("click", function () {
        nav.classList.toggle("open");
      });
    }

    var hero = document.querySelector("[data-hero]");
    if (hero) {
      var slides = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-slide]"));
      var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
      var prev = hero.querySelector("[data-hero-prev]");
      var next = hero.querySelector("[data-hero-next]");
      var current = 0;
      var timer;

      function show(index) {
        if (!slides.length) {
          return;
        }

        current = (index + slides.length) % slides.length;

        slides.forEach(function (slide, slideIndex) {
          slide.classList.toggle("active", slideIndex === current);
        });

        dots.forEach(function (dot, dotIndex) {
          dot.classList.toggle("active", dotIndex === current);
        });
      }

      function start() {
        stop();
        timer = window.setInterval(function () {
          show(current + 1);
        }, 5200);
      }

      function stop() {
        if (timer) {
          window.clearInterval(timer);
        }
      }

      dots.forEach(function (dot, index) {
        dot.addEventListener("click", function () {
          show(index);
          start();
        });
      });

      if (prev) {
        prev.addEventListener("click", function () {
          show(current - 1);
          start();
        });
      }

      if (next) {
        next.addEventListener("click", function () {
          show(current + 1);
          start();
        });
      }

      hero.addEventListener("mouseenter", stop);
      hero.addEventListener("mouseleave", start);
      show(0);
      start();
    }

    var searchInputs = Array.prototype.slice.call(document.querySelectorAll("[data-search-input]"));
    var filterButtons = Array.prototype.slice.call(document.querySelectorAll("[data-filter]"));
    var cards = Array.prototype.slice.call(document.querySelectorAll("[data-movie-card]"));
    var empty = document.querySelector("[data-empty-state]");

    if (cards.length) {
      var params = new URLSearchParams(window.location.search);
      var initialQuery = params.get("q") || "";
      var selectedCategory = "all";

      searchInputs.forEach(function (input) {
        if (initialQuery) {
          input.value = initialQuery;
        }

        input.addEventListener("input", applyFilters);
      });

      filterButtons.forEach(function (button) {
        button.addEventListener("click", function () {
          selectedCategory = button.getAttribute("data-filter") || "all";

          filterButtons.forEach(function (item) {
            item.classList.toggle("active", item === button);
          });

          applyFilters();
        });
      });

      function applyFilters() {
        var query = normalize(searchInputs.map(function (input) {
          return input.value;
        }).join(" "));
        var visible = 0;

        cards.forEach(function (card) {
          var text = normalize(card.getAttribute("data-search-text"));
          var category = card.getAttribute("data-category") || "";
          var matchText = !query || text.indexOf(query) !== -1;
          var matchCategory = selectedCategory === "all" || category === selectedCategory;
          var isVisible = matchText && matchCategory;

          card.classList.toggle("is-hidden", !isVisible);

          if (isVisible) {
            visible += 1;
          }
        });

        if (empty) {
          empty.classList.toggle("show", visible === 0);
        }
      }

      applyFilters();
    }
  });
})();
