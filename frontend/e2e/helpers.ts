import { test as base, expect, Page } from '@playwright/test';

/**
 * Marks the language as already chosen so the first-visit LanguageModal
 * doesn't block interactions in generic UI tests.
 */
export const langSelectedInitScript = `
  localStorage.setItem('whattocook_language_selected', 'en');
  localStorage.setItem('language', 'en');
`;

export const test = base.extend<{
  langReady: void;
}>({
  langReady: [
    async ({ page }, use) => {
      await page.addInitScript(langSelectedInitScript);
      await use();
    },
    { auto: true },
  ],
});

export { expect };

/** Ensure a locator's bounding box sits fully inside the viewport. */
export async function expectInViewport(locator: import('@playwright/test').Locator, page: Page) {
  const box = await locator.boundingBox();
  if (!box) throw new Error('Element not rendered — no bounding box');
  const vp = page.viewportSize()!;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(vp.width);
  expect(box.y + box.height).toBeLessThanOrEqual(vp.height);
}
