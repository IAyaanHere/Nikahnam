const ASSET_VERSION = "20260502-final12";
const assetUrl = (path) => `${path}${path.includes("?")?"&":"?"}v=${ASSET_VERSION}`;

let DECOR_ASSETS = {};

const state = {
  data: null,
  lang: "en",
  currentSlide: 0,
  countdownTimer: null,
  carouselTimer: null,
  sparkleTimer: null,
  musicStarted: false,
  motionHooksBound: false,
  // Intro is now handled by envelope.js â€” always start as dismissed
  introDismissed: true,
  introPhase: "idle",
};

const siteRoot = document.getElementById("site-root");
const languageSwitch = document.getElementById("language-switch");
const musicToggle = document.getElementById("music-toggle");
const musicEl = document.getElementById("bg-music");
const iconPlay = document.getElementById("icon-play");
const iconPause = document.getElementById("icon-pause");

document.addEventListener("DOMContentLoaded", init);

async function init() {
  bindMusicToggle();

  try {
    const response = await fetch("./wedding.json", { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`Unable to load wedding.json (${response.status})`);
    }

    const raw = await response.json();
    if(raw.active===false && !new URLSearchParams(location.search).has("editorPreview")){document.body.innerHTML="<main style=\"padding:60px;text-align:center\"><h1>Your invitation is being prepared</h1><p>Please contact LoveSolutions.in to activate your website.</p></main>";return;}
    DECOR_ASSETS={...raw.assets,ganesha:raw.assets.calligraphy,lanterns:[raw.assets.lanternOne,raw.assets.lanternTwo]};
    state.data = noorData(raw);
    const introVideo=document.getElementById("intro-video");if(introVideo){introVideo.src=raw.assets.introVideo;introVideo.poster=raw.assets.introPoster;}
    state.lang = state.data?.site?.defaultLanguage || "en";

    if (state.data?.site?.musicUrl) {
      musicEl.src = state.data.site.musicUrl;
      musicEl.loop = true;
    } else {
      musicToggle.hidden = true;
    }

    renderLanguageSwitch();
    renderSite();
  } catch (error) {
    console.error(error);
    siteRoot.innerHTML = `<div class="error-state">Unable to load wedding details.</div>`;
  }
}

function renderLanguageSwitch() {
  const { ui } = state.data;
  const languages = ui?.languageOptions || { en: "English", kn: "Hindi" };

  languageSwitch.innerHTML = ["en", "kn"]
    .map(
      (lang) => `
        <button
          type="button"
          data-lang-choice="${lang}"
          class="${state.lang === lang ? "is-active" : ""}"
        >
          ${escapeHtml(resolveText(languages, lang))}
        </button>
      `
    )
    .join("");

  languageSwitch.querySelectorAll("[data-lang-choice]").forEach((button) => {
    button.addEventListener("click", () => {
      state.lang = button.getAttribute("data-lang-choice");
      renderLanguageSwitch();
      renderSite();
    });
  });
}

