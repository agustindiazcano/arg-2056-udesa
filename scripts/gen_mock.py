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

if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else "data/mock"
    main(out)
