import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outDir = path.resolve(__dirname, '../../artifacts_screenshots');

async function testNavbarAndFridgeBlur() {
  console.log('🚀 Testing Navbar equal heights and Fridge Scanner modal blur...');
  
  let browser;
  try {
    browser = await chromium.launch({ channel: 'msedge', headless: true });
  } catch (e) {
    browser = await chromium.launch({ headless: true });
  }

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  // 1. Visit Pantry Page
  console.log('Navigating to http://localhost:5173/pantry...');
  await page.goto('http://localhost:5173/pantry', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(1000);

  // 2. Measure heights of the 4 navbar links: Discover, Can Cook, Pantry, AI Chef Studio
  const navLinks = page.locator('header nav a');
  const count = await navLinks.count();
  console.log(`Found ${count} desktop navigation links`);
  
  const linkHeights = [];
  for (let i = 0; i < count; i++) {
    const link = navLinks.nth(i);
    const text = await link.innerText();
    const box = await link.boundingBox();
    console.log(`Nav item "${text.replace(/\n/g, ' ')}": width=${box?.width}px, height=${box?.height}px, y=${box?.y}`);
    if (box) linkHeights.push(box.height);
  }

  const navbarScreenshot = path.join(outDir, '08_navbar_equal_height_items.png');
  await page.screenshot({ path: navbarScreenshot });
  console.log(`📸 Screenshot saved: ${navbarScreenshot}`);

  // 3. Click "Scan Fridge Photo" button to open modal
  console.log('Clicking "Scan Fridge Photo" button...');
  const scanBtn = page.locator('button:has-text("Scan Fridge Photo")').first();
  await scanBtn.click();
  await page.waitForTimeout(1000);

  // Check if modal is visible
  const modalHeader = page.locator('h3:has-text("AI Fridge & Counter Scanner")');
  const isModalVisible = await modalHeader.isVisible();
  console.log('Is Fridge Scanner modal visible:', isModalVisible);

  // Check computed filter blur on main container / header
  const headerFilter = await page.evaluate(() => {
    const mainWrapper = document.querySelector('.min-h-screen');
    const header = document.querySelector('header');
    return {
      wrapperClass: mainWrapper?.className,
      wrapperFilter: window.getComputedStyle(mainWrapper).filter,
      headerFilter: window.getComputedStyle(header).filter,
    };
  });
  console.log('Filter blur status:', headerFilter);

  const modalScreenshot = path.join(outDir, '09_fridge_scanner_blurred_navbar.png');
  await page.screenshot({ path: modalScreenshot });
  console.log(`📸 Screenshot saved: ${modalScreenshot}`);

  await browser.close();
  console.log('🎉 Verification completed successfully!');
}

testNavbarAndFridgeBlur().catch((err) => {
  console.error('❌ Error testing navbar and fridge scanner:', err);
  process.exit(1);
});
