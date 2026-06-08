(function () {
  const menuButton = document.querySelector("[data-menu-button]");
  const mobileMenu = document.querySelector("[data-mobile-menu]");

  if (menuButton && mobileMenu) {
    menuButton.addEventListener("click", function () {
      mobileMenu.classList.toggle("is-open");
      document.body.classList.toggle("menu-open", mobileMenu.classList.contains("is-open"));
    });
  }

  const hero = document.querySelector("[data-hero]");

  if (hero) {
    const slides = Array.from(hero.querySelectorAll("[data-hero-slide]"));
    const dots = Array.from(hero.querySelectorAll("[data-hero-dot]"));
    const prev = hero.querySelector("[data-hero-prev]");
    const next = hero.querySelector("[data-hero-next]");
    let index = 0;
    let timer = null;

    const show = function (nextIndex) {
      if (!slides.length) {
        return;
      }
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === index);
      });
    };

    const start = function () {
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5000);
    };

    const restart = function () {
      window.clearInterval(timer);
      start();
    };

    if (prev) {
      prev.addEventListener("click", function () {
        show(index - 1);
        restart();
      });
    }

    if (next) {
      next.addEventListener("click", function () {
        show(index + 1);
        restart();
      });
    }

    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener("click", function () {
        show(dotIndex);
        restart();
      });
    });

    start();
  }

  const filterAreas = Array.from(document.querySelectorAll("[data-card-filter]"));

  filterAreas.forEach(function (area) {
    const input = area.querySelector("[data-search-input]");
    const cards = Array.from(area.querySelectorAll("[data-movie-card]"));
    const empty = area.querySelector("[data-empty-state]");
    const chips = Array.from(area.querySelectorAll("[data-filter-chip]"));
    const activeFilters = {};

    const apply = function () {
      const query = input ? input.value.trim().toLowerCase() : "";
      let visibleCount = 0;

      cards.forEach(function (card) {
        const haystack = (card.dataset.search || "").toLowerCase();
        const queryMatch = !query || haystack.indexOf(query) !== -1;
        const filterMatch = Object.keys(activeFilters).every(function (field) {
          const value = activeFilters[field];
          return !value || (card.dataset[field] || "").indexOf(value) !== -1;
        });
        const visible = queryMatch && filterMatch;
        card.classList.toggle("is-hidden", !visible);
        if (visible) {
          visibleCount += 1;
        }
      });

      if (empty) {
        empty.classList.toggle("is-visible", visibleCount === 0);
      }
    };

    if (input) {
      const params = new URLSearchParams(window.location.search);
      const initial = params.get("q");
      if (initial) {
        input.value = initial;
      }
      input.addEventListener("input", apply);
    }

    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        const field = chip.dataset.filterField;
        const value = chip.dataset.filterValue || "";
        if (!field) {
          return;
        }
        activeFilters[field] = value;
        chips
          .filter(function (item) {
            return item.dataset.filterField === field;
          })
          .forEach(function (item) {
            item.classList.toggle("is-active", item === chip);
          });
        apply();
      });
    });

    apply();
  });
})();
