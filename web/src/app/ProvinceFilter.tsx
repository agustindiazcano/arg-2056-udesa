import React from 'react';
import { useStore } from '../state/store';
import { PROVINCES } from '../types/province';

export function ProvinceFilter() {
  const open = useStore((s) => s.provinceFilterOpen);
  const dispatch = useStore((s) => s.dispatch);

  if (!open) return null;

  return (
    <div role="dialog">
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
