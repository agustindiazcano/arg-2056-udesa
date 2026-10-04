import { test, expect, SCENE_TABS, releaseFocus } from './fixtures';
import { SPEEDS } from '../src/state/reducer';

// The arrow keys move between scenes (KEY_MAP), not the year: the year moves with Space (play) or the store.
test.describe('keyboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await releaseFocus(page);
  });

  test('ArrowRight and ArrowLeft change the scene', async ({ page }) => {
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('tab', { name: 'Economía' })).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('ArrowLeft');
    await expect(page.getByRole('tab', { name: 'Andes' })).toHaveAttribute('aria-selected', 'true');
    // clamped at the first scene
    await page.keyboard.press('ArrowLeft');
    await expect(page.getByRole('tab', { name: 'Andes' })).toHaveAttribute('aria-selected', 'true');
  });

  test('+ and - move the speed to the neighbor value in SPEEDS', async ({ page }) => {
    const format = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 });
    const speed = (value: number) => page.getByRole('group', { name: 'Velocidad' }).getByText(`${format.format(value)}×`, { exact: true });
    const start = SPEEDS.indexOf(1);
    await expect(speed(1)).toBeVisible();
    await page.keyboard.press('+');
    await expect(speed(SPEEDS[start + 1] as number)).toBeVisible();
    await page.keyboard.press('-');
    await expect(speed(1)).toBeVisible();
    await page.keyboard.press('-');
    await expect(speed(SPEEDS[start - 1] as number)).toBeVisible();
  });

  test('Space toggles the playing indicator', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Reproducir' })).toBeVisible();
    await page.keyboard.press('Space');
    await expect(page.getByRole('button', { name: 'Pausar' })).toBeVisible();
    await page.keyboard.press('Space');
    await expect(page.getByRole('button', { name: 'Reproducir' })).toBeVisible();
  });

  test('in the forecast scene 1, 2 and 3 set the scenario shown in the HUD', async ({ page }) => {
    const forecastIndex = SCENE_TABS.findIndex((t) => t.scene === 'forecast');
    for (let i = 0; i < forecastIndex; i += 1) await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('heading', { name: 'Pronóstico 2056', level: 1 })).toBeVisible();

    await page.keyboard.press('2');
    await expect(page.getByRole('group', { name: 'Escenario' }).getByRole('button', { name: 'Esperado' })).toHaveAttribute('aria-pressed', 'true');
    await page.keyboard.press('1');
    await expect(page.getByRole('group', { name: 'Escenario' }).getByRole('button', { name: 'Pesimista' })).toHaveAttribute('aria-pressed', 'true');
    await page.keyboard.press('3');
    await expect(page.getByRole('group', { name: 'Escenario' }).getByRole('button', { name: 'Optimista' })).toHaveAttribute('aria-pressed', 'true');
  });

  test('p opens the province filter and Escape closes it', async ({ page }) => {
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.keyboard.press('p');
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('PageDown and PageUp move the caption between steps and Home returns to step 1', async ({ page }) => {
    const story = page.getByRole('region', { name: 'Historia' });
    await expect(story.getByText('Paso 1 de 3')).toBeVisible();
    await page.keyboard.press('PageDown');
    await expect(story.getByText('Paso 2 de 3')).toBeVisible();
    await page.keyboard.press('PageUp');
    await expect(story.getByText('Paso 1 de 3')).toBeVisible();

    await page.keyboard.press('PageDown');
    await page.keyboard.press('PageDown');
    await expect(story.getByText('Paso 3 de 3')).toBeVisible();
    await page.keyboard.press('Home');
    await expect(story.getByText('Paso 1 de 3')).toBeVisible();
  });

  test('a slider keeps the arrow keys: the value changes and the scene does not', async ({ page }) => {
    await page.getByRole('tab', { name: 'Simulador' }).click();
    await expect(page.getByRole('heading', { name: 'Simulador', level: 1 })).toBeVisible();

    const year = page.getByTestId('hud-year');
    const yearBefore = await year.getAttribute('data-value');

    const slider = page.getByTestId('scene').getByRole('slider').first();
    await slider.focus();
    const before = await slider.inputValue();
    await page.keyboard.press('ArrowRight');

    await expect.poll(() => slider.inputValue()).not.toBe(before);
    await expect(page.getByRole('tab', { name: 'Simulador' })).toHaveAttribute('aria-selected', 'true');
    await expect(year).toHaveAttribute('data-value', yearBefore ?? '');
  });
});
