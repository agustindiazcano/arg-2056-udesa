# Visits archive

Vercel keeps Web Analytics for 30 days only. A weekly job copies the daily numbers into
`web/public/analytics/visits.json`, so the totals keep growing. The References page (`/references.html`, section
"Visits") shows the total visitors and page views and a table by country with its flag.

## How it works

| Piece | What it does |
|---|---|
| `scripts/sync_visits.py` | For each of the last 28 complete days (UTC) asks `GET https://api.vercel.com/v1/query/web-analytics/visits/aggregate` (`by=country`, one request per day) and stores `{country: {pageviews, visitors}}` under that date. A day fetched again **replaces** the stored day, so overlapping runs never count twice; days older than the window stay. Writes nothing if any request fails. |
| `.github/workflows/visits.yml` | Mondays 06:17 UTC and by hand. Runs the script, and when the file changed it pushes a branch `visits/<date>` and opens a PR. A human merges; nothing is pushed to `main`. Merging redeploys the site with the new totals. |
| `web/src/analytics/` | Validation (`parseVisits`), totals (`summarize`), flag emoji and country names, and the `VisitsSection` component. |

The script reports `gap: no data for ...` when the archive and the window do not touch (a run was missed for more than
about 3 weeks); those days are lost, because Vercel no longer has them.

## What the numbers mean

Visitors are counted by Vercel **per day**: someone who comes back on another day counts again. The total of
visitors is therefore the sum of the daily visitors, not a count of distinct people. The archive and the page say so.
Countries come from Vercel (2-letter codes); a visit without one goes under "Unknown".

Flags are emoji (no dependency). Windows browsers draw the two regional-indicator letters (for example "AR") instead of
the flag; Mac, iPhone, Android and Linux draw the flag.

## One-time setup (human)

1. Enable **Web Analytics** in the Vercel project (see `docs/performance.md`, section 5) and let it collect.
2. Create a Vercel access token (Account Settings > Tokens) and find the project id (Project Settings > General) and,
   for a team project, the team id.
3. GitHub repository > Settings > Secrets and variables > Actions: add `VERCEL_TOKEN`, `VERCEL_PROJECT_ID` and, for a
   team, `VERCEL_TEAM_ID`.
4. GitHub repository > Settings > Actions > General: enable **Allow GitHub Actions to create and approve pull requests**.
5. Run the workflow once by hand (Actions > Archive visits > Run workflow) and read the log and the PR it opens.

Local run: `VERCEL_TOKEN=... VERCEL_PROJECT_ID=... python scripts/sync_visits.py --days 7`.

## Not verified

The script was tested against a fake HTTP layer only. It has not been run against the real Vercel API, so these
assumptions are unconfirmed until step 5: that `since` and `until` set to the same day return that day, that the
response rows carry `country`, `pageviews` and `visitors` as in the Vercel documentation, that `limit=100` is accepted,
and that the account's plan allows the Web Analytics API and the 28-day window.
