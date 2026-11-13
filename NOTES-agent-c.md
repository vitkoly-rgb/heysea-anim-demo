# Agent C: Globe / Book / Map

Wall-clock: **11:28 → 11:43** (about 15 min in total, including checks and these notes).
Files: `partials/04-globe.php`, `05-book.php`, `08-map.php`, `assets/css|js/{globe,book,map}.*`, `test/map-agent-c.mjs`.
Checked: 1440×900 and 375×812 (mobile emulation), `prefers-reduced-motion: reduce`, and a full-page run of all sections together (no console errors from our code; the only error is a 404 for `/favicon.ico`).

Shared code: `HS.loadTopo(url)` caches the topojson fetch promise in `HS._topo`. Globe and map each define it with `||=` semantics, so whichever loads first creates it.

---

## 1. Globe (`?only=globe`): live, no video

**Implemented**
- A d3-geo `geoOrthographic` globe drawn on `<canvas>`: land-110m in light grey, a faint graticule, a radial "studio light" gradient, darker shading towards the edge and a thin rim.
- A pinned scroll timeline (+320%, scrub). It runs in this order:
  1. The title is visible.
  2. The globe rises from the bottom while the title goes to `blur(10px)` and fades.
  3. `projection.rotate` follows the scroll, turning from the Americas to Asia.
  4. Five office markers appear: HTML labels with a pulsing dot, positioned with `projection()`. They hide on the back of the sphere when `d3.geoDistance(point, center) > π/2 − 0.15`, so Boca Raton visibly goes behind the globe.
  5. The markers fade out.
  6. The globe shrinks and moves up (CSS transform).
  7. The stats 15+ / 30+ / 4 count up (scrubbed).
- Performance:
  - The canvas is redrawn only when the angle changes (key `lambda|phi`, merged into one `requestAnimationFrame`).
  - Pixel density is capped at 2.
  - Movement and scale are pure `transform` on the compositor.
  - Resizing recalculates only when the **width** changes, because iOS changes the height on scroll as the address bar shows and hides.
- Labels are kept inside the screen (`--dx`), which matters on mobile.
- Hong Kong and Guangdong sit very close together, so their labels are placed above and below the point (the `side` field).
- Reduced motion: no pin. A static frame shows the globe with offices and the stats underneath.
- Accessibility: the canvas and markers are `aria-hidden`, and a visually hidden list of the offices is provided.

**Not done (gaps vs. production)**
- No fine-tuned easing curves or timing with the designer.
- Land is 110m, which looks rough when zoomed in. For a large hero, 50m data (about 800 KB, or simplified to about 200 KB) or a prepared texture would be better.
- No night/specular effects. No bake into a sprite for weak devices.
- Labels are not clickable. No collision avoidance for an arbitrary number of offices; this demo uses a manual `side`.

**Risks**
- iOS Safari: pin + canvas + `filter: blur` on large text costs some performance. If it stutters, replace blur with opacity or a pre-blurred copy of the title.
- Weak Android phones: redrawing the 110m globe on canvas takes about 1–2 ms per frame, which is fine. With 50m data, measure first.
- China: the d3 and topojson files are local, so nothing comes from a CDN. **Do not** use Google/Mapbox tiles. The point positions need checking (WGS-84 vs. GCJ-02 does not matter at this scale).

**Alternative (what the designer suggested): video or image sequence**
- Render the globe in Blender/AE as an image sequence of about 120 frames (WebP/AVIF, roughly 2–4 MB) or as an MP4 with scrub by `currentTime`.
- Draw the labels in the same JS, from the same projection parameters: the frame number gives the angle, and `d3.geoOrthographic().rotate()` gives the position. The points stay sharp and translatable.
- Pros: any 3D look (relief, glass, light).
- Cons:
  - Weight.
  - The camera has to match the render exactly.
  - Scrubbing MP4 on iOS is jerky; an image sequence on canvas is better.
  - Every change to an office means re-rendering, or at least re-checking the camera.
