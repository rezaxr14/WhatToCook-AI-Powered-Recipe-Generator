const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 } });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    try { localStorage.setItem('whattocook_language_selected', 'en'); localStorage.setItem('language', 'en'); } catch {}
  });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const OUT = '/home/user/WhatToCook/docs/screenshots/journey';
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'load', timeout: 60000 });
  await page.waitForSelector('text=Preparing your kitchen', { state: 'hidden', timeout: 60000 }).catch(() => {});
  await page.waitForSelector('canvas', { state: 'visible', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(6000);
  await page.evaluate(() => window.scrollTo(0, 0));

  const realClick = async (name) => {
    const b = page.getByRole('button', { name: new RegExp(name, 'i') }).first();
    const box = await b.boundingBox().catch(() => null);
    if (!box) throw new Error('no box for ' + name);
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  };

  await page.screenshot({ path: `${OUT}/01-arrival.png` });
  console.log('01-arrival');

  const chapters = [
    ['02-fridge-door', 'Open the Fridge'],
    ['03-ai-awakens', 'AI Awakens'],
    ['04-galaxy', 'The Galaxy'],
    ['05-cooking', 'Cooking'],
    ['06-dish', 'The Dish'],
    ['07-homecoming', 'Homecoming'],
  ];
  for (const [name, label] of chapters) {
    await realClick(label);
    await page.waitForTimeout(6500);
    await page.screenshot({ path: `${OUT}/${name}.png` });
    console.log(name, 'captured');
    const ex = page.getByRole('button', { name: /^Exit$/i }).first();
    if ((await ex.count().catch(() => 0)) > 0 && (await ex.isVisible().catch(() => false))) {
      const eb = await ex.boundingBox();
      await page.mouse.click(eb.x + eb.width / 2, eb.y + eb.height / 2);
    } else {
      console.log(name, 'no exit btn');
    }
    await page.waitForTimeout(2500);
  }
  await page.screenshot({ path: `${OUT}/08-finale.png` });
  console.log('08-finale');
  console.log('JS errors:', errors.length ? errors.slice(0, 5) : 'none');
  await browser.close();
})();
