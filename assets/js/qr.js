/**
 * 09 · QR columns — horizontal scroll
 * Desktop (≥768px, motion allowed): the initial frame = Figma (row starts at the container edge);
 * the section pins and vertical scroll moves the row right → left until the last column reaches
 * the right container edge, then releases. Mobile/reduced: CSS native swipe / static wrap.
 * gsap.matchMedia reverts everything when the breakpoint changes.
 */
(() => {
  const section = document.getElementById('qr');
  if (!section || !window.gsap || !window.ScrollTrigger) return;

  const track = section.querySelector('.qr__track');
  const mm = gsap.matchMedia();

  mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
    section.classList.add('qr--pinned');
    // overflow of the row (track has the container edge as left/right padding)
    const distance = () => Math.max(0, track.scrollWidth - document.documentElement.clientWidth);

    const move = gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: () => '+=' + Math.max(distance() * 1.4, window.innerHeight * 0.5),
        pin: true,
        scrub: 0.8,
        invalidateOnRefresh: true,
      },
    });

    // appear: each column fades in from transparency (+ slight drift) as it enters from the right edge,
    // so upcoming columns are invisible until they arrive. Computed from the track's live x on every
    // update (deterministic; containerAnimation triggers mis-measured inside this pinned + matchMedia setup).
    // A column is fully visible once its left edge reaches 72% of the viewport — or its final resting
    // position for the last columns, which never travel that far left. Columns already in view at the
    // start are fully visible, so the first frame matches Figma.
    const cols = gsap.utils.toArray('.qr__col', section);
    const appear = () => {
      const vw = document.documentElement.clientWidth;
      const x = gsap.getProperty(track, 'x');
      const dist = distance();
      for (const col of cols) {
        const left = col.offsetLeft + x;                  // offsetParent = track (transformed)
        const done = Math.max(vw * 0.72, col.offsetLeft - dist - 1);
        const p = gsap.utils.clamp(0, 1, (vw - left) / Math.max(1, vw - done));
        col.style.opacity = p.toFixed(3);
        col.style.visibility = p > 0 ? 'visible' : 'hidden';
        col.style.translate = `${((1 - p) * 60).toFixed(1)}px 0`;
      }
    };
    move.eventCallback('onUpdate', appear);
    ScrollTrigger.addEventListener('refresh', appear);
    appear();

    // keyboard: focusing a QR link scrolls the page so that its column is inside the viewport
    const onFocus = (e) => {
      const col = e.target.closest('.qr__col');
      if (!col) return;
      const st = move.scrollTrigger;
      const vw = document.documentElement.clientWidth;
      const need = Math.max(0, col.offsetLeft + col.offsetWidth + 80 - vw); // px of travel needed
      const ratio = Math.min(1, need / Math.max(1, distance()));
      const y = st.start + (st.end - st.start) * ratio;
      if (window.HS && HS.lenis) HS.lenis.scrollTo(y, { immediate: true }); else window.scrollTo(0, y);
    };
    track.addEventListener('focusin', onFocus);

    return () => {
      section.classList.remove('qr--pinned');
      ScrollTrigger.removeEventListener('refresh', appear);
      cols.forEach((c) => { c.style.opacity = c.style.visibility = c.style.translate = ''; });
      track.removeEventListener('focusin', onFocus);
    };
  });
})();