- **Recommendation:** live d3 is enough for a minimalist grey globe.

**Time:** about 5 min, 3 iterations on desktop + 2 on mobile.
**Production estimate (AI agent + developer/designer):** **6–10 h**. This covers fine-tuning the timing, 50m data and a quality pass, the responsive version, iOS testing and the transition into the next block.

---

## 2. Book (`?only=book`): pure CSS 3D, no video

**Implemented**
- A real 3D object:
  - The back cover sits at `translateZ(-t)`.
  - The spine and the page-block edges (top and side) are separate faces, with the page edges striped to look like paper. They are visible while the book is at an angle.
  - The cover has a photo and "Asteria".
  - Two leaves have `backface-visibility: hidden`, plus a static base page.
- Layer order without z-index: each leaf uses `rotateY(a) translateZ(d)`. The closed leaf lies on top (+d) and the turned leaf lies underneath (−d), so the left and right stacks are always correct.
- A pinned scrub (+380%). It runs in this order:
  1. The book rises from the bottom at an angle (rotX −16°, rotY 34°, rotZ −5°) and the heading goes to `blur(8px)`.
  2. The book turns to face the viewer.
  3. The cover opens (−180° around the spine) and the book shifts right by half a page, so the spread ends up centred.
  4. The Asteria spread shows.
  5. A page turns to the Solara spread.
  6. A "Download brochure" button appears (`autoAlpha`, so it is out of the tab order until it appears).
- A turning page darkens as it moves (`--shade = |sin a|`), and there is a gutter shadow near the spine.
- Page typography is calculated from `--pw`, so the whole book scales as one unit.
- Mobile: page width is 46vw, the book sits higher (`--cy: 42%`) and the sequence is the same.
- Reduced motion: a static open Asteria spread with the button.

**Not done**
- No page curl, because CSS 3D can only rotate a flat plane. A curl needs WebGL (three.js) or a "strip" trick (8–12 vertical slices with gradual rotation), which adds about 4–6 h.
- No real model images (the placeholders are abstract) and no real PDF behind the button.
- No dynamic number of spreads from ACF. The structure of one spread is ready (`$bookLeftPage` / `$bookRightPage`), but the leaf loop for N models still has to be built.

**Risks: Safari and 3D pitfalls**
- **Any `filter`, `opacity < 1`, `overflow: hidden`, `mask` or `clip-path` on an ancestor of `.book__obj` flattens `preserve-3d`.** That is why the blur is applied only to the heading, which is a sibling.
- In Safari you need `-webkit-backface-visibility` and `-webkit-transform-style` (both added). Without them the back face shows through during the turn.
- Safari sometimes sorts faces with nearly the same Z incorrectly (z-fighting at 1–2 px). The fix is to increase `d` to 2–3 px, or to add `translateZ(0.1px)` to the faces.
- `will-change: transform` on a large 3D object uses GPU memory. On older iPhones there may be a white flash on the first frame, so warm it up with `gsap.set` before the pin.
- Images inside the 3D object: `loading="lazy"` inside a pin can arrive late. In production, preload the cover and the first spread.

**Time:** about 4 min, 2 iterations on desktop + 2 on mobile.
**Production estimate:** **8–14 h**. This covers N spreads from ACF, real assets, timing with the designer, a Safari/iOS pass and the responsive version. Add 4–6 h if the designer wants a page curl.

---

## 3. Map (`?only=map`): SVG pan/zoom + autoplay timer

**Implemented**
- A flat `d3.geoEqualEarth` map from countries-110m (without Antarctica). It is one land path plus a white border mesh (`vector-effect: non-scaling-stroke`) and a soft mask at the top and bottom edges.
- A "camera" `{cx, cy, k}` that GSAP animates. It is rendered as the SVG **viewBox**. On a switch the camera does a "flight": it pans, pulls back a little halfway, then zooms in. The camera is clamped to the edges of the world, and the point sits at 40% of the height on desktop because the cards cover the bottom of the map.
- Pins are HTML elements over the SVG, positioned from the same camera, so they stay sharp and do not scale. The active pin is a navy chip with a pulse.
- Top right:
  - the name of the active location (`aria-live`);
  - a thin timer bar (GSAP `scaleX`, `data-interval`, 6 s in the demo, 30–120 s in production);
  - ‹ ›, Pause/Play, and ←/→ keys inside the group.
