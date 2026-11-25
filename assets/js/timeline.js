/* ==========================================================================
   03 · Timeline compass
   - Dial rotates so the selected year lands at the pointer (3 o'clock).
   - Big year rolls digit-by-digit, copy crossfades, counter updates.
   - Navigation: vertical scroll (pinned, ~50vh per year), ‹ › buttons, click a year, keyboard (slider semantics), drag/swipe on the dial.
   - Auto-advance timer fills the progress bar; pauses on hover / focus / off-screen / hidden tab / drag.
   ========================================================================== */
(() => {
  'use strict';
  window.HS = window.HS || {};

  /**
   * Reusable auto-advance timer (exposed as HS.createAutoTimer).
   * Pausing is reason-based so independent sources (hover, focus, viewport, tab visibility…)
   * never fight each other: the timer runs only while the reason set is empty.
   *
   * @param {{duration:number, onProgress?:(p:number)=>void, onComplete?:()=>void}} opts  duration in ms
   * @returns {{pause(r?:string):void, resume(r?:string):void, reset():void, destroy():void, readonly paused:boolean}}
   */
  HS.createAutoTimer = HS.createAutoTimer || function createAutoTimer({ duration, onProgress = () => {}, onComplete = () => {} }) {
    let elapsed = 0;
    let running = false;
    const reasons = new Set();
    const enabled = duration > 0;

    const tick = (_time, dt) => {
      elapsed += Math.min(dt, 100); // clamp: a long frame (tab switch, debugger) must not skip a slide
      const p = Math.min(elapsed / duration, 1);
      onProgress(p);
      if (p >= 1) { elapsed = 0; onComplete(); }
    };
    // Only keep a ticker listener while actually running (zero cost when paused).
    const sync = () => {
      const shouldRun = enabled && reasons.size === 0;
      if (shouldRun === running) return;
      running = shouldRun;
      shouldRun ? gsap.ticker.add(tick) : gsap.ticker.remove(tick);
    };

    sync();
    return {
      pause(r = 'manual') { reasons.add(r); sync(); },
      resume(r = 'manual') { reasons.delete(r); sync(); },
      reset() { elapsed = 0; onProgress(0); },
      destroy() { reasons.add('destroyed'); sync(); },
      get paused() { return !running; },
    };
  };

  const sec = document.getElementById('timeline');
  if (!sec || !window.gsap) return;

  // ---- DOM ---------------------------------------------------------------
  const $ = (s) => sec.querySelector(s);
  const dial = $('.tl-dial');
  const ticksG = $('.tl-ring__ticks');
  const yearBtns = [...sec.querySelectorAll('.tl-year')];
  const texts = [...sec.querySelectorAll('.tl-text')];
  const big = $('.tl-big');
  const curEl = $('.tl-counter__cur');
  const bar = $('.tl-progress__bar');
  const years = yearBtns.map((b) => b.textContent.trim());
  const N = years.length;

  // ---- Config ------------------------------------------------------------
  const STEP = 24;            // degrees between years on the dial (multiple of the tick spacing)
  const LABEL_R = 0.5;       // small-year radius as a fraction of dial width
  const reduced = !!HS.reduced;
  const autoplay = reduced ? 0 : parseInt(sec.dataset.autoplay, 10) || 0;

  // ---- State -------------------------------------------------------------
  let cur = Math.min(Math.max(parseInt(sec.dataset.start, 10) || 0, 0), N - 1);
  const rot = { a: cur * STEP }; // dial rotation in degrees; year i sits at display angle (a - i*STEP)
  let W = dial.offsetWidth;
  let rotTween = null;

  // ---- Ticks (built once; group rotates) ----------------------------------
  const NS = 'http://www.w3.org/2000/svg';
  for (let deg = 0; deg < 360; deg += 3) {
    const major = deg % STEP === 0;
    const l = document.createElementNS(NS, 'line');
    const r1 = major ? 362 : 372, r2 = major ? 404 : 388;
    const rad = (deg * Math.PI) / 180;
    l.setAttribute('x1', (Math.cos(rad) * r1).toFixed(2));
    l.setAttribute('y1', (Math.sin(rad) * r1).toFixed(2));
    l.setAttribute('x2', (Math.cos(rad) * r2).toFixed(2));
    l.setAttribute('y2', (Math.sin(rad) * r2).toFixed(2));
    if (major) l.classList.add('is-major');
    ticksG.appendChild(l);
  }

  // ---- Render the dial for the current rotation ---------------------------
  const smooth = (e0, e1, x) => { const t = Math.min(Math.max((x - e0) / (e1 - e0), 0), 1); return t * t * (3 - 2 * t); };

  /** Ring-label geometry for year i at the current rotation (px, relative to the dial center). */
  function labelState(i) {
    const d = rot.a - i * STEP;                   // display angle, 0 = at pointer
    const ad = Math.abs(d);
    const rad = (d * Math.PI) / 180;
    const r = W * LABEL_R;
    return {
      x: Math.cos(rad) * r,
      y: Math.sin(rad) * r,
      // Fade with angular distance; hide the one under the pointer (the big year replaces it).
      o: Math.max(0, 1 - ad / 105) * smooth(9, 22, ad),
      s: 0.8 + 0.2 * Math.max(0, 1 - ad / 105),
    };
  }

  function render() {
    ticksG.setAttribute('transform', `rotate(${(rot.a % 360).toFixed(3)})`);
    for (let i = 0; i < N; i++) {
      const { x, y, o, s } = labelState(i);
      const el = yearBtns[i];
      const op = flyers.has(i) ? 0 : o;
      el.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) translate(-50%,-50%) scale(${s.toFixed(3)})`;
      el.style.opacity = op.toFixed(3);
      el.style.visibility = op < 0.02 ? 'hidden' : 'visible';
    }
    flyers.forEach(updateFlyer); // flyers that ride with the dial need the new rotation
  }

  // ---- Shared-element transition: ring label <-> big year -----------------
  // Each flying year is an independent "flyer" (a clone styled like the big year) animated in POLAR
  // coordinates around the dial center, so it travels one continuous curved path:
  //   mode 'in'  : ring label  -> big slot   (scale up, muted -> full)
  //   mode 'out' : big slot    -> ring label (scale down, rides along with the rotating dial)
  // A flyer that is interrupted mid-flight (fast scroll, rapid clicks) is *re-targeted* from its current
  // state instead of being snapped to the end — no pauses, no jumps, in both directions.
  const bigTxt = big.querySelector('.tl-big__txt');
  const COLOR_SMALL = getComputedStyle(yearBtns[0]).color;
  const COLOR_BIG = getComputedStyle(big).color;
  const mixColor = gsap.utils.interpolate(COLOR_SMALL, COLOR_BIG);
  const lerp = (a, b, t) => a + (b - a) * t;
  const DEG = Math.PI / 180;
  const flyers = new Map();       // year index -> flyer
  let bigSlot = null;             // {ang, r} of the big year's center, measured on demand
  let fontRatio = 0.12;           // small label font-size / big font-size

  function measure() {
    const dr = dial.getBoundingClientRect(), br = bigTxt.getBoundingClientRect();
    const x = br.left + br.width / 2 - (dr.left + dr.width / 2);
    const y = br.top + br.height / 2 - (dr.top + dr.height / 2);
    bigSlot = { ang: Math.atan2(y, x) / DEG, r: Math.hypot(x, y) };
    fontRatio = parseFloat(getComputedStyle(yearBtns[0]).fontSize) / parseFloat(getComputedStyle(big).fontSize);
  }
  const clampAng = (a) => Math.max(-110, Math.min(110, a)); // far years fly in/out from the dial's edge, not via a full spin
  /** Polar state of year i's ring label right now. c = 0 (muted) … 1 (big). */
  function labelPolar(i) {
    const l = labelState(i);
    return { ang: clampAng(rot.a - i * STEP), r: W * LABEL_R, s: fontRatio * l.s, o: l.o, c: 0 };
  }
  const bigPolar = () => ({ ang: bigSlot.ang, r: bigSlot.r, s: 1, o: 1, c: 1 });

  function makeFlyerEl(text) {
    const f = document.createElement('span');
    f.className = 'tl-fly';
    f.setAttribute('aria-hidden', 'true');
    f.textContent = text;
    f.style.fontSize = getComputedStyle(big).fontSize;
    dial.appendChild(f);
    return f;
  }

  function updateFlyer(f) {
    const e = f.st.t;
    const tgt = f.mode === 'in' ? bigPolar() : labelPolar(f.idx);
    // 'out' rides with the dial: keep the start offset relative to the label's live angle, decaying to 0.
    const ang = f.mode === 'in' ? lerp(f.from.ang, tgt.ang, e) : tgt.ang + (f.from.ang - f.live0) * (1 - e);
    const st = {
      ang,
      r: lerp(f.from.r, tgt.r, e),
      s: lerp(f.from.s, tgt.s, e),
      o: lerp(f.from.o, tgt.o, e),
      c: lerp(f.from.c, tgt.c, e),
    };
    f.cur = st;
    const x = Math.cos(st.ang * DEG) * st.r, y = Math.sin(st.ang * DEG) * st.r;
    f.el.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) translate(-50%,-50%) scale(${st.s.toFixed(4)})`;
    f.el.style.opacity = st.o.toFixed(3);
    f.el.style.color = mixColor(st.c);
  }

  function syncBigVisibility() {
    // The big number is shown only when no flyer represents the current year.
    big.style.visibility = [...flyers.values()].some((f) => f.mode === 'in') ? 'hidden' : '';
  }

  function finishFlyer(f) {
    f.tween.kill();
    f.el.remove();
    flyers.delete(f.idx);
    if (f.mode === 'in') bigTxt.textContent = years[f.idx];
    syncBigVisibility();
    render();
  }

  /** Start (or re-target) a flyer for year idx. */
  function launch(idx, mode, duration, startState, fresh) {
    let f = flyers.get(idx);
    if (f) f.tween.kill();
    else { f = { idx, el: makeFlyerEl(years[idx]) }; flyers.set(idx, f); }
    f.mode = mode;
    f.from = startState;
    f.live0 = clampAng(rot.a - idx * STEP);
    f.st = { t: 0 };
    f.tween = gsap.to(f.st, {
      t: 1,
      duration,
      // fresh flights share the dial's ease (so an 'in' flyer tracks its label exactly);
      // re-targeted flyers are already moving, so they decelerate only
      ease: fresh ? 'power2.inOut' : 'power2.out',
      onUpdate: () => updateFlyer(f),
      onComplete: () => finishFlyer(f),
    });
    updateFlyer(f);
  }

  function killFlyers() {
    flyers.forEach((f) => { f.tween.kill(); f.el.remove(); });
    flyers.clear();
  }

  function flyYear(from, to, duration) {
    if (reduced || duration <= 0) {
      killFlyers();
      bigTxt.textContent = years[to];
      syncBigVisibility();
      render();
      return;
    }
    measure();
    // Previous year: leaves the big slot (or, if it was itself still flying in, turns around mid-air).
    const fPrev = flyers.get(from);
    if (fPrev) launch(from, 'out', duration, fPrev.cur, false);
    else launch(from, 'out', duration, bigPolar(), true);
    // Any other year still heading for the big slot turns back to the ring.
    flyers.forEach((f) => { if (f.mode === 'in' && f.idx !== to) launch(f.idx, 'out', duration, f.cur, false); });
    // New year: from its ring label (or from wherever its flyer currently is).
    const fTo = flyers.get(to);
    if (fTo) launch(to, 'in', duration, fTo.cur, false);
    else { const lp = labelPolar(to); lp.o = Math.max(lp.o, 0.35); launch(to, 'in', duration, lp, true); }
    syncBigVisibility();
    render(); // hide the ring labels in the same frame the flyers appear (no doubled-text frame)
  }

  // ---- Photo per year: crossfade; images load lazily (current + neighbours) ----
  const photos = [...sec.querySelectorAll('.tl-photo')];
  function ensurePhoto(i) {
    const img = photos[i];
    if (img && !img.src && img.dataset.src) img.src = img.dataset.src;
  }
  function swapPhoto(from, to, instant = false) {
    if (!photos.length) return;
    [to, to - 1, to + 1].forEach(ensurePhoto);
    const a = photos[from], b = photos[to];
    a.classList.remove('is-active'); b.classList.add('is-active');
    if (reduced || instant) { gsap.set(a, { autoAlpha: 0 }); gsap.set(b, { autoAlpha: 1, scale: 1 }); return; }
    gsap.to(a, { autoAlpha: 0, duration: 0.6, ease: 'power1.inOut', overwrite: true });
    gsap.fromTo(b, { autoAlpha: 0, scale: 1.06 }, { autoAlpha: 1, scale: 1, duration: 0.9, ease: 'power2.out', overwrite: true });
  }

  // ---- Copy crossfade -------------------------------------------------------
  function swapText(from, to, instant = false) {
    const a = texts[from], b = texts[to];
    a.classList.remove('is-active'); a.setAttribute('aria-hidden', 'true');
    b.classList.add('is-active'); b.removeAttribute('aria-hidden');
    if (reduced || instant) { gsap.set(a, { autoAlpha: 0 }); gsap.set(b, { autoAlpha: 1, y: 0 }); return; }
    // Sequential (out, then in): overlapping paragraphs of different length read as a garbled frame.
    gsap.to(a, { autoAlpha: 0, y: -8, duration: 0.22, ease: 'power2.in', overwrite: true });
    gsap.fromTo(b, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.55, delay: 0.24, ease: 'power3.out', overwrite: true });
  }

  // ---- Rotate dial to index ------------------------------------------------
  /** Returns the tween duration (s) so the year flight can share it. */
  function rotateTo(i, instant = false) {
    rotTween && rotTween.kill();
    const target = i * STEP;
    if (reduced || instant) { rot.a = target; render(); return 0; }
    const dist = Math.abs(target - rot.a) / STEP;
    const duration = Math.min(0.9 + dist * 0.06, 1.8);
    rotTween = gsap.to(rot, {
      a: target,
      duration,
      ease: 'power2.inOut', // power3 had a visibly "dead" first ~150 ms on the contact sheet
      onUpdate: render,
    });
    return duration;
  }

  /**
   * Main entry: select year i.
   * @param {number} i
   * @param {{wrap?:boolean, fromScroll?:boolean, instant?:boolean}} [o]
   *   wrap: ‹ › / timer loop around the ends · fromScroll: called by the scroll scrub (don't move scroll back)
   *   instant: no animation (initial sync with the scroll position)
   */
  function goTo(i, { wrap = false, fromScroll = false, instant = false } = {}) {
    if (wrap) i = (i + N) % N;
    i = Math.min(Math.max(i, 0), N - 1);
    if (i === cur) { rotateTo(i, instant); if (!fromScroll) syncScroll(i); return; } // e.g. drag released near the same year
    const prev = cur;
    cur = i;
    flyYear(prev, i, rotateTo(i, instant));
    swapText(prev, i, instant);
    swapPhoto(prev, i, instant);
    curEl.textContent = i + 1;
    dial.setAttribute('aria-valuenow', years[i]);
    dial.setAttribute('aria-valuetext', years[i]);
    timer.reset();
    if (!fromScroll) syncScroll(i);
  }

  // ---- Scroll-driven mode (pinned) -----------------------------------------------
  // One source of truth: while pinned, the scroll position IS the year (~50vh of scroll per year).
  // Scrolling scrubs the index → goTo() plays the normal FLIP + rotation. Every other control
  // (timer, ‹ ›, year click, drag, keys) calls goTo(), which then moves the scroll position to that
  // year's slot *instantly* — invisible, because the section is pinned — so scroll and year never drift
  // and scrolling always continues from the year you are looking at.
  const PER_YEAR = 0.5;           // viewport heights of scroll per year
  let st = null;
  let syncing = false;
  function syncScroll(i) {
    if (!st || !st.isActive) return;  // outside the pinned range controls work without touching scroll
    const y = Math.round(st.start + (i / (N - 1)) * (st.end - st.start));
    syncing = true;
    if (HS.lenis) HS.lenis.scrollTo(y, { immediate: true, force: true });
    else window.scrollTo(0, y);
    ScrollTrigger.update();
    requestAnimationFrame(() => { syncing = false; });
  }

  // ---- Timer -----------------------------------------------------------------
  const timer = HS.createAutoTimer({
    duration: autoplay,
    onProgress: (p) => { bar.style.transform = `scaleX(${p})`; },
    onComplete: () => goTo(cur + 1, { wrap: true }),
  });
  const setPaused = (reason, on) => {
    on ? timer.pause(reason) : timer.resume(reason);
    sec.classList.toggle('is-paused', timer.paused);
  };
  if (!autoplay) { bar.parentElement.style.visibility = 'hidden'; }

  // Hover pause: only the interactive zones, otherwise a resting mouse would freeze it forever.
  [dial, $('.tl-copy')].forEach((zone) => {
    zone.addEventListener('pointerenter', (e) => e.pointerType === 'mouse' && setPaused('hover:' + zone.className, true));
    zone.addEventListener('pointerleave', (e) => e.pointerType === 'mouse' && setPaused('hover:' + zone.className, false));
  });
  sec.addEventListener('focusin', () => setPaused('focus', true));
  sec.addEventListener('focusout', (e) => { if (!sec.contains(e.relatedTarget)) setPaused('focus', false); });
  document.addEventListener('visibilitychange', () => setPaused('hidden', document.hidden));
  setPaused('offscreen', true);
  new IntersectionObserver(([en]) => setPaused('offscreen', !en.isIntersecting), { threshold: 0.4 }).observe(sec);

  // ---- Buttons / year clicks ---------------------------------------------------
  $('.tl-prev').addEventListener('click', () => goTo(cur - 1, { wrap: true }));
  $('.tl-next').addEventListener('click', () => goTo(cur + 1, { wrap: true }));
  let suppressClick = false;
  yearBtns.forEach((b) => b.addEventListener('click', () => { if (!suppressClick) goTo(+b.dataset.index); }));

  // ---- Keyboard ------------------------------------------------------------------
  const keyMap = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 3, PageDown: -3 };
  dial.addEventListener('keydown', (e) => {
    if (e.key in keyMap) { e.preventDefault(); goTo(cur + keyMap[e.key]); }
    else if (e.key === 'Home') { e.preventDefault(); goTo(0); }
    else if (e.key === 'End') { e.preventDefault(); goTo(N - 1); }
  });
  // Left/right also work while the section is on screen and nothing else has focus.
  let inView = false;
  new IntersectionObserver(([en]) => { inView = en.intersectionRatio > 0.5; }, { threshold: [0, 0.5, 1] }).observe(sec);
  document.addEventListener('keydown', (e) => {
    if (!inView || e.defaultPrevented || e.altKey || e.metaKey || e.ctrlKey) return;
    const ae = document.activeElement;
    if (ae && ae !== document.body && !sec.contains(ae)) return;
    if (ae === dial) return;
    if (e.key === 'ArrowRight') goTo(cur + 1, { wrap: true });
    if (e.key === 'ArrowLeft') goTo(cur - 1, { wrap: true });
  });

  // ---- Drag / swipe on the dial -------------------------------------------------
  // Mouse/pen: true rotary drag (angle around the dial center).
  // Touch: horizontal swipe → rotation (vertical stays native scroll via touch-action: pan-y).
  let drag = null;
  const centerOf = () => { const r = dial.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
  const angleAt = (e, c) => (Math.atan2(e.clientY - c.y, e.clientX - c.x) * 180) / Math.PI;
  dial.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    const c = centerOf();
    drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, c, last: angleAt(e, c), acc: 0, a0: rot.a, active: false, touch: e.pointerType === 'touch' };
  });
  dial.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
    if (!drag.active) {
      if (Math.hypot(dx, dy) < 6) return;
      drag.active = true;
      dial.setPointerCapture(e.pointerId);
      dial.classList.add('is-dragging');
      rotTween && rotTween.kill();
      setPaused('drag', true);
    }
    if (drag.touch) {
      drag.acc = (-dx / (W * LABEL_R)) * (180 / Math.PI);
    } else {
      const ang = angleAt(e, drag.c);
      let d = ang - drag.last;
      if (d > 180) d -= 360; else if (d < -180) d += 360;
      drag.acc += d; drag.last = ang;
    }
    // Rubber-band past the first/last year.
    const min = 0, max = (N - 1) * STEP;
    let a = drag.a0 + drag.acc;
    if (a < min) a = min - Math.sqrt(min - a) * 3;
    if (a > max) a = max + Math.sqrt(a - max) * 3;
    rot.a = a;
    render();
  });
  const endDrag = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const wasActive = drag.active;
    drag = null;
    if (!wasActive) return;
    dial.classList.remove('is-dragging');
    setPaused('drag', false);
    suppressClick = true; setTimeout(() => { suppressClick = false; }, 0);
    goTo(Math.round(rot.a / STEP));
  };
  dial.addEventListener('pointerup', endDrag);
  dial.addEventListener('pointercancel', endDrag);

  // ---- Skip link (works with Lenis too) -----------------------------------------
  const skip = $('.tl-skip');
  skip.addEventListener('click', (e) => {
    const target = document.querySelector(skip.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    // Jump (not smooth): a smooth scroll through the pinned range would scrub through every year.
    if (HS.lenis) HS.lenis.scrollTo(target, { offset: -40, immediate: true, force: true });
    else window.scrollTo(0, target.getBoundingClientRect().top + scrollY - 40);
    target.focus({ preventScroll: true });
  });

  // ---- Reverse skip: jump back above the timeline (mirror of "Skip Timeline") ----
  const back = $('.tl-back');
  back && back.addEventListener('click', (e) => {
    e.preventDefault();
    const marker = document.querySelector(back.getAttribute('href'));
    const top = marker ? marker.getBoundingClientRect().top + scrollY : 0;
    const y = Math.max(0, top - innerHeight * 0.85);   // land with the previous section in view
    if (HS.lenis) HS.lenis.scrollTo(y, { immediate: true, force: true });
    else window.scrollTo(0, y);
    // focus something sensible above (the marker itself is not focusable)
    (marker && marker.previousElementSibling && marker.previousElementSibling.querySelector('a,button,[tabindex]'))?.focus({ preventScroll: true });
  });

  // ---- Init ------------------------------------------------------------------------
  texts.forEach((t, i) => gsap.set(t, { autoAlpha: i === cur ? 1 : 0 }));
  photos.forEach((p, i) => gsap.set(p, { autoAlpha: i === cur ? 1 : 0 }));
  [cur - 1, cur + 1].forEach(ensurePhoto);
  sec.classList.add('is-ready');
  render();

  // Reduced motion → no pin (controls only).
  if (!reduced && window.ScrollTrigger) {
    st = ScrollTrigger.create({
      trigger: sec,
      pin: true,
      start: 'top top',
      end: () => '+=' + Math.round(innerHeight * PER_YEAR * (N - 1)),
      invalidateOnRefresh: true,
      onUpdate(self) {
        if (syncing) return;
        const i = Math.round(self.progress * (N - 1));
        if (i !== cur) goTo(i, { fromScroll: true });
      },
    });
    // The scroll position decides the starting year (top of the pin = first year).
    goTo(Math.round(st.progress * (N - 1)), { fromScroll: true, instant: true });
    sec.classList.add('is-pinned');
  }
  new ResizeObserver(() => { W = dial.offsetWidth; render(); }).observe(dial);
})();
