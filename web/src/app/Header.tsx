import React, { useCallback, useState } from 'react';
import { useSlots } from '../dashboard/slots';
import { useStore } from '../state/store';
import { TourSteps } from './TourSteps';
import { DataButton, SceneTabs, SectionTabs } from './TabBar';
import { UniformsModal } from './UniformsModal';

/** The title as in the intro, on one line: "Argentina" light, "2056" in the accent. */
const BRAND = (
  <>
    <span className="brand-a">Argentina</span> <span className="brand-n">2056</span>
  </>
);

function UniformIcon() {
  return (
    <svg className="tab-icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="M5 2.5h6l1.5 3-2 1.5v6.5h-5V7L3.5 5.5 5 2.5z" />
      <path d="M6.2 2.5L8 5.2 9.8 2.5" />
    </svg>
  );
}

/** The brand (a way back to the intro), the sections (the steps of the Recorrido next to them, and the controls of the scene) and the Data button. */
export function Header({ onHome }: { onHome?: () => void }) {
  const section = useStore((s) => s.section);
  const [uniformsOpen, setUniformsOpen] = useState(false);
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
        {section === 'tour' && <TourSteps />}
        <div className="header-end">
          <button
            type="button"
            className="tab data-button"
            aria-expanded={uniformsOpen}
            aria-haspopup="dialog"
            onClick={() => setUniformsOpen((v) => !v)}
          >
            <UniformIcon />
            Ver uniformes
          </button>
          <DataButton />
        </div>
      </div>
      {/* the second row: the scenes of the Data Dashboard, and the controls of the Andes */}
      <div className="header-row header-row--sub">
        <SceneTabs />
        <div className="nav-slot" ref={navRef} />
      </div>
      {uniformsOpen && <UniformsModal onClose={() => setUniformsOpen(false)} />}
    </header>
  );
}
