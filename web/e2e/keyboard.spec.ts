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
    await expect(page.getByRole('tab', { name: 'Economy' })).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('ArrowLeft');
    await expect(page.getByRole('tab', { name: 'Andes' })).toHaveAttribute('aria-selected', 'true');
    // clamped at the first scene
    await page.keyboard.press('ArrowLeft');
    await expect(page.getByRole('tab', { name: 'Andes' })).toHaveAttribute('aria-selected', 'true');
  });

  test('+ and - move the speed to the neighbor value in SPEEDS', async ({ page }) => {
    const speed = (value: number) => page.getByText(`Speed: ${value}x`, { exact: true });
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
    const toggle = page.getByRole('button', { name: 'Play or Pause' });
    await expect(toggle).toHaveText('Play');
    await page.keyboard.press('Space');
    await expect(toggle).toHaveText('Pause');
    await page.keyboard.press('Space');
    await expect(toggle).toHaveText('Play');
  });

  test('in the forecast scene 1, 2 and 3 set the scenario shown in the HUD', async ({ page }) => {
    const forecastIndex = SCENE_TABS.findIndex((t) => t.scene === 'forecast');
    for (let i = 0; i < forecastIndex; i += 1) await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('heading', { name: 'Forecast 2056', level: 1 })).toBeVisible();

    await page.keyboard.press('2');
    await expect(page.getByText('Scenario: expected', { exact: true })).toBeVisible();
    await page.keyboard.press('1');
    await expect(page.getByText('Scenario: pessimistic', { exact: true })).toBeVisible();
    await page.keyboard.press('3');
    await expect(page.getByText('Scenario: optimistic', { exact: true })).toBeVisible();
  });

  test('p opens the province filter and Escape closes it', async ({ page }) => {
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.keyboard.press('p');
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('PageDown and PageUp move the caption between steps and Home returns to step 1', async ({ page }) => {
    const story = page.getByRole('region', { name: 'Story' });
    await expect(story.getByText('Step 1 of 3')).toBeVisible();
    await page.keyboard.press('PageDown');
    await expect(story.getByText('Step 2 of 3')).toBeVisible();
    await page.keyboard.press('PageUp');
    await expect(story.getByText('Step 1 of 3')).toBeVisible();

    await page.keyboard.press('PageDown');
    await page.keyboard.press('PageDown');
    await expect(story.getByText('Step 3 of 3')).toBeVisible();
    await page.keyboard.press('Home');
    await expect(story.getByText('Step 1 of 3')).toBeVisible();
  });

  test('a slider keeps the arrow keys: the value changes and the scene does not', async ({ page }) => {
    await page.getByRole('tab', { name: 'Sandbox' }).click();
    await expect(page.getByRole('heading', { name: 'Sandbox', level: 1 })).toBeVisible();

    const year = page.getByTestId('hud-year');
    const yearBefore = await year.getAttribute('data-value');

    const slider = page.getByRole('slider').first();
    await slider.focus();
    const before = await slider.inputValue();
    await page.keyboard.press('ArrowRight');

    await expect.poll(() => slider.inputValue()).not.toBe(before);
    await expect(page.getByRole('tab', { name: 'Sandbox' })).toHaveAttribute('aria-selected', 'true');
    await expect(year).toHaveAttribute('data-value', yearBefore ?? '');
  });
});
