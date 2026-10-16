# Last Context

## State
- **Branch**: `task/intro-hover-effects`
- **Tasks completed**:
  1. **Intro scene hover effects**:
     - Hovering "Cruce de los Andes" button highlights only San Juan and Mendoza on the 3D map.
     - Hovering "Hacia el 2056" button illuminates all 24 provinces + Islas Malvinas lifted in gold (`var(--gold)`).
     - Hovering over provinces on the 3D map displays a floating tooltip with the province name.
     - Fully tested in `web/tests/unit/intro.test.tsx`.
  2. **Slide 3 (Cuarta revolución industrial / IA) chart restyling to match Slide 5**:
     - Replaced dashed gridlines with Slide 5's clean solid lines (`splitLine: { lineStyle: { color: tokens.grid } }` on Y axis; hidden on X axis).
     - Removed fuzzy `shadowBlur` and muddy overlapping `areaStyle` color gradients.
     - Refactored `AiStep.tsx` layout and cards to use the Slide 5 `.rule70-card`, `.rule70-card-head`, `.rule70-legend`, `.rule70-key`, and `.rule70-table` system.
     - Cleaned milestones and head dots into crisp vector dots matching Slide 5 styling.
     - Set Population chart line to `tokens.blue` matching Slide 5 single-series palette.
     - Fully tested in `web/tests/unit/aiStepCharts.test.tsx` and validated with `scripts/precheck.py`.

## Next
- Start the new corrections in order C8, C7, C2, C3, C4, C5, C1, C6 (see `docs/action-plan-correcciones-nuevas.md`), one `task/<slug>` branch each.
