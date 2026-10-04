import React from 'react';

/** A labelled row of filter chips (indicator, mode, resource, countries). */
export function FilterBar({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div role="group" aria-label={label} className="filter-bar">
      {children}
    </div>
  );
}

interface FilterChipProps {
  pressed: boolean;
  onClick: () => void;
  disabled?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  children: React.ReactNode;
}

export function FilterChip({ pressed, onClick, disabled, onMouseEnter, onMouseLeave, children }: FilterChipProps) {
  return (
    <button
      type="button"
      className="chip"
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </button>
  );
}
