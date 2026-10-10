import AxeBuilder from '@axe-core/playwright';
import { test, expect, SCENE_TABS, expectSceneShown, openTab } from './fixtures';
import { AXE_EXCEPTIONS, isExcepted } from './axe-exceptions';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

/** Every exception must say why. */
test('every axe exception has a rule, a selector and a reason', () => {
  for (const exception of AXE_EXCEPTIONS) {
    expect(exception.ruleId.trim(), 'ruleId').not.toBe('');
    expect(exception.selector.trim(), 'selector').not.toBe('');
    expect(exception.reason.trim().length, `reason of ${exception.ruleId}`).toBeGreaterThan(10);
  }
});

/** Serious and critical violations, one line per failing node, minus the explicit exceptions. */
async function seriousViolations(builder: AxeBuilder): Promise<string[]> {
  const results = await builder.withTags(TAGS).analyze();
  return results.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .flatMap((v) =>
      v.nodes
        .filter((node) => !isExcepted(v.id, node.target.join(' ')))
        .map((node) => `${v.impact} ${v.id}: ${node.target.join(' ')} (${v.help})`)
    );
}

test.describe('axe', () => {
  for (const entry of SCENE_TABS) {
    test(`${entry.scene} scene has no serious or critical violation`, async ({ page }) => {
      await page.goto('/');
      await openTab(page, entry.tab);
      await expectSceneShown(page, entry);
      // a chart scene is rendered once its chart has a name
      if (entry.heading) await expect(page.getByTestId('scene').getByRole('img', { name: /.+/ }).first()).toBeVisible();
      expect(await seriousViolations(new AxeBuilder({ page }))).toEqual([]);
    });
  }

  test('the scene with the table view on has no serious or critical violation', async ({ page }) => {
    await page.goto('/');
    await openTab(page, 'Economía');
    await page.getByTestId('scene').getByRole('button', { name: 'Ver tabla' }).first().click();
    await expect(page.getByTestId('scene').getByRole('table').first()).toBeVisible();
    expect(await seriousViolations(new AxeBuilder({ page }))).toEqual([]);
  });

  test('the province filter open has no serious or critical violation', async ({ page }) => {
    await page.goto('/');
    await openTab(page, 'Economía'); // the province filter is a control of the data scenes
    await page.getByRole('button', { name: /^Provincia:/ }).click();
    await expect(page.getByRole('dialog', { name: 'Filtrar por provincia' })).toBeVisible();
    expect(await seriousViolations(new AxeBuilder({ page }))).toEqual([]);
  });

  test('references.html has no serious or critical violation', async ({ page }) => {
    await page.goto('/references.html');
    await expect(page.getByRole('heading', { name: 'Fuentes y atribuciones', level: 1 })).toBeVisible();
    expect(await seriousViolations(new AxeBuilder({ page }))).toEqual([]);
  });
});
