import { test, expect } from './fixtures';

test.describe('intro screen', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => window.localStorage.removeItem('arg2056.skipIntro'));
  });

  test('opens first and Comenzar leads to the app', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('2056');
    await expect(page.getByRole('tab').first()).toHaveCount(0);
    await page.getByRole('button', { name: 'Comenzar' }).click();
    await expect(page.getByRole('tab').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Comenzar' })).toHaveCount(0);
  });

  test('Enter also starts', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Comenzar' }).waitFor();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('tab').first()).toBeVisible();
  });

  test('the buttons under Comenzar open the app in their section', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Recorrido al 2056' }).click();
    await expect(page.getByRole('tab', { name: 'Recorrido' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('heading', { name: 'PBI de la Argentina' })).toBeVisible();

    await page.goto('/');
    await page.getByRole('button', { name: 'Data Dashboard' }).click();
    await expect(page.getByRole('tab', { name: 'Data Dashboard' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('tab', { name: 'Economía' })).toHaveAttribute('aria-selected', 'true');

    await page.goto('/');
    await page.getByRole('button', { name: 'Cruce de los Andes' }).click();
    await expect(page.getByRole('tab', { name: 'Andes' })).toHaveAttribute('aria-selected', 'true');
  });

  test('Argentina 2056 in the header goes back to the intro', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Comenzar' }).click();
    await page.getByRole('button', { name: 'Argentina 2056' }).click();
    await expect(page.getByRole('button', { name: 'Comenzar' })).toBeVisible();
    await expect(page.getByRole('tab')).toHaveCount(0);
  });
});
