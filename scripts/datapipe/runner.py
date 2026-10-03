import json
import os
import sys
import tempfile
from pathlib import Path

from jsonschema import Draft202012Validator, FormatChecker

from .adapters import REGISTRY
from .manifest import ManifestError, verify_manifest
from .provenance import _hash_file, update_provenance

def run_dataset(dataset_id: str, raw_root: Path, out_root: Path, schemas_root: Path, registry=None) -> tuple[int, str]:
    if registry is None:
        registry = REGISTRY
        
    if dataset_id not in registry:
        return 2, f"Unknown dataset {dataset_id}"
        
    adapter = registry[dataset_id]
    dataset_dir = raw_root / dataset_id
    
    # 1. Verify manifest
    try:
        verify_manifest(dataset_id, dataset_dir)
    except ManifestError as e:
        return 1, str(e)
        
    # Load manifest data
    manifest_path = dataset_dir / "MANIFEST.json"
    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest_data = json.load(f)
        
    files = {}
    for entry in manifest_data.get("files", []):
        fpath = entry["path"]
        is_private = entry.get("private", False)
        if is_private:
            real_path = dataset_dir.parent / "_private" / dataset_id / fpath
        else:
            real_path = dataset_dir / fpath
        files[fpath] = real_path
        
    # 2. Call build
    try:
        outputs = adapter.build(files, manifest_data)
    except (ValueError, KeyError, TypeError, OSError, RuntimeError) as e:
        return 1, f"ERROR {dataset_id} build failed: {e!s}"
        
    expected_keys = set(adapter.OUTPUTS.keys())
    actual_keys = set(outputs.keys())
    if expected_keys != actual_keys:
        return 1, f"ERROR {dataset_id} build returned keys {actual_keys} but expected {expected_keys}"
        
    # 3. Validate
    # Mock source error if any
    for fname, records in outputs.items():
        for i, rec in enumerate(records):
            if rec.get("source") == "MOCK":
                return 1, f"ERROR {dataset_id} {fname} record {i} has source == MOCK"
                
        schema_file = adapter.OUTPUTS[fname]
        schema_path = schemas_root / schema_file
        if schema_path.exists():
            try:
                with open(schema_path, "r", encoding="utf-8") as f:
                    schema = json.load(f)
                validator = Draft202012Validator(schema, format_checker=FormatChecker())
                errors = list(validator.iter_errors(records))
                if errors:
                    return 1, f"ERROR {dataset_id} {fname} failed schema validation: {errors[0].message}"
            except (ValueError, OSError, RuntimeError) as e:
                return 1, f"ERROR {dataset_id} {fname} schema read failed: {e!s}"
                
        # Existing consistency checks
        try:
            # We import them lazily so tests that don't need them don't break
            sys.path.insert(0, str(Path(__file__).parent.parent.parent / "scripts"))
            from dataset_checks import (
                check_composition,
                check_projections,
                check_projects,
            )
            from forecast_checks import check_forecast
            sys.path.pop(0)
            
            if fname == "composition.json":
                errs = check_composition(records)
                if errs: return 1, f"ERROR {dataset_id} {fname} consistency: {errs[0]}"
            elif fname == "projects.json":
                errs = check_projects(records)
                if errs: return 1, f"ERROR {dataset_id} {fname} consistency: {errs[0]}"
            elif fname == "production_projections.json":
                # need projects.json, this is complex for generic runner, but dataset_checks handles it
                # For runner, we just do best effort if projects exist in out_root
                projects_path = out_root / "projects.json"
                if projects_path.exists():
                    with open(projects_path) as pf:
                        pr = json.load(pf)
                    errs = check_projections(records, pr)
                    if errs: return 1, f"ERROR {dataset_id} {fname} consistency: {errs[0]}"
            elif fname == "forecast_output.json":
                errs = check_forecast(records)
                if errs: return 1, f"ERROR {dataset_id} {fname} consistency: {errs[0]}"
        except ImportError:
            pass

    # 4. Write output
    for fname, records in outputs.items():
        # sorting logic: by sort key or full json string
        # since adapters don't declare sort key in protocol explicitly, we sort by json string
        try:
            records.sort(key=lambda r: json.dumps(r, sort_keys=True))
        except TypeError:
            pass # if not dicts
            
        out_path = out_root / fname
        fd, tmp_path = tempfile.mkstemp(dir=out_root, prefix=f"{fname}.")
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(records, f, indent=2, ensure_ascii=False)
            f.write("\n")
            
        os.replace(tmp_path, out_path)
        
    # 5. Update provenance
    update_provenance(dataset_id, adapter.__name__, files, out_root, list(outputs.keys()))
    
    return 0, "OK"

def check_dataset(dataset_id: str, raw_root: Path, out_root: Path, schemas_root: Path, registry=None) -> tuple[int, str]:
    if registry is None:
        registry = REGISTRY
        
    dataset_dir = raw_root / dataset_id
    manifest_path = dataset_dir / "MANIFEST.json"
    
    if not manifest_path.exists():
        return 1, f"ERROR {dataset_id} MANIFEST.json missing"
        
    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest_data = json.load(f)
        
    has_private = any(entry.get("private", False) for entry in manifest_data.get("files", []))
    
    prov_path = out_root / "_provenance.json"
    if not prov_path.exists():
        return 1, f"ERROR {dataset_id} _provenance.json missing"
    with open(prov_path, "r", encoding="utf-8") as f:
        prov = json.load(f)
        
    if has_private:
        # verify output hash only
        for fname, info in prov.get("outputs", {}).items():
            if info.get("dataset_id") == dataset_id:
                out_path = out_root / fname
                if not out_path.exists():
                    return 1, f"ERROR {dataset_id} {fname} missing"
                if _hash_file(out_path) != info["sha256"]:
                    return 1, f"ERROR {dataset_id} {fname} sha256 mismatch"
        return 0, f"SKIP {dataset_id} private inputs, verified output hash only"

    # Re-run in memory and compare bytes
    # Wait, we need files map, let's build it
    files = {}
    for entry in manifest_data.get("files", []):
        fpath = entry["path"]
        files[fpath] = dataset_dir / fpath
        if not files[fpath].exists():
            return 1, f"ERROR {dataset_id} {fpath} file missing"
        
        # also check if the hash matches the provenance or the manifest
        # in check mode, we just re-run so the adapter gets the files
        
    try:
        verify_manifest(dataset_id, dataset_dir)
    except ManifestError as e:
        return 1, str(e)
        
    adapter = registry[dataset_id]
    outputs = adapter.build(files, manifest_data)
    
    for fname, records in outputs.items():
        try:
            records.sort(key=lambda r: json.dumps(r, sort_keys=True))
        except TypeError:
            pass
        # serialize
        # dump to string
        expected = json.dumps(records, indent=2, ensure_ascii=False) + "\n"
        out_path = out_root / fname
        if not out_path.exists():
            return 1, f"ERROR {dataset_id} {fname} missing"
        actual = out_path.read_text(encoding="utf-8")
        if actual != expected:
            return 1, f"ERROR {dataset_id} {fname} content difference"
            
    # Also verify provenance matches
    for fname in outputs:
        info = prov.get("outputs", {}).get(fname)
        if not info:
            return 1, f"ERROR {dataset_id} {fname} not in _provenance.json"
        
        # check inputs
        for inp in info.get("inputs", []):
            if _hash_file(dataset_dir / inp["path"]) != inp["sha256"]:
                return 1, f"ERROR {dataset_id} input {inp['path']} sha256 mismatch in provenance"
                
    return 0, "OK"
