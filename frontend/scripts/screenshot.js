import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outDir = path.resolve(__dirname, '../../artifacts_screenshots');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function run() {
  console.log('Launching browser (msedge/chrome)...');
  let browser;
  try {
    browser = await chromium.launch({ channel: 'msedge', headless: true });
  } catch (e) {
    try {
      browser = await chromium.launch({ channel: 'chrome', headless: true });
    } catch (e2) {
      browser = await chromium.launch({ headless: true });
    }
  }

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:5173...');
  await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);

  // 1. Home Page screenshot
  const homeShot = path.join(outDir, '01_homepage_clean_navbar.png');
  await page.screenshot({ path: homeShot, fullPage: false });
  console.log(`Saved: ${homeShot}`);

  // 2. Open Grocery Modal
  console.log('Opening Grocery modal via quick action...');
  const groceryBtn = page.getByRole('button', { name: /grocery list/i });
  if (await groceryBtn.isVisible()) {
    await groceryBtn.click();
    await page.waitForTimeout(1000);
    const groceryShot = path.join(outDir, '02_grocery_modal_blur.png');
    await page.screenshot({ path: groceryShot });
    console.log(`Saved: ${groceryShot}`);

    // Close modal via Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(600);
  } else {
    console.log('Grocery button not found by name, trying selector...');
    await page.click('button[title="Open Smart Grocery List"]');
    await page.waitForTimeout(1000);
    const groceryShot = path.join(outDir, '02_grocery_modal_blur.png');
    await page.screenshot({ path: groceryShot });
    console.log(`Saved: ${groceryShot}`);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(600);
  }

  // 3. Open Telegram Modal
  console.log('Opening Telegram modal via quick action...');
  const tgBtn = page.getByRole('button', { name: /telegram bot/i });
  if (await tgBtn.isVisible()) {
    await tgBtn.click();
    await page.waitForTimeout(1000);
    const tgShot = path.join(outDir, '03_telegram_modal_blur.png');
    await page.screenshot({ path: tgShot });
    console.log(`Saved: ${tgShot}`);

    // Close modal
    await page.keyboard.press('Escape');
    await page.waitForTimeout(600);
  }

  // 4. Navigate to Pantry
  console.log('Navigating to Pantry page...');
  await page.goto('http://localhost:5173/pantry', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  const pantryShot = path.join(outDir, '04_pantry_ingredients_catalog.png');
  await page.screenshot({ path: pantryShot });
  console.log(`Saved: ${pantryShot}`);

  await browser.close();
  console.log('All screenshots completed successfully!');
}

run().catch((err) => {
  console.error('Screenshot script error:', err);
  process.exit(1);
});
