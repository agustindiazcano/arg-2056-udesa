import React from 'react';
import { isMock } from '../data/load';

export function MockBadge({ source }: { source: string }) {
  if (!isMock({ source })) return null;

  return (
    <span className="badge" title="Los datos de esta versión son ilustrativos, no reales">
      Datos ilustrativos
    </span>
  );
}