function renderSite() {
  cleanupMotion();

  const data = state.data;
  const lang = state.lang;

  document.documentElement.lang = lang;
  document.body.setAttribute("data-lang", lang);
  // has-intro-active is managed by envelope.js now
  document.title = resolveText(data.site?.title, lang) || "Wedding Invitation";

  const isRevealedClass = document.body.classList.contains("has-intro-active") ? "" : "is-revealed";
  
  siteRoot.innerHTML = `
    <div class="site-canvas ${isRevealedClass}">
    <div class="app-container">
      <img class="background-top" src="${DECOR_ASSETS.topBackground}" alt="" aria-hidden="true">
      <div class="lantern-layer" id="lantern-layer" aria-hidden="true"></div>

      <section class="hero gs-parallax-hero">
        <h1 class="hero-name">${lineBreakText(resolveText(data.hero?.displayPartnerOne, lang) || resolveText(data.hero?.partnerOne, lang))}</h1>
        <p class="hero-connector">${lineBreakText(resolveText(data.hero?.middleText, lang))}</p>
        <h1 class="hero-name">${lineBreakText(resolveText(data.hero?.displayPartnerTwo, lang) || resolveText(data.hero?.partnerTwo, lang))}</h1>
      </section>

      <section class="section-green">
        <div class="section-shell">
          <img class="ganesha gs-reveal" src="${DECOR_ASSETS.ganesha}" alt="" aria-hidden="true">
          ${renderGaneshaInvocation(data.blessingsSection?.ganeshaInvocation, lang)}

          <div class="blessing-copy gs-reveal">
            <p class="eyebrow">${lineBreakText(resolveText(data.blessingsSection?.heading, lang))}</p>
            ${renderBlessingLines(data.blessingsSection?.familyLines || [], lang)}
            ${data.blessingsSection?.withLoveLine ? `<p class="blessing-line" style="font-size: clamp(0.8rem, 3.5vw, 1.8rem); margin-top: 1rem; width: 100%; text-align: center; white-space: nowrap;">${lineBreakText(resolveText(data.blessingsSection.withLoveLine, lang))}</p>` : ""}
          </div>

          <h2 class="invite-title gs-reveal">${lineBreakText(resolveText(data.blessingsSection?.inviteTitle, lang))}</h2>

          <div class="invite-copy gs-reveal">
            <p class="eyebrow">${lineBreakText(resolveText(data.blessingsSection?.inviteLine, lang))}</p>
            <h3 class="couple-name">${lineBreakText(resolveText(data.hero?.partnerOne, lang)).split(' ').join('<br>')}</h3>
            ${renderParentage(resolveText(data.blessingsSection?.partnerOneParentage, lang))}
            <p class="couple-ampersand">${lineBreakText(resolveText(data.blessingsSection?.joiner, lang))}</p>
            <h3 class="couple-name">${lineBreakText(resolveText(data.hero?.partnerTwo, lang)).split(' ').join('<br>')}</h3>
            ${renderParentage(resolveText(data.blessingsSection?.partnerTwoParentage, lang))}
            <p class="support-copy events-intro-copy">${lineBreakText(resolveText(data.blessingsSection?.eventsIntro, lang))}</p>
          </div>

          <div class="events-grid">
            ${(data.events || []).map((event) => renderEventCard(event, lang)).join("")}
          </div>


        </div>

      </section>

      <section class="section-pink">
        <div class="section-shell">
          <div class="save-date-block gs-reveal" id="save-date-block">
            <p class="save-date-eyebrow">Save the Date</p>
            <h2 class="save-date-title">Scratch to Reveal</h2>
            <div class="scratch-date-grid" aria-label="Scratch cards revealing the wedding date">
              ${renderScratchCard(data.dateReveal.day, "Day")}
              ${renderScratchCard(data.dateReveal.month, "Month")}
              ${renderScratchCard(data.dateReveal.year, "Year")}
            </div>
            <p class="save-date-hint">Scratch all three gold seals</p>
            <div class="save-confetti-layer" id="save-confetti-layer" aria-hidden="true"></div>
          </div>
        </div>

      </section>

      <section class="section-yellow">
        <div class="section-shell">
          <div class="details-block gs-reveal">
            <h2 class="section-title">${lineBreakText(resolveText(data.detailsSection?.title, lang))}</h2>
            <p class="details-intro">${lineBreakText(resolveText(data.detailsSection?.intro, lang))}</p>
            <div class="info-grid">
              ${(data.detailsSection?.items || []).map((item) => renderInfoCard(item, lang)).join("")}
            </div>

            <div class="custom-rsvp-block gs-reveal" style="text-align: center; margin-top: 3rem; width: 100%;">
              <p style="font-size: clamp(1rem, 2cqw, 1.4rem); margin-bottom: 1.5rem; color: var(--green-deep); font-weight: 700; text-transform: uppercase;">Will you be joining us for the special moment?</p>
              <form id="noor-rsvp" class="noor-rsvp-form">
                <label>Your name<input name="guestName" required maxlength="160" autocomplete="name"></label>
                <label>Mobile number<input name="mobileNumber" required type="tel" autocomplete="tel" maxlength="30"></label>
                <label>Will you attend?<select name="attendance"><option value="yes">Yes, happily</option><option value="no">Unable to attend</option></select></label>
                <label>Number of guests<input name="familyGuestCount" type="number" min="1" max="50" value="1"></label>
                <label>Message<textarea name="message" maxlength="1000"></textarea></label>
                <button type="submit">Send RSVP</button><p role="status" id="noor-rsvp-status"></p>
              </form>
              <p style="font-size: clamp(1.2rem, 2.5cqw, 1.8rem); color: var(--green-deep); margin-bottom: 1.5rem; font-family: 'Cormorant', serif; font-weight: 700;">With Best Wishes from:</p>
              <div style="font-size: clamp(0.9rem, 1.8cqw, 1.2rem); color: var(--green-deep); font-weight: 600; line-height: 1.6;">
                ${lineBreakText(resolveText(data.rsvpSection?.subtitle, lang))}
              </div>
            </div>
          </div>

        </div>

        <div class="car-frame">
          <img class="car-image gs-car-reveal" src="${DECOR_ASSETS.carThree}" alt="" aria-hidden="true">
        </div>
      </section>

      <section class="section-night">
        <div class="section-shell">
          <div class="countdown-block gs-reveal">
            <p class="countdown-copy countdown-copy-before">${lineBreakText(resolveText(data.countdownSection?.message, lang))}</p>
            <h2 class="countdown-title">${lineBreakText(resolveText(data.countdownSection?.title, lang))}</h2>
            <div class="countdown-timer" id="countdown-timer"></div>
            <div class="sparkle-area" id="sparkle-area">
              <h3 class="footer-mark">${lineBreakText(resolveText(data.countdownSection?.footer, lang))}</h3>
            </div>
          </div>
          ${renderBrandFooter(data.brandFooter, lang)}
        </div>
      </section>
    </div>
    </div>
  `;

  bindNoorRsvp();
  updateMusicButtonLabel();
  initLanterns();
  initGallery();
  initScratchDate();
  initCountdown();
  initSparkles();
  applyInitialScrollFromQuery();
  initGsap();
  bindImageRefreshes();
}

