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
    label: 'Crecimiento del PIB per cápita',
    unit: '% por año',
    help: 'Crecimiento anual del PIB por persona que se supone desde el primer año.'
  },
  popPct: {
    label: 'Crecimiento de la población',
    unit: '% por año',
    help: 'Crecimiento anual de la población que se supone desde el primer año.'
  },
  aiPp: {
    label: 'Aporte de la IA',
    unit: 'puntos porcentuales por año',
    help: 'Se suma a la tasa de crecimiento per cápita, en puntos porcentuales (2% más 0,5 puntos es 2,5%); no es un multiplicador.'
  }
};
