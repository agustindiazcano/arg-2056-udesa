import React, { useEffect, useRef } from 'react';
import { useStore } from '../state/store';
import { PROVINCES } from '../types/province';

export function ProvinceFilter() {
  const open = useStore((s) => s.provinceFilterOpen);
  const dispatch = useStore((s) => s.dispatch);
  const dialogRef = useRef<HTMLDivElement>(null);

  // On open the focus moves into the dialog; on close it goes back to the control that had it, when that control is
  // still on the page. Nothing traps the focus: Tab leaves the dialog like any other part of the page.
  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement;
    dialogRef.current?.querySelector('button')?.focus();
    return () => {
      if (opener instanceof HTMLElement && opener !== document.body && opener.isConnected) opener.focus();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div role="dialog" aria-label="Filter by province" ref={dialogRef}>
      <button onClick={() => dispatch({ type: 'selectProvince', province: null })}>
        All provinces
      </button>
      {PROVINCES.map((p) => (
        <button
          key={p.id}
          onClick={() => dispatch({ type: 'selectProvince', province: p.id })}
        >
          {p.name}
        </button>
      ))}
    </div>
  );
}
