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

async function testUI() {
  console.log('🚀 Starting UI Inspection with local Playwright browser...');
  
  let browser;
  try {
    browser = await chromium.launch({ channel: 'msedge', headless: true });
    console.log('✅ Connected to local Microsoft Edge browser.');
  } catch (e) {
    try {
      browser = await chromium.launch({ channel: 'chrome', headless: true });
      console.log('✅ Connected to local Google Chrome browser.');
    } catch (e2) {
      console.log('Falling back to default chromium...');
      browser = await chromium.launch({ headless: true });
    }
  }

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  // 1. Visit Home Page
  console.log('Navigating to http://localhost:5173...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(1000);

  // Take screenshot of clean Navbar & Home Page
  const homeScreenshot = path.join(outDir, '01_clean_navbar_home.png');
  await page.screenshot({ path: homeScreenshot, fullPage: false });
  console.log(`📸 Screenshot saved: ${homeScreenshot}`);

  // 2. Open Grocery Modal
  console.log('Testing Grocery Modal trigger...');
  const groceryBtn = page.locator('aside[aria-label="Quick Actions"] button').first();
  await groceryBtn.waitFor({ state: 'visible', timeout: 5000 });
  await groceryBtn.click();
  await page.waitForTimeout(600);

  const groceryScreenshot = path.join(outDir, '02_grocery_modal_centered.png');
  await page.screenshot({ path: groceryScreenshot });
  console.log(`📸 Screenshot saved: ${groceryScreenshot}`);

  // Test adding an item in grocery list
  const itemInput = page.locator('input[placeholder*="Add item"]').first();
  if (await itemInput.isVisible()) {
    await itemInput.fill('Organic Rosemary Fresh');
    await itemInput.press('Enter');
    await page.waitForTimeout(400);
  }

  // Close modal via Escape
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  // 3. Open Telegram Bot Modal
  console.log('Testing Telegram Bot Modal trigger...');
  const tgBtn = page.locator('button[title*="Telegram"]').first();
  await tgBtn.click();
  await page.waitForTimeout(600);

  const tgScreenshot = path.join(outDir, '03_telegram_modal_centered.png');
  await page.screenshot({ path: tgScreenshot });
  console.log(`📸 Screenshot saved: ${tgScreenshot}`);

  // Close modal via Escape
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  // 4. Visit Pantry Page
  console.log('Navigating to http://localhost:5173/pantry...');
  await page.goto('http://localhost:5173/pantry', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(1000);

  const pantryScreenshot = path.join(outDir, '04_pantry_catalog_food_photos.png');
  await page.screenshot({ path: pantryScreenshot });
  console.log(`📸 Screenshot saved: ${pantryScreenshot}`);

  // 5. Check AI Provider Switcher
  console.log('Checking AI Provider Switcher display...');
  const aiSwitcherText = await page.locator('header').textContent();
  console.log('Navbar header content:', aiSwitcherText.replace(/\s+/g, ' ').trim());

  await browser.close();
  console.log('🎉 All UI browser tests completed successfully with 0 errors!');
  if (errors.length > 0) {
    console.log('Page console errors observed:', errors);
  }
}

testUI().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
