def check_composition(records):
    errors = []
    # category unique per (kind, year)
    categories_seen = {}
    
    # at least 2 distinct group values per (kind, year)
    groups_by_kind_year = {}
    
    for r in records:
        kind_year = (r.get("kind"), r.get("year"))
        cat = r.get("category")
        
        if kind_year not in categories_seen:
            categories_seen[kind_year] = set()
        if cat in categories_seen[kind_year]:
            errors.append(f"Duplicate category '{cat}' for kind '{kind_year[0]}' in year {kind_year[1]}")
        categories_seen[kind_year].add(cat)
        
        if kind_year not in groups_by_kind_year:
            groups_by_kind_year[kind_year] = set()
        groups_by_kind_year[kind_year].add(r.get("group"))
        
    for kind_year, groups in groups_by_kind_year.items():
        if len(groups) < 2:
            errors.append(f"Only {len(groups)} group(s) found for kind '{kind_year[0]}' in year {kind_year[1]}. At least 2 are required.")
            
    return errors

def check_projects(records):
    errors = []
    ids_seen = set()
    for r in records:
        pid = r.get("id")
        if pid in ids_seen:
            errors.append(f"Duplicate project id '{pid}'")
        ids_seen.add(pid)
    return errors

def check_projections(projections, projects):
    errors = []
    seen = set()
    project_map = {p["id"]: p for p in projects}

    for p in projections:
        # Duplicate key (entity_type, project_id, geo, resource, metric, year, scenario, source)
        key = (
            p.get("entity_type"), p.get("project_id"), p.get("geo"), p.get("resource"),
            p.get("metric"), p.get("year"), p.get("scenario"), p.get("source")
        )
        if key in seen:
            errors.append(f"Duplicate key: {key}")
        seen.add(key)

        # value ranges
        v, v_low, v_high = p.get("value"), p.get("value_low"), p.get("value_high")
        if v_low is not None and v_high is not None:
            if v_low > v_high:
                errors.append(f"value_low > value_high in {key}")
            if v is not None and not (v_low <= v <= v_high):
                errors.append(f"value {v} lies outside [value_low, value_high] in {key}")

        # project checks
        if p.get("entity_type") == "project":
            pid = p.get("project_id")
            if pid not in project_map:
                errors.append(f"unknown project_id {pid} in {key}")
            else:
                proj = project_map[pid]
                if p.get("geo") != proj.get("geo") or p.get("resource") != proj.get("resource"):
                    errors.append(f"geo or resource mismatch for project {pid} in {key}")

                if p.get("metric") == "production_expected" and proj.get("start_year") is not None and p.get("year") < proj.get("start_year"):
                        errors.append(f"production_expected year {p.get('year')} precedes project start_year {proj.get('start_year')} in {key}")

    return errors

def _common_checks(records, file_name):
    errors = []
    ids_seen = set()
    for i, r in enumerate(records):
        if "id" in r:
            rid = r.get("id")
            if rid in ids_seen:
                errors.append(f"Duplicate id '{rid}' in {file_name}")
            ids_seen.add(rid)
            
        snippet = r.get("snippet")
        if snippet and len(snippet.split()) > 25:
            errors.append(f"snippet longer than 25 words in {file_name} for record {r.get('id', i)}")
            
        v = r.get("value")
        v_low = r.get("value_low")
        v_high = r.get("value_high")
        if v_low is not None and v_high is not None:
            if v_low > v_high:
                errors.append(f"value_low > value_high in {file_name} for record {r.get('id', i)}")
            if v is not None and not (v_low <= v <= v_high):
                errors.append(f"value {v} lies outside [{v_low}, {v_high}] in {file_name} for record {r.get('id', i)}")
    return errors

def check_external_forecasts(records):
    errors = _common_checks(records, "external_forecasts.json")
    seen = set()
    for r in records:
        key = (
            r.get("forecaster"), r.get("vintage"), r.get("indicator"),
            r.get("geo"), r.get("year"), r.get("scenario_by_source"),
            r.get("variant"), r.get("source_id")
        )
        if key in seen:
            errors.append(f"Duplicate key {key} in external_forecasts.json")
        seen.add(key)
    return errors

def check_forecast_vintages(records):
    errors = _common_checks(records, "forecast_vintages.json")
    for r in records:
        vd = r.get("vintage_date")
        if vd:
            v_year = int(vd.split("-")[0])
            ty = r.get("target_year")
            hy = r.get("horizon_years")
            if ty is not None and hy is not None:
                if ty < v_year:
                    errors.append(f"target_year {ty} is before vintage year {v_year} in forecast_vintages.json")
                elif hy != ty - v_year:
                    errors.append(f"horizon_years {hy} mismatch: {ty} - {v_year} != {hy} in forecast_vintages.json")
    return errors

def check_base_rates(records):
    return _common_checks(records, "base_rates.json")

def check_ai_estimates(records):
    errors = _common_checks(records, "ai_estimates.json")
    for r in records:
        hs = r.get("horizon_start_year")
        he = r.get("horizon_end_year")
        if hs is not None and he is not None:
            if he < hs:
                errors.append(f"horizon_end_year < horizon_start_year in ai_estimates.json")
                
            derived = r.get("derived_annualized_pp")
            derivation = r.get("derivation")
            if (derived is None) != (derivation is None):
                errors.append(f"derived_annualized_pp and derivation must be both null or both non-null in ai_estimates.json")
                
            metric = r.get("outcome_metric")
            if derived is not None:
                if not (metric and metric.endswith("_cumulative")):
                    errors.append(f"derived_annualized_pp only allowed for _cumulative metric in ai_estimates.json")
                
                v = r.get("value")
                if v is not None:
                    n = he - hs
                    if n == 0:
                        errors.append(f"n == 0 (horizon_end_year == horizon_start_year) in ai_estimates.json for {r.get('id')}")
                    else:
                        expected = ((1 + v/100) ** (1/n) - 1) * 100
                        if abs(derived - expected) > 0.01:
                            errors.append(f"wrong exact compounding for {r.get('id')}: expected {expected}, got {derived} in ai_estimates.json")
            
        rt = r.get("record_type")
        metric = r.get("outcome_metric")
        if rt == "adoption" and metric != "adoption_rate_pct":
            errors.append(f"record_type adoption requires adoption_rate_pct in ai_estimates.json")
        if rt == "exposure" and metric not in ["employment_exposed_pct", "employment_displaced_pct"]:
            errors.append(f"record_type exposure requires employment_exposed_pct or employment_displaced_pct in ai_estimates.json")
        if rt in ["projection", "observed"] and metric == "adoption_rate_pct":
            errors.append(f"record_type {rt} must not use adoption_rate_pct in ai_estimates.json")
    return errors

def check_dataset_catalog(records):
    errors = _common_checks(records, "dataset_catalog.json")
    seen = set()
    for r in records:
        key = (r.get("dataset_name"), r.get("version"))
        if key in seen:
            errors.append(f"Duplicate dataset key {key} in dataset_catalog.json")
        seen.add(key)
        
        acc = r.get("access")
        rec = r.get("recommended_use")
        note = r.get("note")
        if acc == "not_opened" and rec is not None and not note:
            errors.append(f"access not_opened with recommended_use requires note in dataset_catalog.json for {key}")
    return errors
