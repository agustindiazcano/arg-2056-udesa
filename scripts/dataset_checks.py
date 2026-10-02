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
