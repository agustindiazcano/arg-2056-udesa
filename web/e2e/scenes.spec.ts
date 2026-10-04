import { test, expect, SCENE_TABS, expectSceneShown, releaseFocus } from './fixtures';

const CHART_SCENES = ['resources', 'economy', 'forecast', 'sandbox'];

test.describe('scenes', () => {
  for (const [index, entry] of SCENE_TABS.entries()) {
    test(`${entry.scene}: reached by its tab and by the keyboard`, async ({ page }) => {
      await page.goto('/');
      await releaseFocus(page);

      // by tab click
      await page.getByRole('tab', { name: entry.tab }).click();
      await expect(page.getByRole('tab', { name: entry.tab })).toHaveAttribute('aria-selected', 'true');
      await expectSceneShown(page, entry);

      // by keyboard: go back to the first scene, then step right to this one with ArrowRight
      await page.getByRole('tab', { name: SCENE_TABS[0].tab }).click();
      await releaseFocus(page);
      for (let i = 0; i < index; i += 1) await page.keyboard.press('ArrowRight');
      await expect(page.getByRole('tab', { name: entry.tab })).toHaveAttribute('aria-selected', 'true');
      await expectSceneShown(page, entry);

      // only the active tab is selected
      await expect(page.getByRole('tab', { selected: true })).toHaveCount(1);

      const scene = page.getByTestId('scene');
      // "error" alone is legitimate copy (the sandbox shows the rule-of-70 "error +0.2%"), so the app's own message is used
      await expect(scene).not.toContainText(/failed|no se pudieron cargar|undefined/i);
      // case-sensitive on purpose: /nan/i would match "finance"
      await expect(scene).not.toContainText(/\bNaN\b/);

      if (CHART_SCENES.includes(entry.scene)) {
        const chart = scene.getByRole('img', { name: /.+/ }).first();
        await expect(chart).toBeVisible();
        expect(((await chart.getAttribute('aria-label')) ?? '').trim()).not.toBe('');

        const toggle = scene.getByRole('button', { name: 'Ver tabla' }).first();
        await expect(toggle).toHaveAttribute('aria-pressed', 'false');
        await toggle.click();
        await expect(toggle).toHaveAttribute('aria-pressed', 'true');
        await expect(scene.getByRole('table').first()).toBeVisible();
      }

      await page.screenshot({ path: `e2e/screenshots/${entry.scene}.png` });
    });
  }
});
