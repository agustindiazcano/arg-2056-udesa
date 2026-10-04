"""Archives Vercel Web Analytics by day and country, so the numbers outlive the 30-day reporting window.

usage: sync_visits.py [--archive PATH] [--days N] [--today YYYY-MM-DD]

Reads VERCEL_TOKEN and VERCEL_PROJECT_ID (and VERCEL_TEAM_ID for a team project) from the environment. For each of the
last N complete days (default 28, ending yesterday, UTC) it asks the Web Analytics API for the page views and visitors
by country and stores them under that date in the archive (default web/public/analytics/visits.json). A day that is
fetched again is replaced, never added, so overlapping runs do not count anything twice; days older than the window are
kept as they are.

Exit 0 when the archive was written. Exit 1 when the API or the archive failed (nothing is written). Exit 2 for a usage
error or a missing environment variable.
"""

import argparse
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_ARCHIVE = ROOT / "web" / "public" / "analytics" / "visits.json"
API = "https://api.vercel.com/v1/query/web-analytics/visits/aggregate"
DEFAULT_DAYS = 28
UNKNOWN = "unknown"
SOURCE = "Vercel Web Analytics API (visits/aggregate by country, one request per day)"
NOTE = (
    "Visitors are as Vercel counts them per day: someone who returns on another day is counted again, so the total of "
    "visitors is the sum of the daily visitors, not a count of distinct people."
)


class SyncError(Exception):
    """A failure that stops the run before anything is written."""


def build_url(project_id, team_id, day):
    query = {"projectId": project_id, "since": day, "until": day, "by": "country", "limit": "100"}
    if team_id:
        query["teamId"] = team_id
    return f"{API}?{urllib.parse.urlencode(query)}"


def query_value(url, key):
    values = urllib.parse.parse_qs(urllib.parse.urlparse(url).query).get(key)
    return values[0] if values else None


def _count(row, key):
    value = row.get(key)
    if isinstance(value, bool) or not isinstance(value, int) or value < 0:
        raise SyncError(f"a row of the answer has no valid {key}: {row!r}")
    return value


def day_table(rows):
    """{country: {pageviews, visitors}} from the API rows. Anything that is not a 2-letter code is "unknown"."""
    table = {}
    for row in rows:
        pageviews, visitors = _count(row, "pageviews"), _count(row, "visitors")
        country = row.get("country")
        code = country.upper() if isinstance(country, str) and len(country) == 2 and country.isalpha() else UNKNOWN
        entry = table.setdefault(code, {"pageviews": 0, "visitors": 0})
        entry["pageviews"] += pageviews
        entry["visitors"] += visitors
    return table


def merge_days(archive, fetched):
    """The archive with the fetched days replacing the same days; the others stay. Does not change its arguments."""
    days = {**archive.get("days", {}), **fetched}
    return {**archive, "days": dict(sorted(days.items()))}


def http_get(url, headers):
    request = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return response.status, response.read().decode("utf-8")
    except urllib.error.HTTPError as error:
        return error.code, error.read().decode("utf-8", "replace")
    except urllib.error.URLError as error:
        raise SyncError(f"could not reach the Vercel API: {error.reason}") from error


def fetch_day(get, project_id, team_id, token, day):
    status, body = get(build_url(project_id, team_id, day), {"Authorization": f"Bearer {token}"})
    if status != 200:
        raise SyncError(f"the Vercel API answered HTTP {status} for {day}: {body[:200]}")
    try:
        answer = json.loads(body)
    except ValueError as error:
        raise SyncError(f"the answer for {day} is not JSON") from error
    data = answer.get("data") if isinstance(answer, dict) else None
    if not isinstance(data, list):
        raise SyncError(f"the answer for {day} has no data list")
    return day_table(data)


def load_archive(path):
    if not path.exists():
        return {"days": {}}
    try:
        archive = json.loads(path.read_text(encoding="utf-8"))
    except ValueError as error:
        raise SyncError(f"{path} is not valid JSON; fix or remove it by hand: {error}") from error
    if not isinstance(archive, dict) or not isinstance(archive.get("days"), dict):
        raise SyncError(f"{path} has no days object; fix or remove it by hand")
    return archive


def write_archive(path, archive):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(path.name + ".tmp")
    temporary.write_text(json.dumps(archive, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    os.replace(temporary, path)


class _Parser(argparse.ArgumentParser):
    def error(self, message):
        raise ValueError(message)


def main(argv=None, env=None, http_get=http_get, stdout=sys.stdout.write, stderr=sys.stderr.write, **_):
    env = os.environ if env is None else env
    parser = _Parser(prog="sync_visits")
    parser.add_argument("--archive", default=str(DEFAULT_ARCHIVE))
    parser.add_argument("--days", type=int, default=DEFAULT_DAYS)
    parser.add_argument("--today", default=None)
    try:
        args = parser.parse_args(sys.argv[1:] if argv is None else argv)
        if args.days < 1:
            raise ValueError("--days must be at least 1")
        today = date.fromisoformat(args.today) if args.today else datetime.now(timezone.utc).date()
    except ValueError as error:
        stderr(f"sync_visits: {error}\n")
        return 2

    token, project_id, team_id = env.get("VERCEL_TOKEN"), env.get("VERCEL_PROJECT_ID"), env.get("VERCEL_TEAM_ID")
    for name, value in (("VERCEL_TOKEN", token), ("VERCEL_PROJECT_ID", project_id)):
        if not value:
            stderr(f"sync_visits: {name} is not set\n")
            return 2

    path = Path(args.archive)
    window = [(today - timedelta(days=n)).isoformat() for n in range(args.days, 0, -1)]
    try:
        archive = load_archive(path)
        known = sorted(archive["days"])
        if known and known[-1] < window[0]:
            missing_from = (date.fromisoformat(known[-1]) + timedelta(days=1)).isoformat()
            missing_to = (date.fromisoformat(window[0]) - timedelta(days=1)).isoformat()
            if missing_from <= missing_to:
                stderr(f"sync_visits: gap: no data for {missing_from} to {missing_to} (older than the reporting window)\n")
        fetched = {day: fetch_day(http_get, project_id, team_id, token, day) for day in window}
    except (SyncError, ValueError) as error:
        stderr(f"sync_visits: {error}\n")
        return 1

    merged = merge_days(archive, fetched)
    merged = {"source": SOURCE, "retrieved_at": today.isoformat(), "note": NOTE, "days": merged["days"]}
    write_archive(path, merged)
    stdout(f"Archived {len(window)} days ({window[0]} to {window[-1]}) into {path}; the archive has {len(merged['days'])} days\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
