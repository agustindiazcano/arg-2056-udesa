import React from 'react';
import { Segmented } from './Segmented.js';
import type { SegmentedOption } from './Segmented.js';

/** The buttons that switch what a chart measures (GDP, GDP per capita, population...). A metric with no data stays visible, disabled, with the reason in its title. */
export function MetricToggle<T extends string>({
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
  return <Segmented label={label} options={options} value={value} onChange={onChange} />;
}
