import json
import random
import sys
from pathlib import Path

SEED = 2056
RETRIEVED_AT = "2026-10-02"

PROVINCES = [
    "AR-A", "AR-B", "AR-C", "AR-D", "AR-E", "AR-F", "AR-G", "AR-H", "AR-J",
    "AR-K", "AR-L", "AR-M", "AR-N", "AR-P", "AR-Q", "AR-R", "AR-S", "AR-T",
    "AR-U", "AR-V", "AR-W", "AR-X", "AR-Y", "AR-Z"
]

def dump_json(data, path):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, sort_keys=True, ensure_ascii=False)
        f.write("\n")

def gen_economy(rng):
    countries = ["ARG", "BRA", "CHL", "MEX", "COL", "PER", "URY"]
    indicators = ["gdp_constant_usd", "gdp_per_capita_usd", "population", "hdi"]
    
    data = []
    nulls_added = 0
    
    for country in countries:
        for ind in indicators:
            val = rng.uniform(10, 1000)
            
            # gap for URY
            is_gap_series = (country == "URY" and ind == "gdp_constant_usd")
            
            for year in range(1880, 2026):
                if ind == "hdi" and year < 1990:
                    continue
                    
                if is_gap_series and 1900 <= year <= 1905:
                    continue # multi-year gap
                    
                # random walk with crises
                val *= rng.uniform(0.95, 1.06)
                if rng.random() < 0.05: # crisis
                    val *= rng.uniform(0.7, 0.9)
                
                record = {
                    "country": country,
                    "indicator": ind,
                    "year": year,
                    "value": round(val, 2),
                    "unit": "mock_unit",
                    "source": "MOCK",
                    "retrieved_at": RETRIEVED_AT
                }
                
                # Add >= 3 nulls
                if nulls_added < 4 and rng.random() < 0.01:
                    record["value"] = None
                    record["note"] = "Mock missing data"
                    nulls_added += 1
                    
                data.append(record)
                
    # ensure at least 3 nulls if rng didn't hit
    while nulls_added < 3:
        idx = rng.randint(0, len(data) - 1)
        if data[idx]["value"] is not None:
            data[idx]["value"] = None
            data[idx]["note"] = "Forced missing data"
            nulls_added += 1
            
    return data

def gen_resource_production(rng):
    resources = ["lithium", "copper", "gold", "oil", "gas", "soy"]
    data = []
    nulls_added = 0
    
    resource_provs = {}
    for r in resources:
        num_provs = rng.randint(3, 8)
        provs = rng.sample(PROVINCES, num_provs)
        resource_provs[r] = provs
        
        # for each geo (AR + provs), generate series
        geos = ["AR"] + provs
        for geo in geos:
            val = rng.uniform(10, 100)
            shape = rng.choice(["growth", "plateau", "decline"])
            for year in range(1990, 2026):
                if shape == "growth":
                    val *= rng.uniform(1.0, 1.1)
                elif shape == "plateau":
                    val *= rng.uniform(0.95, 1.05)
                else:
                    val *= rng.uniform(0.9, 1.0)
                    
                record = {
                    "geo": geo,
                    "resource": r,
                    "year": year,
                    "value": round(val, 2),
                    "unit": "tonnes",
                    "source": "MOCK",
                    "retrieved_at": RETRIEVED_AT
                }
                
                if nulls_added < 4 and rng.random() < 0.01:
                    record["value"] = None
                    record["note"] = "Mock missing resource"
                    nulls_added += 1
                    
                data.append(record)
                
    while nulls_added < 3:
        idx = rng.randint(0, len(data) - 1)
        if data[idx]["value"] is not None:
            data[idx]["value"] = None
            data[idx]["note"] = "Forced missing resource"
            nulls_added += 1
            
    return data, resource_provs

