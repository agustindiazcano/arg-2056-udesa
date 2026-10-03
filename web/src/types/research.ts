import Ajv from 'ajv/dist/2020';
import addFormats from 'ajv-formats';
import externalForecastsSchema from '../../../data/schemas/external_forecasts.schema.json';
import forecastVintagesSchema from '../../../data/schemas/forecast_vintages.schema.json';
import baseRatesSchema from '../../../data/schemas/base_rates.schema.json';
import aiEstimatesSchema from '../../../data/schemas/ai_estimates.schema.json';
import datasetCatalogSchema from '../../../data/schemas/dataset_catalog.schema.json';

const ajv = new Ajv();
addFormats(ajv);

export enum ScenarioMapping {
    pessimistic = 'pessimistic',
    expected = 'expected',
    optimistic = 'optimistic',
    not_stated = 'not_stated'
}

export enum AiOutcomeMetric {
    tfp_level_gain_pct_cumulative = 'tfp_level_gain_pct_cumulative',
    tfp_growth_pp_per_year = 'tfp_growth_pp_per_year',
    labor_productivity_gain_pct_cumulative = 'labor_productivity_gain_pct_cumulative',
    labor_productivity_growth_pp_per_year = 'labor_productivity_growth_pp_per_year',
    gdp_level_gain_pct_cumulative = 'gdp_level_gain_pct_cumulative',
    gdp_growth_pp_per_year = 'gdp_growth_pp_per_year',
    employment_exposed_pct = 'employment_exposed_pct',
    employment_displaced_pct = 'employment_displaced_pct',
    adoption_rate_pct = 'adoption_rate_pct',
    other = 'other'
}

export enum AiRecordType {
    projection = 'projection',
    observed = 'observed',
    exposure = 'exposure',
    adoption = 'adoption'
}

export enum AiGeography {
    global = 'global',
    advanced_economies = 'advanced_economies',
    emerging_economies = 'emerging_economies',
    latam = 'latam',
    argentina = 'argentina',
    us = 'us',
    eu = 'eu',
    other = 'other'
}

export interface ExternalForecast {
    id: string;
    forecaster: string;
    publication_title: string;
    vintage: string;
    indicator: string;
    geo: string;
    year: number;
    value?: number | null;
    value_low?: number | null;
    value_high?: number | null;
    unit: string;
    price_basis?: string | null;
    scenario_by_source?: string | null;
    scenario_mapping: ScenarioMapping | string;
    mapping_rationale?: string | null;
    variant?: string | null;
    assumptions?: string | null;
    source_id: string;
    source: string;
    source_url?: string | null;
    locator?: string | null;
    snippet?: string | null;
    confidence: string;
    retrieved_at: string;
    note?: string;
}

export interface ForecastVintage {
    id: string;
    forecaster: string;
    vintage_date: string;
    indicator: string;
    target_year: number;
    horizon_years: number;
    forecast_value: number;
    unit: string;
    source_id: string;
    source: string;
    source_url?: string | null;
    locator?: string | null;
    snippet?: string | null;
    confidence: string;
    retrieved_at: string;
    note?: string;
}

export interface BaseRate {
    id: string;
    description: string;
    country_or_group: string;
    period: string;
    metric: string;
    value?: number | null;
    unit: string;
    definition: string;
    source_id: string;
    source: string;
    source_url?: string | null;
    locator?: string | null;
    snippet?: string | null;
    confidence: string;
    retrieved_at: string;
    note?: string;
}

export interface AiEstimate {
    id: string;
    authors_or_institution: string;
    title: string;
    publication_date: string;
    publisher_type: string;
    sponsor_conflict_note?: string | null;
    record_type: AiRecordType | string;
    geography: AiGeography | string;
    geography_detail?: string | null;
    outcome_metric: AiOutcomeMetric | string;
    horizon_start_year: number;
    horizon_end_year: number;
    value?: number | null;
    value_low?: number | null;
    value_high?: number | null;
    unit: string;
    scenario_by_source?: string | null;
    scenario_mapping: ScenarioMapping | string;
    mapping_rationale?: string | null;
    method: string;
    key_assumptions?: string | null;
    time_profile: string;
    derived_annualized_pp?: number | null;
    derivation?: string | null;
    source_id: string;
    source: string;
    source_url?: string | null;
    locator?: string | null;
    snippet?: string | null;
    confidence: string;
    retrieved_at: string;
    note?: string;
}

export interface DatasetCatalogEntry {
    dataset_name: string;
    version?: string | null;
    publisher: string;
    landing_url: string;
    direct_download_url?: string | null;
    variables: string[];
    geographies: string[];
    years_covered: string;
    frequency: string;
    format: string;
    license_or_terms?: string | null;
    access: string;
    revisions_or_rebasing_notes?: string | null;
    recommended_use?: string;
    source_id: string;
    source: string;
    source_url?: string | null;
    locator?: string | null;
    snippet?: string | null;
    confidence: string;
    retrieved_at: string;
    note?: string;
}

