// node test/agent-a-motion.mjs [qr|cursor|all] — drives the effects in headed Chrome, records video
// (qr: scroll through the pin) / dense clipped screenshots (cursor), and measures rAF frame times.
// Output: shots/motion-*.webm, shots/motion-*-sheet.jpg (built by ffmpeg), frame stats on stdout.
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const OUT = new URL('../shots/', import.meta.url).pathname;
const which = process.argv[2] || 'all';
const FF = '/usr/local/bin/ffmpeg';
const browser = await chromium.launch({ channel: 'chrome', headless: false });

// rAF frame-time probe
const startProbe = (page) => page.evaluate(() => {
  window.__ft = []; let last = performance.now(); window.__run = true;
  const f = (t) => { window.__ft.push(t - last); last = t; if (window.__run) requestAnimationFrame(f); };
  requestAnimationFrame(f);
});
const stopProbe = async (page, label) => {
  const d = await page.evaluate(() => { window.__run = false; return window.__ft.slice(1); });
  const avg = d.reduce((a, b) => a + b, 0) / d.length;
  const res = { label, longIdx: d.map((x, i) => x > 32 ? i : -1).filter((i) => i >= 0).slice(0, 8), frames: d.length, avgFps: +(1000 / avg).toFixed(1), over32ms: d.filter((x) => x > 32).length, maxMs: +Math.max(...d).toFixed(1) };
  console.log(JSON.stringify(res));
  return res;
};

if (which === 'qr' || which === 'all') {
  // (playwright's recordVideo needs its own ffmpeg build → use dense screenshots taken DURING wheel scrolling)
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('http://localhost:8790/?only=qr', { waitUntil: 'networkidle' }); // Lenis ON = real behaviour
  await page.mouse.move(720, 450);
  const top = await page.evaluate(() => document.getElementById('qr').closest('.pin-spacer').getBoundingClientRect().top + scrollY);
  for (let y = 0; y < top; y += 100) { await page.mouse.wheel(0, 100); await page.waitForTimeout(16); }
  await page.waitForTimeout(1000);
  // 1) clean frame-time measurement: steady wheel through the pin, no screenshots
  await startProbe(page);
  for (let i = 0; i < 70; i++) { await page.mouse.wheel(0, 30); await page.waitForTimeout(33); }
  await page.waitForTimeout(1000);
  await stopProbe(page, 'qr pinned horizontal scroll (Lenis on, 1440)');
  // 2) back up and capture 16 frames mid-scroll (no settle wait → shows scrub lag/jumps)
  for (let i = 0; i < 25; i++) { await page.mouse.wheel(0, -100); await page.waitForTimeout(16); }
  await page.waitForTimeout(1200);
  const frames = [];
  for (let i = 0; i < 16; i++) {
    for (let k = 0; k < 2; k++) { await page.mouse.wheel(0, 30); await page.waitForTimeout(16); }
    const f = `${OUT}tmp-q-${String(i).padStart(2, '0')}.png`;
    await page.screenshot({ path: f, scale: 'css' }); frames.push(f);
  }
  console.log(errors.length ? 'ERRORS ' + errors.join('\n') : 'qr: no page errors');
  await ctx.close();
  execFileSync(FF, ['-v', 'error', '-y', '-framerate', '1', '-i', OUT + 'tmp-q-%02d.png', '-vf', 'scale=480:-1,tile=4x4:padding=4:color=black', '-frames:v', '1', OUT + 'motion-qr-sheet.jpg']);
  frames.forEach((f) => fs.unlinkSync(f));
  console.log(OUT + 'motion-qr-sheet.jpg');
}

