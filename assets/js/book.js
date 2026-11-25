/**
 * 05 · Book — брошура на чистому CSS 3D + GSAP ScrollTrigger (scrub), Round 5 (підписаний Figma, 16 станів).
 *
 *   A  text-fill заголовка (HS.textFill, літери по одній до 100 %) — книга закрита внизу    (01–03)
 *   B  брошура піднімається до тексту                                                      (04)
 *   C  обкладинка відкривається (жорстка, малий вигин), брошура росте й центрує розворот      (05–06 Intro)
 *   D  7 перегортань з curl: Intro → Design → Exterior → Profile → Salon → Owner cabin →
 *      Deck plans → Specification (між ними короткі «паузи» на розворотах)                (07–14)
 *   E  брошура закривається (весь лівий стос жорстко повертається), зменшується, центрується (15)
 *   F  лишається закритою; pin знімається — сторінка скролиться далі, з'являється CTA       (16)
 *
 * CURL: лише аркуш, що ЗАРАЗ перегортається, тимчасово ріжеться на N вертикальних смуг (вкладені,
 * transform-origin ланцюжком → дуга). У спокої смуги видаляються → у DOM лише цілі грані (60 fps, мало вузлів).
 * Порядок шарів без z-index: корінь = rotateY(a) translateZ(d) → закритий аркуш +d, перегорнутий −d.
 */
