# GEMINI.md

Read `AGENTS.md` first; it is the single source of truth for this repository.

Gemini-specific notes:
- At session start read `LASTCONTEXT.md` and `PENDING.md`, in that order.
- Work on one task at a time, on its own branch (`task/<slug>`), with TDD.
- Do not invent data. Every figure needs `source` and `retrieved_at`.
- Never merge or push to `main`. A human approves every PR.
- At the end of each task overwrite `LASTCONTEXT.md` and update `PENDING.md`.
