import { describe, expect, it } from 'vitest';
import {
  ADVERSE_CHANNELS,
  HISTORICAL_DIFFUSION_LAGS,
  INFERENCE_COST_SERIES,
  MACRO_FORECAST_REVISION_DATA,
  TRAINING_COMPUTE_SERIES
} from '../../src/tour/techUncertaintyData.js';
import { buildSlides } from '../../src/datasets/slides.js';
import { TABLE_META, withMeta } from '../../src/datasets/quality.js';
import type { SlideData } from '../../src/datasets/types.js';

describe('techUncertaintyData', () => {
  it('exposes historical diffusion lags with valid metrics and sources', () => {
    expect(HISTORICAL_DIFFUSION_LAGS.length).toBeGreaterThanOrEqual(6);
    for (const lag of HISTORICAL_DIFFUSION_LAGS) {
      expect(lag.technology.length).toBeGreaterThan(2);
      expect(lag.inventionYear).toBeGreaterThan(1800);
      expect(lag.inventionYear).toBeLessThanOrEqual(2026);
      expect(lag.yearsToMassAdoption).toBeGreaterThan(0);
      expect(lag.yearsToMassAdoption).toBeLessThan(100);
      expect(lag.source.length).toBeGreaterThan(5);
    }
  });

  it('contains inference cost reductions showing deflationary trend', () => {
    expect(INFERENCE_COST_SERIES.length).toBeGreaterThanOrEqual(4);
    const first = INFERENCE_COST_SERIES[0]!;
    const latest = INFERENCE_COST_SERIES[INFERENCE_COST_SERIES.length - 1]!;
    expect(first.costPerMillionTokensUsd).toBeGreaterThanOrEqual(15);
    expect(latest.costPerMillionTokensUsd).toBeLessThan(1.0);
    expect(first.costPerMillionTokensUsd / latest.costPerMillionTokensUsd).toBeGreaterThan(100);
  });

  it('contains training compute scaling milestones from Epoch AI', () => {
    expect(TRAINING_COMPUTE_SERIES.length).toBeGreaterThanOrEqual(5);
    for (const item of TRAINING_COMPUTE_SERIES) {
      expect(item.flopExponent).toBeGreaterThan(5);
      expect(item.flopExponent).toBeLessThan(35);
      expect(item.hardware.length).toBeGreaterThan(3);
    }
  });

  it('contains macro forecast revision errors between IMF WEO and INDEC', () => {
    expect(MACRO_FORECAST_REVISION_DATA.length).toBeGreaterThanOrEqual(5);
    const avgError =
      MACRO_FORECAST_REVISION_DATA.reduce((acc, curr) => acc + curr.absoluteError, 0) /
      MACRO_FORECAST_REVISION_DATA.length;
    expect(avgError).toBeGreaterThan(2.0); // Real macro forecast errors are substantial
  });

  it('exposes structured adverse channels with empirical mechanisms and mitigation factors', () => {
    const channels = ['Productividad', 'Empleo', 'Salarios reales', 'PBI por habitante'];
    for (const ch of channels) {
      const data = ADVERSE_CHANNELS[ch];
      expect(data).toBeDefined();
      expect(data!.empiricalMechanism.length).toBeGreaterThan(15);
      expect(data!.historicalPrecedent.length).toBeGreaterThan(10);
      expect(data!.mitigationFactor.length).toBeGreaterThan(10);
    }
  });

  it('verifies slide 17 tables are registered with quality metadata', () => {
    const slides: SlideData[] = buildSlides();
    const slide17 = slides.find((s) => s.id === '17');
    expect(slide17).toBeDefined();

    for (const table of slide17!.tables) {
      expect(TABLE_META[table.id]).toBeDefined();
      const enriched = withMeta(table);
      expect(enriched.quality).toBeDefined();
      expect(typeof enriched.source).toBe('string');
      expect((enriched.source ?? '').length).toBeGreaterThan(5);
    }
  });
});
