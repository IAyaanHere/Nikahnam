(function () {
  const wrapper = document.getElementById("envelope-wrapper");
  const intro = document.getElementById("video-intro");
  const video = document.getElementById("intro-video");

  if (!wrapper || !intro || !video) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  video.pause();
  video.muted = true;
  video.volume = 0;
  video.setAttribute("muted", "");
  intro.tabIndex=0;
  const skip=document.createElement("button");skip.textContent="Skip intro";skip.type="button";skip.style.cssText="position:absolute;right:18px;bottom:18px;z-index:99;padding:10px 18px;border:1px solid #e4c98a;border-radius:30px;color:#fff;background:#163c2b";wrapper.appendChild(skip);skip.addEventListener("click",event=>{event.stopPropagation();video.pause();if(typeof window.playBackgroundMusic==="function"){window.playBackgroundMusic();}revealSite()});
  video.addEventListener("loadedmetadata", () => {
    if (!wrapper.classList.contains("is-playing")) {
      video.currentTime = 0;
      video.pause();
    }
  }, { once: true });

  function startAutoScroll() {
      if (window.__LS_INVITE_EXPERIENCE__) return;
    let scrollInterval = window.setInterval(() => {
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;

      if (atBottom) {
        window.clearInterval(scrollInterval);
        return;
      }

      window.scrollBy(0, 1);
    }, 24);

    const stopAutoScroll = () => {
      window.clearInterval(scrollInterval);
      window.removeEventListener("wheel", stopAutoScroll);
      window.removeEventListener("touchstart", stopAutoScroll);
      window.removeEventListener("touchmove", stopAutoScroll);
      window.removeEventListener("mousedown", stopAutoScroll);
      window.removeEventListener("keydown", stopAutoScroll);
    };

    window.addEventListener("wheel", stopAutoScroll, { passive: true });
    window.addEventListener("touchstart", stopAutoScroll, { passive: true });
    window.addEventListener("touchmove", stopAutoScroll, { passive: true });
    window.addEventListener("mousedown", stopAutoScroll);
    window.addEventListener("keydown", stopAutoScroll);
  }

  function revealSite() {
    wrapper.classList.add("dissolve");

    const siteCanvas = document.querySelector(".site-canvas");
    if (siteCanvas) {
      siteCanvas.classList.add("is-revealed");
    }

    document.body.classList.remove("has-intro-active");

    if (typeof window.playBackgroundMusic === "function") {
      window.playBackgroundMusic();
    }

    window.setTimeout(startAutoScroll, 900);

    window.setTimeout(() => {
      wrapper.remove();
    }, 1200);
  }

  if (params.get("preview") === "1") {
    revealSite();
    return;
  }

  function playIntro() {
    intro.removeEventListener("click", playIntro);
    intro.removeEventListener("keydown", handleKey);
    wrapper.classList.add("is-playing");

    video.muted = true;
    video.volume = 0;

    // Start background music immediately when Tap to Open is pressed
    if (typeof window.playBackgroundMusic === "function") {
      window.playBackgroundMusic();
    }

    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {
        intro.addEventListener("click", playIntro);
        intro.addEventListener("keydown", handleKey);
        wrapper.classList.remove("is-playing");
      });
    }
  }

  function handleKey(event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      playIntro();
    }
  }

  video.addEventListener("ended", revealSite);
  intro.addEventListener("click", playIntro);
  intro.addEventListener("keydown", handleKey);
})();
