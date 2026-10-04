import React from 'react';

/** Swaps a chart for the table of the same data (design.md: every chart has one). */
export function TableToggle({ pressed, onToggle }: { pressed: boolean; onToggle: () => void }) {
  return (
    <button type="button" className="btn" aria-pressed={pressed} onClick={onToggle}>
      Ver tabla
    </button>
  );
}
