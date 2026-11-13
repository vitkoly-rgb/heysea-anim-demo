// node test/motion.mjs <timeline|wave-steps|cta-orbits> [WxH] [--mobile]
// Drives an effect in real Chrome twice:
//   1) no recording → rAF frame-time metrics (avg FPS, frames > 32 ms, worst frame)
//   2) CDP screencast (real compositor frames with timestamps) → contact sheet(s)
//      shots/<slug>-<w>-motion-<segment>.jpg, frames picked evenly across each animated segment, tiled with ffmpeg
import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const args = process.argv.slice(2);
const slug = args[0];
const size = args.find((a) => /^\d+x\d+$/.test(a)) || '1440x900';
const mobile = args.includes('--mobile');
const [w, h] = size.split('x').map(Number);
const OUT = new URL('../shots/', import.meta.url).pathname;
const only = args.includes('--metrics-only');
const FFMPEG = fs.existsSync('/usr/local/bin/ffmpeg') ? '/usr/local/bin/ffmpeg' : 'ffmpeg';

const startMeasure = (page) => page.evaluate(() => {
  window.__ft = []; window.__long = []; window.__t0 = performance.now(); window.__run = true; let last = performance.now();
  const f = (t) => { const d = t - last; window.__ft.push(d); if (d > 32) window.__long.push(`${Math.round(t - window.__t0)}ms:${Math.round(d)}`); last = t; if (window.__run) requestAnimationFrame(f); };
  requestAnimationFrame(f);
});
const stopMeasure = (page) => page.evaluate(() => {
  window.__run = false;
  const d = window.__ft.slice(2);
  const avg = d.reduce((a, b) => a + b, 0) / d.length;
  return { frames: d.length, avgFps: +(1000 / avg).toFixed(1), over32ms: d.filter((x) => x > 32).length, worstMs: +Math.max(...d).toFixed(1), longFramesAt: window.__long.slice(0, 12) };
});
// Smooth programmatic scroll (rAF-driven, like a trackpad) from y0 to y1 over ms.
const smoothScroll = (page, y0, y1, ms) => page.evaluate(([a, b, d]) => new Promise((res) => {
  const t0 = performance.now();
  const step = (t) => { const k = Math.min((t - t0) / d, 1); scrollTo(0, a + (b - a) * k); k < 1 ? requestAnimationFrame(step) : res(); };
  requestAnimationFrame(step);
}), [y0, y1, ms]);

