import { test, expect } from './fixtures';

test.describe('references page', () => {
  test('loads with its heading and, on mock data, the sample-data message', async ({ page }) => {
    await page.goto('/references.html');
    await expect(page).toHaveTitle('Fuentes y atribuciones | Argentina 2056');
    await expect(page.getByRole('heading', { name: 'Fuentes y atribuciones', level: 1 })).toBeVisible();
    // goes away with the mock (see docs/release-checklist.md)
    await expect(page.getByText('Datos de muestra: no son fuentes reales')).toBeVisible();
  });

  test('the link back to the app works', async ({ page }) => {
    await page.goto('/references.html');
    await page.getByRole('link', { name: 'Volver a la aplicación' }).click();
    await expect(page).toHaveTitle('Andes | Argentina 2056');
    await expect(page.getByRole('tab', { name: 'Andes' })).toBeVisible();
  });

  test('the shell footer link opens it', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Fuentes y métodos' }).click();
    await expect(page).toHaveURL(/\/references\.html$/);
    await expect(page.getByRole('heading', { name: 'Fuentes y atribuciones', level: 1 })).toBeVisible();
  });
  test('has a Visitas section: the empty message before the first archive, the totals and the table once there is one', async ({ page }) => {
    await page.goto('/references.html');
    const visits = page.getByRole('region', { name: 'Visitas' });
    await expect(visits).toBeVisible();
    await expect(visits.getByText('Todavía no se archivaron visitas.').or(visits.getByRole('table', { name: 'Visitas por país' }))).toBeVisible();
    await expect(visits.getByText('El conteo de visitas no está disponible.')).toHaveCount(0);
  });
});
