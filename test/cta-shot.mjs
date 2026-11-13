// node test/cta-shot.mjs [WxH] [--mobile] — CTA: text fill at 3 scroll positions + orbit motion over time.
import { chromium } from 'playwright-core';
const size = process.argv.slice(2).find((a) => /x/.test(a)) || '1440x900';
const mobile = process.argv.includes('--mobile');
const [w, h] = size.split('x').map(Number);
const OUT = new URL('../shots/', import.meta.url).pathname;
const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: mobile, isMobile: mobile, reducedMotion: process.argv.includes('--reduced') ? 'reduce' : 'no-preference' });
const page = await ctx.newPage();
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text() + ' ' + (m.location()?.url || '')));
page.on('pageerror', (e) => errors.push(String(e)));
// Prepend spacer so the CTA can scroll in from below
await page.goto(`http://localhost:8790/?only=cta-orbits&lenis=0`, { waitUntil: 'networkidle' });
await page.evaluate(() => { const d = document.createElement('div'); d.style.height = '100vh'; document.querySelector('main').prepend(d); window.ScrollTrigger && ScrollTrigger.refresh(); });
const tag = process.argv.includes('--reduced') ? '-reduced' : '';
for (const [name, frac] of [['fill0', 0.95], ['fill50', 0.62], ['fill100', 0.3]]) {
  await page.evaluate((f) => { const em = document.querySelector('.cta-em'); const top = em.getBoundingClientRect().top + scrollY; scrollTo(0, top - innerHeight * f); }, frac);
  await page.waitForTimeout(900);
  const f = `${OUT}cta-orbits-${w}${tag}-${name}.png`; await page.screenshot({ path: f }); console.log(f);
}
await page.evaluate(() => { const s = document.getElementById('cta-orbits'); scrollTo(0, s.getBoundingClientRect().top + scrollY - (innerHeight - s.offsetHeight) / 2); });
await page.waitForTimeout(600);
const s1 = `${OUT}cta-orbits-${w}${tag}-t0.png`; await page.screenshot({ path: s1 }); console.log(s1);
await page.waitForTimeout(4000);
const s2 = `${OUT}cta-orbits-${w}${tag}-t4.png`; await page.screenshot({ path: s2 }); console.log(s2);
console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no console errors');
await browser.close();
