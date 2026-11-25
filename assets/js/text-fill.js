/**
 * Shared text-fill helper (site-wide rule from the designer):
 * the whole heading starts uniformly muted (every letter at the same low opacity), and on scroll the letters
 * gain opacity to 100% one by one from the first to the last. No gradient wipe inside letters.
 *
 * Usage
 *   HS.textFill(el)                                   // own scrubbed ScrollTrigger (enter → middle of viewport)
 *   HS.textFill(el, { scrollTrigger: { start: 'top 80%', end: 'top 30%' } })   // override ScrollTrigger opts
 *   HS.textFill(el, { timeline: tl, at: 0, duration: 0.8 })  // embed into an existing (pinned) timeline
 *   options: from = start opacity (0.25)
 * Returns { split, chars, tween }.
 * Needs gsap + SplitText at call time (this file itself can load before them). Respects HS.reduced.
 * Markup: any element; class "tf" is added (see text-fill.css). Nested inline spans (italics) are preserved.
 */
(() => {
  window.HS = window.HS || {};
  if (HS.textFill) return; // may be included by several partials

  HS.textFill = function textFill(el, opts = {}) {
    if (!el || !window.gsap || !window.SplitText) return null;
    const { timeline = null, at = 0, duration = 1, from = 0.25, scrollTrigger = {} } = opts;
    el.classList.add('tf');
    // words wrapper keeps words unbreakable; chars get the opacity
    const split = SplitText.create(el, { type: 'words,chars', wordsClass: 'tf__w', charsClass: 'tf__c' });
    const chars = split.chars;
    const reduced = HS.reduced ?? matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) { gsap.set(chars, { opacity: 1 }); return { split, chars, tween: null }; }

    gsap.set(chars, { opacity: from });
    // each letter fades over ~3 letters' worth of scroll; the stagger is computed so the whole fill takes `duration`
    const n = chars.length;
    const each = Math.min(duration, (duration / n) * 3);
    const vars = { opacity: 1, ease: 'none', duration: each, stagger: n > 1 ? (duration - each) / (n - 1) : 0 };

    let tween;
    if (timeline) {
      tween = timeline.to(chars, vars, at);
    } else {
      tween = gsap.to(chars, {
        ...vars,
        scrollTrigger: { trigger: el, start: 'top 85%', end: 'top 40%', scrub: true, ...scrollTrigger },
      });
    }
    return { split, chars, tween };
  };
})();