function renderBlessingLines(lines, lang) {
  return lines
    .map((line) => {
      const text = resolveText(line, lang);
      const [roleLine, ...detailLines] = String(text || "")
        .split("\n")
        .map((entry) => entry.trim())
        .filter(Boolean);

      return `
        <article class="blessing-segment">
          <p class="blessing-role">${escapeHtml(roleLine || "")}</p>
          <div class="blessing-details">
            ${detailLines
              .map((detail) => `<p class="blessing-line">${escapeHtml(detail)}</p>`)
              .join("")}
          </div>
        </article>
      `;
    })
    .join("");
}

function renderGaneshaInvocation(lines, lang) {
  if (!Array.isArray(lines) || !lines.length) {
    return "";
  }

  return `
    <div class="ganesha-invocation gs-reveal">
      ${lines
        .map((line) => `<p class="ganesha-line">${lineBreakText(resolveText(line, lang))}</p>`)
        .join("")}
    </div>
  `;
}

function renderScratchCard(value, label) {
  return `
    <article class="scratch-card" data-scratch-card>
      <div class="scratch-reveal">
        <span class="scratch-value">${escapeHtml(value)}</span>
        <span class="scratch-label">${escapeHtml(label)}</span>
      </div>
      <canvas class="scratch-canvas" aria-label="Scratch to reveal ${escapeAttr(label)}"></canvas>
    </article>
  `;
}

function renderParentage(text) {
  if (!text) {
    return "";
  }

  return `<p class="couple-parentage">${lineBreakText(text)}</p>`;
}

function renderEventCard(event, lang) {
  const titleText = resolveText(event.title, lang) || "";
  const dateText = resolveText(event.dateText, lang);
  const timeText = resolveText(event.time, lang);
  const eventImage = event.imageSrc || "";
  let titleClass = "";
  if (titleText.length > 20) {
    titleClass = "is-very-long-title";
  } else if (titleText.length > 14) {
    titleClass = "is-long-title";
  }

  return `
    <article class="event-card gs-reveal">
      <img class="event-card-bg" src="${DECOR_ASSETS.eventCard}" alt="" aria-hidden="true">
      <img class="event-flower is-top" src="${DECOR_ASSETS.eventFlowerTop}" alt="" aria-hidden="true">
      <img class="event-flower is-bottom" src="${DECOR_ASSETS.eventFlowerBottom}" alt="" aria-hidden="true">
      <div class="event-card-copy">
        <h4 class="event-title ${titleClass}">${lineBreakText(titleText)}</h4>
        <p class="event-meta event-date"><b>${lineBreakText(dateText)}</b></p>
        ${timeText ? `<p class="event-meta event-time-line"><b>${lineBreakText(timeText)}</b></p>` : ""}
        <p class="event-meta event-venue">${lineBreakText(resolveText(event.venue, lang))}</p>
        ${event.dressCode ? `<p class="event-meta">${lineBreakText(resolveText(event.dressCode, lang))}</p>` : ""}
        ${
          eventImage
            ? `<a class="event-map-image-link" href="${escapeAttr(event.mapUrl || "#")}" target="_blank" rel="noreferrer" aria-label="${escapeAttr(resolveText(event.mapLabel, lang) || "Open map")}">
                <img class="event-map-image" src="${escapeAttr(assetUrl(eventImage))}" alt="${escapeAttr(resolveText(event.venue, lang))}">
              </a>`
            : ""
        }
        ${
          resolveText(event.mapLabel, lang)
            ? `<a class="event-link" href="${escapeAttr(event.mapUrl || "#")}" target="_blank" rel="noreferrer">
                 ${lineBreakText(resolveText(event.mapLabel, lang))}
               </a>`
            : ""
        }
      </div>
    </article>
  `;
}

