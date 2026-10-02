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
