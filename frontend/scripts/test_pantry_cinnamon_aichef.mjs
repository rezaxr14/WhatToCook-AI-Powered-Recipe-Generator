import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outDir = path.resolve(__dirname, '../../artifacts_screenshots');

async function testPantryAndAIChef() {
  console.log('🚀 Inspecting Pantry Catalog, Cinnamon, and AI Chef dishes...');
  
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

  // Search for Cinnamon in Ingredient Catalog
  console.log('Searching for Cinnamon...');
  const searchInput = page.locator('input[placeholder*="Search ingredients"]').first();
  await searchInput.fill('Cinnamon');
  await page.waitForTimeout(600);

  const cinnamonCard = page.locator('button:has-text("Cinnamon")').first();
  const isCinnamonVisible = await cinnamonCard.isVisible();
  console.log('Is Cinnamon card visible in catalog:', isCinnamonVisible);

  const cinnamonImg = cinnamonCard.locator('img');
  const cinnamonImgSrc = await cinnamonImg.getAttribute('src');
  console.log('Cinnamon image source:', cinnamonImgSrc);

  const cinnamonScreenshot = path.join(outDir, '05_cinnamon_catalog_search.png');
  await page.screenshot({ path: cinnamonScreenshot });
  console.log(`📸 Screenshot saved: ${cinnamonScreenshot}`);

  // Clear search and take full page screenshot of whole catalog scrolling naturally
  await searchInput.fill('');
  await page.waitForTimeout(600);

  // Scroll down page to verify natural page scrolling without inner container
  await page.evaluate(() => window.scrollBy(0, 600));
  await page.waitForTimeout(500);

  const scrollScreenshot = path.join(outDir, '06_pantry_natural_page_scroll.png');
  await page.screenshot({ path: scrollScreenshot });
  console.log(`📸 Screenshot saved: ${scrollScreenshot}`);

  // 2. Test Model Switcher Dropdown
  console.log('Testing Model Switcher dropdown...');
  const modelBtn = page.locator('button:has-text("Model:")').first();
  if (await modelBtn.isVisible()) {
    await modelBtn.click();
    await page.waitForTimeout(500);
    const modelDropdownScreenshot = path.join(outDir, '07_model_switcher_dropdown.png');
    await page.screenshot({ path: modelDropdownScreenshot });
    console.log(`📸 Screenshot saved: ${modelDropdownScreenshot}`);
  }

  await browser.close();
  console.log('🎉 Inspection completed successfully!');
}

testPantryAndAIChef().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
