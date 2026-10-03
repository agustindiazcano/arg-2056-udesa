import { expect, test } from 'vitest';
import { 
    parseExternalForecasts, 
    selectExternalForecasts,
    selectAiEstimates,
    spreadByScenario,
    AiOutcomeMetric,
    ExternalForecast,
    AiEstimate
} from '../../src/types/research';

test('parseExternalForecasts valid', () => {
    const data = [{
        id: "1", forecaster: "F", publication_title: "T", vintage: "V", indicator: "gdp_growth_real_pct", geo: "AR", year: 2026,
        value: 1, value_low: null, value_high: null, unit: "pct", price_basis: null, scenario_by_source: null, scenario_mapping: "expected", mapping_rationale: "r",
        variant: null, assumptions: null, source_id: "economy:S", source: "S", source_url: null, locator: null, snippet: null, confidence: "high", retrieved_at: "2026-10-01", note: "N"
    }];
    expect(parseExternalForecasts(data)).toEqual(data);
});

test('parseExternalForecasts invalid throws descriptive error', () => {
    const data = [{ note: "N" }];
    expect(() => parseExternalForecasts(data)).toThrow(/required property 'id'/);
});

test('selectExternalForecasts sorts by forecaster, vintage, year', () => {
    const r1 = { forecaster: "B", vintage: "V2", year: 2020 };
    const r2 = { forecaster: "A", vintage: "V1", year: 2021 };
    const r3 = { forecaster: "A", vintage: "V1", year: 2020 };
    const r4 = { forecaster: "A", vintage: "V2", year: 2020 };
    const records = [r1, r2, r3, r4] as Partial<ExternalForecast>[] as ExternalForecast[];
    
    const res = selectExternalForecasts(records, {});
    expect(res).toEqual([r3, r2, r4, r1]);
});

test('selectAiEstimates requires outcomeMetric and sorts by publication_date desc, id', () => {
    const r1 = { id: "1", outcome_metric: "gdp_growth_pp_per_year", publication_date: "2020-01-01" };
    const r2 = { id: "3", outcome_metric: "gdp_growth_pp_per_year", publication_date: "2021-01-01" };
    const r3 = { id: "2", outcome_metric: "gdp_growth_pp_per_year", publication_date: "2021-01-01" };
    const records = [r1, r2, r3] as Partial<AiEstimate>[] as AiEstimate[];
    
    const res = selectAiEstimates(records, { outcomeMetric: AiOutcomeMetric.gdp_growth_pp_per_year });
    expect(res).toEqual([r3, r2, r1]); // 2021 before 2020, then id 2 before 3
});

test('spreadByScenario exact values', () => {
    const r1 = { scenario_mapping: "expected", outcome_metric: "metric", value_low: 1, value_high: 3, id: "1" };
    const r2 = { scenario_mapping: "expected", outcome_metric: "metric", value: 2, id: "2" };
    const r3 = { scenario_mapping: "optimistic", outcome_metric: "metric", value: 5, value_high: 6, id: "3" };
    const r4 = { scenario_mapping: "pessimistic", outcome_metric: "metric", value: null, id: "4" }; // ignored
    const r_mixed = { scenario_mapping: "optimistic", outcome_metric: "other", value: 5, id: "5" };
    
    // mixed throws
    expect(() => spreadByScenario([r1, r_mixed] as { scenario_mapping: string; outcome_metric: string; value?: number | null; value_low?: number | null; value_high?: number | null; id: string; }[])).toThrow(/metric/);
    
    const res = spreadByScenario([r1, r2, r3, r4] as { scenario_mapping: string; outcome_metric: string; value?: number | null; value_low?: number | null; value_high?: number | null; id: string; }[]);
    expect(res.expected).toEqual({ count: 2, min: 1, max: 3, ids: ["1", "2"] });
    expect(res.optimistic).toEqual({ count: 1, min: 5, max: 6, ids: ["3"] });
    expect(res.pessimistic).toEqual({ count: 0, min: null, max: null, ids: [] });
    expect(res.not_stated).toEqual({ count: 0, min: null, max: null, ids: [] });
});
