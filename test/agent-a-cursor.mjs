// node test/agent-a-cursor.mjs — moves the mouse inside #series-cursor and screenshots the water cursor
// at rest, mid-slosh and after settling (crops around the cursor).
import { chromium } from 'playwright-core';
const OUT = new URL('../shots/', import.meta.url).pathname;
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
await page.goto('http://localhost:8790/?only=series-cursor&lenis=0', { waitUntil: 'networkidle' });
await page.mouse.move(700, 450);
await page.waitForTimeout(1500);
const crop = (x, y) => ({ x: x - 60, y: y - 60, width: 260, height: 120 });
await page.screenshot({ path: OUT + 'series-cursor-water-rest.png', clip: crop(700, 450) });
// fast horizontal swipe then shoot during the slosh
for (let i = 0; i <= 10; i++) { await page.mouse.move(700 - i * 40, 450); await page.waitForTimeout(16); }
for (let i = 0; i <= 10; i++) { await page.mouse.move(300 + i * 50, 450 + (i % 2) * 10); await page.waitForTimeout(16); }
await page.waitForTimeout(60);
const p = await page.evaluate(() => { const m = document.querySelector('.sc-cursor').style.transform.match(/([\d.-]+)px, ([\d.-]+)px/); return { x: +m[1] + 32, y: +m[2] + 32 }; });
await page.screenshot({ path: OUT + 'series-cursor-water-slosh.png', clip: crop(Math.round(p.x), Math.round(p.y)) });
await page.waitForTimeout(250);
const p2 = await page.evaluate(() => { const m = document.querySelector('.sc-cursor').style.transform.match(/([\d.-]+)px, ([\d.-]+)px/); return { x: +m[1] + 32, y: +m[2] + 32 }; });
await page.screenshot({ path: OUT + 'series-cursor-water-slosh2.png', clip: crop(Math.round(p2.x), Math.round(p2.y)) });
await page.waitForTimeout(2500);
await page.screenshot({ path: OUT + 'series-cursor-water-settled.png', clip: crop(Math.round(p2.x), Math.round(p2.y)) });
await page.screenshot({ path: OUT + 'series-cursor-water-full.png' });
// small, slow movement (≈40px over ~250ms) should already ripple
for (let i = 0; i <= 8; i++) { await page.mouse.move(p2.x + i * 5, p2.y + (i % 2) * 2); await page.waitForTimeout(30); }
await page.waitForTimeout(40);
const p3 = await page.evaluate(() => { const m = document.querySelector('.sc-cursor').style.transform.match(/([\d.-]+)px, ([\d.-]+)px/); return { x: +m[1] + 32, y: +m[2] + 32 }; });
await page.screenshot({ path: OUT + 'series-cursor-water-small.png', clip: crop(Math.round(p3.x), Math.round(p3.y)) });
await page.waitForTimeout(3000);
await page.screenshot({ path: OUT + 'series-cursor-water-settled2.png', clip: crop(Math.round(p3.x), Math.round(p3.y)) });
console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no console errors');
await browser.close();