- When the timer ends, the next location loads. A click on a card, a pin, an arrow or a key keeps everything in sync and resets the timer.
- Pausing uses a set of reasons: `hover`, `focus` (focus inside the section), `offscreen` (IntersectionObserver), `hidden` (visibilitychange) and `user` (the button). The test confirmed that hover pauses the timer.
- Cards: the active one is navy with the address, phone and email; the `tel:` and `mailto:` links work and do not trigger a switch. On mobile the cards become a horizontal scroll-snap list, and the list scrolls itself to the active card without moving the page. The map is 46vh.
- Data: a PHP array is rendered into the HTML, and only what JS needs (coordinates, zoom) goes into `<script type="application/json">`.
- Reduced motion: autoplay is off by default (Play turns it on) and switches are instant.

**Not done**
- No highlight of the active country or region, and no clustering. With 10+ offices, the labels need collision handling.
- No drag/zoom by the user (deliberately so; it is not needed).
- While focus stays inside the section after a click, the timer stays paused. That is correct for accessibility, but agree it with the designer.

**Risks**
- Animating the viewBox makes the SVG re-rasterise every frame. With 2 paths at 110m this is cheap. With 50m data or per-country paths, check on weak phones; the fallback is `transform` on a `<g>`.
- China: everything is local with no tiles, so it works without Google or Mapbox. **Political borders** (Taiwan, Kashmir, South China Sea) in Natural Earth data can be an issue for a Chinese audience. For a CN audience, either hide the borders (only the land path is needed) or use an approved dataset. **This needs a decision.**
- iOS: `mask-image` needs the `-webkit-` prefix (added).

**Time:** about 4 min, 3 iterations (desktop, mobile, zoom and edge tuning). The interaction test `test/map-agent-c.mjs` checks the auto-switch, card click, hover pause, Enter on ›, and ArrowRight.
**Production estimate:** **6–10 h**. This covers real data and ACF (the interval as a field), designer tuning of the zoom per office, the border decision for CN, cross-browser checks, accessibility and the responsive version.

---

## Summary of estimates (AI agent writes the code, developer reviews and tunes with the designer)

| Section | Hours (min–max) |
|---|---|
| Globe | 6–10 |
| Book (no curl) | 8–14 (+4–6 for a curl) |
| Map | 6–10 |
| **Total** | **20–34** |

## Best screenshots

**Globe**
- `shots/globe-1440-0.png`: the title
- `shots/globe-1440-0_15.png`: the globe rises and the title blurs
- `shots/globe-1440-0_3.png` and `shots/globe-1440-0_5.png`: rotation with markers
- `shots/globe-1440-1.png`: small globe with the stats
- `shots/globe-375-0_6.png`: mobile

**Book**
- `shots/book-1440-0_12.png`: rising at an angle, heading blurred
- `shots/book-1440-0_45.png`: the cover opening
- `shots/book-1440-0_55.png`: the Asteria spread
- `shots/book-1440-0_7.png`: a page turning
- `shots/book-1440-1.png`: Solara with the CTA
- `shots/book-375-0_7.png`: mobile

**Map**
- `shots/map-1440-a-start.png`: start
- `shots/map-1440-d-click-mid.png`: mid-flight
- `shots/map-1440-e-click-end.png`: Boca Raton
- `shots/map-375-e-click-end.png`: mobile

**Reduced motion**
- `shots/globe-reduced.png`, `shots/book-reduced.png`, `shots/map-reduced.png`

---

# Round 2: fixes after user feedback

Wall-clock: **12:27 → 12:41, about 14 min**, including motion QA and these notes. I looked at all the new Figma refs (`_ref/globe-figma-*`, `_ref/book-figma-*`).