def gen_population(rng):
    data = []
    geos = ["AR"] + PROVINCES
    for geo in geos:
        val = rng.uniform(10000, 1000000)
        for year in range(1950, 2026, 5):
            val *= rng.uniform(1.01, 1.2)
            data.append({
                "geo": geo,
                "year": year,
                "value": int(val),
                "unit": "people",
                "source": "MOCK",
                "retrieved_at": RETRIEVED_AT
            })
    return data

def gen_andes_events(rng):
    data = []
    day = 0
    null_elevations = 0
    null_men = 0
    
    for i in range(1, 11):
        day += rng.randint(0, 4) # non-decreasing
        
        event = {
            "id": f"mock-andes-{i:02d}",
            "name": f"MOCK event {i}",
            "day_of_campaign": day,
            "date": "1817-01-01",
            "lat": round(rng.uniform(-34.5, -32.0), 4),
            "lon": round(rng.uniform(-71.0, -68.0), 4),
            "date_precision": rng.choice(["day", "month"]),
            "elevation_m": rng.randint(500, 4000),
            "forces": [
                {"side": "MOCK side A", "men": rng.randint(100, 5000)},
                {"side": "MOCK side B", "men": rng.randint(100, 5000)}
            ],
            "source": "MOCK",
            "retrieved_at": RETRIEVED_AT
        }
        
        if null_elevations < 2 and rng.random() < 0.3:
            event["elevation_m"] = None
            event["note"] = "Unknown elevation"
            null_elevations += 1
            
        if null_men < 1 and rng.random() < 0.3:
            event["forces"][0]["men"] = None
            event["forces"][0]["note"] = "Unknown men"
            null_men += 1
            
        data.append(event)
        
    while null_elevations < 2:
        idx = rng.randint(0, 9)
        if data[idx].get("elevation_m") is not None:
            data[idx]["elevation_m"] = None
            data[idx]["note"] = "Forced unknown elevation"
            null_elevations += 1
            
    while null_men < 1:
        data[0]["forces"][1]["men"] = None
        data[0]["forces"][1]["note"] = "Forced unknown men"
        null_men += 1
        
    return data

def gen_forecast(rng, resource_provs):
    series = []
    
    def make_series(ind, res, geo):
        for scen in ["pessimistic", "expected", "optimistic"]:
            for ai in ["off", "on"]:
                s = {
                    "indicator": ind,
                    "geo": geo,
                    "scenario": scen,
                    "ai_overlay": ai,
                    "unit": "mock_unit",
                    "points": []
                }
                if res:
                    s["resource"] = res
                    
                # Base val depends on scenario and AI so we can maintain invariants
                base = 100.0
                if scen == "optimistic": base += 50
                elif scen == "pessimistic": base -= 50
                if ai == "on": base += 20
                
                width = 10.0
                for year in range(2026, 2057):
                    # fan width non-decreasing
                    width += rng.uniform(0.1, 1.0)
                    # p50 order is maintained because we just grow from separated bases
                    p50 = base + (year - 2026) * 2.0
                    p10 = p50 - width/2
                    p90 = p50 + width/2
                    
                    s["points"].append({
                        "year": year,
                        "p10": round(p10, 2),
                        "p50": round(p50, 2),
                        "p90": round(p90, 2)
                    })
                series.append(s)
                
    # AR
    for ind in ["gdp_constant_usd", "gdp_per_capita_usd", "population", "hdi"]:
        make_series(ind, None, "AR")
        
    for r in ["lithium", "copper", "gold", "oil", "gas", "soy"]:
        make_series("resource_production", r, "AR")
        # Provinces
        for p in resource_provs.get(r, []):
            make_series("resource_production", r, p)
            
    return {
        "model_version": "1.0.0-mock",
        "generated_at": RETRIEVED_AT,
        "source": "MOCK",
        "horizon": {"start_year": 2026, "end_year": 2056},
        "series": series
    }

