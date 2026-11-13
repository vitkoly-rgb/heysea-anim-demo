# Agent A — notes (series-cursor, before-after, qr)

Wall clock: 11:28 → 11:42 (about 14 min for all three, notes included).
Test helpers I added: `test/agent-a-cursor.mjs` (mouse moves and water cursor crops), `test/agent-a-ba.mjs` (drag, keyboard, tabs), `test/agent-a-reduced.mjs` (reduced motion, plus the full page with all sections for errors).
The only console error is a 404. It is not from these sections (most likely `/favicon.ico`): no 404 shows up in the page's network responses.

---

## 01 · series-cursor — pinned series slider + "ONBOARD" water cursor
Files: `partials/01-series-cursor.php`, `assets/css/series-cursor.css`, `assets/js/series-cursor.js`
Iterations: 4 (first build, then water coefficients, then smoother waves with a back-wave layer, then a mobile check). About 6 min.

**Implemented**
- Data is the `$sc_series` array (title, text, video, poster, link), which maps onto an ACF repeater.
- The section pins for (n-1)×110vh of scroll, scrubbed. The next panel slides up (`yPercent 100→0`) while its media counter-moves (`-60→0`, a curtain/parallax effect). The covered panel zooms in slightly (1.12), drifts up and darkens (shade at 0.65 opacity), and its copy fades out upward. The incoming title rises out of SplitText line masks (`mask:'lines'`), then the count, text and CTA follow.
- Videos are muted, looping and `playsinline`. They play only while the section intersects the viewport and pause otherwise. Under reduced motion they do not autoplay.
- Water cursor:
  - Drawing: a 64px canvas (DPR-aware) with a white ring and an "ONBOARD" label.
  - Physics: 22 spring columns with stiffness, damping and neighbour spreading, 3 substeps.
  - Input forcing:
    - cursor velocity and acceleration tilt the surface (inertia: water piles up on the side opposite the movement);
    - vertical acceleration makes the middle heave;
    - speed adds gaussian ripples.
  - Look: a translucent mirrored back wave gives depth, as in the design.
  - Settling: it settles flat, and the rAF loop sleeps after about 10 idle frames and wakes on pointermove or scroll.
  - Movement: the cursor follows the mouse with a frame-rate-independent lerp.
  - Visibility: it hides outside the stage, over links (the real cursor shows there), and when the section is off-screen. The element moves to `<body>` so `position:fixed` is not broken by the pin.
- Touch / coarse pointer: no custom cursor. A static badge (circle + water + ONBOARD) is shown instead.
- Click logs `[series-cursor] onboard → <title>`. Each panel also has a real focusable "Onboard →" link for keyboard users.
- Reduced motion: no pin. The panels stack as plain 100vh blocks, the posters stay static and the water has no physics.

**Not done / gaps vs production**
- No snap to panels. Feadship-style "one gesture = one slide" would need `snap: 'labels'` or an Observer-driven scroll-jack, and the designer has to choose which. This is about 1–2 h more.
- No real video handling: there are no HLS/adaptive sources, no mobile-specific low-bitrate files, and all 3 videos play while the section is visible. Production should play only the active panel (activeIndex is already tracked).
- The cursor does not change state over the CTA or on press (no scale/fill animation), and there is no "drag" or "play" variant.
- The water coefficients are tuned by eye. The designer will want to tune amplitude and damping, so they should become exposed constants or a small debug panel.

**Risks**
- iOS Safari: `100svh` is used, but pin plus address-bar resize can jump, so `ScrollTrigger.normalizeScroll` or `ignoreMobileResize` may be needed. Video autoplay needs muted+playsinline (done). Low Power Mode blocks autoplay, so the poster shows.
- Performance: 3 full-screen videos plus transforms are fine on desktop. On low-end Android, decode cost is the risk, so use 720p or lighter encodes. The cursor canvas is tiny (about 0.1 ms per frame).
- Lenis + pin: tested with Lenis on (full page) and off (shots).

