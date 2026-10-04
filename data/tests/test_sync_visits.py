import json
import sys
from datetime import date, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "scripts"))

import sync_visits  # the scripts folder is added to the path above

TODAY = "2026-10-10"
ENV = {"VERCEL_TOKEN": "tok_secret_123", "VERCEL_PROJECT_ID": "prj_1", "VERCEL_TEAM_ID": "team_1"}


class FakeHttp:
    """Answers each request from a per-day table and records the requests."""

    def __init__(self, rows_by_day=None, status=200, body=None):
        self.rows_by_day = rows_by_day or {}
        self.status = status
        self.body = body
        self.requests = []

    def __call__(self, url, headers):
        self.requests.append((url, headers))
        if self.body is not None:
            return self.status, self.body
        if self.status != 200:
            return self.status, '{"error":{"message":"denied"}}'
        day = sync_visits.query_value(url, "since")
        return 200, json.dumps({"version": 1, "data": self.rows_by_day.get(day, [])})


def run(tmp_path, http, env=None, extra=(), archive_name="visits.json"):
    archive = tmp_path / archive_name
    out, err = [], []
    code = sync_visits.main(
        ["--archive", str(archive), "--today", TODAY, *extra],
        env=ENV if env is None else env,
        http_get=http,
        stdout=out.append,
        stderr=err.append,
    )
    return code, archive, "".join(out), "".join(err)


def read(path):
    return json.loads(path.read_text(encoding="utf-8"))


def days_before_today(n):
    return (date.fromisoformat(TODAY) - timedelta(days=n)).isoformat()


# ---- url ---------------------------------------------------------------------------------------------------------


def test_the_url_asks_for_one_day_grouped_by_country_with_project_and_team():
    url = sync_visits.build_url("prj_1", "team_1", "2026-10-01")
    assert url.startswith("https://api.vercel.com/v1/query/web-analytics/visits/aggregate?")
    assert sync_visits.query_value(url, "since") == "2026-10-01"
    assert sync_visits.query_value(url, "until") == "2026-10-01"
    assert sync_visits.query_value(url, "by") == "country"
    assert sync_visits.query_value(url, "limit") == "100"
    assert sync_visits.query_value(url, "projectId") == "prj_1"
    assert sync_visits.query_value(url, "teamId") == "team_1"


def test_the_url_has_no_team_for_a_personal_project():
    url = sync_visits.build_url("prj_1", None, "2026-10-01")
    assert sync_visits.query_value(url, "teamId") is None


# ---- rows --------------------------------------------------------------------------------------------------------


def test_rows_become_a_country_table_and_unknown_countries_are_grouped():
    rows = [
        {"country": "AR", "pageviews": 10, "visitors": 4},
        {"country": "us", "pageviews": 3, "visitors": 2},
        {"country": "Others", "pageviews": 5, "visitors": 5},
        {"country": None, "pageviews": 1, "visitors": 1},
    ]
    assert sync_visits.day_table(rows) == {
        "AR": {"pageviews": 10, "visitors": 4},
        "US": {"pageviews": 3, "visitors": 2},
        "unknown": {"pageviews": 6, "visitors": 6},
    }


def test_a_row_without_numbers_is_an_error_not_a_zero():
    try:
        sync_visits.day_table([{"country": "AR", "pageviews": 10}])
    except sync_visits.SyncError as error:
        assert "visitors" in str(error)
    else:
        raise AssertionError("expected SyncError")


def test_merge_replaces_the_fetched_days_and_keeps_the_others():
    archive = {"days": {"2026-09-01": {"AR": {"pageviews": 1, "visitors": 1}}, "2026-10-01": {"AR": {"pageviews": 9, "visitors": 9}}}}
    fetched = {"2026-10-01": {"AR": {"pageviews": 2, "visitors": 2}}, "2026-10-02": {}}
    merged = sync_visits.merge_days(archive, fetched)
    assert merged["days"] == {
        "2026-09-01": {"AR": {"pageviews": 1, "visitors": 1}},
        "2026-10-01": {"AR": {"pageviews": 2, "visitors": 2}},
        "2026-10-02": {},
    }
    assert sync_visits.merge_days(merged, fetched) == merged  # running it again changes nothing


# ---- main --------------------------------------------------------------------------------------------------------


def test_first_run_asks_for_each_of_the_28_complete_days_before_today_and_writes_the_archive(tmp_path):
    yesterday = days_before_today(1)
    http = FakeHttp({yesterday: [{"country": "AR", "pageviews": 7, "visitors": 3}]})
    code, archive, out, err = run(tmp_path, http)
    assert code == 0, err
    assert len(http.requests) == 28
    asked = [sync_visits.query_value(url, "since") for url, _ in http.requests]
    assert asked[0] == days_before_today(28) and asked[-1] == yesterday
    assert TODAY not in asked  # today is not complete
    data = read(archive)
    assert data["retrieved_at"] == TODAY
    assert data["source"].startswith("Vercel Web Analytics API")
    assert data["days"][yesterday] == {"AR": {"pageviews": 7, "visitors": 3}}
    assert len(data["days"]) == 28
    assert "28 days" in out


