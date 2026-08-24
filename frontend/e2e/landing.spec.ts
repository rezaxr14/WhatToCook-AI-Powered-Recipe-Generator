import { test, expect, langSelectedInitScript } from './helpers';

test.describe('Landing Journey', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(langSelectedInitScript);
  });

  test('renders the cinematic hero for guests', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/WhatToCook/i);

    // Hero headline + supporting copy
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/already have dinner/i);
    await expect(page.getByText(/fridge knows more recipes/i)).toBeVisible();

    // Primary CTAs
    await expect(page.getByRole('button', { name: /Try Instant Demo/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Explore Your Kitchen/i })).toBeVisible();
  });

  test('3D world mounts and the loading veil lifts', async ({ page }) => {
    await page.goto('/');
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    // The loading overlay fades away once the scene reports ready
    await expect(page.getByText(/Preparing your kitchen/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/Preparing your kitchen/i)).toBeHidden({ timeout: 15000 });
  });

  test('loads live stats from the backend API', async ({ page }) => {
    const statsResponse = page.waitForResponse('**/api/stats/');
    await page.goto('/');
    const response = await statsResponse;
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('total_recipes');
  });

  test('scroll drives the story chapters', async ({ page }) => {
    await page.goto('/');
    // Fridge chapter copy appears after scrolling into the second act
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.24));
    await expect(page.getByText(/Show us what you/i)).toBeVisible({ timeout: 8000 });

    // AI chapter further down
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.4));
    await expect(page.getByText(/connecting the dots/i)).toBeVisible({ timeout: 8000 });

    // Finale CTA
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(page.getByRole('heading', { name: /What will you cook/i })).toBeVisible({ timeout: 8000 });
  });

  test('navigates to the recipe catalog via the final CTA', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.getByRole('button', { name: /Explore Recipes/i }).first().click();
    await expect(page).toHaveURL(/\/recipes$/);
    await expect(page.getByRole('heading', { name: /Recipe Catalog|All Recipes/ }).first()).toBeVisible();
  });

  test('demo login lands the chef in the catalog and later visits redirect', async ({ page }) => {
    await page.goto('/');

    // Log in through the UI so a real Django session cookie is established
    const demoButton = page.getByRole('button', { name: /Try Instant Demo/i });
    await expect(demoButton).toBeVisible({ timeout: 15000 });
    await demoButton.click();
    await expect(page).toHaveURL(/\/recipes$/, { timeout: 15000 });

    // With an active session, visiting the landing journey redirects to the catalog
    await page.goto('/');
    await expect(page).toHaveURL(/\/recipes$/);
    await expect(page.getByRole('heading', { name: /Recipe Catalog|All Recipes/ }).first()).toBeVisible();
  });
});
