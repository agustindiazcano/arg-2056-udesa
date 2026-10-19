import { test, expect, SCENE_TABS } from './fixtures';
import { SCENES } from '../src/types/scene';

test.describe('boot', () => {
  test('loads with a title and the three sections, with the data scenes under Data Dashboard', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle('Andes | Argentina 2056');

    const tabs = page.getByRole('tab');
    await expect(tabs).toHaveText(['Andes', 'Data Dashboard', 'Hacia el 2056', 'Simulador del PBI']);
    await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');

    // the scene tabs follow the order of the Scene union
    expect(SCENE_TABS.map((t) => t.scene)).toEqual([...SCENES]);
    await page.getByRole('tab', { name: 'Data Dashboard' }).click();
    await expect(page.getByRole('navigation', { name: 'Data Dashboard' }).getByRole('tab')).toHaveText(
      SCENE_TABS.filter((t) => t.scene !== 'andes').map((t) => t.tab)
    );
  });

  test('opens the Data page when clicking the Data button in the header and renders all four data tabs', async ({ page }) => {
    await page.goto('/');

    const dataBtn = page.locator('.header-end').getByRole('button', { name: 'Data' });
    await expect(dataBtn).toHaveAttribute('aria-pressed', 'false');
    await dataBtn.click();
    await expect(dataBtn).toHaveAttribute('aria-pressed', 'true');

    const dataNav = page.getByRole('navigation', { name: 'Secciones de datos' });
    await expect(dataNav).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Diapositiva' })).toBeVisible();
    await expect(page.getByRole('table').first()).toBeVisible();

    await dataNav.getByRole('button', { name: 'Referencias' }).click();
    await expect(page.getByRole('heading', { name: 'Referencias' })).toBeVisible();

    await dataNav.getByRole('button', { name: 'Metodología' }).click();
    await expect(page.getByRole('heading', { name: 'Metodología y pipeline de datos' })).toBeVisible();

    await dataNav.getByRole('button', { name: 'Uso de AI' }).click();
    await expect(page.getByRole('heading', { name: 'Uso de AI y flujo de ingeniería' })).toBeVisible();
  });
});

