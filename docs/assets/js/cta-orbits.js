/* ==========================================================================
   06 · CTA orbits
   - Canvas background: faint ellipses; on each a dot travels with a fading trail (one smooth gradient arc) and a live
     "[lat lon]" label derived from its orbital position (a pseudo satellite ground track).
   - Runs only while on screen (IntersectionObserver) — rAF also stops in hidden tabs.
   - Reduced motion: one static frame.
   - Title: shared letter-by-letter text-fill (muted → 100%) while the section is pinned.
   ========================================================================== */
(() => {
  'use strict';
  const sec = document.getElementById('cta-orbits');
  if (!sec) return;
  const reduced = !!(window.HS && HS.reduced);

  // ---- Title text-fill (site-wide rule, shared HS.textFill) ---------------------
  // The whole title starts uniformly muted (white at low opacity on navy); letters reach 100% one by one,
  // first → last, while the CTA is PINNED. The page only continues scrolling after the fill is complete.
  const title = sec.querySelector('.cta-title');
  if (title && window.gsap && window.ScrollTrigger && HS.textFill) {
    if (reduced) {
      HS.textFill(title); // reduced: helper just sets every letter to 100%
    } else {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: sec, pin: true, start: 'top top', end: () => '+=' + Math.round(innerHeight * 0.8), scrub: 0.5, invalidateOnRefresh: true },
      });
      HS.textFill(title, { timeline: tl, at: 0, duration: 0.85, from: 0.28 });
      tl.to({}, { duration: 0.15 }); // short hold at 100% before the pin releases
    }
  }

  // ---- Canvas orbits ---------------------------------------------------------
  const canvas = sec.querySelector('.cta-canvas');
  const ctx = canvas && canvas.getContext('2d');
  if (!ctx) return;

  let orbits = [];
  try { orbits = JSON.parse(canvas.dataset.orbits || '[]'); } catch (e) { orbits = []; }
  orbits = orbits.map((o) => ({ ...o, theta: o.phase, rotRad: (o.rot * Math.PI) / 180 }));

  const TRAIL_PX = 140;      // trail length in px (converted to an angle per orbit); shorter for the slow orbits
  const TRAIL_STOPS = 14;    // gradient stops along the trail (not geometry — the arc itself is exact)
  const STAR_RGB = '255,255,255';
  const TAU = Math.PI * 2;
  const hasConic = typeof ctx.createConicGradient === 'function';
  const FONT = '11px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
  const content = sec.querySelector('.cta-inner');
  let W = 0, H = 0, dpr = 1;
  let calm = null;           // rect around the copy where labels dim, so they never fight the CTA text
  let running = false, raf = 0, last = 0;

  /** Point on a rotated ellipse at parameter t (px). */
  // Portrait screens: the config is authored for landscape; stretch x / squash y so orbits stay
  // round-ish instead of becoming thin vertical needles at 375×812.
  let kx = 1, ky = 1;
  const radii = (o) => [o.rx * W * kx, o.ry * H * ky];
  function pointAt(o, t) {
    const [rx, ry] = radii(o);
    const x = rx * Math.cos(t), y = ry * Math.sin(t);
    const c = Math.cos(o.rotRad), s = Math.sin(o.rotRad);
    return [o.cx * W + x * c - y * s, o.cy * H + x * s + y * c];
  }

  /**
   * Orbit parameter → geographic coordinates. Treats the orbit like an inclined satellite:
   * longitude drifts with the angle, latitude follows sin(angle) — continuous and plausible.
   */
  function coordsAt(o, t) {
    const u = t - o.phase;
    const lat = Math.max(-84, Math.min(84, o.lat + 26 * Math.sin(u)));
    let lon = o.lon + (u * 180) / Math.PI * 0.75;
    lon = ((((lon + 180) % 360) + 360) % 360) - 180;
    return [lat, lon];
  }
  function dms(v, pos, neg) {
    const a = Math.abs(v);
    let d = Math.floor(a), m = Math.round((a - d) * 60);
    if (m === 60) { d += 1; m = 0; }
    return `${d}°${String(m).padStart(2, '0')}′${v >= 0 ? pos : neg}`;
  }
  const label = (o, t) => { const [la, lo] = coordsAt(o, t); return `[${dms(la, 'N', 'S')} ${dms(lo, 'E', 'W')}]`; };

  /** Fading trail behind the star: single exact elliptical arc + gradient stroke (cheap: 1 path, 1 gradient). */
  function drawTrail(o, erx, ery) {
    const avgR = (erx + ery) / 2;
    const span = Math.min(TRAIL_PX / avgR, Math.PI * 0.9); // parameter span (< π → fits a conic gradient cleanly)
    const dir = Math.sign(o.speed) || 1;
    const cx = o.cx * W, cy = o.cy * H;
    const head = o.theta, tail = o.theta - dir * span;
    let grad;
    if (hasConic) {
      // screen angle of a trail point around the ellipse centre (monotonic along the arc)
      const ang = (t) => { const [px, py] = pointAt(o, t); return Math.atan2(py - cy, px - cx); };
      // put the gradient's 0/1 seam opposite the trail so it can never touch the stroke (or its round caps)
      const start = ang(o.theta - dir * span / 2) + Math.PI;
      grad = ctx.createConicGradient(start, cx, cy);
      for (let i = 0; i <= TRAIL_STOPS; i++) {
        const u = i / TRAIL_STOPS;                       // 0 = head … 1 = tail
        const a = Math.pow(1 - u, 1.6) * 0.85;           // eased fade → 0
        const off = ((((ang(head - dir * span * u) - start) % TAU) + TAU) % TAU) / TAU;
        grad.addColorStop(off, `rgba(${STAR_RGB},${a.toFixed(3)})`);
      }
    } else {
      // fallback (very old browsers): straight head → tail gradient
      const [hx, hy] = pointAt(o, head), [tx, ty] = pointAt(o, tail);
      grad = ctx.createLinearGradient(hx, hy, tx, ty);
      grad.addColorStop(0, `rgba(${STAR_RGB},0.85)`);
      grad.addColorStop(1, `rgba(${STAR_RGB},0)`);
    }
    ctx.beginPath();
    // canvas ellipse angles are the same parameter t as pointAt() → the arc lies exactly on the orbit
    if (dir > 0) ctx.ellipse(cx, cy, erx, ery, o.rotRad, tail, head);
    else ctx.ellipse(cx, cy, erx, ery, o.rotRad, head, tail);
    ctx.lineCap = 'round';
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = grad;
    ctx.stroke();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.font = FONT;
    ctx.textBaseline = 'middle';
    for (const o of orbits) {
      // Orbit line
      ctx.beginPath();
      const [erx, ery] = radii(o);
      ctx.ellipse(o.cx * W, o.cy * H, erx, ery, o.rotRad, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Dot passing behind the copy (common on narrow screens) → dim dot + trail so text stays clean.
      const [hx, hy] = pointAt(o, o.theta);
      const behindCopy = calm && hx > calm.l && hx < calm.r && hy > calm.t && hy < calm.b;
      ctx.globalAlpha = behindCopy ? 0.3 : 1;

      // Trail: ONE continuous arc of the orbit (exact ctx.ellipse sub-arc, no segments/dots), stroked with a
      // conic gradient centred on the ellipse: colour stops are placed at the screen angles of samples along
      // the trail, so the alpha fades smoothly from the star colour at the head to fully transparent at the tail.
      drawTrail(o, erx, ery);

      // Dot + soft halo
      const [x, y] = pointAt(o, o.theta);
      ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fill();
      ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill();

      ctx.globalAlpha = 1;
      if (x < 0 || x > W || y < 0 || y > H) continue; // dot off canvas → no orphan label
      // Label: pushed outward from the ellipse center so it never sits on the trail
      let nx = x - o.cx * W, ny = y - o.cy * H;
      const nl = Math.hypot(nx, ny) || 1; nx /= nl; ny /= nl;
      const txt = label(o, o.theta);
      // Keep the label inside the canvas: flip to the other side of the dot near an edge.
      let right = nx >= 0;
      const tw = ctx.measureText(txt).width;
      if (right && x + 18 + tw > W - 8) right = false; else if (!right && x - 18 - tw < 8) right = true;
      ctx.textAlign = right ? 'left' : 'right';
      const lx = x + (right ? 18 : -18), ly = y + ny * 14;
      const inCalm = calm && lx > calm.l && lx < calm.r && ly > calm.t && ly < calm.b;
      ctx.fillStyle = inCalm ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.55)';
      ctx.fillText(txt, lx, ly);
    }
  }

  function frame(ts) {
    const dt = Math.min(ts - (last || ts), 50) / 1000; // clamp after stalls
    last = ts;
    for (const o of orbits) o.theta += o.speed * dt;
    draw();
    raf = requestAnimationFrame(frame);
  }
  function start() { if (running || reduced) return; running = true; last = 0; raf = requestAnimationFrame(frame); }
  function stop() { running = false; cancelAnimationFrame(raf); }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = sec.clientWidth; H = sec.clientHeight;
    const portrait = W < H;
    kx = portrait ? 1.7 : 1; ky = portrait ? 0.5 : 1;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Calm zone = union of the copy elements' boxes (+ padding), in canvas coordinates.
    const sb = sec.getBoundingClientRect();
    const boxes = [...content.children].map((el) => el.getBoundingClientRect());
    calm = {
      l: Math.min(...boxes.map((b) => b.left)) - sb.left - 60, r: Math.max(...boxes.map((b) => b.right)) - sb.left + 60,
      t: Math.min(...boxes.map((b) => b.top)) - sb.top - 24, b: Math.max(...boxes.map((b) => b.bottom)) - sb.top + 24,
    };
    draw(); // immediate repaint (also the static frame for reduced motion)
  }

  new ResizeObserver(resize).observe(sec);
  new IntersectionObserver(([en]) => (en.isIntersecting ? start() : stop()), { rootMargin: '100px' }).observe(sec);
})();
