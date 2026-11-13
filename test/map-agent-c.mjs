// node test/map-agent-c.mjs [WxH] [--mobile] — інтерактивна перевірка секції #map (Round 2–3; widths = ширини сегментів):
// 1) курсор стоїть над мапою, сторінку скролять до секції → таймер МАЄ стартувати;
// 2) прогрес заповнюється (серія кадрів), автоперехід, пагінація 01/03 синхронна;
// 3) клік по сегменту/картці/стрілці → таймер з нуля; hover над мапою → видима пауза; поза екраном → пауза.
import { chromium } from 'playwright-core';
const size = process.argv.slice(2).find((a) => /x/.test(a)) || '1440x900';
const mobile = process.argv.includes('--mobile');
const [w, h] = size.split('x').map(Number);
const OUT = new URL('../shots/', import.meta.url).pathname;
const browser = await chromium.launch({ channel: 'chrome' });
const page = await (await browser.newContext({ viewport: { width: w, height: h }, hasTouch: mobile, isMobile: mobile })).newPage();
const errors = [];
page.on('console', (m) => m.type() === 'error' && !/favicon/.test(m.location()?.url || '') && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto('http://localhost:8790/?lenis=0', { waitUntil: 'networkidle' });   // ПОВНА сторінка: секція десь унизу
const shot = async (n) => { const f = `${OUT}map-${w}-${n}.png`; await page.screenshot({ path: f }); return f; };
const st = () => page.evaluate(() => ({
  name: document.querySelector('.hsmap__name').textContent,
  widths: [...document.querySelectorAll('.hsmap__step')].map((b) => Math.round(b.getBoundingClientRect().width)).join('/'),
  card: document.querySelector('.hsmap__card.is-active .hsmap__card-btn').textContent,
  step: document.querySelector('.hsmap__step.is-active').dataset.i,
  fill: +getComputedStyle(document.querySelector('.hsmap__step.is-active')).getPropertyValue('--fill') || 0,
  paused: document.getElementById('map').classList.contains('is-paused'),
  status: document.querySelector('.hsmap__status').textContent,
}));
const log = async (label) => console.log(label.padEnd(26), JSON.stringify(await st()));
if (!mobile) await page.mouse.move(w / 2, h / 2);                  // курсор посеред екрана і не рухається
await log('before scroll (offscreen)');
await page.evaluate(() => { const m = document.querySelector('#map .hsmap__map'); scrollTo(0, m.getBoundingClientRect().top + scrollY - innerHeight * 0.3); });
// серія кадрів заповнення таймера (верхня смуга)
const fills = [];
for (let i = 0; i < 8; i++) { await page.waitForTimeout(500); fills.push((await st()).fill.toFixed(2)); if (i === 2 || i === 6) await shot(`timer-${i}`); }
console.log('fill over 4s (cursor resting on map):', fills.join(' '));
await page.waitForTimeout(2600); await log('after 6s → auto next');
await shot('auto-next');
await page.locator('.hsmap__step[data-i="2"]').click(); await page.waitForTimeout(150); await log('click step 3 (reset 0)');
await page.waitForTimeout(700); await shot('flight-mid');
await page.waitForTimeout(1300); await shot('flight-end'); await log('after flight');
if (!mobile) {
  await page.mouse.move(w * 0.3, h * 0.5); await page.mouse.move(w * 0.35, h * 0.55);
  await page.waitForTimeout(300); const a = (await st()).fill; await page.waitForTimeout(800); const b = (await st()).fill;
  await shot('hover-paused'); await log('hover over map'); console.log('  frozen while hovering:', a === b);
  await page.mouse.move(w * 0.5, 5); await page.waitForTimeout(800); await log('mouse left map');
}
await page.locator('.hsmap__btn--next').click(); await page.waitForTimeout(200); await log('click › (reset)');
await page.locator('.hsmap__card[data-i="1"]').click({ position: { x: 20, y: 12 } }); await page.waitForTimeout(800); await log('click card 2');
await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(600); const o1 = (await st()).fill; await page.waitForTimeout(800);
console.log('offscreen frozen:', o1 === (await st()).fill);
console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no console errors');
await browser.close();
