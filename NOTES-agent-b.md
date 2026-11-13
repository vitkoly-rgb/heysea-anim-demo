# Agent B — notes (timeline · wave-steps · cta-orbits)

Wall clock: start 11:28, end 11:45 (2026-11-13), about 17 min in total for all three sections, including tests and these notes.
Stack: PHP arrays → loops + `htmlspecialchars`, vanilla JS (IIFE, guard if the section is absent), GSAP / ScrollTrigger, canvas 2D.
Test helpers I added: `test/tl-interact.mjs`, `test/cta-shot.mjs`, `test/reduced-check.mjs`.
Console: no errors, except a global `favicon.ico` 404 that comes from index.php and has nothing to do with these sections. I also checked the full page with Lenis on, all 9 sections loaded.

---

## 1. Timeline compass — `partials/03-timeline.php`, `assets/css/timeline.css`, `assets/js/timeline.js`
**Time:** about 8 min · **Iterations:** 4 (layout → roll easing / label fade fix → mobile font → tighter digit mask)

**What works**
- Layout follows the reference. On the left: heading, the text for the current year, a "17/18" counter, a thin progress bar and ‹ › buttons. On the right: a large ring with ticks. Its center sits behind the text column, and the ring fades out to the left so it reads as a partial arc. The pointer (dot + arrow) is at 3 o'clock, and the current year sits next to it at about 128px in a light weight.
- Changing year rotates the dial with a GSAP tween (power3.inOut). The duration grows with the distance, so a jump of 17 years gives a fast spin instead of a slow one. Neighbouring years are spread along the arc. Their opacity and scale fall off with angular distance, and the year under the pointer is hidden because the big number replaces it.
- The big year rolls **digit by digit** (2024→2025 only moves the last digit) inside a mask, with a slight stagger. The roll direction follows the navigation direction. Fast clicking is handled: any roll still in flight finishes immediately.
- The year text crossfades with a small y shift. All texts are in the DOM, stacked in one grid cell, so the layout never jumps and the content is SEO-friendly.
- Navigation:
  - ‹ › buttons, which loop at the ends.
  - Clicking a small year on the dial.
  - Keyboard: the dial is `role="slider"` (arrows, PageUp/Down, Home/End). ←/→ also work anywhere on the page while the section is on screen and nothing else has focus.
  - **Drag:** with a mouse, a true rotary drag around the center, with rubber-banding at the ends and snapping to the nearest year. On touch, a horizontal swipe while vertical scrolling stays native (`touch-action: pan-y`).
- **Auto-advance timer:** `data-autoplay` in ms (demo 8000; real 30–120 s). It fills the progress bar and then moves to the next year. The core is a reusable `HS.createAutoTimer({duration,onProgress,onComplete})` with **reason-based pause**. Pause reasons are: hover over the dial or copy column (hovering the whole section would freeze it forever), focus inside the section, section off-screen (IntersectionObserver), hidden tab, and drag. It runs on the GSAP ticker only while active.
- "Skip Timeline ›" jumps to `#timeline-after`, works with Lenis, and moves focus there.
- Reduced motion: no autoplay, and changes are instant.
- Mobile 375: the dial peeks in from the left edge above the text and still rotates and swipes.

**Not done / gaps vs production**
- There is no explicit play/pause button. WCAG 2.2.2 asks for one on auto-advancing content; pausing on hover/focus covers it only partly. About 0.5 h to add.
- The big year does not follow the drag live; it only updates on release.
- The 18 years cover 408° of ring (step 24°), so far-away years overlap off-screen. They are invisible, but if the designer wants the *whole* history visible on the arc, the step and arc have to be redesigned.
- Fonts are system or Inter Tight fallback, not the final ones. Dial geometry is tuned for 1440 and 375 only; 1024, 1920+ and short laptop heights need a pass.
- The text block takes the height of the longest text, so on mobile there is a gap under short texts. A design decision is needed: fixed height or animated height.

