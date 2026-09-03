import { test, expect } from './helpers';

/**
 * Cold-start warm-up: the first dev-server visit to `/` triggers on-demand
 * compilation of the full 3D journey module graph (can take ~10-15s in dev).
 * Running this first keeps timing-sensitive specs (first-visit language
 * modal, loading-veil lift, canvas mount) deterministic in CI/local runs.
 */
test('warm-up: first visit compiles the 3D journey', async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('/');
  await expect(page.getByText(/Preparing your kitchen/i)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/Preparing your kitchen/i)).toBeHidden({ timeout: 60_000 });
  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible({ timeout: 30_000 });
});