function renderGalleryPhotos(photos, lang) {
  if (!photos.length) {
    return "";
  }

  return photos
    .map(
      (photo, index) => `
        <img
          class="gallery-photo ${index === 0 ? "is-active" : ""}"
          src="${escapeAttr(photo.src || "")}"
          alt="${escapeAttr(resolveText(photo.alt, lang) || "")}"
          data-slide-index="${index}"
        >
      `
    )
    .join("");
}

function renderDot(index) {
  return `
    <button
      type="button"
      class="gallery-dot ${index === 0 ? "is-active" : ""}"
      data-dot-index="${index}"
      aria-label="Gallery slide ${index + 1}"
    ></button>
  `;
}

function renderInfoCard(item, lang) {
  const highlight = resolveText(item.highlight, lang);

  return `
    <article class="info-card">
      <div class="info-icon" aria-hidden="true">${getInfoIcon(item.icon)}</div>
      <h4 class="info-title">${lineBreakText(resolveText(item.title, lang))}</h4>
      <p class="info-body">
        ${lineBreakText(resolveText(item.body, lang))}
        ${highlight ? `<span class="info-highlight">${lineBreakText(highlight)}</span>` : ""}
      </p>
    </article>
  `;
}

function renderBrandFooter(brandFooter, lang) {
  const themeName = (state.data && state.data.themeName) || "Noor Lanterns";
  const whatsappMsg = encodeURIComponent(`Hello! I want to create a wedding invitation with the ${themeName} theme.`);
  const whatsappUrl = `https://wa.me/919449541723?text=${whatsappMsg}`;
  const instaUrl = "https://www.instagram.com/noor.invites.nagpur/";

  return `
    <div class="brand-footer gs-reveal">
      <a
        class="create-yours-btn"
        href="${whatsappUrl}"
        target="_blank"
        rel="noopener noreferrer"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.188 8.188 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24zm4.52 11.64c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.47c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1s.9 2.43 1.03 2.6c.12.17 1.77 2.7 4.28 3.79.6.26 1.07.41 1.43.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.11-.23-.17-.48-.3z"/>
        </svg>
        <span>Create Yours</span>
      </a>

      <a
        class="insta-footer-link"
        href="${instaUrl}"
        target="_blank"
        rel="noopener noreferrer"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
        <span>@noor.invites.nagpur</span>
      </a>
    </div>
  `;
}

function initLanterns() {
  const container = document.getElementById("lantern-layer");
  const isMobile = window.matchMedia("(max-width: 767px)").matches;
  const lanternCount = isMobile ? 16 : 34;

  if (!container) {
    return;
  }

  container.innerHTML = "";

  for (let index = 0; index < lanternCount; index += 1) {
    const lantern = document.createElement("img");
    const baseSize = Math.random() * (isMobile ? 4 : 8) + (isMobile ? 5 : 6);
    const scale = Math.random() > 0.5 ? (isMobile ? 1.2 : 1.8) : (isMobile ? 1 : 1.5);
    const size = baseSize * scale;
    const left = Math.random() * 95;
    const duration = Math.random() * (isMobile ? 14 : 18) + (isMobile ? 14 : 10);
    const delay = -(Math.random() * 30);

    lantern.src = DECOR_ASSETS.lanterns[Math.floor(Math.random() * DECOR_ASSETS.lanterns.length)];
    lantern.className = "lantern";
    lantern.style.width = `${size}cqw`;
    lantern.style.left = `${left}%`;
    lantern.style.animation = `floatUp ${duration}s linear ${delay}s infinite`;
    container.appendChild(lantern);
  }
}

