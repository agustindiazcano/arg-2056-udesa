export interface HdiEntry {
  year: number;
  hdi: number;
  life_expectancy?: number;
  expected_schooling?: number;
  mean_schooling?: number;
  gni_per_capita?: number;
}

export interface PisaEntry {
  year: number;
  reading: number;
  math: number;
  science: number;
}

/** Historical series of Argentina's Human Development Index (UNDP). */
export const ARGENTINA_HDI_SERIES: readonly HdiEntry[] = [
  { year: 1990, hdi: 0.733 },
  { year: 1995, hdi: 0.762 },
  { year: 2000, hdi: 0.789 },
  { year: 2005, hdi: 0.809 },
  { year: 2010, hdi: 0.844 },
  { year: 2015, hdi: 0.859 },
  { year: 2018, hdi: 0.852 },
  { year: 2019, hdi: 0.853 },
  { year: 2020, hdi: 0.851 },
  { year: 2021, hdi: 0.847 },
  { year: 2022, hdi: 0.858 },
  { year: 2023, hdi: 0.865 }
];

/** Latin American peer comparison of HDI (UNDP 2022/2023). */
export const LATAM_HDI_2022: ReadonlyArray<{ country: string; hdi: number; rank: string }> = [
  { country: 'Chile', hdi: 0.860, rank: 'Muy alto' },
  { country: 'Argentina', hdi: 0.858, rank: 'Muy alto' },
  { country: 'Uruguay', hdi: 0.830, rank: 'Muy alto' },
  { country: 'Brasil', hdi: 0.760, rank: 'Alto' },
  { country: 'México', hdi: 0.781, rank: 'Alto' },
  { country: 'Colombia', hdi: 0.758, rank: 'Alto' }
];

/** Historical OECD PISA scores for Argentina. */
export const ARGENTINA_PISA_SERIES: readonly PisaEntry[] = [
  { year: 2012, reading: 396, math: 388, science: 406 },
  { year: 2018, reading: 402, math: 379, science: 404 },
  { year: 2022, reading: 401, math: 378, science: 406 }
];

/** PISA 2022 regional comparison in Mathematics (OECD). */
export const PISA_LATAM_MATH_2022: ReadonlyArray<{ country: string; math: number }> = [
  { country: 'Chile', math: 412 },
  { country: 'Uruguay', math: 409 },
  { country: 'México', math: 395 },
  { country: 'Brasil', math: 379 },
  { country: 'Argentina', math: 378 },
  { country: 'Colombia', math: 383 }
];
