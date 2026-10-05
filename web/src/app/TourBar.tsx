import React from 'react';
import { useStore } from '../state/store';
import { YEAR_MAX, YEAR_MIN } from '../types/year';
import { DATA_SCENES } from '../types/scene';
import { SCENE_LABELS } from '../scenes/registry';
import { Segmented } from '../ui/Segmented';

const SPEED_OPTIONS = [
  { value: '0.5', label: '0,5×' },
  { value: '1', label: '1×' },
  { value: '2', label: '2×' }
] as const;

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

/** The bar of the Recorrido: a round play button, a long slider for the year, the scene chips and the speed. Nothing else. */
export function TourBar() {
  const { playing, yearFloat, speed, scene, dispatch } = useStore();
  const year = Math.floor(yearFloat);
  const speedValue = String(speed);

  return (
    <section aria-label="Recorrido" className="tour-bar">
      <div className="tour-line">
        <button
          type="button"
          className="tour-play"
          aria-label={playing ? 'Pausar' : 'Reproducir'}
          aria-keyshortcuts="Space"
          onClick={() => dispatch({ type: 'togglePlay' })}
        >
          {playing ? <PauseIcon /> : <PlayIcon />}
        </button>
        <input
          type="range"
          className="slider tour-slider"
          aria-label="Año"
          min={YEAR_MIN}
          max={YEAR_MAX}
          step={1}
          value={year}
          onChange={(event) => dispatch({ type: 'setYear', year: Number(event.target.value) })}
        />
        <span className="year tour-year" data-testid="hud-year" data-value={yearFloat}>
          {year}
        </span>
      </div>
      <div className="tour-row">
        <div role="group" aria-label="Escena" className="tour-chips">
          {DATA_SCENES.map((s) => (
            <button
              key={s}
              type="button"
              className="chip"
              aria-pressed={scene === s}
              onClick={() => dispatch({ type: 'setScene', scene: s })}
            >
              {SCENE_LABELS[s]}
            </button>
          ))}
        </div>
        <Segmented
          label="Velocidad"
          options={SPEED_OPTIONS}
          value={SPEED_OPTIONS.some((o) => o.value === speedValue) ? (speedValue as (typeof SPEED_OPTIONS)[number]['value']) : '1'}
          onChange={(next) => dispatch({ type: 'setSpeed', speed: Number(next) })}
        />
      </div>
    </section>
  );
}
