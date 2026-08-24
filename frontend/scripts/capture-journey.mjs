/** Captures the landing journey at key scroll chapters for visual review. */
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const BASE = process.env.BASE_URL || 'http://localhost:4173';
const OUT = resolve(process.cwd(), '../docs/screenshots/journey');
mkdirSync(OUT, { recursive: true });

const initScript = `try { localStorage.setItem('whattocook_language_selected','en'); localStorage.setItem('language','en'); } catch {}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1.5 });
await ctx.addInitScript(initScript);
const page = await ctx.newPage();
await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
await sleep(6000);

const chapters = [
  ['01-arrival', 0.0],
  ['02-fridge-door', 0.17],
  ['03-inside-fridge', 0.27],
  ['04-constellation', 0.4],
  ['05-galaxy', 0.52],
  ['06-cooking', 0.65],
  ['07-dish', 0.82],
  ['08-finale', 0.99],
];

for (const [name, p] of chapters) {
  await page.evaluate((prog) => {
    const max = document.body.scrollHeight - window.innerHeight;
    window.scrollTo(0, max * prog);
  }, p);
  await sleep(2600);
  await page.screenshot({ path: resolve(OUT, `${name}.png`) });
  console.log('captured', name);
}
await browser.close();
console.log('done ->', OUT);
