import argparse
import json
import sys
from pathlib import Path

from jsonschema import Draft202012Validator, FormatChecker

# Imports at module top only
from forecast_checks import check_forecast

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--processed", default="data/processed")
    parser.add_argument("--schemas", default="data/schemas")
    args = parser.parse_args()

    processed_dir = Path(args.processed)
    schemas_dir = Path(args.schemas)
    
    if not processed_dir.exists():
        sys.exit(0)
        
    has_errors = False
    
    for data_file in processed_dir.glob("*.json"):
        name = data_file.stem
        schema_path = schemas_dir / f"{name}.schema.json"
        
        if not schema_path.exists():
            print(f"ERROR: No matching schema found for {data_file.name}", file=sys.stderr)
            has_errors = True
            continue
            
        with open(schema_path) as f:
            schema = json.load(f)
            
        with open(data_file) as f:
            data = json.load(f)
            
        validator = Draft202012Validator(schema, format_checker=FormatChecker())
        
        errors = list(validator.iter_errors(data))
        if errors:
            for error in errors:
                print(f"ERROR: {data_file.name} failed schema validation: {error.json_path} - {error.message}", file=sys.stderr)
            has_errors = True
        else:
            if data_file.name == "forecast_output.json":
                extra_errors = check_forecast(data)
                if extra_errors:
                    for e in extra_errors:
                        print(f"ERROR: {data_file.name} failed forecast checks: {e}", file=sys.stderr)
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
