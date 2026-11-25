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

  // ---- Entrance (plays once on scroll entry; all breakpoints) -------------------------------------------
  // Animates only the INNER elements (eyebrow, title lines, QR svg, name, description) — never .qr__col /
  // .qr__track, whose opacity/translate/x belong to the pin scrub + "appear" logic above. So the entrance
  // composes with both the desktop pin and the mobile native swipe. Reduced motion: nothing is hidden.
  if (window.HS && HS.reduced) return;
  const eyebrow = section.querySelector('.qr__eyebrow');
  const title = section.querySelector('.qr__title');
  const colEls = gsap.utils.toArray('.qr__col', section);
  const parts = (col) => ({ code: col.querySelector('.qr__code'), name: col.querySelector('.qr__name'), desc: col.querySelector('.qr__desc') });
  const all = colEls.map(parts);

  // title: lines rise out of a mask (SplitText); reverted after the entrance so resizes reflow natively
  const split = window.SplitText && title ? SplitText.create(title, { type: 'lines', mask: 'lines', linesClass: 'qr__line' }) : null;
  const lines = split ? split.lines : [title];

  gsap.set(eyebrow, { autoAlpha: 0, y: 12 });
  gsap.set(lines, split ? { yPercent: 105 } : { autoAlpha: 0, y: 18 });
  all.forEach(({ code, name, desc }) => {
    gsap.set(code, { autoAlpha: 0, scale: 0.9, clipPath: 'inset(0% 0% 100% 0%)', transformOrigin: '50% 50%' });
    gsap.set([name, desc], { autoAlpha: 0, y: 14 });
  });

  const play = () => {
    const vw = document.documentElement.clientWidth;
    // only columns currently on screen get the staggered reveal; the rest are made ready at once
    // (on desktop the "appear" scrub fades them in later as they arrive from the right; on mobile they're off-swipe)
    const onScreen = [], later = [];
    colEls.forEach((col, i) => (col.getBoundingClientRect().left < vw - 20 ? onScreen : later).push(all[i]));
    later.forEach(({ code, name, desc }) => gsap.set([code, name, desc], { clearProps: 'all' }));

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.to(eyebrow, { autoAlpha: 1, y: 0, duration: 0.7 }, 0)
      .to(lines, split ? { yPercent: 0, duration: 1.05, ease: 'expo.out', stagger: 0.09 } : { autoAlpha: 1, y: 0, duration: 0.9 }, 0.12);
    onScreen.forEach(({ code, name, desc }, i) => {
      const at = 0.45 + i * 0.11;
      tl.to(code, { autoAlpha: 1, scale: 1, clipPath: 'inset(0% 0% 0% 0%)', duration: 1.0, ease: 'expo.out' }, at)
        .to(name, { autoAlpha: 1, y: 0, duration: 0.7 }, at + 0.22)
        .to(desc, { autoAlpha: 1, y: 0, duration: 0.8 }, at + 0.3);
    });
    tl.eventCallback('onComplete', () => {
      if (split) split.revert();
      gsap.set([eyebrow, ...all.flatMap((p) => [p.code, p.name, p.desc])], { clearProps: 'all' });
    });
  };

  // created after the pin so its start is measured in the final layout; 'top 72%' is before the pin starts
  ScrollTrigger.create({ trigger: section, start: 'top 72%', once: true, onEnter: play });
})();
