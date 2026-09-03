const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 } });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    try { localStorage.setItem('whattocook_language_selected', 'en'); localStorage.setItem('language', 'en'); } catch {}
  });
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(6000);
  const demo = page.getByRole('button', { name: /Guest Demo/i }).first();
  const b = await demo.boundingBox().catch(() => null);
  if (b) { await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2); }
  await page.waitForURL('**/recipes**', { timeout: 30000 }).catch(() => console.log('no redirect yet'));
  await page.waitForTimeout(9000);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1500);
  const OUT = '/home/user/WhatToCook/docs/screenshots/recipes-catalog.png';
  await page.screenshot({ path: OUT });
  const srcs = await page.evaluate(() =>
    [...document.images].map((i) => i.src).filter((s) => s.includes('/media/')).slice(0, 9)
  );
  console.log('local media imgs on catalog:', srcs.length);
  srcs.forEach((s) => console.log(' ', s.split('/media/')[1]));
  await browser.close();
})();
