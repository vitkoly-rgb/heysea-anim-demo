/**
 * 01 · Series slider + "ONBOARD" water cursor
 *
 * A) Pinned section; each next panel slides up over the previous one (scrubbed).
 *    The covered panel scales up a bit, drifts and darkens; titles rise via SplitText line masks.
 * B) Custom cursor inside the stage: 64px circle with water simulated on a <canvas>
 *    (1D spring columns + neighbour spreading). Mouse velocity/acceleration tilt & ripple the
 *    surface; damping lets it settle flat. rAF only runs while needed and the section is on screen.
 */
(() => {
  const section = document.getElementById('series-cursor');
  if (!section || !window.gsap) return;

  const reduced = !!(window.HS && HS.reduced);
  const stage = section.querySelector('.sc__stage');
  const panels = gsap.utils.toArray('.sc__panel', section);
  const videos = panels.map((p) => p.querySelector('video'));
  let activeIndex = 0;

  /* ------------------------------------------------------------------ *
   * A) Scroll: pinned stacked panels
   * ------------------------------------------------------------------ */
  if (!reduced && panels.length > 1) {
    section.classList.add('sc--pinned');

    // Split titles into masked lines (re-splits on resize thanks to autoSplit)
    const splits = panels.map((p) => SplitText.create(p.querySelector('.sc__title'), { type: 'lines', mask: 'lines', linesClass: 'line' }));

    gsap.set(panels.slice(1), { yPercent: 100 });
    gsap.set(panels.slice(1).map((p) => p.querySelector('.sc__media')), { yPercent: -60 });

    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: () => '+=' + (panels.length - 1) * window.innerHeight * 1.1,
        pin: true,
        scrub: 0.6,
        invalidateOnRefresh: true,
        onUpdate: (st) => { activeIndex = Math.round(st.progress * (panels.length - 1)); },
      },
    });

    panels.forEach((panel, i) => {
      if (i === 0) return;
      const prev = panels[i - 1];
      const at = i - 1; // each transition occupies 1 unit of timeline
      const prevMedia = prev.querySelector('.sc__media');
      const prevCopy = prev.querySelector('.sc__copy');
      const copy = panel.querySelector('.sc__copy');

      // incoming panel slides over, its media counter-moves (curtain/parallax feel)
      tl.to(panel, { yPercent: 0, duration: 1 }, at)
        .to(panel.querySelector('.sc__media'), { yPercent: 0, duration: 1 }, at)
        // covered panel: slight zoom + push + darken, copy leaves upward
        .to(prevMedia, { scale: 1.12, yPercent: -12, duration: 1 }, at)
        .to(prev.querySelector('.sc__shade'), { opacity: 0.65, duration: 1 }, at)
        .to(prevCopy, { y: -60, autoAlpha: 0, duration: 0.45 }, at)
        // incoming copy: title lines rise out of their masks, then text
        .from(splits[i].lines, { yPercent: 105, duration: 0.4, stagger: 0.06 }, at + 0.55)
        .from(copy.querySelectorAll('.sc__count, .sc__text, .sc__cta'), { y: 24, autoAlpha: 0, duration: 0.35, stagger: 0.05 }, at + 0.62);
    });
  }

  /* Videos: autoplay only while the section is visible (and never under reduced motion). */
  const io = new IntersectionObserver(([entry]) => {
    section.dataset.visible = entry.isIntersecting ? '1' : '';
    if (!reduced) videos.forEach((v) => (entry.isIntersecting ? v.play().catch(() => {}) : v.pause()));
    if (entry.isIntersecting) cursor.wake(); else cursor.hide();
  }, { threshold: 0 });

  /* ------------------------------------------------------------------ *
   * B) Water cursor
   * ------------------------------------------------------------------ */
  const cursor = createWaterCursor(section.querySelector('.sc-cursor'), stage, reduced);
  io.observe(section);

  stage.addEventListener('click', (e) => {
    if (e.target.closest('a')) return; // real links keep working
    console.log('[series-cursor] onboard →', panels[activeIndex].dataset.title);
  });

  function createWaterCursor(el, area, staticWater) {
    const noop = { wake() {}, hide() {} };
    // Fine pointer + hover only; touch devices get the static badge instead (CSS).
    if (!el || !matchMedia('(hover: hover) and (pointer: fine)').matches) return noop;

    document.body.appendChild(el); // escape any transformed/pinned ancestors so position:fixed is viewport-based
    section.classList.add('sc--cursor');

    const canvas = el.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const SIZE = 64;                  // CSS px
    const R = SIZE / 2 - 1;           // ring radius
    const REST = SIZE * 0.52;         // flat water line (slightly below centre)
    const N = 22;                     // spring columns
    const K = 120;                    // spring stiffness (pull back to rest)
    const DAMP = 4.2;                 // damping → how fast it settles
    const SPREAD = 900;               // neighbour coupling → waves travel sideways
    const MAX_H = SIZE * 0.3;
    const MAX_V = 700;                // velocity clamp → no explosions
    const h = new Float32Array(N);    // height offset (+ = up)
    const v = new Float32Array(N);

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = canvas.height = SIZE * dpr;
    ctx.scale(dpr, dpr);

    const mouse = { x: -100, y: -100, has: false };
    const pos = { x: -100, y: -100 };
    let vel = { x: 0, y: 0 }, prevVel = { x: 0, y: 0 };
    let raf = 0, last = 0, visible = false, idleFrames = 0;

    window.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      if (!mouse.has) { pos.x = e.clientX; pos.y = e.clientY; } // first move: no fly-in from the corner
      mouse.x = e.clientX; mouse.y = e.clientY; mouse.has = true;
      wake();
    }, { passive: true });
    document.addEventListener('pointerleave', () => { mouse.has = false; wake(); });
    // scrolling moves the stage under a still mouse → re-check containment
    window.addEventListener('scroll', () => wake(), { passive: true });

    function inside() {
      if (!mouse.has || !section.dataset.visible) return false;
      const r = area.getBoundingClientRect();
      if (mouse.x < r.left || mouse.x > r.right || mouse.y < r.top || mouse.y > r.bottom) return false;
      // real cursor over links/buttons → hide custom one
      const t = document.elementFromPoint(mouse.x, mouse.y);
      return !(t && t.closest('a, button'));
    }

    function wake() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); } }
    function hide() { visible = false; el.classList.remove('is-visible'); }

    function tick(now) {
      raf = 0;
      const dt = Math.min((now - last) / 1000, 1 / 30); // clamp after tab switches
      last = now;

      // visibility
      const show = inside();
      if (show !== visible) { visible = show; el.classList.toggle('is-visible', show); }

      // follow: frame-rate independent lerp
      const k = 1 - Math.pow(1 - 0.22, dt * 60);
      const nx = pos.x + (mouse.x - pos.x) * k;
      const ny = pos.y + (mouse.y - pos.y) * k;
      // velocity (px/s) of the drawn cursor, lightly smoothed
      const vx = (nx - pos.x) / Math.max(dt, 1e-3), vy = (ny - pos.y) / Math.max(dt, 1e-3);
      prevVel = vel;
      vel = { x: vel.x * 0.6 + vx * 0.4, y: vel.y * 0.6 + vy * 0.4 };
      pos.x = nx; pos.y = ny;
      el.style.transform = `translate3d(${pos.x - SIZE / 2}px, ${pos.y - SIZE / 2}px, 0)`;

      if (!staticWater) simulate(dt);
      draw();

      // keep running while moving / sloshing; otherwise sleep until next input
      const energy = h.reduce((a, b) => a + Math.abs(b), 0) + v.reduce((a, b) => a + Math.abs(b), 0);
      const moving = Math.abs(mouse.x - pos.x) + Math.abs(mouse.y - pos.y) > 0.1;
      idleFrames = energy < 0.5 && !moving ? idleFrames + 1 : 0;
      if (idleFrames < 10 && section.dataset.visible) raf = requestAnimationFrame(tick);
      else { h.fill(0); v.fill(0); draw(); } // snap the residual to perfectly flat before sleeping
    }

    function simulate(dt) {
      // inertia: container accelerates right → water piles up on the left (and vice versa);
      // steady velocity adds a drag tilt; speed adds random ripples.
      const ax = (vel.x - prevVel.x) / Math.max(dt, 1e-3);
      const speed = Math.hypot(vel.x, vel.y);
      // sqrt response: small/slow movements already give a visible tilt, fast ones saturate (clamped)
      const drag = Math.sign(vel.x) * 95 * Math.sqrt(Math.abs(vel.x));
      const tilt = gsap.utils.clamp(-2600, 2600, drag + ax * 0.12);
      const bob = gsap.utils.clamp(-1500, 1500, (vel.y - prevVel.y) / Math.max(dt, 1e-3) * 0.08);
      const steps = 3, sdt = dt / steps;
      for (let s = 0; s < steps; s++) {
        for (let i = 0; i < N; i++) {
          const xn = (i / (N - 1)) * 2 - 1;                      // -1..1 across the circle
          const left = h[i > 0 ? i - 1 : i], right = h[i < N - 1 ? i + 1 : i];
          let a = -K * h[i] - DAMP * v[i] + SPREAD * (left + right - 2 * h[i]) / N;
          a += -xn * tilt * 0.8;                                  // slosh
          a += bob * (1 - xn * xn) * 0.6;                         // vertical bump makes the middle heave
          v[i] += a * sdt;
        }
        for (let i = 0; i < N; i++) {
          v[i] = gsap.utils.clamp(-MAX_V, MAX_V, v[i]);
          h[i] = gsap.utils.clamp(-MAX_H, MAX_H, h[i] + v[i] * sdt);
        }
      }
      // turbulence proportional to speed
      // (a smooth gaussian bump over several columns, so the surface rolls instead of spiking)
      if (speed > 12) {
        const c = Math.random() * (N - 1), w = 2.5 + Math.random() * 2;
        const kick = (Math.random() - 0.5) * Math.min(30 * Math.sqrt(speed), 1500) * 0.2;
        for (let i = 0; i < N; i++) v[i] += kick * Math.exp(-((i - c) ** 2) / (2 * w * w));
      }
    }

    // builds a closed path: smooth curve through column tops down to the bottom of the canvas
    function surface(height, dy) {
      const step = SIZE / (N - 1);
      const y = (i) => REST + dy - height(i);
      ctx.beginPath();
      ctx.moveTo(0, SIZE);
      ctx.lineTo(0, y(0));
      for (let i = 1; i < N; i++) {
        const x0 = (i - 1) * step, x1 = i * step;
        ctx.quadraticCurveTo(x0, y(i - 1), (x0 + x1) / 2, (y(i - 1) + y(i)) / 2);
      }
      ctx.lineTo(SIZE, y(N - 1));
      ctx.lineTo(SIZE, SIZE);
      ctx.closePath();
    }

    function draw() {
      ctx.clearRect(0, 0, SIZE, SIZE);
      ctx.save();
      ctx.beginPath();
      ctx.arc(SIZE / 2, SIZE / 2, R - 0.5, 0, Math.PI * 2);
      ctx.clip();
      // back wave (mirrored, translucent) gives depth while sloshing. Its opacity and offset scale with
      // the current wave amplitude, so at rest it fully merges into the flat solid water (no visible band).
      let amp = 0;
      for (let i = 0; i < N; i++) amp = Math.max(amp, Math.abs(h[i]) + Math.abs(v[i]) * 0.02);
      const mix = Math.min(1, amp / 4);
      if (mix > 0.02) {
        surface((i) => -h[N - 1 - i] * 0.8, -2.5 * mix);
        ctx.fillStyle = `rgba(255,255,255,${(0.45 * mix).toFixed(3)})`;
        ctx.fill();
      }
      // front wave
      surface((i) => h[i], 0);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.restore();
      // ring
      ctx.beginPath();
      ctx.arc(SIZE / 2, SIZE / 2, R, 0, Math.PI * 2);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    draw();
    return { wake, hide };
  }
})();
