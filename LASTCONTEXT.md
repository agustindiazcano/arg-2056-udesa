# Last Context

## State
- **Branch**: `task/data-page-tabs`
- **Task**: Enhance Data section with tabs for Data, Referencias, and Metodología, JSON downloads, and Andes sources.
- **Key changes**:
  - Transformed the static Data header into 3 title-style tab buttons: "Data", "Referencias", and "Metodología".
  - "Data" tab provides table exploration by slide, with CSV and new JSON downloads for both individual tables and entire slides (`downloadJson`, `tableJson`, `slideJson`).
  - "Referencias" tab lists all categorized sources, links, and verification status, including the 20 Cruce de los Andes historical references (H1-H25) from the README, with CSV and JSON downloads.
  - "Metodología" tab renders `MethodologyView` detailing the overall API and document pipeline and slide-specific methodologies (PBI base, Regla del 70, Productividad, IA, Recursos, Simulador, y Proyecciones al 2056).
  - Cleaned styling in `ui.css` using CSS tokens and `color-mix` without color literals.
  - Validated with full `python scripts/precheck.py` (all 9 steps PASS: ruff, pytest, terrain, validate-data, check-budget, references, web-lint, web-typecheck, web-test with 2034 tests).

## Next
- Human review of Data section tabs, JSON downloads, and Andes references in the browser.
- Open PR for `task/data-page-tabs`.
