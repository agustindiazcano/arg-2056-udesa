import React from 'react';

/** The grid of indicator tiles of the right panel. */
export function TileGrid({ children }: { children: React.ReactNode }) {
  return <div className="tile-grid">{children}</div>;
}

/** One indicator: a label and its value (children). */
export function Tile({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div data-testid={id} role="group" aria-label={label} className="tile">
      <div className="tile-label">{label}</div>
      {children}
    </div>
  );
}