**Risks:** this is the designer's most important item, so expect several rounds of taste tuning (easing, ring weight, what the neighbouring years look like, timing). Long Chinese or English texts. Interplay with a site-wide Lenis or a sticky header.

**Estimate (AI writes + dev reviews/tunes with designer): 10–18 h**

---

## 2. Wave steps — `partials/07-wave-steps.php`, `assets/css/wave-steps.css`, `assets/js/wave-steps.js`
**Time:** about 4 min · **Iterations:** 3 (matchMedia bug → title break / edge fade → mobile fit)

**What works**
- Pinned section with scrubbed scroll (~60vh per stage, scrub 0.6). Heading: "Once the decision is made, / the journey continues."
- The JS generates the wave as a sine whose extremes land exactly on the nodes (alternating trough and crest), so nodes and the head dot always sit on the curve. It is horizontal on desktop and vertical on mobile, chosen by `gsap.matchMedia`, which rebuilds on breakpoint change.
- A dashed track sits underneath. A solid progress line draws via stroke-dashoffset, and a head dot with a halo travels along it via `getPointAtLength`. The line ends fade out with a CSS mask.
- Node states:
  - Done: filled, and the icon swaps to a check.
  - Current: filled, slightly scaled up, with a pulse ring.
  - Future: outline only.
- Desktop shows one caption at a time under the wave, with a crossfade. Mobile shows the text next to each node, and the active one is highlighted.
- A11y: screen readers get the real list (label + text per node). The crossfading caption is a decorative duplicate marked `aria-hidden`.
- Reduced motion: no pin, the whole journey is drawn, and all texts are visible under the nodes.

**Not done / gaps**
- No snapping to stages. ScrollTrigger snap is a single option, but it needs testing with Lenis.
- Icons are placeholder inline SVGs (production: sprite or ACF field). The 4 steps come from data and any number works, but labels on the crests could collide with long text if there are more than 5 steps.
- The mobile pinned height is tight at 375×812 with long texts. Smaller phones (667px tall) need either no pin or shorter copy.

**Risks:** pinning next to other pinned sections (refresh order). Total scroll length feeling too long or too short — a designer call.

**Estimate: 5–9 h**

---

## 3. CTA orbits — `partials/06-cta-orbits.php`, `assets/css/cta-orbits.css`, `assets/js/cta-orbits.js`
**Time:** about 4 min · **Iterations:** 4 (base → third dot visibility + calm zone → label edge flip → hide orphan labels)

**What works**
- Navy block: "Ready to create something *exceptional?*" with the last word in italic serif (Playfair via a Google Fonts `@import` in the section CSS; falls back to Georgia). That word gets a **scroll-scrubbed fill from grey to white**: a gradient with background-clip, driven by a CSS var tweened by ScrollTrigger. Below it: subtitle and a "Contact us →" link whose arrow nudges on hover and focus.
- Canvas background, continuous and not tied to scroll:
  - 3 large, faint, tilted ellipses, configured in the PHP array (center, radii, tilt, speed, start coordinates).
  - On each, a dot with a halo travels slowly, with a fading trail (32 segments, alpha falloff, constant pixel length).
  - Each dot has a label like `[39°54′N 116°23′E]`. It is computed live from the orbit angle as a pseudo satellite ground track (longitude drifts, latitude follows a sine), so the values change continuously.
  - Labels flip sides near the canvas edges, hide when their dot is off-canvas, and fade to 14% when they pass behind the CTA copy (the "calm zone").
- Performance: the rAF loop runs only while the section is in view (IntersectionObserver with a 100px margin); rAF also stops in hidden tabs. DPR is capped at 2, and the canvas resizes via ResizeObserver.
- Reduced motion: one static frame, and the text shows fully white.

