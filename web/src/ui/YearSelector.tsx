import React from 'react';

/**
 * The years a chart can show, as buttons. `years` is the whole range; the years that are not in `available` stay visible but disabled
 * ("Sin datos"), so a gap in the data is seen and never filled. Arrow keys step through the available years, Home and End jump to the ends.
 */
export function YearSelector({
  label,
  years,
  available,
  value,
  onChange
}: {
  label: string;
  years: readonly number[];
  available?: readonly number[];
  value: number;
  onChange: (year: number) => void;
}) {
  const ok = (year: number) => available === undefined || available.includes(year);
  const usable = years.filter(ok);
  const go = (year: number, group: HTMLElement) => {
    onChange(year);
    group.querySelector<HTMLElement>(`[data-year="${year}"]`)?.focus();
  };
  const onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    const at = usable.indexOf(value);
    const target =
      event.key === 'ArrowRight' ? usable[at + 1] : event.key === 'ArrowLeft' ? (at > 0 ? usable[at - 1] : undefined) : event.key === 'Home' ? usable[0] : event.key === 'End' ? usable.at(-1) : undefined;
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    if (target !== undefined && target !== value) go(target, event.currentTarget.parentElement!);
  };
  return (
    <div role="group" aria-label={label} className="segmented year-selector">
      {years.map((year) => (
        <button
          key={year}
          type="button"
          className="seg"
          data-year={year}
          aria-pressed={year === value}
          disabled={!ok(year)}
          title={ok(year) ? undefined : 'Sin datos'}
          onClick={() => onChange(year)}
          onKeyDown={onKeyDown}
        >
          {year}
        </button>
      ))}
    </div>
  );
}
