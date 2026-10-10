// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { Header } from '../../src/app/Header';
import { SlotPortal } from '../../src/dashboard/SlotPortal';

afterEach(cleanup);

describe('navbar slot', () => {
  it('puts the controls of a scene in the second row of the header, under the brand, the tabs and the links', () => {
    render(
      <>
        <Header />
        <SlotPortal slot="nav">
          <div role="group" aria-label="Controles de la escena">
            <button type="button">Mapa 3D</button>
          </div>
        </SlotPortal>
      </>
    );
    const header = document.querySelector('.app-header')!;
    const group = screen.getByRole('group', { name: 'Controles de la escena' });
    expect(header.contains(group)).toBe(true);
    const tabs = header.querySelector('nav[aria-label="Escenas"]')!;
    const links = header.querySelector('.header-end')!;
    const [first, second] = Array.from(header.querySelectorAll('.header-row'));
    expect(first!.contains(tabs) && first!.contains(links)).toBe(true);
    expect(second!.contains(group)).toBe(true);
    expect(first!.contains(group)).toBe(false);
  });

  it('the Andes scene keeps its controls over the map, so the second row of the header stays empty and is hidden', async () => {
    const fs = await import('node:fs');
    const source = fs.readFileSync('src/scenes/andes/index.tsx', 'utf8');
    expect(source).not.toMatch(/<SlotPortal slot="nav">/);
    expect(source).toMatch(/aria-label="Controles de la escena"/);
    const css = fs.readFileSync('src/dashboard/dashboard.css', 'utf8');
    expect(css).toMatch(/\.header-row--sub:has\(> \.nav-slot:empty\)[^{]*\{\s*display: none;/);
  });
});