def gen_composition(rng):
    data = []
    nulls_added = 0
    groups = ["Primary", "Secondary", "Tertiary", "Quaternary", "Quinary"]
    
    for kind in ["gdp_by_sector", "exports_by_product"]:
        leaves = []
        for g in groups:
            num_leaves = rng.randint(3, 5)
            for i in range(num_leaves):
                cat_id = f"{kind.replace('_', '-')}-{g.lower()}-{i}"
                leaves.append({"group": g, "category": cat_id, "share": rng.uniform(5, 20)})
                
        total = sum(l["share"] for l in leaves)
        for l in leaves:
            l["share"] = (l["share"] / total) * 1000
            l["drift"] = rng.uniform(0.98, 1.02)
            
        for year in range(2000, 2026):
            for l in leaves:
                l["share"] *= l["drift"]
            
            for l in leaves:
                if year < 2005 and l["category"].endswith("-0") and kind == "gdp_by_sector":
                    continue
                    
                record = {
                    "kind": kind,
                    "year": year,
                    "group": l["group"],
                    "category": l["category"],
                    "label": f"Mock {l['category']}",
                    "value_usd": round(l["share"], 2),
                    "source": "MOCK",
                    "retrieved_at": RETRIEVED_AT
                }
                
                if nulls_added < 2 and rng.random() < 0.01:
                    record["value_usd"] = None
                    record["note"] = "Mock missing composition data"
                    nulls_added += 1
                    
                data.append(record)
                
    while nulls_added < 2:
        idx = rng.randint(0, len(data) - 1)
        if data[idx]["value_usd"] is not None:
            data[idx]["value_usd"] = None
            data[idx]["note"] = "Forced missing composition data"
            nulls_added += 1
            
    return data

def gen_projects(rng, resource_provs):
    data = []
    nulls_added = 0
    resources = ["lithium", "copper", "gold", "oil", "gas"]
    statuses = ["operating", "ramp_up", "construction", "approved", "feasibility", "prefeasibility", "exploration", "announced"]
    
    status_pool = statuses * 2 + [rng.choice(statuses) for _ in range(30 - 16)]
    rng.shuffle(status_pool)
    
    for i in range(30):
        r = rng.choice(resources)
        provs = resource_provs.get(r, [])
        geo = rng.choice(provs) if provs else "AR-B"
        has_capacity = rng.choice([True, False])
        
        record = {
            "id": f"mock-proj-{i}",
            "name": f"Mock Project {i}",
            "resource": r,
            "geo": geo,
            "status": status_pool[i],
            "company": f"Mock Company {i}",
            "owners": [f"Owner {i}A", f"Owner {i}B"],
            "capex_usd": round(rng.uniform(1e6, 1e9), 2),
            "start_year": rng.randint(2020, 2035),
            "capacity_per_year": round(rng.uniform(1000, 50000), 2) if has_capacity else None,
            "capacity_unit": "t_per_year" if has_capacity else None,
            "source": "MOCK",
            "retrieved_at": RETRIEVED_AT
        }
        
        if not has_capacity:
            record["note"] = "Mock missing capacity"
            
        if nulls_added < 3 and rng.random() < 0.2:
            record["capex_usd"] = None
            if "note" in record:
                record["note"] += "; Mock missing capex"
            else:
                record["note"] = "Mock missing capex"
            nulls_added += 1
            
        data.append(record)
        
    while nulls_added < 3:
        idx = rng.randint(0, len(data) - 1)
        if data[idx].get("capex_usd") is not None:
            data[idx]["capex_usd"] = None
            data[idx]["note"] = "Forced missing capex"
            nulls_added += 1
            
    return data

