import { test, expect, SCENE_TABS } from './fixtures';
import { SCENES } from '../src/types/scene';

test.describe('boot', () => {
  test('loads with a title and the three sections, with the data scenes under Data Dashboard', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle('Andes | Argentina 2056');

    const tabs = page.getByRole('tab');
    await expect(tabs).toHaveText(['Andes', 'Data Dashboard', 'Recorrido']);
    await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');

    // the scene tabs follow the order of the Scene union
    expect(SCENE_TABS.map((t) => t.scene)).toEqual([...SCENES]);
    await page.getByRole('tab', { name: 'Data Dashboard' }).click();
    await expect(page.getByRole('navigation', { name: 'Data Dashboard' }).getByRole('tab')).toHaveText(
      SCENE_TABS.filter((t) => t.scene !== 'andes').map((t) => t.tab)
    );
  });
});
