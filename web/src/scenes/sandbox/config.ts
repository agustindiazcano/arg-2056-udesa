export type SandboxField = 'gpcPct' | 'popPct' | 'aiPp';

export interface Bounds {
  min: number;
  max: number;
  step: number;
}

/**
 * Interface limits of the sliders, chosen for readability. They are ASSUMPTIONS, not model claims: a value at the
 * edge of a slider is not a statement about what is plausible for Argentina.
 */
export const SLIDER_BOUNDS: Record<SandboxField, Bounds> = {
  gpcPct: { min: -2, max: 8, step: 0.1 },
  popPct: { min: -1, max: 3, step: 0.1 },
  aiPp: { min: 0, max: 3, step: 0.1 }
};

export const FIELD_LABELS: Record<SandboxField, { label: string; unit: string; help: string }> = {
  gpcPct: {
    label: 'GDP per capita growth',
    unit: '% per year',
    help: 'Yearly growth of GDP per person that you assume from the first year on.'
  },
  popPct: {
    label: 'Population growth',
    unit: '% per year',
    help: 'Yearly growth of the population that you assume from the first year on.'
  },
  aiPp: {
    label: 'AI uplift',
    unit: 'percentage points per year',
    help: 'Percentage points added to the per-capita growth rate (2% plus 0.5 points is 2.5%). It is not a multiplier.'
  }
};
