export const tokens = {
  page: '#0d0d0d',
  surface: '#1a1a19',
  ink: '#ffffff',
  ink2: '#c3c2b7',
  muted: '#898781',
  grid: '#2c2c2a',
  baseline: '#383835',
  border: 'rgba(255,255,255,0.10)',

  scenario: {
    pessimistic: '#d95926',
    expected: '#3987e5',
    optimistic: '#199e70',
  },
  
  state: {
    good: '#0ca30c',
    warning: '#fab219',
    serious: '#ec835a',
    critical: '#d03b3b',
  },

  blue: '#3987e5',
};

/** Opacity of the p10-p90 band (design.md section 4, fan chart). Mirrors --band-alpha in tokens.css. */
export const BAND_ALPHA = 0.18;
