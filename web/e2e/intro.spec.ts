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
});
