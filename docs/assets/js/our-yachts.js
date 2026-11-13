/**
 * 00 · Our yachts — depth fly-through
 *
 * Every photo lives at a depth Z (1 = the Figma size; bigger = farther). The camera moves forward with
 * scroll: Z(t) = Z0 − TRAVEL·t. Screen projection around the stage centre (vanishing point):
 *   scale  = 1 / Z           (relative to the photo's size at depth 1)
 *   offset = offset₁ / Z     (distance from the centre grows as it approaches → flies outward)
 * Opacity: far photos are hazy (fade in from the depth), near photos dissolve before reaching the camera.
 * Figma photos start exactly at their Figma rect/opacity (t = 0 reproduces the frame 1:1).
 * The italic tail of the title fills grey → navy during the pin.
 */
(() => {
  const section = document.getElementById('our-yachts');
  if (!section || !window.gsap) return;

  const reduced = !!(window.HS && HS.reduced);
  const stage = section.querySelector('.oy__stage');
  const FRAME_W = 1440, FRAME_H = 800;   // Figma frame
  const TRAVEL = 3.0;                     // depth units the camera travels over the pin
  const NEAR_FADE = [0.62, 0.3];          // start / end of the dissolve near the camera (Z)
  const mqMobile = matchMedia('(max-width: 767px)');

  // haze by depth: Z → max opacity (piecewise linear)
  const HAZE = [[4.2, 0], [3.6, 0.15], [3, 0.38], [2, 0.7], [1.2, 1]];
  function haze(z) {
    if (z >= HAZE[0][0]) return 0;
    for (let i = 1; i < HAZE.length; i++) {
      const [z1, o1] = HAZE[i], [z0, o0] = HAZE[i - 1];
      if (z >= z1) return o0 + (o1 - o0) * (z0 - z) / (z0 - z1);
    }
    return 1;
  }

  // Build the photo model from data-attributes (all values in Figma-frame px at depth 1)
  const photos = [...section.querySelectorAll('.oy__ph')].map((el) => {
    const d = el.dataset;
    const w = +d.w, h = +d.h;
    if (d.z) { // stream photo: given at depth 1
      return { el, z0: +d.z, dx: +d.dx, dy: +d.dy, w, h, wash: 1, stream: true, mobile: d.m === '1' };
    }
    // Figma slot: bigger = closer. Depth chosen so that size at Z = 1 is ~151px (the largest slot).
    const z0 = 151 / w;
    const cx = +d.x + w / 2 - FRAME_W / 2, cy = +d.y + h / 2 - FRAME_H / 2;
    // the Figma "wash" (opacity) relative to the generic haze at that depth; kept while it approaches
    const wash = Math.min(1, +d.o / Math.max(0.01, haze(z0)));
    return { el, z0, dx: cx * z0, dy: cy * z0, w: w * z0, h: h * z0, wash, mobile: d.m === '1' };
  });

  let W = 0, H = 0, S = 1, SY = 1, active = photos;
  function measure() {
    W = stage.clientWidth; H = stage.clientHeight;
    // desktop: fit the 1440×800 frame; phones: larger scale + fewer photos
    S = mqMobile.matches ? W / 720 : Math.min(W / FRAME_W, H / FRAME_H);
    // phones are portrait: spread photos vertically over the tall stage instead of a thin band
    SY = mqMobile.matches ? H / 900 : S;
    active = mqMobile.matches ? photos.filter((p) => p.mobile) : photos;
    photos.forEach((p) => {
      p.on = active.includes(p);
      p.el.style.display = p.on ? '' : 'none';
      p.el.style.width = p.w * S + 'px';
      p.el.style.height = p.h * S + 'px';
    });
  }

  function render(t) {
    for (const p of active) {
      const z = p.z0 - TRAVEL * t;
      if (z <= NEAR_FADE[1]) { if (p.vis !== false) { p.el.style.opacity = 0; p.el.style.visibility = 'hidden'; p.vis = false; } continue; }
      const k = 1 / z;
      const near = z < NEAR_FADE[0] ? (z - NEAR_FADE[1]) / (NEAR_FADE[0] - NEAR_FADE[1]) : 1;
      // Figma wash fades to full colour as the photo comes closer than its start depth
      const wash = z < p.z0 ? p.wash + (1 - p.wash) * Math.min(1, (p.z0 - z) / Math.max(0.4, p.z0 - 1)) : p.wash;
      // stream photos are hidden at t = 0 (keeps the Figma frame clean) and fade in over the first ~12% of the pin
      const gate = p.stream ? Math.min(1, t / 0.12) : 1;
      const o = Math.min(1, haze(z) * wash) * near * gate;
      const x = W / 2 + p.dx * k * S - (p.w * S) / 2;
      const y = H / 2 + p.dy * k * SY - (p.h * S) / 2;
      p.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${k.toFixed(4)})`;
      p.el.style.opacity = o.toFixed(3);
      p.el.style.zIndex = Math.round(100 / z);
      if (p.vis !== true) { p.el.style.visibility = 'visible'; p.vis = true; }
    }
  }

  // Title tail: split into chars for the grey → navy fill
  const fillEls = [...section.querySelectorAll('.oy__fill')];
  const chars = fillEls.flatMap((el) => SplitText.create(el, { type: 'chars', charsClass: 'char' }).chars);
  const ink = getComputedStyle(section).getPropertyValue('--oy-ink').trim();

  const state = { t: 0 };
  measure();
  render(0);

  if (reduced || !window.ScrollTrigger) {
    // static Figma composition; title fully legible (navy)
    gsap.set(chars, { color: ink });
    window.addEventListener('resize', () => { measure(); render(0); });
    return;
  }

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: '+=250%',
      pin: true,
      scrub: 0.6,
      invalidateOnRefresh: true,
      onRefresh: () => { measure(); render(state.t); },
    },
  });
  tl.to(state, { t: 1, duration: 1, onUpdate: () => render(state.t) }, 0)
    .to(chars, { color: ink, duration: 0.03, stagger: 0.035 }, 0.08); // fill spans ≈ 8% → 55% of the pin
})();
