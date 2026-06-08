(function () {
    function ready(callback) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", callback);
        } else {
            callback();
        }
    }

    function text(value) {
        return (value || "").toString().toLowerCase().trim();
    }

    ready(function () {
        var nav = document.querySelector("[data-nav]");
        var toggle = document.querySelector("[data-menu-toggle]");
        var hero = document.querySelector("[data-hero]");

        if (nav) {
            var onScroll = function () {
                if (window.scrollY > 20) {
                    nav.classList.add("is-scrolled");
                } else {
                    nav.classList.remove("is-scrolled");
                }
            };
            onScroll();
            window.addEventListener("scroll", onScroll, { passive: true });
        }

        if (toggle && nav) {
            toggle.addEventListener("click", function () {
                nav.classList.toggle("is-open");
            });
        }

        document.querySelectorAll("img").forEach(function (image) {
            image.addEventListener("error", function () {
                image.classList.add("is-hidden");
            });
        });

        if (hero) {
            var slides = Array.prototype.slice.call(hero.querySelectorAll(".hero-slide"));
            var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
            var current = 0;
            var timer = null;
            var show = function (index) {
                current = index % slides.length;
                slides.forEach(function (slide, slideIndex) {
                    slide.classList.toggle("is-active", slideIndex === current);
                });
                dots.forEach(function (dot, dotIndex) {
                    dot.classList.toggle("is-active", dotIndex === current);
                });
            };
            var start = function () {
                if (timer) {
                    window.clearInterval(timer);
                }
                timer = window.setInterval(function () {
                    show(current + 1);
                }, 5200);
            };
            if (slides.length > 1) {
                dots.forEach(function (dot) {
                    dot.addEventListener("click", function () {
                        show(Number(dot.getAttribute("data-hero-dot")) || 0);
                        start();
                    });
                });
                start();
            }
        }

        document.querySelectorAll("[data-page-filter]").forEach(function (form) {
            var input = form.querySelector("input[type='search']");
            var select = form.querySelector("select[data-type-filter]");
            var scope = form.closest("main") || document;
            var cards = Array.prototype.slice.call(scope.querySelectorAll("[data-card]"));
            var empty = scope.querySelector("[data-empty-state]");
            var apply = function () {
                var keyword = text(input && input.value);
                var typeValue = text(select && select.value);
                var visible = 0;
                cards.forEach(function (card) {
                    var haystack = text([
                        card.getAttribute("data-title"),
                        card.getAttribute("data-year"),
                        card.getAttribute("data-type"),
                        card.getAttribute("data-region"),
                        card.getAttribute("data-tags"),
                        card.textContent
                    ].join(" "));
                    var cardType = text(card.getAttribute("data-type"));
                    var matchKeyword = !keyword || haystack.indexOf(keyword) !== -1;
                    var matchType = !typeValue || cardType.indexOf(typeValue) !== -1;
                    var isVisible = matchKeyword && matchType;
                    card.style.display = isVisible ? "" : "none";
                    if (isVisible) {
                        visible += 1;
                    }
                });
                if (empty) {
                    empty.classList.toggle("is-visible", visible === 0);
                }
            };
            form.addEventListener("submit", function (event) {
                event.preventDefault();
                apply();
            });
            if (input) {
                input.addEventListener("input", apply);
            }
            if (select) {
                select.addEventListener("change", apply);
            }
        });

        var searchPage = document.querySelector("[data-search-page]");
        if (searchPage && window.MOVIE_SEARCH_INDEX) {
            var form = searchPage.querySelector("[data-search-form]");
            var input = searchPage.querySelector("[data-search-input]");
            var category = searchPage.querySelector("[data-search-category]");
            var results = searchPage.querySelector("[data-search-results]");
            var empty = searchPage.querySelector("[data-search-empty]");
            var params = new URLSearchParams(window.location.search);
            var initialQuery = params.get("q") || "";
            if (input && initialQuery) {
                input.value = initialQuery;
            }
            var render = function () {
                var keyword = text(input && input.value);
                var selected = text(category && category.value);
                var list = window.MOVIE_SEARCH_INDEX.filter(function (movie) {
                    var haystack = text([
                        movie.title,
                        movie.year,
                        movie.region,
                        movie.type,
                        movie.category,
                        movie.genre,
                        movie.tags,
                        movie.oneLine
                    ].join(" "));
                    var matchKeyword = !keyword || haystack.indexOf(keyword) !== -1;
                    var matchCategory = !selected || text(movie.category) === selected;
                    return matchKeyword && matchCategory;
                }).slice(0, 120);
                results.innerHTML = list.map(function (movie) {
                    return [
                        "<article class=\"movie-card\">",
                        "<a class=\"poster-shell\" href=\"" + movie.href + "\">",
                        "<img src=\"" + movie.cover + "\" alt=\"" + movie.title.replace(/\"/g, "&quot;") + "\" loading=\"lazy\">",
                        "<span class=\"poster-play\">▶</span>",
                        "</a>",
                        "<div class=\"movie-card-body\">",
                        "<div class=\"movie-meta-line\"><span>" + movie.year + "</span><span>" + movie.category + "</span></div>",
                        "<h2><a href=\"" + movie.href + "\">" + movie.title + "</a></h2>",
                        "<p>" + movie.oneLine + "</p>",
                        "<div class=\"tag-row\">" + movie.tags.slice(0, 3).map(function (tag) { return "<span>" + tag + "</span>"; }).join("") + "</div>",
                        "</div>",
                        "</article>"
                    ].join("");
                }).join("");
                results.querySelectorAll("img").forEach(function (image) {
                    image.addEventListener("error", function () {
                        image.classList.add("is-hidden");
                    });
                });
                if (empty) {
                    var showEmpty = list.length === 0;
                    empty.classList.toggle("is-visible", showEmpty);
                    empty.textContent = keyword || selected ? "没有匹配的影片，请尝试其他关键词。" : "请输入关键词或选择分类。";
                }
            };
            if (form) {
                form.addEventListener("submit", function (event) {
                    event.preventDefault();
                    render();
                });
            }
            if (input) {
                input.addEventListener("input", render);
            }
            if (category) {
                category.addEventListener("change", render);
            }
            render();
        }
    });
})();
