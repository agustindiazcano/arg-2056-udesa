import json
from pathlib import Path
import pytest
import sys

sys.path.insert(0, str(Path(__file__).parent.parent.parent))
from scripts.datapipe.runner import run_dataset, check_dataset

def fake_build(files, manifest):
    return {
        "output1.json": [{"id": 1, "source": "A", "retrieved_at": "2024"}],
        "output2.json": [{"id": 2, "source": "B", "retrieved_at": "2024"}]
    }

class FakeAdapter:
    DATASET_ID = "test_ds"
    OUTPUTS = {
        "output1.json": "output1.schema.json",
        "output2.json": "output2.schema.json"
    }
    build = staticmethod(fake_build)

def test_runner_success(tmp_path):
    raw_root = tmp_path / "raw"
    out_root = tmp_path / "processed"
    schemas_root = tmp_path / "schemas"
    raw_root.mkdir()
    out_root.mkdir()
    schemas_root.mkdir()

    ds_dir = raw_root / "test_ds"
    ds_dir.mkdir()
    
    # Mock schemas
    schema_content = {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "type": "array",
        "items": {"type": "object", "properties": {"id": {"type": "integer"}, "source": {"type": "string"}, "retrieved_at": {"type": "string"}}}
    }
    (schemas_root / "output1.schema.json").write_text(json.dumps(schema_content))
    (schemas_root / "output2.schema.json").write_text(json.dumps(schema_content))

    # Mock manifest
    (ds_dir / "file.csv").write_text("dummy")
    import hashlib
    h = hashlib.sha256(b"dummy").hexdigest()
    manifest = {
        "dataset_id": "test_ds",
        "files": [{"path": "file.csv", "sha256": h, "source": "A", "source_url": None, "retrieved_at": "2024", "redistributable": True}]
    }
    (ds_dir / "MANIFEST.json").write_text(json.dumps(manifest))

    # Run
    code, msg = run_dataset("test_ds", raw_root, out_root, schemas_root, registry={"test_ds": FakeAdapter})
    assert code == 0
    
    assert (out_root / "output1.json").exists()
    assert (out_root / "output2.json").exists()
    
    # Provenance updated
    prov_path = out_root / "_provenance.json"
    assert prov_path.exists()
    prov = json.loads(prov_path.read_text())
    assert "output1.json" in prov["outputs"]

    # Run again, identical bytes
    out1_bytes = (out_root / "output1.json").read_bytes()
    run_dataset("test_ds", raw_root, out_root, schemas_root, registry={"test_ds": FakeAdapter})
    assert (out_root / "output1.json").read_bytes() == out1_bytes

def test_runner_extra_missing_keys(tmp_path):
    class BadAdapter(FakeAdapter):
        @staticmethod
        def build(f, m):
            return {"output1.json": []} # Missing output2
    
    raw_root = tmp_path / "raw"
    out_root = tmp_path / "processed"
    schemas_root = tmp_path / "schemas"
    raw_root.mkdir(); out_root.mkdir(); schemas_root.mkdir()
    
    ds_dir = raw_root / "test_ds"
    ds_dir.mkdir()
    (ds_dir / "MANIFEST.json").write_text(json.dumps({"dataset_id": "test_ds", "files": []}))
    
    code, msg = run_dataset("test_ds", raw_root, out_root, schemas_root, registry={"test_ds": BadAdapter})
    assert code == 1
    assert "expected" in msg.lower()

def test_runner_mock_source_fails(tmp_path):
    class MockAdapter(FakeAdapter):
        @staticmethod
        def build(f, m):
            return {
                "output1.json": [{"id": 1, "source": "MOCK", "retrieved_at": "2024"}],
                "output2.json": []
            }
    
    raw_root = tmp_path / "raw"
    out_root = tmp_path / "processed"
    schemas_root = tmp_path / "schemas"
    raw_root.mkdir(); out_root.mkdir(); schemas_root.mkdir()
    ds_dir = raw_root / "test_ds"
    ds_dir.mkdir()
    (ds_dir / "MANIFEST.json").write_text(json.dumps({"dataset_id": "test_ds", "files": []}))
    (schemas_root / "output1.schema.json").write_text("{}")
    (schemas_root / "output2.schema.json").write_text("{}")
    
    code, msg = run_dataset("test_ds", raw_root, out_root, schemas_root, registry={"test_ds": MockAdapter})
    assert code == 1
    assert "MOCK" in msg
    assert not (out_root / "output1.json").exists()

def test_runner_atomic_write(tmp_path, monkeypatch):
    class FailWriteAdapter(FakeAdapter):
        pass # write output1 but fail on output2
    
    # Not testing atomic deep OS level, just that if output2 fails schema, output1 is not written
    class BadSchemaAdapter(FakeAdapter):
        @staticmethod
        def build(f, m):
            return {
                "output1.json": [{"id": 1, "source": "A", "retrieved_at": "2024"}],
                "output2.json": [{"id": "bad", "source": "A", "retrieved_at": "2024"}] # id should be int
            }
            
    raw_root = tmp_path / "raw"; out_root = tmp_path / "processed"; schemas_root = tmp_path / "schemas"
    raw_root.mkdir(); out_root.mkdir(); schemas_root.mkdir()
    ds_dir = raw_root / "test_ds"; ds_dir.mkdir()
    (ds_dir / "MANIFEST.json").write_text(json.dumps({"dataset_id": "test_ds", "files": []}))
    
    schema_content = {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "type": "array",
        "items": {"type": "object", "properties": {"id": {"type": "integer"}}}
    }
    (schemas_root / "output1.schema.json").write_text(json.dumps(schema_content))
    (schemas_root / "output2.schema.json").write_text(json.dumps(schema_content))

    code, msg = run_dataset("test_ds", raw_root, out_root, schemas_root, registry={"test_ds": BadSchemaAdapter})
    assert code == 1
    assert not (out_root / "output1.json").exists()
    assert not (out_root / "output2.json").exists()
