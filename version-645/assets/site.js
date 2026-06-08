(function () {
  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $all(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function normalize(value) {
    return String(value || '').trim().toLowerCase();
  }

  function setupMenu() {
    var button = $('[data-menu-button]');
    var panel = $('[data-mobile-panel]');

    if (!button || !panel) {
      return;
    }

    button.addEventListener('click', function () {
      panel.classList.toggle('open');
    });
  }

  function setupHero() {
    var slider = $('[data-hero-slider]');

    if (!slider) {
      return;
    }

    var slides = $all('.hero-slide', slider);
    var dots = $all('[data-hero-dot]', slider);
    var minis = $all('[data-hero-mini]', slider);
    var index = 0;
    var timer = null;

    function activate(next) {
      index = next;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('active', i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('active', i === index);
      });
      minis.forEach(function (mini, i) {
        mini.classList.toggle('active', i === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        activate((index + 1) % slides.length);
      }, 5600);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
      }
    }

    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        activate(i);
        start();
      });
    });

    minis.forEach(function (mini, i) {
      mini.addEventListener('mouseenter', function () {
        activate(i);
      });
      mini.addEventListener('focus', function () {
        activate(i);
      });
    });

    slider.addEventListener('mouseenter', stop);
    slider.addEventListener('mouseleave', start);
    activate(0);
    start();
  }

  function setupHomeSearch() {
    var form = $('[data-home-search]');

    if (!form) {
      return;
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var input = $('[data-home-search-input]', form);
      var query = input ? input.value.trim() : '';
      var target = './search.html';

      if (query) {
        target += '?q=' + encodeURIComponent(query);
      }

      window.location.href = target;
    });
  }

  function setupFiltering() {
    var form = $('[data-filter-form]');
    var grid = $('[data-filterable]');

    if (!form || !grid) {
      return;
    }

    var cards = $all('.movie-card', grid);
    var queryInput = $('[data-filter-query]', form);
    var categorySelect = $('[data-filter-category]', form);
    var typeSelect = $('[data-filter-type]', form);
    var yearSelect = $('[data-filter-year]', form);
    var empty = $('[data-empty-state]');
    var params = new URLSearchParams(window.location.search);
    var initialQuery = params.get('q');

    if (initialQuery && queryInput) {
      queryInput.value = initialQuery;
    }

    function apply() {
      var query = normalize(queryInput && queryInput.value);
      var category = normalize(categorySelect && categorySelect.value);
      var type = normalize(typeSelect && typeSelect.value);
      var year = normalize(yearSelect && yearSelect.value);
      var visible = 0;

      cards.forEach(function (card) {
        var keywords = normalize(card.getAttribute('data-keywords'));
        var cardCategory = normalize(card.getAttribute('data-category'));
        var cardType = normalize(card.getAttribute('data-type'));
        var cardYear = normalize(card.getAttribute('data-year'));
        var ok = true;

        if (query && keywords.indexOf(query) === -1) {
          ok = false;
        }

        if (category && cardCategory !== category) {
          ok = false;
        }

        if (type && cardType !== type) {
          ok = false;
        }

        if (year && cardYear !== year) {
          ok = false;
        }

        card.hidden = !ok;

        if (ok) {
          visible += 1;
        }
      });

      if (empty) {
        empty.classList.toggle('show', visible === 0);
      }
    }

    ['input', 'change'].forEach(function (eventName) {
      form.addEventListener(eventName, apply);
    });

    apply();
  }

  function setupPlayers() {
    $all('[data-video-player]').forEach(function (player) {
      var video = $('video', player);
      var overlay = $('[data-player-overlay]', player);
      var action = $('[data-player-toggle]', player);
      var status = $('[data-player-status]', player);
      var src = player.getAttribute('data-video-src');
      var ready = false;
      var hls = null;

      if (!video || !src) {
        return;
      }

      function setStatus(text) {
        if (status) {
          status.textContent = text;
        }
      }

      function loadSource() {
        if (ready) {
          return;
        }

        ready = true;
        setStatus('正在准备播放源');

        if (window.Hls && window.Hls.isSupported()) {
          hls = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true
          });
          hls.loadSource(src);
          hls.attachMedia(video);
          hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
            setStatus('播放源已就绪');
          });
          hls.on(window.Hls.Events.ERROR, function (event, data) {
            if (!data || !data.fatal) {
              return;
            }

            if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
              setStatus('网络连接不稳定，正在重试');
              hls.startLoad();
            } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
              setStatus('媒体加载异常，正在恢复');
              hls.recoverMediaError();
            } else {
              setStatus('播放源暂时无法加载');
              hls.destroy();
            }
          });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = src;
          video.addEventListener('loadedmetadata', function () {
            setStatus('播放源已就绪');
          }, { once: true });
        } else {
          video.src = src;
          setStatus('当前浏览器将尝试直接播放');
        }
      }

      function play() {
        loadSource();
        var attempt = video.paused ? video.play() : video.pause();

        if (attempt && typeof attempt.catch === 'function') {
          attempt.catch(function () {
            setStatus('点击视频画面即可继续播放');
          });
        }
      }

      if (overlay) {
        overlay.addEventListener('click', play);
      }

      if (action) {
        action.addEventListener('click', play);
      }

      video.addEventListener('click', play);
      video.addEventListener('play', function () {
        player.classList.add('playing');
        if (action) {
          action.textContent = '暂停播放';
        }
        setStatus('正在播放');
      });
      video.addEventListener('pause', function () {
        player.classList.remove('playing');
        if (action) {
          action.textContent = '继续播放';
        }
        setStatus('已暂停');
      });
      video.addEventListener('ended', function () {
        player.classList.remove('playing');
        if (action) {
          action.textContent = '重新播放';
        }
        setStatus('播放结束');
      });
      window.addEventListener('beforeunload', function () {
        if (hls) {
          hls.destroy();
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    setupMenu();
    setupHero();
    setupHomeSearch();
    setupFiltering();
    setupPlayers();
  });
})();
