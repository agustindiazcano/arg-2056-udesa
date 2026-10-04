import React from 'react';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

/** A group of buttons of which exactly one is pressed (aria-pressed, like the other toggles of the app). */
export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange
}: {
  label: string;
  options: ReadonlyArray<SegmentedOption<T>>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="segmented">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className="seg"
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
