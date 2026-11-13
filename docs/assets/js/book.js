/**
 * 05 · Book — брошура на чистому CSS 3D + GSAP ScrollTrigger (scrub), з «curl» сторінок.
 *
 *   0.00–0.22  книга виїжджає знизу під кутом, заголовок блюриться
 *   0.20–0.36  кут → фронтально
 *   0.38–0.60  обкладинка відкривається (жорстка — малий вигин), книга зсувається вправо на ½ сторінки
 *   0.62–0.86  перегортається сторінка з вигином (Asteria → Solara)
 *   0.88–0.98  з'являється кнопка «Download brochure»
 *
 * CURL (сегментована сторінка): JS ріже кожен аркуш на N вертикальних смуг. Смуги вкладені одна в одну
 * (кожна наступна — left:100% попередньої, transform-origin: лівий край), тож поворот смуги i
 * додається до всіх попередніх → аркуш вигинається дугою. Кожна смуга показує свій «зріз» лиця/звороту
 * (копія вмісту, зсунута на -i·w). Корінь аркуша випереджає, край «відстає» — як у паперу.
 *
 * Порядок шарів: корінь = rotateY(a) translateZ(d) → закритий аркуш зверху (+d), перегорнутий знизу (-d).
 */
(() => {
  const root = document.getElementById('book');
  if (!root) return;

  const stage = root.querySelector('.book__stage');
  const head  = root.querySelector('.book__head');
  const obj   = root.querySelector('.book__obj');
  const cta   = root.querySelector('.book__cta');
  const castR = root.querySelector('.book__cast--r');
  const castL = root.querySelector('.book__cast--l');
  const lshadow = root.querySelector('.book__lshadow');
  const reduced = !!(window.HS && HS.reduced);

  // stiff: 0 — м'який папір, 1 — абсолютно жорсткий. n — кількість смуг.
  const leaves = [
    { el: root.querySelector('.book__leaf--cover'), n: 8,  stiff: 0.65 },
    { el: root.querySelector('.book__leaf--page'),  n: 14, stiff: 0 },
  ].map((l) => ({ ...l, d: +l.el.dataset.depth || 1, p: 0, strips: [] }));

  /* ---------- сегментація аркуша на смуги ---------- */
  function segment(l) {
    const front = l.el.querySelector('.face--front');
    const back  = l.el.querySelector('.face--back');
    const fHTML = front.innerHTML, bHTML = back.innerHTML;
    const fCls = front.className, bCls = back.className;
    l.el.style.setProperty('--n', l.n);
    l.el.classList.add('is-seg');
    // оригінальні цілі грані лишаються: у спокої (p=0/1) показуємо їх — без шва між смугами
    let parent = l.el;
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
  }

  /* ---------- геометрія вигину ---------- */
  // ваги відносного повороту: ростуть до краю → вигин сильніший біля вільного краю
  const weights = (n) => { const w = []; let sum = 0; for (let i = 0; i < n; i++) { w.push(i); sum += i; } return w.map((x) => x / (sum || 1)); };

  function renderLeaf(l) {
    const p = l.p;
    // корінь випереджає, край відстає; жорсткість зближує обидві криві
    const k = 1 - l.stiff;
    const rootA = -180 * (1 - Math.pow(1 - p, 1 + 0.9 * k));
    const tipA  = -180 * Math.pow(p, 1 + 0.9 * k);
    l.el.style.transform = `rotateY(${rootA.toFixed(2)}deg) translateZ(${l.d}px)`;
    if (!l.strips.length) return;
    const flat = p <= 0.001 || p >= 0.999;
    if (flat !== l.flat) { l.flat = flat; l.el.classList.toggle('is-flat', flat); }
    if (flat) return;
    const w = l.w || (l.w = weights(l.n));
    const span = tipA - rootA;  // ≥ 0: на скільки край відстає
    let abs = rootA;
    l.strips.forEach((s, i) => {
      const rel = i === 0 ? 0 : span * w[i];
      abs += rel;
      s.el.style.transform = i === 0 ? '' : `rotateY(${rel.toFixed(2)}deg)`;
      // освітлення: світло спереду-зліва; темніє, коли смуга розвертається боком до глядача
      const r = abs * Math.PI / 180;
      const facing = Math.abs(Math.cos(r));                  // 1 — фронтально, 0 — ребром
      const shade = (1 - facing) * 0.55;
      const hl = Math.pow(Math.max(0, Math.cos(r + 0.5)), 24) * (p > 0.02 && p < 0.98 ? 0.35 : 0); // блік на згині
      s.f.style.setProperty('--s', shade.toFixed(3));
      s.b.style.setProperty('--s', shade.toFixed(3));
      s.f.style.setProperty('--h', hl.toFixed(3));
      s.b.style.setProperty('--h', hl.toFixed(3));
    });
  }

  /** Тінь від аркуша на сторінці під ним: ширина = проєкція аркуша, сила — max посередині ходу */
  function renderCast(l) {
    const p = l.p, a = -180 * p;
    const proj = Math.abs(Math.cos(a * Math.PI / 180));
    const strength = Math.sin(Math.PI * p);
    if (p < 0.5) { gsap.set(castR, { opacity: strength * 0.9, scaleX: Math.max(proj, 0.05) }); gsap.set(castL, { opacity: 0 }); }
    else         { gsap.set(castL, { opacity: strength * 0.9, scaleX: Math.max(proj, 0.05) }); gsap.set(castR, { opacity: 0 }); }
  }

  const pageW = () => obj.offsetWidth;

  /* ---------- reduced motion: відкритий розворот Asteria, без смуг ---------- */
  if (reduced) {
    root.classList.add('is-static');
    leaves[0].p = 1; renderLeaf(leaves[0]); renderLeaf(leaves[1]); lshadow.style.opacity = 1;
    const place = () => gsap.set(obj, { x: pageW() / 2 });
    place(); addEventListener('resize', place);
    return;
  }

  leaves.forEach((l) => { segment(l); renderLeaf(l); });

  /* ---------- скрол-таймлайн ---------- */
  gsap.set(obj, { y: () => innerHeight * 0.5 + obj.offsetHeight, rotationX: -16, rotationY: 34, rotationZ: -5, scale: 0.9 });
  gsap.set(cta, { autoAlpha: 0, y: 16 });

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: root, start: 'top top', end: '+=400%',
      pin: stage, scrub: 0.6, invalidateOnRefresh: true,
    },
  });

  const [cover, page] = leaves;
  tl.to(obj, { y: 0, ease: 'power2.out', duration: 0.22 }, 0)
    .to(head, { filter: 'blur(8px)', opacity: 0.3, duration: 0.18 }, 0.05)
    .to(obj, { rotationX: 0, rotationY: 0, rotationZ: 0, scale: 1, ease: 'power1.inOut', duration: 0.16 }, 0.2)
    // відкриття обкладинки (жорстка) + центрування розвороту
    .to(cover, { p: 1, ease: 'power1.inOut', duration: 0.22, onUpdate: () => { renderLeaf(cover); lshadow.style.opacity = Math.max(0, (cover.p - 0.85) / 0.15).toFixed(3); } }, 0.38)
    .to(obj, { x: () => pageW() / 2, ease: 'power1.inOut', duration: 0.22 }, 0.38)
    // перегортання сторінки з curl + тінь на сторінках під нею
    .to(page, { p: 1, ease: 'power1.inOut', duration: 0.24, onUpdate: () => { renderLeaf(page); renderCast(page); } }, 0.62)
    .to(cta, { autoAlpha: 1, y: 0, ease: 'power2.out', duration: 0.1 }, 0.88);
})();
