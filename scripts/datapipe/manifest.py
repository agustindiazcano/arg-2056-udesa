import hashlib
import json
import os
from pathlib import Path


class ManifestError(Exception):
    pass

def _hash_file(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        while chunk := f.read(8192):
            h.update(chunk)
    return h.hexdigest()

def verify_manifest(dataset_id: str, dataset_dir: Path) -> bool:
    manifest_path = dataset_dir / "MANIFEST.json"
    if not manifest_path.exists():
        raise ManifestError(f"ERROR {dataset_id} MANIFEST.json missing")
        
    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest = json.load(f)
        
    registered_files = set()
    for entry in manifest.get("files", []):
        fpath = entry["path"]
        if ".." in fpath or fpath.startswith(("/", "\\")):
            raise ManifestError(f"ERROR {dataset_id} {fpath} invalid path")
            
        is_private = entry.get("private", False)
        
        if is_private:
            real_path = dataset_dir.parent / "_private" / dataset_id / fpath
        else:
            real_path = dataset_dir / fpath
            
        if not real_path.exists():
            raise ManifestError(f"ERROR {dataset_id} {fpath} file missing")
            
        actual_hash = _hash_file(real_path)
        if actual_hash != entry["sha256"]:
            raise ManifestError(f"ERROR {dataset_id} {fpath} sha256 mismatch")
            
        registered_files.add(fpath)
        
    # Check for unregistered files
    for root, _, files in os.walk(dataset_dir):
        for file in files:
            if file == "MANIFEST.json":
                continue
            rel_path = Path(root, file).relative_to(dataset_dir).as_posix()
            if rel_path not in registered_files:
                raise ManifestError(f"ERROR {dataset_id} {rel_path} unregistered file present")
                
    return True

def register_file(
    dataset_dir: Path,
    file_path_str: str,
    source: str,
    source_url: str | None,
    retrieved_at: str,
    license_or_terms: str | None,
    redistributable: bool,
    private: bool,
    note: str | None,
    replace: bool = False
):
    dataset_id = dataset_dir.name
    
    if private:
        real_path = dataset_dir.parent / "_private" / dataset_id / file_path_str
    else:
        real_path = dataset_dir / file_path_str
        
    actual_hash = _hash_file(real_path)
    
    manifest_path = dataset_dir / "MANIFEST.json"
    if manifest_path.exists():
        with open(manifest_path, "r", encoding="utf-8") as f:
            manifest = json.load(f)
    else:
        manifest = {"dataset_id": dataset_id, "files": []}
        
    # Check if exists
    existing = None
    for entry in manifest["files"]:
        if entry["path"] == file_path_str:
            existing = entry
            break
            
    if existing:
        if existing["sha256"] != actual_hash and not replace:
            raise ManifestError("sha256 mismatch with existing entry. use --replace")
        manifest["files"].remove(existing)
        
    new_entry = {
        "path": file_path_str,
        "sha256": actual_hash,
        "source": source,
        "source_url": source_url,
        "retrieved_at": retrieved_at,
        "license_or_terms": license_or_terms,
        "redistributable": redistributable
    }
    if private:
        new_entry["private"] = True
    if note:
        new_entry["note"] = note
        
    manifest["files"].append(new_entry)
    manifest["files"].sort(key=lambda x: x["path"])
    
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)
        f.write("\n")