def gen_projections(rng, projects, resource_provs):
    data = []
    
    def get_unit_basis(resource):
        if resource == "lithium": return "lce"
        if resource == "copper": return "contained_cu"
        return None

    # Projects
    advanced_statuses = {"operating", "ramp_up", "construction", "approved"}
    null_bounds_added = 0
    disagreements_added = 0

    for proj in projects:
        ub = get_unit_basis(proj["resource"])
        base_record = {
            "entity_type": "project",
            "project_id": proj["id"],
            "geo": proj["geo"],
            "resource": proj["resource"],
            "unit": proj["capacity_unit"] or "t_per_year",
            "scenario": "base",
            "source": "MOCK",
            "retrieved_at": RETRIEVED_AT
        }
        if ub: base_record["unit_basis"] = ub

        start_year = proj["start_year"] or 2025
        nameplate = proj["capacity_per_year"] or 10000

        if proj["status"] in advanced_statuses:
            end_year = min(start_year + 14, 2040)
            for y in range(start_year, end_year + 1):
                # ramp linearly to nameplate in 3 years
                ramp_factor = min((y - start_year + 1) / 3, 1.0)
                val = nameplate * ramp_factor
                rec = dict(base_record)
                rec.update({"metric": "production_expected", "year": y, "value": val})
                
                # add disagreement
                if disagreements_added < 4 and y == start_year + 2 and rng.random() < 0.3:
                    rec["confidence"] = "high"
                    rec2 = dict(rec)
                    rec2["source"] = "MOCK2"
                    rec2["value"] = val * 0.8
                    rec2["confidence"] = "medium"
                    data.append(rec2)
                    disagreements_added += 1
                
                data.append(rec)
            
            # capacity_nameplate row at start_year + 3
            cap_rec = dict(base_record)
            cap_rec.update({"metric": "capacity_nameplate", "year": start_year + 3, "value": nameplate})
            data.append(cap_rec)
        else:
            # only capacity_nameplate row
            cap_rec = dict(base_record)
            cap_rec.update({"metric": "capacity_nameplate", "year": start_year + 3, "value": nameplate})
            
            if null_bounds_added < 3 and rng.random() < 0.3:
                cap_rec["value"] = None
                cap_rec["value_low"] = nameplate * 0.8
                cap_rec["value_high"] = nameplate * 1.2
                null_bounds_added += 1
                
            data.append(cap_rec)
            
    while null_bounds_added < 3:
        # find an early-stage project row to modify
        for row in data:
            if row["metric"] == "capacity_nameplate" and row.get("value") is not None:
                v = row["value"]
                row["value"] = None
                row["value_low"] = v * 0.8
                row["value_high"] = v * 1.2
                null_bounds_added += 1
                if null_bounds_added >= 3:
                    break

    while disagreements_added < 4:
        # force disagreement on an existing production_expected row
        for row in data:
            if row["metric"] == "production_expected" and row["source"] == "MOCK":
                row["confidence"] = "high"
                r2 = dict(row)
                r2["source"] = "MOCK2"
                r2["value"] = row["value"] * 0.9
                r2["confidence"] = "medium"
                data.append(r2)
                disagreements_added += 1
                if disagreements_added >= 4:
                    break

    # Provinces forecast
    provs_selected = rng.sample(PROVINCES, 3)
    resources_selected = rng.sample(["lithium", "copper", "gold", "oil", "gas"], 3)
    for p in provs_selected:
        for r in resources_selected:
            ub = get_unit_basis(r)
            for y in range(2026, 2036):
                val_base = 1000 + (y - 2026) * 50
                for scen, mul in [("low", 0.8), ("base", 1.0), ("high", 1.2)]:
                    rec = {
                        "entity_type": "province",
                        "geo": p,
                        "resource": r,
                        "metric": "forecast",
                        "year": y,
                        "value": val_base * mul,
                        "unit": "t_per_year",
                        "scenario": scen,
                        "source": "MOCK",
                        "retrieved_at": RETRIEVED_AT
                    }
                    if ub: rec["unit_basis"] = ub
                    data.append(rec)

    # National forecast
    for r in ["lithium", "copper", "oil"]:
        ub = get_unit_basis(r)
        for y in range(2026, 2036):
            rec = {
                "entity_type": "national",
                "geo": "AR",
                "resource": r,
                "metric": "forecast",
                "year": y,
                "value": 50000 + (y - 2026) * 2000,
                "unit": "t_per_year",
                "scenario": "base",
                "source": "MOCK",
                "retrieved_at": RETRIEVED_AT
            }
            if ub: rec["unit_basis"] = ub
            data.append(rec)
            
    # National agriculture forecast
    for r in ["soy", "corn", "wheat"]:
        for y in range(2026, 2036):
            period = f"{y-1}/{str(y)[2:]}"
            rec = {
                "entity_type": "national",
                "geo": "AR",
                "resource": r,
                "metric": "forecast",
                "year": y,
                "period_label": period,
                "value": 30000000 + (y - 2026) * 1000000,
                "unit": "t",
                "scenario": "base",
                "source": "MOCK",
                "retrieved_at": RETRIEVED_AT
            }
            data.append(rec)

    return data

