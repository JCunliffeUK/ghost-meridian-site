/* Ghost Meridian homepage: the twilight sky and the page's one load moment.
   The meridian draws across in 28 steps, the diamond lands on it with a strike of light,
   and then everything is still. With reduced motion the final frame shows straight away. */
(() => {
  const hero = document.querySelector('.hero');
  const sky = document.getElementById('sky');
  const fxCanvas = document.getElementById('fx');
  const meridian = document.getElementById('meridian');
  if (!hero || !sky || !fxCanvas || !meridian || !sky.getContext) return;

  const line = meridian.querySelector('.gm-meridian-line');
  const marker = meridian.querySelector('.gm-meridian-marker');
  const diamondSvg = marker.querySelector('svg');
  const copy = hero.querySelector('.hero-copy');
  const bgCtx = sky.getContext('2d');
  const fx = fxCanvas.getContext('2d');
  const root = document.documentElement;
  const reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reduce = reduceQuery.matches;

  // Hidden Horizon, as RGB
  const PAL = {
    ink: [23, 27, 43], blue: [41, 53, 74], lilac: [149, 132, 182],
    glow: [245, 145, 114], glimmer: [233, 199, 122], paper: [244, 232, 214]
  };
  const css = c => `rgb(${c[0]},${c[1]},${c[2]})`;
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + 0.5) / 16);
  const dith = (x, y) => BAYER[(y & 3) * 4 + (x & 3)];

  // A small seeded random, so the stars sit in the same places on every visit
  function rng(seed) {
    return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  }

  let PX, W, H, lineY, dX, R, textBox;

  function layout() {
    PX = window.innerWidth < 640 ? 3 : 4;
    // The diamond is 13 art pixels, drawn at the same pixel size as the sky
    const dSize = 13 * PX;
    diamondSvg.setAttribute('width', dSize);
    diamondSvg.setAttribute('height', dSize);

    const h = hero.getBoundingClientRect();
    W = Math.max(1, Math.ceil(h.width / PX));
    H = Math.max(1, Math.ceil(h.height / PX));
    sky.width = fxCanvas.width = W;
    sky.height = fxCanvas.height = H;

    const l = line.getBoundingClientRect();
    const m = marker.getBoundingClientRect();
    lineY = Math.round((l.top - h.top + l.height / 2) / PX);
    dX = Math.round((m.left - h.left + m.width / 2) / PX);
    R = 6;

    // The sky stays calm behind the words
    const kids = copy.children;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const k of kids) {
      const r = k.getBoundingClientRect();
      x0 = Math.min(x0, r.left); y0 = Math.min(y0, r.top); x1 = Math.max(x1, r.right); y1 = Math.max(y1, r.bottom);
    }
    textBox = { x0: (x0 - h.left) / PX, y0: (y0 - h.top) / PX, x1: (x1 - h.left) / PX, y1: (y1 - h.top) / PX };
    paintSky();
  }

  // Night Ink overhead, easing to Blue Hour at the horizon, with a Wild Lilac haze
  // and a thin band of Afterglow gathered round the diamond. Below the line the light
  // falls away like a reflection and is gone before the next section starts.
  function paintSky() {
    const img = bgCtx.createImageData(W, H);
    const d = img.data;
    const below = H - lineY;
    const spreadP = Math.max(3, lineY * 0.035);
    const spreadH = Math.max(8, lineY * 0.22);
    const spreadX = W * 0.3;
    const T = textBox, soft = 16;
    const calm = (x, y) => {
      const ox = Math.max(T.x0 - x, 0, x - T.x1), oy = Math.max(T.y0 - y, 0, y - T.y1);
      return Math.min(1, Math.hypot(ox, oy) / soft);
    };

    for (let y = 0; y < H; y++) {
      const above = y <= lineY;
      const dy = Math.abs(y - lineY);
      for (let x = 0; x < W; x++) {
        const t = dith(x, y);
        const focus = Math.exp(-Math.pow((x - dX) / spreadX, 2));
        const pool = 0.25 + 0.75 * focus;
        const open = calm(x, y);
        let warm, haze, blue;
        if (above) {
          const up = 1 - dy / Math.max(1, lineY);
          warm = Math.exp(-dy / spreadP) * pool * 0.42 * (dy <= 1 ? 1 : open);
          haze = Math.exp(-dy / spreadH) * pool * 0.36 * open;
          blue = Math.pow(up, 2.2) * 0.62 * (0.35 + 0.65 * open);
        } else {
          const fall = 1 - dy / Math.max(1, below);
          warm = Math.exp(-dy / 1.4) * focus * 0.32;
          haze = Math.exp(-dy / Math.max(3, below * 0.12)) * pool * 0.32;
          blue = Math.pow(Math.max(0, fall), 2.4) * 0.5;
        }
        let c = PAL.ink;
        if (warm > t) c = PAL.glow;
        else if (haze > t) c = PAL.lilac;
        else if (blue > t) c = PAL.blue;
        const i = (y * W + x) * 4;
        d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255;
      }
    }
    bgCtx.putImageData(img, 0, 0);

    // A few still stars, kept off the words. Glimmer is rare: it should feel like a find.
    const rand = rng(1021);
    const n = Math.round(W * lineY / 900);
    for (let i = 0; i < n; i++) {
      const x = Math.floor(rand() * W);
      const y = Math.floor(Math.pow(rand(), 1.3) * (lineY - 6));
      const r = rand();
      if (calm(x, y) < 1) continue;
      bgCtx.fillStyle = css(r < 0.08 ? PAL.glimmer : r < 0.5 ? PAL.paper : PAL.lilac);
      bgCtx.fillRect(x, y, 1, 1);
    }
  }

  // The strike: as the line reaches the diamond, a flattened ring of light spreads and
  // dithers away, a flare runs along the line, and sparks fly off and fade pixel by pixel.
  let sparks = [];
  function px(x, y, c) { fx.fillStyle = css(c); fx.fillRect(x, y, 1, 1); }

  function spawnSparks() {
    sparks = Array.from({ length: 30 }, () => {
      const a = Math.random() * Math.PI * 2;
      const s = 22 + Math.random() * 46;
      const r = Math.random();
      return {
        x: dX + Math.cos(a) * 3, y: lineY + Math.sin(a) * 3,
        vx: Math.cos(a) * s * 1.5, vy: Math.sin(a) * s * 0.75 - 5,
        life: 0.5 + Math.random() * 0.7, age: 0,
        c: r < 0.3 ? PAL.paper : r < 0.65 ? PAL.glimmer : PAL.glow
      };
    });
  }

  function drawStrike(a) {
    if (a < 0.75) {
      const k = a / 0.75;
      const r = R + 2 + Math.round(k * R * 4.5);
      const fade = 1 - k;
      const c = a < 0.18 ? PAL.paper : a < 0.4 ? PAL.glimmer : a < 0.58 ? PAL.glow : PAL.lilac;
      for (let i = 0; i <= r; i++) {
        const oy = Math.round((r - i) * 0.6);
        for (const [x, y] of [[dX + i, lineY - oy], [dX - i, lineY - oy], [dX + i, lineY + oy], [dX - i, lineY + oy]]) {
          if (y >= 0 && y < H && dith(x, y) < fade) px(x, y, c);
        }
      }
    }
    if (a < 0.5) {
      const L = Math.round(Math.sin(Math.PI * a / 0.5) * R * 9);
      for (let dd = R + 1; dd <= R + L; dd++) {
        const f = 1 - (dd - R) / Math.max(1, L);
        const c = f > 0.6 ? PAL.paper : PAL.glimmer;
        if (dith(dX + dd, lineY) < f + 0.15) px(dX + dd, lineY, c);
        if (dith(dX - dd, lineY) < f + 0.15) px(dX - dd, lineY, c);
      }
    }
  }

  function drawSparks(dt) {
    let alive = false;
    for (const s of sparks) {
      if (s.age >= s.life) continue;
      alive = true;
      s.age += dt;
      const drag = Math.pow(0.12, dt);
      s.vx *= drag;
      s.vy = s.vy * drag - 8 * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      const left = 1 - s.age / s.life;
      const x = Math.round(s.x), y = Math.round(s.y);
      if (dith(x, y) < left + 0.1 && (left > 0.35 || Math.floor(s.age * 20) % 2 === 0)) {
        px(x, y, left < 0.3 ? PAL.lilac : s.c);
      }
    }
    return alive;
  }

  const LINE_AT = 0.25, LINE_FOR = 1.1, STEPS = 28;
  let start = null, last = null, strikeT = null, raf = null;

  function finish() {
    if (raf !== null) cancelAnimationFrame(raf);
    raf = null;
    fx.clearRect(0, 0, W, H);
    line.style.clipPath = '';
    root.classList.remove('js-horizon');
    root.classList.add('horizon-done');
  }

  function frame(now) {
    raf = null;
    if (start === null) { start = now; last = now; }
    const t = (now - start) / 1000;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    const reveal = Math.max(0, Math.min(1, (t - LINE_AT) / LINE_FOR));
    const steps = Math.floor(reveal * STEPS) / STEPS;
    line.style.clipPath = `inset(0 ${(100 - steps * 100).toFixed(3)}% 0 0)`;
    const lx = W * steps;

    fx.clearRect(0, 0, W, H);
    if (lx >= dX && strikeT === null) {
      strikeT = t;
      root.classList.add('marker-on');
      spawnSparks();
    }
    let sparking = false;
    if (strikeT !== null) {
      // Stepped at 20 frames a second, like the rest of the brand's motion
      const a = Math.floor((t - strikeT) * 20) / 20;
      drawStrike(a);
      sparking = drawSparks(dt);
      if (steps >= 1 && a > 0.8 && !sparking) { finish(); return; }
    }
    raf = requestAnimationFrame(frame);
  }

  let pending = false;
  function onResize() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => { pending = false; layout(); });
  }

  layout();
  if (reduce) {
    root.classList.add('horizon-done');
  } else {
    root.classList.add('js-horizon');
    raf = requestAnimationFrame(frame);
  }

  reduceQuery.addEventListener('change', e => {
    reduce = e.matches;
    if (reduce) finish();
  });
  if ('ResizeObserver' in window) new ResizeObserver(onResize).observe(hero);
  else window.addEventListener('resize', onResize);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(onResize);
})();
