import React, { useCallback } from 'react';
import { useSlots } from '../dashboard/slots';
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

/** The control bar: play, year, speed, scenario, AI overlay and the province filter. In the Andes only play, the progress and the speed: the rest is for the data scenes. */
export function Hud() {
  const { playing, yearFloat, speed, scenario, aiOverlay, province, provinceFilterOpen, dispatch } = useStore();
  const provinceName = PROVINCES.find((p) => p.id === province)?.name ?? 'Todas';
  const scene = useStore((s) => s.scene);
  const progressRef = useCallback((el: HTMLDivElement | null) => useSlots.getState().set('progress', el), []);
  // in the Andes the bar is the progress of the crossing, in percent; the year stays in the page for the clock, out of sight
  const crossing = scene === 'andes';

  return (
    <section aria-label="Controles" className="controls">
      <button type="button" className="btn btn--primary" aria-keyshortcuts="Space" onClick={() => dispatch({ type: 'togglePlay' })}>
        {playing ? <PauseIcon /> : <PlayIcon />}
        {playing ? 'Pausar' : 'Reproducir'}
      </button>

      {crossing && <div className="progress-slot" ref={progressRef} />}
      <div className={crossing ? 'year-block visually-hidden' : 'year-block'}>
        <span className="year" data-testid="hud-year" data-value={yearFloat}>
          {Math.floor(yearFloat)}
        </span>
        {!crossing && (
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
        )}
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

      {!crossing && (
        <>
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
        </>
      )}
    </section>
  );
}