def gen_external_forecasts(rng):
    forecasters = ["MOCK_IMF", "MOCK_WB", "MOCK_OECD"]
    indicators = ["gdp_growth_real_pct", "population", "fertility_rate"]
    variants = ["low", "medium", "high"]
    mappings = ["pessimistic", "expected", "optimistic"]
    
    data = []
    i = 0
    base_record = {
        "publication_title": "Report",
        "vintage": "2026",
        "price_basis": None,
        "mapping_rationale": None,
        "scenario_by_source": None,
        "variant": None,
        "assumptions": None,
        "source_url": None,
        "locator": None,
        "snippet": None,
        "confidence": "high",
        "retrieved_at": RETRIEVED_AT
    }
    for f in forecasters:
        for ind in indicators:
            geos = ["AR"]
            if ind == "population":
                geos.extend(["AR-A", "AR-B", "AR-C"])
            
            for geo in geos:
                for y in range(2025, 2057):
                    # UN-style rows
                    if ind == "population":
                        base_val = 45.0 + (y - 2025) * 0.1
                        for v, m in zip(variants, mappings):
                            val = base_val
                            if v == "low": val -= 1.0
                            if v == "high": val += 1.0
                            i += 1
                            rec = dict(base_record)
                            rec.update({
                                "id": f"ef{i}",
                                "forecaster": f,
                                "indicator": ind,
                                "geo": geo,
                                "year": y,
                                "value": round(val, 2),
                                "value_low": None,
                                "value_high": None,
                                "unit": "millions",
                                "scenario_mapping": m,
                                "mapping_rationale": "mock rationale",
                                "variant": v,
                                "source_id": f"mock:M{i:03d}",
                                "source": "MOCK"
                            })
                            data.append(rec)
                    else:
                        # other indicators
                        val_opt = 3.0
                        val_exp = 2.0
                        val_pes = 1.0
                        
                        i += 1
                        rec_pes = dict(base_record)
                        rec_pes.update({
                            "id": f"ef{i}_pes", "forecaster": f, "indicator": ind, "geo": geo, "year": y,
                            "value": val_pes, "value_low": None, "value_high": None, "unit": "pct", "scenario_mapping": "pessimistic", "mapping_rationale": "r", "source_id": f"mock:M{i:03d}p", "source": "MOCK"
                        })
                        data.append(rec_pes)
                        
                        rec_exp = dict(base_record)
                        rec_exp.update({
                            "id": f"ef{i}_exp", "forecaster": f, "indicator": ind, "geo": geo, "year": y,
                            "value": val_exp, "value_low": None, "value_high": None, "unit": "pct", "scenario_mapping": "expected", "mapping_rationale": "r", "source_id": f"mock:M{i:03d}e", "source": "MOCK"
                        })
                        data.append(rec_exp)
                        
                        rec_opt = dict(base_record)
                        rec_opt.update({
                            "id": f"ef{i}_opt", "forecaster": f, "indicator": ind, "geo": geo, "year": y,
                            "value": val_opt, "value_low": None, "value_high": None, "unit": "pct", "scenario_mapping": "optimistic", "mapping_rationale": "r", "source_id": f"mock:M{i:03d}o", "source": "MOCK"
                        })
                        data.append(rec_opt)

    # at least 2 rows with not_stated
    rec_ns1 = dict(base_record)
    rec_ns1.update({
        "id": "ef_ns1", "forecaster": "MOCK_IMF", "indicator": "gdp_growth_real_pct", "geo": "AR", "year": 2026,
        "value": 1.0, "value_low": None, "value_high": None, "unit": "pct", "scenario_mapping": "not_stated", "source_id": "mock:NS1", "source": "MOCK"
    })
    data.append(rec_ns1)
    
    rec_ns2 = dict(base_record)
    rec_ns2.update({
        "id": "ef_ns2", "forecaster": "MOCK_IMF", "indicator": "gdp_growth_real_pct", "geo": "AR", "year": 2026,
        "value": 1.0, "value_low": None, "value_high": None, "unit": "pct", "scenario_mapping": "not_stated", "source_id": "mock:NS2", "source": "MOCK"
    })
    data.append(rec_ns2)

    # at least 3 rows with value: null and a range or a note
    for j in range(3):
        rec_null = dict(base_record)
        rec_null.update({
            "id": f"ef_null_{j}", "forecaster": "MOCK_IMF", "indicator": "gdp_growth_real_pct", "geo": "AR", "year": 2026,
            "value": None, "value_low": None, "value_high": None, "unit": "pct", "scenario_mapping": "not_stated", "source_id": f"mock:NULL{j}", "source": "MOCK", "note": "null value"
        })
        data.append(rec_null)

    return data

