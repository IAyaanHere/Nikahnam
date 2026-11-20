# Nikah & Wedding Invitation Website (Muhammed & Fathimah)

A beautiful, interactive Nikah / Wedding Invitation website featuring envelope opening animation, video intro, Quran recitation background audio, countdown timer, interactive scratch cards for the wedding date, and RSVP submission.

---

## Folder Structure

```
nikah 2/
├── index.html                   # Main landing page (loads on localhost)
├── wedding.json                 # All wedding details (couple names, dates, venues, parents, audio)
├── server.js                    # Built-in lightweight local server (supports video streaming & RSVP)
├── package.json                 # npm start script
├── assets/
│   ├── css/
│   │   ├── fonts.css            # Offline Google fonts
│   │   └── styles.css           # Invitation styles, themes, and animations
│   ├── js/
│   │   ├── script.js            # Main application rendering & parallax animations
│   │   ├── envelope.js          # Envelope video intro & reveal controller
│   │   ├── gsap.min.js          # GSAP animation engine
│   │   └── ScrollTrigger.min.js # Scroll-driven animation plugin
│   ├── fonts/                   # All offline font files (Aboreto, Cormorant, Montserrat, Gotu, etc.)
│   └── media/                   # Video intro, background images, banners, icons & music
│       ├── intro.mov            # Opening animation video
│       ├── intro-poster.jpg     # Video thumbnail poster
│       ├── qura.mp3             # Background recitation music
│       ├── top-background.png   # Hero lantern backdrop
│       ├── event-card.png       # Card decorations
│       ├── scratch-gold.png     # Scratch card foil texture
│       └── ...
└── legacy/                      # Original unorganized downloaded files (backup)
```

---

## How to Run on Localhost

### Option 1: Using Node.js (Recommended)
```bash
npm start
# OR
node server.js
```
Then open your browser at:
👉 **`http://localhost:3000`**

### Option 2: Using Python
```bash
python -m http.server 3000
```
Then open:
👉 **`http://localhost:3000`**

---

## Features
- **Video Envelope Intro**: Tap to open interactive animation with sound and skip option.
- **Background Music Player**: Floating audio toggle with Quran recitation (`assets/media/qura.mp3`).
- **Interactive Scratch-to-Reveal Date**: Guests can scratch the gold seals to reveal the date.
- **Events & Map Directions**: Google Maps location links for all events.
- **Live Countdown Timer**: Real-time days, hours, minutes, and seconds countdown.
- **RSVP Form**: Submits attendance directly to `rsvps.json`.
- **100% Offline Compatible**: All fonts, styles, scripts, videos, and music are stored locally.
