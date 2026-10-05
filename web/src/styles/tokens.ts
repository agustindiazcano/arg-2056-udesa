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

/**
 * Sequential blue ramp (design.md section 3, magnitude), ordered from the lowest values (700, darkest, close to
 * the surface) to the highest (100, lightest). Used for choropleths and heatmaps. Mirrors --seq-1..12.
 */
export const SEQUENTIAL_BLUE = [
  '#0d366b',
  '#184f95',
  '#1c5cab',
  '#256abf',
  '#2a78d6',
  '#3987e5',
  '#5598e7',
  '#6da7ec',
  '#86b6ef',
  '#9ec5f4',
  '#b7d3f6',
  '#cde2fb'
];

/**
 * Diverging ramp for deltas, ordered from the lowest values (red) through the neutral midpoint (baseline) to the
 * highest (blue), 5 equal steps per arm. design.md gives the midpoint and the blue hue but no red: the red arm is
 * a PLACEHOLDER derived with the same saturation and lightness as the blue token (hue 350), to be replaced by the
 * human. Mirrors --div-1..11.
 */
export const DIVERGING = [
  '#e53956',
  '#c2394f',
  '#a03949',
  '#7d3842',
  '#5b383c',
  '#383835',
  '#384858',
  '#38587b',
  '#39679f',
  '#3977c2',
  '#3987e5'
];

/**
 * The natural colors of the terrain in the Andes scene, from the lowest ground (valley green) to the highest (snow),
 * with the luminance growing at every step. A first choice by the agent (the human asked for "colors of the terrain"),
 * open to the human's art direction. Mirrors --terrain-1..8.
 */
export const TERRAIN_RAMP = ['#2f4a26', '#4c6a2f', '#7a8a3c', '#a08f4a', '#b0916a', '#a9a39c', '#cbc8c2', '#f1f3f6'];

/**
 * The sky of the Andes scene, from the horizon (a pale blue haze, light) up to the zenith (deep blue): a clear day. The distance fog
 * of the terrain is the first step, so the far ground melts into the haze. A first choice by the agent, taken from the visual proof of
 * concept, and open to the human's art direction. Mirrors --sky-1..4.
 */
export const SKY_RAMP = ['#cfe1f3', '#93b8e2', '#5189d2', '#2a60c0'];

/** Fill of a province without data: the baseline color (design.md), never a step of the ramps. Mirrors --no-data. */
export const NO_DATA = '#383835';

