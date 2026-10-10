import type { Page } from '@playwright/test';
import { test, expect, SCENE_TABS, expectSceneShown, openTab } from './fixtures';

const INTERACTIVE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Numbers every visible interactive control in document order (data-a11y-index), then presses Tab from the top of
 * the page until the focus has been on all of them or the budget runs out. Returns the order the focus visited them.
 */
async function tabThroughEveryControl(page: Page): Promise<{ total: number; visited: number[] }> {
  const total = await page.evaluate((selector) => {
    const controls = [...document.querySelectorAll<HTMLElement>(selector)].filter((el) => {
      const box = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      return box.width > 0 && box.height > 0 && style.visibility !== 'hidden';
    });
    controls.forEach((el, i) => el.setAttribute('data-a11y-index', String(i)));
    // start from the top of the page: the skip link (index 0) has the focus, then Tab walks on from it
    controls[0]?.focus();
    return controls.length;
  }, INTERACTIVE);

  const visited: number[] = [0];
  for (let press = 0; press < total + 5; press += 1) {
    await page.keyboard.press('Tab');
    const index = await page.evaluate(() => document.activeElement?.getAttribute('data-a11y-index') ?? null);
    if (index !== null) visited.push(Number(index));
    if (new Set(visited).size === total) break;
  }
  return { total, visited };
}

test.describe('keyboard operability', () => {
  test('the skip link is the first Tab stop, appears on focus and moves the focus to the main landmark', async ({ page }) => {
    await page.goto('/');
    const skip = page.getByRole('link', { name: 'Saltar al contenido principal' });
    await page.keyboard.press('Tab');
    await expect(skip).toBeFocused();
    await expect(skip).toBeVisible();
    const box = await skip.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.y).toBeGreaterThanOrEqual(0);

    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#main$/);
    expect(await page.evaluate(() => document.activeElement?.id)).toBe('main');
    await expect(page.getByRole('main')).toHaveCount(1);
  });

  test('the tab bar is a navigation landmark named Scenes', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Escenas' }).getByRole('tab')).toHaveCount(3);
  });

  for (const entry of SCENE_TABS) {
    test(`${entry.scene}: Tab reaches every control, in document order`, async ({ page }) => {
      await page.goto('/');
      await openTab(page, entry.tab);
      await expectSceneShown(page, entry);
      // the Andes show "Saltar intro" while their intro goes on and take it away after: the controls are counted once it is gone
      const skip = page.getByRole('button', { name: 'Saltar intro' });
      if (await skip.count()) await skip.click();
      await expect(skip).toHaveCount(0);

      const { total, visited } = await tabThroughEveryControl(page);
      expect(total).toBeGreaterThan(8); // the skip link, six tabs, the HUD buttons and the story caption at least
      expect(new Set(visited).size, `controls reached by Tab: ${visited.join(', ')}`).toBe(total);
      // logical order: the focus only ever moves forward through the document
      expect(visited).toEqual([...visited].sort((a, b) => a - b));
      expect(visited[0]).toBe(0); // the skip link
    });
  }

  test('Enter and Space activate a button and a tab', async ({ page }) => {
    await page.goto('/');
    await openTab(page, 'Economía'); // the AI toggle is a control of the data scenes
    const ai = page.getByRole('button', { name: 'Efecto de la IA' });
    await ai.focus();
    await expect(ai).toHaveAttribute('aria-pressed', 'false');
    await page.keyboard.press('Enter');
    await expect(ai).toHaveAttribute('aria-pressed', 'true');
    await page.keyboard.press('Space');
    await expect(ai).toHaveAttribute('aria-pressed', 'false');

    await page.getByRole('tab', { name: 'Data Dashboard' }).click();
    const economy = page.getByRole('tab', { name: 'Economía' });
    await economy.focus();
    await page.keyboard.press('Enter');
    await expect(economy).toHaveAttribute('aria-selected', 'true');
    const resources = page.getByRole('tab', { name: 'Recursos' });
    await resources.focus();
    await page.keyboard.press('Space');
    await expect(resources).toHaveAttribute('aria-selected', 'true');
  });

  test('the AI toggle exposes aria-pressed with the right state after activation', async ({ page }) => {
    await page.goto('/');
    await openTab(page, 'Economía'); // the AI toggle is a control of the data scenes
    const button = page.getByRole('button', { name: 'Efecto de la IA' });
    await expect(button).toHaveAttribute('aria-pressed', 'false');
    await button.click();
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    await button.click();
    await expect(button).toHaveAttribute('aria-pressed', 'false');
  });

  test('play and pause is one button whose name says what it will do', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Reproducir' }).click();
    await expect(page.getByRole('button', { name: 'Pausar' })).toBeVisible();
    await page.getByRole('button', { name: 'Pausar' }).click();
    await expect(page.getByRole('button', { name: 'Reproducir' })).toBeVisible();
  });

  test('the table view toggle exposes aria-pressed in step with what is shown', async ({ page }) => {
    await page.goto('/');
    await openTab(page, 'Recursos');
    const scene = page.getByTestId('scene');
    const toggle = scene.getByRole('button', { name: 'Ver tabla' }).first();
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    const tablesBefore = await scene.getByRole('table').count();
    await toggle.focus();
    await page.keyboard.press('Enter');
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(scene.getByRole('table')).toHaveCount(tablesBefore + 1);
  });

  test('the province filter traps no focus and Escape returns the focus to the control that opened it', async ({ page }) => {
    await page.goto('/');
    await openTab(page, 'Economía'); // the province filter is a control of the data scenes
    const opener = page.getByRole('button', { name: /^Provincia:/ });
    await opener.focus();
    await page.keyboard.press('Enter');

    const dialog = page.getByRole('dialog', { name: 'Filtrar por provincia' });
    await expect(dialog).toBeVisible();
    const inside = () => page.evaluate(() => document.activeElement?.closest('[role="dialog"]') !== null);
    expect(await inside()).toBe(true); // the focus moved into the dialog

    // Escape right after opening goes back to the opener
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(opener).toBeFocused();

    // Tab leaves the dialog after its last button: nothing keeps the focus in
    await page.keyboard.press('Enter');
    await expect(dialog).toBeVisible();
    const buttons = await dialog.getByRole('button').count();
    for (let i = 0; i < buttons; i += 1) await page.keyboard.press('Tab');
    expect(await inside()).toBe(false);

    // Escape from outside the dialog still closes it and returns the focus to the opener
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(opener).toBeFocused();
  });
});
