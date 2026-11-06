(() => {
  const videos = [...document.querySelectorAll(".project-clip video")];
  if (!videos.length || !("IntersectionObserver" in window)) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const connection = navigator.connection;
  const states = new Map(videos.map(video => [video, {
    ratio: 0,
    pending: false,
    automaticPause: false,
    userPaused: false,
    manualPlayback: false,
    blocked: false
  }]));
  let activeVideo = null;

  function pause(video) {
    if (!video.paused) {
      states.get(video).automaticPause = true;
      video.pause();
    }
  }

  function showStatus(video, message) {
    let status = video.parentElement.querySelector(".video-status");
    if (!status) {
      status = document.createElement("p");
      status.className = "project-media-note video-status";
      status.setAttribute("role", "status");
      video.parentElement.append(status);
    }
    status.textContent = message;
  }

  function updatePlayback() {
    const automatic = !reducedMotion.matches && !connection?.saveData;
    let nextVideo = null;
    if (!document.hidden) {
      if (activeVideo && states.get(activeVideo).manualPlayback &&
          !activeVideo.paused && states.get(activeVideo).ratio >= 0.25) {
        nextVideo = activeVideo;
      } else if (automatic) {
        for (const video of videos) {
          const state = states.get(video);
          if (state.ratio < 0.25 || state.userPaused || state.blocked) continue;
          if (!nextVideo || state.ratio > states.get(nextVideo).ratio) nextVideo = video;
        }
      }
    }

    activeVideo = nextVideo;
    for (const video of videos) {
      if (video !== nextVideo) pause(video);
    }
    if (!nextVideo) return;

    const state = states.get(nextVideo);
    if (!nextVideo.paused || state.pending) return;
    state.pending = true;
    nextVideo.play().catch(error => {
      if (error.name === "AbortError") return;
      state.blocked = true;
      if (error.name === "NotAllowedError") {
        showStatus(nextVideo, "Automatic playback is disabled by your browser. Use the player controls to play this demo.");
      } else {
        console.error("Unable to play project recording:", nextVideo.currentSrc, error);
        showStatus(nextVideo, "This recording couldn't play. Try the player controls or reload the page.");
      }
    }).finally(() => {
      state.pending = false;
      updatePlayback();
    });
  }

  for (const video of videos) {
    const state = states.get(video);
    video.loop = true;
    video.addEventListener("play", () => {
      state.userPaused = false;
      state.manualPlayback = !state.pending;
      activeVideo = video;
      for (const other of videos) {
        if (other !== video) pause(other);
      }
      video.parentElement.querySelector(".video-status")?.remove();
      if (document.hidden || state.ratio < 0.25) pause(video);
    });
    video.addEventListener("pause", () => {
      if (state.automaticPause) {
        state.automaticPause = false;
      } else {
        state.userPaused = true;
        state.manualPlayback = false;
        updatePlayback();
      }
    });
    video.addEventListener("error", () => {
      state.blocked = true;
      console.error("Unable to load project recording:", video.currentSrc, video.error);
      showStatus(video, "This recording couldn't load. Please reload the page to try again.");
      updatePlayback();
    });
  }

  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) states.get(entry.target).ratio = entry.intersectionRatio;
    updatePlayback();
  }, { threshold: [0, 0.25, 0.5, 0.75, 1] });
  for (const video of videos) observer.observe(video);

  document.addEventListener("visibilitychange", updatePlayback);
  window.addEventListener("pagehide", () => videos.forEach(pause));
  window.addEventListener("pageshow", updatePlayback);
  reducedMotion.addEventListener("change", updatePlayback);
  connection?.addEventListener("change", updatePlayback);
})();
