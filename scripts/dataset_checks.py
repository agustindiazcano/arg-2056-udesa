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
                errors.append("horizon_end_year < horizon_start_year in ai_estimates.json")
                
            derived = r.get("derived_annualized_pp")
            derivation = r.get("derivation")
            if (derived is None) != (derivation is None):
                errors.append("derived_annualized_pp and derivation must be both null or both non-null in ai_estimates.json")
                
            metric = r.get("outcome_metric")
            if derived is not None:
                if not (metric and metric.endswith("_cumulative")):
                    errors.append("derived_annualized_pp only allowed for _cumulative metric in ai_estimates.json")
                
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
            errors.append("record_type adoption requires adoption_rate_pct in ai_estimates.json")
        if rt == "exposure" and metric not in ["employment_exposed_pct", "employment_displaced_pct"]:
            errors.append("record_type exposure requires employment_exposed_pct or employment_displaced_pct in ai_estimates.json")
        if rt in ["projection", "observed"] and metric == "adoption_rate_pct":
            errors.append("record_type {rt} must not use adoption_rate_pct in ai_estimates.json")
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


def _check_record_provenance_and_nulls(r, i, file_name, value_fields):
    errors = []
    if not r.get("source"):
        errors.append(f"missing source in {file_name} for record {i}")
    if not r.get("retrieved_at"):
        errors.append(f"missing retrieved_at in {file_name} for record {i}")
    note = r.get("note")
    for f in value_fields:
        if r.get(f) is None and not note:
            errors.append(f"null {f} without note in {file_name} for record {i}")
    return errors


def check_population_by_age(records, population_records=None):
    errors = []
    pop_map = {}
    if population_records:
        for p in population_records:
            k = (p.get("geo"), p.get("year"))
            val = p.get("value")
            if val is not None:
                pop_map[k] = val

    by_pair = {}
    for i, r in enumerate(records):
        errors.extend(_check_record_provenance_and_nulls(r, i, "population_by_age.json", ["persons"]))
        geo = r.get("geo")
        year = r.get("year")
        pair = (geo, year)
        by_pair.setdefault(pair, []).append((i, r))

        p = r.get("persons")
        if p is not None and p < 0:
            errors.append(f"negative persons {p} for age {r.get('age')} in ({geo}, {year}) in population_by_age.json")

    for pair, rows in by_pair.items():
        ages = [r.get("age") for _, r in rows]
        if sorted(ages) != list(range(101)):
            errors.append(f"ages 0 to 100 do not appear exactly once for {pair} in population_by_age.json")

        if pair in pop_map:
            pop_val = pop_map[pair]
            sum_persons = sum(r.get("persons") or 0.0 for _, r in rows)
            if pop_val > 0:
                rel_diff = abs(sum_persons - pop_val) / pop_val
                if rel_diff > 0.005:
                    errors.append(
                        f"population_by_age sum {sum_persons} differs from population {pop_val} by more than 0.5% for {pair} in population_by_age.json"
                    )

    return errors


def check_fertility_schedule(records):
    errors = []
    by_pair = {}
    for i, r in enumerate(records):
        errors.extend(
            _check_record_provenance_and_nulls(
                r, i, "fertility_schedule.json", ["shape_f", "female_share", "tfr"]
            )
        )
        geo = r.get("geo")
        year = r.get("year")
        pair = (geo, year)
        by_pair.setdefault(pair, []).append((i, r))

        fs = r.get("female_share")
        if fs is not None and not (0 <= fs <= 1):
            errors.append(
                f"female_share {fs} outside [0, 1] for ({geo}, {year}, age {r.get('age')}) in fertility_schedule.json"
            )

    for pair, rows in by_pair.items():
        shapes = [r.get("shape_f") for _, r in rows if r.get("shape_f") is not None]
        sum_shape = sum(shapes)
        if abs(sum_shape - 1.0) > 1e-9:
            errors.append(f"shape_f sum {sum_shape} != 1.0 within 1e-9 for {pair} in fertility_schedule.json")

        first_tfr = rows[0][1].get("tfr")
        for _, r in rows[1:]:
            tfr = r.get("tfr")
            if tfr != first_tfr:
                errors.append(f"tfr mismatch ({tfr} != {first_tfr}) for {pair} in fertility_schedule.json")
                break

    return errors


def check_life_table(records):
    errors = []
    by_pair = {}
    for i, r in enumerate(records):
        errors.extend(_check_record_provenance_and_nulls(r, i, "life_table.json", ["survival", "e0"]))
        geo = r.get("geo")
        year = r.get("year")
        pair = (geo, year)
        by_pair.setdefault(pair, []).append((i, r))

        s = r.get("survival")
        if s is not None and not (0 <= s <= 1):
            errors.append(f"survival {s} outside [0, 1] for age {r.get('age')} in {pair} in life_table.json")

    for pair, rows in by_pair.items():
        ages = [r.get("age") for _, r in rows]
        if sorted(ages) != list(range(101)):
            errors.append(f"ages 0 to 100 do not appear exactly once for {pair} in life_table.json")
            continue

        first_e0 = rows[0][1].get("e0")
        for _, r in rows[1:]:
            e0 = r.get("e0")
            if e0 != first_e0:
                errors.append(f"e0 mismatch ({e0} != {first_e0}) for {pair} in life_table.json")
                break

        rows_by_age = sorted(rows, key=lambda x: x[1].get("age"))
        survivals = [r.get("survival") for _, r in rows_by_age]
        if all(s is not None and 0 <= s <= 1 for s in survivals):
            s100 = survivals[100]
            if s100 >= 1.0:
                errors.append(
                    f"survival at age 100 must be < 1.0 to compute open interval for {pair} in life_table.json"
                )
            else:
                l_surv = [1.0]
                for a in range(100):
                    l_surv.append(l_surv[-1] * survivals[a])
                sum_l_mid = sum(0.5 * (l_surv[a] + l_surv[a + 1]) for a in range(100))
                l_open = l_surv[100] / (1.0 - s100)
                implied_e0 = sum_l_mid + l_open
                if first_e0 is not None and abs(first_e0 - implied_e0) > 0.1:
                    errors.append(
                        f"e0 {first_e0} differs from implied life expectancy {implied_e0:.3f} by more than 0.1 years for {pair} in life_table.json"
                    )

    return errors


def check_migration_schedule(records):
    errors = []
    by_pair = {}
    for i, r in enumerate(records):
        errors.extend(
            _check_record_provenance_and_nulls(
                r, i, "migration_schedule.json", ["shape_m", "net_migrants"]
            )
        )
        geo = r.get("geo")
        year = r.get("year")
        pair = (geo, year)
        by_pair.setdefault(pair, []).append((i, r))

    for pair, rows in by_pair.items():
        shapes = [r.get("shape_m") for _, r in rows if r.get("shape_m") is not None]
        sum_shape = sum(shapes)
        if abs(sum_shape - 1.0) > 1e-9:
            errors.append(f"shape_m sum {sum_shape} != 1.0 within 1e-9 for {pair} in migration_schedule.json")

        first_net = rows[0][1].get("net_migrants")
        for _, r in rows[1:]:
            net = r.get("net_migrants")
            if net != first_net:
                errors.append(f"net_migrants mismatch ({net} != {first_net}) for {pair} in migration_schedule.json")
                break

    return errors