function initGallery() {
  const photos = Array.from(document.querySelectorAll(".gallery-photo"));
  const dots = Array.from(document.querySelectorAll(".gallery-dot"));

  if (!photos.length) {
    return;
  }

  state.currentSlide = 0;

  const showSlide = (index) => {
    const safeIndex = ((index % photos.length) + photos.length) % photos.length;
    state.currentSlide = safeIndex;

    photos.forEach((photo, photoIndex) => {
      photo.classList.toggle("is-active", photoIndex === safeIndex);
    });

    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle("is-active", dotIndex === safeIndex);
    });
  };

  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      showSlide(Number(dot.getAttribute("data-dot-index")));
    });
  });

  if (photos.length > 1) {
    state.carouselTimer = window.setInterval(() => {
      showSlide(state.currentSlide + 1);
    }, 3000);
  }
}

function initScratchDate() {
  const cards = Array.from(document.querySelectorAll("[data-scratch-card]"));
  const confettiLayer = document.getElementById("save-confetti-layer");

  if (!cards.length) {
    return;
  }

  const revealed = new Set();
  let confettiFired = false;
  const scratchImage = new Image();
  scratchImage.src = DECOR_ASSETS.scratchGold;

  const fireWhenComplete = () => {
    if (confettiFired || revealed.size !== cards.length) {
      return;
    }

    confettiFired = true;
    fireSaveDateConfetti(confettiLayer);
  };

  const setupCard = (card, index) => {
    const canvas = card.querySelector(".scratch-canvas");
    const context = canvas?.getContext("2d", { willReadFrequently: true });

    if (!canvas || !context) {
      return;
    }

    let isDrawing = false;
    let lastPoint = null;

    const drawCover = () => {
      const rect = card.getBoundingClientRect();
      const size = Math.max(1, Math.round(rect.width));
      const ratio = window.devicePixelRatio || 1;

      canvas.width = Math.round(size * ratio);
      canvas.height = Math.round(size * ratio);
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.globalCompositeOperation = "source-over";
      context.clearRect(0, 0, size, size);
      context.beginPath();
      context.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
      context.clip();

      if (scratchImage.complete && scratchImage.naturalWidth) {
        context.drawImage(scratchImage, 0, 0, size, size);
      } else {
        const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
        gradient.addColorStop(0, "#fff3bd");
        gradient.addColorStop(0.55, "#d8a842");
        gradient.addColorStop(1, "#8d5a12");
        context.fillStyle = gradient;
        context.fillRect(0, 0, size, size);
      }

      context.globalCompositeOperation = "destination-out";
    };

    const pointFromEvent = (event) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
    };

    const scratchAt = (point) => {
      const rect = canvas.getBoundingClientRect();
      const brush = Math.max(20, rect.width * 0.12);

      context.lineCap = "round";
      context.lineJoin = "round";
      context.lineWidth = brush;

      if (lastPoint) {
        context.beginPath();
        context.moveTo(lastPoint.x, lastPoint.y);
        context.lineTo(point.x, point.y);
        context.stroke();
      }

      context.beginPath();
      context.arc(point.x, point.y, brush * 0.55, 0, Math.PI * 2);
      context.fill();
      lastPoint = point;
    };

    const revealIfReady = () => {
      if (revealed.has(index)) {
        return;
      }

      const { width, height } = canvas;
      if (!width || !height) {
        return;
      }

      const pixels = context.getImageData(0, 0, width, height).data;
      let transparent = 0;

      for (let i = 3; i < pixels.length; i += 16) {
        if (pixels[i] < 32) {
          transparent += 1;
        }
      }

      if (transparent / (pixels.length / 16) > 0.46) {
        revealed.add(index);
        card.classList.add("is-revealed");
        fireWhenComplete();
      }
    };

    const startScratch = (event) => {
      isDrawing = true;
      lastPoint = null;
      canvas.setPointerCapture?.(event.pointerId);
      scratchAt(pointFromEvent(event));
      event.preventDefault();
    };

    const moveScratch = (event) => {
      if (!isDrawing) {
        return;
      }

      scratchAt(pointFromEvent(event));
      revealIfReady();
      event.preventDefault();
    };

    const endScratch = (event) => {
      if (!isDrawing) {
        return;
      }

      isDrawing = false;
      lastPoint = null;
      canvas.releasePointerCapture?.(event.pointerId);
      revealIfReady();
    };

    drawCover();
    scratchImage.addEventListener("load", drawCover, { once: true });
    window.addEventListener("resize", drawCover);
    canvas.addEventListener("pointerdown", startScratch);
    canvas.addEventListener("pointermove", moveScratch);
    canvas.addEventListener("pointerup", endScratch);
    canvas.addEventListener("pointercancel", endScratch);
  };

  cards.forEach(setupCard);
}

