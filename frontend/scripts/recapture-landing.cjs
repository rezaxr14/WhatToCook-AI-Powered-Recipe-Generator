const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 } });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    try { localStorage.setItem('whattocook_language_selected', 'en'); localStorage.setItem('language', 'en'); } catch {}
  });
  const OUT = '/home/user/WhatToCook/docs/screenshots';
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'load', timeout: 60000 });
  await page.waitForSelector('text=Preparing your kitchen', { state: 'hidden', timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(6000);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/landing-hero.png` });
  // full page
  await page.screenshot({ path: `${OUT}/landing-full.png`, fullPage: true });
  console.log('desktop done');
  await browser.close();

  // mobile
  const b2 = await chromium.launch();
  const c2 = await b2.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true });
  const p2 = await c2.newPage();
  await p2.addInitScript(() => {
    try { localStorage.setItem('whattocook_language_selected', 'en'); localStorage.setItem('language', 'en'); } catch {}
  });
  await p2.goto('http://127.0.0.1:5173/', { waitUntil: 'load', timeout: 60000 });
  await p2.waitForSelector('text=Preparing your kitchen', { state: 'hidden', timeout: 60000 }).catch(() => {});
  await p2.waitForTimeout(7000);
  await p2.evaluate(() => window.scrollTo(0, 0));
  await p2.waitForTimeout(2000);
  await p2.screenshot({ path: `${OUT}/landing-mobile.png` });
  console.log('mobile done');
  await b2.close();
})();
