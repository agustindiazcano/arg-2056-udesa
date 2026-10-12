// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { VictoryBanners } from '../../src/scenes/andes/VictoryBanners';

afterEach(() => cleanup());

const items = [
  { id: 'a', name: 'Las Achupallas (combate)', lon: -70.7, lat: -32.6, text: 'Victoria patriota' },
  { id: 'b', name: 'Batalla de Chacabuco', lon: -70.68, lat: -32.99, text: 'Victoria patriota' }
];

describe('VictoryBanners', () => {
  it('puts the patriot flag and «Victoria patriota» over each place the army has won', () => {
    render(<VictoryBanners map={null} items={items} visible />);
    expect(screen.getAllByText('Victoria patriota')).toHaveLength(2);
    expect(screen.getAllByRole('img', { name: 'Bandera del Ejército de los Andes' })).toHaveLength(2);
    expect(screen.getByText('Batalla de Chacabuco')).toBeTruthy();
  });

  it('lets the mouse through to the map and hides while something else names the places', () => {
    const { container, rerender } = render(<VictoryBanners map={null} items={items} visible />);
    expect(container.querySelector('.andes-victories')!.getAttribute('hidden')).toBeNull();
    rerender(<VictoryBanners map={null} items={items} visible={false} />);
    expect(container.querySelector('.andes-victories')!.hasAttribute('hidden')).toBe(true);
  });

  it('is empty when there is no victory yet', () => {
    const { container } = render(<VictoryBanners map={null} items={[]} visible />);
    expect(container.querySelectorAll('.andes-victory')).toHaveLength(0);
  });
});
