# Task: `demo-video` (optional)

Status: **draft brief, blocked by the contest's requirements** (length, format, language, whether a video is required at all: `PENDING.md`, "Blocked / questions"). The task produces the **script and the recording checklist**, not the video: the human records it. Do not start until the contest rules are known.

Branch: `task/demo-video`. One PR, documentation and one small check script only. Read `AGENTS.md`, `LASTCONTEXT.md`, `PENDING.md`, `docs/release-checklist.md`, `docs/deploy.md`, `docs/performance.md`, `docs-submission.md` (and the contest rules it lists), `web/src/content/steps/index.ts` (the story steps), `web/src/story/` (the clicker keys `PageDown`, `PageUp`, `Home`), `web/src/state/` (the key map and the speeds) and the scene code first.
Prerequisites: the real story steps and the real data are in place (`PENDING.md` "Human task before release"), `deploy` is merged (it is), and the human has said what the contest requires.

## What the human must supply first

| # | Item |
|---|---|
| 1 | Whether a video is required, its maximum length, format, resolution, language and whether it needs narration, captions or both |
| 2 | The audience the video is for (judges, the public) and the one thing a viewer must remember |
| 3 | Narration: the human's own text, or a request for a draft from the repository's documents (the agent never invents a claim) |

## Goal

A script a person can follow with the app on screen, and a checklist that makes the recording safe: what to show, in which order, with which keys, in how many seconds, saying only what the app and its documents support. The video is the project told in the time the contest allows.

## Out of scope (do NOT do)

- **No video file, no audio file, no screen recording, no text-to-speech.** No recording tool in the repository, no new dependency. The deliverables are Markdown and, optionally, a script that checks the preconditions.
- **No new claim.** Every sentence of the narration draft cites the scene, step or document it comes from; if the human writes the narration, the agent only checks it against the repository and flags what the app does not show.
- No application change. If the demo needs something the app cannot do, list it for the human; do not build it. Do not edit `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`. Do not fake CI. Do not silence any checker.

## 1. Deliverables

1. `docs/demo-script.md`: a table with one row per beat: time range, scene, the exact key presses (`ArrowRight` for the next scene, `PageDown` for the next story step, `Space`, `+` and `-`, `1` to `3` for the scenario, `P` for the province filter, `Home` to restart the story), what is on screen, the narration line (with its source), and the fallback if something fails. The total length matches the contest limit; a beat is no shorter than the time needed to read its caption.
2. `docs/demo-recording.md`: the checklist for the recording session: build and URL to use (the production URL, not the dev server), `?quality=high`, window size and zoom, no browser extensions or notifications, system language, the cursor hidden or visible on purpose, a dry run, captions and where to put them, how to cut and export, and the file name and size limits from the contest.
3. `scripts/demo_preflight.py <url>` (standard library only): fails with a message if the deployed site shows the `MOCK DATA` badge or a placeholder step text, if any scene's heading is missing, if `references.html` lists no sources, or if the smoke script (`scripts/smoke_deployed.py`) fails. It is the "is the app ready to be filmed" gate. Exit 0, 1 or 2 as the smoke script does.

## 2. Tests (write first, for the script)

The preflight script against a local fixture server (the pattern of `data/tests/test_smoke_deployed.py`): passes on a good fixture; each failure (mock badge, placeholder step text, missing heading, empty references, smoke failure) gives its exact message and exit 1; an unreachable host exits 2. Tests assert exact messages and never use the real internet.

## 3. Acceptance checklist

- [ ] The contest requirements supplied and matched to the script's length and format.
- [ ] Every narration line cites its source; no claim the app or the documents do not support.
- [ ] Preflight script tested (positive and each negative case); no recording artifact in the repository.
- [ ] `docs/release-checklist.md` section 5 and 6 updated; `PENDING.md` and `LASTCONTEXT.md` updated.
- [ ] PR description: what changed, what was verified, what the human must verify (the script's timing by a dry run, the narration, the claims).
