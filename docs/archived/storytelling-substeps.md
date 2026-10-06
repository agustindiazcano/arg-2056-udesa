# Task: `storytelling-substeps`

Branch: `task/storytelling-substeps`. One PR. Read `AGENTS.md`, `LASTCONTEXT.md`, `PENDING.md`, `docs/design.md` (binding for every color, spacing and typographic convention; read its open decision about sub-step navigation), `docs/tasks/shell.md`, and the shell code (store reducer and its tests, `KeyAction`, `KEY_MAP`, `useKeyboard`, `TabBar`, `Hud`, `MockBadge`, the `Scene`, `Year` and `Scenario` types and `PROVINCES`) first. Read the scene code only to see which store fields each scene reads.
Prerequisites: `shell`, `scene-resources`, `scene-forecast` and `scene-sandbox` are merged into `main`. If `scene-economy` is merged, reuse its placeholder release gate; otherwise create the gate as described in section 7.

## Goal

A narrative layer on top of the scenes: each scene has an ordered list of **steps** (story beats). A caption panel shows the current step's title and text, and moving between steps drives the scene by changing the shared state (year, scenario, province, AI overlay, playing). This turns the scenes into a guided presentation while keeping free exploration available at any time. All behavior lives in the pure reducer and pure functions, tested exactly.

Strict TDD. Atomic commits. Before every push run `python scripts/precheck.py`.

## Out of scope (do NOT do)

- No real story text, no real historical or economic claims. All step content is placeholder and flagged (section 5).
- No control of scene-local settings (indicator, resource, metric, peers, slider values) from steps: only the shared store fields listed in section 2. A follow-up task can add them.
- No Andes campaign-day control: the day of campaign is a separate type and is handled in `andes-integration`; this task does not add it.
- No new dependency. No animation beyond what `design.md` section 5 allows. No touch gestures. No presenter mode.
- This is the one task allowed to extend `KeyAction` and `KEY_MAP`, and only with the three entries in section 3. Every existing entry keeps its meaning.
- Do not edit `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`. Do not fake CI. Do not silence any checker.

## 1. Files

```
web/src/story/types.ts                 Step, StepFocus, StepsByScene
web/src/story/validate.ts              validateSteps(steps, context): string[]
web/src/story/focus.ts                 applyFocus(state, focus), stepDeviates(state, step)
web/src/story/StoryCaption.tsx         caption panel (title, text, dots, previous/next)
web/src/story/StepRunner.tsx           effect that pauses at the end of a play range
web/src/content/steps/index.ts         STEPS: StepsByScene (placeholders)
web/src/state/*                        reducer, actions, KeyAction and KEY_MAP edits (the existing files)
web/src/app/*                          mount StoryCaption and StepRunner in the shell layout
```

## 2. Types and focus

```
type StepFocus = {
  year?: Year;                      // jump the playhead to this year
  play?: { fromYear: Year; toYear: Year; speed?: Speed };  // start playing from fromYear, pause at toYear
  scenario?: Scenario;
  province?: string | null;         // an AR-X id or null to clear
  aiOverlay?: boolean;
};
type Step = {
  id: string;                       // unique within the scene, ^[a-z0-9-]+$
  title: string;
  text: string;
  focus: StepFocus;
  source_ids: readonly string[];    // ids in the references registry; may be empty
  placeholder: boolean;
};
type StepsByScene = Readonly<Record<Scene, readonly Step[]>>;
```

`year` and `play` are mutually exclusive in one step. `Speed` is the existing speed type from the shell.

## 3. State, actions and keys

New state field: `stepIndex: Record<Scene, number>` (every scene starts at 0).

New actions, each computed **atomically in the reducer** (no intermediate inconsistent state), reading the static `STEPS` module for counts and focus:
- `STEP_NEXT`: increases the current scene's index by 1 (clamped at the last step) and applies that step's focus.
- `STEP_PREV`: decreases (clamped at 0) and applies the focus.
- `STEP_FIRST`: index 0 and applies the focus.
- `STEP_SET { index }`: sets the index (clamped; a non-integer or negative value is ignored and the state is unchanged) and applies the focus.
- `SET_SCENE` (existing): also sets the entered scene's `stepIndex` to 0 and applies that step's focus (decision to confirm, see section 9).

