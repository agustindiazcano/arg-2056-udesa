# Last Context

## State
- Branch: `task/references-i18n-readme`; PR #164 is open against `main`.
- Merged current `main` into the PR branch, retaining the slide 4 Malvinas outline: Natural Earth 1:10m, projected with the map and shown as non-selectable no-data geography (D-geo-1).
- Slide references use a shared accessible dialog; CI run 41220647407 passed, including keyboard and slide coverage. Human review of source associations and visual layout remains recommended.
- `README.md` is in English; `README.es.md` preserves the original Spanish. The separate `task/readme-source-labels` branch removes source-status labels and has not been merged.
- ES/EN site translation and the responsive carousel remain planned in `docs/tasks/language-switch.md` and `docs/tasks/references-responsive-carousel.md`.
- Leave the untracked `.worktrees/` directory untouched.

## Next step
- Push the conflict resolution, check CI for the updated branch, and request human review of PR #164. Never merge or push to `main`.
