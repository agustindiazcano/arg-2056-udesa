import React from 'react';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  /** shown but not selectable (for example a metric with no data) */
  disabled?: boolean;
  /** why it is disabled, or what it is: the title of the button */
  hint?: string;
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
          disabled={option.disabled}
          title={option.hint}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
