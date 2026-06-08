(function () {
    function qs(selector, root) {
        return (root || document).querySelector(selector);
    }

    function qsa(selector, root) {
        return Array.prototype.slice.call((root || document).querySelectorAll(selector));
    }

    function setupMobileMenu() {
        var button = qs('[data-menu-button]');
        var menu = qs('[data-mobile-menu]');
        if (!button || !menu) {
            return;
        }

        button.addEventListener('click', function () {
            menu.classList.toggle('open');
            document.body.classList.toggle('menu-open', menu.classList.contains('open'));
        });
    }

    function setupMissingImages() {
        qsa('img[data-fallback]').forEach(function (image) {
            image.addEventListener('error', function () {
                image.style.display = 'none';
                var box = image.closest('.cover-box');
                if (box) {
                    box.classList.add('is-missing');
                }
            });
        });
    }

    function setupHero() {
        var hero = qs('[data-hero]');
        if (!hero) {
            return;
        }

        var slides = qsa('[data-hero-slide]', hero);
        var dots = qsa('[data-hero-dot]', hero);
        var prev = qs('[data-hero-prev]', hero);
        var next = qs('[data-hero-next]', hero);
        var current = 0;
        var timer = null;

        function show(index) {
            if (!slides.length) {
                return;
            }

            current = (index + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle('active', slideIndex === current);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle('active', dotIndex === current);
            });
        }

        function start() {
            stop();
            timer = window.setInterval(function () {
                show(current + 1);
            }, 5000);
        }

        function stop() {
            if (timer) {
                window.clearInterval(timer);
            }
        }

        if (prev) {
            prev.addEventListener('click', function () {
                show(current - 1);
                start();
            });
        }

        if (next) {
            next.addEventListener('click', function () {
                show(current + 1);
                start();
            });
        }

        dots.forEach(function (dot) {
            dot.addEventListener('click', function () {
                show(Number(dot.getAttribute('data-hero-dot')) || 0);
                start();
            });
        });

        hero.addEventListener('mouseenter', stop);
        hero.addEventListener('mouseleave', start);
        show(0);
        start();
    }

    function setupLocalFilter() {
        var input = qs('[data-local-search]');
        var yearSelect = qs('[data-year-filter]');
        var grid = qs('[data-filter-grid]');
        var count = qs('[data-filter-count]');
        if (!grid) {
            return;
        }

        var cards = qsa('.movie-card', grid);

        function applyFilter() {
            var query = input ? input.value.trim().toLowerCase() : '';
            var year = yearSelect ? yearSelect.value : '';
            var visible = 0;

            cards.forEach(function (card) {
                var haystack = [
                    card.getAttribute('data-title'),
                    card.getAttribute('data-type'),
                    card.getAttribute('data-region'),
                    card.getAttribute('data-genre')
                ].join(' ').toLowerCase();
                var matchQuery = !query || haystack.indexOf(query) !== -1;
                var matchYear = !year || card.getAttribute('data-year') === year;
                var shouldShow = matchQuery && matchYear;

                card.classList.toggle('hidden-card', !shouldShow);
                if (shouldShow) {
                    visible += 1;
                }
            });

            if (count) {
                count.textContent = visible + ' 部影片';
            }
        }

        if (input) {
            input.addEventListener('input', applyFilter);
        }
        if (yearSelect) {
            yearSelect.addEventListener('change', applyFilter);
        }
        applyFilter();
    }

    function getQueryParam(name) {
        var params = new URLSearchParams(window.location.search);
        return params.get(name) || '';
    }

    function movieCardTemplate(movie) {
        return [
            '<article class="movie-card poster" data-title="' + escapeHtml(movie.title) + '" data-year="' + movie.year + '">',
            '    <a href="' + movie.href + '" class="movie-card-link">',
            '        <div class="cover-box">',
            '            <img src="' + movie.cover + '" alt="' + escapeHtml(movie.title) + '" loading="lazy" data-fallback>',
            '            <span class="fallback-title">' + escapeHtml(movie.title) + '</span>',
            '            <span class="rating-badge">★ ' + Number(movie.rating).toFixed(1) + '</span>',
            '            <span class="play-mark">▶</span>',
            '        </div>',
            '        <div class="movie-card-body">',
            '            <div class="card-meta">',
            '                <span>' + escapeHtml(movie.type) + '</span>',
            '                <span>' + movie.year + '</span>',
            '                <span>' + escapeHtml(movie.region) + '</span>',
            '            </div>',
            '            <h3>' + escapeHtml(movie.title) + '</h3>',
            '            <p>' + escapeHtml(movie.oneLine) + '</p>',
            '            <div class="tag-line">' + escapeHtml(movie.categoryName) + '</div>',
            '        </div>',
            '    </a>',
            '</article>'
        ].join('');
    }

    function escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function setupGlobalSearch() {
        var input = qs('[data-global-search]');
        var results = qs('[data-search-results]');
        var summary = qs('[data-search-summary]');
        var defaultSection = qs('[data-search-default]');
        var clearButton = qs('[data-clear-search]');
        if (!input || !results || !window.MOVIE_INDEX) {
            return;
        }

        function render() {
            var query = input.value.trim().toLowerCase();
            if (!query) {
                results.innerHTML = '';
                if (summary) {
                    summary.textContent = '输入关键词后显示匹配结果';
                }
                if (defaultSection) {
                    defaultSection.style.display = '';
                }
                return;
            }

            var matches = window.MOVIE_INDEX.filter(function (movie) {
                var haystack = [
                    movie.title,
                    movie.year,
                    movie.region,
                    movie.type,
                    movie.genre,
                    movie.categoryName,
                    (movie.tags || []).join(' '),
                    movie.oneLine
                ].join(' ').toLowerCase();
                return haystack.indexOf(query) !== -1;
            }).slice(0, 96);

            results.innerHTML = matches.map(movieCardTemplate).join('');
            setupMissingImages();
            if (summary) {
                summary.textContent = matches.length ? '找到 ' + matches.length + ' 条匹配结果' : '没有找到匹配结果，可尝试更短关键词';
            }
            if (defaultSection) {
                defaultSection.style.display = matches.length ? 'none' : '';
            }
        }

        var initialQuery = getQueryParam('q');
        if (initialQuery) {
            input.value = initialQuery;
        }

        input.addEventListener('input', render);
        if (clearButton) {
            clearButton.addEventListener('click', function () {
                input.value = '';
                render();
                input.focus();
            });
        }
        render();
    }

    function setupPlayers() {
        qsa('.hls-player').forEach(function (video) {
            var source = video.getAttribute('data-src');
            var shell = video.closest('.player-shell');
            var overlay = shell ? qs('.play-overlay', shell) : null;
            var loaded = false;

            function loadSource() {
                if (loaded || !source) {
                    return;
                }
                loaded = true;

                if (window.Hls && window.Hls.isSupported()) {
                    var hls = new window.Hls({
                        enableWorker: true,
                        lowLatencyMode: true
                    });
                    hls.loadSource(source);
                    hls.attachMedia(video);
                    video._hls = hls;
                } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                    video.src = source;
                } else {
                    video.src = source;
                }
            }

            function playVideo() {
                loadSource();
                var playPromise = video.play();
                if (playPromise && typeof playPromise.catch === 'function') {
                    playPromise.catch(function () {
                        if (overlay) {
                            overlay.classList.remove('hidden');
                        }
                    });
                }
            }

            video.addEventListener('play', function () {
                loadSource();
                if (overlay) {
                    overlay.classList.add('hidden');
                }
            });

            video.addEventListener('pause', function () {
                if (overlay && video.currentTime === 0) {
                    overlay.classList.remove('hidden');
                }
            });

            if (overlay) {
                overlay.addEventListener('click', playVideo);
            }
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        setupMobileMenu();
        setupMissingImages();
        setupHero();
        setupLocalFilter();
        setupGlobalSearch();
        setupPlayers();
    });
})();
