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

if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else "data/mock"
    main(out)