Applying a focus changes only the fields the focus names: `year` sets `yearFloat` and `playing: false`; `play` sets `yearFloat = fromYear`, `speed` if given, `playing: true`; `scenario`, `province` and `aiOverlay` set those fields. Fields not named keep their value. A step with an empty focus changes nothing. `STEP_*` actions never touch `speed` unless the focus gives one.

Keys (add to `KeyAction` and `KEY_MAP`, nothing else): `PageDown` -> `STEP_NEXT`, `PageUp` -> `STEP_PREV`, `Home` -> `STEP_FIRST`. These keys are what most presentation clickers send. The existing keyboard rules apply: events whose target is an input, select, textarea or contenteditable are ignored; `preventDefault` is called for these three keys when handled so the page does not scroll.

## 4. Pure functions

- `validateSteps(stepsByScene, { minYear, maxYear, provinceIds, speeds })` returns a list of problem strings (empty means OK): every scene has at least one step; ids unique per scene and matching the pattern; non-empty `title` and `text`; `year` and `play` not both set; every `year` within the limits; `play.fromYear < play.toYear`, both within limits; `speed` in the allowed list; `province` is `null` or in `provinceIds`; `source_ids` has no duplicates.
- `applyFocus(state, focus)`: the pure function the reducer uses (section 3).
- `stepDeviates(state, step)`: `true` when the state no longer matches the step. It compares only the fields the focus names: `scenario`, `province` and `aiOverlay` by equality; `year` by `abs(yearFloat - year) < 0.5` is a match; for `play`, a match means `yearFloat` in `[fromYear, toYear]` inclusive. A step with an empty focus never deviates.

## 5. Content (`web/src/content/steps/index.ts`)

Create exactly three placeholder steps for every scene (`andes`, `economy`, `resources`, `forecast`, `ai-revolution`, `sandbox`). Ids `step-1`, `step-2`, `step-3`; titles "Step 1 (placeholder)" and so on; text "Placeholder text. Replace before release."; `placeholder: true`; `source_ids: []`. Focus values must be valid and plausible but carry no claim: for example in `economy` the years 1880, 1950 and 2025; in `forecast` the scenarios `pessimistic`, `expected`, `optimistic` and a `play` range in a later step; in `sandbox` and `resources` empty focus; in `andes` empty focus (campaign day is not controlled here); in `ai-revolution` `aiOverlay: true` on one step. The test in section 8 runs `validateSteps` over `STEPS` with the real limits.

## 6. Caption panel and runner

- `StoryCaption.tsx`: a region (`role="region"`, `aria-label="Story"`) docked at the bottom of the viewport so it does not cover the chart areas of the scenes (leave the scene a bottom padding equal to the panel height through a CSS variable). Shows "Step i of n", the title, the text, the source links (only for ids that exist in the references registry if it is loaded; otherwise plain ids), "Previous" and "Next" buttons (disabled at the ends; on the last step the Next button reads "Next scene" and moves to the next scene in tab order, which dispatches the existing scene action and therefore starts that scene at its first step), and one dot button per step with `aria-label="Go to step n: <title>"` and `aria-current="step"` on the current one. A visible "Return to step" button appears only when `stepDeviates` is true and re-applies the current step's focus (`STEP_SET` with the current index). A "Hide captions" toggle (`aria-pressed`, local state, default shown) collapses the panel to a small "Show captions" button. A `placeholder: true` step shows the visible tag "Placeholder" next to the title. Changing step announces the title in an `aria-live="polite"` region. The panel never takes focus by itself.
- `StepRunner.tsx`: renders nothing; an effect that, while the current step has a `play` range and `playing` is true, watches `yearFloat` and, when it reaches or passes `toYear`, dispatches the existing actions to set the year exactly to `toYear` and to pause. If the user pauses or changes the year manually before that, the runner does nothing further (no fighting the user). It does not run for steps without `play`.
- Mount both in the shell layout. The caption panel is hidden on the references page (it is a separate entry and does not load the shell).

## 7. Release gate for placeholders

If the gate from `scene-economy` exists (the check that makes `build:release` fail when an entry in `web/src/content/` has `placeholder: true`), extend it to cover `web/src/content/steps/`: it prints the scene and step ids. If it does not exist, create a minimal equivalent following the style of the existing `build:release` mock check, fail the release build on any `placeholder: true` found in `web/src/content/**`, and print the ids. Show in the PR that the normal dev build passes and the release gate fails today because of the placeholders. Keep the existing mock check working.