def test_the_token_goes_in_the_authorization_header_and_never_in_the_output(tmp_path):
    http = FakeHttp()
    code, archive, out, err = run(tmp_path, http)
    assert code == 0
    assert all(headers["Authorization"] == "Bearer tok_secret_123" for _, headers in http.requests)
    assert "tok_secret_123" not in out + err + archive.read_text(encoding="utf-8")


def test_a_second_run_keeps_old_days_and_overwrites_the_window(tmp_path):
    archive = tmp_path / "visits.json"
    archive.write_text(
        json.dumps(
            {
                "source": "x",
                "retrieved_at": "2026-09-01",
                "days": {
                    "2026-08-01": {"AR": {"pageviews": 5, "visitors": 5}},
                    days_before_today(2): {"AR": {"pageviews": 1, "visitors": 1}},
                },
            }
        ),
        encoding="utf-8",
    )
    http = FakeHttp({days_before_today(2): [{"country": "AR", "pageviews": 4, "visitors": 2}]})
    code, _, _, err = run(tmp_path, http)
    assert code == 0, err
    data = read(archive)
    assert data["days"]["2026-08-01"] == {"AR": {"pageviews": 5, "visitors": 5}}
    assert data["days"][days_before_today(2)] == {"AR": {"pageviews": 4, "visitors": 2}}
    assert data["retrieved_at"] == TODAY


def test_a_gap_between_the_archive_and_the_window_is_reported_and_still_exits_0(tmp_path):
    archive = tmp_path / "visits.json"
    archive.write_text(json.dumps({"source": "x", "retrieved_at": "2026-01-01", "days": {"2026-08-01": {}}}), encoding="utf-8")
    code, _, _out, err = run(tmp_path, FakeHttp())
    assert code == 0
    assert "gap" in err
    assert "2026-08-02" in err  # first missing day
    assert days_before_today(29) in err  # last missing day


def test_no_gap_is_reported_when_the_windows_overlap(tmp_path):
    archive = tmp_path / "visits.json"
    archive.write_text(json.dumps({"source": "x", "retrieved_at": "2026-10-03", "days": {days_before_today(10): {}}}), encoding="utf-8")
    code, _, _, err = run(tmp_path, FakeHttp())
    assert code == 0
    assert "gap" not in err


def test_days_option_changes_the_window(tmp_path):
    http = FakeHttp()
    code, archive, _, _ = run(tmp_path, http, extra=["--days", "7"])
    assert code == 0
    assert len(http.requests) == 7
    assert len(read(archive)["days"]) == 7


def test_missing_token_exits_2_and_names_the_variable(tmp_path):
    code, archive, _, err = run(tmp_path, FakeHttp(), env={"VERCEL_PROJECT_ID": "prj_1"})
    assert code == 2
    assert "VERCEL_TOKEN" in err
    assert not archive.exists()


def test_missing_project_exits_2_and_names_the_variable(tmp_path):
    code, _, _, err = run(tmp_path, FakeHttp(), env={"VERCEL_TOKEN": "t"})
    assert code == 2
    assert "VERCEL_PROJECT_ID" in err


def test_a_team_id_is_optional(tmp_path):
    http = FakeHttp()
    code, _, _, err = run(tmp_path, http, env={"VERCEL_TOKEN": "t", "VERCEL_PROJECT_ID": "prj_1"})
    assert code == 0, err
    assert "teamId" not in http.requests[0][0]


def test_bad_options_exit_2(tmp_path):
    code, _, _, err = run(tmp_path, FakeHttp(), extra=["--days", "0"])
    assert code == 2
    assert "--days" in err
    code, _, _, err = run(tmp_path, FakeHttp(), extra=["--nope"])
    assert code == 2


def test_an_http_error_exits_1_with_the_status_and_writes_nothing(tmp_path):
    http = FakeHttp(status=403)
    code, archive, _, err = run(tmp_path, http)
    assert code == 1
    assert "403" in err
    assert "tok_secret_123" not in err
    assert not archive.exists()
    assert len(http.requests) == 1  # stops at the first failure


def test_a_failure_halfway_leaves_an_existing_archive_untouched(tmp_path):
    archive = tmp_path / "visits.json"
    original = json.dumps({"source": "x", "retrieved_at": "2026-10-03", "days": {"2026-08-01": {}}})
    archive.write_text(original, encoding="utf-8")
    code, _, _, _err = run(tmp_path, FakeHttp(status=500))
    assert code == 1
    assert archive.read_text(encoding="utf-8") == original


def test_an_answer_that_is_not_json_exits_1(tmp_path):
    code, archive, _, err = run(tmp_path, FakeHttp(body="<html>oops</html>"))
    assert code == 1
    assert "not JSON" in err
    assert not archive.exists()


def test_an_answer_without_data_exits_1(tmp_path):
    code, _, _, err = run(tmp_path, FakeHttp(body='{"version": 1}'))
    assert code == 1
    assert "data" in err


def test_a_corrupt_archive_exits_1_and_is_not_overwritten(tmp_path):
    archive = tmp_path / "visits.json"
    archive.write_text("{not json", encoding="utf-8")
    code, _, _, err = run(tmp_path, FakeHttp())
    assert code == 1
    assert "visits.json" in err
    assert archive.read_text(encoding="utf-8") == "{not json"
