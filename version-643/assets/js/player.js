let HlsClass = null;

async function getHlsClass() {
  if (window.Hls) {
    return window.Hls;
  }

  if (!HlsClass) {
    try {
      const module = await import("./hls-vendor.js");
      HlsClass = module.H || module.default || null;
    } catch (error) {
      HlsClass = null;
    }
  }

  return HlsClass;
}

async function playVideo(player) {
  const video = player.querySelector("video");
  const button = player.querySelector("[data-player-start]");

  if (!video || !video.dataset.stream) {
    return;
  }

  const address = video.dataset.stream;
  button && button.classList.add("is-hidden");

  if (video.canPlayType("application/vnd.apple.mpegurl")) {
    if (!video.src) {
      video.src = address;
    }
    try {
      await video.play();
    } catch (error) {}
    return;
  }

  const Hls = await getHlsClass();

  if (Hls && Hls.isSupported()) {
    if (!video.dataset.hlsAttached) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      hls.loadSource(address);
      hls.attachMedia(video);
      video.dataset.hlsAttached = "1";
      hls.on(Hls.Events.MANIFEST_PARSED, function () {
        video.play().catch(function () {});
      });
    } else {
      video.play().catch(function () {});
    }
    return;
  }

  if (!video.src) {
    video.src = address;
  }

  video.play().catch(function () {});
}

Array.from(document.querySelectorAll("[data-player]")).forEach(function (player) {
  const button = player.querySelector("[data-player-start]");

  if (button) {
    button.addEventListener("click", function (event) {
      event.preventDefault();
      playVideo(player);
    });
  }
});
