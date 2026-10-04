import React from 'react';
import { Dashboard } from '../../dashboard/Dashboard.js';

export default function Scene() {
  return (
    <Dashboard
      title="Los Andes"
      subtitle="El cruce de 1817 sobre el terreno"
      sources={[]}
      views={[
        {
          id: 'map',
          name: 'Mapa',
          thumb: { kind: 'map' },
          content: <p className="fallback">Escena de los Andes en construcción.</p>
        }
      ]}
    />
  );
}
