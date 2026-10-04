import { test, expect, SCENE_TABS } from './fixtures';
import { SCENES } from '../src/types/scene';

test.describe('boot', () => {
  test('loads with a title, the MOCK badge and the tabs in the order of the Scene union', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle('Andes | Argentina 2056');
    // the build uses mock data today; this assertion goes away with the mock (see docs/release-checklist.md)
    await expect(page.getByText('MOCK DATA')).toBeVisible();

    const tabs = page.getByRole('tab');
    await expect(tabs).toHaveCount(SCENES.length);
    expect(SCENE_TABS.map((t) => t.scene)).toEqual([...SCENES]);
    await expect(tabs).toHaveText(SCENE_TABS.map((t) => t.tab));
    await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');
  });
});
