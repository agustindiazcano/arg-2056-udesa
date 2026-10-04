import { test, expect } from './fixtures';

test('every data request carries ?v=<data_version>, and _version.json is read once without a query', async ({ page }) => {
  const dataRequests: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.pathname.startsWith('/data/')) dataRequests.push(url.pathname + url.search);
  });

  await page.goto('/');
  await page.getByRole('tab', { name: 'Economy' }).click();
  await expect(page.getByRole('heading', { name: 'Argentina in the long run', level: 1 })).toBeVisible();
  await page.getByRole('tab', { name: 'Resources' }).click();
  await expect(page.getByRole('heading', { name: 'Natural Resources', level: 1 })).toBeVisible();

  const version = dataRequests.filter((u) => u.startsWith('/data/_version.json'));
  expect(version).toEqual(['/data/_version.json']);

  const files = dataRequests.filter((u) => !u.startsWith('/data/_version.json'));
  expect(files.length).toBeGreaterThan(2);
  for (const file of files) expect(file, file).toMatch(/\.json\?v=[a-f0-9]{12}$/);
  expect(new Set(files.map((f) => f.split('?v=')[1])).size).toBe(1); // one version for all of them
});
