/**
 * 04 · Globe — живий глобус (d3-geo orthographic → <canvas>) + скрол-таймлайн GSAP.
 *
 * Сцена (pin, scrub):
 *   0.00–0.26  глобус виїжджає знизу, заголовок блюриться; видно Boca Raton (Америки)
 *   0.32–0.58  поворот: Malta (зліва вгорі) + Guangdong (справа внизу)
 *   0.66–0.90  поворот до Азії (Guangdong біля верху), глобус — великий — їде вгору, низ розчиняється в білому
 *   0.84–1.00  каунт-ап статистики 15+ / 30+ / 4 над нижньою частиною глобуса
 *   Маркери — HTML, позиціонуються проекцією; на зворотному боці сфери ховаються.
 *
 * Перф: canvas перемальовується лише коли змінився кут обертання (rAF-коалесинг),
 * DPR ≤ 2; рух — CSS transform (композитор), не перерисовка.
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
  const planet  = root.querySelector('.globe__planet');
  const canvas  = root.querySelector('.globe__canvas');
  const ctx     = canvas.getContext('2d');
  const stats   = root.querySelector('.globe__stats');
  const fade    = root.querySelector('.globe__fade');
  const markers = [...root.querySelectorAll('.globe-marker')].map((el) => ({
    el, label: el.querySelector('.globe-marker__label'), w: 0,
    coord: [+el.dataset.lng, +el.dataset.lat], visible: false,
  }));

  // Стан, яким керує таймлайн
  const state = { lambda: 75, phi: -18, markers: 0 };
  const proj  = d3.geoOrthographic().clipAngle(90).precision(0.6);
  const path  = d3.geoPath(proj, ctx);
  const grat  = d3.geoGraticule10();
  const SPHERE = { type: 'Sphere' };

  let land = null, size = 0, dpr = 1, drawn = '', raf = 0;

  /* ---------- розміри ---------- */
  function measure() {
    const vw = innerWidth, vh = innerHeight;
    size = Math.round(vw < 640 ? Math.min(vw * 1.05, vh * 0.75) : Math.min(vw * 0.78, vh * 1.12, 1100));
    dpr = Math.min(devicePixelRatio || 1, 2);
    planet.style.setProperty('--size', size + 'px');
    canvas.width = canvas.height = Math.round(size * dpr);
    proj.scale(size / 2 - 1).translate([size / 2, size / 2]);
    markers.forEach((m) => { m.w = m.label.offsetWidth; });
    drawn = '';
    requestDraw();
  }

  /* ---------- рендер ---------- */
  function requestDraw() { if (!raf) raf = requestAnimationFrame(draw); }

  function draw() {
    raf = 0;
    const key = state.lambda.toFixed(2) + '|' + state.phi.toFixed(2);
    if (key !== drawn) { // перемальовуємо canvas тільки при зміні обертання
      drawn = key;
      proj.rotate([state.lambda, state.phi]);
      const r = size / 2;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);

      // Сфера: м'яке «студійне» світло зліва-зверху
      const g = ctx.createRadialGradient(r * 0.62, r * 0.55, r * 0.05, r, r, r);
      g.addColorStop(0, '#eeeff1'); g.addColorStop(0.7, '#e4e6e9'); g.addColorStop(1, '#d3d6da');
      ctx.beginPath(); path(SPHERE); ctx.fillStyle = g; ctx.fill();

      ctx.beginPath(); path(grat); ctx.strokeStyle = 'rgba(17,24,39,.045)'; ctx.lineWidth = 0.6; ctx.stroke();

      if (land) {
        ctx.beginPath(); path(land);
        ctx.fillStyle = '#fbfbfb'; ctx.fill();
        ctx.strokeStyle = 'rgba(120,128,138,.18)'; ctx.lineWidth = 0.5; ctx.stroke();
      }

      // Затінення до краю (об'єм) + тонкий обідок
      const s = ctx.createRadialGradient(r * 0.7, r * 0.6, r * 0.4, r, r, r);
      s.addColorStop(0, 'rgba(255,255,255,0)'); s.addColorStop(0.8, 'rgba(60,70,80,.06)'); s.addColorStop(1, 'rgba(60,70,80,.22)');
      ctx.beginPath(); path(SPHERE); ctx.fillStyle = s; ctx.fill();
      ctx.strokeStyle = 'rgba(17,24,39,.06)'; ctx.lineWidth = 1; ctx.stroke();
    }
    placeMarkers();
  }

  function placeMarkers() {
    planet.style.setProperty('--markers', state.markers.toFixed(3));
    const center = [-state.lambda, -state.phi];
    for (const m of markers) {
      // зворотний бік сфери → ховаємо (невеликий запас, щоб підпис не «лип» до краю)
      const vis = d3.geoDistance(m.coord, center) < Math.PI / 2 - 0.15;
      if (vis !== m.visible) { m.visible = vis; m.el.classList.toggle('is-visible', vis); }
      if (vis) {
        const [x, y] = proj(m.coord);
        m.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
        // не даємо підпису вилізти за край екрана (актуально на мобільному)
        const left = (innerWidth - size) / 2 + x - m.w / 2;
        const dx = Math.min(Math.max(left, 8), innerWidth - 8 - m.w) - left;
        m.label.style.setProperty('--dx', dx.toFixed(1) + 'px');
      }
    }
  }

  /* ---------- таймлайн ---------- */
  const counters = [...stats.querySelectorAll('[data-count]')].map((el) => ({ el, to: +el.dataset.count, v: 0 }));

  function buildTimeline() {
    const vh = () => innerHeight;
    const mob = () => innerWidth < 640;
    const yStart = () => vh() + 20;                                   // повністю під екраном
    const yRise  = () => vh() * (mob() ? 0.56 : 0.74) - size / 2;     // перекриває заголовок
    const yEnd   = () => vh() * (mob() ? 0.34 : 0.3) - size / 2;      // глобус лишається великим, їде вгору

    gsap.set(planet, { y: yStart });
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      onUpdate: requestDraw,
      scrollTrigger: {
        trigger: root, start: 'top top', end: '+=340%',
        pin: stage, scrub: 0.6, invalidateOnRefresh: true,
      },
    });

    // Кадри з макета (rotate = [-lng, -lat] центру диска):
    //  A  Америки — видно Federal Highway, Boca Raton
    //  B  Європа/Азія — Malta зліва вгорі, Guangdong справа внизу
    //  C  Азія — Guangdong біля верху, внизу каунт-ап статистики
    tl.to(planet, { y: yRise, ease: 'power2.out', duration: 0.26 }, 0)
      .to(head, { filter: 'blur(10px)', opacity: 0.35, duration: 0.22 }, 0.04)
      .fromTo(state, { lambda: 104, phi: -16 }, { lambda: 84, phi: -22, duration: 0.32 }, 0)     // A
      .to(state, { markers: 1, duration: 0.06 }, 0.12)
      .to(state, { lambda: -64, phi: -40, ease: 'sine.inOut', duration: 0.26 }, 0.32)           // → B
      .to(head, { opacity: 0, duration: 0.08 }, 0.5)
      .to(state, { lambda: -96, phi: -4, ease: 'sine.inOut', duration: 0.24 }, 0.66)            // → C
      .to(planet, { y: yEnd, ease: 'power2.inOut', duration: 0.24 }, 0.66)
      .to(fade, { opacity: 1, duration: 0.16 }, 0.76)
      .fromTo(stats, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, ease: 'power2.out', duration: 0.1 }, 0.84);

    counters.forEach((c, i) => {
      tl.fromTo(c, { v: 0 }, {
        v: c.to, duration: 0.13, ease: 'power1.out',
        onUpdate: () => { c.el.textContent = Math.round(c.v); },
      }, 0.85 + i * 0.015);
    });
    return tl;
  }

  /* ---------- reduced motion: статичний кадр ---------- */
  function staticFrame() {
    root.classList.add('is-static');
    Object.assign(state, { lambda: -64, phi: -40, markers: 1 });
    measure();
  }

  /* ---------- старт ---------- */
  HS.loadTopo('assets/data/land-110m.json').then((topo) => {
    land = topojson.feature(topo, topo.objects.land);
    drawn = ''; requestDraw();
  }).catch((err) => console.warn('globe: land data failed', err));

  if (HS.reduced) {
    staticFrame();
    addEventListener('resize', measure);
    return;
  }

  measure();
  buildTimeline();
  // Перераховуємо лише при зміні ширини (iOS змінює висоту при скролі через адресний рядок)
  let rT, lastW = innerWidth;
  addEventListener('resize', () => {
    if (innerWidth === lastW) return;
    lastW = innerWidth;
    clearTimeout(rT); rT = setTimeout(() => { measure(); ScrollTrigger.refresh(); }, 150);
  });
})();