**Estimate (AI writes, dev reviews/tunes with designer): 6–10 h**
That covers the real media pipeline and the snap decision, plus tuning sessions for the cursor feel, iOS testing, and the ACF block.

---

## 02 · before-after — Sketch ↔ Layout deck plans
Files: `partials/02-before-after.php`, `assets/css/before-after.css`, `assets/js/before-after.js`
Iterations: 3 (first build, then tighter viewBox / labels on dark fills / mobile label size, then an interaction test). About 4 min.

**Implemented**
- Answer to the designer's question: yes, the shapes can match exactly. One geometry array per deck (`$ba_decks[*]['shapes']`: rect/ellipse/path plus a "kind") is rendered twice by the same PHP function:
  - **Sketch**: paper background, pencil strokes through `feTurbulence` + `feDisplacementMap`, a second ghost pass with another seed for a double-line pencil look, hatching on wood and technical areas, italic serif labels, and dashed construction lines that exist only on the sketch.
  - **Layout**: coloured fills (teak, upholstery, water, technical, etc.), a navy hull and uppercase labels.
- The layout layer sits on top with `clip-path: inset(0 0 0 var(--pos))`, so the divider reveals the same coordinates. The only offset is a ±1.5px pencil wobble, which is intentional and can be set to 0.
- Divider:
  - pointer drag (mouse, touch, pen; `touch-action: pan-y`, so vertical page scroll still works on phones);
  - click to jump;
  - keyboard: ←/→/↑/↓ (2%), Shift (10%), PgUp/PgDn, Home/End;
  - `role=slider` with `aria-valuenow` and `aria-valuetext`;
  - the chips fade near the edges.
- Tabs follow the ARIA tablist pattern with roving tabindex and ←/→/Home/End. Switching crossfades the decks (0.55 s) and the divider eases back to 50%.
- First time in view, the divider sweeps from 20% to 50% as a hint (ScrollTrigger `once`).
- At ≤640px the plans rotate to portrait with the bow up: the JS swaps the viewBox, rotates the group and counter-rotates the labels.
- Reduced motion: divider at 50% with no sweep and instant tab switches.

**Not done / gaps vs production**
- The plans are hand-written demo geometry. In production the real GA drawings must be delivered as **one SVG source** (or two exports from the same Figma frame at the same size). Then alignment is guaranteed. Two separately drawn images are the main risk to the "must match" requirement.
- No zoom/pan on the plan, no room hover tooltips, no legend.

**Risks**
- `feDisplacementMap` filters are CPU-heavy in Safari on large SVGs. Fine here (4 small plans, only 1 visible). For complex real plans, pre-render the sketch to PNG/WebP or bake the wobble into the path data.
- `clip-path` with a CSS variable works in all evergreen browsers; `-webkit-` is included for older Safari.

**Estimate: 5–9 h**
That covers producing and cleaning the real SVG plans from the architect's files, which is the biggest unknown, plus an ACF repeater per deck, QA on iOS drag, and design tuning.

---

## 09 · qr — "Scan to follow" cards with horizontal scroll
Files: `partials/09-qr.php`, `assets/css/qr.css`, `assets/js/qr.js`
Iterations: 3 (first build, then a left heading column with the row fading under it via a mask, then reduced-motion and text alignment). About 3 min.

**Implemented**
- Data is `$qr_block` + `$qr_cards` (6 platforms: name, handle, text, url). The QR codes are deterministic pseudo-QR SVGs (finder and timing patterns, seeded data, platform initial in the centre). In production these become an image field.
- Desktop (≥768px, motion allowed):
  - the section pins with the heading as a fixed left column;
  - vertical scroll translates the card row right → left (scrub 0.8), with a progress bar under the heading;
  - cards fade out under the heading through a gradient mask and are staggered vertically like the design;
  - each card fades and scales in as it enters (`containerAnimation`);
  - keyboard focus on a card scrolls the page to the matching position.
