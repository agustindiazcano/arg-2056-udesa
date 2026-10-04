import React, { useEffect, useRef } from 'react';
import { useStore } from '../state/store';
import { PROVINCES } from '../types/province';

export function ProvinceFilter() {
  const open = useStore((s) => s.provinceFilterOpen);
  const selected = useStore((s) => s.province);
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
    <div role="dialog" aria-label="Filtrar por provincia" className="popover" ref={dialogRef}>
      <p className="popover-title">Elegí una provincia (Esc para cerrar)</p>
      <div className="chips">
        <button
          type="button"
          className="chip"
          aria-pressed={selected === null}
          onClick={() => dispatch({ type: 'selectProvince', province: null })}
        >
          Todas las provincias
        </button>
        {PROVINCES.map((p) => (
          <button
            key={p.id}
            type="button"
            className="chip"
            aria-pressed={selected === p.id}
            title={p.name}
            onClick={() => dispatch({ type: 'selectProvince', province: p.id })}
          >
            {p.name}
          </button>
        ))}
      </div>
    </div>
  );
}