## Globe (2 iterations)
- **Locations:** exactly the three from the mockup:
  - "Federal Highway, Boca Raton" (26.36, -80.08)
  - "Howard Street, Malta" (35.90, 14.50)
  - "Guangdong Province, China" (23.10, 113.30)

  Dubai and Hong Kong are removed.
- **Stats labels** now follow the final frame: Countries Served / Dealer & Service Partners / Continents.
- **Sequence matches the storyboard** (rotate = −centre of the disc):
  - A: the Americas, with only Boca visible.
  - B: Malta upper-left and Guangdong lower-right (`rotate [-64,-40]`).
  - C: Asia, with Guangdong near the top.
  - Labels that go behind the sphere hide on their own.
- **Shrinking removed.** The globe stays big and only moves up. Its lower part dissolves into white (`.globe__fade` overlay; animating opacity is cheaper than a mask), and 15+ / 30+ / 4 count up over it.
- **Tags as in the mockup:** a small rectangular tag above a 6 px dot. Boca and Malta are light (white with dark text), Guangdong is dark.
- **Palette as in Figma:** light land on a grey ocean, with a darker rim.

## Book: page curl (4 iterations)
- **Segmented page.** JS cuts each leaf into vertical strips: 14 for the page, 8 for the cover. The strips are nested (each one sits at `left:100%` of the previous and turns around its own left edge), so their rotations add up into an arc.
- **Each strip holds its own slice of the front and back** (a copy of the content shifted by −i·w). PHP stays clean: segmentation happens only in JS.
- **Bend shape.** The root leads and the tip lags: `root = −180·(1−(1−p)^(1+0.9k))`, `tip = −180·p^(1+0.9k)`. Bending is stronger near the edge (weight ∝ i). The cover is stiff (`stiff 0.65`, less bend), the page is soft.
- **Lighting per strip:**
  - Darkening depends on the angle to the viewer (`--s`).
  - A highlight sits on the bend (`--h`).
  - A **cast shadow** falls on the right page and then the left page. Its width follows the projection of the leaf and its strength peaks halfway (`sin πp`).
  - The left "board" with a shadow appears when the cover lands.
- **At rest (p = 0 or 1) the original whole faces show** (`.is-flat`), so the strips leave no hairline seams.
  - Faces overlap by ±1 px, which hides gaps on the bends.
  - The swap uses `visibility`, not `display`. With `display:none` the first frame of the turn spiked to 300+ ms (layer creation and image decode).
- **Safari-safe:**
  - `-webkit-` prefixes are in place.
  - Strips are 3D containers with no overflow or filter; only the leaf `.face` elements clip.
  - Reduced motion shows a static open spread with no strips.
- **Risk:** each strip carries a full copy of the page, so 22 copies × 2 faces. That is fine for 2 spreads, but with 10+ spreads, segment lazily (only the leaf currently turning).

## Map: timer and pagination (1 iteration + a new test)
- **Cause of the bug:** hover-pause listened on the **whole section**. A resting cursor over the section while scrolling kept the timer paused until the section scrolled out from under it.
- **Fixes:**
  - Hover counts only over the map and cards, and only on **real** mouse movement (`pointermove` with `movementX/Y ≠ 0`). Chrome's synthetic moves during scroll are ignored.
  - Focus pause applies only for keyboard focus (`:focus-visible`), so a mouse click on a card does not freeze the timer.
  - The timer starts when the map is ≥ 40 % visible (IntersectionObserver on `.hsmap__map`) and pauses when it drops below that.
  - Every manual switch restarts the timer from 0.