def gen_forecast_vintages(rng):
    data = []
    i = 0
    base_record = {
        "source_url": None,
        "locator": None,
        "snippet": None
    }
    for f in ["MOCK_IMF", "MOCK_WB"]:
        for ty in range(2008, 2021):
            for hy in range(1, 6):
                i += 1
                vy = ty - hy
                rec = dict(base_record)
                rec.update({
                    "id": f"fv{i}",
                    "forecaster": f,
                    "vintage_date": f"{vy}-04-01",
                    "indicator": "gdp_growth_real_pct",
                    "target_year": ty,
                    "horizon_years": hy,
                    "forecast_value": round(rng.uniform(-5.0, 8.0), 1),
                    "unit": "pct",
                    "source_id": f"mock:M{i:03d}",
                    "source": "MOCK",
                    "confidence": "high",
                    "retrieved_at": RETRIEVED_AT
                })
                data.append(rec)
    return data

def gen_base_rates(rng):
    data = []
    base_record = {
        "source_url": None,
        "locator": None,
        "snippet": None
    }
    for i in range(5):
        rec = dict(base_record)
        rec.update({
            "id": f"br{i}",
            "description": "desc",
            "country_or_group": "AR",
            "period": "1990-2000",
            "metric": "gdp",
            "value": 2.0,
            "unit": "pct",
            "definition": "def",
            "source_id": f"mock:M{i:03d}",
            "source": "MOCK",
            "confidence": "high",
            "retrieved_at": RETRIEVED_AT
        })
        data.append(rec)
    
    rec_null = dict(base_record)
    rec_null.update({
        "id": "br_null",
        "description": "desc",
        "country_or_group": "AR",
        "period": "1990-2000",
        "metric": "gdp",
        "value": None,
        "unit": "pct",
        "definition": "def",
        "source_id": "mock:M_null",
        "source": "MOCK",
        "confidence": "high",
        "retrieved_at": RETRIEVED_AT,
        "note": "null value"
    })
    data.append(rec_null)
    return data

