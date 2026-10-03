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
  { scene: 'andes', tab: 'Andes', heading: null, placeholder: 'andes placeholder' },
  { scene: 'economy', tab: 'Economy', heading: 'Argentina in the long run', placeholder: null },
  { scene: 'resources', tab: 'Resources', heading: 'Natural Resources', placeholder: null },
  { scene: 'forecast', tab: 'Forecast 2056', heading: 'Forecast 2056', placeholder: null },
  { scene: 'ai-revolution', tab: 'AI Revolution', heading: null, placeholder: 'ai-revolution placeholder' },
  { scene: 'sandbox', tab: 'Sandbox', heading: 'Sandbox', placeholder: null }
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
