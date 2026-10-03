import hashlib
import json
from pathlib import Path

def _hash_file(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        while chunk := f.read(8192):
            h.update(chunk)
    return h.hexdigest()

def update_provenance(dataset_id: str, adapter_name: str, files: dict[str, Path], out_root: Path, outputs: list[str]):
    prov_path = out_root / "_provenance.json"
    
    if prov_path.exists():
        with open(prov_path, "r", encoding="utf-8") as f:
            prov = json.load(f)
    else:
        prov = {"outputs": {}}
        
    # Build inputs
    inputs_list = []
    for fpath, real_path in sorted(files.items()):
        inputs_list.append({"path": fpath, "sha256": _hash_file(real_path)})
        
    for out_name in outputs:
        out_path = out_root / out_name
        prov["outputs"][out_name] = {
            "sha256": _hash_file(out_path),
            "dataset_id": dataset_id,
            "adapter": adapter_name,
            "inputs": inputs_list
        }
        
    # Remove entries for outputs that don't exist
    to_delete = []
    for k in prov["outputs"]:
        if not (out_root / k).exists():
            to_delete.append(k)
    for k in to_delete:
        del prov["outputs"][k]
        
    # Sort keys
    prov["outputs"] = dict(sorted(prov["outputs"].items()))
    
    with open(prov_path, "w", encoding="utf-8") as f:
        json.dump(prov, f, indent=2)
        f.write("\n")

def verify_provenance(out_root: Path) -> bool:
    prov_path = out_root / "_provenance.json"
    if not prov_path.exists():
        raise RuntimeError("missing _provenance.json")
    with open(prov_path, "r", encoding="utf-8") as f:
        prov = json.load(f)
        
    for fname, info in prov.get("outputs", {}).items():
        out_path = out_root / fname
        if not out_path.exists():
            raise RuntimeError(f"{fname} missing")
        if _hash_file(out_path) != info["sha256"]:
            raise RuntimeError(f"{fname} sha256 mismatch")
            
    # Also check if all files in out_root are in provenance (except _provenance.json and sources.json)
    for out_path in out_root.glob("*.json"):
        if out_path.name in ("_provenance.json", "sources.json"):
            continue
        if out_path.name not in prov.get("outputs", {}):
            raise RuntimeError(f"{out_path.name} not in provenance")
            
    return True
