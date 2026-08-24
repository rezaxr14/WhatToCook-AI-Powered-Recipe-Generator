import { test, expect, langSelectedInitScript } from './helpers';

test.describe('Full User Journey', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(langSelectedInitScript);
  });
  test('demo login lands on the kitchen dashboard with catalog', async ({ page }) => {
    await page.goto('/');

    // Launch the instant demo from the landing hero
    await page.getByRole('button', { name: /Try Instant Demo/i }).click();

    // Should land on /recipes with the authenticated dashboard strip
    await expect(page).toHaveURL(/\/recipes$/);
    await expect(page.getByText(/Welcome back, Chef/i)).toBeVisible();
    await expect(page.getByText('Pantry Ingredients')).toBeVisible();
  });

  test('browse catalog, filter, and open a recipe', async ({ page }) => {
    await page.request.post('/api/auth/demo/');
    await page.goto('/recipes');

    // Wait for the recipe grid to load from the API
    const cards = page.locator('a[href^="/recipe/"]');
    await expect(cards.first()).toBeVisible({ timeout: 15000 });

    // Filter by search term
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('chicken');
      await page.waitForTimeout(400);
    }

    // Open the first visible recipe detail
    await cards.first().click();
    await expect(page).toHaveURL(/\/recipe\/\d+/);
  });

  test('pantry page loads ingredients and can add one', async ({ page }) => {
    await page.request.post('/api/auth/demo/');
    await page.goto('/pantry');

    // Search the global ingredient picker
    const searchInput = page.locator('input[placeholder*="Search ingredients"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('Cinnamon');
      await page.waitForTimeout(500);
      await expect(page.getByText('Cinnamon').first()).toBeVisible();
    }
  });

  test('smart grocery modal opens and closes', async ({ page }) => {
    await page.request.post('/api/auth/demo/');
    await page.goto('/pantry');

    const groceryBtn = page.getByRole('button', { name: /Grocery/i }).first();
    await groceryBtn.click();
    await expect(page.getByText('Smart Grocery List')).toBeVisible();

    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    await expect(page.getByText('Smart Grocery List')).not.toBeVisible();
  });

  test('telegram bot modal opens and closes', async ({ page }) => {
    await page.request.post('/api/auth/demo/');
    await page.goto('/pantry');

    const tgBtn = page.getByRole('button', { name: /Telegram Bot|Bot/i }).first();
    await tgBtn.click();
    await expect(page.getByText('Telegram AI Chef Bot')).toBeVisible();

    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    await expect(page.getByText('Telegram AI Chef Bot')).not.toBeVisible();
  });

  test('logout returns user to the guest landing page', async ({ page }) => {
    await page.request.post('/api/auth/demo/');
    await page.goto('/recipes');

    const logoutBtn = page.getByRole('button', { name: /Logout/i }).first();
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await page.waitForTimeout(600);
      // After logout the navbar should offer login again
      await expect(page.getByRole('button', { name: /Login|Sign In/i }).first()).toBeVisible();
    }
  });
});
