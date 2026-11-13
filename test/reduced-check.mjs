// node test/reduced-check.mjs — screenshots of agent-B sections with prefers-reduced-motion: reduce.
import { chromium } from 'playwright-core';
const OUT = new URL('../shots/', import.meta.url).pathname;
const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => m.type() === 'error' && !/favicon/.test(m.location()?.url || '') && errors.push(m.text()));
for (const slug of ['timeline', 'wave-steps', 'cta-orbits']) {
  await page.goto(`http://localhost:8790/?only=${slug}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  if (slug === 'timeline') { await page.click('.tl-next'); await page.waitForTimeout(100); }
  const f = `${OUT}${slug}-1440-reduced.png`; await page.screenshot({ path: f, fullPage: slug === 'wave-steps' }); console.log(f);
}
console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no console errors (favicon ignored)');
await browser.close();
