import { test, expect, releaseFocus } from './fixtures';

// state/reducer.ts: YEARS_PER_SECOND = 2, and the app starts at speed 1 in the andes scene (its step has no focus).
const YEARS_PER_SECOND = 2;
const SPEED = 1;

test('playback follows the clock: it advances while playing and stops when paused', async ({ page }) => {
  await page.clock.install();
  await page.goto('/');
  await releaseFocus(page);

  const year = page.getByTestId('hud-year');
  const read = async () => Number(await year.getAttribute('data-value'));
  const start = await read();

  await page.keyboard.press('Space');
  await expect(page.getByRole('button', { name: 'Play or Pause' })).toHaveText('Pause');
  await page.clock.runFor(1000);

  // the HUD renders a moment after the store changes, so wait until it shows the final value
  // the first animation frame only sets the reference time, so one second of clock is within a frame of the ideal
  await expect.poll(async () => Math.abs((await read()) - (start + YEARS_PER_SECOND * SPEED))).toBeLessThan(0.1);

  await page.keyboard.press('Space');
  await expect(page.getByRole('button', { name: 'Play or Pause' })).toHaveText('Play');
  const paused = await read();
  await page.clock.runFor(1000);
  await expect.poll(read).toBe(paused);
});
