import json
from pathlib import Path

import pytest
from jsonschema import Draft202012Validator, FormatChecker


def test_manifest_schema():
    schema_path = Path("data/schemas/raw_manifest.schema.json")
    with open(schema_path) as f:
        schema = json.load(f)
    validator = Draft202012Validator(schema, format_checker=FormatChecker())

    # Valid
    valid_data = {
        "dataset_id": "my_dataset",
        "files": [
            {
                "path": "file1.csv",
                "sha256": "a" * 64,
                "source": "Source 1",
                "source_url": "https://example.com",
                "retrieved_at": "2024-01-01",
                "license_or_terms": "CC-BY",
                "redistributable": True
            }
        ]
    }
    assert list(validator.iter_errors(valid_data)) == []

    # Valid private
    valid_private = {
        "dataset_id": "my_dataset",
        "files": [
            {
                "path": "file2.csv",
                "sha256": "b" * 64,
                "source": "Source 2",
                "source_url": None,
                "retrieved_at": "2024-01-01",
                "license_or_terms": None,
                "redistributable": False,
                "private": True,
                "note": "Private file on local drive"
            }
        ]
    }
    assert list(validator.iter_errors(valid_private)) == []

    # Invalid: uppercase hex
    invalid_hex = dict(valid_data)
    invalid_hex["files"][0]["sha256"] = "A" * 64
    assert len(list(validator.iter_errors(invalid_hex))) > 0
    invalid_hex["files"][0]["sha256"] = "a" * 64

    # Invalid: redistributable false without note
    invalid_note = {
        "dataset_id": "my_dataset",
        "files": [
            {
                "path": "file1.csv",
                "sha256": "a" * 64,
                "source": "Source 1",
                "source_url": "https://example.com",
                "retrieved_at": "2024-01-01",
                "license_or_terms": "CC-BY",
                "redistributable": False
            }
        ]
    }
    assert len(list(validator.iter_errors(invalid_note))) > 0

    # Invalid: private true with redistributable true
    invalid_private = {
        "dataset_id": "my_dataset",
        "files": [
            {
                "path": "file1.csv",
                "sha256": "a" * 64,
                "source": "Source 1",
                "source_url": "https://example.com",
                "retrieved_at": "2024-01-01",
                "license_or_terms": "CC-BY",
                "redistributable": True,
                "private": True
            }
        ]
    }
    assert len(list(validator.iter_errors(invalid_private))) > 0

    # Invalid: extra field
    invalid_extra = dict(valid_data)
    invalid_extra["files"][0]["extra_field"] = "value"
    assert len(list(validator.iter_errors(invalid_extra))) > 0

import sys

sys.path.insert(0, str(Path(__file__).parent.parent.parent))
from scripts.datapipe.manifest import ManifestError, register_file, verify_manifest


def test_manifest_verification(tmp_path):
    dataset_dir = tmp_path / "test_data"
    dataset_dir.mkdir()
    
    (dataset_dir / "file1.csv").write_text("hello")
    # hash of "hello" is 2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824
    
    manifest_data = {
        "dataset_id": "test_data",
        "files": [
            {
                "path": "file1.csv",
                "sha256": "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
                "source": "S",
                "source_url": None,
                "retrieved_at": "2024-01-01",
                "license_or_terms": None,
                "redistributable": True
            }
        ]
    }
    (dataset_dir / "MANIFEST.json").write_text(json.dumps(manifest_data))
    
    # Success
    assert verify_manifest("test_data", dataset_dir) == True

    # Missing file
    (dataset_dir / "file1.csv").unlink()
    with pytest.raises(ManifestError, match="ERROR test_data file1.csv file missing"):
        verify_manifest("test_data", dataset_dir)

    # Recreate file with wrong content
    (dataset_dir / "file1.csv").write_text("wrong")
    with pytest.raises(ManifestError, match="ERROR test_data file1.csv sha256 mismatch"):
        verify_manifest("test_data", dataset_dir)
        
    (dataset_dir / "file1.csv").write_text("hello")
    # Unregistered file
    (dataset_dir / "unreg.csv").write_text("foo")
    with pytest.raises(ManifestError, match="ERROR test_data unreg.csv unregistered file present"):
        verify_manifest("test_data", dataset_dir)
    (dataset_dir / "unreg.csv").unlink()

    # Path with ..
    manifest_data["files"][0]["path"] = "../file1.csv"
    (dataset_dir / "MANIFEST.json").write_text(json.dumps(manifest_data))
    with pytest.raises(ManifestError, match="ERROR test_data ../file1.csv invalid path"):
        verify_manifest("test_data", dataset_dir)

def test_manifest_register(tmp_path):
    dataset_dir = tmp_path / "test_data"
    dataset_dir.mkdir()
    
    file_path = dataset_dir / "new.csv"
    file_path.write_text("content")
    
    # First register
    register_file(
        dataset_dir,
        "new.csv",
        source="My Source",
        source_url="http://x.com",
        retrieved_at="2024-01-01",
        license_or_terms="None",
        redistributable=True,
        private=False,
        note=None
    )
    
    manifest_file = dataset_dir / "MANIFEST.json"
    assert manifest_file.exists()
    man = json.loads(manifest_file.read_text())
    assert man["dataset_id"] == "test_data"
    assert len(man["files"]) == 1
    assert man["files"][0]["path"] == "new.csv"
    assert man["files"][0]["sha256"] == "ed7002b439e9ac845f22357d822bac1444730fbdb6016d3ec9432297b9ec9f73"
    
    # Second register same file path, different content -> fails without replace
    file_path.write_text("other content")
    with pytest.raises(ManifestError, match="sha256 mismatch.*use --replace"):
        register_file(
            dataset_dir,
            "new.csv",
            source="My Source",
            source_url="http://x.com",
            retrieved_at="2024-01-01",
            license_or_terms="None",
            redistributable=True,
            private=False,
            note=None
        )
        
    # With replace, it updates
    register_file(
        dataset_dir,
        "new.csv",
        source="My Source",
        source_url="http://x.com",
        retrieved_at="2024-01-01",
        license_or_terms="None",
        redistributable=True,
        private=False,
        note=None,
        replace=True
    )
    man2 = json.loads(manifest_file.read_text())
    assert man2["files"][0]["sha256"] != man["files"][0]["sha256"]

    # Entries are sorted
    file_path_a = dataset_dir / "a.csv"
    file_path_a.write_text("a")
    register_file(dataset_dir, "a.csv", "S", None, "2024-01-01", None, True, False, None)
    
    man3 = json.loads(manifest_file.read_text())
    assert man3["files"][0]["path"] == "a.csv"
    assert man3["files"][1]["path"] == "new.csv"