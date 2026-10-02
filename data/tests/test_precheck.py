import sys
from pathlib import Path

import pytest

# We will implement this
sys.path.append(str(Path(__file__).parent.parent.parent / "scripts"))
import precheck

class FakeRunner:
    def __init__(self, outcomes):
        # outcomes is a dict of step_name -> returncode
        self.outcomes = outcomes
        self.calls = []
        
    def run(self, cmd, cwd):
        if isinstance(cmd, str):
            pytest.fail("shell=True was used (cmd is a string)")
        step_name = "unknown"
        if "ruff" in cmd: step_name = "ruff"
        elif "pytest" in cmd: step_name = "pytest"
        elif "validate_data.py" in cmd[-1]: step_name = "validate-data"
        elif "lint" in cmd: step_name = "web-lint"
        elif "typecheck" in cmd: step_name = "web-typecheck"
        elif "test" in cmd: step_name = "web-test"
        
        self.calls.append((step_name, cmd, cwd))
        
        rc = self.outcomes.get(step_name, 0)
        
        class FakeResult:
            returncode = rc
        return FakeResult()

def test_precheck_all_pass(capsys, tmp_path):
    # Fake package.json and node_modules so web steps are not skipped/failed
    web_dir = tmp_path / "web"
    web_dir.mkdir()
    (web_dir / "package.json").touch()
    (web_dir / "node_modules").mkdir()
    
    runner = FakeRunner({})
    steps = precheck.build_steps(tmp_path, None, "fake-npm")
    rc = precheck.main_logic(steps, runner.run)
    
    out, _err = capsys.readouterr()
    assert rc == 0
    assert "PRECHECK OK" in out
    assert len(runner.calls) == 6

def test_precheck_one_fails(capsys, tmp_path):
    web_dir = tmp_path / "web"
    web_dir.mkdir()
    (web_dir / "package.json").touch()
    (web_dir / "node_modules").mkdir()
    
    runner = FakeRunner({"pytest": 1})
    steps = precheck.build_steps(tmp_path, None, "fake-npm")
    rc = precheck.main_logic(steps, runner.run)
    
    out, _err = capsys.readouterr()
    assert rc == 1
    assert "PRECHECK FAILED: pytest" in out
    # All 6 should have been called despite the failure
    assert len(runner.calls) == 6

def test_precheck_only_data(capsys, tmp_path):
    steps = precheck.build_steps(tmp_path, "data", "fake-npm")
    
    assert len(steps) == 1
    assert steps[0].name == "validate-data"
    
def test_precheck_only_web(capsys, tmp_path):
    web_dir = tmp_path / "web"
    web_dir.mkdir()
    (web_dir / "package.json").touch()
    (web_dir / "node_modules").mkdir()
    
    steps = precheck.build_steps(tmp_path, "web", "fake-npm")
    
    assert len(steps) == 3
    assert all(s.name.startswith("web-") for s in steps)

def test_precheck_npm_not_found(capsys, tmp_path):
    web_dir = tmp_path / "web"
    web_dir.mkdir()
    (web_dir / "package.json").touch()
    (web_dir / "node_modules").mkdir()
    
    runner = FakeRunner({})
    steps = precheck.build_steps(tmp_path, None, None)
    
    # Should build 6 steps, but the web steps have skip/fail logic
    rc = precheck.main_logic(steps, runner.run)
    out, _err = capsys.readouterr()
    
    assert rc == 1
    assert "PRECHECK FAILED: web-lint, web-typecheck, web-test" in out
    assert "npm not found in PATH" in out

def test_precheck_no_package_json(capsys, tmp_path):
    web_dir = tmp_path / "web"
    web_dir.mkdir()
    
    runner = FakeRunner({})
    steps = precheck.build_steps(tmp_path, None, "fake-npm")
    rc = precheck.main_logic(steps, runner.run)
    
    out, _err = capsys.readouterr()
    assert rc == 0
    assert "SKIPPED" in out
    assert "PRECHECK OK" in out

def test_precheck_no_node_modules(capsys, tmp_path):
    web_dir = tmp_path / "web"
    web_dir.mkdir()
    (web_dir / "package.json").touch()
    # No node_modules
    
    runner = FakeRunner({})
    steps = precheck.build_steps(tmp_path, None, "fake-npm")
    rc = precheck.main_logic(steps, runner.run)
    
    out, _err = capsys.readouterr()
    assert rc == 1
    assert 'run "npm ci" in web/ first' in out
    assert "PRECHECK FAILED: web-lint, web-typecheck, web-test" in out