## 8. Tests (write first)

Reducer and pure functions (exact values):
- Initial `stepIndex` is 0 for every scene. `STEP_NEXT` and `STEP_PREV` change only the current scene's index, clamp at both ends, and apply the focus atomically (assert the full next state with `toEqual` for a year step, a play step, a scenario step, a province step, an AI step and an empty-focus step). `STEP_FIRST`, `STEP_SET` with valid, out-of-range, negative and non-integer indices (last two leave the state identical, same reference).
- `SET_SCENE` resets the entered scene's index to 0 and applies its first focus; the other scenes' indices are untouched.
- `applyFocus` does not touch fields the focus does not name; a `play` step sets `playing: true` and the optional speed; a `year` step sets `playing: false`.
- `validateSteps`: valid input gives an empty list; each failing case gives the exact message: empty scene, duplicate id, bad id pattern, empty title, empty text, `year` with `play`, year out of range, `fromYear >= toYear`, bad speed, unknown province, duplicate `source_ids`. `validateSteps(STEPS, realLimits)` is empty.
- `stepDeviates`: match and mismatch for each compared field; the 0.5 year tolerance at 0.49 and 0.5; the `play` range inclusive at both ends; empty focus never deviates.
- `KEY_MAP`: the three new entries map to the three new actions; a snapshot of the **previous** map entries proves they are unchanged (write the expected previous entries in the test from the shell brief, not from the current file).
- `useKeyboard`: `PageDown`, `PageUp`, `Home` dispatch the right actions and call `preventDefault`; the same keys with an `input` or `select` target dispatch nothing.

Component tests (jsdom):
- `StoryCaption` renders "Step 1 of 3", title and text; Next advances and the live region announces the new title; dots set the step; `aria-current` is on exactly one dot; Previous disabled at the first step; on the last step Next reads "Next scene" and moves the scene to the next in tab order and the new scene shows its step 1; "Return to step" appears only after a manual change (change the scenario in the store) and restores the focus; hide and show toggle; the placeholder tag is visible; source ids render as plain ids when no registry is loaded.
- `StepRunner`: with a play step and `playing` true, advancing `yearFloat` past `toYear` in the store makes it pause at exactly `toYear`; pausing manually first leaves the year as set; a non-play step does nothing.
- Shell: the three scenes' pressing `PageDown` changes the scene state through the reducer (assert store state, not pixels).
- Release gate: fails with the placeholders (assert the printed ids) and passes on a fixture without placeholders.

## 9. Decisions for the human (list them in the PR description with the default taken)

1. Keys: `PageDown`, `PageUp`, `Home` (default taken). Alternative keys are a one-line change in `KEY_MAP`.
2. Entering a scene restarts its story at step 1 (default taken) versus remembering the last step.
3. The story does not cross scenes automatically; only the "Next scene" button on the last step does (default taken).
4. Caption panel at the bottom (default taken) versus on the side.

## 10. Acceptance checklist

- [ ] Tests committed failing first, then green. `python scripts/precheck.py` passes.
- [ ] No new dependency; no color literal outside `tokens.ts` and `tokens.css`; no `as unknown as`.
- [ ] Only `PageDown`, `PageUp` and `Home` added to `KeyAction` and `KEY_MAP`; all previous entries unchanged (tested).
- [ ] State changes happen atomically in the reducer; no step navigation leaves a half-applied focus.
- [ ] `npm run dev` shows the caption panel in every scene with placeholder steps; clicker keys, dots, Previous, Next and "Return to step" work; a play step pauses at its end year.
- [ ] The release gate fails today because of the placeholder steps and the PR shows its output.
- [ ] `LASTCONTEXT.md` overwritten; `PENDING.md` updated (add "write the real story steps with sources" as a human task before release, "let steps control scene-local settings" and "campaign day in StepFocus" as later tasks).
- [ ] PR description: what changed, what was verified, what the human must verify (look and feel of the caption panel against `docs/design.md`, the four decisions of section 9, that the clicker keys work with the presenter hardware, the wording of the placeholder tag).
