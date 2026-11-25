/**
 * 04 · Globe — живий глобус (d3-geo orthographic → <canvas>) + скрол-таймлайн GSAP (Round 5).
 *
 * Сцена (pin, scrub: 1):
 *   0.00–0.16  text-fill заголовка (HS.textFill: літери по одній до 100 %), низ планети вже видно (Rotation 01)
 *   0.16–0.40  планета піднімається ВИЩЕ — видно її центр (Rotation 02), заголовок блюриться
 *   0.16–0.86  м'який поворот ≈ 110° (Атлантика → Азія; Rotation 02–05), маркери офісів
 *   0.69–0.84  планета їде вгору; 0.83–0.89 статистика 15+ / 30+ / 4 з'являється в центрі екрана
 *   0.89       цифри по центру → лічильник (один раз, 1,4 с за часом; назад не скидається), далі ~85vh скролу секція тримається
 *
 * Плавність: таймлайн рухає лише ЦІЛЬОВИЙ кут (target); окремий цикл на gsap.ticker щокадру
 * наближає поточний кут до цілі (експоненційний lerp, незалежний від FPS) → інерція без ривків навіть
 * при «сходинковому» колесі миші. Canvas перемальовується кожен кадр, поки кут рухається, і стоїть, коли ні.
 * DPR ≤ 2; рух планети — CSS transform (композитор). Пульсація точок — CSS, від скролу не залежить.
 */
