(() => {
  const ready = (callback) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  };

  const loadScript = (src) => new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      existing.addEventListener("load", resolve, { once: true });
      if (window.Hls) {
        resolve();
      }
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });

  const normalize = (value) => (value || "").toString().trim().toLowerCase();

  const setupImages = () => {
    document.querySelectorAll("img").forEach((image) => {
      image.addEventListener("error", () => {
        const frame = image.closest(".poster-frame, .hero-poster, .rank-cover");
        if (frame) {
          frame.classList.add("image-error");
        }
      }, { once: true });
    });
  };

  const setupMenu = () => {
    const button = document.querySelector("[data-menu-button]");
    const nav = document.querySelector("[data-mobile-nav]");
    if (!button || !nav) {
      return;
    }

    button.addEventListener("click", () => {
      nav.classList.toggle("open");
    });
  };

  const setupHero = () => {
    const hero = document.querySelector("[data-hero]");
    if (!hero) {
      return;
    }

    const slides = [...hero.querySelectorAll("[data-hero-slide]")];
    const dots = [...hero.querySelectorAll("[data-hero-dot]")];
    if (slides.length <= 1) {
      return;
    }

    let index = 0;
    const show = (nextIndex) => {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach((slide, position) => {
        slide.classList.toggle("active", position === index);
      });
      dots.forEach((dot, position) => {
        dot.classList.toggle("active", position === index);
      });
    };

    dots.forEach((dot, position) => {
      dot.addEventListener("click", () => show(position));
    });

    window.setInterval(() => show(index + 1), 5200);
  };

  const setupFilters = () => {
    const list = document.querySelector("[data-filter-list]");
    if (!list) {
      return;
    }

    const cards = [...list.querySelectorAll("[data-card]")];
    const input = document.querySelector("[data-filter-input]");
    const yearSelect = document.querySelector("[data-filter-year]");
    const regionSelect = document.querySelector("[data-filter-region]");
    const count = document.querySelector("[data-filter-count]");
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");

    if (q && input) {
      input.value = q;
    }

    const apply = () => {
      const keyword = normalize(input && input.value);
      const year = normalize(yearSelect && yearSelect.value);
      const region = normalize(regionSelect && regionSelect.value);
      let visible = 0;

      cards.forEach((card) => {
        const haystack = normalize([
          card.dataset.title,
          card.dataset.year,
          card.dataset.region,
          card.dataset.genre,
          card.dataset.tags,
        ].join(" "));
        const cardYear = normalize(card.dataset.year);
        const cardRegion = normalize(card.dataset.region);
        const matchedKeyword = !keyword || haystack.includes(keyword);
        const matchedYear = !year || cardYear.includes(year);
        const matchedRegion = !region || cardRegion.includes(region);
        const matched = matchedKeyword && matchedYear && matchedRegion;

        card.classList.toggle("is-hidden", !matched);
        if (matched) {
          visible += 1;
        }
      });

      if (count) {
        count.textContent = visible.toString();
      }
    };

    [input, yearSelect, regionSelect].forEach((control) => {
      if (control) {
        control.addEventListener("input", apply);
        control.addEventListener("change", apply);
      }
    });

    apply();
  };

  const setupPlayer = () => {
    const video = document.querySelector("#movie-player");
    const start = document.querySelector("[data-player-start]");
    if (!video || !start) {
      return;
    }

    const source = video.dataset.src;
    let initialized = false;

    const initialize = async () => {
      if (initialized || !source) {
        return;
      }
      initialized = true;

      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = source;
      } else {
        await loadScript("https://cdn.jsdelivr.net/npm/hls.js@1");
        if (window.Hls && window.Hls.isSupported()) {
          const hls = new window.Hls({
            enableWorker: true,
            lowLatencyMode: false,
          });
          hls.loadSource(source);
          hls.attachMedia(video);
        } else {
          video.src = source;
        }
      }
    };

    start.addEventListener("click", async () => {
      start.classList.add("is-hidden");
      try {
        await initialize();
        await video.play();
      } catch (error) {
        start.classList.remove("is-hidden");
        start.querySelector("strong").textContent = "播放加载失败，请重试";
        console.warn("Player error:", error);
      }
    });

    video.addEventListener("play", () => start.classList.add("is-hidden"));
  };

  ready(() => {
    setupImages();
    setupMenu();
    setupHero();
    setupFilters();
    setupPlayer();
  });
})();
