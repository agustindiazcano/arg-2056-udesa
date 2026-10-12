// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.resetModules();
});

/** The scene reads the MapTiler key when its module loads: the tests load it with no key, as the CI builds it, whatever the developer has in .env.local. */
async function load() {
  vi.stubEnv('VITE_MAPTILER_KEY', '');
  vi.resetModules();
  return (await import('../../src/scenes/andes/BattleScene')).BattleScene;
}

describe('BattleScene', () => {
  it('names the battle and its date, says it is a recreation, and lists the forces with their men', async () => {
    const BattleScene = await load();
    render(<BattleScene onClose={() => undefined} />);
    const scene = screen.getByRole('dialog', { name: /Batalla de Chacabuco/ });
    expect(within(scene).getByText('12 de febrero de 1817')).toBeTruthy();
    expect(within(scene).getByText('Recreación')).toBeTruthy();
    expect(within(scene).getByRole('img', { name: 'Bandera del Ejército de los Andes' })).toBeTruthy();
    expect(within(scene).getByRole('img', { name: /Bandera realista/ })).toBeTruthy();
    expect(within(scene).getByText(/Talavera/)).toBeTruthy();
    expect(within(scene).getByText(/Soler/)).toBeTruthy();
  });

  it('says there is no map without the MapTiler key, instead of failing', async () => {
    const BattleScene = await load();
    render(<BattleScene onClose={() => undefined} />);
    expect(screen.getByText(/clave de MapTiler/)).toBeTruthy();
  });

  it('goes back to the map with the button and with Escape', async () => {
    const BattleScene = await load();
    const onClose = vi.fn();
    render(<BattleScene onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /Volver al mapa/ }));
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
