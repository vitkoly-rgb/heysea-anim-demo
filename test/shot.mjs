// node test/shot.mjs <slug> [progress list, e.g. 0,0.25,0.5,1] [WxH] [--mobile]
// Відкриває ?only=<slug>&lenis=0, скролить секцію #<slug> на частки її висоти (з урахуванням pin-spacer),
// робить скріни у shots/<slug>-<w>-<p>.png і друкує помилки консолі.
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const [slug, list = '0,0.5,1', size = '1440x900'] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const mobile = process.argv.includes('--mobile');
const [w, h] = size.split('x').map(Number);
const OUT = new URL('../shots/', import.meta.url).pathname; fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' }).catch(() => chromium.launch());
const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: mobile, isMobile: mobile });
const page = await ctx.newPage();
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(`http://localhost:8790/?only=${slug}&lenis=0`, { waitUntil: 'networkidle' });
await page.waitForTimeout(700);
const range = await page.evaluate((id) => {
  const el = document.getElementById(id); if (!el) return null;
  const box = (el.closest('.pin-spacer') || el);
  const top = box.getBoundingClientRect().top + scrollY;
  return { top, scrollable: Math.max(box.offsetHeight - innerHeight, 0) };
}, slug);
if (!range) { console.log('NO SECTION #' + slug); process.exit(1); }
for (const p of list.split(',').map(Number)) {
  await page.evaluate((y) => window.scrollTo(0, y), Math.round(range.top + p * range.scrollable));
  await page.waitForTimeout(900);
  const f = `${OUT}${slug}-${w}-${String(p).replace('.', '_')}.png`;
  await page.screenshot({ path: f });
  console.log(f);
}
console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no console errors');
await browser.close();
