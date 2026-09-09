import { chromium } from 'playwright';
import fs from 'node:fs';

const OUT = process.env.TI_SHOTS ?? new URL('.', import.meta.url).pathname;
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch(
  process.env.TI_CHROME ? { executablePath: process.env.TI_CHROME } : {},
);
let failures = 0;

async function shot(name, { scenario = 'ready', width = 1600, height = 1000, theme = 'dark', act } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, colorScheme: theme });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await page.goto(`http://127.0.0.1:4319/trading-intelligence?ti=${scenario}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(900);
  if (act) await act(page);
  await page.screenshot({ path: `${OUT}/${name}.png` });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (overflow > 1) { console.log(`FAIL h-overflow ${name}: +${overflow}px`); failures++; }
  const real = errors.filter(e => !/favicon|manifest|Failed to load resource|WebSocket connection to/i.test(e));
  if (real.length) { console.log(`FAIL console ${name}: ${real.slice(0, 3).join(' | ')}`); failures++; }
  const text = await page.locator('body').innerText();
  await ctx.close();
  return text;
}

// 1. loaded, desktop
const ready = await shot('page-ready-dark', {});
const has = (text, needle) => text.toLowerCase().includes(needle.toLowerCase());
for (const must of ['Trading Intelligence', 'Live trading is locked', '$124.40', 'Needs attention', 'Activity tape', 'Controls']) {
  if (!has(ready, must)) { console.log(`FAIL ready missing: ${must}`); failures++; }
}
// the pre-fix bug: strategyGrossPnl must not be blended into the fleet rollup
{
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
  const page = await ctx.newPage();
  await page.goto('http://127.0.0.1:4319/trading-intelligence?ti=ready', { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  const fleet = await page.locator('table').first().innerText();
  if (/412\.50/.test(fleet)) { console.log('FAIL strategyGrossPnl leaked into fleet KPIs'); failures++; }
  if (!/\$124\.40/.test(fleet)) { console.log('FAIL fleet rollup P/L is not $124.40'); failures++; }
  // the per-project panel still shows it, correctly labelled
  const body = await page.locator('body').innerText();
  if (!/412\.50/.test(body)) { console.log('FAIL strategyGrossPnl missing from the project panel'); failures++; }
  await ctx.close();
}
if (!/\$0\.00/.test(ready)) { console.log('FAIL a genuine zero is not rendered as $0.00'); failures++; }
if (/NaN|undefined/.test(ready)) { console.log('FAIL bad formatting on the loaded page'); failures++; }

await shot('page-ready-light', { theme: 'light' });

// 2. one source down
const deg = await shot('page-degraded', { scenario: 'degraded' });
for (const must of ['Stream missing', 'unavailable', 'Khashi VC']) {
  if (!has(deg, must)) { console.log(`FAIL degraded missing: ${must}`); failures++; }
}

// 3. empty
const empty = await shot('page-empty', { scenario: 'empty' });
for (const must of ['No data', 'No blockers reported', 'No recent trading intelligence events found', 'No controls are available']) {
  if (!has(empty, must)) { console.log(`FAIL empty missing: ${must}`); failures++; }
}

// 4. summary error
const err = await shot('page-error', { scenario: 'error' });
if (!has(err, 'Trading intelligence summary is unavailable')) { console.log('FAIL error shell missing'); failures++; }

// 5. mobile
await shot('page-mobile', { width: 390, height: 844 });

// 6. control preview -> execute
const dlg = await shot('page-control-dialog', {
  act: async (page) => {
    await page.getByRole('button', { name: /Pause Collection/ }).first().click();
    await page.waitForTimeout(400);
    await page.locator('#ti-control-reason').fill('Storage pressure review before the next collection window.');
    await page.getByRole('button', { name: /^Preview$/ }).click();
    await page.waitForTimeout(500);
  },
});
if (!/"execute": false/.test(dlg)) { console.log('FAIL preview did not send execute:false'); failures++; }
if (!/high risk/i.test(dlg)) { console.log('FAIL derived risk level not shown'); failures++; }
if (!/Confirm to send execute:true/i.test(dlg)) { console.log('FAIL preview->execute gating copy missing'); failures++; }

const done = await shot('page-control-executed', {
  act: async (page) => {
    await page.getByRole('button', { name: /Pause Collection/ }).first().click();
    await page.waitForTimeout(400);
    const exec = page.getByRole('button', { name: /Execute Pause Collection/ });
    await page.locator('#ti-control-reason').fill('ab');
    await page.getByRole('button', { name: /^Preview$/ }).click();
    await page.waitForTimeout(400);
    if (await exec.isEnabled()) { console.log('FAIL execute enabled with a too-short reason'); failures++; }
    await page.locator('#ti-control-reason').fill('Storage pressure review before the next collection window.');
    await page.waitForTimeout(200);
    await exec.click();
    await page.waitForTimeout(600);
  },
});
if (!/"execute": true/.test(done)) { console.log('FAIL execute did not send execute:true'); failures++; }
if (!/proxied \+ source confirmed/i.test(done)) { console.log('FAIL execution success not verified from the source result'); failures++; }

await browser.close();
console.log(failures ? `\n${failures} FAILURE(S)` : '\nAll page checks passed');
process.exit(failures ? 1 : 0);