(() => {
  const root = document.getElementById('book');
  if (!root) return;
  window.HS = window.HS || {};

  const stage = root.querySelector('.book__stage');
  const title = root.querySelector('.book__title');
  const obj   = root.querySelector('.book__obj');
  const cta   = root.querySelector('.book__cta');
  const castR = root.querySelector('.book__cast--r');
  const castL = root.querySelector('.book__cast--l');
  const lshadow = root.querySelector('.book__lshadow');
  const reduced = !!HS.reduced;

  // Аркуші в порядку перегортання: 0 = обкладинка, 1..n-1 = сторінки
  const leaves = [...root.querySelectorAll('.book__leaf--turn')]
    .sort((a, b) => a.dataset.leaf - b.dataset.leaf)
    .map((el, i) => ({
      el, i, d: +el.dataset.depth || 1,
      n: i === 0 ? 8 : 12,                  // кількість смуг
      stiff: i === 0 ? 0.65 : 0,            // 0 — м'який папір, 1 — жорсткий
      p: 0,                                 // прогрес перегортання 0..1
      rigid: false,                         // режим «закриття»: без вигину й без смуг
      strips: null, flat: true,
    }));

  /* ---------- лінива сегментація (лише аркуш у русі) ---------- */
  function segment(l) {
    if (l.strips) return;
    const front = l.el.querySelector(':scope > .face--front');
    const back  = l.el.querySelector(':scope > .face--back');
    const fHTML = front.innerHTML, bHTML = back.innerHTML, fCls = front.className, bCls = back.className;
    l.el.style.setProperty('--n', l.n);
    const frag = document.createDocumentFragment();
    let parent = frag; l.strips = [];
    for (let i = 0; i < l.n; i++) {
      const s = document.createElement('div');
      s.className = 'strip';
      // лице: зріз [i·w, (i+1)·w]; зворот (після перевороту дзеркальний): зріз [W-(i+1)·w, W-i·w]
      s.innerHTML =
        `<div class="${fCls}"><div class="slice" style="left:calc(var(--pw) * ${-i} / ${l.n})">${fHTML}</div></div>` +
        `<div class="${bCls}"><div class="slice" style="left:calc(var(--pw) * ${-(l.n - 1 - i)} / ${l.n})">${bHTML}</div></div>`;
      parent.appendChild(s);
      l.strips.push({ el: s, f: s.children[0], b: s.children[1] });
      parent = s;
    }
    l.el.appendChild(frag);
    l.el.classList.add('is-seg');
  }
  function unsegment(l) {
    if (!l.strips) return;
    l.strips[0].el.remove();
    l.strips = null;
    l.el.classList.remove('is-seg');
  }

  /* ---------- геометрія вигину ---------- */
  const weightsCache = {};
  const weights = (n) => weightsCache[n] || (weightsCache[n] = (() => {
    const w = []; let sum = 0; for (let i = 0; i < n; i++) { w.push(i); sum += i; } return w.map((x) => x / (sum || 1));
  })());

  function renderLeaf(l) {
    const p = l.p;
    const k = l.rigid ? 0 : 1 - l.stiff;
    const rootA = -180 * (1 - Math.pow(1 - p, 1 + 0.9 * k));   // корінь випереджає
    const tipA  = -180 * Math.pow(p, 1 + 0.9 * k);             // край відстає
    l.el.style.transform = `rotateY(${rootA.toFixed(2)}deg) translateZ(${l.d}px)`;

    const curling = !l.rigid && p > 0.001 && p < 0.999;
    if (!curling) { unsegment(l); return; }
    segment(l);
    const w = weights(l.n), span = tipA - rootA;
    let abs = rootA;
    l.strips.forEach((s, i) => {
      const rel = i === 0 ? 0 : span * w[i];
      abs += rel;
      if (i) s.el.style.transform = `rotateY(${rel.toFixed(2)}deg)`;
      const r = abs * Math.PI / 180;
      const shade = (1 - Math.abs(Math.cos(r))) * 0.5;                       // темніє, коли смуга боком
      const hl = Math.pow(Math.max(0, Math.cos(r + 0.5)), 24) * 0.3;         // блік на згині
      s.f.style.setProperty('--s', shade.toFixed(3)); s.b.style.setProperty('--s', shade.toFixed(3));
      s.f.style.setProperty('--h', hl.toFixed(3));    s.b.style.setProperty('--h', hl.toFixed(3));
    });
  }

  /** Тінь від аркуша, що перегортається: на праву сторінку (перша половина ходу) і на ліву (друга) */
  // базові трансформи cast-елементів (scaleX дописуємо в renderCast)
  const castBase = { r: getComputedStyle(castR).transform, l: getComputedStyle(castL).transform };
  function setCast(el, base, op, sx) { el.style.opacity = op; el.style.transform = `${base === 'none' ? '' : base} scaleX(${sx})`; }
  function renderCast() {
    const l = leaves.find((x) => x.i > 0 && x.p > 0.001 && x.p < 0.999 && !x.rigid);
    if (!l) { castR.style.opacity = 0; castL.style.opacity = 0; return; }
    const sx = Math.max(Math.abs(Math.cos(Math.PI * l.p)), 0.05).toFixed(3), op = (Math.sin(Math.PI * l.p) * 0.85).toFixed(3);
    if (l.p < 0.5) { setCast(castR, castBase.r, op, sx); castL.style.opacity = 0; }
    else { setCast(castL, castBase.l, op, sx); castR.style.opacity = 0; }
  }

  let closeAt = Infinity;   // час на таймлайні, з якого діє «жорстке» закриття (задається нижче)
  let tl = null;
  const renderAll = () => {
    const rigid = !!tl && tl.time() >= closeAt;
    leaves.forEach((l) => { l.rigid = rigid; renderLeaf(l); });
    renderCast();
  };
  const pageW = () => obj.offsetWidth;

  /* ---------- reduced motion: відкритий розворот Intro ---------- */
  if (reduced) {
    root.classList.add('is-static');
    if (HS.textFill) HS.textFill(title);
    leaves[0].p = 1; leaves.forEach(renderLeaf); lshadow.style.opacity = 1;
    const place = () => gsap.set(obj, { x: pageW() / 2 });
    place(); addEventListener('resize', place);
    return;
  }
  renderAll();

  /* ---------- скрол-таймлайн ---------- */
  // Масштаб і зсув закритої брошури — з CSS (--closed, --dyc; за Figma desktop/mobile). Відкрита росте до scale 1, y 0.
  const css = (k, d) => parseFloat(getComputedStyle(root).getPropertyValue(k)) || d;
  const CLOSED = () => css('--closed', 0.8875);
  const closedY = () => innerHeight * css('--dyc', 0);
  gsap.set(obj, { y: () => closedY() + innerHeight * 0.1, scale: CLOSED, rotationX: 8 });
  gsap.set(cta, { autoAlpha: 0, y: 16 });

  tl = gsap.timeline({
    defaults: { ease: 'none' },
    onUpdate: renderAll,
    scrollTrigger: {
      trigger: root, start: 'top top', end: () => '+=' + Math.round(innerHeight * (innerWidth < 640 ? 9 : 11)),
      pin: stage, scrub: 1, invalidateOnRefresh: true,
    },
  });

  // A) text-fill (pin) — 0…1
  if (HS.textFill) HS.textFill(title, { timeline: tl, at: 0, duration: 1 });
  else tl.to({}, { duration: 1 }, 0);
  // B) піднімається до тексту
  tl.to(obj, { y: closedY, rotationX: 0, ease: 'power2.inOut', duration: 0.8 }, 1);
  // C) обкладинка відкривається + брошура росте й зсувається на ½ сторінки (розворот по центру)
  const cover = leaves[0];
  tl.to(cover, { p: 1, ease: 'power1.inOut', duration: 1.2 }, 1.9)
    .to(obj, { scale: 1, y: 0, x: () => pageW() / 2, ease: 'power1.inOut', duration: 1.2 }, 1.9)
    .to(lshadow, { opacity: 1, duration: 0.2 }, 2.9);
  // D) 7 перегортань: кожне 0.9, пауза на розвороті 0.45 (мобільний: швидше — «pages scroll by»)
  const mob = innerWidth < 640;
  const TURN = mob ? 0.6 : 0.9, HOLD = mob ? 0.2 : 0.45;
  let t = 3.1 + HOLD;
  leaves.slice(1).forEach((l) => { tl.to(l, { p: 1, ease: 'power1.inOut', duration: TURN }, t); t += TURN + HOLD; });
  // E) закриття: усі перегорнуті аркуші жорстко повертаються разом (як обкладинка, що закриває стос)
  closeAt = t + 0.1;
  tl.to(leaves, { p: 0, ease: 'power2.inOut', duration: 1.6 }, closeAt);   // один «стос» — без віяла
  tl.to(lshadow, { opacity: 0, duration: 0.15 }, closeAt)
    .to(obj, { scale: CLOSED, y: closedY, x: 0, ease: 'power2.inOut', duration: 1.6 }, closeAt)
  // F) лишається закритою, CTA
    .to(cta, { autoAlpha: 1, y: 0, ease: 'power2.out', duration: 0.4 }, closeAt + 1.6)
    .to({}, { duration: 0.6 });
})();
