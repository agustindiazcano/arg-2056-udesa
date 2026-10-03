# Last Context

## State
- Task `storytelling-substeps` on branch `task/storytelling-substeps`: a narrative layer over the scenes. Each scene has an ordered list of steps; a caption panel shows the current step and moving between steps drives the shared store fields (year, scenario, province, AI overlay, playing, speed only when a step gives one).
- Pure code in `web/src/story/`: `types.ts` (`Step`, `StepFocus`, `StepsByScene`, `Speed`), `focus.ts` (`applyFocus`, `stepDeviates`, `FocusFields`), `validate.ts` (`validateSteps`). UI: `StoryCaption.tsx` (+ `story.css`), `StepRunner.tsx`; both mounted in `App.tsx` (not in the references entry). `.scene-container` has bottom padding from `--story-panel-height`, set by the panel.
- Content: `web/src/content/steps/index.ts` has 18 placeholder steps (3 per scene), written as literal objects so the gate can read them. Economy drives years 1880/1950/2025; forecast drives the three scenarios and plays 2026-2056 in step 3; ai-revolution turns the overlay on in step 2; the rest have empty focus.
- State: `State.stepIndex: Record<Scene, number>` (all 0), `INITIAL_STEP_INDEX`, `SPEEDS` exported. Actions are camelCase like the existing ones: `stepNext`, `stepPrev`, `stepFirst` (KeyAction) and `stepSet {index}` (UiAction). `reduce(state, action, steps = STEPS)`; the third argument is only for tests. Keys added: `PageDown`, `PageUp`, `Home`; all previous entries are unchanged and tested against a copy written in the test.
- Release gate: `scripts/check_no_mock.py` now finds the object that holds `placeholder: true` with brace counting (the old flat-object regex could not see a step with a nested `focus`), reads its own id and prefixes the key of the array that holds it (`andes/step-1`). Today `--content web/src/content` prints 3 eras and 18 steps and exits 1. No new dependency.
- TDD: each test commit precedes its implementation. `python scripts/precheck.py` result: see the PR.

## Decisions
- Entering a scene by any route (`setScene`, `nextScene`, `prevScene`) restarts its story at step 1 and applies that focus in the same state. `setScene` to the scene already shown keeps its step.
- `stepNext` at the last step and `stepPrev` at the first return the same state (no focus re-applied), so a clicker misfire does not undo exploration. `stepSet` with the current index re-applies the focus ("Return to step").
- The runner pauses at `toYear` when the year reaches or passes it while playing. A manual jump past `toYear` while playing is indistinguishable from the ticker and snaps to `toYear` too.
- Sources show as links to `references.html#<id>` only for ids in `registryIds`; the shell does not load the registry yet, so today they are plain ids.

## Next step
- Human: review the PR; decide the four points of section 9 of the brief (keys, restart on entering a scene, no automatic crossing between scenes, panel at the bottom); try the clicker keys on the presenter hardware; check the panel against `docs/design.md`.
- Human before release: write the real steps with sources.
- Next in `TASKS.md`: `integration`.
- Pushed, CI not checked.
