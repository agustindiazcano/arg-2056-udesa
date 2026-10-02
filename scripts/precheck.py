import shutil
import subprocess
import sys
from pathlib import Path


class Step:
    def __init__(self, name, cmd, cwd):
        self.name = name
        self.cmd = cmd
        self.cwd = cwd

def build_steps(root_dir, only, npm_path):
    root = Path(root_dir)
    steps = []
    
    do_python = not only or only == "python"
    do_data = not only or only == "data"
    do_web = not only or only == "web"
    
    if do_python:
        steps.append(Step("ruff", [sys.executable, "-m", "ruff", "check", "."], root))
        steps.append(Step("pytest", [sys.executable, "-m", "pytest", "-q"], root))
        
    if do_data:
        steps.append(Step("validate-data", [sys.executable, "scripts/validate_data.py"], root))
        
    if do_web:
        web_dir = root / "web"
        if npm_path is None:
            # We add dummy steps that will fail immediately
            for name, args in [("web-lint", []), ("web-typecheck", []), ("web-test", [])]:
                steps.append(Step(name, None, web_dir)) # None cmd signals npm not found
        else:
            steps.append(Step("web-lint", [npm_path, "run", "lint"], web_dir))
            steps.append(Step("web-typecheck", [npm_path, "run", "typecheck"], web_dir))
            steps.append(Step("web-test", [npm_path, "test"], web_dir))
            
    return steps

def run_steps(steps, runner):
    results = []
    for step in steps:
        if step.name.startswith("web-"):
            pkg = step.cwd / "package.json"
            if not pkg.exists():
                results.append((step, "SKIPPED", 0.0, "no package.json"))
                continue
            if step.cmd is None:
                results.append((step, "FAIL", 0.0, "npm not found in PATH"))
                continue
            node_modules = step.cwd / "node_modules"
            if not node_modules.exists():
                results.append((step, "FAIL", 0.0, 'run "npm ci" in web/ first'))
                continue
                
        import time
        start = time.time()
        print(f"--- Running step: {step.name} ---")
        try:
            res = runner(step.cmd, cwd=step.cwd)
            dur = time.time() - start
            if res.returncode == 0:
                results.append((step, "PASS", dur, ""))
            else:
                results.append((step, "FAIL", dur, f"exit code {res.returncode}"))
        except (subprocess.SubprocessError, OSError) as e:
            dur = time.time() - start
            results.append((step, "FAIL", dur, str(e)))
            
    return results

def main_logic(steps, runner):
    results = run_steps(steps, runner)
    
    print("\n=== PRECHECK SUMMARY ===")
    failed_steps = []
    for step, status, dur, msg in results:
        print(f"{step.name:<15} | {status:<7} | {dur:5.1f}s | {msg}")
        if status == "FAIL":
            failed_steps.append(step.name)
            
    if failed_steps:
        print(f"PRECHECK FAILED: {', '.join(failed_steps)}")
        return 1
    else:
        print("PRECHECK OK")
        return 0

def real_runner(cmd, cwd):
    # we don't use capture_output so it streams live
    return subprocess.run(cmd, cwd=str(cwd), check=False)

def main(argv):
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--only", choices=["python", "data", "web"])
    args = parser.parse_args(argv[1:])
    
    root_dir = Path(__file__).parent.parent.resolve()
    npm_path = shutil.which("npm")
    
    steps = build_steps(root_dir, args.only, npm_path)
    return main_logic(steps, real_runner)

if __name__ == "__main__":
    sys.exit(main(sys.argv))
