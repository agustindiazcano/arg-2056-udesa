import React, { useCallback } from 'react';
import { useSlots } from '../dashboard/slots';
import { useStore } from '../state/store';
import { TourSteps } from './TourSteps';
import { SceneTabs, SectionTabs } from './TabBar';

/** The title as in the intro, on one line: "Argentina" light, "2056" in the accent. */
const BRAND = (
  <>
    <span className="brand-a">Argentina</span> <span className="brand-n">2056</span>
  </>
);

/** The brand (a way back to the intro), the sections (and the controls of the scene, to the right of them) and the link to the sources. */
export function Header({ onHome }: { onHome?: () => void }) {
  const section = useStore((s) => s.section);
  const navRef = useCallback((el: HTMLDivElement | null) => useSlots.getState().set('nav', el), []);
  return (
    <header className="app-header">
      <div className="header-row">
        {onHome ? (
          <button type="button" className="brand" title="Volver a la intro" onClick={onHome}>
            {BRAND}
          </button>
        ) : (
          <span className="brand">{BRAND}</span>
        )}
        <SectionTabs />
        <div className="header-end">
          <a href="references.html">Fuentes y métodos</a>
        </div>
      </div>
      {/* the second row: the scenes of the Data Dashboard, the controls of the Andes and the steps of the Recorrido */}
      <div className="header-row header-row--sub">
        <SceneTabs />
        <div className="nav-slot" ref={navRef} />
        {section === 'tour' && <TourSteps />}
      </div>
    </header>
  );
}