function fireSaveDateConfetti(container) {
  if (!container) {
    return;
  }

  container.innerHTML = "";

  for (let index = 0; index < 72; index += 1) {
    const piece = document.createElement("span");
    const angle = Math.random() * 360;
    const distance = 38 + Math.random() * 62;
    const duration = 1.4 + Math.random() * 1.1;
    const delay = Math.random() * 0.25;

    piece.className = "save-confetti";
    piece.style.setProperty("--x", `${Math.cos(angle) * distance}cqw`);
    piece.style.setProperty("--y", `${Math.sin(angle) * distance}cqw`);
    piece.style.setProperty("--r", `${Math.random() * 720 - 360}deg`);
    piece.style.animationDuration = `${duration}s`;
    piece.style.animationDelay = `${delay}s`;
    piece.style.background = ["#fff4cf", "#d7a938", "#0b4d3f", "#7a1221"][index % 4];
    container.appendChild(piece);
  }

  window.setTimeout(() => {
    container.innerHTML = "";
  }, 3200);
}

function initCountdown() {
  const timerEl = document.getElementById("countdown-timer");
  const targetDate = state.data?.countdownSection?.targetDate;

  if (!timerEl || !targetDate) {
    return;
  }

  const units = state.data?.countdownSection?.units || {};

  const tick = () => {
    const target = new Date(targetDate).getTime();
    const now = Date.now();
    const distance = target - now;

    if (Number.isNaN(target)) {
      timerEl.textContent = "";
      return;
    }

    if (distance <= 0) {
      timerEl.textContent = resolveText(state.data?.countdownSection?.completeText, state.lang) || "";
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    timerEl.innerHTML = `
      <span class="count-value">${String(days).padStart(2, "0")}</span> ${escapeHtml(resolveText(units.days, state.lang))}
      <span class="count-value">${String(hours).padStart(2, "0")}</span> ${escapeHtml(resolveText(units.hours, state.lang))}
      <span class="count-value">${String(minutes).padStart(2, "0")}</span> ${escapeHtml(resolveText(units.minutes, state.lang))}
      <span class="count-value">${String(seconds).padStart(2, "0")}</span> ${escapeHtml(resolveText(units.seconds, state.lang))}
    `;
  };

  tick();
  state.countdownTimer = window.setInterval(tick, 1000);
}

function initSparkles() {
  const container = document.getElementById("sparkle-area");
  const isMobile = window.matchMedia("(max-width: 767px)").matches;

  if (!container) {
    return;
  }

  state.sparkleTimer = window.setInterval(() => {
    const sparkle = document.createElement("div");
    const size = Math.random() * 6 + 2;
    const left = Math.random() * 100;
    const top = Math.random() * 100;

    sparkle.className = "sparkle";
    sparkle.style.width = `${size}px`;
    sparkle.style.height = `${size}px`;
    sparkle.style.left = `${left}%`;
    sparkle.style.top = `${top}%`;
    sparkle.style.boxShadow = "0 0 10px 3px rgba(255, 215, 0, 0.8)";

    container.appendChild(sparkle);

    window.setTimeout(() => sparkle.remove(), 1500);
  }, isMobile ? 260 : 180);
}

function initGsap() {
  if (!window.gsap || !window.ScrollTrigger) {
    window.setTimeout(initGsap, 120);
    return;
  }

  const isMobile = window.matchMedia("(max-width: 767px)").matches;
  window.gsap.registerPlugin(window.ScrollTrigger);
  bindMotionRefreshHandlers();

  const hero = document.querySelector(".gs-parallax-hero");

  if (hero) {
    window.gsap.to(hero, {
      yPercent: isMobile ? 12 : 20,
      ease: "none",
      scrollTrigger: {
        trigger: ".app-container",
        start: "top top",
        end: "bottom top",
        scrub: isMobile ? 0.8 : 0.45,
        invalidateOnRefresh: true,
      },
    });
  }

  window.gsap.utils.toArray(".gs-reveal").forEach((element) => {
    window.gsap.fromTo(
      element,
      { y: 30, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.9,
        ease: "power2.out",
        force3D: true,
        scrollTrigger: {
          trigger: element,
          start: "top 90%",
          toggleActions: "play none none none",
          invalidateOnRefresh: true,
        },
      }
    );
  });

  [".route-parallax", ".rsvp-parallax", ".follow-parallax"].forEach((selector) => {
    const element = document.querySelector(selector);

    if (!element) {
      return;
    }

    window.gsap.to(element, {
      yPercent: isMobile ? 8 : 16,
      ease: "none",
      force3D: true,
      scrollTrigger: {
        trigger: element,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
        invalidateOnRefresh: true,
      },
    });
  });

  window.gsap.utils.toArray(".car-frame").forEach((frame) => {
    const element = frame.querySelector(".gs-car-reveal");

    if (!element) {
      return;
    }

    window.gsap.fromTo(
      element,
      { yPercent: isMobile ? 12 : 20, opacity: 0, scale: 0.95 },
      {
        yPercent: 0,
        opacity: 1,
        scale: 1,
        duration: 1.2,
        ease: "power3.out",
        scrollTrigger: {
          trigger: frame,
          start: "top 92%",
          toggleActions: "play none none reverse",
          invalidateOnRefresh: true,
        },
      }
    );

    window.gsap.to(element, {
      yPercent: isMobile ? -4 : -10,
      ease: "none",
      scrollTrigger: {
        trigger: frame,
        start: "top bottom",
        end: "bottom top",
        scrub: isMobile ? 1 : 0.6,
        invalidateOnRefresh: true,
      },
    });
  });

  scheduleScrollRefresh();
}

function bindMotionRefreshHandlers() {
  if (state.motionHooksBound || !window.ScrollTrigger) {
    return;
  }

  state.motionHooksBound = true;

  const refresh = () => {
    scheduleScrollRefresh();
  };

  window.addEventListener("load", refresh);
  window.addEventListener("resize", refresh);
  window.addEventListener("orientationchange", refresh);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      refresh();
    }
  });
}

