import { test as plainTest } from '@playwright/test';
import { test, expect, expectInViewport, langSelectedInitScript } from './helpers';

// NOTE: `test` (from helpers) auto-injects a stored language choice; the
// fresh-visitor scenarios below deliberately use the untouched Playwright test.
test.describe('Language selection & i18n', () => {
  plainTest('first-time visitors see the language modal and can pick a language', async ({ page }) => {
    // Fresh context: no stored language -> modal must appear
    await page.goto('/');
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(page.getByText('Choose your language')).toBeVisible();

    // Pick Turkish
    await page.getByRole('button', { name: /Türkçe/ }).click();
    await expect(dialog).not.toBeVisible();

    // UI chrome switched to Turkish
    await expect(page.getByRole('link', { name: 'Tarifler' }).first()).toBeVisible();

    // Persisted across reload
    await page.reload();
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByRole('link', { name: 'Tarifler' }).first()).toBeVisible();
  });

  test('selecting Arabic applies RTL direction to the document', async ({ page }) => {
    await page.addInitScript(langSelectedInitScript);
    await page.goto('/');

    // Open the quick-action globe (bottom-right actions bar)
    await page.getByRole('button', { name: /^Language$/i }).click();
    await page.getByRole('button', { name: /العربية/ }).click();
    await page.waitForTimeout(300);

    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
    await expect(page.getByRole('link', { name: 'الوصفات' }).first()).toBeVisible();
  });

  test('footer dropdown switches language too', async ({ page }) => {
    await page.addInitScript(langSelectedInitScript);
    // The landing journey is a full-screen canvas without a footer — use the catalog
    await page.goto('/recipes');
    await page.locator('footer').getByRole('button').first().click();
    await page.getByRole('option', { name: /Español/ }).click();
    await page.waitForTimeout(300);
    await expect(page.getByRole('link', { name: 'Recetas' }).first()).toBeVisible();
  });
});

test.describe('Responsive UI fixes', () => {
  test('Sign In button is visible at narrow desktop widths (700px)', async ({ page }) => {
    await page.setViewportSize({ width: 700, height: 800 });
    await page.goto('/');
    const signIn = page.getByRole('button', { name: /Sign In/i }).first();
    await expect(signIn).toBeVisible();
    await expectInViewport(signIn, page);
  });

  test('model dropdown stays inside the screen on iPhone viewport', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'single-project suite');
    await page.setViewportSize({ width: 390, height: 844 }); // iPhone-ish
    await page.goto('/pantry');

    // Open the mobile drawer (hamburger below sm)
    const burger = page.getByRole('button', { name: /Toggle menu/i });
    if (!(await page.getByText('Cloud AI').first().isVisible())) {
      await burger.click();
    }
    const cloudBtn = page.getByRole('button', { name: /Cloud AI/i }).first();
    await expect(cloudBtn).toBeVisible();

    const modelTrigger = page.getByRole('button', { name: /Model:/i }).first();
    if (await modelTrigger.isVisible().catch(() => false)) {
      await modelTrigger.click();
      const panel = page.locator('div.max-h-96.overflow-y-auto').last();
      await expect(panel).toBeVisible();
      await expectInViewport(panel, page);
    }
  });

  test('legacy pages render real food images for recipes', async ({ page, request }) => {
    const res = await request.get('/legacy/');
    expect(res.status()).toBe(200);
    const html = await res.text();
    const imgMatches = html.match(/<img[^>]+src="([^"]+)"/g) || [];
    expect(imgMatches.length).toBeGreaterThan(0);

    const srcs = imgMatches.map((m) => m.match(/src="([^"]+)"/)?.[1] || '');
    const hasRealImage = srcs.some(
      (s) => s.includes('unsplash') || s.includes('/media/')
    );
    expect(hasRealImage).toBe(true);
  });
});
