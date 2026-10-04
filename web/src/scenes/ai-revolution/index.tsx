import React from 'react';
import { Dashboard } from '../../dashboard/Dashboard.js';

export default function Scene() {
  return (
    <Dashboard
      title="Revolución de la IA"
      subtitle="Un efecto explícito, con fuentes y un rango amplio de incertidumbre"
      sources={[]}
      views={[
        {
          id: 'range',
          name: 'Rango',
          thumb: { kind: 'fan' },
          content: <p className="fallback">Escena de la revolución de la IA en construcción.</p>
        }
      ]}
    />
  );
}