def gen_ai_estimates(rng):
    data = []
    
    base_record = {
        "sponsor_conflict_note": None,
        "geography_detail": None,
        "value_low": None,
        "value_high": None,
        "scenario_by_source": None,
        "mapping_rationale": None,
        "key_assumptions": None,
        "derived_annualized_pp": None,
        "derivation": None,
        "source_url": None,
        "locator": None,
        "snippet": None
    }
    
    metrics = ["tfp_level_gain_pct_cumulative", "labor_productivity_gain_pct_cumulative", "employment_exposed_pct"]
    geos = ["argentina", "global", "us"]
    pubs = ["peer_reviewed", "consultancy", "think_tank"]
    
    for i in range(6):
        rec = dict(base_record)
        rec.update({
            "id": f"a{i}", "authors_or_institution": "A", "title": "T", "publication_date": "2026-01-01",
            "publisher_type": pubs[i % 3], "record_type": "projection", "geography": geos[i % 3],
            "outcome_metric": metrics[0], "horizon_start_year": 2026, "horizon_end_year": 2036,
            "value": 10.0, "unit": "pct", "scenario_mapping": "not_stated", "method": "expert_judgment",
            "time_profile": "linear", "derived_annualized_pp": 0.96, "derivation": "d",
            "source_id": f"mock:M{i:03d}", "source": "MOCK", "confidence": "high", "retrieved_at": RETRIEVED_AT
        })
        data.append(rec)
    
    # 2 sponsor conflicts
    data[0]["sponsor_conflict_note"] = "C1"
    data[1]["sponsor_conflict_note"] = "C2"
    
    rec_pes = dict(base_record)
    rec_pes.update({
        "id": "a_pes", "authors_or_institution": "A", "title": "T", "publication_date": "2026-01-01",
        "publisher_type": "consultancy", "record_type": "projection", "geography": "argentina",
        "outcome_metric": "tfp_level_gain_pct_cumulative", "horizon_start_year": 2026, "horizon_end_year": 2036,
        "value": 1.0, "value_low": 0.5, "value_high": 1.5, "unit": "pct", "scenario_mapping": "pessimistic", "mapping_rationale": "r", "method": "expert_judgment",
        "time_profile": "linear", "source_id": "mock:M_pes", "source": "MOCK", "confidence": "high", "retrieved_at": RETRIEVED_AT
    })
    data.append(rec_pes)
    
    rec_opt = dict(base_record)
    rec_opt.update({
        "id": "a_opt", "authors_or_institution": "A", "title": "T", "publication_date": "2026-01-01",
        "publisher_type": "consultancy", "record_type": "projection", "geography": "argentina",
        "outcome_metric": "tfp_level_gain_pct_cumulative", "horizon_start_year": 2026, "horizon_end_year": 2036,
        "value": 6.0, "value_low": 5.0, "value_high": 7.0, "unit": "pct", "scenario_mapping": "optimistic", "mapping_rationale": "r", "method": "expert_judgment",
        "time_profile": "linear", "source_id": "mock:M_opt", "source": "MOCK", "confidence": "high", "retrieved_at": RETRIEVED_AT
    })
    data.append(rec_opt)
    
    rec_exp = dict(base_record)
    rec_exp.update({
        "id": "a_exp", "authors_or_institution": "A", "title": "T", "publication_date": "2026-01-01",
        "publisher_type": "consultancy", "record_type": "projection", "geography": "argentina",
        "outcome_metric": "tfp_level_gain_pct_cumulative", "horizon_start_year": 2026, "horizon_end_year": 2036,
        "value": 3.0, "unit": "pct", "scenario_mapping": "expected", "mapping_rationale": "r", "method": "expert_judgment",
        "time_profile": "linear", "source_id": "mock:M_exp", "source": "MOCK", "confidence": "high", "retrieved_at": RETRIEVED_AT
    })
    data.append(rec_exp)
    
    # 2 observed
    for i in range(2):
        rec_obs = dict(base_record)
        rec_obs.update({
            "id": f"a_obs{i}", "authors_or_institution": "A", "title": "T", "publication_date": "2026-01-01",
            "publisher_type": "consultancy", "record_type": "observed", "geography": "global",
            "outcome_metric": "tfp_growth_pp_per_year", "horizon_start_year": 2020, "horizon_end_year": 2025,
            "value": 0.5, "unit": "pp", "scenario_mapping": "not_stated", "method": "expert_judgment",
            "time_profile": "linear", "source_id": f"mock:M_obs{i}", "source": "MOCK", "confidence": "high", "retrieved_at": RETRIEVED_AT
        })
        data.append(rec_obs)
        
    # 2 exposure
    for i in range(3):
        rec_expo = dict(base_record)
        rec_expo.update({
            "id": f"a_expo{i}", "authors_or_institution": "A", "title": "T", "publication_date": "2026-01-01",
            "publisher_type": "consultancy", "record_type": "exposure", "geography": "global",
            "outcome_metric": "employment_exposed_pct", "horizon_start_year": 2026, "horizon_end_year": 2036,
            "value": 20.0, "unit": "pct", "scenario_mapping": "not_stated", "method": "expert_judgment",
            "time_profile": "not_stated", "source_id": f"mock:M_expo{i}", "source": "MOCK", "confidence": "high", "retrieved_at": RETRIEVED_AT
        })
        data.append(rec_expo)
        
    return data

