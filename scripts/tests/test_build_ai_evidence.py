"""The evidence builder runs against temporary source fixtures, never real data/."""
import subprocess
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / "build_ai_evidence.mjs"


def fixtures(tmp_path: Path) -> None:
    (tmp_path / "data/raw/arxiv").mkdir(parents=True)
    (tmp_path / "data/raw/natural-earth").mkdir(parents=True)
    (tmp_path / "web/src/tour").mkdir(parents=True)
    csv = "month,submissions,historical_delta\n" + "".join(
        f"{year}-{month:02d},10,0\n"
        for year in range(2020, 2026)
        for month in range(1, 13)
    )
    (tmp_path / "data/raw/arxiv/monthly-submissions-2026-10-30.csv").write_text(csv)
    (tmp_path / "data/raw/natural-earth/countries-110m.geojson").write_text(
        '{"features":[]}'
    )


def test_builds_complete_years_in_temporary_workspace(tmp_path):
    import json

    fixtures(tmp_path)
    result = subprocess.run(
        ["node", str(SCRIPT), str(tmp_path)], check=False, capture_output=True, text=True
    )
    assert result.returncode == 0
    assert "Built 6 arXiv annual counts" in result.stdout
    rows = json.loads((tmp_path / "web/src/tour/aiResearchCounts.json").read_text())
    assert [row["count"] for row in rows] == [120] * 6
    assert all(row["source"]["url"].startswith("https://arxiv.org/") for row in rows)


def test_rejects_an_incomplete_year(tmp_path):
    fixtures(tmp_path)
    path = tmp_path / "data/raw/arxiv/monthly-submissions-2026-10-30.csv"
    path.write_text(path.read_text().replace("2020-01,10,0\n", ""))
    result = subprocess.run(
        ["node", str(SCRIPT), str(tmp_path)], check=False, capture_output=True, text=True
    )
    assert result.returncode == 1
    assert "Incomplete year: 2020" in result.stderr


def test_rejects_a_malformed_month(tmp_path):
    fixtures(tmp_path)
    path = tmp_path / "data/raw/arxiv/monthly-submissions-2026-10-30.csv"
    path.write_text("month,submissions\nbroken,5\n")
    result = subprocess.run(
        ["node", str(SCRIPT), str(tmp_path)], check=False, capture_output=True, text=True
    )
    assert result.returncode == 1
    assert "Invalid arXiv row" in result.stderr
