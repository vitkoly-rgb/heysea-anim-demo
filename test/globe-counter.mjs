// node test/globe-counter.mjs — globe: stats centred, counter fires once when stats are centred
import { chromium } from 'playwright-core';
const OUT = new URL('../shots/', import.meta.url).pathname;
const browser = await chromium.launch({ channel: 'chrome', headless: true });
for (const [w, h] of [[1440, 900], [375, 812]]) {
  const page = await (await browser.newContext({ viewport: { width: w, height: h } })).newPage();
  const errors = []; page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('http://localhost:8790/?only=globe', { waitUntil: 'networkidle' });
  await page.mouse.move(w / 2, h / 2);
  const read = () => page.evaluate(() => {
    const st = document.querySelector('.globe__stats'); const r = st.getBoundingClientRect();
    return { op: +getComputedStyle(st).opacity, mid: Math.round(r.top + r.height / 2), vals: [...st.querySelectorAll('[data-count]')].map((e) => e.textContent).join('/') };
  });
  const log = [];
  for (let i = 0; i < 140; i++) {
    await page.mouse.wheel(0, 40); await page.waitForTimeout(40);
    if (i % 10 === 9) log.push(await read());
    if (i === 95) await page.screenshot({ path: `${OUT}globe-stats-${w}-a.png` });
  }
  await page.waitForTimeout(2200);
  log.push(await read());
  await page.screenshot({ path: `${OUT}globe-stats-${w}-final.png` });
  // scroll back up a bit and down again: values must stay final
  for (let i = 0; i < 20; i++) { await page.mouse.wheel(0, -40); await page.waitForTimeout(30); }
  for (let i = 0; i < 20; i++) { await page.mouse.wheel(0, 40); await page.waitForTimeout(30); }
  await page.waitForTimeout(600);
  log.push(await read());
  console.log(w, 'vh/2=', h / 2, JSON.stringify(log), 'errors:', errors);
}
await browser.close();
