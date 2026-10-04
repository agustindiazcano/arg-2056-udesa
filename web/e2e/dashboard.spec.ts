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
      const carousel = page.getByRole('group', { name: 'Vistas', exact: true });
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

  test('two or four views at once, still with no scroll, and Explorar hides the story', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.getByRole('tab', { name: 'Economía' }).click();
    await expectSceneShown(page, DATA_SCENES[0]!);
    const layout = page.getByRole('group', { name: 'Paneles a la vez' });
    await layout.getByRole('button', { name: '4' }).click();
    const items = page.getByRole('group', { name: 'Vistas', exact: true }).locator('.carousel-item');
    await items.nth(1).click();
    await items.nth(2).click();
    await expect(page.locator('.viewer-pane')).toHaveCount(3);
    const overflow = await page.evaluate(() => {
      const main = document.getElementById('main') as HTMLElement;
      return { page: document.documentElement.scrollHeight - window.innerHeight, main: main.scrollHeight - main.clientHeight };
    });
    expect(overflow.page).toBeLessThanOrEqual(0);
    expect(overflow.main).toBeLessThanOrEqual(1);

    await page.getByRole('group', { name: 'Modo' }).getByRole('button', { name: 'Explorar' }).click();
    await expect(page.getByRole('region', { name: 'Historia' })).toHaveCount(0);
    await page.getByRole('group', { name: 'Modo' }).getByRole('button', { name: 'Recorrido' }).click();
    await expect(page.getByRole('region', { name: 'Historia' })).toBeVisible();
  });

  test('the ranking is a 3D chart by default and the same chart flat in 2D', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'Economía' }).click();
    await expectSceneShown(page, DATA_SCENES[0]!);
    await page.getByRole('group', { name: 'Vistas', exact: true }).getByRole('button', { name: 'Ranking' }).click();
    const view = page.locator('[data-chart3d="bars"]');
    await expect(view).toBeVisible();
    await expect(view.locator('canvas')).toBeVisible();
    await expect(view).toHaveAttribute('aria-label', /ARG ocupa el/);

    await page.getByRole('group', { name: 'Vista', exact: true }).getByRole('button', { name: '2D' }).click();
    await expect(page.locator('[data-chart3d]')).toHaveCount(0);
    await expect(page.getByTestId('scene').getByRole('img', { name: /.+/ }).first()).toBeVisible();

    // the same choice with the D key
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.keyboard.press('d');
    await expect(page.locator('[data-chart3d="bars"]')).toBeVisible();
  });

  test('the province map is a 3D map by default and the flat map in 2D', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'Recursos' }).click();
    await page.getByRole('group', { name: 'Vistas', exact: true }).getByRole('button', { name: 'Mapa' }).click();
    await expect(page.locator('[data-chart3d="map"] canvas')).toBeVisible();
    await page.getByRole('group', { name: 'Vista', exact: true }).getByRole('button', { name: '2D' }).click();
    await expect(page.locator('[data-chart3d]')).toHaveCount(0);
    await expect(page.getByRole('img', { name: /^Mapa de/ })).toBeVisible();
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
