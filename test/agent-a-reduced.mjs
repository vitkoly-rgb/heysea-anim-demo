// node test/agent-a-reduced.mjs — renders agent-A sections with prefers-reduced-motion: reduce and
// the full page (all sections) to check for console errors.
import { chromium } from 'playwright-core';
const OUT = new URL('../shots/', import.meta.url).pathname;
const browser = await chromium.launch({ channel: 'chrome' });
const errors = [];
for (const slug of ['our-yachts', 'series-cursor', 'before-after', 'qr']) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  page.on('pageerror', (e) => errors.push(slug + ': ' + e));
  await page.goto(`http://localhost:8790/?only=${slug}`, { waitUntil: 'networkidle' });
  await page.evaluate((id) => document.getElementById(id).scrollIntoView(), slug);
  await page.waitForTimeout(500);
  const info = await page.evaluate((id) => ({ pinSpacer: !!document.getElementById(id).closest('.pin-spacer'), h: document.getElementById(id).offsetHeight }), slug);
  console.log(slug, 'reduced:', JSON.stringify(info));
  await page.screenshot({ path: `${OUT}${slug}-reduced.png` });
  await page.close();
}
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('pageerror', (e) => errors.push('full: ' + e));
page.on('console', (m) => m.type() === 'error' && !/404/.test(m.text()) && errors.push('full console: ' + m.text()));
await page.goto('http://localhost:8790/', { waitUntil: 'networkidle' });
const H = await page.evaluate(() => document.body.scrollHeight);
for (let y = 0; y < H; y += 600) { await page.mouse.wheel(0, 600); await page.waitForTimeout(60); }
await page.waitForTimeout(500);
console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no page errors (reduced + full page)');
await browser.close();
