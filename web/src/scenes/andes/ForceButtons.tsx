import React from 'react';
import { forceColor } from './columns';
import { FORCES, forceChip, forceFullName } from './forces';

interface ForceButtonsProps {
  /** the force the map is on, if any */
  active: string | null;
  /** the reader chose a force: the map goes to it */
  onGo: (id: string) => void;
}

/**
 * One round button per force of the crossing, in the color of the force with a short name; hovering one says its whole name. A click goes to the
 * force on the map. The main force, the artillery and logistics, and the four flanks.
 */
export function ForceButtons({ active, onGo }: ForceButtonsProps) {
  return (
    <div className="andes-forces" role="group" aria-label="Fuerzas">
      {FORCES.map((f) => (
        <button
          key={f.id}
          type="button"
          className="andes-force-chip"
          aria-pressed={active === f.id}
          aria-label={forceFullName(f.id)}
          data-full={forceFullName(f.id)}
          onClick={() => onGo(f.id)}
        >
          <span className="andes-force-dot" style={{ background: forceColor(f.id) }} aria-hidden="true" />
          <span className="andes-force-name">{forceChip(f.id)}</span>
        </button>
      ))}
    </div>
  );
}
