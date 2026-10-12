// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  cleanup();
  vi.resetModules();
});

/** The scene is loaded fresh by each test. jsdom has no WebGL, so the diorama cannot be built: the scene must say so and keep working. */
async function load() {
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
    expect(within(scene).getByRole('note').textContent).toMatch(/terreno es inventado/);
  });

  it('says so instead of failing when the device has no WebGL, and still lists the forces', async () => {
    const BattleScene = await load();
    render(<BattleScene onClose={() => undefined} />);
    expect(await screen.findByText(/hace falta WebGL/)).toBeTruthy();
    expect(screen.getByText(/Talavera/)).toBeTruthy();
  });

  it('has the views as buttons, and a toggle that hides the list of forces', async () => {
    const BattleScene = await load();
    render(<BattleScene onClose={() => undefined} />);
    for (const name of ['Desde el mirador', 'Desde los realistas', 'Desde el flanco', 'Aérea', 'San Martín']) expect(screen.getByRole('button', { name })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Desde el mirador' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Aérea' }));
    expect(screen.getByRole('button', { name: 'Aérea' }).getAttribute('aria-pressed')).toBe('true');
    const toggle = screen.getByRole('button', { name: 'Ocultar fuerzas' });
    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByText(/Talavera/)).toBeNull();
  });

  it('leaves the battle with the button and with Escape', async () => {
    const BattleScene = await load();
    const onClose = vi.fn();
    render(<BattleScene onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /Salir de la batalla/ }));
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
