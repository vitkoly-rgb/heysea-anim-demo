/**
 * 08 · Map — SVG-мапа (d3.geoEqualEarth) з плавним pan & zoom через анімацію viewBox (GSAP),
 * HTML-піни поверх (позиціонуються з тієї ж «камери» — завжди чіткі, не масштабуються),
 * таймер автоперемикання з паузою на hover / focus / поза екраном / прихованій вкладці / кнопкою.
 */
(() => {
  const root = document.getElementById('map');
  if (!root || !window.d3 || !window.topojson) return;

  window.HS = window.HS || {};
  HS.loadTopo = HS.loadTopo || ((url) => {
    HS._topo = HS._topo || {};
    return (HS._topo[url] = HS._topo[url] || fetch(url).then((r) => r.json()));
  });

  const reduced  = !!HS.reduced;
  const offices  = JSON.parse(root.querySelector('.hsmap__data').textContent);
  const interval = (+root.dataset.interval || 30);
  const mapEl    = root.querySelector('.hsmap__map');
  const svg      = root.querySelector('.hsmap__svg');
  const landEl   = root.querySelector('.hsmap__land');
  const bordEl   = root.querySelector('.hsmap__borders');
  const nameEl   = root.querySelector('.hsmap__name');
  const steps    = [...root.querySelectorAll('.hsmap__step')];
  const statusEl = root.querySelector('.hsmap__status');
  const hoverZones = [root.querySelector('.hsmap__map'), root.querySelector('.hsmap__cards')];
  const playBtn  = root.querySelector('.hsmap__btn--play');
  const pins     = [...root.querySelectorAll('.hsmap__pin')];
  const cards    = [...root.querySelectorAll('.hsmap__card')];
  const cardList = root.querySelector('.hsmap__cards');   // в'юпорт слайдера
  const track    = root.querySelector('.hsmap__track');

  const WORLD_W = 1000;
  const proj = d3.geoEqualEarth();
  let worldH = 500;            // висота світу в координатах viewBox (після fit)
  let pts = [];                // офіси в координатах світу
  let W = 1, H = 1;            // розмір контейнера, px
  const cam = { cx: 500, cy: 250, k: 1 };  // «камера»: центр у світі + zoom
  let active = 0, camTl = null, timer = null;

  /* ---------- камера ---------- */
  const isMobile = () => innerWidth <= 760;
  // ширина видимої області світу при k=1: «cover» по висоті контейнера, але не ширше за світ
  const baseVW = () => Math.min(WORLD_W, worldH * 0.92 * W / H);

  function view(c = cam) {
    const vw = baseVW() / c.k, vh = vw * H / W;
    return { x: c.cx - vw / 2, y: c.cy - vh / 2, vw, vh };
  }

  /** Камера для офісу: точка трохи вище центру (на десктопі низ мапи перекривають картки) */
  function camFor(i) {
    const [px, py] = pts[i];
    const k = isMobile() ? offices[i].zoom * 0.8 : offices[i].zoom;
    const vw = baseVW() / k, vh = vw * H / W;
    const fy = isMobile() ? 0.5 : 0.4;  // де на екрані опиниться точка (частка висоти)
    let cx = px, cy = py + vh * (0.5 - fy);
    // не виходимо за межі світу
    cx = Math.min(Math.max(cx, vw / 2), WORLD_W - vw / 2);
    cy = vh >= worldH ? worldH / 2 : Math.min(Math.max(cy, vh / 2), worldH - vh / 2 + vh * 0.25);
    return { cx, cy, k };
  }

  function render() {
    const v = view();
    svg.setAttribute('viewBox', `${v.x.toFixed(2)} ${v.y.toFixed(2)} ${v.vw.toFixed(2)} ${v.vh.toFixed(2)}`);
    const sx = W / v.vw, sy = H / v.vh;
    pts.forEach(([px, py], i) => {
      pins[i].style.transform = `translate3d(${((px - v.x) * sx).toFixed(1)}px, ${((py - v.y) * sy).toFixed(1)}px, 0)`;
    });
  }

  function measure() {
    W = mapEl.clientWidth || 1; H = mapEl.clientHeight || 1;
    if (pts.length) { Object.assign(cam, camFor(active)); render(); }
    if (track) slideTo(active, false);
  }

  /* ---------- перемикання ---------- */
  function go(i, { animate = true } = {}) {
    active = (i + offices.length) % offices.length;
    nameEl.textContent = offices[active].label;
    // пагінація: активний сегмент розтягується (CSS transition flex-basis) і заповнюється таймером,
    // попередній стискається назад, його заливка плавно гасне (transition лише на неактивних)
    steps.forEach((st, n) => {
      st.classList.toggle('is-active', n === active);
      n === active ? st.setAttribute('aria-current', 'true') : st.removeAttribute('aria-current');
      if (n !== active) st.style.setProperty('--fill', 0);
    });
    pins.forEach((p, n) => p.classList.toggle('is-active', n === active));
    cards.forEach((c, n) => {
      c.classList.toggle('is-active', n === active);
      c.querySelector('.hsmap__card-btn').setAttribute('aria-pressed', String(n === active));
      // посилання (email, «Contact us») фокусуються лише в активній картці
      c.querySelectorAll('a').forEach((a) => (n === active ? a.removeAttribute('tabindex') : a.setAttribute('tabindex', '-1')));
    });
    slideTo(active, animate);

    if (pts.length) {
      const to = camFor(active);
      camTl && camTl.kill();
      if (!animate || reduced) { Object.assign(cam, to); render(); }
      else {
        // «переліт»: трохи віддаляємось посередині шляху, потім наближаємось
        const mid = Math.max(1, Math.min(cam.k, to.k) * 0.6);
        camTl = gsap.timeline({ onUpdate: render })
          .to(cam, { cx: to.cx, cy: to.cy, duration: 1.6, ease: 'power2.inOut' }, 0)
          .to(cam, { k: mid, duration: 0.7, ease: 'power2.out' }, 0)
          .to(cam, { k: to.k, duration: 0.9, ease: 'power2.inOut' }, 0.7);
      }
    }
    restartTimer();
  }

  /* ---------- слайдер карток ----------
   Трек зсувається так, щоб активна картка стала по центру в'юпорта (сусідні визирають з боків).
   Джерело правди — `active`; слайдер лише відображає його (go → slideTo). */
  const trackX = { v: 0 };
  const setX = gsap.quickSetter(track, 'x', 'px');
  let slideTw = null;
  const xFor = (i) => {
    const c = cards[i];
    return Math.round(cardList.clientWidth / 2 - (c.offsetLeft + c.offsetWidth / 2));
  };
  const xMin = () => xFor(cards.length - 1), xMax = () => xFor(0);
  function slideTo(i, animate = true) {
    slideTw && slideTw.kill();
    const x = xFor(i);
    if (!animate || reduced) { trackX.v = x; setX(x); return; }
    slideTw = gsap.to(trackX, { v: x, duration: 0.85, ease: 'power3.out', onUpdate: () => setX(trackX.v) });
  }

  // drag / swipe: pointer events (миша + touch + перо). touch-action: pan-y — вертикальний скрол сторінки лишається нативним.
  const drag = { id: null, x0: 0, y0: 0, tx0: 0, moved: false, axis: null, lastX: 0, lastT: 0, vx: 0 };
  let suppressClick = false;
  cardList.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || drag.id !== null) return;
    Object.assign(drag, { id: e.pointerId, x0: e.clientX, y0: e.clientY, tx0: trackX.v, moved: false, axis: null, lastX: e.clientX, lastT: e.timeStamp, vx: 0 });
    suppressClick = false;
  });
  cardList.addEventListener('pointermove', (e) => {
    if (e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
    if (!drag.axis) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      drag.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (drag.axis === 'y') { drag.id = null; return; }           // вертикальний жест — це скрол сторінки
      drag.moved = true;
      slideTw && slideTw.kill();
      drag.tx0 = trackX.v; drag.x0 = e.clientX;
      cardList.setPointerCapture(e.pointerId);
      cardList.classList.add('is-dragging');
      setPaused('drag', true);
    }
    let x = drag.tx0 + (e.clientX - drag.x0);
    const lo = xMin(), hi = xMax();                                 // «гумка» за крайніми картками
    if (x > hi) x = hi + (x - hi) * 0.35;
    if (x < lo) x = lo + (x - lo) * 0.35;
    trackX.v = x; setX(x);
    const dt = e.timeStamp - drag.lastT;
    if (dt > 0) drag.vx = 0.8 * ((e.clientX - drag.lastX) / dt) + 0.2 * drag.vx;
    drag.lastX = e.clientX; drag.lastT = e.timeStamp;
  });
  function endDrag(e) {
    if (e.pointerId !== drag.id) return;
    drag.id = null;
    if (!drag.moved) return;
    suppressClick = true;                                           // клік після перетягування не активує картку
    cardList.classList.remove('is-dragging');
    setPaused('drag', false);
    // найближча до центру картка + «кидок» (швидкий свайп гортає хоча б на одну)
    const center = cardList.clientWidth / 2 - trackX.v;
    let near = 0, best = Infinity;
    cards.forEach((c, n) => { const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - center); if (d < best) { best = d; near = n; } });
    const dist = trackX.v - xFor(active);
    if (near === active && (Math.abs(drag.vx) > 0.35 || Math.abs(dist) > 60)) near = active + (dist < 0 ? 1 : -1);
    near = Math.max(0, Math.min(cards.length - 1, near));
    near === active ? slideTo(active) : go(near);
  }
  cardList.addEventListener('pointerup', endDrag);
  cardList.addEventListener('pointercancel', endDrag);
  cardList.addEventListener('click', (e) => {
    if (!suppressClick) return;
    suppressClick = false; e.preventDefault(); e.stopPropagation();
  }, true);
  cardList.addEventListener('dragstart', (e) => e.preventDefault());
  cardList.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(active - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); go(active + 1); }
  });
  // Tab на кнопку міста неактивної картки → вона стає активною (і виїжджає в центр)
  cardList.addEventListener('focusin', (e) => {
    const c = e.target.closest('.hsmap__card');
    if (c && e.target.matches(':focus-visible') && +c.dataset.i !== active) go(+c.dataset.i);
  });

  /* ---------- таймер + пауза ----------
   Таймер — tween прогресу 0→1 активного сегмента. Працює лише коли НЕМАЄ жодної причини паузи:
   offscreen (мапа видима < 40%), hidden (вкладка прихована), hover (курсор над мапою/картками),
   focus (клавіатурний фокус всередині), user (кнопка Pause / reduced motion). Ручне перемикання → з нуля. */
  const pauseReasons = new Set(['offscreen']);        // стартуємо, коли секцію побачать
  if (reduced) pauseReasons.add('user');               // reduced motion: без автоперемикання (Play — вмикає)
  const prog = { v: 0 };
  const STATUS = { hover: 'Paused while you explore', focus: 'Paused', user: 'Autoplay paused' };

  function restartTimer() {
    timer && timer.kill();
    prog.v = 0;
    const fillEl = steps[active];
    fillEl.style.setProperty('--fill', 0);
    timer = gsap.to(prog, {
      v: 1, duration: interval, ease: 'none',
      onUpdate: () => fillEl.style.setProperty('--fill', prog.v.toFixed(4)),
      onComplete: () => go(active + 1),
    });
    applyPause();
  }
  function applyPause() {
    if (timer) pauseReasons.size ? timer.pause() : timer.resume();
    const visibleReason = ['user', 'focus', 'hover'].find((r) => pauseReasons.has(r));
    root.classList.toggle('is-paused', !!visibleReason);
    statusEl.textContent = visibleReason ? STATUS[visibleReason] : '';
    playBtn.setAttribute('aria-pressed', String(pauseReasons.has('user')));
    playBtn.setAttribute('aria-label', pauseReasons.has('user') ? 'Resume autoplay' : 'Pause autoplay');
  }
  function setPaused(reason, on) {
    if (on === pauseReasons.has(reason)) return;
    on ? pauseReasons.add(reason) : pauseReasons.delete(reason);
    applyPause();
  }

  // hover — лише над мапою та картками і лише від РЕАЛЬНОГО руху миші: коли сторінку скролять,
  // а курсор просто стоїть над мапою, Chrome шле «фейкові» move з нульовим зсувом — їх ігноруємо,
  // інакше таймер не стартував би, доки секцію не прокрутять (це і був баг).
  hoverZones.forEach((z) => {
    z.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse' && (e.movementX || e.movementY)) setPaused('hover', true); });
    z.addEventListener('pointerleave', (e) => { if (!hoverZones.some((o) => o.contains(e.relatedTarget))) setPaused('hover', false); });
  });
  // focus — лише клавіатурний (:focus-visible); клік мишкою по картці не «заморожує» таймер
  root.addEventListener('focusin', (e) => setPaused('focus', e.target.matches(':focus-visible') && !e.target.closest('.hsmap__nav')));
  root.addEventListener('focusout', (e) => { if (!root.contains(e.relatedTarget)) setPaused('focus', false); });
  document.addEventListener('visibilitychange', () => setPaused('hidden', document.hidden));
  new IntersectionObserver(([en]) => setPaused('offscreen', en.intersectionRatio < 0.4), { threshold: [0, 0.4, 0.6, 1] }).observe(mapEl);

  /* ---------- керування ---------- */
  root.querySelector('.hsmap__btn--prev').addEventListener('click', () => go(active - 1));
  root.querySelector('.hsmap__btn--next').addEventListener('click', () => go(active + 1));
  playBtn.addEventListener('click', () => setPaused('user', !pauseReasons.has('user')));
  pins.forEach((p) => p.addEventListener('click', () => go(+p.dataset.i)));
  steps.forEach((st) => st.addEventListener('click', () => go(+st.dataset.i)));
  cards.forEach((c) => c.addEventListener('click', (e) => {
    if (+c.dataset.i === active) return;          // в активній посилання mailto:/«Contact us» працюють як звичайно
    e.preventDefault();                           // клік по сусідній (навіть по її посиланню) — спершу робить її активною
    go(+c.dataset.i);
  }));
  root.querySelector('.hsmap__nav').addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(active - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); go(active + 1); }
  });

  /* ---------- дані мапи ---------- */
  HS.loadTopo('assets/data/countries-110m.json').then((topo) => {
    const all = topojson.feature(topo, topo.objects.countries);
    // без Антарктиди — компактніша композиція
    const fc = { type: 'FeatureCollection', features: all.features.filter((f) => f.id !== '010') };
    proj.fitWidth(WORLD_W, fc);
    const path = d3.geoPath(proj);
    const [[, y0], [, y1]] = path.bounds(fc);
    proj.translate([proj.translate()[0], proj.translate()[1] - y0]);   // світ починається з y=0
    worldH = y1 - y0;
    landEl.setAttribute('d', path(fc));
    bordEl.setAttribute('d', path(topojson.mesh(topo, topo.objects.countries, (a, b) => a !== b)));
    pts = offices.map((o) => proj([o.lng, o.lat]));
    measure();
    go(active, { animate: false });
  }).catch((err) => console.warn('map: countries data failed', err));

  measure();
  restartTimer();
  let rT;
  addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(measure, 120); });
})();
