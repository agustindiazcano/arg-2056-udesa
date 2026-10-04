import re
from pathlib import Path

WORKFLOW = Path(__file__).resolve().parents[2] / ".github" / "workflows" / "visits.yml"


def text():
    return WORKFLOW.read_text(encoding="utf-8")


def test_it_runs_once_a_week_and_by_hand():
    content = text()
    crons = re.findall(r"cron:\s*'([^']+)'", content)
    assert len(crons) == 1
    minute, hour, day_of_month, month, weekday = crons[0].split()
    assert day_of_month == "*" and month == "*" and weekday.isdigit(), "a weekly cron names one weekday"
    assert "workflow_dispatch:" in content


def test_the_secrets_are_read_from_github_secrets_never_written_in_the_file():
    content = text()
    for name in ("VERCEL_TOKEN", "VERCEL_PROJECT_ID", "VERCEL_TEAM_ID"):
        assert f"{name}: ${{{{ secrets.{name} }}}}" in content
    assert not re.search(r"tok_|Bearer\s+[A-Za-z0-9]", content)


def test_it_runs_the_archive_script():
    assert "python scripts/sync_visits.py" in text()


def test_it_never_pushes_to_main_it_opens_a_pull_request_from_a_branch():
    content = text()
    assert "gh pr create" in content
    assert "--base main" in content
    assert not re.search(r"git push[^\n]*\bmain\b", content)
    assert 'git push origin "$branch"' in content
    assert "pull-requests: write" in content
    assert "contents: write" in content


def test_it_does_nothing_when_the_archive_did_not_change():
    assert "git status --porcelain" in text()
    assert "exit 0" in text()
