import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * Every test gets a page that records what should never happen in a healthy build: console errors, uncaught page
 * errors, failed or error-status requests, and any request that leaves the preview server (no external tiles,
 * fonts or scripts). Each list must be empty when the test ends.
 */
export const test = base.extend({
  page: async ({ page, baseURL }, use) => {
    const origin = new URL(baseURL ?? 'http://localhost').origin;
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    const failedRequests: string[] = [];
    const foreignRequests: string[] = [];

    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('requestfailed', (request) => {
      failedRequests.push(`${request.method()} ${request.url()}: ${request.failure()?.errorText ?? 'failed'}`);
    });
    page.on('response', (response) => {
      if (response.status() >= 400) failedRequests.push(`${response.request().method()} ${response.url()}: HTTP ${response.status()}`);
    });
    page.on('request', (request) => {
      const url = new URL(request.url());
      // data: and blob: URLs are in-page; only http(s) can leave the server
      if ((url.protocol === 'http:' || url.protocol === 'https:') && url.origin !== origin) {
        foreignRequests.push(request.url());
      }
    });

    // the intro screen is covered by intro.spec.ts; every other test starts in the app (key of src/app/Root.tsx)
    await page.addInitScript(() => window.localStorage.setItem('arg2056.skipIntro', '1'));
    // the Data Dashboard is deprecated and hidden from the navigation and the intro unless switched on (src/content/sectionLabels.ts); the tests cover it
    await page.addInitScript(() => window.localStorage.setItem('arg2056.showDashboard', '1'));

    await use(page);

    expect(pageErrors, 'uncaught page errors').toEqual([]);
    expect(consoleErrors, 'console.error messages').toEqual([]);
    expect(failedRequests, 'failed requests').toEqual([]);
    expect(foreignRequests, 'requests to another origin').toEqual([]);
  }
});

export { expect };

/** The scenes in tab order with the visible tab label, and what proves the scene is shown. */
export const SCENE_TABS = [
  { scene: 'andes', tab: 'Andes', heading: 'Los Andes', placeholder: null },
  { scene: 'economy', tab: 'Economía', heading: 'Argentina en el largo plazo', placeholder: null },
  { scene: 'resources', tab: 'Recursos', heading: 'Recursos naturales', placeholder: null },
  { scene: 'forecast', tab: 'Pronóstico 2056', heading: 'Pronóstico 2056', placeholder: null },
  { scene: 'ai-revolution', tab: 'Revolución IA', heading: null, placeholder: 'Escena de la revolución de la IA en construcción.' },
  { scene: 'sandbox', tab: 'Simulador', heading: 'Simulador', placeholder: null }
] as const;

export type SceneTab = (typeof SCENE_TABS)[number];

/** Waits until the scene shows its heading or, for a placeholder scene, its placeholder text. */
export async function expectSceneShown(page: Page, entry: SceneTab) {
  if (entry.heading) {
    await expect(page.getByRole('heading', { name: entry.heading, level: 1 })).toBeVisible();
  } else {
    await expect(page.getByTestId('scene').getByText(entry.placeholder)).toBeVisible();
  }
}

/** Keyboard shortcuts are ignored while a button has the focus for Space, so tests start from the page body. */
export async function releaseFocus(page: Page) {
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
}

const DATA_TABS: readonly string[] = SCENE_TABS.filter((t) => t.scene !== 'andes').map((t) => t.tab);

/** Opens a scene by its tab name: the five data scenes are under Data Dashboard, so that section opens first when it is not the current one. */
export async function openTab(page: Page, name: string) {
  if (DATA_TABS.includes(name)) {
    const dashboard = page.getByRole('tab', { name: 'Data Dashboard' });
    if ((await dashboard.getAttribute('aria-selected')) !== 'true') await dashboard.click();
  }
  await page.getByRole('tab', { name }).click();
}