- Mobile (<768px): no pin. A native horizontal swipe row with `scroll-snap-type: x mandatory`. This is also the no-JS fallback.
- Reduced motion on desktop: a static 3×2 grid.
- `gsap.matchMedia` reverts the pin and classes when crossing the breakpoint.

**Not done / gaps vs production**
- No real QR images, and no "tap to open the app" deep links on mobile (WeChat and Xiaohongshu have no web deep link, so the QR stays the main path).
- Each card's `href` is a placeholder.

**Risks**
- The pin distance depends on content width. With fewer than about 4 cards on a wide screen there is almost no horizontal travel; this is handled with a minimum of 0.6vh scroll, but the design should define that case.
- `mask-image` is fine in modern Safari (the `-webkit-` prefix is included).

**Estimate: 2.5–4 h**

---

## Summary of estimates (production, AI + dev review/tuning)
| Section | min–max h |
|---|---|
| 01 series slider + water cursor | 6–10 |
| 02 before/after deck plans | 5–9 (plus plan asset prep on the architect/designer side) |
| 09 QR horizontal scroll | 2.5–4 |
| **Total** | **13.5–23** |

## Best screenshots
- `shots/series-cursor-1440-0_25.png` (mid-transition, panel sliding over), `shots/series-cursor-1440-1.png` (final title), `shots/series-cursor-water-rest.png`, `shots/series-cursor-water-slosh.png`, `shots/series-cursor-water-slosh2.png`, `shots/series-cursor-water-settled.png`, `shots/series-cursor-375-0.png` (touch badge)
- `shots/before-after-drag78.png`, `shots/before-after-main.png`, `shots/before-after-lower.png`, `shots/before-after-375-0_5.png` (portrait plan)
- `shots/qr-1440-0.png`, `shots/qr-1440-0_5.png`, `shots/qr-1440-1.png`, `shots/qr-375-0.png`, `shots/qr-reduced.png`

---

## Round 2 (designer/client fixes): 12:27 → 12:35, about 8 min, 3 iterations

### series-cursor: water at rest and sensitivity
- **Resting state is solid water only.** The translucent back wave's opacity and vertical offset now scale with the current wave amplitude (`mix = min(1, amp/4)`). It shows only while the water moves and merges back as it settles. When the loop goes idle, any residual motion is snapped to exactly 0 and one final frame is drawn, so no faint band is left behind.
- The static touch badge SVG now has a flat water line too (it was slightly wavy).
- **More sensitive, still clamped:**
  - Horizontal drag now follows a square-root curve (`95·√|vx|`) instead of a linear one, so slow and small movements already tilt the water visibly. The acceleration term is doubled and the vertical heave is doubled.
  - Ripples start at 12 px/s instead of 60, and their strength also follows a square-root curve (`30·√speed`, capped).
  - A new velocity clamp (`MAX_V = 700`) sits alongside the existing height clamp, so there are no explosions. Damping is unchanged, so it still settles in about 1.5 s.
- **Found during motion QA:** the white ring disappeared over bright parts of the footage. Added a soft `drop-shadow` on the cursor canvas. It cost nothing measurable (60 fps unchanged).

### qr: heading on top, two rows, right → left
- The heading block is a full-width container again (title left, text right) with the progress bar under it. `.qr__viewport` sits below it; the left-column and mask layout is removed.
- Cards are compact (QR on the left, text on the right) and placed in a CSS grid with **2 rows** (`grid-auto-flow: column`). The second row is offset by half a card for the staggered look.
- **Pinned and scrubbed:** the track starts with the first column peeking in at 72% of the viewport width and travels left. It ends aligned to the container's left edge, or its right edge if the row is wider than the container. Pin length is 1.2× the travel. Cards still fade and scale in as they enter (`containerAnimation`).
- Mobile: native swipe with 2 rows (both fit at 375px) and scroll-snap. Reduced motion on desktop: a 3×2 grid.