def gen_dataset_catalog(rng):
    data = []
    base_record = {
        "version": None,
        "direct_download_url": None,
        "license_or_terms": None,
        "revisions_or_rebasing_notes": None,
        "recommended_use": None,
        "source_url": None,
        "locator": None,
        "snippet": None
    }
    
    uses = ["calibration", "baseline", "scenario_structure"]
    for i in range(4):
        rec = dict(base_record)
        rec.update({
            "dataset_name": f"D{i}", "publisher": "P", "landing_url": "https://a.com",
            "variables": ["v"], "geographies": ["g"], "years_covered": "y", "frequency": "f",
            "format": "csv", "access": "opened", "recommended_use": uses[i % 3],
            "source_id": f"mock:M{i:03d}", "source": "MOCK", "confidence": "high", "retrieved_at": RETRIEVED_AT
        })
        data.append(rec)
        
    rec_no = dict(base_record)
    rec_no.update({
        "dataset_name": "D_not_opened", "publisher": "P", "landing_url": "https://a.com",
        "variables": ["v"], "geographies": ["g"], "years_covered": "y", "frequency": "f",
        "format": "csv", "access": "not_opened", "recommended_use": "calibration",
        "note": "need request",
        "source_id": "mock:M_no", "source": "MOCK", "confidence": "high", "retrieved_at": RETRIEVED_AT
    })
    data.append(rec_no)
    return data

def main(out_dir: str):
    rng = random.Random(SEED)
    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    
    eco = gen_economy(rng)
    dump_json(eco, out / "economy_series.json")
    
    rp, rprovs = gen_resource_production(rng)
    dump_json(rp, out / "resource_production.json")
    
    pop = gen_population(rng)
    dump_json(pop, out / "population.json")
    
    andes = gen_andes_events(rng)
    dump_json(andes, out / "andes_events.json")
    
    fc = gen_forecast(rng, rprovs)
    dump_json(fc, out / "forecast_output.json")
    
    comp = gen_composition(rng)
    dump_json(comp, out / "composition.json")
    
    proj = gen_projects(rng, rprovs)
    dump_json(proj, out / "projects.json")
    
    projs = gen_projections(rng, proj, rprovs)
    dump_json(projs, out / "production_projections.json")
    
    ext = gen_external_forecasts(rng)
    dump_json(ext, out / "external_forecasts.json")
    
    vint = gen_forecast_vintages(rng)
    dump_json(vint, out / "forecast_vintages.json")
    
    base = gen_base_rates(rng)
    dump_json(base, out / "base_rates.json")
    
    ai = gen_ai_estimates(rng)
    dump_json(ai, out / "ai_estimates.json")
    
    cat = gen_dataset_catalog(rng)
    dump_json(cat, out / "dataset_catalog.json")

if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else "data/mock"
    main(out)