**Not done / gaps**
- The coordinates are decorative, not real geography. They could follow real ports or show-locations if the designer wants a story.
- On mobile the ellipses use the same fractional config, so they become skinny. A separate mobile orbit config is a small tweak.
- The canvas label font is system monospace; it should match the brand mono font, which also needs a loading check before drawing.

**Risks:** low. Main question: does the designer want the trail as a smooth gradient tail (as built) or as dashes.

**Estimate: 4–7 h**

---

## Best screenshots
- Timeline: `shots/timeline-1440-0.png` (initial), `shots/timeline-1440-next-mid.png` (dial rotating + digit roll mid-flight), `shots/timeline-1440-drag.png` (drag), `shots/timeline-1440-timer-half.png` (progress bar), `shots/timeline-375-next-end.png` (mobile)
- Wave: `shots/wave-steps-1440-0_5.png` (mid-journey, head between nodes), `shots/wave-steps-1440-1.png` (complete), `shots/wave-steps-375-0_5.png` (mobile vertical), `shots/wave-steps-1440-reduced.png`
- CTA: `shots/cta-orbits-1440-fill50.png` (text fill half-way), `shots/cta-orbits-1440-t4.png` (orbits + labels), `shots/cta-orbits-375-t4.png` (mobile)

**Total production estimate for the 3 sections: 19–34 h**

---

## Round 2 (user fix requests + motion QA)
Wall clock: 12:27 → 12:38, about 11 min. New tool: `test/motion.mjs <slug> [WxH] [--mobile]`. It drives the effect in real Chrome (playwright-core, `channel:'chrome'`) and does two things:
- Measures rAF frame times over the whole scenario.
- Captures real compositor frames with a CDP screencast (playwright's recordVideo needs a separate ffmpeg download, so I didn't use it). It picks frames evenly across each animated segment and tiles them into a contact sheet with ffmpeg.

**1. Timeline: shared-element (FLIP) year transition.** This replaces the in-place digit roll.
- Two flyer clones (`.tl-fly`) are interpolated every frame between the big slot and the *live* ring position of their label. The ring position is recomputed from the current dial rotation, so the flyers follow the rotating ring.
  - New year: flies from its ring label into the big slot. It scales up and its colour goes from muted to ink.
  - Old year: flies from the big slot back to its place on the ring. It scales down and goes back to muted.
- The flight shares the duration and ease of the rotation tween. The real big number and both ring labels are hidden for the duration, so the hand-off is seamless. Input during a flight settles the current flight first.
- Works for ‹ ›, year click, keyboard, drag snap and autoplay; all are routed through `goTo`, and the regression test covers each. Reduced motion is instant.
- QA fixes made after reading the sheets:
  - power3 → power2.inOut, because the first ~150 ms looked dead.
  - The text crossfade is now sequential (out, then in). Before, the two paragraphs overlapped in a garbled frame.
  - The ring labels are now hidden in the same frame the flyers appear. Before, one frame showed the text doubled.

**2. CTA:**
- The block is now `min-height:100vh/100svh` with the content centered, a bigger title (up to 64px) and 16px body text. The orbits are fractions of the block, so they scale with it.
- Text fill now starts when the section top reaches 55% of the viewport and ends when the title is at the viewport center (`trigger: sec, start 'top 55%', endTrigger: em, end 'center center'`).
- QA fixes: on portrait screens the orbits are stretched in x and squashed in y. Before, they turned into vertical needles at 375×812. A dot passing behind the copy is also dimmed to 30%.

**3. Wave steps:**
- `.ws-head-dot` and `.ws-head-glow` are removed from the markup, CSS and JS.
- Node activation now compares the drawn stroke length `L` (the same value that drives `strokeDashoffset`) with each node's precomputed length along the path. A node becomes current exactly when the stroke reaches its center.
- QA fix: the caption crossfade is now sequential, because the old and new captions overlapped.

**Frame times** (rAF deltas measured in page during the scenario; headless Chrome on this Mac, 60 Hz):

