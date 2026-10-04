import { test, expect, SCENE_TABS } from './fixtures';
import { APP_TITLE } from '../src/app/title';

test.describe('document title', () => {
  test('follows the scene as "<scene label> | <app title>"', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(`Andes | ${APP_TITLE}`);
    for (const entry of SCENE_TABS) {
      await page.getByRole('tab', { name: entry.tab }).click();
      await expect(page).toHaveTitle(`${entry.tab} | ${APP_TITLE}`);
    }
  });

  test('the page declares its language', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await page.goto('/references.html');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });
});

test.describe('quality tier', () => {
  test('?quality=low with ?debug=1 shows the debug line "quality: low"', async ({ page }) => {
    await page.goto('/?quality=low&debug=1');
    await expect(page.getByTestId('quality-debug')).toHaveText('quality: low');
  });

  test('?quality=medium and ?quality=high are honoured too', async ({ page }) => {
    await page.goto('/?quality=medium&debug=1');
    await expect(page.getByTestId('quality-debug')).toHaveText('quality: medium');
    await page.goto('/?quality=high&debug=1');
    await expect(page.getByTestId('quality-debug')).toHaveText('quality: high');
  });

  test('without ?debug=1 there is no debug line, even with ?quality=low', async ({ page }) => {
    await page.goto('/?quality=low');
    await expect(page.getByRole('tab', { name: 'Andes' })).toBeVisible();
    await expect(page.getByTestId('quality-debug')).toHaveCount(0);
  });

  test('with ?debug=1 alone the detected tier is one of the three', async ({ page }) => {
    await page.goto('/?debug=1');
    await expect(page.getByTestId('quality-debug')).toHaveText(/^quality: (low|medium|high)$/);
  });
});

test.describe('reduced motion', () => {
  const duration = (page: import('@playwright/test').Page, selector: string) =>
    page.locator(selector).first().evaluate((el) => getComputedStyle(el).transitionDuration);

  test('no CSS transition runs on the tab bar or the scene when the user asks for reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await expect(page.getByRole('tab', { name: 'Andes' })).toBeVisible();
    expect(await duration(page, '[role="tablist"] button')).toBe('0s');
    expect(await duration(page, '[data-testid="scene"]')).toBe('0s');
  });

  test('the same scene does have its transition when the user has no preference, so the rule is what turns it off', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/');
    await expect(page.getByRole('tab', { name: 'Andes' })).toBeVisible();
    expect(await duration(page, '[data-testid="scene"]')).toBe('0.3s');
  });
});
