import { test, expect } from './fixtures';
import { menuItems } from '../src/tour/menuItems';

test('each data slide exposes its sources in one keyboard-accessible dialog', async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('/');
  const tour = page.getByRole('tab', { name: /Hacia el 2056/ });
  for (const item of menuItems().filter((entry) => entry.number > 0)) {
    await tour.focus();
    await page.keyboard.press('ArrowDown');
    await page.getByRole('menuitem', { name: `${item.number} · ${item.title}`, exact: true }).click();
    const trigger = page.getByRole('button', { name: 'Referencias', exact: true });
    await expect(trigger, item.title).toBeVisible();
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: 'Referencias' });
    await expect(dialog).toBeVisible();
    expect(await dialog.getByRole('link').count(), item.title).toBeGreaterThan(0);
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  }
});

test.describe('references page', () => {
  test('loads with its heading and without a sample-data message', async ({ page }) => {
    await page.goto('/references.html');
    await expect(page).toHaveTitle('Fuentes y atribuciones | Argentina 2056');
    await expect(page.getByRole('heading', { name: 'Fuentes y atribuciones', level: 1 })).toBeVisible();
    await expect(page.getByText('Datos de muestra: no son fuentes reales')).toHaveCount(0);
  });

  test('the link back to the app works', async ({ page }) => {
    await page.goto('/references.html');
    await page.getByRole('link', { name: 'Volver a la aplicación' }).click();
    await expect(page).toHaveTitle('Andes | Argentina 2056');
    await expect(page.getByRole('tab', { name: 'Andes' })).toBeVisible();
  });

  test('has a Visitas section: the empty message before the first archive, the totals and the table once there is one', async ({ page }) => {
    await page.goto('/references.html');
    const visits = page.getByRole('region', { name: 'Visitas' });
    await expect(visits).toBeVisible();
    await expect(visits.getByText('Todavía no se archivaron visitas.').or(visits.getByRole('table', { name: 'Visitas por país' }))).toBeVisible();
    await expect(visits.getByText('El conteo de visitas no está disponible.')).toHaveCount(0);
  });
});
