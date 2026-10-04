import React from 'react';
import { useStore } from '../state/store';
import { YEAR_MAX, YEAR_MIN } from '../types/year';
import { PROVINCES } from '../types/province';
import type { Scenario } from '../types/scenario';
import { Segmented } from '../ui/Segmented';

const SCENARIO_OPTIONS = [
  { value: 'pessimistic', label: 'Pesimista' },
  { value: 'expected', label: 'Esperado' },
  { value: 'optimistic', label: 'Optimista' }
] as const satisfies ReadonlyArray<{ value: Scenario; label: string }>;

const speedFormat = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 });

const PlayIcon = () => (
  <svg viewBox="0 0 14 14" aria-hidden="true" focusable="false">
    <path d="M3 1.5v11l9-5.5z" />
  </svg>
);
const PauseIcon = () => (
  <svg viewBox="0 0 14 14" aria-hidden="true" focusable="false">
    <path d="M3 1.5h3v11H3zM8 1.5h3v11H8z" />
  </svg>
);

/** The control bar: play, year, speed, scenario, AI overlay and the province filter. */
export function Hud() {
  const { playing, yearFloat, speed, scenario, aiOverlay, province, provinceFilterOpen, dispatch } = useStore();
  const provinceName = PROVINCES.find((p) => p.id === province)?.name ?? 'Todas';

  return (
    <section aria-label="Controles" className="controls">
      <button type="button" className="btn btn--primary" aria-keyshortcuts="Space" onClick={() => dispatch({ type: 'togglePlay' })}>
        {playing ? <PauseIcon /> : <PlayIcon />}
        {playing ? 'Pausar' : 'Reproducir'}
      </button>

      <div className="year-block">
        <span className="year" data-testid="hud-year" data-value={yearFloat}>
          {Math.floor(yearFloat)}
        </span>
        <input
          type="range"
          className="slider"
          aria-label="Año"
          min={YEAR_MIN}
          max={YEAR_MAX}
          step={1}
          value={Math.floor(yearFloat)}
          onChange={(event) => dispatch({ type: 'setYear', year: Number(event.target.value) })}
        />
      </div>

      <div role="group" aria-label="Velocidad" className="control-group">
        <button type="button" className="btn btn--icon" aria-label="Más lento" onClick={() => dispatch({ type: 'speedDown' })}>
          −
        </button>
        <span className="speed">{speedFormat.format(speed)}×</span>
        <button type="button" className="btn btn--icon" aria-label="Más rápido" onClick={() => dispatch({ type: 'speedUp' })}>
          +
        </button>
      </div>

      <Segmented
        label="Escenario"
        options={SCENARIO_OPTIONS}
        value={scenario}
        onChange={(next) => dispatch({ type: 'setScenario', scenario: next })}
      />

      <button
        type="button"
        className="btn"
        aria-pressed={aiOverlay === 'on'}
        onClick={() => dispatch({ type: 'setAiOverlay', aiOverlay: aiOverlay === 'off' ? 'on' : 'off' })}
      >
        Efecto de la IA
      </button>

      <button
        type="button"
        className="btn"
        aria-haspopup="dialog"
        aria-expanded={provinceFilterOpen}
        aria-keyshortcuts="P"
        onClick={() => dispatch({ type: 'openProvinceFilter' })}
      >
        Provincia: <span className="province-name">{provinceName}</span>
      </button>
    </section>
  );
}
