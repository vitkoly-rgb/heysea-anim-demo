/* ==========================================================================
   07 · Wave steps
   Pinned + scrubbed. The wave path is generated here (horizontal ≥768px, vertical below),
   so node positions sit exactly on the curve and their lengths along it are known.
   ========================================================================== */
(() => {
  'use strict';
  const sec = document.getElementById('wave-steps');
  if (!sec || !window.gsap || !window.ScrollTrigger) return;

  const svg = sec.querySelector('.ws-svg');
  const track = sec.querySelector('.ws-track');
  const prog = sec.querySelector('.ws-progress');
  const nodes = [...sec.querySelectorAll('.ws-node')];
  const caps = [...sec.querySelectorAll('.ws-caption')];
  const title = sec.querySelector('.ws-title');
  const N = nodes.length;

  /**
   * Build a sine wave whose extrema sit exactly on the nodes (alternating trough/crest).
   * Sampled as a dense polyline: lengths are exact, and at 4-unit steps it renders perfectly smooth.
   * @returns {{total:number, nodeLen:number[]}}
   */
  function build(vertical) {
    const VW = vertical ? 120 : 1200;
    const VH = vertical ? N * 160 : 240;
    const span = (vertical ? VH : VW) / N;      // distance between nodes along the main axis
    const amp = vertical ? 30 : 50;
    const mid = (vertical ? VW : VH) / 2;
    const len = vertical ? VH : VW;
    const f = (u) => mid + amp * Math.cos((Math.PI * (u - span / 2)) / span); // node 0 at u = span/2

    const pts = [];
    for (let u = 0; u <= len + 0.01; u += 4) pts.push(vertical ? [f(u), u] : [u, f(u)]);
    const d = 'M' + pts.map((p) => p[0].toFixed(2) + ',' + p[1].toFixed(2)).join('L');

    // Cumulative polyline length per sample → node lengths
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const nodeLen = nodes.map((el, k) => {
      const u = span / 2 + k * span;
      const idx = Math.round(u / 4);
      const [x, y] = pts[idx];
      el.style.setProperty('--xp', (x / VW).toFixed(4));
      el.style.setProperty('--yp', (y / VH).toFixed(4));
      return cum[idx];
    });

    svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
    svg.style.aspectRatio = `${VW} / ${VH}`;
    prog.setAttribute('d', d);
    const total = prog.getTotalLength();
    syncStroke(VW);
    prog.style.strokeDasharray = `${total} ${total}`;
    // Dashed track = ONLY the not-yet-drawn remainder (no dashes under the solid line → no striped edges).
    // Pre-joined tails make the per-frame rebuild a string concat instead of a 300-point join.
    const segs = pts.map((p) => 'L' + p[0].toFixed(2) + ',' + p[1].toFixed(2));
    const tails = new Array(segs.length + 1);
    tails[segs.length] = '';
    for (let i = segs.length - 1; i >= 0; i--) tails[i] = segs[i] + tails[i + 1];
    window.__wsNodeLen = nodeLen; // debug hook for test/ws-crossing.mjs
    return { total, nodeLen, pts, cum, tails };
  }

  // Keep strokes a constant screen size regardless of viewBox scale, in USER units (no vector-effect:
  // with non-scaling-stroke Chrome applies dash arrays/offsets in screen px — see CSS note).
  let vbW = 1200;
  let k = 1;                        // user units per screen px
  function syncStroke(VW = vbW) {
    vbW = VW;
    const px = svg.getBoundingClientRect().width || VW;
    k = VW / px;
    prog.style.strokeWidth = (1.75 * k).toFixed(3);
    track.style.strokeWidth = (1.5 * k).toFixed(3);
    track.style.strokeDasharray = `${(2 * k).toFixed(3)} ${(7 * k).toFixed(3)}`; // same 2/7 px dash as before, now in user units
  }

  /** Rebuild the dashed remainder from length L to the end; dash phase pinned to the full path. */
  function setTrack(L) {
    const { pts, cum, tails } = geo;
    let j = 1;
    while (j < cum.length && cum[j] <= L) j++;
    if (j >= cum.length) { track.setAttribute('d', ''); return; }
    const t = (L - cum[j - 1]) / (cum[j] - cum[j - 1] || 1);
    const x = pts[j - 1][0] + (pts[j][0] - pts[j - 1][0]) * t;
    const y = pts[j - 1][1] + (pts[j][1] - pts[j - 1][1]) * t;
    track.setAttribute('d', `M${x.toFixed(2)},${y.toFixed(2)}${tails[j]}`);
    track.style.strokeDashoffset = L.toFixed(2); // offset = L keeps the dots stationary while the start moves
  }
  new ResizeObserver(() => syncStroke()).observe(svg);

  let geo = null;
  let active = -1;

  /** Set caption + node states for the stage at index i. */
  function setActive(i, instant) {
    if (i === active) return;
    const prev = active;
    active = i;
    nodes.forEach((n, k) => {
      n.classList.toggle('is-done', k < i);
      n.classList.toggle('is-current', k === i);
    });
    if (prev >= 0) {
      // Sequential out → in: overlapping captions of different length read as a garbled frame.
      gsap.to(caps[prev], { autoAlpha: 0, y: -10, duration: instant ? 0 : 0.2, ease: 'power2.in', overwrite: true });
      caps[prev].classList.remove('is-active');
    }
    caps[i].classList.add('is-active');
    gsap.fromTo(caps[i], { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: instant ? 0 : 0.5, delay: instant ? 0 : 0.22, ease: 'power3.out', overwrite: true });
  }

  /**
   * p ∈ [0,1]: 0 = stroke drawn up to the first node (stage 1 reached), 1 = drawn up to the last node.
   * Activation is driven by the stroke itself: a node becomes current the moment the drawn length
   * reaches that node's precomputed length along the path.
   */
  function setProgress(p, instant) {
    const { total, nodeLen } = geo;
    const L = nodeLen[0] + p * (nodeLen[N - 1] - nodeLen[0]);
    prog.style.strokeDashoffset = total - L;
    setTrack(L);
    let i = 0;
    for (let k = 1; k < N; k++) if (L >= nodeLen[k] - 0.01) i = k; // −0.01: float tolerance at p = 1
    setActive(i, instant);
  }

  caps.forEach((c, i) => gsap.set(c, { autoAlpha: i === 0 ? 1 : 0 }));
  sec.classList.add('is-ready');

  const mm = gsap.matchMedia();
  // Note: a conditions-object callback only runs if at least one query matches → include desktop too.
  mm.add({ desktop: '(min-width: 768px)', mobile: '(max-width: 767px)', reduce: '(prefers-reduced-motion: reduce)' }, (ctx) => {
    const { mobile, reduce } = ctx.conditions;
    geo = build(mobile);
    active = -1;

    if (reduce) {               // static: full journey drawn, all copy visible, no pin
      sec.classList.add('is-static');
      setProgress(1, true);
      nodes.forEach((n) => { n.classList.add('is-done'); n.classList.remove('is-current'); });
      return () => sec.classList.remove('is-static');
    }

    setProgress(0, true);
    const state = { p: 0 };
    // One pinned, scrubbed timeline (1 unit ≈ 60vh of scroll):
    //   0 → 1      heading text-fill (shared HS.textFill: letters muted → 100% one by one)
    //   1 → 1+N    the wave draws, nodes activate
    const FILL = 1;
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sec,
        pin: true,
        start: 'top top',
        end: () => '+=' + Math.round(innerHeight * 0.6 * (FILL + N)),
        scrub: 0.6,
        invalidateOnRefresh: true,
      },
    });
    const fill = HS.textFill ? HS.textFill(title, { timeline: tl, at: 0, duration: FILL * 0.9 }) : null;
    tl.to(state, { p: 1, ease: 'none', duration: N, onUpdate: () => setProgress(state.p) }, FILL);
    return () => { tl.scrollTrigger && tl.scrollTrigger.kill(); tl.kill(); fill && fill.split.revert(); };
  });
})();