### Motion QA in headed Chrome (`node test/agent-a-motion.mjs all`)
Playwright's `recordVideo` needs its own ffmpeg download, so I used dense screenshots taken during the interaction instead, tiled into contact sheets with ffmpeg.

| Effect | How it was measured | avg FPS | frames >32 ms | max frame |
|---|---|---|---|---|
| QR pinned horizontal scroll, Lenis on, 1440×900 | 70 wheel steps through the pin | 59.9–60 (3 runs) | 0–1 | 17.8–33.6 ms (one earlier run had a single 233 ms hitch that did not reproduce in 3 reruns) |
| Water cursor, continuous circular mouse motion for 3 s | rAF deltas | 60.1 | 0 | 17.8 ms |
| Water cursor with screenshot capture in between | rAF deltas | 46–53 | many, max 50 ms | caused by the screenshots stalling rendering, not by the effect |

- `shots/motion-qr-sheet.jpg`: 16 frames taken mid-scroll. The motion is monotonic right → left, with no jumps or flicker. The cards fade in at the right edge, the progress bar fills, and the pin releases cleanly into the next section.
- `shots/motion-cursor-sheet.jpg`, in order:
  - rest: flat, no translucent band;
  - small move of about 60 px: visible tilt and ripple;
  - settling;
  - fast swipe: large slosh, clamped;
  - settling back to perfectly flat.

Estimates are unchanged. The water physics constants should still be exposed for tuning sessions with the designer.

---

## Round 3 (QR rebuilt to match Figma 970:59416): 13:24 → 13:27 by the system clock, about 3–4 min, 3 iterations
- **Rebuilt from the Figma initial frame** (`_ref/qr-figma-initial.png`). The progress bar, the right-side paragraph, the cards, borders and QR logos are all removed.
- **Header (top-left):** eyebrow "FOLLOW HEYSEA" (12px uppercase) and the title at about 30px, regular weight, wrapping after "official" as in the mockup.
- **Columns:** a row of 8 columns (Instagram, YouTube, LinkedIn, WeChat, Facebook, Weibo, Douyin, Xiaohongshu).
  - Plain black 150px QR with the channel name in small uppercase type under it. Column pitch is 250px.
  - Each column is a fixed-height flex box (350px) with its two blocks pushed to the top and bottom. Odd columns have QR + label on top and the description at the bottom; even columns are mirrored (`order:-1` on the description). The description always stays in its own column.
  - The per-channel `dy` in the data reproduces the mockup's irregular rhythm (LinkedIn +16, WeChat −34, Facebook −36, …).
- **Initial frame = Figma:** the row starts at the container edge, and 5 columns are visible at 1440 with the 6th peeking in. Side-by-side comparison: `shots/qr-vs-figma.png` (Figma on the left, scaled to 1440; demo at progress 0 on the right).
  - Remaining difference: the mockup shows no lower description for Instagram and LinkedIn. I added them because each QR should have its text opposite it. If the designer wants them empty, leave `text` blank in the data.
- **Scroll:** the section pins, then vertical scroll moves the row right → left (scrub 0.8, pin length 1.4× the travel) until Xiaohongshu reaches the right container edge, then releases. Keyboard focus on a QR link scrolls to make its column visible.
- **Other modes:**
  - mobile: the same columns with native swipe and scroll-snap, no pin;
  - reduced motion: static wrap;
  - no JS: native swipe.
- **Motion QA in headed Chrome** (`node test/agent-a-motion.mjs qr`, Lenis on, 1440×900, 70 wheel steps):
  - frame times, 2 runs: **avg 60 fps, 0 frames >32 ms, max 17.8–18.2 ms**;
  - contact sheet `shots/motion-qr-sheet.jpg` (16 frames mid-scroll): monotonic right → left travel, no jumps or flicker, clean pin and release.
- Estimate is unchanged: 2.5–4 h.

---

