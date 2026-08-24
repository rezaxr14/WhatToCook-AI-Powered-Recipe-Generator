import { test, expect, langSelectedInitScript } from './helpers';

test.describe('WhatToCook E2E Application Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(langSelectedInitScript);
  });
  test('should load homepage successfully and verify title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/WhatToCook/i);
  });

  test('should navigate to Pantry page and search ingredients', async ({ page }) => {
    await page.goto('/pantry');
    await expect(page).toHaveTitle(/WhatToCook/i);

    // Search for ingredient
    const searchInput = page.locator('input[placeholder*="Search ingredients"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('Cinnamon');
      await page.waitForTimeout(300);
      await expect(page.getByText('Cinnamon').first()).toBeVisible();
    }
  });

  test('should open and close Smart Grocery List modal', async ({ page }) => {
    await page.goto('/pantry');
    const groceryBtn = page.getByRole('button', { name: /Grocery/i }).first();
    await groceryBtn.click();
    await expect(page.getByText('Smart Grocery List')).toBeVisible();

    // Close modal via Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    await expect(page.getByText('Smart Grocery List')).not.toBeVisible();
  });

  test('should open and close Telegram AI Chef modal', async ({ page }) => {
    await page.goto('/pantry');
    const tgBtn = page.getByRole('button', { name: /Telegram Bot|Bot/i }).first();
    await tgBtn.click();
    await expect(page.getByText('Telegram AI Chef Bot')).toBeVisible();

    // Close modal via Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    await expect(page.getByText('Telegram AI Chef Bot')).not.toBeVisible();
  });
});