| Scenario | Frames | Avg FPS | Frames > 32 ms | Worst |
|---|---|---|---|---|
| timeline 1440 (next, prev, year click) | 321 | 60 | 0 | 16.8 ms |
| timeline 375 mobile | 322 | 60 | 0 | 16.8 ms |
| wave-steps 1440 (full pinned scrub over 4 s) | 288 | 60 | 0 | 16.8 ms |
| wave-steps 375 mobile | 287 | 60 | 0 | 16.8 ms |
| cta-orbits 1440 (scroll in + 2.5 s orbits) | 359 | 60 | 0 | 16.8 ms |
| cta-orbits 375 mobile | 360 | 60 | 0 | 16.8 ms |

This is a fast desktop machine. Mid-range Android still needs a real-device check, mainly for the canvas and the per-frame label updates.

**Contact sheets** (in `shots/`):
- `timeline-1440-motion-next.jpg`, `timeline-1440-motion-prev.jpg`, `timeline-1440-motion-yearclick.jpg`, `timeline-375-motion-next.jpg`
- `wave-steps-1440-motion-scroll.jpg`, `wave-steps-375-motion-scroll.jpg`
- `cta-orbits-1440-motion-scrollorbits.jpg`, `cta-orbits-375-motion-scrollorbits.jpg`

**Estimates after Round 2:** timeline 12–20 h (the FLIP adds tuning surface), wave 5–9 h, CTA 4–7 h. Total 21–36 h.

---

## Round 3
Wall clock: 13:24 → 13:43, about 19 min. A lot of that was waiting on motion and test runs.

**1. CTA orbits: dots 10× slower.**
- Angular speeds are divided by 10 in the PHP config (0.007 / −0.0055 / −0.0045 rad/s).
- The trail is shortened (230 → 140 px) with a gentler alpha falloff, so it still reads as a short comet tail instead of a long static streak.
- Coordinates still update smoothly; longitude moves about 18′ per second.
- At this speed the dots are effectively parked for a whole visit, so their starting phases matter. I chose them with a small script so all 3 dots start visible and away from the copy: top-left, bottom-left and bottom-right at 1440.

**2. Wave steps: node activated late. Root cause found and fixed.**
- **Cause:** `.ws-progress` had `vector-effect: non-scaling-stroke`. With that, Chrome applies `stroke-dasharray` / `stroke-dashoffset` in **screen px**, but every length we compare (`getTotalLength()`, node lengths) is in **viewBox units**. So the visible line ran ahead of the logical length by the viewBox scale: 1200/1100 ≈ 9% at 1440 and 120/96 = 25% at 375. That is why the line was already past a node before the node activated, and why the error grew towards the end of the wave.
- **Proof:** a frame captured at L = nodeLen − 19 showed the line already about 30 px past the Delivery node.
- **Fix:** I removed `vector-effect` from the progress path and now set its stroke width in user units from JS (`1.75 × viewBox / rendered width`, kept up to date by a ResizeObserver). The dashed track keeps non-scaling stroke, which is fine because nothing is measured on it.
- **Verified** with a new test, `test/ws-crossing.mjs`. It scrolls to the exact crossing moments, logs `progressLen` vs `nodeLen` and saves crops:
  - 1440, node 1: L 462 → not active; L 485 vs nodeLen 481 → `is-current`.
  - 1440, node 2: L 782 → not active; L 805 vs nodeLen 801 → `is-current`.
  - 375 shows the same, and the crops show the line reaching the node center exactly at activation.
  - Comparison crops: `shots/ws-cross-1440-after.png`, `shots/ws-cross-375-after.png`.

