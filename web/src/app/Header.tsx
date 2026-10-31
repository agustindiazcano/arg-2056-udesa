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

function UniformsControl() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="tab data-button" aria-expanded={open} aria-haspopup="dialog" onClick={() => setOpen((v) => !v)}>
        <UniformIcon />
        Ver uniformes
      </button>
      {open && <UniformsModal onClose={() => setOpen(false)} />}
    </>
  );
}

/** The brand (a way back to the intro), the sections (the steps of the Recorrido next to them, and the controls of the scene) and the Data button. */
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
        {section === 'tour' && <TourSteps />}
        <div className="header-end">
          {section === 'andes' && <UniformsControl />}
          <DataButton />
        </div>
      </div>
      {/* the second row: the scenes of the Data Dashboard, and the controls of the Andes */}
      <div className="header-row header-row--sub">
        <SceneTabs />
        <div className="nav-slot" ref={navRef} />
      </div>
    </header>
  );
}
