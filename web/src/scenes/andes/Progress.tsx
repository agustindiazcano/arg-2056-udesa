import React from 'react';

/** The progress of the crossing, as a percentage of the route: it takes the place of the year in the bottom bar. */
export function AndesProgress({ percent, onChange }: { percent: number; onChange: (percent: number) => void }) {
  return (
    <div className="progress-block">
      <span className="progress-label">Avance del cruce</span>
      <span className="year" data-testid="andes-progress" data-value={percent}>
        {percent} %
      </span>
      <input
        type="range"
        className="slider"
        aria-label="Avance del cruce"
        aria-valuetext={`${percent} %`}
        min={0}
        max={100}
        step={1}
        value={percent}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}