- **Pagination is the timer.** One segment per location, stories-style: past segments full, the active one filling smoothly (`--fill` 0→1), the next ones empty. The segments are clickable buttons with `aria-current`. There is also a "01 / 03" counter. Everything stays in sync with the cards, pins, arrows and keys.
- **Pause is visible.** The active segment turns grey and a caption reads "Paused while you explore", "Paused" or "Autoplay paused".
- **Test** `test/map-agent-c.mjs`, run on the full page with the cursor resting over the map:
  - The timer fills 0.06 → 0.70 over 4 s, then auto-advances to 02/03.
  - A click on segment 3 resets the fill to 0.03.
  - Hover freezes the fill (`frozen: true`).
  - Moving the mouse away resumes it.
  - Off-screen freezes it (`true`).
  - No console errors at 1440 or 375.

## Motion QA in real Chrome (playwright-core, `channel:'chrome'`)
- Script `test/anim-agent-c.mjs <slug> from to steps [WxH] [--mobile] [--motion]`:
  - a smooth rAF scroll over 4 s with rAF deltas measured;
  - a dense series of screenshots;
  - `--motion` captures real paint frames over CDP screencast (playwright `recordVideo` needs its own ffmpeg, which is not installed);
  - sheets are built with `/usr/local/bin/ffmpeg ... tile`.
- **Frame times** (MacBook, Chrome; avg FPS / frames > 32 ms / max frame):

| Effect | 1440×900 | 375×812 mobile |
|---|---|---|
| Globe, whole timeline | 60.0 / 0 / 16.8 ms | 60.0 / 0 / 16.8 ms |
| Book, whole timeline (curl) | 58.7–60 / 0–4 / ≤ 50 ms* | 57.7 / 1 / 200 ms* |
| Book, cover opening (after the visibility fix) | 59.6–60 / 0–1 / ≤ 50 ms | — |
| Map flight (pan + zoom-out/in, 1.6 s) | 60.3 / 0 / 16.8 ms | 60.3 / 0 / 16.8 ms |

  \* A single spike on first entering the 3D scene (images decode, GPU layers created). In production: preload the images and do a "warm-up" `gsap.set` before the pin.
- **Globe canvas redraw cost** (land-110m + graticule + 2 gradients, canvas 2016 px at DPR 2): median **4.8 ms**, p95 5.3 ms of JS/raster per redraw on a Mac. On weak Android expect roughly 3–4× that (15–20 ms), which fits the budget only because we redraw only when the angle changes. A cheap fallback if needed: precision 1.0 or DPR 1.5.
- **Visual review of the sheets:**
  - The globe rotation is smooth, labels appear and disappear without jumps, and the Malta/Guangdong labels do not overlap.
  - Book: the curl reads at every angle and the cover bends less than the page. Faceting between strips is barely noticeable while moving and invisible at rest.
  - The map flight is smooth, the cards cross-fade, and the timer segment fills evenly.

## Updated estimates
- Globe: **6–10 h** (unchanged; the 3-location sequence is now locked).
- Book with curl: **12–20 h** (the curl is in the demo; production needs lazy segmentation for N spreads, real assets and Safari/iOS tuning).
- Map: **6–10 h** (unchanged).

## Round 2 screenshots and sheets (in `shots/`)

**Globe**
- `globe-1440-motion-sheet.jpg`: real frames across the whole timeline
- `globe-1440-seq-sheet.jpg`
- `globe-1440-0_28.png`: Boca Raton
- `globe-1440-0_55.png`: Malta and Guangdong
- `globe-1440-1.png`: final frame with stats
- `globe-375-0_55.png`, `globe-375-1.png`: mobile

**Book**
- `book-1440-motion-sheet.jpg`: whole sequence, real frames
- `book-1440-cover-motion-sheet.jpg`: cover opening
- `book-1440-curl-sheet.jpg`: 16 angles

**Map**
- `map-1440-flight-motion-sheet.jpg`
- `map-1440-nav-states.png`: timer filling / paused / mid-flight
- `map-1440-timer-2.png`, `map-1440-hover-paused.png`, `map-375-flight-end.png`

Raw frames are in `shots/mot/`.

---

# Round 3: map to match the Figma component (`_ref/map-figma.png`)

Wall-clock: **13:23 → 13:32, about 9 min** (3 visual iterations plus motion QA).

