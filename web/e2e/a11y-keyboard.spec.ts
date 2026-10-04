import type { Page } from '@playwright/test';
import { test, expect, SCENE_TABS, expectSceneShown } from './fixtures';

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
    const skip = page.getByRole('link', { name: 'Skip to main content' });
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
    await expect(page.getByRole('navigation', { name: 'Scenes' }).getByRole('tab')).toHaveCount(SCENE_TABS.length);
  });

  for (const entry of SCENE_TABS) {
    test(`${entry.scene}: Tab reaches every control, in document order`, async ({ page }) => {
      await page.goto('/');
      await page.getByRole('tab', { name: entry.tab }).click();
      await expectSceneShown(page, entry);

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
    const ai = page.getByRole('button', { name: 'Toggle AI Overlay' });
    await ai.focus();
    await expect(ai).toHaveAttribute('aria-pressed', 'false');
    await page.keyboard.press('Enter');
    await expect(ai).toHaveAttribute('aria-pressed', 'true');
    await page.keyboard.press('Space');
    await expect(ai).toHaveAttribute('aria-pressed', 'false');

    const economy = page.getByRole('tab', { name: 'Economy' });
    await economy.focus();
    await page.keyboard.press('Enter');
    await expect(economy).toHaveAttribute('aria-selected', 'true');
    const resources = page.getByRole('tab', { name: 'Resources' });
    await resources.focus();
    await page.keyboard.press('Space');
    await expect(resources).toHaveAttribute('aria-selected', 'true');
  });

  test('the toggles of the HUD expose aria-pressed with the right state after activation', async ({ page }) => {
    await page.goto('/');
    // [name, state at start]: not playing, 3D on, AI overlay off
    for (const [name, start, flipped] of [
      ['Play or Pause', 'false', 'true'],
      ['Toggle 2D/3D Mode', 'true', 'false'],
      ['Toggle AI Overlay', 'false', 'true']
    ] as const) {
      const button = page.getByRole('button', { name });
      await expect(button).toHaveAttribute('aria-pressed', start);
      await button.click();
      await expect(button).toHaveAttribute('aria-pressed', flipped);
      await button.click();
      await expect(button).toHaveAttribute('aria-pressed', start);
    }
  });

  test('the table view toggle exposes aria-pressed in step with what is shown', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'Resources' }).click();
    const scene = page.getByTestId('scene');
    const toggle = scene.getByRole('button', { name: 'Table view' }).first();
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    const tablesBefore = await scene.getByRole('table').count();
    await toggle.focus();
    await page.keyboard.press('Enter');
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(scene.getByRole('table')).toHaveCount(tablesBefore + 1);
  });

  test('the province filter traps no focus and Escape returns the focus to the control that opened it', async ({ page }) => {
    await page.goto('/');
    const opener = page.getByRole('button', { name: 'Filter by Province' });
    await opener.focus();
    await page.keyboard.press('Enter');

    const dialog = page.getByRole('dialog', { name: 'Filter by province' });
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
