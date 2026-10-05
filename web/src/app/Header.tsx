import React, { useCallback } from 'react';
import { useSlots } from '../dashboard/slots';
import { useStore } from '../state/store';
import { TourSteps } from './TourSteps';
import { TabBar } from './TabBar';
import { MockBadge } from './MockBadge';

/** The brand (a way back to the intro), the sections (and the controls of the scene, to the right of them), the badge that says the data are illustrative and the link to the sources. */
export function Header({ mockSource, onHome }: { mockSource: string | null; onHome?: () => void }) {
  const section = useStore((s) => s.section);
  const navRef = useCallback((el: HTMLDivElement | null) => useSlots.getState().set('nav', el), []);
  return (
    <header className="app-header">
      {onHome ? (
        <button type="button" className="brand" title="Volver a la intro" onClick={onHome}>
          Argentina 2056
        </button>
      ) : (
        <span className="brand">Argentina 2056</span>
      )}
      <TabBar />
      <div className="nav-slot" ref={navRef} />
      {section === 'tour' && <TourSteps />}
      <div className="header-end">
        {mockSource !== null && <MockBadge source={mockSource} />}
        <a href="references.html">Fuentes y métodos</a>
      </div>
    </header>
  );
}
