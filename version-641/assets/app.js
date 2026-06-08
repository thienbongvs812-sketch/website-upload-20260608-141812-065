(function () {
  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function qsa(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  var menuButton = qs('.menu-toggle');
  var mobilePanel = qs('.mobile-panel');
  if (menuButton && mobilePanel) {
    menuButton.addEventListener('click', function () {
      var open = mobilePanel.classList.toggle('is-open');
      menuButton.setAttribute('aria-expanded', open ? 'true' : 'false');
      menuButton.textContent = open ? '×' : '☰';
    });
  }

  var hero = qs('[data-hero]');
  if (hero) {
    var slides = qsa('.hero-copy', hero);
    var cards = qsa('.hero-card', hero);
    var dots = qsa('.hero-dots button', hero);
    var index = 0;
    var timer = null;

    function activate(next) {
      index = (next + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('is-active', i === index);
      });
      cards.forEach(function (card, i) {
        card.classList.toggle('is-active', i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === index);
      });
    }

    function play() {
      clearInterval(timer);
      timer = setInterval(function () {
        activate(index + 1);
      }, 5200);
    }

    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        activate(i);
        play();
      });
    });

    activate(0);
    play();
  }

  qsa('[data-filter-form]').forEach(function (form) {
    var input = qs('[data-filter-input]', form);
    var category = qs('[data-filter-category]', form);
    var region = qs('[data-filter-region]', form);
    var year = qs('[data-filter-year]', form);
    var grid = qs('[data-filter-grid]');
    var empty = qs('[data-no-results]');
    var cards = grid ? qsa('.movie-card', grid) : [];

    function normalize(value) {
      return String(value || '').trim().toLowerCase();
    }

    function run() {
      var keyword = normalize(input && input.value);
      var cat = normalize(category && category.value);
      var reg = normalize(region && region.value);
      var yr = normalize(year && year.value);
      var visible = 0;

      cards.forEach(function (card) {
        var text = normalize([
          card.getAttribute('data-title'),
          card.getAttribute('data-region'),
          card.getAttribute('data-year'),
          card.getAttribute('data-category'),
          card.getAttribute('data-tags')
        ].join(' '));
        var ok = true;
        if (keyword && text.indexOf(keyword) === -1) ok = false;
        if (cat && normalize(card.getAttribute('data-category')) !== cat) ok = false;
        if (reg && normalize(card.getAttribute('data-region')).indexOf(reg) === -1) ok = false;
        if (yr && normalize(card.getAttribute('data-year')) !== yr) ok = false;
        card.style.display = ok ? '' : 'none';
        if (ok) visible += 1;
      });

      if (empty) {
        empty.style.display = visible ? 'none' : 'block';
      }
    }

    [input, category, region, year].forEach(function (el) {
      if (el) {
        el.addEventListener('input', run);
        el.addEventListener('change', run);
      }
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      run();
    });

    var params = new URLSearchParams(window.location.search);
    if (params.has('q') && input) {
      input.value = params.get('q') || '';
    }
    run();
  });

  qsa('.player-shell').forEach(function (player) {
    var video = qs('video', player);
    var overlay = qs('.video-overlay', player);
    var button = qs('.play-button', player);
    var stream = player.getAttribute('data-stream');
    var ready = false;

    function attach() {
      if (!video || !stream || ready) return;
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = stream;
      } else if (window.Hls && window.Hls.isSupported()) {
        var hls = new Hls({
          maxBufferLength: 32,
          enableWorker: true
        });
        hls.loadSource(stream);
        hls.attachMedia(video);
      } else {
        video.src = stream;
      }
      ready = true;
    }

    function start() {
      if (!video) return;
      attach();
      if (overlay) overlay.classList.add('is-hidden');
      var attempt = video.play();
      if (attempt && typeof attempt.catch === 'function') {
        attempt.catch(function () {
          if (overlay) overlay.classList.remove('is-hidden');
        });
      }
    }

    if (overlay) {
      overlay.addEventListener('click', start);
    }
    if (button) {
      button.addEventListener('click', function (event) {
        event.stopPropagation();
        start();
      });
    }
    if (video) {
      video.addEventListener('click', function () {
        if (video.paused) start();
      });
    }
  });
})();
