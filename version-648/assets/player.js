(function () {
  window.initMoviePlayer = function (options) {
    var player = document.querySelector(options.selector);

    if (!player) {
      return;
    }

    var video = player.querySelector("video");
    var overlay = player.querySelector(".video-overlay");
    var source = options.source;
    var poster = options.poster;
    var attached = false;
    var hls = null;

    if (!video || !source) {
      return;
    }

    if (poster && !video.getAttribute("poster")) {
      video.setAttribute("poster", poster);
    }

    function attach() {
      if (attached) {
        return;
      }

      attached = true;

      if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(source);
        hls.attachMedia(video);
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = source;
      } else {
        video.src = source;
      }
    }

    function hideOverlay() {
      if (overlay) {
        overlay.classList.add("is-hidden");
      }
    }

    function showOverlay() {
      if (overlay && video.currentTime === 0 && video.paused) {
        overlay.classList.remove("is-hidden");
      }
    }

    function start() {
      attach();
      hideOverlay();

      var attempt = video.play();

      if (attempt && typeof attempt.catch === "function") {
        attempt.catch(function () {
          showOverlay();
        });
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

    video.addEventListener("play", hideOverlay);
    video.addEventListener("pause", showOverlay);
    video.addEventListener("ended", showOverlay);

    window.addEventListener("pagehide", function () {
      if (hls) {
        hls.destroy();
      }
    });
  };
})();