## Round 4: our-yachts ("Our Yachts — Distinctive by design."), 13:32 → 13:39, about 7 min, 4 iterations
Files: `partials/00-our-yachts.php` (slug `our-yachts`, first on the page), `assets/css/our-yachts.css`, `assets/js/our-yachts.js`. This ports `#yachts` from `../hero-scroll/`, rebuilt to match Figma 2065:21717.

**Implemented**
- **Layout matches Figma** (`shots/our-yachts-vs-figma.png`: Figma on the left, demo at progress 0, 1440×800, on the right).
  - Eyebrow "OUR YACHTS" in grey uppercase; 2-line title mixing italic serif with sans ("*Distinctive* by design." / "Crafted *with purpose.*").
  - The 8 photos sit at the exact Figma rects with Figma's wash/opacity.
  - Photo mapping from the 16 raw fills:

    | Slot (x,y) | Photo | Raw file |
    |---|---|---|
    | 416,157 | aerial | raw-4 |
    | 853,458 | teak deck | raw-1 |
    | 895,189 | cliffs | raw-7 |
    | 1122,246 | cabin | raw-5 |
    | 251,446 | bright sea | raw-2 |
    | 548,530 | bathroom | raw-15 |
    | 185,260 | stairs | raw-9 |
    | 1197,512 | yacht | raw-16 |

    The duplicates (raw-3/6/8/10/11/12/13/14) feed the stream.
- **Fly-through:** the section pins for 250% (scrub 0.6) and is a real perspective projection around the stage centre.
  - Each photo has a depth Z; Figma slots get Z = 151/w, so smaller means farther. The camera moves forward by 3 depth units over the pin.
  - Scale and distance from centre both grow as 1/Z, so photos grow and fly outward.
  - Far photos fade in from the haze; near photos dissolve before the "camera" (Z 0.62 → 0.3).
  - 10 extra "stream" photos emerge from the vanishing point. They are hidden at t = 0 so the first frame equals Figma.
  - Photo positions are chosen so they cross the text area quickly (the designer's "not too long under the text").
- **Title fill:** the italic tail "with purpose." fills grey → navy char by char between about 8% and 55% of the pin (SplitText chars).
- **"Negative" text:** `mix-blend-mode: difference`, with each colour written as background − wanted colour (`--oy-ink`, `--oy-grey`, `--oy-eyebrow`). It reads exactly navy/grey on #F7F9FB and inverts over photos.
- **Mobile 375:** a larger scale, 7 of 18 photos, and vertical spread across the tall stage.
- **Reduced motion:** no pin; the static Figma composition with the title fully navy (the grey tail is too low-contrast for a static state).

**Motion QA in headed Chrome** (`node test/agent-a-motion.mjs oy`, Lenis on, 1440×800, 80 wheel steps):
- frame times, 2 runs: **avg 59.9 fps, 1 frame >32 ms (33.3 ms, the first frame after start), max 33.3 ms**;
- `shots/motion-our-yachts-sheet.jpg`, 16 frames mid-scroll:
  - photos grow and fly outward continuously and new ones emerge from the centre, with no pops at t = 0;
  - the fill progresses char by char;
  - the pin releases cleanly.

**Gaps / risks**
- No blur by depth. A CSS `filter: blur` on 18 moving images costs too much per frame, so haze uses opacity only. For production a pre-blurred variant per photo could be cross-faded if the designer insists.
- Difference blend: over mid-tone photos the title turns orange or other complementary colours. It is legible, but it is the "negative" look; the designer must accept or reject it. The alternative is a clean white text-shadow, or photos avoiding the text box entirely.
- The raw images are 512–1400px. Production needs srcset/AVIF; 18 images per section means real lazy-load planning.
- iOS: pin + `svh`; same notes as section 01.

**Estimate: 5–8 h** (data model for ACF galleries plus tuning the depth/stream composition with the designer, which is the main time sink, plus image pipeline and iOS QA).
