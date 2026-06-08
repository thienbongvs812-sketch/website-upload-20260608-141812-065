(function () {
    function ready(callback) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback);
        } else {
            callback();
        }
    }

    function bindMenu() {
        var button = document.querySelector('.js-menu-button');
        var nav = document.querySelector('.mobile-nav');
        if (!button || !nav) {
            return;
        }
        button.addEventListener('click', function () {
            nav.classList.toggle('is-open');
            button.textContent = nav.classList.contains('is-open') ? '×' : '☰';
        });
    }

    function bindHero() {
        var carousel = document.querySelector('.hero-carousel');
        if (!carousel) {
            return;
        }
        var slides = Array.prototype.slice.call(carousel.querySelectorAll('[data-hero-slide]'));
        var dots = Array.prototype.slice.call(carousel.querySelectorAll('[data-hero-dot]'));
        var previous = carousel.querySelector('.hero-prev');
        var next = carousel.querySelector('.hero-next');
        var active = 0;
        var timer = null;

        function show(index) {
            if (!slides.length) {
                return;
            }
            active = (index + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle('is-active', slideIndex === active);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle('w-8', dotIndex === active);
                dot.classList.toggle('w-3', dotIndex !== active);
                dot.classList.toggle('bg-white', dotIndex === active);
                dot.classList.toggle('bg-white/50', dotIndex !== active);
            });
        }

        function start() {
            timer = window.setInterval(function () {
                show(active + 1);
            }, 5000);
        }

        function restart() {
            if (timer) {
                window.clearInterval(timer);
            }
            start();
        }

        if (previous) {
            previous.addEventListener('click', function () {
                show(active - 1);
                restart();
            });
        }
        if (next) {
            next.addEventListener('click', function () {
                show(active + 1);
                restart();
            });
        }
        dots.forEach(function (dot) {
            dot.addEventListener('click', function () {
                show(Number(dot.getAttribute('data-hero-dot')) || 0);
                restart();
            });
        });
        show(0);
        start();
    }

    function bindCardFilter() {
        var input = document.querySelector('.js-card-filter');
        var grid = document.querySelector('.js-card-grid');
        if (!input || !grid) {
            return;
        }
        var cards = Array.prototype.slice.call(grid.querySelectorAll('.movie-card'));
        input.addEventListener('input', function () {
            var keyword = input.value.trim().toLowerCase();
            cards.forEach(function (card) {
                var text = (card.getAttribute('data-search') || card.textContent || '').toLowerCase();
                card.classList.toggle('is-hidden', keyword && text.indexOf(keyword) === -1);
            });
        });
    }

    function bindPlayers() {
        var players = Array.prototype.slice.call(document.querySelectorAll('.js-player'));
        players.forEach(function (video) {
            var shell = video.closest('.player-shell');
            var overlay = shell ? shell.querySelector('.js-play-button') : null;

            function bindSource() {
                if (video.dataset.bound === '1') {
                    return;
                }
                var stream = video.getAttribute('data-stream');
                if (!stream) {
                    return;
                }
                if (window.Hls && window.Hls.isSupported()) {
                    var hls = new window.Hls({
                        enableWorker: true,
                        lowLatencyMode: true
                    });
                    hls.loadSource(stream);
                    hls.attachMedia(video);
                    hls.on(window.Hls.Events.ERROR, function (eventName, data) {
                        if (!data || !data.fatal) {
                            return;
                        }
                        if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
                            hls.startLoad();
                            return;
                        }
                        if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
                            hls.recoverMediaError();
                            return;
                        }
                        hls.destroy();
                    });
                    video._hlsInstance = hls;
                } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                    video.src = stream;
                }
                video.dataset.bound = '1';
            }

            function play() {
                bindSource();
                var playPromise = video.play();
                if (playPromise && typeof playPromise.catch === 'function') {
                    playPromise.catch(function () {});
                }
            }

            if (overlay) {
                overlay.addEventListener('click', function () {
                    overlay.classList.add('is-hidden');
                    play();
                });
            }
            video.addEventListener('play', function () {
                if (overlay) {
                    overlay.classList.add('is-hidden');
                }
            });
            video.addEventListener('click', function () {
                if (video.paused) {
                    play();
                }
            });
        });
    }

    function makeSearchCard(movie) {
        return [
            '<a href="' + movie.url + '" class="movie-card group block overflow-hidden rounded-xl bg-white shadow hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">',
            '    <div class="relative overflow-hidden aspect-[3/4]">',
            '        <img src="' + movie.cover + '" alt="' + movie.title + ' 在线观看" loading="lazy" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">',
            '        <div class="absolute top-3 right-3 px-2 py-1 bg-black/70 backdrop-blur-sm rounded text-white text-xs font-medium">' + movie.year + '</div>',
            '    </div>',
            '    <div class="p-4">',
            '        <div class="flex items-center space-x-2 mb-2">',
            '            <span class="px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs font-medium">' + movie.category + '</span>',
            '        </div>',
            '        <h2 class="text-lg font-bold text-neutral-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">' + movie.title + '</h2>',
            '        <p class="text-neutral-600 text-sm line-clamp-2 mb-3">' + movie.oneLine + '</p>',
            '        <div class="flex items-center justify-between text-sm text-neutral-500">',
            '            <span>' + movie.type + '</span>',
            '            <span>' + movie.region + '</span>',
            '        </div>',
            '    </div>',
            '</a>'
        ].join('');
    }

    function bindSearchPage() {
        var results = document.getElementById('search-results');
        var summary = document.getElementById('search-summary');
        if (!results || !summary || !window.SEARCH_MOVIES) {
            return;
        }
        var params = new URLSearchParams(window.location.search);
        var keyword = (params.get('q') || '').trim();
        var inputs = Array.prototype.slice.call(document.querySelectorAll('input[name="q"]'));
        inputs.forEach(function (input) {
            input.value = keyword;
        });
        if (!keyword) {
            summary.textContent = '请输入关键词搜索片库内容。';
            return;
        }
        var lower = keyword.toLowerCase();
        var matched = window.SEARCH_MOVIES.filter(function (movie) {
            return movie.search.toLowerCase().indexOf(lower) !== -1;
        }).slice(0, 120);
        if (!matched.length) {
            summary.textContent = '未找到相关影片，可尝试更换关键词。';
            return;
        }
        summary.innerHTML = '关键词：<span class="font-semibold text-neutral-900">' + keyword.replace(/[&<>"]/g, function (char) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;'
            }[char];
        }) + '</span>';
        results.innerHTML = matched.map(makeSearchCard).join('');
    }

    ready(function () {
        bindMenu();
        bindHero();
        bindCardFilter();
        bindPlayers();
        bindSearchPage();
    });
})();
