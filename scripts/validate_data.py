import json
import sys
from pathlib import Path

from jsonschema import Draft202012Validator, FormatChecker


def main():
    processed_dir = Path("data/processed")
    schemas_dir = Path("data/schemas")
    
    if not processed_dir.exists():
        return 0
        
    has_errors = False
    
    for data_file in processed_dir.glob("*.json"):
        name = data_file.stem  # e.g. "economy_series" from "economy_series.json"
        schema_path = schemas_dir / f"{name}.schema.json"
        
        if not schema_path.exists():
            print(f"ERROR: No matching schema found for {data_file.name} at {schema_path}")
            has_errors = True
            continue
            
        with open(schema_path) as f:
            schema = json.load(f)
            
        with open(data_file) as f:
            data = json.load(f)
            
        validator = Draft202012Validator(schema, format_checker=FormatChecker())
        
        errors = list(validator.iter_errors(data))
        if errors:
            print(f"ERROR: {data_file.name} failed validation:")
            for error in errors:
                print(f"  - {error.json_path}: {error.message}")
            has_errors = True
        else:
            # Check extra logic if it's the forecast_output
            if data_file.name == "forecast_output.json":
                # It's in the same directory as validate_data.py
                sys.path.append(str(Path(__file__).parent))
                from forecast_checks import check_forecast
                
                extra_errors = check_forecast(data)
                if extra_errors:
                    print(f"ERROR: {data_file.name} failed extra forecast checks:")
                    for e in extra_errors:
                        print(f"  - {e}")
                    has_errors = True
                else:
                    print(f"OK: {data_file.name}")
            else:
                print(f"OK: {data_file.name}")
            
    if has_errors:
        sys.exit(1)
        
    print("All processed data files are valid.")
    
if __name__ == "__main__":
    main()
