def check_forecast(doc: dict) -> list[str]:
    errors = []
    
    horizon = doc.get("horizon", {})
    start_year = horizon.get("start_year")
    end_year = horizon.get("end_year")
    
    if start_year is not None and end_year is not None:
        if start_year > end_year:
            errors.append(f"Horizon start_year ({start_year}) > end_year ({end_year})")
            
    series_list = doc.get("series", [])
    seen_keys = set()
    
    for s_idx, series in enumerate(series_list):
        key = (
            series.get("indicator"),
            series.get("resource"),
            series.get("geo"),
            series.get("scenario"),
            series.get("ai_overlay")
        )
        if key in seen_keys:
            errors.append(f"Duplicate series key found: {key}")
        seen_keys.add(key)
        
        points = series.get("points", [])
        prev_year = None
        for p_idx, point in enumerate(points):
            y = point.get("year")
            if y is not None:
                if start_year is not None and end_year is not None:
                    if not (start_year <= y <= end_year):
                        errors.append(f"Year {y} is outside horizon [{start_year}, {end_year}]")
                if prev_year is not None:
                    if y <= prev_year:
                        errors.append(f"Years are not strictly increasing: {prev_year} then {y}")
                prev_year = y
                
            p10 = point.get("p10")
            p50 = point.get("p50")
            p90 = point.get("p90")
            
            if p10 is not None and p50 is not None:
                if p10 > p50:
                    errors.append(f"p10 <= p50 is violated: p10={p10}, p50={p50} at year {y}")
            if p50 is not None and p90 is not None:
                if p50 > p90:
                    errors.append(f"p50 <= p90 is violated: p50={p50}, p90={p90} at year {y}")
                    
    return errors