**Pagination steps of unequal width**
- The active step is a long bar (140 px) and the inactive ones are short (45 px; on mobile 110 / 28 px).
- When the location changes, the new active step stretches and the previous one shrinks back. This is a CSS transition on `flex-basis` (.7 s, ease-in-out).
- The timer fill (`--fill`) runs inside the long bar. The old fill drains smoothly (`transition: transform` only on inactive steps).
- The active step's track is darker, so you can see how much time is left.
- The test records widths `140/45/45 → 45/136/49 (mid-transition) → 45/45/140`.
- The "01 / 03" counter is removed, because the stretching steps already work as pagination. Each step button keeps an aria-label like "(2 of 3)".

**Navigation**
- The name sits above the steps, using the mockup texts: "Guangdong Province, China", "Howard Street, Malta", "Federal Highway, Boca Raton".
- To the right are square outline arrows (32 px, radius 4): ‹ is light grey, › is dark.
- Pause/Play is a quiet icon after them.
- The round 2 timer behaviour is unchanged: it starts at ≥ 40 % visibility, hover counts only on real mouse movement over the map or cards, focus counts only for keyboard focus, every manual switch restarts from 0, and the pause is visible.

**Pins**
- White tags with a shadow; the active one is dark `#222`.
- A dark "drop" dot sits under each tag, with a pulse on the active one.
- The camera zoom is softer (1.3–1.35), so the whole world stays in view as in the mockup while the camera still pans to the active point.

**Cards**
- Kickers and titles: HEYSEA ASIA / Guangdong Province, China; HEYSEA EUROPE / Malta; HEYSEA AMERICA / Boca Raton, USA. Addresses and emails are taken from the mockup.
- Address and email rows have icons (inline SVG).
- Inactive cards are `#f7f7f7`. The active card is `#222`, raised, and taller (aligned to the bottom, so it grows upwards), with "Contact us ›".
- The CTA opens smoothly (`grid-template-rows 0fr → 1fr` plus opacity). In inactive cards it has `tabindex=-1` and `visibility: hidden`.
- The phone number is removed, because the mockup has none.
- Mobile: horizontal snap list. Fixed a bug where the card list scrolled to the wrong offset (`offsetLeft` is already relative to the list).

**QA (real Chrome)**
- `test/map-agent-c.mjs` passes at 1440 and 375 with no console errors. Reduced motion and the full page show no errors either.
- Frame times while switching (flight + stretch + card raise), measured without screencast:
  - In an isolated diagnostic run (`base` / without transitions / without shadow / without mask): **0 frames > 32 ms in 4 out of 4 switches** in every variant.
  - Runs at the same time as the other agents' Chrome instances occasionally gave 4–8 long frames (avg 53–55 fps). That is load on the machine, not the CSS: with transitions turned off the picture was the same.
- Sheets:
  - `shots/map-1440-steps-motion-sheet.jpg`: a crop of the navigation from real frames. The long bar moves from step 1 to step 3 and the fill restarts.
  - `shots/map-1440-flight-motion-sheet.jpg`: the whole block; the flight, the card cross-fade and the dark card rising.
  - `shots/map-1440-flight-end.png`, `shots/map-1440-hover-paused.png`, `shots/map-375-flight-end.png`.

**Estimate for the map:** unchanged, **6–10 h**.

**Style aligned with Figma Design** (`_ref/our-yachts-figma.png` and the Map frame), applied in the same round with no extra iteration:
- The map uses CSS tokens: `--bg #f7f9fb`, `--ink #0d1b2a`, `--muted #8b939c`, `--land #e6eaee`.
- Country borders are drawn in the background colour.
- The heading is sans with an accent "*discover more*" in italic serif, muted grey.
- The eyebrow is a grey uppercase label.
- Inactive cards are white on the light background with a soft shadow. The active card stays `#222`, as requested in Round 3.
- The tests pass again at 1440 and 375 with no console errors (see `shots/map-1440-flight-end.png`).
