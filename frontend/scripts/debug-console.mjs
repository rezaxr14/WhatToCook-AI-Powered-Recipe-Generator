import { chromium } from 'playwright';

const base = process.env.BASE_URL || 'http://localhost:4173';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
page.on('console', (m) => {
  if (m.type() === 'error' || m.type() === 'warning') console.log(`[${m.type()}]`, m.text().slice(0, 500));
});
page.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 800)));
page.on('requestfailed', (r) => console.log('[requestfailed]', r.url(), r.failure()?.errorText));
await page.goto(base, { waitUntil: 'networkidle', timeout: 30000 }).catch((e) => console.log('goto failed', e));
await page.waitForTimeout(4000);
const html = await page.evaluate(() => document.body.innerHTML.length);
console.log('body html length:', html);
await page.screenshot({ path: 'debug-landing.png' });
await browser.close();
