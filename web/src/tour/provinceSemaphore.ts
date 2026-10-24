import { tokens } from '../styles/tokens.js';
import type { ProvinceId } from '../types/province.js';
import { PROFILE_METRICS, rankProvincesByProfileMetric } from './provinceProfileData.js';
import type { ProfileMetric } from './provinceProfileData.js';

export type Tone = 'good' | 'mid' | 'bad';

/** The traffic light colours, from the tokens of the design. */
export const TONE_COLORS: Record<Tone, string> = { good: 'var(--state-good)', mid: 'var(--state-warning)', bad: 'var(--state-critical)' };

/** The same colours as hex, for the canvas of the charts (which cannot read CSS variables). */
export const TONE_HEX: Record<Tone, string> = { good: tokens.state.good, mid: tokens.state.warning, bad: tokens.state.critical };

export const TONE_LABELS: Record<Tone, string> = { good: 'mejor tercio', mid: 'tercio medio', bad: 'peor tercio' };

/** Metrics where being higher or lower says nothing about being better (the population, the share of the transfers). */
const NEUTRAL: ReadonlySet<ProfileMetric> = new Set<ProfileMetric>(['population', 'coparticipacion_share']);

export const hasSemaphore = (metric: ProfileMetric): boolean => !NEUTRAL.has(metric);

/** The tone of every province for a metric: the best third green, the middle third yellow and the worst third red; none for a neutral metric. */
export function semaphoreTones(metric: ProfileMetric): Map<ProvinceId, Tone> {
  const tones = new Map<ProvinceId, Tone>();
  if (!hasSemaphore(metric)) return tones;
  const lowerIsBetter = PROFILE_METRICS.find((m) => m.id === metric)?.lowerIsBetter === true;
  const best = rankProvincesByProfileMetric(metric);
  if (lowerIsBetter) best.reverse();
  const third = best.length / 3;
  best.forEach((r, i) => tones.set(r.id, i < third ? 'good' : i < 2 * third ? 'mid' : 'bad'));
  return tones;
}
