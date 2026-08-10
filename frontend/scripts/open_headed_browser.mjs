import { chromium } from 'playwright';

async function openInteractiveBrowser() {
  console.log('Opening interactive browser window on your desktop...');
  
  let browser;
  try {
    browser = await chromium.launch({ channel: 'msedge', headless: false });
  } catch (e) {
    try {
      browser = await chromium.launch({ channel: 'chrome', headless: false });
    } catch (e2) {
      browser = await chromium.launch({ headless: false });
    }
  }

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  await page.goto('http://localhost:5173');
  console.log('Browser opened to http://localhost:5173 successfully!');
}

openInteractiveBrowser().catch(console.error);
