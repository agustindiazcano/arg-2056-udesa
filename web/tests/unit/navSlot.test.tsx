// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { Header } from '../../src/app/Header';
import { SlotPortal } from '../../src/dashboard/SlotPortal';

afterEach(cleanup);

describe('navbar slot', () => {
  it('puts the controls of a scene in the header, to the right of the tabs and before the links', () => {
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
    expect(tabs.compareDocumentPosition(group) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(group.compareDocumentPosition(links) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('the Andes scene sends its controls there', async () => {
    const source = (await import('node:fs')).readFileSync('src/scenes/andes/index.tsx', 'utf8');
    expect(source).toMatch(/<SlotPortal slot="nav">[\s\S]*Controles de la escena/);
  });
});
