/* Sampler: plays the guided film and grabs frames; later we keep the most distinct ones. */
const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 } });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    try { localStorage.setItem('whattocook_language_selected', 'en'); localStorage.setItem('language', 'en'); } catch {}
  });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'load', timeout: 60000 });
  await page.waitForSelector('text=Preparing your kitchen', { state: 'hidden', timeout: 60000 }).catch(() => {});
  await page.waitForSelector('canvas', { state: 'visible', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(3500);

  const filmBtn = page.getByRole('button', { name: /Watch the film/i }).first();
  const vis = await filmBtn.isVisible().catch(() => false);
  console.log('film button visible:', vis);
  if (vis) {
    await filmBtn.click({ timeout: 8000 }).catch((e) => console.log('film click fail', e.message.split('\n')[0]));
  } else {
    // fallback: also try 'Explore Your Kitchen'
    await page.getByRole('button', { name: /Explore Your Kitchen/i }).first().click({ timeout: 8000 }).catch((e) => console.log('explore fail'));
  }
  await page.waitForTimeout(2000);
  fs.mkdirSync('/home/user/previews/frames', { recursive: true });
  const N = 16;
  for (let i = 0; i < N; i++) {
    await page.screenshot({ path: `/home/user/previews/frames/t${String(i).padStart(2, '0')}.png` });
    console.log('frame', i);
    await page.waitForTimeout(4000);
  }
  console.log('JS errors:', errors.length ? errors.slice(0, 5) : 'none');
  await browser.close();
})();
