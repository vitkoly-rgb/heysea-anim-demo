// node test/tl-interact.mjs [WxH] [--mobile] — timeline: click next (mid + end), drag dial, keyboard, autoplay.
import { chromium } from 'playwright-core';
const size = process.argv.slice(2).find((a) => /x/.test(a)) || '1440x900';
const mobile = process.argv.includes('--mobile');
const [w, h] = size.split('x').map(Number);
const OUT = new URL('../shots/', import.meta.url).pathname;
const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: mobile, isMobile: mobile });
const page = await ctx.newPage();
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text() + ' ' + (m.location()?.url || '')));
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(`http://localhost:8790/?only=timeline&lenis=0`, { waitUntil: 'networkidle' });
await page.mouse.move(w - 5, h - 5);
await page.waitForTimeout(500);
const shot = async (n) => { const f = `${OUT}timeline-${w}-${n}.png`; await page.screenshot({ path: f }); console.log(f); };
const state = () => page.evaluate(() => [document.querySelector('.tl-counter__cur').textContent, document.querySelector('.tl-dial').getAttribute('aria-valuenow')].join(' '));
await page.click('.tl-next'); await page.mouse.move(w - 5, h - 5);
await page.waitForTimeout(250); await shot('next-a');
await page.waitForTimeout(250); await shot('next-mid');
await page.waitForTimeout(250); await shot('next-c');
await page.waitForTimeout(1200); await shot('next-end');
console.log('flyers left after flight:', await page.evaluate(() => document.querySelectorAll('.tl-fly').length)); console.log('after next', await state());
await page.click('.tl-prev'); await page.waitForTimeout(500); await shot('prev-mid'); await page.waitForTimeout(1500);
await page.click('.tl-prev'); await page.waitForTimeout(250); await page.click('.tl-prev'); await page.waitForTimeout(1800);
console.log('flyers after rapid clicks:', await page.evaluate(() => document.querySelectorAll('.tl-fly').length)); console.log('after 2x prev', await state());
// click a visible small year
const btn = await page.evaluateHandle(() => [...document.querySelectorAll('.tl-year')].find((b) => b.style.visibility !== 'hidden' && +b.style.opacity > 0.3));
await btn.click(); await page.waitForTimeout(1800); console.log('after year click', await state());
await page.mouse.move(w - 5, h - 5);
// drag (mouse) on dial right side upward = counter-clockwise
if (!mobile) {
  const box = await page.locator('.tl-dial').boundingBox();
  const cx = box.x + box.width / 2, cy = box.y + box.height / 2, r = box.width * 0.39;
  await page.mouse.move(cx + r, cy); await page.mouse.down();
  for (let t = 0; t <= 1; t += 0.1) { const a = -t * 0.9; await page.mouse.move(cx + r * Math.cos(a), cy + r * Math.sin(a)); await page.waitForTimeout(16); }
  await shot('drag'); await page.mouse.up(); await page.waitForTimeout(1600); console.log('after drag', await state());
  await page.mouse.move(w - 5, h - 5);
}
await page.focus('.tl-dial'); await page.keyboard.press('Home'); await page.waitForTimeout(2000); console.log('after Home', await state());
await page.keyboard.press('ArrowRight'); await page.waitForTimeout(1500); console.log('after ArrowRight', await state());
await page.evaluate(() => document.activeElement.blur());
await page.mouse.move(w - 5, h - 5);
await page.waitForTimeout(4200); await shot('timer-half');
await page.waitForTimeout(5500); console.log('after autoplay ~9.7s', await state()); await shot('auto');
console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no console errors');
await browser.close();
