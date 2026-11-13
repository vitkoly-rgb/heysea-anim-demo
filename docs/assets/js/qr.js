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
      track.removeEventListener('focusin', onFocus);
    };
  });
})();
