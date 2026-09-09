import { chromium } from 'playwright';
import fs from 'node:fs';

const OUT = process.env.HT_SHOTS ?? new URL('.', import.meta.url).pathname;
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch(
  process.env.HT_CHROME ? { executablePath: process.env.HT_CHROME } : {},
);
let failures = 0;
const fail = (m) => { console.log(`FAIL ${m}`); failures++; };
const has = (t, n) => t.toLowerCase().includes(n.toLowerCase());

async function open(scenario = 'ready', { width = 1600, height = 1000 } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, colorScheme: 'dark' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  await page.goto(`http://127.0.0.1:4320/head-trader?ht=${scenario}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  return { ctx, page, errors };
}

async function finish(name, { ctx, page, errors }) {
  await page.screenshot({ path: `${OUT}/${name}.png` });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (overflow > 1) fail(`h-overflow ${name}: +${overflow}px`);
  const real = errors.filter((e) => !/favicon|manifest|Failed to load resource|WebSocket connection to/i.test(e));
  if (real.length) fail(`console ${name}: ${real.slice(0, 2).join(' | ')}`);
  const text = await page.locator('body').innerText();
  await ctx.close();
  return text;
}

// ── 1. loaded ──────────────────────────────────────────────────────────────
{
  const s = await open();
  const text = await finish('ht-ready', s);
  for (const must of ['Head Trader', 'Live trading locked', 'Incident queue', 'Conversation', 'Action & risk', 'Channels', 'Audit',
                      'OANDA Desk', 'Khashi Perpetual Desk', 'Cross-System Risk', 'cannot submit a live broker order']) {
    if (!has(text, must)) fail(`ready missing: ${must}`);
  }
  // worst first, and waiting-on-human ahead of untouched
  const queueFirst = text.indexOf('Khashi VC needs attention');
  const queueSecond = text.indexOf('Investing System needs attention');
  if (queueFirst < 0 || queueSecond < 0 || queueFirst > queueSecond) fail('queue is not ordered worst-first');
  if (/NaN|undefined/.test(text)) fail('bad formatting on the loaded page');
}

// ── 2. the safety rules, on a selected incident ─────────────────────────────
{
  const s = await open();
  const { page } = s;
  await page.getByText('Khashi VC needs attention').first().click();
  await page.waitForTimeout(400);

  // forbidden and hard-gate render, disabled, with the reason
  const forbidden = page.getByRole('button', { name: /^Forbidden$/ });
  const hardGate = page.getByRole('button', { name: /Hard gate required/ });
  if (!(await forbidden.count())) fail('the forbidden live-order action is not rendered at all');
  else if (await forbidden.first().isEnabled()) fail('the forbidden action is clickable');
  if (!(await hardGate.count())) fail('the hard-gate action is not rendered');
  else if (await hardGate.first().isEnabled()) fail('the hard-gate action is clickable');

  const text = await finish('ht-incident-selected', s);
  if (!has(text, 'Source evidence')) fail('evidence toggle missing');
  if (!has(text, 'Head Trader recommends')) fail('recommendation missing');
}

// ── 3. free-form reply -> interpretation, never execution ───────────────────
{
  const s = await open();
  const { page } = s;
  await page.getByText('Khashi VC needs attention').first().click();
  await page.waitForTimeout(300);
  await page.locator('textarea').first().fill('run the freshness proof');
  await page.getByRole('button', { name: /^Send$/ }).click();
  await page.waitForTimeout(600);
  const text = await finish('ht-reply-interpreted', s);
  if (!has(text, 'Interpreted as')) fail('interpretation is not shown after a reply');
  if (!has(text, 'Confirmation is still required')) fail('reply did not insist on confirmation');
  if (!has(text, 'waiting for confirmation')) fail('decision is not waiting for confirmation');
  if (has(text, 'Backend result')) fail('a reply produced a backend result — text executed something');
}

// ── 4. a refusal proposes nothing ──────────────────────────────────────────
{
  const s = await open();
  const { page } = s;
  await page.getByText('Khashi VC needs attention').first().click();
  await page.waitForTimeout(300);
  await page.locator('textarea').first().fill("no, don't pause it yet");
  await page.getByRole('button', { name: /^Send$/ }).click();
  await page.waitForTimeout(600);
  const text = await finish('ht-reply-declined', s);
  if (!has(text, 'decline')) fail('a refusal was not surfaced as a decline');
  if (has(text, 'waiting for confirmation')) fail('a refusal created a confirmable decision');
}

// ── 5. cross-desk request is refused, not silently retargeted ──────────────
{
  const s = await open();
  const { page } = s;
  await page.getByText('Investing System needs attention').first().click();
  await page.waitForTimeout(300);
  await page.locator('textarea').first().fill('run the freshness proof');
  await page.getByRole('button', { name: /^Send$/ }).click();
  await page.waitForTimeout(600);
  const text = await finish('ht-cross-desk-refused', s);
  if (!has(text, 'unsupported for desk') && !has(text, 'not available')) fail('cross-desk request was not refused');
  if (has(text, 'Khashi freshness proof')) fail('an OANDA incident proposed a Khashi control');
}

// ── 6. confirm gate: reason required, then routed ──────────────────────────
{
  const s = await open();
  const { page } = s;
  await page.getByText('Khashi VC needs attention').first().click();
  await page.waitForTimeout(300);
  await page.getByRole('button', { name: /^Draft decision$/ }).first().click();
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: /Confirm…/ }).click();
  await page.waitForTimeout(400);

  const go = page.getByRole('button', { name: /^Confirm$/ });
  if (await go.isEnabled()) fail('confirm is enabled with no reason typed');
  await page.locator('#ht-confirm-reason').fill('ab');
  await page.waitForTimeout(150);
  if (await go.isEnabled()) fail('confirm is enabled with a too-short reason');

  const dialogText = await page.locator('[role="dialog"]').innerText();
  if (!has(dialogText, 'Risk decision')) fail('confirm dialog does not show the risk decision');
  if (!has(dialogText, 'execute:true')) fail('confirm dialog does not say what it will route');

  await page.locator('#ht-confirm-reason').fill('Storage pressure review before the next collection window.');
  await page.waitForTimeout(150);
  await page.screenshot({ path: `${OUT}/ht-confirm-dialog.png` });
  await go.click();
  await page.waitForTimeout(800);

  // an executed decision must not be confirmable again — check before the
  // context is torn down by finish()
  const again = page.getByRole('button', { name: /Confirm…/ });
  if ((await again.count()) && (await again.first().isEnabled())) fail('an executed decision is still confirmable');

  const text = await finish('ht-confirm-executed', s);
  if (!has(text, 'executed')) fail('decision did not reach executed');
  if (!has(text, 'Backend result')) fail('backend result not shown after routing');
  if (!has(text, 'proxied')) fail('routed result is not proxied');
}

// ── 6b. a reply-driven confirm repeats the interpretation in the dialog ────
{
  const s = await open();
  const { page } = s;
  await page.getByText('Khashi VC needs attention').first().click();
  await page.waitForTimeout(300);
  await page.locator('textarea').first().fill('run the freshness proof');
  await page.getByRole('button', { name: /^Send$/ }).click();
  await page.waitForTimeout(600);
  await page.getByRole('button', { name: /Confirm…/ }).click();
  await page.waitForTimeout(400);
  const dialogText = await page.locator('[role="dialog"]').innerText();
  if (!has(dialogText, 'You are approving this interpretation')) fail('confirm dialog does not repeat the interpretation');
  if (!has(dialogText, 'Confirmation is still required')) fail('interpretation text missing from the dialog');
  await page.screenshot({ path: `${OUT}/ht-confirm-from-reply.png` });
  await finish('ht-confirm-from-reply-full', s);
}

// ── 7. empty / error / mobile ──────────────────────────────────────────────
{
  const text = await finish('ht-empty', await open('empty'));
  if (!has(text, 'No open incidents')) fail('empty state copy missing');
}
{
  const text = await finish('ht-error', await open('error'));
  if (!has(text, 'Head Trader is unavailable')) fail('error shell missing');
}
{
  await finish('ht-mobile', await open('ready', { width: 390, height: 844 }));
}

await browser.close();
console.log(failures ? `\n${failures} FAILURE(S)` : '\nAll Head Trader page checks passed');
process.exit(failures ? 1 : 0);