(() => {
  const root = document.getElementById('globe');
  if (!root || !window.d3 || !window.topojson) return;

  window.HS = window.HS || {};
  // Спільний кеш topojson (глобус і мапа вантажать файл один раз)
  HS.loadTopo = HS.loadTopo || ((url) => {
    HS._topo = HS._topo || {};
    return (HS._topo[url] = HS._topo[url] || fetch(url).then((r) => r.json()));
  });

  const stage   = root.querySelector('.globe__stage');
  const head    = root.querySelector('.globe__head');
  const title   = root.querySelector('.globe__title');
  const planet  = root.querySelector('.globe__planet');
  const canvas  = root.querySelector('.globe__canvas');
  const ctx     = canvas.getContext('2d');
  const stats   = root.querySelector('.globe__stats');
  const fade    = root.querySelector('.globe__fade');
  const markers = [...root.querySelectorAll('.globe-marker')].map((el) => ({
    el, label: el.querySelector('.globe-marker__label'), w: 0,
    side: el.classList.contains('globe-marker--left') ? 'left' : el.classList.contains('globe-marker--right') ? 'right' : 'top',
    coord: [+el.dataset.lng, +el.dataset.lat], visible: false,
  }));

  // Кадри з підписаного Figma (rotate = [-lng, -lat] центру диска)
  const ROT_START = { lambda: 38, phi: -24 };   // Атлантика: Boca зліва, Malta/Istanbul справа
  const ROT_END   = { lambda: -72, phi: -14 };  // Азія: Guangdong ближче до центру-верху

  const target = { ...ROT_START, markers: 0 };  // пише таймлайн
  const state  = { ...ROT_START, markers: 0 };  // малюємо (наздоганяє target)
  const proj  = d3.geoOrthographic().clipAngle(90).precision(0.6);
  const path  = d3.geoPath(proj, ctx);
  const grat  = d3.geoGraticule10();
  const SPHERE = { type: 'Sphere' };

  let land = null, size = 0, dpr = 1, drawn = '';

  /* ---------- розміри ---------- */
  function measure() {
    const vw = innerWidth, vh = innerHeight;
    size = Math.round(vw < 640 ? Math.min(vw * 1.1, vh * 0.78) : Math.min(vw * 0.8, vh * 1.18, 1150));
    dpr = Math.min(devicePixelRatio || 1, 2);
    planet.style.setProperty('--size', size + 'px');
    canvas.width = canvas.height = Math.round(size * dpr);
    proj.scale(size / 2 - 1).translate([size / 2, size / 2]);
    markers.forEach((m) => { m.w = m.label.offsetWidth; });
    drawn = '';
    draw();
  }

  /* ---------- рендер ---------- */
  function draw() {
    const key = state.lambda.toFixed(2) + '|' + state.phi.toFixed(2);
    if (key !== drawn) { // перемальовуємо canvas тільки при зміні кута
      drawn = key;
      proj.rotate([state.lambda, state.phi]);
      const r = size / 2;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);

      // Океан: темно-синя сфера, світліше зліва-зверху
      const g = ctx.createRadialGradient(r * 0.6, r * 0.5, r * 0.05, r, r, r);
      g.addColorStop(0, '#24497a'); g.addColorStop(0.65, '#1a3c68'); g.addColorStop(1, '#122f55');
      ctx.beginPath(); path(SPHERE); ctx.fillStyle = g; ctx.fill();

      ctx.beginPath(); path(grat); ctx.strokeStyle = 'rgba(255,255,255,.035)'; ctx.lineWidth = 0.6; ctx.stroke();

      if (land) {
        ctx.beginPath(); path(land);
        ctx.fillStyle = '#345d8e'; ctx.fill();
        ctx.strokeStyle = 'rgba(160,190,225,.18)'; ctx.lineWidth = 0.5; ctx.stroke();
      }

      // Затінення до краю (об'єм) + тонкий світлий обідок
      const s = ctx.createRadialGradient(r * 0.7, r * 0.6, r * 0.35, r, r, r);
      s.addColorStop(0, 'rgba(5,15,35,0)'); s.addColorStop(0.8, 'rgba(5,15,35,.12)'); s.addColorStop(1, 'rgba(5,15,35,.42)');
      ctx.beginPath(); path(SPHERE); ctx.fillStyle = s; ctx.fill();
      ctx.strokeStyle = 'rgba(170,200,235,.12)'; ctx.lineWidth = 1; ctx.stroke();
    }
    placeMarkers();
  }

  function placeMarkers() {
    planet.style.setProperty('--markers', state.markers.toFixed(3));
    const center = [-state.lambda, -state.phi];
    for (const m of markers) {
      // зворотний бік сфери → ховаємо (запас, щоб підпис не «лип» до краю)
      const vis = d3.geoDistance(m.coord, center) < Math.PI / 2 - 0.15;
      if (vis !== m.visible) { m.visible = vis; m.el.classList.toggle('is-visible', vis); }
      if (vis) {
        const [x, y] = proj(m.coord);
        m.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
        const off = m.side === 'left' ? -m.w - 9 : m.side === 'right' ? 9 : -m.w / 2;
        const left = (innerWidth - size) / 2 + x + off;               // не даємо підпису вилізти за край
        const dx = Math.min(Math.max(left, 8), innerWidth - 8 - m.w) - left;
        m.label.style.setProperty('--dx', dx.toFixed(1) + 'px');
      }
    }
  }

  /* ---------- інерція: state → target кожен кадр ---------- */
  let active = false;
  function tick(time, deltaMs) {
    if (!active) return;
    const k = 1 - Math.pow(1 - 0.09, Math.min(deltaMs, 64) / 16.67);   // ≈ 9 % за кадр при 60 fps
    let moving = false;
    for (const p of ['lambda', 'phi', 'markers']) {
      const d = target[p] - state[p];
      if (Math.abs(d) > (p === 'markers' ? 0.002 : 0.01)) { state[p] += d * k; moving = true; }
      else state[p] = target[p];
    }
    if (moving || drawn === '') draw();
  }

  /* ---------- таймлайн ---------- */
  const counters = [...stats.querySelectorAll('[data-count]')].map((el) => ({ el, to: +el.dataset.count, v: 0 }));

  let counted = false;
  function runCounters() {
    if (counted) return;
    counted = true;
    counters.forEach((c, i) => {
      gsap.fromTo(c, { v: 0 }, {
        v: c.to, duration: 1.4, delay: i * 0.1, ease: 'power2.out',
        onUpdate: () => { c.el.textContent = Math.round(c.v); },
      });
    });
  }

  function buildTimeline() {
    counters.forEach((c) => { c.el.textContent = '0'; });
    const vh = () => innerHeight;
    const mob = () => innerWidth < 640;
    const yStart = () => vh() - size * 0.2;                           // видно «шапку» планети (Rotation 01)
    const yRise  = () => vh() * (mob() ? 0.6 : 0.58) - size / 2;      // центр планети на ~58 % висоти (Rotation 02)
    const yEnd   = () => vh() * (mob() ? 0.34 : 0.36) - size;         // планета їде вгору, низ — на ~36 % висоти: центр екрана вільний для цифр

    gsap.set(planet, { y: yStart });
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: root, start: 'top top', end: '+=520%',
        pin: stage, scrub: 1, invalidateOnRefresh: true,
      },
    });

    // 1) text-fill під час pin, до руху планети
    if (HS.textFill) HS.textFill(title, { timeline: tl, at: 0, duration: 0.15 });
    else tl.to({}, { duration: 0.15 }, 0);

    tl.to(planet, { y: yRise, ease: 'power2.inOut', duration: 0.24 }, 0.16)
      .to(head, { filter: 'blur(10px)', opacity: 0.3, duration: 0.2 }, 0.2)
      .to(target, { lambda: ROT_END.lambda, phi: ROT_END.phi, ease: 'sine.inOut', duration: 0.7 }, 0.16)
      .to(target, { markers: 1, duration: 0.06 }, 0.3)
      .to(head, { opacity: 0, duration: 0.08 }, 0.56)
      .to(planet, { y: yEnd, ease: 'power2.inOut', duration: 0.15 }, 0.69)
      .to(fade, { opacity: 1, duration: 0.14 }, 0.72)
      .fromTo(stats, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, ease: 'power2.out', duration: 0.06 }, 0.83)
      // цифри вже по центру екрана → лічильник стартує (один раз, за часом, не за скролом)
      .call(runCounters, null, 0.89)
      .to({}, { duration: 0.17 }, 0.89);   // запас скролу, щоб лічильник встиг відпрацювати в pin
    return tl;
  }

  /* ---------- reduced motion: статичний кадр ---------- */
  function staticFrame() {
    root.classList.add('is-static');
    if (HS.textFill) HS.textFill(title);   // reduced → одразу 100 %
    Object.assign(state, { lambda: -30, phi: -22, markers: 1 });
    measure();
  }

  /* ---------- старт ---------- */
  HS.loadTopo('assets/data/land-110m.json').then((topo) => {
    land = topojson.feature(topo, topo.objects.land);
    drawn = ''; draw();
  }).catch((err) => console.warn('globe: land data failed', err));

  if (HS.reduced) {
    staticFrame();
    addEventListener('resize', measure);
    return;
  }

  measure();
  buildTimeline();
  // цикл інерції працює лише поки секція поблизу екрана
  new IntersectionObserver(([en]) => { active = en.isIntersecting; }, { rootMargin: '200px 0px' }).observe(root.closest('.pin-spacer') || root);
  gsap.ticker.add(tick);

  // Перераховуємо лише при зміні ширини (iOS змінює висоту при скролі через адресний рядок)
  let rT, lastW = innerWidth;
  addEventListener('resize', () => {
    if (innerWidth === lastW) return;
    lastW = innerWidth;
    clearTimeout(rT); rT = setTimeout(() => { measure(); ScrollTrigger.refresh(); }, 150);
  });
})();
