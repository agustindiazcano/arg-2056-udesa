import React from 'react';
import { forceColor } from './columns';
import { FORCE_FACTS } from './forces';

interface ForceInfoProps {
  /** the force the camera went to */
  id: string | null;
  onClose: () => void;
}

/**
 * A small clean box under the dates on the left, for the force that is selected: only data, its name, the names of its commanders and its numbers (men, infantry,
 * units, animals, artillery, where the sources give them). It stays until it is closed or another force is chosen.
 */
export function ForceInfo({ id, onClose }: ForceInfoProps) {
  const facts = id ? FORCE_FACTS[id] : undefined;
  if (!id || !facts) return null;
  return (
    <section className="andes-force-info" aria-label={`Datos de ${facts.short}`}>
      <header>
        <h2>
          <span className="andes-force-dot" style={{ background: forceColor(id) }} aria-hidden="true" />
          {facts.short}
        </h2>
        <button type="button" className="chip" aria-label="Cerrar los datos de la fuerza" onClick={onClose}>
          ×
        </button>
      </header>
      <h3>Comandantes</h3>
      <ul>
        {facts.commanders.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>
      <h3>Unidades</h3>
      <dl>
        <div>
          <dt>{facts.menLabel ?? 'Hombres'}</dt>
          <dd>{facts.men}</dd>
        </div>
        {facts.infantry && (
          <div>
            <dt>Infantería</dt>
            <dd>{facts.infantry}</dd>
          </div>
        )}
        <div>
          <dt>Cuerpos</dt>
          <dd>{facts.battalions}</dd>
        </div>
        {facts.units
          .filter(([label]) => label !== 'Hombres' && label !== 'Infantería' && label !== 'Unidades')
          .map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
      </dl>
    </section>
  );
}
