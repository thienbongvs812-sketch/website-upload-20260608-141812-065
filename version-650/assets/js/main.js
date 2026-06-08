(function () {
    function qs(selector, root) {
        return (root || document).querySelector(selector);
    }

    function qsa(selector, root) {
        return Array.prototype.slice.call((root || document).querySelectorAll(selector));
    }

    function initMenu() {
        var toggle = qs("[data-menu-toggle]");
        var menu = qs("[data-mobile-menu]");
        if (!toggle || !menu) {
            return;
        }
        toggle.addEventListener("click", function () {
            menu.classList.toggle("is-open");
        });
    }

    function initHero() {
        var hero = qs("[data-hero]");
        if (!hero) {
            return;
        }
        var slides = qsa("[data-hero-slide]", hero);
        var dots = qsa("[data-hero-dot]", hero);
        var prev = qs("[data-hero-prev]", hero);
        var next = qs("[data-hero-next]", hero);
        if (!slides.length) {
            return;
        }
        var index = 0;
        var timer = null;
        function show(nextIndex) {
            index = (nextIndex + slides.length) % slides.length;
            slides.forEach(function (slide, i) {
                slide.classList.toggle("is-active", i === index);
            });
            dots.forEach(function (dot, i) {
                dot.classList.toggle("is-active", i === index);
            });
        }
        function play() {
            clearInterval(timer);
            timer = setInterval(function () {
                show(index + 1);
            }, 5200);
        }
        dots.forEach(function (dot, i) {
            dot.addEventListener("click", function () {
                show(i);
                play();
            });
        });
        if (prev) {
            prev.addEventListener("click", function () {
                show(index - 1);
                play();
            });
        }
        if (next) {
            next.addEventListener("click", function () {
                show(index + 1);
                play();
            });
        }
        hero.addEventListener("mouseenter", function () {
            clearInterval(timer);
        });
        hero.addEventListener("mouseleave", play);
        play();
    }

    function initSearch() {
        var form = qs("[data-search-form]");
        if (!form) {
            return;
        }
        var input = qs("[data-search-input]", form);
        var year = qs("[data-year-filter]", form);
        var empty = qs("[data-empty-state]");
        var cards = qsa("[data-card]");
        function matchYear(cardYear, filterYear) {
            if (!filterYear) {
                return true;
            }
            var y = parseInt(cardYear || "0", 10);
            var f = parseInt(filterYear, 10);
            if (filterYear === "2010") {
                return y >= 2010 && y <= 2019;
            }
            if (filterYear === "2000") {
                return y >= 2000 && y <= 2009;
            }
            return y === f;
        }
        function apply() {
            var keyword = (input && input.value ? input.value : "").trim().toLowerCase();
            var filterYear = year && year.value ? year.value : "";
            var visible = 0;
            cards.forEach(function (card) {
                var haystack = [
                    card.getAttribute("data-title") || "",
                    card.getAttribute("data-region") || "",
                    card.getAttribute("data-type") || "",
                    card.getAttribute("data-year") || "",
                    card.textContent || ""
                ].join(" ").toLowerCase();
                var ok = (!keyword || haystack.indexOf(keyword) !== -1) && matchYear(card.getAttribute("data-year"), filterYear);
                card.hidden = !ok;
                if (ok) {
                    visible += 1;
                }
            });
            if (empty) {
                empty.hidden = visible !== 0;
            }
        }
        form.addEventListener("submit", function (event) {
            event.preventDefault();
            apply();
        });
        if (input) {
            input.addEventListener("input", apply);
        }
        if (year) {
            year.addEventListener("change", apply);
        }
    }

    window.initMoviePlayer = function (source) {
        var video = document.getElementById("moviePlayer");
        var overlay = qs("[data-player-overlay]");
        if (!video || !source) {
            return;
        }
        var attached = false;
        function attach() {
            if (attached) {
                return;
            }
            attached = true;
            if (video.canPlayType("application/vnd.apple.mpegurl")) {
                video.src = source;
            } else if (window.Hls && window.Hls.isSupported()) {
                var hls = new window.Hls({
                    enableWorker: true,
                    lowLatencyMode: true
                });
                hls.loadSource(source);
                hls.attachMedia(video);
            } else {
                video.src = source;
            }
        }
        function start() {
            attach();
            video.controls = true;
            if (overlay) {
                overlay.classList.add("is-hidden");
            }
            var request = video.play();
            if (request && typeof request.catch === "function") {
                request.catch(function () {});
            }
        }
        if (overlay) {
            overlay.addEventListener("click", start);
        }
        video.addEventListener("click", function () {
            if (video.paused) {
                start();
            }
        });
    };

    document.addEventListener("DOMContentLoaded", function () {
        initMenu();
        initHero();
        initSearch();
    });
})();
