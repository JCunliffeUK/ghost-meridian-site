/* The twilight sky, in three layers that drift apart as you scroll; the page's one load moment;
   a single Glimmer star that twinkles; waypoints that light as you reach them; and a ghost that
   watches the cursor. With reduced motion every one of these shows its final frame and stays still. */
(() => {
  const hero = document.querySelector('.hero');
  const sky = document.getElementById('sky');
  const stars = document.getElementById('stars');
  const haze = document.getElementById('haze');
  const fxCanvas = document.getElementById('fx');
  const meridian = document.getElementById('meridian');
  if (!hero || !sky || !stars || !haze || !fxCanvas || !meridian || !sky.getContext) return;

  const line = meridian.querySelector('.gm-meridian-line');
  const marker = meridian.querySelector('.gm-meridian-marker');
  const diamondSvg = marker.querySelector('svg');
  const copy = hero.querySelector('.hero-copy');
  const bgCtx = sky.getContext('2d');
  const stCtx = stars.getContext('2d');
  const hzCtx = haze.getContext('2d');
  const fx = fxCanvas.getContext('2d');
  const root = document.documentElement;
  if (!bgCtx || !stCtx || !hzCtx || !fx) {
    root.classList.remove('js-horizon');
    root.classList.add('horizon-done');
    return;
  }
  const reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reduce = reduceQuery.matches;

  const PAL = {
    ink: [23, 27, 43], blue: [41, 53, 74], lilac: [149, 132, 182],
    glow: [245, 145, 114], glimmer: [233, 199, 122], paper: [244, 232, 214], white: [255, 255, 255]
  };
  const css = c => `rgb(${c[0]},${c[1]},${c[2]})`;
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + 0.5) / 16);
  const dith = (x, y) => BAYER[(y & 3) * 4 + (x & 3)];
  function rng(seed) { return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; }

  let PX, W, H, lineY, dX, R, textBox, glim = null;

  function layout() {
    PX = window.innerWidth < 640 ? 3 : 4;
    const dSize = 13 * PX;
    diamondSvg.setAttribute('width', dSize);
    diamondSvg.setAttribute('height', dSize);
    const h = hero.getBoundingClientRect();
    W = Math.max(1, Math.ceil(h.width / PX));
    H = Math.max(1, Math.ceil(h.height / PX));
    for (const c of [sky, stars, haze, fxCanvas]) { c.width = W; c.height = H; }
    const l = line.getBoundingClientRect();
    const m = marker.getBoundingClientRect();
    lineY = Math.round((l.top - h.top + l.height / 2) / PX);
    dX = Math.round((m.left - h.left + m.width / 2) / PX);
    R = 6;
    const kids = copy.children;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const k of kids) {
      const r = k.getBoundingClientRect();
      x0 = Math.min(x0, r.left); y0 = Math.min(y0, r.top); x1 = Math.max(x1, r.right); y1 = Math.max(y1, r.bottom);
    }
    textBox = { x0: (x0 - h.left) / PX, y0: (y0 - h.top) / PX, x1: (x1 - h.left) / PX, y1: (y1 - h.top) / PX };
    paintSky();
    parallax();
  }

  // Night Ink overhead easing to Blue Hour at the horizon goes in the far layer; the Wild Lilac haze and the
  // Afterglow band stay with the line, in the near layer; the stars sit farthest of all.
  function paintSky() {
    const base = bgCtx.createImageData(W, H), near = hzCtx.createImageData(W, H);
    const b = base.data, n = near.data;
    const below = H - lineY;
    const spreadP = Math.max(3, lineY * 0.035);
    const spreadX = W * 0.3;
    const T = textBox;
    const clamp = v => Math.max(0, Math.min(1, v));
    const smooth = v => { v = clamp(v); return v * v * (3 - 2 * v); };
    // A soft elliptical clearing keeps the copy readable without a rectangular cliff.
    const cx = (T.x0 + T.x1) / 2, cy = (T.y0 + T.y1) / 2;
    const rx = (T.x1 - T.x0) / 2 + 12, ry = (T.y1 - T.y0) / 2 + 10;
    const calm = (x, y) => smooth((Math.hypot((x - cx) / rx, (y - cy) / ry) - 0.8) / 0.8);
    // Shared tangents make one continuous, gently rising arc, with a broad right crest.
    // Coordinates are fractions of the canvas width and the meridian height.
    const knots = [[0, 0.82, -0.05], [0.35, 0.73, -0.38], [0.82, 0.42, 0], [1, 0.49, 0.4]];
    const narrow = 1 - smooth((W * PX - 640) / 560);
    const crestFloor = Math.min(lineY - 12, T.y1 + 10);
    const curve = x => {
      const u = x / Math.max(1, W - 1);
      let i = 0;
      while (i < knots.length - 2 && u > knots[i + 1][0]) i++;
      const [ax, ay, am] = knots[i], [bx, by, bm] = knots[i + 1];
      const span = bx - ax, t = (u - ax) / span, t2 = t * t, t3 = t2 * t;
      const v = (2 * t3 - 3 * t2 + 1) * ay + (t3 - 2 * t2 + t) * span * am
        + (-2 * t3 + 3 * t2) * by + (t3 - t2) * span * bm;
      // Compress the arc below the copy on phones, preserving the same silhouette.
      const compact = crestFloor + (v - 0.42) / 0.58 * (lineY - crestFloor);
      return v * lineY * (1 - narrow) + compact * narrow;
    };
    const contour = Array.from({ length: W }, (_, x) => curve(x));
    for (let y = 0; y < H; y++) {
      const above = y <= lineY;
      const dy = Math.abs(y - lineY);
      for (let x = 0; x < W; x++) {
        const t = dith(x, y);
        const focus = Math.exp(-Math.pow((x - dX) / spreadX, 2));
        const pool = 0.25 + 0.75 * focus;
        const open = calm(x, y);
        let warm, hz, blue;
        if (above) {
          const up = 1 - dy / Math.max(1, lineY);
          warm = Math.exp(-dy / spreadP) * pool * 0.42 * (dy <= 1 ? 1 : open);
          const edge = contour[x], feather = Math.max(3, lineY * 0.025);
          const depth = clamp((y - edge + feather) / Math.max(1, lineY - edge + feather));
          hz = Math.pow(depth, 0.8) * 0.3;
          const blueDepth = clamp((y - edge + lineY * 0.22) / Math.max(1, lineY - edge + lineY * 0.22));
          blue = Math.pow(blueDepth, 1.3) * 0.5 * (0.6 + 0.4 * open);
        } else {
          const fall = 1 - dy / Math.max(1, below);
          warm = Math.exp(-dy / 1.4) * focus * 0.32;
          hz = Math.exp(-dy / Math.max(3, below * 0.12)) * pool * 0.32;
          blue = Math.pow(Math.max(0, fall), 2.4) * 0.5;
        }
        const i = (y * W + x) * 4;
        const c = blue > t ? PAL.blue : PAL.ink;
        b[i] = c[0]; b[i + 1] = c[1]; b[i + 2] = c[2]; b[i + 3] = 255;
        let nc = null;
        if (warm > t) nc = PAL.glow; else if (hz > t) nc = PAL.lilac;
        if (nc) { n[i] = nc[0]; n[i + 1] = nc[1]; n[i + 2] = nc[2]; n[i + 3] = 255; }
      }
    }
    bgCtx.putImageData(base, 0, 0);
    hzCtx.putImageData(near, 0, 0);

    stCtx.clearRect(0, 0, W, H);
    const rand = rng(1021);
    const cnt = Math.round(W * lineY / 900);
    glim = null;
    for (let i = 0; i < cnt; i++) {
      const x = Math.floor(rand() * W);
      const y = Math.floor(Math.pow(rand(), 1.3) * (lineY - 6));
      const r = rand();
      // Only protect the actual copy, leaving the sky above the title populated.
      if (x >= T.x0 - 6 && x <= T.x1 + 6 && y >= T.y0 - 7 && y <= T.y1 + 7) continue;
      stCtx.fillStyle = css(r < 0.08 ? PAL.glimmer : r < 0.5 ? PAL.white : PAL.lilac);
      stCtx.fillRect(x, y, 1, 1);
      if (!glim && r < 0.08 && x > W * 0.55 && y > 3 && y < lineY * 0.6) glim = { x, y };
    }
  }

  // The one Glimmer star: a slow four-frame twinkle, stepped like everything else
  let twinkleTimer = null, twinkleFrame = 0;
  const TWINKLE = [[[0, 0, 'glimmer']], [[0, 0, 'glimmer'], [-1, 0, 'glimmer'], [1, 0, 'glimmer'], [0, -1, 'glimmer'], [0, 1, 'glimmer']],
    [[0, 0, 'paper'], [-1, 0, 'glimmer'], [1, 0, 'glimmer'], [0, -1, 'glimmer'], [0, 1, 'glimmer']], [[0, 0, 'glimmer']], [[0, 0, 'glimmer']], [[0, 0, 'glimmer']], [[0, 0, 'glimmer']], [[0, 0, 'lilac']]];
  function twinkle() {
    if (!glim || reduce || document.hidden) return;
    stCtx.clearRect(glim.x - 1, glim.y - 1, 3, 3);
    for (const [ox, oy, c] of TWINKLE[twinkleFrame]) { stCtx.fillStyle = css(PAL[c]); stCtx.fillRect(glim.x + ox, glim.y + oy, 1, 1); }
    twinkleFrame = (twinkleFrame + 1) % TWINKLE.length;
  }

  // Parallax: the far layers lag the page, snapped to whole art pixels so nothing smears
  const K = { sky: 0.22, stars: 0.42, haze: 0 };
  function parallax() {
    if (reduce) { sky.style.transform = stars.style.transform = ''; return; }
    const y = window.scrollY;
    if (y > hero.offsetHeight + 40) return;
    const snap = v => Math.round(v / PX) * PX;
    sky.style.transform = `translateY(${snap(y * K.sky)}px)`;
    stars.style.transform = `translateY(${snap(y * K.stars)}px)`;
  }
  let scrollPending = false;
  window.addEventListener('scroll', () => {
    if (scrollPending) return;
    scrollPending = true;
    requestAnimationFrame(() => { scrollPending = false; parallax(); });
  }, { passive: true });

  // The strike, as on the live site
  let sparks = [];
  function px(x, y, c) { fx.fillStyle = css(c); fx.fillRect(x, y, 1, 1); }
  function spawnSparks() {
    sparks = Array.from({ length: 30 }, () => {
      const a = Math.random() * Math.PI * 2;
      const s = 22 + Math.random() * 46;
      const r = Math.random();
      return { x: dX + Math.cos(a) * 3, y: lineY + Math.sin(a) * 3, vx: Math.cos(a) * s * 1.5, vy: Math.sin(a) * s * 0.75 - 5,
        life: 0.5 + Math.random() * 0.7, age: 0, c: r < 0.3 ? PAL.paper : r < 0.65 ? PAL.glimmer : PAL.glow };
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
      s.vx *= drag; s.vy = s.vy * drag - 8 * dt;
      s.x += s.vx * dt; s.y += s.vy * dt;
      const left = 1 - s.age / s.life;
      const x = Math.round(s.x), y = Math.round(s.y);
      if (dith(x, y) < left + 0.1 && (left > 0.35 || Math.floor(s.age * 20) % 2 === 0)) px(x, y, left < 0.3 ? PAL.lilac : s.c);
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
    syncAmbient();
  }
  function frame(now) {
    raf = null;
    if (reduce || document.hidden || root.classList.contains('horizon-done')) { finish(); return; }
    if (start === null) { start = now; last = now; }
    const t = (now - start) / 1000;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const reveal = Math.max(0, Math.min(1, (t - LINE_AT) / LINE_FOR));
    const steps = Math.floor(reveal * STEPS) / STEPS;
    line.style.clipPath = `inset(0 ${(100 - steps * 100).toFixed(3)}% 0 0)`;
    const lx = W * steps;
    fx.clearRect(0, 0, W, H);
    if (lx >= dX && strikeT === null) { strikeT = t; root.classList.add('marker-on'); spawnSparks(); }
    let sparking = false;
    if (strikeT !== null) {
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
    requestAnimationFrame(() => { pending = false; layout(); paintScene(); });
  }

  // The game banner: a painted dusk, two ridges and the same sky, standing in for key art
  const keyart = document.getElementById('keyart');
  function paintScene() {
    if (!keyart || !keyart.getContext) return;
    const box = keyart.parentElement.getBoundingClientRect();
    const P = window.innerWidth < 640 ? 3 : 4;
    const w = Math.max(1, Math.ceil(box.width / P)), h = Math.max(1, Math.ceil(box.height / P));
    if (!w || !h) return;
    keyart.width = w; keyart.height = h;
    const ctx = keyart.getContext('2d');
    if (!ctx) return;
    const img = ctx.createImageData(w, h), d = img.data;
    const ly = Math.round(h * 0.64), sx = Math.round(w * 0.6);
    const spreadP = Math.max(3, ly * 0.05), spreadH = Math.max(8, ly * 0.3), spreadX = w * 0.28;
    const ridgeFar = x => ly - Math.round(7 + 5 * Math.sin(x / 11) + 3 * Math.sin(x / 29 + 1.3) + 2 * Math.sin(x / 5.3));
    const ridgeNear = x => ly - Math.round(2 + 3 * Math.sin(x / 7 + 2) + 2 * Math.sin(x / 17));
    for (let y = 0; y < h; y++) {
      const above = y <= ly, dy = Math.abs(y - ly);
      for (let x = 0; x < w; x++) {
        const t = dith(x, y);
        const focus = Math.exp(-Math.pow((x - sx) / spreadX, 2));
        const pool = 0.3 + 0.7 * focus;
        let c;
        if (above) {
          const up = 1 - dy / Math.max(1, ly);
          const warm = Math.exp(-dy / spreadP) * pool * 0.7;
          const hz = Math.exp(-dy / spreadH) * pool * 0.5;
          const blue = Math.pow(up, 2) * 0.7;
          c = warm > t ? PAL.glow : hz > t ? PAL.lilac : blue > t ? PAL.blue : PAL.ink;
          if (y >= ridgeFar(x)) { const e = y - ridgeFar(x); c = e < 2 && dith(x, y) < 0.5 ? PAL.lilac : PAL.blue; }
          if (y >= ridgeNear(x)) c = PAL.ink;
        } else {
          const fall = 1 - dy / Math.max(1, h - ly);
          const warm = Math.exp(-dy / 1.6) * focus * 0.4;
          const hz = Math.exp(-dy / Math.max(3, (h - ly) * 0.15)) * pool * 0.3;
          const blue = Math.pow(Math.max(0, fall), 2.4) * 0.45;
          c = warm > t ? PAL.glow : hz > t ? PAL.lilac : blue > t ? PAL.blue : PAL.ink;
        }
        const i = (y * w + x) * 4;
        d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    const rand = rng(77);
    const cnt = Math.round(w * ly / 500);
    for (let i = 0; i < cnt; i++) {
      const x = Math.floor(rand() * w), y = Math.floor(Math.pow(rand(), 1.4) * (ly - 12));
      if (y >= ridgeFar(x)) continue;
      const r = rand();
      ctx.fillStyle = css(r < 0.06 ? PAL.glimmer : r < 0.5 ? PAL.paper : PAL.lilac);
      ctx.fillRect(x, y, 1, 1);
    }
  }

  // Waypoints light as each section comes into view
  const spines = document.querySelectorAll('.spine');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      for (const e of entries) if (e.isIntersecting) { e.target.classList.add('is-lit'); io.unobserve(e.target); }
    }, { rootMargin: '0px 0px -28% 0px' });
    spines.forEach(s => io.observe(s));
  } else spines.forEach(s => s.classList.add('is-lit'));

  // Ambient effects share a live motion/visibility gate, including queued callbacks.
  const ghost = document.getElementById('ghost'), eyes = document.getElementById('ghost-eyes');
  let ex = 0, ey = 0, eyeRaf = null, blinkTimer = null, blinkEnd = null;
  function stopAmbient() {
    clearInterval(twinkleTimer); twinkleTimer = null;
    clearTimeout(blinkTimer); blinkTimer = null;
    clearTimeout(blinkEnd); blinkEnd = null;
    if (eyeRaf !== null) cancelAnimationFrame(eyeRaf);
    eyeRaf = null;
    ex = ey = 0;
    if (eyes) eyes.style.transform = '';
    if (ghost) ghost.classList.remove('is-blinking');
  }
  function blink() {
    blinkTimer = null;
    if (reduce || document.hidden || !ghost || !eyes) return;
    ghost.classList.add('is-blinking');
    blinkEnd = setTimeout(() => { ghost.classList.remove('is-blinking'); blinkEnd = null; }, 140);
    blinkTimer = setTimeout(blink, 2800 + Math.random() * 3600);
  }
  function syncAmbient() {
    if (reduce || document.hidden) { stopAmbient(); return; }
    if (root.classList.contains('horizon-done') && twinkleTimer === null) twinkleTimer = setInterval(twinkle, 260);
    if (ghost && eyes && blinkTimer === null) blinkTimer = setTimeout(blink, 1800);
  }
  if (ghost && eyes) {
    window.addEventListener('pointermove', ev => {
      if (reduce || document.hidden || eyeRaf !== null) return;
      eyeRaf = requestAnimationFrame(() => {
        eyeRaf = null;
        if (reduce || document.hidden) return;
        const r = ghost.getBoundingClientRect();
        const cx = r.left + r.width / 2, cy = r.top + r.height * 0.38;
        const dx = ev.clientX - cx, dy = ev.clientY - cy;
        const nx = Math.abs(dx) < 40 ? 0 : Math.sign(dx), ny = Math.abs(dy) < 40 ? 0 : Math.sign(dy);
        if (nx !== ex || ny !== ey) { ex = nx; ey = ny; eyes.style.transform = `translate(${ex}px, ${ey * 0.5}px)`; }
      });
    }, { passive: true });
  }

  layout();
  paintScene();
  if (reduce || document.hidden || root.classList.contains('horizon-done')) {
    finish();
  } else {
    root.classList.add('js-horizon');
    raf = requestAnimationFrame(frame);
  }
  reduceQuery.addEventListener('change', e => {
    reduce = e.matches;
    if (reduce) { finish(); paintSky(); }
    syncAmbient();
    parallax();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) finish();
    syncAmbient();
  });
  syncAmbient();
  if ('ResizeObserver' in window) new ResizeObserver(onResize).observe(hero);
  else window.addEventListener('resize', onResize);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(onResize);
})();
