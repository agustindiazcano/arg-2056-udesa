import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CI = (ROOT / ".github" / "workflows" / "ci.yml").read_text(encoding="utf-8")


def job(name):
    """The text of one top-level job of ci.yml (from its key to the next job or the end of the file)."""
    match = re.search(rf"^  {re.escape(name)}:\n(.*?)(?=^  [A-Za-z0-9_-]+:\n|^  # |\Z)", CI, re.DOTALL | re.MULTILINE)
    assert match, f"job {name} not found in ci.yml"
    return match.group(1)


def test_the_release_job_runs_only_for_version_tags_and_manual_dispatch():
    release = job("release")
    assert "if: startsWith(github.ref, 'refs/tags/v') || github.event_name == 'workflow_dispatch'" in release


def test_the_release_job_runs_every_gate_in_this_order():
    release = job("release")
    steps = [
        "python scripts/precheck.py",
        "npm run build:release",
        "npm run check:bundle",
        "npx playwright test",
    ]
    positions = [release.index(step) for step in steps]
    assert positions == sorted(positions), "the gates must run in the documented order"


def test_the_e2e_of_the_release_job_runs_against_the_release_build_it_does_not_rebuild_it():
    release = job("release")
    assert "E2E_SKIP_BUILD: '1'" in release


def test_the_release_job_uploads_web_dist_as_the_site_artifact():
    release = job("release")
    assert "name: site" in release
    assert "path: web/dist" in release


def test_the_release_job_cannot_pass_while_a_gate_fails():
    release = job("release")
    assert "continue-on-error" not in release
    assert "|| true" not in release
    assert "if: always()" not in release.split("name: site")[0], "no step before the upload may be conditional on failure"


def test_the_expected_failure_step_of_pull_requests_is_not_in_the_release_job():
    assert "expect_failure.py" not in job("release")
    assert "expect_failure.py" in job("e2e")
