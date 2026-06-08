(function () {
    function ready(callback) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", callback);
        } else {
            callback();
        }
    }

    ready(function () {
        var video = document.querySelector("[data-player]");
        var button = document.querySelector("[data-start-player]");
        var message = document.querySelector("[data-player-message]");
        var hlsInstance = null;
        var initialized = false;

        if (!video || !button) {
            return;
        }

        var source = video.getAttribute("data-src");

        function showMessage(value) {
            if (message) {
                message.textContent = value || "";
            }
        }

        function attachSource() {
            if (initialized) {
                return;
            }
            initialized = true;

            if (!source) {
                showMessage("播放加载失败，请稍后重试。");
                return;
            }

            if (window.Hls && window.Hls.isSupported()) {
                hlsInstance = new window.Hls({
                    enableWorker: true,
                    lowLatencyMode: true
                });
                hlsInstance.loadSource(source);
                hlsInstance.attachMedia(video);
                hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
                    if (data && data.fatal) {
                        if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
                            hlsInstance.startLoad();
                        } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
                            hlsInstance.recoverMediaError();
                        } else {
                            showMessage("播放加载失败，请稍后重试。");
                            hlsInstance.destroy();
                        }
                    }
                });
            } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
                video.src = source;
            } else {
                showMessage("播放加载失败，请稍后重试。");
            }
        }

        function play() {
            attachSource();
            button.classList.add("is-hidden");
            var promise = video.play();
            if (promise && typeof promise.catch === "function") {
                promise.catch(function () {
                    button.classList.remove("is-hidden");
                });
            }
        }

        button.addEventListener("click", play);
        video.addEventListener("play", function () {
            button.classList.add("is-hidden");
        });
        video.addEventListener("pause", function () {
            if (!video.ended) {
                button.classList.remove("is-hidden");
            }
        });
        video.addEventListener("ended", function () {
            button.classList.remove("is-hidden");
        });
        video.addEventListener("click", function () {
            if (!initialized) {
                play();
            }
        });
        window.addEventListener("beforeunload", function () {
            if (hlsInstance) {
                hlsInstance.destroy();
            }
        });
    });
})();
