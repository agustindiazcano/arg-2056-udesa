import React from 'react';

/** A ring that turns while something loads, with its text (for the screen readers, and visible under the ring). Reduced motion stops the turning (one global rule). */
export function Spinner({ label = 'Cargando...' }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="spinner">
      <span className="spinner-ring" aria-hidden="true" />
      <span className="spinner-label">{label}</span>
    </div>
  );
}
