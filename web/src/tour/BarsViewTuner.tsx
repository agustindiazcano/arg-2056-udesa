import React from 'react';
import type { BarsView } from '../charts3d/followAnim.js';

const toDeg = (rad: number) => Math.round((rad * 180) / Math.PI);
const toRad = (deg: number) => (deg * Math.PI) / 180;

interface Field {
  label: string;
  value: number;
  step: number;
  min: number;
  max: number;
  set: (view: BarsView, n: number) => BarsView;
}

/**
 * Numbers to set the camera of the region bars by hand: the turn and the tilt in degrees, the distances in times of the distance
 * of the whole chart, a height and the lens. The page applies them at once; the line of numbers under them is what to read out.
 */
export function BarsViewTuner({ view, onChange, onReset }: { view: BarsView; onChange: (view: BarsView) => void; onReset: () => void }) {
  const fields: Field[] = [
    { label: 'Giro horizontal (°)', value: toDeg(view.theta), step: 1, min: -90, max: 90, set: (v, n) => ({ ...v, theta: toRad(n) }) },
    { label: 'Inclinación (°)', value: toDeg(view.phi), step: 1, min: 5, max: 89, set: (v, n) => ({ ...v, phi: toRad(n) }) },
    { label: 'Distancia cerca (×)', value: view.near, step: 0.02, min: 0.1, max: 1.5, set: (v, n) => ({ ...v, near: n }) },
    { label: 'Distancia final (×)', value: view.end, step: 0.02, min: 0.1, max: 1.5, set: (v, n) => ({ ...v, end: n }) },
    { label: 'Altura (±)', value: view.height, step: 0.1, min: -4, max: 4, set: (v, n) => ({ ...v, height: n }) },
    { label: 'Lente (°)', value: view.fov, step: 1, min: 5, max: 70, set: (v, n) => ({ ...v, fov: n }) }
  ];
  return (
    <aside className="view-tuner" aria-label="Ajustar la vista del gráfico de barras">
      <strong>Vista del 3er gráfico</strong>
      <div className="view-tuner-fields">
        {fields.map((f) => (
          <label key={f.label}>
            <span>{f.label}</span>
            <input
              type="number"
              value={f.value}
              step={f.step}
              min={f.min}
              max={f.max}
              onChange={(e) => {
                const n = Number(e.target.value);
                if (Number.isFinite(n)) onChange(f.set(view, n));
              }}
            />
          </label>
        ))}
      </div>
      <p data-testid="tuner-readout" className="view-tuner-readout">
        giro {toDeg(view.theta)}°, inclinación {toDeg(view.phi)}°, cerca {view.near}, final {view.end}, altura {view.height}, lente {view.fov}°
      </p>
      <button type="button" className="btn" onClick={onReset}>
        Valores originales
      </button>
    </aside>
  );
}
