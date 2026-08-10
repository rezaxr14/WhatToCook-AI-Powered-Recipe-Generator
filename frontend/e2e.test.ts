import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 1440, height: 900 } });

test.describe('WhatToCook E2E & Visual Verification', () => {
  test('pantry catalog, grocery modal, telegram modal, and model check', async ({ page }) => {
    // 1. Visit Pantry page
    await page.goto('http://localhost:5173/pantry');
    await expect(page).toHaveTitle(/WhatToCook/i);

    // 2. Open Grocery Modal
    const groceryBtn = page.getByRole('button', { name: /Grocery/i }).first();
    await groceryBtn.click();
    await expect(page.getByText('Smart Grocery List')).toBeVisible();
    await page.screenshot({ path: 'grocery-open.png' });

    // Close Grocery Modal with Close button
    await page.getByLabel('Close').click();
    await page.waitForTimeout(300);

    // 3. Open Telegram Modal
    const tgBtn = page.getByRole('button', { name: /Telegram Bot|Bot/i }).first();
    await tgBtn.click();
    await expect(page.getByText('Telegram AI Chef Bot')).toBeVisible();
    await page.screenshot({ path: 'telegram-open.png' });
  });
});
