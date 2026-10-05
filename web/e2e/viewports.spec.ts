import { test, expect, SCENE_TABS, expectSceneShown, openTab } from './fixtures';

const VIEWPORTS = [
  { width: 1280, height: 720 },
  { width: 1920, height: 1080 }
];

test.describe('viewports', () => {
  for (const viewport of VIEWPORTS) {
    test(`no horizontal page scroll in any scene at ${viewport.width}x${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('/');

      for (const entry of SCENE_TABS) {
        await openTab(page, entry.tab);
        await expectSceneShown(page, entry);
        const { scrollWidth, innerWidth } = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth
        }));
        expect(scrollWidth, `${entry.scene} at ${viewport.width}px`).toBeLessThanOrEqual(innerWidth);
      }
    });
  }
});
