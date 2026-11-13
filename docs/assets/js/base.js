/* Спільне: реєстрація плагінів GSAP, Lenis (вимикається ?lenis=0), прапорець reduced-motion. */
gsap.registerPlugin(ScrollTrigger, SplitText, MotionPathPlugin, Observer);
window.HS = window.HS || {};
HS.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!HS.reduced && !/lenis=0/.test(location.search) && window.Lenis) {
  const lenis = new Lenis({ lerp: 0.1 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  HS.lenis = lenis;
}
