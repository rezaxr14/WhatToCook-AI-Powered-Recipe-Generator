/**
 * Captures product screenshots for docs/screenshots/ and the README gallery.
 * Requires the Docker stack running at http://localhost:4173.
 *
 *   node scripts/capture-screenshots.mjs
 */
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const BASE = process.env.BASE_URL || 'http://localhost:4173';
const OUT = resolve(process.cwd(), '../docs/screenshots');
mkdirSync(OUT, { recursive: true });

const initScript = `
  try { localStorage.setItem('whattocook_language_selected', 'en'); } catch {}
`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const shots = [
  { file: 'landing-hero.png', path: '/', viewport: { width: 1600, height: 900 }, fullPage: false, settle: 4200 },
  { file: 'landing-full.png', path: '/', viewport: { width: 1600, height: 900 }, fullPage: true, settle: 4200 },
  { file: 'recipes-catalog.png', path: '/recipes', viewport: { width: 1600, height: 900 }, fullPage: false, settle: 2500 },
  { file: 'ai-chef-studio.png', path: '/ai-chef', viewport: { width: 1600, height: 900 }, fullPage: false, settle: 2500 },
  { file: 'pantry-shelf.png', path: '/pantry', viewport: { width: 1600, height: 900 }, fullPage: false, settle: 2500 },
  { file: 'can-cook.png', path: '/can-cook', viewport: { width: 1600, height: 900 }, fullPage: false, settle: 2500 },
  { file: 'sign-in.png', path: '/auth', viewport: { width: 1600, height: 900 }, fullPage: false, settle: 1800 },
  { file: 'landing-mobile.png', path: '/', viewport: { width: 390, height: 844 }, fullPage: false, settle: 4200, mobile: true },
];

const browser = await chromium.launch();
try {
  for (const s of shots) {
    const ctx = await browser.newContext({
      viewport: s.viewport,
      deviceScaleFactor: 2,
      isMobile: !!s.mobile,
      hasTouch: !!s.mobile,
    });
    await ctx.addInitScript(initScript);
    const page = await ctx.newPage();
    await page.goto(BASE + s.path, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
    await sleep(s.settle);
    await page.screenshot({ path: resolve(OUT, s.file), fullPage: s.fullPage });
    console.log('captured', s.file);
    await ctx.close();
  }
} finally {
  await browser.close();
}
console.log('done ->', OUT);
