import type { Locator } from '@playwright/test';
import { test, expect, SCENE_TABS, expectSceneShown, openTab } from './fixtures';

const VIEWPORTS = [
  { width: 1280, height: 720 },
  { width: 1920, height: 1080 }
];

// the chart scenes: the Andes scene is a 3D map of events and has its own tests below
const DATA_SCENES = SCENE_TABS.filter((s) => s.heading !== null && s.scene !== 'andes');

test.describe('dashboard', () => {
  for (const viewport of VIEWPORTS) {
    test(`nothing scrolls in any scene at ${viewport.width}x${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('/');

      for (const entry of SCENE_TABS) {
        await openTab(page, entry.tab);
        await expectSceneShown(page, entry);
        const overflow = await page.evaluate(() => {
          const doc = document.documentElement;
          const main = document.getElementById('main') as HTMLElement;
          const screen = document.querySelector('.app-screen') as HTMLElement;
          return {
            // the page scrolls down to the footer; the app itself is one screen
            pageY: screen.scrollHeight - screen.clientHeight,
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
    await openTab(page, 'Economía');
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
      await openTab(page, entry.tab);
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
    await openTab(page, 'Economía');
    await expectSceneShown(page, DATA_SCENES[0]!);
    const layout = page.getByRole('group', { name: 'Paneles a la vez' });
    await layout.getByRole('button', { name: '4' }).click();
    const items = page.getByRole('group', { name: 'Vistas', exact: true }).locator('.carousel-item');
    await items.nth(1).click();
    await items.nth(2).click();
    await expect(page.locator('.viewer-pane')).toHaveCount(3);
    const overflow = await page.evaluate(() => {
      const main = document.getElementById('main') as HTMLElement;
      const screen = document.querySelector('.app-screen') as HTMLElement;
      return { page: screen.scrollHeight - screen.clientHeight, main: main.scrollHeight - main.clientHeight };
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
    await openTab(page, 'Economía');
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
    await openTab(page, 'Recursos');
    await page.getByRole('group', { name: 'Vistas', exact: true }).getByRole('button', { name: 'Mapa' }).click();
    await expect(page.locator('[data-chart3d="map"] canvas')).toBeVisible();
    await page.getByRole('group', { name: 'Vista', exact: true }).getByRole('button', { name: '2D' }).click();
    await expect(page.locator('[data-chart3d]')).toHaveCount(0);
    await expect(page.getByRole('img', { name: /^Mapa de/ })).toBeVisible();
  });

  test('the 3D map zooms with the wheel and the buttons, turns freely and resets', async ({ page }) => {
    await page.goto('/');
    await openTab(page, 'Recursos');
    await page.getByRole('group', { name: 'Vistas', exact: true }).getByRole('button', { name: 'Mapa' }).click();
    const canvas = page.locator('[data-chart3d="map"] canvas');
    await expect(canvas).toBeVisible();
    const camera = async () => (await canvas.getAttribute('data-camera'))!.split(',').map(Number);
    const start = await camera();

    const box = (await canvas.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.wheel(0, -300);
    await expect.poll(async () => (await camera())[2]).toBeLessThan(start[2]!);

    await page.getByRole('button', { name: 'Alejar' }).click();
    await page.getByRole('button', { name: 'Acercar' }).click();

    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 500, box.y + 100, { steps: 5 });
    await page.mouse.up();
    await expect.poll(async () => (await camera())[0]).not.toBe(start[0]);

    await page.getByRole('button', { name: 'Restablecer vista' }).click();
    await expect.poll(async () => (await camera()).join(',')).toBe(start.join(','));
    const overflow = await page.evaluate(() => {
      const screen = document.querySelector('.app-screen') as HTMLElement;
      return screen.scrollHeight - screen.clientHeight;
    });
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('the flat province map zooms and moves, and reset brings the whole territory back', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('/');
    await openTab(page, 'Recursos');
    await page.getByRole('group', { name: 'Vistas', exact: true }).getByRole('button', { name: 'Mapa' }).click();
    await page.getByRole('group', { name: 'Vista', exact: true }).getByRole('button', { name: '2D' }).click();
    const map = page.getByRole('img', { name: /^Mapa de/ });
    await expect(map).toBeVisible();
    const before = await map.screenshot();
    await page.getByRole('button', { name: 'Acercar' }).click();
    await page.getByRole('button', { name: 'Acercar' }).click();
    await expect.poll(async () => Buffer.compare(await map.screenshot(), before)).not.toBe(0);
    const box = (await map.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.wheel(0, -300);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 120, box.y + box.height / 2 + 80, { steps: 5 });
    await page.mouse.up();
    await page.getByRole('button', { name: 'Restablecer vista' }).click();
    // out of the way: no hover highlight, no focus ring
    await page.getByRole('heading', { level: 1 }).focus();
    await page.mouse.move(2, 2);
    await expect.poll(async () => Buffer.compare(await map.screenshot(), before)).toBe(0);
    expect(errors).toEqual([]);
  });

  test('the forecast fan and the long run are 3D line charts by default', async ({ page }) => {
    await page.goto('/');
    for (const tab of ['Economía', 'Pronóstico 2056']) {
      await openTab(page, tab);
      await expect(page.locator('[data-chart3d="lines"] canvas')).toBeVisible();
    }
    await openTab(page, 'Simulador');
    await expect(page.locator('[data-chart3d="lines"] canvas')).toBeVisible();
  });

  test('the story panel is docked in the right panel', async ({ page }) => {
    await page.goto('/');
    await openTab(page, 'Economía');
    const story = page.getByRole('region', { name: 'Historia' });
    await expect(story).toBeVisible();
    const side = await page.getByRole('region', { name: 'Indicadores' }).boundingBox();
    const box = await story.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(side!.x - 1);
  });
});

test.describe('andes scene', () => {
  // the map is MapLibre: its zoom and pitch are published on the host (data-zoom, data-pitch)
  const zoom = async (host: Locator) => Number(await host.getAttribute('data-zoom'));
  const pitch = async (host: Locator) => Number(await host.getAttribute('data-pitch'));

  test('shows the campaign on the real map, a panel per event, and moves the army with the clock', async ({ page }) => {
    await page.goto('/?quality=high');
    await openTab(page, 'Andes');
    const host = page.locator('[data-chart3d="andes"]');
    await expect(host.locator('canvas').first()).toBeVisible();
    await expect(page.getByRole('note')).toContainText('MapTiler');

    // one big stage: the map fills the area (no small chart), with floating controls
    const box = (await host.boundingBox())!;
    expect(box.width).toBeGreaterThan(700);
    expect(box.height).toBeGreaterThan(450);

    await page.getByRole('button', { name: /^Eventos del cruce/ }).click(); // the dates and events are a dropdown
    await page.getByRole('button', { name: /Manantiales/ }).click();
    const panel = page.getByRole('region', { name: /Evento: Manantiales/ });
    await expect(panel).toBeVisible();
    // the camera flew to the event
    await expect.poll(() => zoom(host)).toBeGreaterThan(11);

    await page.keyboard.press('Escape');
    await expect(panel).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Manantiales/ })).toBeFocused();

    const day = page.getByTestId('andes-day');
    const before = await day.innerText();
    await page.getByRole('slider').first().press('End');
    await expect.poll(async () => day.innerText()).not.toBe(before);
  });

  test('"Ver de cerca" brings the camera next to the army, where the column of figures shows, and says the figures are schematic', async ({ page }) => {
    await page.goto('/?quality=high');
    await openTab(page, 'Andes');
    const host = page.locator('[data-chart3d="andes"]');
    await expect(host.locator('canvas').first()).toBeVisible();
    await expect(page.getByText(/Figuras esquemáticas/)).toBeVisible();
    const far = await zoom(host);
    await page.getByRole('button', { name: 'Ver de cerca' }).click();
    await expect.poll(() => zoom(host)).toBeGreaterThan(14);
    expect(far).toBeLessThan(10);
    // the table has no map to get close to
    await page.getByRole('button', { name: 'Tabla de eventos' }).click();
    await expect(page.getByRole('button', { name: 'Ver de cerca' })).toBeDisabled();
  });

  test('"Cine" puts the camera low behind the column, close enough for the figures, and the table has no cinematic camera', async ({ page }) => {
    await page.goto('/?quality=high');
    await openTab(page, 'Andes');
    const host = page.locator('[data-chart3d="andes"]');
    await expect(host.locator('canvas').first()).toBeVisible();
    await page.getByRole('button', { name: 'Cine' }).click();
    await expect.poll(() => zoom(host)).toBeGreaterThan(14); // near the column
    expect(await pitch(host)).toBeGreaterThan(70); // low, toward the horizon
    await expect(page.getByRole('button', { name: 'Cine' })).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: 'Tabla de eventos' }).click();
    await expect(page.getByRole('button', { name: 'Cine' })).toBeDisabled();
  });

  test('the table of events is the text version of the scene', async ({ page }) => {
    await page.goto('/');
    await openTab(page, 'Andes');
    await page.getByRole('button', { name: 'Tabla de eventos' }).click();
    await expect(page.getByRole('table')).toContainText('Cuesta de Chacabuco');
  });
});
