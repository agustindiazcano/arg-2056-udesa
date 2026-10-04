import { test, expect, SCENE_TABS, expectSceneShown } from './fixtures';

const VIEWPORTS = [
  { width: 1280, height: 720 },
  { width: 1920, height: 1080 }
];

const DATA_SCENES = SCENE_TABS.filter((s) => s.heading !== null);

test.describe('dashboard', () => {
  for (const viewport of VIEWPORTS) {
    test(`nothing scrolls in any scene at ${viewport.width}x${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('/');

      for (const entry of SCENE_TABS) {
        await page.getByRole('tab', { name: entry.tab }).click();
        await expectSceneShown(page, entry);
        const overflow = await page.evaluate(() => {
          const doc = document.documentElement;
          const main = document.getElementById('main') as HTMLElement;
          return {
            pageY: doc.scrollHeight - window.innerHeight,
            pageX: doc.scrollWidth - window.innerWidth,
            mainY: main.scrollHeight - main.clientHeight,
            mainX: main.scrollWidth - main.clientWidth
          };
        });
        expect(overflow.pageY, `${entry.scene}: page`).toBeLessThanOrEqual(0);
        expect(overflow.pageX, `${entry.scene}: page width`).toBeLessThanOrEqual(0);
        expect(overflow.mainY, `${entry.scene}: scene area`).toBeLessThanOrEqual(1);
        expect(overflow.mainX, `${entry.scene}: scene area width`).toBeLessThanOrEqual(1);
      }
    });
  }

  test('the controls are in the bottom bar, below the scene', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'Economía' }).click();
    await expectSceneShown(page, DATA_SCENES[0]!);
    const play = await page.getByRole('button', { name: /Reproducir|Pausar/ }).boundingBox();
    const viewer = await page.getByRole('region', { name: 'Visor' }).boundingBox();
    expect(play).not.toBeNull();
    expect(viewer).not.toBeNull();
    expect(play!.y).toBeGreaterThan(viewer!.y + viewer!.height - 1);
    // the scene filters share that bar
    const filters = await page.getByRole('group', { name: 'Indicador y vista' }).boundingBox();
    expect(filters!.y).toBeGreaterThan(viewer!.y + viewer!.height - 1);
  });

  test('every data scene has a carousel of views and the viewer shows the chosen one', async ({ page }) => {
    await page.goto('/');
    for (const entry of DATA_SCENES) {
      await page.getByRole('tab', { name: entry.tab }).click();
      await expectSceneShown(page, entry);
      const carousel = page.getByRole('group', { name: 'Vistas' });
      await expect(carousel).toBeVisible();
      const items = carousel.locator('.carousel-item');
      expect(await items.count(), entry.scene).toBeGreaterThanOrEqual(2);
      await expect(items.first()).toHaveAttribute('aria-pressed', 'true');
      await items.nth(1).click();
      await expect(items.nth(1)).toHaveAttribute('aria-pressed', 'true');
      await expect(items.first()).toHaveAttribute('aria-pressed', 'false');
      await expect(page.getByRole('region', { name: 'Visor' })).toBeVisible();
    }
  });

  test('the story panel is docked in the right panel', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'Economía' }).click();
    const story = page.getByRole('region', { name: 'Historia' });
    await expect(story).toBeVisible();
    const side = await page.getByRole('region', { name: 'Indicadores' }).boundingBox();
    const box = await story.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(side!.x - 1);
  });
});
