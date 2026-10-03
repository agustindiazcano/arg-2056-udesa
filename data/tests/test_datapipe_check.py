import json
import sys
from pathlib import Path
from typing import ClassVar

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent.parent))
from scripts.datapipe.runner import check_dataset, run_dataset


def fake_build(files, manifest):
    return {
        "output1.json": [{"id": 1}]
    }

class FakeAdapter:
    DATASET_ID = "test_ds"
    OUTPUTS: ClassVar[dict] = {"output1.json": "output1.schema.json"}
    build = staticmethod(fake_build)

def test_check_clean(tmp_path):
    raw_root = tmp_path / "raw"; out_root = tmp_path / "processed"; schemas_root = tmp_path / "schemas"
    raw_root.mkdir(); out_root.mkdir(); schemas_root.mkdir()
    ds_dir = raw_root / "test_ds"; ds_dir.mkdir()
    
    (ds_dir / "MANIFEST.json").write_text(json.dumps({"dataset_id": "test_ds", "files": []}))
    
    # run first
    code, _msg = run_dataset("test_ds", raw_root, out_root, schemas_root, registry={"test_ds": FakeAdapter})
    assert code == 0
    
    # check
    code, _msg = check_dataset("test_ds", raw_root, out_root, schemas_root, registry={"test_ds": FakeAdapter})
    assert code == 0

def test_check_modified_processed(tmp_path):
    raw_root = tmp_path / "raw"; out_root = tmp_path / "processed"; schemas_root = tmp_path / "schemas"
    raw_root.mkdir(); out_root.mkdir(); schemas_root.mkdir()
    ds_dir = raw_root / "test_ds"; ds_dir.mkdir()
    (ds_dir / "MANIFEST.json").write_text(json.dumps({"dataset_id": "test_ds", "files": []}))
    run_dataset("test_ds", raw_root, out_root, schemas_root, registry={"test_ds": FakeAdapter})
    
    # modify output
    (out_root / "output1.json").write_text("[{\"id\": 2}]")
    
    code, msg = check_dataset("test_ds", raw_root, out_root, schemas_root, registry={"test_ds": FakeAdapter})
    assert code == 1
    assert "output1.json" in msg

def test_check_modified_raw(tmp_path):
    raw_root = tmp_path / "raw"; out_root = tmp_path / "processed"; schemas_root = tmp_path / "schemas"
    raw_root.mkdir(); out_root.mkdir(); schemas_root.mkdir()
    ds_dir = raw_root / "test_ds"; ds_dir.mkdir()
    import hashlib
    (ds_dir / "file.csv").write_text("a")
    h = hashlib.sha256(b"a").hexdigest()
    (ds_dir / "MANIFEST.json").write_text(json.dumps({
        "dataset_id": "test_ds",
        "files": [{"path": "file.csv", "sha256": h, "source": "A", "redistributable": True}]
    }))
    
    run_dataset("test_ds", raw_root, out_root, schemas_root, registry={"test_ds": FakeAdapter})
    
    # modify raw file -> manifest sha will mismatch if we run verify_manifest, but maybe we just modify the manifest hash?
    (ds_dir / "file.csv").write_text("b")
    h2 = hashlib.sha256(b"b").hexdigest()
    (ds_dir / "MANIFEST.json").write_text(json.dumps({
        "dataset_id": "test_ds",
        "files": [{"path": "file.csv", "sha256": h2, "source": "A", "redistributable": True}]
    }))
    
    code, msg = check_dataset("test_ds", raw_root, out_root, schemas_root, registry={"test_ds": FakeAdapter})
    assert code == 1
    assert "file.csv" in msg or "inputs" in msg or "sha256 mismatch" in msg

def test_check_private(tmp_path):
    raw_root = tmp_path / "raw"; out_root = tmp_path / "processed"; schemas_root = tmp_path / "schemas"
    raw_root.mkdir(); out_root.mkdir(); schemas_root.mkdir()
    ds_dir = raw_root / "test_ds"; ds_dir.mkdir()
    
    priv_dir = tmp_path / "raw" / "_private" / "test_ds"
    priv_dir.mkdir(parents=True)
    (priv_dir / "priv.csv").write_text("priv")
    import hashlib
    h = hashlib.sha256(b"priv").hexdigest()
    
    (ds_dir / "MANIFEST.json").write_text(json.dumps({
        "dataset_id": "test_ds",
        "files": [{"path": "priv.csv", "sha256": h, "source": "A", "redistributable": False, "private": True, "note": "x"}]
    }))
    
    run_dataset("test_ds", raw_root, out_root, schemas_root, registry={"test_ds": FakeAdapter})
    
    # Now simulate a CI environment where the private file doesn't exist
    import shutil
    shutil.rmtree(tmp_path / "raw" / "_private")
    
    code, msg = check_dataset("test_ds", raw_root, out_root, schemas_root, registry={"test_ds": FakeAdapter})
    assert code == 0
    assert msg == "SKIP test_ds private inputs, verified output hash only"
    
    # Modifying the output file should fail the verified output hash
    (out_root / "output1.json").write_text("[]")
    code, msg = check_dataset("test_ds", raw_root, out_root, schemas_root, registry={"test_ds": FakeAdapter})
    assert code == 1
    assert "output1.json" in msg

def test_verify_provenance_cmd(tmp_path):
    from scripts.datapipe.provenance import verify_provenance
    raw_root = tmp_path / "raw"; out_root = tmp_path / "processed"
    raw_root.mkdir(); out_root.mkdir()
    ds_dir = raw_root / "test_ds"; ds_dir.mkdir()
    (ds_dir / "MANIFEST.json").write_text(json.dumps({"dataset_id": "test_ds", "files": []}))
    
    run_dataset("test_ds", raw_root, out_root, tmp_path / "schemas", registry={"test_ds": FakeAdapter})
    
    assert verify_provenance(out_root) == True
    
    (out_root / "output1.json").write_text("mod")
    with pytest.raises(Exception, match="sha256 mismatch"):
        verify_provenance(out_root)