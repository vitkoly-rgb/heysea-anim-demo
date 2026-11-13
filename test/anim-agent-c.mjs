// node test/anim-agent-c.mjs <slug> [from=0] [to=1] [steps=12] [WxH] [--mobile] [--video]
// 1) Щільна серія скрінів по scroll-діапазону секції (pin) → shots/<slug>-<w>-seq-NN.png
// 2) Плавний «реальний» скрол від from до to за 4 c (rAF у сторінці) + вимір кадрів: avg FPS, кадри > 32 мс.
// 3) --motion: ще один плавний скрол, під час якого знімаємо кадри «на льоту» → shots/<slug>-<w>-mot-NN.png
//    (recordVideo не працює без playwright-ffmpeg; це його заміна для перевірки ривків/мерехтіння).
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const [slug, from = '0', to = '1', steps = '12', size = '1440x900'] = args;
const mobile = process.argv.includes('--mobile'), video = process.argv.includes('--video'), motion = process.argv.includes('--motion');
const [w, h] = size.split('x').map(Number);
const OUT = new URL('../shots/', import.meta.url).pathname;
const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: mobile, isMobile: mobile,
  ...(video ? { recordVideo: { dir: OUT + 'vid-tmp/', size: { width: w, height: h } } } : {}) });
const page = await ctx.newPage();
const errors = [];
page.on('console', (m) => m.type() === 'error' && !/favicon/.test(m.location()?.url || '') && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(`http://localhost:8790/?only=${slug}&lenis=0`, { waitUntil: 'networkidle' });
await page.waitForTimeout(600);
const range = await page.evaluate((id) => {
  const el = document.getElementById(id); const box = el.closest('.pin-spacer') || el;
  return { top: box.getBoundingClientRect().top + scrollY, scrollable: Math.max(box.offsetHeight - innerHeight, 0) };
}, slug);
const Y = (p) => Math.round(range.top + p * range.scrollable);
// --- плавний скрол + кадри
await page.evaluate((y) => scrollTo(0, y), Y(+from)); await page.waitForTimeout(800);
const perf = await page.evaluate(([y0, y1]) => new Promise((res) => {
  const d = []; let last = performance.now(); const t0 = last, T = 4000;
  function f(now) {
    d.push(now - last); last = now;
    const k = Math.min((now - t0) / T, 1);
    scrollTo(0, y0 + (y1 - y0) * k);
    if (k < 1 || now - t0 < T + 700) requestAnimationFrame(f);
    else { d.shift(); const avg = d.reduce((a, b) => a + b, 0) / d.length;
      res({ frames: d.length, avgFps: +(1000 / avg).toFixed(1), over32: d.filter((x) => x > 32).length, max: +Math.max(...d).toFixed(1) }); }
  }
  requestAnimationFrame(f);
}), [Y(+from), Y(+to)]);
console.log('PERF', slug, size, JSON.stringify(perf));
// --- кадри під час руху (CDP screencast = фактично відео з реальних paint-кадрів Chrome)
if (motion) {
  await page.evaluate((y) => scrollTo(0, y), Y(+from)); await page.waitForTimeout(800);
  const cdp = await ctx.newCDPSession(page); const frames = [];
  cdp.on('Page.screencastFrame', (f) => { frames.push(f.data); cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {}); });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 70, maxWidth: w, maxHeight: h, everyNthFrame: 1 });
  await page.evaluate(([y0, y1]) => new Promise((res) => { const t0 = performance.now(); (function f(now) { const k = Math.min((now - t0) / 4000, 1); scrollTo(0, y0 + (y1 - y0) * k); if (k < 1 || now - t0 < 4800) requestAnimationFrame(f); else res(); })(t0); }), [Y(+from), Y(+to)]);
  await cdp.send('Page.stopScreencast');
  fs.mkdirSync(`${OUT}mot/`, { recursive: true });
  for (const f of fs.readdirSync(`${OUT}mot/`)) if (f.startsWith(`${slug}-${w}-`)) fs.unlinkSync(`${OUT}mot/${f}`);
  frames.forEach((d, i) => fs.writeFileSync(`${OUT}mot/${slug}-${w}-${String(i).padStart(3, '0')}.jpg`, Buffer.from(d, 'base64')));
  console.log('motion frames', frames.length, `${OUT}mot/${slug}-${w}-*.jpg`);
}
// --- щільна серія
const n = +steps;
for (let i = 0; i < n; i++) {
  const p = +from + (+to - +from) * (i / (n - 1));
  await page.evaluate((y) => scrollTo(0, y), Y(p)); await page.waitForTimeout(750);
  await page.screenshot({ path: `${OUT}${slug}-${w}-seq-${String(i).padStart(2, '0')}.png` });
}
console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no console errors');
await ctx.close();
if (video) {
  const f = fs.readdirSync(OUT + 'vid-tmp/').find((x) => x.endsWith('.webm'));
  fs.renameSync(OUT + 'vid-tmp/' + f, `${OUT}${slug}-${w}.webm`); fs.rmSync(OUT + 'vid-tmp/', { recursive: true });
  console.log(`${OUT}${slug}-${w}.webm`);
}
await browser.close();
