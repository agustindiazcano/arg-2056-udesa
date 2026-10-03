from scripts.dataset_checks import (
    check_ai_estimates,
    check_base_rates,
    check_dataset_catalog,
    check_external_forecasts,
    check_forecast_vintages,
)


def test_common_checks_snippet():
    # 26 words
    snippet_26 = " ".join(["word"] * 26)
    r1 = {"id": "1", "snippet": snippet_26}
    errors = check_base_rates([r1])
    assert any("25 words" in e or "longer than" in e for e in errors)
    
    # 25 words
    snippet_25 = " ".join(["word"] * 25)
    r2 = {"id": "2", "snippet": snippet_25}
    errors2 = check_base_rates([r2])
    assert not any("snippet" in e.lower() for e in errors2)


def test_common_checks_id_duplicate():
    r1 = {"id": "1"}
    r2 = {"id": "1"}
    errors = check_base_rates([r1, r2])
    assert any("Duplicate" in e and "id" in e for e in errors)


def test_common_checks_value_range():
    # value_low > value_high
    r1 = {"id": "1", "value_low": 5, "value_high": 3, "value": None}
    errors1 = check_base_rates([r1])
    assert any("value_low" in e and "value_high" in e for e in errors1)

    # value outside range
    r2 = {"id": "2", "value_low": 1, "value_high": 5, "value": 6}
    errors2 = check_base_rates([r2])
    assert any("outside" in e for e in errors2)
    
    # valid
    r3 = {"id": "3", "value_low": 1, "value_high": 5, "value": 3}
    assert not any("value_low" in e for e in check_base_rates([r3]))

def test_check_external_forecasts():
    # duplicate key
    r1 = {
        "id": "1",
        "forecaster": "F1",
        "vintage": "V1",
        "indicator": "I1",
        "geo": "G1",
        "year": 2020,
        "scenario_by_source": "S1",
        "variant": "V1",
        "source_id": "economy:S01"
    }
    r2 = r1.copy()
    r2["id"] = "2"
    errors = check_external_forecasts([r1, r2])
    assert any("Duplicate key" in e for e in errors)
    
    # same key but different source_id -> passes
    r3 = r1.copy()
    r3["id"] = "3"
    r3["source_id"] = "economy:S02"
    errors = check_external_forecasts([r1, r3])
    assert not any("Duplicate key" in e for e in errors)

def test_check_forecast_vintages():
    # horizon_years == target_year - year(vintage_date)
    r1 = {"id": "1", "vintage_date": "2020-04-01", "target_year": 2021, "horizon_years": 1}
    errors1 = check_forecast_vintages([r1])
    assert not any("horizon_years" in e for e in errors1)
    
    r2 = {"id": "2", "vintage_date": "2020-04-01", "target_year": 2021, "horizon_years": 2}
    errors2 = check_forecast_vintages([r2])
    assert any("horizon_years" in e for e in errors2)
    
    r3 = {"id": "3", "vintage_date": "2022-04-01", "target_year": 2021, "horizon_years": -1}
    errors3 = check_forecast_vintages([r3])
    assert any("target_year" in e and "before" in e for e in errors3)

def test_check_ai_estimates():
    r1 = {"id": "1", "horizon_start_year": 2025, "horizon_end_year": 2024}
    errors1 = check_ai_estimates([r1])
    assert any("horizon_end_year" in e for e in errors1)
    
    # derivation rules
    r2 = {"id": "2", "horizon_start_year": 2020, "horizon_end_year": 2030, "derived_annualized_pp": 1.0, "derivation": None, "outcome_metric": "gdp_level_gain_pct_cumulative"}
    errors2 = check_ai_estimates([r2])
    assert any("derived_annualized_pp" in e and "derivation" in e for e in errors2)
    
    r3 = {"id": "3", "horizon_start_year": 2020, "horizon_end_year": 2030, "derived_annualized_pp": 1.0, "derivation": "formula", "outcome_metric": "gdp_growth_pp_per_year"}
    errors3 = check_ai_estimates([r3])
    assert any("cumulative" in e for e in errors3)
    
    # compounding
    # n = 10, value = 10% -> 1.1^(1/10) - 1 = 0.009567 -> 0.9567 pp
    r4 = {
        "id": "4",
        "horizon_start_year": 2020, "horizon_end_year": 2030,
        "value": 10.0,
        "derived_annualized_pp": 0.96, # within 0.01 tolerance
        "derivation": "calc",
        "outcome_metric": "gdp_level_gain_pct_cumulative"
    }
    errors4 = check_ai_estimates([r4])
    assert not any("compounding" in e for e in errors4)
    
    r5 = r4.copy()
    r5["derived_annualized_pp"] = 1.0 # 10 / 10 is wrong, should fail exact compounding
    errors5 = check_ai_estimates([r5])
    assert any("compounding" in e for e in errors5)
    
    r6 = r4.copy()
    r6["horizon_end_year"] = 2020 # n = 0
    errors6 = check_ai_estimates([r6])
    assert any("n == 0" in e for e in errors6)
    
    # record_type rules
    r7 = {"id": "7", "record_type": "adoption", "outcome_metric": "gdp_growth_pp_per_year"}
    errors7 = check_ai_estimates([r7])
    assert any("adoption" in e for e in errors7)
    
    r8 = {"id": "8", "record_type": "exposure", "outcome_metric": "gdp_growth_pp_per_year"}
    errors8 = check_ai_estimates([r8])
    assert any("exposure" in e for e in errors8)
    
    r9 = {"id": "9", "record_type": "projection", "outcome_metric": "adoption_rate_pct"}
    errors9 = check_ai_estimates([r9])
    assert any("adoption_rate_pct" in e for e in errors9)
    
def test_check_dataset_catalog():
    # duplicate (dataset_name, version)
    r1 = {"dataset_name": "A", "version": "1"}
    r2 = {"dataset_name": "A", "version": "1"}
    errors1 = check_dataset_catalog([r1, r2])
    assert any("Duplicate" in e for e in errors1)
    
    # access not_opened with recommended_use requires note
    r3 = {"dataset_name": "B", "version": "1", "access": "not_opened", "recommended_use": "calibration"}
    errors3 = check_dataset_catalog([r3])
    assert any("note" in e for e in errors3)
    
    r4 = {"dataset_name": "C", "version": "1", "access": "not_opened", "recommended_use": "calibration", "note": "contact author"}
    errors4 = check_dataset_catalog([r4])
    assert not any("note" in e for e in errors4)
