// node test/ws-crossing.mjs [WxH] [--mobile] — wave-steps: scroll to the exact moment the stroke should reach each node,
// log progressLen vs nodeLen + node state, and save a crop around the node.
import { chromium } from 'playwright-core';
const size = process.argv.slice(2).find((a) => /^\d+x\d+$/.test(a)) || '1440x900';
const mobile = process.argv.includes('--mobile');
const tag = process.argv.find((a) => a.startsWith('--tag='))?.slice(6) || '';
const [w, h] = size.split('x').map(Number);
const OUT = new URL('../shots/', import.meta.url).pathname;
const browser = await chromium.launch({ channel: 'chrome' });
const page = await (await browser.newContext({ viewport: { width: w, height: h }, isMobile: mobile, hasTouch: mobile })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto('http://localhost:8790/?only=wave-steps&lenis=0', { waitUntil: 'networkidle' });
await page.waitForTimeout(500);
const info = await page.evaluate(() => {
  const st = ScrollTrigger.getAll().find((s) => s.trigger && s.trigger.id === 'wave-steps');
  return { start: st.start, end: st.end };
});
for (const [k, frac] of [[1, 1 / 3], [2, 2 / 3]]) {
  for (const [lbl, d] of [['before', -0.02], ['at', 0.004]]) {
    await page.evaluate((y) => scrollTo(0, y), Math.round(info.start + (frac + d) * (info.end - info.start)));
    await page.waitForTimeout(1500); // let scrub settle
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    const r = await page.evaluate((k) => {
      const prog = document.querySelector('.ws-progress');
      const total = prog.getTotalLength();
      const L = total - parseFloat(prog.style.strokeDashoffset);
      const node = document.querySelectorAll('.ws-node')[k];
      const c = node.querySelector('.ws-node__circle').getBoundingClientRect();
      return { L: +L.toFixed(1), nodeLen: +window.__wsNodeLen?.[k]?.toFixed(1), state: node.className, cx: c.left + c.width / 2, cy: c.top + c.height / 2 };
    }, k);
    console.log(`node ${k} ${lbl}:`, JSON.stringify(r));
    const s = 90;
    await page.screenshot({ path: `${OUT}ws-cross-${w}-n${k}-${lbl}${tag}.png`, clip: { x: Math.max(r.cx - s * 1.5, 0), y: Math.max(r.cy - s, 0), width: s * 3, height: s * 2 } });
  }
}
console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no console errors');
await browser.close();
