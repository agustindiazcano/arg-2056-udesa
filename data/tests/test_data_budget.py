import subprocess
import sys


def test_budget(tmp_path):
    d = tmp_path / "public_data"
    d.mkdir()
    
    script = "scripts/check_data_budget.py"
    
    res = subprocess.run([sys.executable, script, "--dir", str(d)], capture_output=True, check=False)
    assert res.returncode == 0
    
    (d / "small.json").write_bytes(b"a" * 1000)
    res = subprocess.run([sys.executable, script, "--dir", str(d)], capture_output=True, check=False)
    assert res.returncode == 0
    
    # Over file budget
    (d / "large.json").write_bytes(b"a" * 1_600_000)
    res = subprocess.run([sys.executable, script, "--dir", str(d)], capture_output=True, text=True, check=False)
    assert res.returncode == 1
    assert "large.json" in res.stdout
    assert "1600000 bytes (> 1500000)" in res.stdout
    
    # Over total budget
    (d / "large2.json").write_bytes(b"a" * 1_400_000)
    (d / "large3.json").write_bytes(b"a" * 1_400_000)
    (d / "large4.json").write_bytes(b"a" * 1_400_000)
    
    res = subprocess.run([sys.executable, script, "--dir", str(d)], capture_output=True, text=True, check=False)
    assert res.returncode == 1
    assert "TOTAL" in res.stdout