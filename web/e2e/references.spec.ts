import { test, expect } from './fixtures';

test.describe('references page', () => {
  test('loads with its heading and, on mock data, the sample-data message', async ({ page }) => {
    await page.goto('/references.html');
    await expect(page).toHaveTitle('Sources and attributions | Argentina 2056');
    await expect(page.getByRole('heading', { name: 'Sources and attributions', level: 1 })).toBeVisible();
    // goes away with the mock (see docs/release-checklist.md)
    await expect(page.getByText('Sample data: these are not real sources')).toBeVisible();
  });

  test('the link back to the app works', async ({ page }) => {
    await page.goto('/references.html');
    await page.getByRole('link', { name: 'Back to the app' }).click();
    await expect(page).toHaveTitle('Andes | Argentina 2056');
    await expect(page.getByRole('tab', { name: 'Andes' })).toBeVisible();
  });

  test('the shell footer link opens it', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Fuentes y métodos' }).click();
    await expect(page).toHaveURL(/\/references\.html$/);
    await expect(page.getByRole('heading', { name: 'Sources and attributions', level: 1 })).toBeVisible();
  });
  test('has a Visits section (empty until the first weekly archive is merged)', async ({ page }) => {
    await page.goto('/references.html');
    const visits = page.getByRole('region', { name: 'Visits' });
    await expect(visits).toBeVisible();
    await expect(visits.getByText('No visits have been archived yet.')).toBeVisible();
  });
});
