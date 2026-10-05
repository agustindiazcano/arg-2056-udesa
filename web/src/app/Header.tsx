import React, { useCallback } from 'react';
import { useSlots } from '../dashboard/slots';
import { TabBar } from './TabBar';
import { MockBadge } from './MockBadge';

/** The brand, the sections (and the controls of the scene, to the right of them), the badge that says the data are illustrative and the link to the sources. */
export function Header({ mockSource }: { mockSource: string | null }) {
  const navRef = useCallback((el: HTMLDivElement | null) => useSlots.getState().set('nav', el), []);
  return (
    <header className="app-header">
      <span className="brand">Argentina 2056</span>
      <TabBar />
      <div className="nav-slot" ref={navRef} />
      <div className="header-end">
        {mockSource !== null && <MockBadge source={mockSource} />}
        <a href="references.html">Fuentes y métodos</a>
      </div>
    </header>
  );
}