function bindImageRefreshes() {
  if (!window.ScrollTrigger) {
    return;
  }

  const images = Array.from(siteRoot.querySelectorAll("img"));

  images.forEach((image) => {
    if (image.complete) {
      return;
    }

    image.addEventListener("load", scheduleScrollRefresh, { once: true });
    image.addEventListener("error", scheduleScrollRefresh, { once: true });
  });
}

function scheduleScrollRefresh() {
  if (!window.ScrollTrigger) {
    return;
  }

  window.requestAnimationFrame(() => {
    window.ScrollTrigger.refresh();
  });
}

function applyInitialScrollFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const scrollValue = Number(params.get("scroll"));

  if (!Number.isFinite(scrollValue) || scrollValue <= 0) {
    return;
  }

  window.requestAnimationFrame(() => {
    window.scrollTo({ top: scrollValue, behavior: "auto" });
    scheduleScrollRefresh();
  });
}

function cleanupMotion() {
  if (state.carouselTimer) {
    clearInterval(state.carouselTimer);
    state.carouselTimer = null;
  }

  if (state.countdownTimer) {
    clearInterval(state.countdownTimer);
    state.countdownTimer = null;
  }

  if (state.sparkleTimer) {
    clearInterval(state.sparkleTimer);
    state.sparkleTimer = null;
  }

  if (window.ScrollTrigger) {
    window.ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
  }
}

function bindMusicToggle() {
  musicEl.addEventListener("ended", () => {
    state.musicStarted = false;
    syncMusicIcons();
  });

  musicToggle.addEventListener("click", async () => {
    if (!musicEl.src) {
      return;
    }

    if (state.musicStarted) {
      musicEl.pause();
      state.musicStarted = false;
      syncMusicIcons();
      return;
    }

    try {
      await musicEl.play();
      state.musicStarted = true;
      syncMusicIcons();
    } catch (error) {
      console.log("Audio playback is waiting for a stronger interaction.", error);
    }
  });
}

function setupAutoplayUnlock() {
  if (!musicEl.src) {
    return;
  }

  const tryPlay = async () => {
    if (state.musicStarted) {
      return;
    }

    try {
      await musicEl.play();
      state.musicStarted = true;
      syncMusicIcons();
    } catch (error) {
      console.log("Autoplay blocked, waiting for interaction.", error);
    }
  };

  // Removed scroll/touch event listeners. We now only rely on explicitly calling tryPlay below.
}

