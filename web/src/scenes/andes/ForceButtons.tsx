import React from 'react';
import { FORCES, FORCE_FACTS } from './forces';

interface ForceButtonsProps {
  /** the force the map is on, if any */
  active: string | null;
  /** the reader chose a force: the map goes to it */
  onGo: (id: string) => void;
}

/** One button per force of the crossing, to go to it on the map: the main force, the artillery and logistics, and the four flanks. */
export function ForceButtons({ active, onGo }: ForceButtonsProps) {
  return (
    <div className="andes-forces" role="group" aria-label="Fuerzas">
      <p className="andes-forces-title">Fuerzas</p>
      <div className="andes-forces-grid">
        {FORCES.map((f) => (
          <button key={f.id} type="button" className="chip" aria-pressed={active === f.id} onClick={() => onGo(f.id)}>
            {FORCE_FACTS[f.id]?.short ?? f.title}
          </button>
        ))}
      </div>
    </div>
  );
}
