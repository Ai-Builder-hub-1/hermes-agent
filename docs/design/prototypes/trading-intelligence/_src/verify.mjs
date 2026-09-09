import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const dist = '/home/claude/ti-proto/dist';
const shots = '/home/claude/ti-proto/shots';
fs.mkdirSync(shots, { recursive: true });

const FILES = fs.readdirSync(dist).filter(f => f.endsWith('.html')).sort();
const STATES = ['ready', 'loading', 'degraded', 'empty', 'error'];

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let failures = 0;

for (const file of FILES) {
  const short = file.replace(/^variant-|\.html$/g, '').slice(0, 12);
  for (const [vp, w, h] of [['desktop', 1440, 940], ['mobile', 390, 844]]) {
    for (const theme of ['light', 'dark']) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: theme, deviceScaleFactor: 1 });
      const page = await ctx.newPage();
      const errors = [];
      page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
      page.on('pageerror', e => errors.push('pageerror: ' + e.message));
      await page.goto('file://' + path.join(dist, file));
      await page.waitForTimeout(220);

      // exercise every prototype state, and every tab/filter/dialog on the way
      for (const st of STATES) {
        const btn = page.locator('.statebar button', { hasText: new RegExp(`^${{ready:'Loaded',loading:'Loading',degraded:'One source down',empty:'Empty',error:'Summary error'}[st]}$`) });
        if (await btn.count()) { await btn.first().click(); await page.waitForTimeout(120); }
        const hOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        if (hOverflow > 1) { console.log(`FAIL h-overflow ${file} ${vp}/${theme}/${st}: +${hOverflow}px`); failures++; }
        if (st === 'ready' && vp === 'desktop' && theme === 'light') {
          await page.screenshot({ path: path.join(shots, `${short}-${vp}-${theme}.png`), fullPage: false });
        }
        if (st === 'degraded' && vp === 'desktop' && theme === 'dark') {
          await page.screenshot({ path: path.join(shots, `${short}-degraded-dark.png`), fullPage: false });
        }
        if (st === 'ready' && vp === 'mobile' && theme === 'light') {
          await page.screenshot({ path: path.join(shots, `${short}-mobile.png`), fullPage: false });
        }
      }

      // back to ready and click through tabs / chips / a control dialog
      const loaded = page.locator('.statebar button', { hasText: /^Loaded$/ });
      if (await loaded.count()) { await loaded.first().click(); await page.waitForTimeout(120); }

      const tabs = page.locator('nav.tabs button');
      for (let i = 0; i < await tabs.count(); i++) { await tabs.nth(i).click(); await page.waitForTimeout(90); }

      const chips = page.locator('.chip');
      for (let i = 0; i < Math.min(4, await chips.count()); i++) { await chips.nth(i).click(); await page.waitForTimeout(70); }

      // control preview -> execute round trip
      const opener = page.locator('button:has-text("Preview…"), .ctlbtn').first();
      if (await opener.count()) {
        await opener.click(); await page.waitForTimeout(160);
        const dlg = page.locator('.dialog');
        if (await dlg.count()) {
          await page.locator('.dialog textarea').fill('Verification pass — checking preview-then-execute gating.');
          await page.locator('.dialog button:has-text("Preview")').click(); await page.waitForTimeout(140);
          const exec = page.locator('.dialog footer button').last();
          const label = (await exec.textContent()) || '';
          if (!/Execute/i.test(label)) { console.log(`FAIL no execute step ${file} ${vp}/${theme} (saw "${label.trim()}")`); failures++; }
          else {
            await exec.click(); await page.waitForTimeout(160);
            const body = await page.locator('.dialog .body').innerText();
            if (!/execute.*true|"execute": true/is.test(body)) { console.log(`FAIL execute payload missing ${file} ${vp}/${theme}`); failures++; }
          }
          await page.keyboard.press('Escape'); await page.waitForTimeout(90);
        }
      }

      if (errors.length) { console.log(`FAIL console ${file} ${vp}/${theme}: ${errors.slice(0,3).join(' | ')}`); failures++; }
      await ctx.close();
    }
  }
  console.log(`checked ${file}`);
}

// contract assertions on the rendered "ready" page
const ctx = await browser.newContext({ viewport: { width: 1440, height: 940 } });
const page = await ctx.newPage();
for (const file of FILES) {
  await page.goto('file://' + path.join(dist, file));
  await page.waitForTimeout(200);
  const text = await page.locator('body').innerText();
  if (!/Live trading is locked|Live trading locked/i.test(text)) { console.log(`FAIL ${file}: no live-lock copy`); failures++; }
  if (/\$-|\$NaN|undefined|NaN/.test(text)) { console.log(`FAIL ${file}: bad number formatting in output`); failures++; }
  // realized P/L is 0 + 124.4 — the pre-fix `or` chain would have blended in -412.50
  if (!/\$124\.40/.test(text)) { console.log(`FAIL ${file}: aggregated realized P/L not rendered as $124.40`); failures++; }
  // scope to the fleet rollup only — per-project panels legitimately show strategyGrossPnl
  const RIBBON = { 'variant-a-tabbed-command-center.html': '.ribbon', 'variant-b-dense-grid.html': 'table.matrix',
                   'variant-c-split-comparison.html': '.fleet', 'variant-d-event-stream-console.html': '.minilist' }[file];
  const ribbon = await page.locator(RIBBON).first().innerText();
  if (/412\.50/.test(ribbon)) { console.log(`FAIL ${file}: strategyGrossPnl leaked into the fleet rollup`); failures++; }
  if (!/\$124\.40/.test(ribbon)) { console.log(`FAIL ${file}: fleet rollup P/L is not $124.40`); failures++; }

  // the null path: in the Empty state several KPIs are null and must read "No data", never 0
  await page.locator('.statebar button', { hasText: /^Empty$/ }).first().click();
  await page.waitForTimeout(220);
  const emptyText = await page.locator('body').innerText();
  if (!/No data/.test(emptyText)) { console.log(`FAIL ${file}: null KPI did not render as "No data" in the empty state`); failures++; }
  if (!/No recent trading intelligence events found/.test(emptyText)) { console.log(`FAIL ${file}: empty events copy missing`); failures++; }
  // a genuine zero must still read 0, not "No data"
  if (!/\b0\b/.test(emptyText)) { console.log(`FAIL ${file}: genuine zero not rendered`); failures++; }
}
await ctx.close();
await browser.close();
console.log(failures ? `\n${failures} FAILURE(S)` : '\nAll checks passed');
process.exit(failures ? 1 : 0);