window.playBackgroundMusic = async function() {
  if (!musicEl || !musicEl.src) return;
  if (state.musicStarted) return;
  
  try {
    await musicEl.play();
    state.musicStarted = true;
    syncMusicIcons();
  } catch (err) {
    console.log("Music play failed", err);
  }
};

function syncMusicIcons() {
  iconPlay.classList.toggle("is-visible", !state.musicStarted);
  iconPause.classList.toggle("is-visible", state.musicStarted);
  musicToggle.classList.toggle("audio-pulse", !state.musicStarted);
  updateMusicButtonLabel();
}

function updateMusicButtonLabel() {
  if (!state.data) {
    return;
  }

  const label = state.musicStarted
    ? resolveText(state.data.ui?.pauseMusic, state.lang)
    : resolveText(state.data.ui?.playMusic, state.lang);

  if (label) {
    musicToggle.setAttribute("aria-label", label);
  }
}

function resolveText(value, lang) {
  if (value == null) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object") {
    return value[lang] || value.en || value.hi || value.kn || Object.values(value)[0] || "";
  }

  return String(value);
}

function lineBreakText(value) {
  return escapeHtml(String(value || "")).replace(/\n/g, "<br>");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttr(value) {
  return escapeHtml(value || "");
}

function getInfoIcon(type) {
  switch (type) {
    case "weather":
      return `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="5"></circle>
          <line x1="12" y1="1" x2="12" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="23"></line>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
          <line x1="1" y1="12" x2="3" y2="12"></line>
          <line x1="21" y1="12" x2="23" y2="12"></line>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </svg>
      `;
    case "staff":
      return `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      `;
    case "parking":
      return `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M5 10l-1.5-4A2 2 0 0 1 5.4 3.5h13.2a2 2 0 0 1 1.9 2.1L19 10"></path>
          <path d="M3 10h18v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6z"></path>
          <circle cx="7" cy="14" r="1"></circle>
          <circle cx="17" cy="14" r="1"></circle>
        </svg>
      `;
    case "hashtag":
    default:
      return `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
        </svg>
      `;
  }
}

function noorData(raw){
 const f=raw.editor.fields,c=raw.copy,e=raw.event,a=raw.assets;
 const names=raw.couple;
 const data={site:{title:raw.seo.title,defaultLanguage:"en",musicUrl:a.music},ui:{languageOptions:{en:"English"},playMusic:{en:"Play music"},pauseMusic:{en:"Pause music"}},hero:{partnerOne:f.groomName,partnerTwo:f.brideName,displayPartnerOne:names.partnerOne,displayPartnerTwo:names.partnerTwo,middleText:"&"},blessingsSection:{withLoveLine:c.withLoveLine,inviteLine:c.invitationLine,joiner:"&",partnerOneParentage:c.parentsLineTwo,partnerTwoParentage:c.parentsLineOne,eventsIntro:"On the following occasions",ganeshaInvocation:[],familyLines:[]},events:raw.events.map(x=>({...x,title:x.name,dateText:x.date,mapLabel:x.mapUrl?"View Map":""})),detailsSection:{title:c.detailsTitle,intro:c.familyBody,items:raw.events.filter(x=>x.dressCode).map(x=>({icon:"staff",title:x.name,body:x.dressCode}))},rsvpSection:{subtitle:c.parentsLineTwo+"\n"+c.parentsLineOne},countdownSection:{title:"The countdown begins",message:c.closingMessage,footer:c.closingTitle,targetDate:new Date(`${e.month} ${e.day}, ${e.year} 12:00:00 GMT+0530`).toISOString(),completeText:"Celebrations have begun",units:{days:"Days",hours:"Hours",minutes:"Mins",seconds:"Secs"}},brandFooter:{themeName:"Noor Lanterns"},dateReveal:e};
 return data;
}
function bindNoorRsvp(){const form=document.getElementById("noor-rsvp");if(!form)return;form.addEventListener("submit",async event=>{event.preventDefault();const status=document.getElementById("noor-rsvp-status"),button=form.querySelector('button');button.disabled=true;status.textContent="Sendingâ€¦";try{const fields=Object.fromEntries(new FormData(form));const response=await fetch('./rsvp/submit.php',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({fields})});const result=await response.json();if(!response.ok||!result.ok)throw Error(result.error||'Unable to send RSVP. Please try again.');status.textContent='Thank you. Your RSVP has been received.';form.reset()}catch(error){status.textContent=error.message}finally{button.disabled=false}})}