**3. Timeline: years also switch by vertical scroll (pinned).**
- The section pins (ScrollTrigger). Each year gets 50vh of scroll: 8.5 viewport heights for 18 years, on mobile too. Scrolling scrubs the year index (`round(progress × 17)`). Each index change runs the existing FLIP + dial rotation, and scrolling up goes back.
- **Sync model (one source of truth):** while pinned, the scroll position *is* the year.
  - Every other control (timer, ‹ ›, year click, drag snap, keys) calls `goTo()`. That then moves the scroll position to that year's slot **instantly** (`lenis.scrollTo(y,{immediate})` or `scrollTo`). The jump can't be seen because the section is pinned.
  - So scrolling always continues from the year you are looking at, and the timer keeps advancing the scroll position too.
  - A `syncing` flag stops this programmatic scroll from feeding back into the scrub.
  - Outside the pinned range, the controls work without touching scroll.
- Measured in `test/motion.mjs timeline-scroll`: scrolling 3 years → 2011 at the expected y. Clicking › → 2012, and y moved exactly one slot. Scrolling back 2 → 2010. Autoplay → 2011, and y followed. Identical at 375.
- "Skip Timeline" now **jumps** (immediate, with or without Lenis) to `#timeline-after`, past the pin end. A smooth scroll would have scrubbed through every year on the way.
- The start year is now 2008, so the server-rendered state matches the top of the pin and nothing flashes on load.
- The mobile stage is resized to fit one screen (100svh), and the Skip link moved to the top-right on mobile.
- Reduced motion: no pin; controls only. Checked with `test/reduced-check.mjs`.
- Not done: no ScrollTrigger snap to the year slots. Each year still settles through its own transition, so it isn't needed; a snap would need tuning against Lenis.

**Styling** (from the Figma frame "Intro · Our yachts", `_ref/our-yachts-figma.png`), applied to all 3 sections:
- Background #F7F9FB on the timeline and wave steps (the CTA stays navy, as in the CTA reference).
- Navy ink.
- Headings are sans with an *italic serif accent*: timeline "…to *international boat shows*", wave "…is *made,* / the journey *continues.*" (muted).
- Grey uppercase eyebrows: "Our story", "Ownership", "Get in touch".
- Playfair Display italic is loaded in each section's CSS.

**Frame times** (rAF deltas in page, headless Chrome on this Mac at 60 Hz, motion.mjs):

| Scenario | Frames | Avg FPS | Frames > 32 ms | Worst |
|---|---|---|---|---|
| timeline-scroll 1440 (scroll 3 yrs, click, scroll back, autoplay, skip) | 978 | 59.9 | 1 | 33.4 ms (at measure start) |
| timeline-scroll 375 (3 runs) | 979–980 | 59.9 | 1 | 33.3–33.4 ms (at measure start) |
| timeline 1440 (FLIP next/prev/click) | 322 | 60 | 0 (1 × 33 ms at start) | 33 ms |
| wave-steps 1440 / 375 | 287 / 287 | 60 / 60 | 0 / 0 | 16.8 ms |
| cta-orbits 1440 / 375 | 360 / 359 | 60 / 60 | 0 / 0 | 16.8 ms |

Single runs sometimes showed 1–4 spikes of 67–133 ms (one timeline-scroll run even showed 23). Repeat runs came back clean (≤ 1 frame of 33 ms, at measurement start). I put the spikes down to load from the other agents' Chrome sessions running in parallel on the same machine, not to our code. This is a fast desktop; mid-range Android still needs a real-device check.

**Contact sheets:**
- `shots/timeline-scroll-1440-motion-scroll3.jpg`, `shots/timeline-scroll-1440-motion-scrollback.jpg`, `shots/timeline-scroll-375-motion-scroll3.jpg`
- `shots/wave-steps-1440-motion-scroll.jpg`, `shots/wave-steps-375-motion-scroll.jpg`
- `shots/cta-orbits-1440-motion-scrollorbits.jpg`, `shots/cta-orbits-375-motion-scrollorbits.jpg`
- `shots/timeline-1440-motion-prev.jpg` (FLIP)

**Estimates after Round 3:** timeline 14–24 h (pin + scroll sync + Lenis edge cases add tuning), wave 5–9 h, CTA 4–7 h. Total 23–40 h.
