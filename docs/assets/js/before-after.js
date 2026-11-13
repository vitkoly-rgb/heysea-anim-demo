/**
 * 02 · Before / after deck plan
 * - Draggable divider (pointer: mouse + touch + pen), keyboard (←/→, Shift = ×5, Home/End, PageUp/Down),
 *   ARIA slider semantics. Position lives in a CSS custom property --pos on .ba__compare.
 * - Tabs (ARIA tablist, ←/→/Home/End): crossfade decks, divider eases back to 50%.
 * - First time in view: divider sweeps 20% → 50% as an affordance hint.
 * - ≤640px: plans are rotated to portrait (bow up) so they're readable on phones.
 */
(() => {
  const section = document.getElementById('before-after');
  if (!section) return;

  const reduced = !!(window.HS && HS.reduced);
  const hasGsap = !!window.gsap;
  const compare = section.querySelector('.ba__compare');
  const handle = section.querySelector('.ba__handle');
  const tabs = [...section.querySelectorAll('.ba__tab')];
  const decks = [...section.querySelectorAll('.ba__deck')];
  const chipL = section.querySelector('.ba__chip--left');
  const chipR = section.querySelector('.ba__chip--right');
  const state = { pos: 50 };
  let tween = null;

  /* ---------- divider ---------- */
  function setPos(p) {
    state.pos = Math.max(0, Math.min(100, p));
    compare.style.setProperty('--pos', state.pos + '%');
    const v = Math.round(state.pos);
    handle.setAttribute('aria-valuenow', v);
    handle.setAttribute('aria-valuetext', `${v}% sketch, ${100 - v}% layout`);
    // fade the chip that is about to be covered
    chipL.style.opacity = state.pos < 14 ? 0 : 1;
    chipR.style.opacity = state.pos > 86 ? 0 : 1;
  }

  function animateTo(p, duration = 0.8, ease = 'power3.inOut') {
    if (tween) tween.kill();
    if (reduced || !hasGsap) return setPos(p);
    tween = gsap.to(state, { pos: p, duration, ease, onUpdate: () => setPos(state.pos) });
  }

  const fromClientX = (x) => {
    const r = compare.getBoundingClientRect();
    return ((x - r.left) / r.width) * 100;
  };

  let dragging = false;
  compare.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    dragging = true;
    if (tween) tween.kill();
    compare.setPointerCapture(e.pointerId);
    section.classList.add('is-dragging');
    setPos(fromClientX(e.clientX));
    handle.focus({ preventScroll: true });
  });
  compare.addEventListener('pointermove', (e) => { if (dragging) setPos(fromClientX(e.clientX)); });
  const stop = () => { dragging = false; section.classList.remove('is-dragging'); };
  compare.addEventListener('pointerup', stop);
  compare.addEventListener('pointercancel', stop); // e.g. browser took over for vertical scroll (touch-action: pan-y)

  handle.addEventListener('keydown', (e) => {
    const step = e.shiftKey ? 10 : 2;
    const map = { ArrowLeft: -step, ArrowDown: -step, ArrowRight: step, ArrowUp: step, PageDown: -10, PageUp: 10 };
    if (e.key in map) setPos(state.pos + map[e.key]);
    else if (e.key === 'Home') setPos(0);
    else if (e.key === 'End') setPos(100);
    else return;
    if (tween) tween.kill();
    e.preventDefault();
  });

  /* ---------- tabs ---------- */
  let current = 0;
  function select(i, focus) {
    if (i === current) return;
    const prev = decks[current];
    const next = decks[i];
    tabs.forEach((t, k) => {
      const on = k === i;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', on);
      t.tabIndex = on ? 0 : -1;
    });
    if (focus) tabs[i].focus();
    next.hidden = false;
    // next frame so the opacity transition runs from 0
    requestAnimationFrame(() => {
      next.classList.add('is-active');
      prev.classList.remove('is-active');
    });
    const done = () => { if (!prev.classList.contains('is-active')) prev.hidden = true; };
    reduced ? done() : setTimeout(done, 600);
    current = i;
    animateTo(50);
  }
  tabs.forEach((t, i) => t.addEventListener('click', () => select(i)));
  section.querySelector('.ba__tabs').addEventListener('keydown', (e) => {
    const n = tabs.length;
    const map = { ArrowRight: (current + 1) % n, ArrowLeft: (current - 1 + n) % n, Home: 0, End: n - 1 };
    if (!(e.key in map)) return;
    e.preventDefault();
    select(map[e.key], true);
  });

  /* ---------- portrait plans on phones ---------- */
  const mqPortrait = matchMedia('(max-width: 640px)');
  const svgs = [...section.querySelectorAll('.ba__svg')];
  // cache label positions once
  svgs.forEach((svg) => svg.querySelectorAll('text').forEach((t) => { t.dataset.x = t.getAttribute('x'); t.dataset.y = t.getAttribute('y'); }));
  function orient() {
    const portrait = mqPortrait.matches;
    compare.classList.toggle('is-portrait', portrait);
    svgs.forEach((svg) => {
      const g = svg.querySelector('.ba__rot');
      svg.setAttribute('viewBox', portrait ? '60 30 360 1140' : '20 50 1170 380');
      // rotate -90° about origin and shift: (x, y) → (y, 1200 - x)  ⇒ bow points up
      if (portrait) g.setAttribute('transform', 'translate(0 1200) rotate(-90)'); else g.removeAttribute('transform');
      svg.querySelectorAll('text').forEach((t) => {
        if (portrait) t.setAttribute('transform', `rotate(90 ${t.dataset.x} ${t.dataset.y})`); else t.removeAttribute('transform');
      });
    });
  }
  orient();
  mqPortrait.addEventListener('change', orient);

  /* ---------- hint sweep on first view ---------- */
  if (!reduced && hasGsap && window.ScrollTrigger) {
    setPos(20);
    ScrollTrigger.create({
      trigger: compare,
      start: 'top 70%',
      once: true,
      onEnter: () => animateTo(50, 1.6, 'power3.inOut'),
    });
  } else {
    setPos(50);
  }
})();
