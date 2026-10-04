import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { SCENE_TABS, expectSceneShown } from './fixtures';
import { headersFor, startStaticServer } from './helpers/staticServer';
import type { StaticServer } from './helpers/staticServer';
import type { HeadersConfig } from '../scripts/lib/headers';

// The built site, served with the generated header rules (the real Content-Security-Policy included). Not the preview
// server of the other specs: this one answers with the CSP, so any scene that needs a looser policy fails here.
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'headers.config.json'), 'utf8')) as HeadersConfig;

let server: StaticServer;

test.beforeAll(async () => {
  server = await startStaticServer(path.join(ROOT, 'dist'), config);
});
test.afterAll(async () => {
  await server.close();
});

// Files that do not exist yet because they are a human step (see PENDING.md): the province geometry. The forecast scene
// asks for it and shows a message when it is missing. Delete this list when the geometry is committed in web/public/geo.
const MISSING_FOR_NOW = ['/geo/provinces.meta.json'];

/** Records what a healthy page under the CSP must never produce. */
function watch(page: Page) {
  const problems: string[] = [];
  page.on('pageerror', (error) => problems.push(`page error: ${error.message}`));
  page.on('console', (message) => {
    // the browser logs every failed request as a console error; the requests themselves are judged below
    if (message.type() === 'error' && !message.text().startsWith('Failed to load resource')) problems.push(`console error: ${message.text()}`);
  });
  page.on('requestfailed', (request) => problems.push(`request failed: ${request.url()}`));
  page.on('response', (response) => {
    const pathname = new URL(response.url()).pathname;
    if (response.status() >= 400 && !MISSING_FOR_NOW.includes(pathname)) problems.push(`HTTP ${response.status()}: ${pathname}`);
  });
  return problems;
}

async function violations(page: Page): Promise<string[]> {
  return page.evaluate(() => (window as Window & { __csp?: string[] }).__csp ?? []);
}

test.describe('under the Content-Security-Policy', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const list: string[] = [];
      Object.assign(window, { __csp: list });
      window.addEventListener('securitypolicyviolation', (event) => {
        list.push(`${event.violatedDirective}: ${event.blockedURI} (${event.sourceFile}:${event.lineNumber})`);
      });
    });
  });

  test('the server really sends the policy', async ({ page }) => {
    const response = await page.goto(server.url);
    expect(response!.headers()['content-security-policy']).toBe(headersFor(config, '/')['Content-Security-Policy']);
  });

  for (const entry of SCENE_TABS) {
    test(`${entry.scene} scene loads with no violation and no error`, async ({ page }) => {
      const problems = watch(page);
      await page.goto(server.url);
      await page.getByRole('tab', { name: entry.tab }).click();
      await expectSceneShown(page, entry);
      if (entry.heading) await expect(page.getByTestId('scene').getByRole('img', { name: /.+/ }).first()).toBeVisible();
      expect(await violations(page)).toEqual([]);
      expect(problems).toEqual([]);
    });
  }

  test('the references page loads with no violation and no error', async ({ page }) => {
    const problems = watch(page);
    await page.goto(`${server.url}/references.html`);
    await expect(page.getByRole('heading', { name: 'Fuentes y atribuciones', level: 1 })).toBeVisible();
    expect(await violations(page)).toEqual([]);
    expect(problems).toEqual([]);
  });

  test('a table view and the province filter work under the policy too', async ({ page }) => {
    const problems = watch(page);
    await page.goto(server.url);
    await page.getByRole('tab', { name: 'Economía' }).click();
    await page.getByTestId('scene').getByRole('button', { name: 'Ver tabla' }).first().click();
    await expect(page.getByTestId('scene').getByRole('table').first()).toBeVisible();
    await page.getByRole('button', { name: /^Provincia:/ }).click();
    await expect(page.getByRole('dialog', { name: 'Filtrar por provincia' })).toBeVisible();
    expect(await violations(page)).toEqual([]);
    expect(problems).toEqual([]);
  });
});