if (which === 'oy' || which === 'all') {
  // Our yachts: pinned depth fly-through. Frame-time probe while wheeling through the pin, then 16 frames.
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 800 } });
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && !/404/.test(m.text()) && errors.push(m.text()));
  await page.goto('http://localhost:8790/?only=our-yachts', { waitUntil: 'networkidle' }); // Lenis on
  await page.mouse.move(720, 400); await page.waitForTimeout(500);
  await startProbe(page);
  for (let i = 0; i < 80; i++) { await page.mouse.wheel(0, 30); await page.waitForTimeout(33); }
  await page.waitForTimeout(1000);
  await stopProbe(page, 'our-yachts fly-through (Lenis on, 1440x800)');
  await page.evaluate(() => (window.HS && HS.lenis ? HS.lenis.scrollTo(0, { immediate: true }) : scrollTo(0, 0)));
  await page.waitForTimeout(1200);
  const frames = [];
  for (let i = 0; i < 16; i++) {
    for (let k = 0; k < 4; k++) { await page.mouse.wheel(0, 30); await page.waitForTimeout(16); }
    const f = `${OUT}tmp-o-${String(i).padStart(2, '0')}.png`;
    await page.screenshot({ path: f }); frames.push(f);
  }
  console.log(errors.length ? 'ERRORS ' + errors.join('\n') : 'our-yachts: no page errors');
  await ctx.close();
  execFileSync(FF, ['-v', 'error', '-y', '-framerate', '1', '-i', OUT + 'tmp-o-%02d.png', '-vf', 'scale=480:-1,tile=4x4:padding=4:color=black', '-frames:v', '1', OUT + 'motion-our-yachts-sheet.jpg']);
  frames.forEach((f) => fs.unlinkSync(f));
  console.log(OUT + 'motion-our-yachts-sheet.jpg');
}

if (which === 'cursor' || which === 'all') {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('http://localhost:8790/?only=series-cursor&lenis=0', { waitUntil: 'networkidle' });
  await page.mouse.move(720, 450); await page.waitForTimeout(800);
  const pos = () => page.evaluate(() => { const m = document.querySelector('.sc-cursor').style.transform.match(/([\d.-]+)px, ([\d.-]+)px/); return { x: Math.round(+m[1] + 32), y: Math.round(+m[2] + 32) }; });
  const frames = [];
  const snap = async (tag) => { const p = await pos(); const f = `${OUT}tmp-c-${String(frames.length).padStart(2, '0')}.png`; await page.screenshot({ path: f, clip: { x: p.x - 50, y: p.y - 50, width: 220, height: 100 } }); frames.push(f); };
  await startProbe(page);
  await snap('rest');
  // small gentle move (~60px), sample while moving
  for (let i = 1; i <= 12; i++) { await page.mouse.move(720 + i * 5, 450); await page.waitForTimeout(25); if (i % 4 === 0) await snap('small'); }
  // let it settle while sampling
  for (let i = 0; i < 4; i++) { await page.waitForTimeout(220); await snap('settle-small'); }
  // fast swipe left then right
  for (let i = 1; i <= 10; i++) { await page.mouse.move(780 - i * 40, 450); await page.waitForTimeout(16); }
  await snap('fast');
  for (let i = 1; i <= 10; i++) { await page.mouse.move(380 + i * 45, 450 - i * 3); await page.waitForTimeout(16); }
  for (let i = 0; i < 6; i++) { await page.waitForTimeout(i < 3 ? 90 : 400); await snap('after-fast'); }
  await page.waitForTimeout(1500); await snap('rest-again');
  await stopProbe(page, 'water cursor (mousemove + settle, screenshot pauses included)');
  // clean measurement without screenshots: continuous circular mouse motion for 3 s
  await startProbe(page);
  for (let i = 0; i < 180; i++) { const a = i / 15; await page.mouse.move(720 + Math.cos(a) * 200, 450 + Math.sin(a) * 120); await page.waitForTimeout(16); }
  await stopProbe(page, 'water cursor continuous motion 3s');
  console.log(errors.length ? 'ERRORS ' + errors.join('\n') : 'cursor: no page errors');
  await ctx.close();
  const list = OUT + 'tmp-c-list.txt';
  execFileSync(FF, ['-v', 'error', '-y', '-framerate', '1', '-i', OUT + 'tmp-c-%02d.png', '-vf', 'tile=4x4:padding=4:color=white', '-frames:v', '1', OUT + 'motion-cursor-sheet.jpg']);
  frames.forEach((f) => fs.unlinkSync(f));
  console.log(OUT + 'motion-cursor-sheet.jpg  (' + frames.length + ' frames: rest, small×3, settle×4, fast, after-fast×6, rest)');
}
await browser.close();
fs.rmSync(OUT + 'tmp-video', { recursive: true, force: true });