/** Each scenario returns [{name, from, dur, fps, crop?}] segments (seconds, relative to video start). */
const scenarios = {
  async timeline(page, t0) {
    await page.goto('http://localhost:8790/?only=timeline&lenis=0', { waitUntil: 'networkidle' });
    await page.mouse.move(w - 2, h - 2);
    await page.waitForTimeout(600);
    await startMeasure(page);
    const segs = [];
    const act = async (name, js, wait) => {
      const from = (Date.now() - t0) / 1000;
      await page.evaluate(js);
      await page.waitForTimeout(wait);
      segs.push({ name, from: from - 0.05, dur: 1.2, fps: 13, crop: mobile ? 'iw:ih*0.5:0:ih*0.05' : 'iw*0.5:ih*0.62:iw*0.42:ih*0.18' });
    };
    await act('next', () => document.querySelector('.tl-next').click(), 1700);
    await act('prev', () => document.querySelector('.tl-prev').click(), 1700);
    await act('yearclick', () => { const b = [...document.querySelectorAll('.tl-year')].filter((x) => +x.style.opacity > 0.3).pop(); b.click(); }, 2000);
    return segs;
  },
  // Pinned timeline: scroll through years, then a control (next) must move the scroll position to stay in sync.
  async 'timeline-scroll'(page, t0) {
    await page.goto('http://localhost:8790/?only=timeline&lenis=0', { waitUntil: 'networkidle' });
    await page.mouse.move(w - 2, h - 2);
    await page.waitForTimeout(600);
    const r = await page.evaluate(() => { const st = ScrollTrigger.getAll()[0]; return { start: st.start, end: st.end }; });
    const yr = () => page.evaluate(() => ({ year: document.querySelector('.tl-dial').getAttribute('aria-valuenow'), y: Math.round(scrollY) }));
    await startMeasure(page);
    const mark = (n) => page.evaluate((n) => console.log('[phase] ' + n + ' @' + Math.round(performance.now() - window.__t0) + 'ms'), n);
    page.on('console', (m) => m.text().startsWith('[phase]') && console.log(m.text()));
    const segs = [];
    await mark('scroll3');
    // 1) slow-ish scroll across 3 years (≈ a trackpad flick per year)
    let from = (Date.now() - t0) / 1000;
    const per = (r.end - r.start) / 17;
    await smoothScroll(page, r.start, r.start + per * 3, 1800);
    await page.waitForTimeout(1400);
    segs.push({ name: 'scroll3', from, dur: 3.2, fps: 5, crop: mobile ? 'iw:ih*0.6:0:ih*0.05' : 'iw*0.62:ih*0.62:iw*0.38:ih*0.18' });
    console.log('after scrolling 3 years:', JSON.stringify(await yr()), 'expected y≈', Math.round(r.start + per * 3));
    await mark('click-next');
    // 2) click next → scroll must jump to the next year slot (still pinned)
    await page.evaluate(() => document.querySelector('.tl-next').click());
    await page.waitForTimeout(1500);
    console.log('after next click:', JSON.stringify(await yr()), 'expected y≈', Math.round(r.start + per * 4));
    await mark('scroll-back');
    // 3) scroll back up 2 years
    from = (Date.now() - t0) / 1000;
    const y0 = await page.evaluate(() => scrollY);
    await smoothScroll(page, y0, y0 - per * 2, 1200);
    await page.waitForTimeout(1500);
    segs.push({ name: 'scrollback', from, dur: 2.6, fps: 5, crop: mobile ? 'iw:ih*0.6:0:ih*0.05' : 'iw*0.62:ih*0.62:iw*0.38:ih*0.18' });
    console.log('after scrolling back 2:', JSON.stringify(await yr()));
    await mark('autoplay');
    // 4) autoplay (8 s) while idle in the pin → year + scroll advance together
    await page.waitForTimeout(8400);
    console.log('after autoplay:', JSON.stringify(await yr()));
    await mark('skip');
    // 5) skip link → past the pinned range
    await page.evaluate(() => document.querySelector('.tl-skip').click());
    await page.waitForTimeout(500);
    console.log('after skip:', JSON.stringify(await page.evaluate(() => ({ y: Math.round(scrollY), afterTop: Math.round(document.getElementById('timeline-after').getBoundingClientRect().top), pinEnd: Math.round(ScrollTrigger.getAll()[0].end) }))));
    return segs;
  },
  async 'wave-steps'(page, t0) {
    await page.goto('http://localhost:8790/?only=wave-steps&lenis=0', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    const r = await page.evaluate(() => { const b = document.getElementById('wave-steps').closest('.pin-spacer'); return { top: b.getBoundingClientRect().top + scrollY, len: b.offsetHeight - innerHeight }; });
    await startMeasure(page);
    const from = (Date.now() - t0) / 1000;
    await smoothScroll(page, r.top, r.top + r.len, 4000);
    await page.waitForTimeout(800);
    return [{ name: 'scroll', from, dur: 4.6, fps: 2.6 }];
  },
  async 'cta-orbits'(page, t0) {
    await page.goto('http://localhost:8790/?only=cta-orbits&lenis=0', { waitUntil: 'networkidle' });
    await page.evaluate(() => { const d = document.createElement('div'); d.style.height = '100vh'; document.querySelector('main').prepend(d); ScrollTrigger.refresh(); });
    await page.waitForTimeout(400);
    const end = await page.evaluate(() => document.getElementById('cta-orbits').getBoundingClientRect().top + scrollY);
    await startMeasure(page);
    const from = (Date.now() - t0) / 1000;
    await smoothScroll(page, 0, end, 3500);
    await page.waitForTimeout(2500);
    return [{ name: 'scroll+orbits', from, dur: 6, fps: 2 }];
  },
};

const browser = await chromium.launch({ channel: 'chrome' });
const errors = [];
const run = async (record) => {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: mobile, isMobile: mobile });
  const page = await ctx.newPage();
  const t0 = Date.now();
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && !/favicon/.test(m.location()?.url || '') && errors.push(m.text()));
  const frames = [];
  const fdir = fs.mkdtempSync(path.join(os.tmpdir(), 'hsframes-'));
  if (record) {
    const cdp = await ctx.newCDPSession(page);
    cdp.on('Page.screencastFrame', async ({ data, metadata, sessionId }) => {
      const f = path.join(fdir, `f${String(frames.length).padStart(5, '0')}.jpg`);
      fs.writeFileSync(f, Buffer.from(data, 'base64'));
      frames.push({ t: metadata.timestamp * 1000 - t0, f });
      cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
    });
    await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 70, everyNthFrame: 1 });
  }
  const segs = await scenarios[slug](page, t0);
  const metrics = await stopMeasure(page);
  await ctx.close();
  if (!record) return { metrics };
  const sheets = [];
  for (const s of segs) {
    const n = Math.max(4, Math.round(s.dur * s.fps));
    const cols = 4, rows = Math.ceil(n / cols);
    const inSeg = frames.filter((fr) => fr.t >= s.from * 1000 && fr.t <= (s.from + s.dur) * 1000);
    if (!inSeg.length) { console.log('no frames for', s.name); continue; }
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hssheet-'));
    for (let k = 0; k < n; k++) {
      const target = s.from * 1000 + (k / (n - 1)) * s.dur * 1000;
      const best = inSeg.reduce((a, b) => (Math.abs(b.t - target) < Math.abs(a.t - target) ? b : a));
      fs.copyFileSync(best.f, path.join(tmp, `s${String(k).padStart(3, '0')}.jpg`));
    }
    const out = `${OUT}${slug}-${w}-motion-${s.name.replace(/\W+/g, '')}.jpg`;
    execFileSync(FFMPEG, ['-loglevel', 'error', '-y', '-i', path.join(tmp, 's%03d.jpg'),
      '-vf', `${s.crop ? `crop=${s.crop},` : ''}scale=${mobile ? 240 : 480}:-2,tile=${cols}x${rows}:padding=4:color=white`, '-frames:v', '1', out]);
    sheets.push(`${out}  (${inSeg.length} frames captured in segment)`);
  }
  return { sheets };
};

const { metrics } = await run(false);
const { sheets } = await run(true);
console.log(JSON.stringify({ slug, size, metrics }));
sheets.forEach((s) => console.log(s));
console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no console errors');
await browser.close();