const validateExternalForecasts = ajv.compile<ExternalForecast[]>(externalForecastsSchema);
const validateForecastVintages = ajv.compile<ForecastVintage[]>(forecastVintagesSchema);
const validateBaseRates = ajv.compile<BaseRate[]>(baseRatesSchema);
const validateAiEstimates = ajv.compile<AiEstimate[]>(aiEstimatesSchema);
const validateDatasetCatalog = ajv.compile<DatasetCatalogEntry[]>(datasetCatalogSchema);

export function parseExternalForecasts(json: unknown): ExternalForecast[] {
    if (validateExternalForecasts(json)) return json;
    throw new Error(`Invalid external forecasts: ${ajv.errorsText(validateExternalForecasts.errors)}`);
}

export function parseForecastVintages(json: unknown): ForecastVintage[] {
    if (validateForecastVintages(json)) return json;
    throw new Error(`Invalid forecast vintages: ${ajv.errorsText(validateForecastVintages.errors)}`);
}

export function parseBaseRates(json: unknown): BaseRate[] {
    if (validateBaseRates(json)) return json;
    throw new Error(`Invalid base rates: ${ajv.errorsText(validateBaseRates.errors)}`);
}

export function parseAiEstimates(json: unknown): AiEstimate[] {
    if (validateAiEstimates(json)) return json;
    throw new Error(`Invalid ai estimates: ${ajv.errorsText(validateAiEstimates.errors)}`);
}

export function parseDatasetCatalog(json: unknown): DatasetCatalogEntry[] {
    if (validateDatasetCatalog(json)) return json;
    throw new Error(`Invalid dataset catalog: ${ajv.errorsText(validateDatasetCatalog.errors)}`);
}

export function selectExternalForecasts(
    records: ExternalForecast[],
    filters: { indicator?: string; geo?: string; scenarioMapping?: string; variant?: string; forecaster?: string; }
): ExternalForecast[] {
    let filtered = records;
    if (filters.indicator) filtered = filtered.filter(r => r.indicator === filters.indicator);
    if (filters.geo) filtered = filtered.filter(r => r.geo === filters.geo);
    if (filters.scenarioMapping) filtered = filtered.filter(r => r.scenario_mapping === filters.scenarioMapping);
    if (filters.variant) filtered = filtered.filter(r => r.variant === filters.variant);
    if (filters.forecaster) filtered = filtered.filter(r => r.forecaster === filters.forecaster);

    return filtered.sort((a, b) => {
        if (a.forecaster !== b.forecaster) return a.forecaster.localeCompare(b.forecaster);
        if (a.vintage !== b.vintage) return a.vintage.localeCompare(b.vintage);
        return a.year - b.year;
    });
}

export function selectAiEstimates(
    records: AiEstimate[],
    filters: { outcomeMetric: AiOutcomeMetric | string; geography?: AiGeography | string; scenarioMapping?: string; recordType?: string; }
): AiEstimate[] {
    let filtered = records.filter(r => r.outcome_metric === filters.outcomeMetric);
    if (filters.geography) filtered = filtered.filter(r => r.geography === filters.geography);
    if (filters.scenarioMapping) filtered = filtered.filter(r => r.scenario_mapping === filters.scenarioMapping);
    if (filters.recordType) filtered = filtered.filter(r => r.record_type === filters.recordType);

    return filtered.sort((a, b) => {
        if (a.publication_date !== b.publication_date) {
            return b.publication_date.localeCompare(a.publication_date); // desc
        }
        return a.id.localeCompare(b.id);
    });
}

export function spreadByScenario(records: Array<{ scenario_mapping: string | ScenarioMapping; outcome_metric: string; value?: number | null; value_low?: number | null; value_high?: number | null; id: string; }>) {
    if (records.length > 0) {
        const metric = records[0]!.outcome_metric;
        if (!records.every(r => r.outcome_metric === metric)) {
            throw new Error(`Mixed outcome_metric in spreadByScenario: ${metric}`);
        }
    }

    const init = () => ({ count: 0, min: null as number | null, max: null as number | null, ids: [] as string[] });
    const result = {
        pessimistic: init(),
        expected: init(),
        optimistic: init(),
        not_stated: init()
    };

    for (const r of records) {
        const scenario = r.scenario_mapping;
        if (scenario !== 'pessimistic' && scenario !== 'expected' && scenario !== 'optimistic' && scenario !== 'not_stated') {
            continue;
        }

        const vLow = r.value_low != null ? r.value_low : r.value;
        const vHigh = r.value_high != null ? r.value_high : r.value;

        if (vLow == null || vHigh == null) {
            continue; // Ignore records with no number
        }

        const group = result[scenario];
        group.count++;
        group.ids.push(r.id);
        
        if (group.min === null || vLow < group.min) group.min = vLow;
        if (group.max === null || vHigh > group.max) group.max = vHigh;
    }

    return result;
}
