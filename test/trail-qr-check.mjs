// node test/trail-qr-check.mjs — CTA trail crops (DPR 2) + QR entrance frames, 1440 & 375; fps + console errors.
import { chromium } from 'playwright-core';
const OUT = new URL('../shots/round-trail-qr/', import.meta.url).pathname;
const browser = await chromium.launch({ channel: 'chrome', headless: false });
const probe = async (page, ms, label) => {
  const r = await page.evaluate((ms) => new Promise((res) => {
    const d = []; let last = performance.now(); const t0 = last;
    const f = (t) => { d.push(t - last); last = t; if (t - t0 < ms) requestAnimationFrame(f); else res(d.slice(1)); };
    requestAnimationFrame(f);
  }), ms);
  const avg = r.reduce((a, b) => a + b, 0) / r.length;
  console.log(JSON.stringify({ label, fps: +(1000 / avg).toFixed(1), over32: r.filter((x) => x > 32).length, max: +Math.max(...r).toFixed(1) }));
};
for (const [w, h] of [[1440, 900], [375, 812]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', (e) => errs.push(String(e))); page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  // ---- CTA
  await page.goto('http://localhost:8790/?only=cta-orbits', { waitUntil: 'networkidle' });
  await page.evaluate(() => { const s = document.getElementById('cta-orbits'); window.scrollTo(0, s.getBoundingClientRect().top + scrollY); HS.lenis && HS.lenis.scrollTo(s.getBoundingClientRect().top + scrollY, { immediate: true }); });
  await page.waitForTimeout(1500);
  await probe(page, 3000, `cta ${w}`);
  await page.screenshot({ path: `${OUT}cta-${w}.png` });
  // trail heads: compute screen pos of each star's trail midpoint and crop around it
  const pts = await page.evaluate(() => {
    const c = document.querySelector('.cta-canvas'); const r = c.getBoundingClientRect();
    const g = c.getContext('2d'); const d = g.getImageData(0, 0, c.width, c.height).data;
    // find brightest pixels (star heads)
    const found = [];
    for (let y = 0; y < c.height; y += 2) for (let x = 0; x < c.width; x += 2) { const i = (y * c.width + x) * 4; if (d[i + 3] > 250) found.push([x / devicePixelRatio + r.left, y / devicePixelRatio + r.top]); }
    const cl = []; for (const p of found) if (!cl.some((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) < 60)) cl.push(p);
    return cl.filter((p) => p[0] > 0 && p[1] > 0 && p[0] < innerWidth && p[1] < innerHeight);
  });
  let k = 0;
  for (const [x, y] of pts) {
    const S = 180, cx = Math.max(0, Math.min(w - S, x - S / 2)), cy = Math.max(0, Math.min(h - S, y - S / 2));
    await page.screenshot({ path: `${OUT}cta-${w}-trail${k++}.png`, clip: { x: cx, y: cy, width: S, height: S } });
  }
  // ---- QR
  await page.goto('http://localhost:8790/?only=qr', { waitUntil: 'networkidle' });
  await page.mouse.move(w / 2, h / 2);
  const target = await page.evaluate(() => { const s = document.getElementById('qr'); return (s.closest('.pin-spacer') || s).getBoundingClientRect().top + scrollY; });
  const steps = Math.ceil(target / 120);
  for (let i = 0; i < steps; i++) { await page.mouse.wheel(0, 120); await page.waitForTimeout(16); }
  for (let i = 0; i < 12; i++) { await page.screenshot({ path: `${OUT}qr-${w}-f${String(i).padStart(2, '0')}.png` }); await page.waitForTimeout(150); }
  await page.waitForTimeout(800);
  await probe(page, 1500, `qr idle ${w}`);
  if (w > 800) {
    const p = probe(page, 2500, `qr pinned scrub ${w}`);
    for (let i = 0; i < 60; i++) { await page.mouse.wheel(0, 30); await page.waitForTimeout(33); }
    await p; await page.waitForTimeout(800);
    await page.screenshot({ path: `${OUT}qr-${w}-scrubbed.png` });
    console.log('col opacities', await page.evaluate(() => [...document.querySelectorAll('.qr__col')].map((c) => c.style.opacity).join(',')));
  } else {
    await page.evaluate(() => document.querySelector('.qr__viewport').scrollBy({ left: 600 }));
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${OUT}qr-${w}-swiped.png` });
  }
  console.log('inline styles left', await page.evaluate(() => [...document.querySelectorAll('.qr__code,.qr__name,.qr__desc,.qr__eyebrow')].filter((e) => e.getAttribute('style')).length), 'lines', await page.evaluate(() => document.querySelectorAll('.qr__line').length));
  console.log(w, errs.length ? 'ERRORS ' + errs.join(' | ') : 'no errors');
  await ctx.close();
}
await browser.close();
