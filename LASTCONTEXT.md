# Last Context

## State
- **Branch**: `task/clean-ui-investigation-labels`
- **Task**: Remove all "por investigar", "en investigación", and verification status labels from the UI, and enforce agent rule in AGENTS.md and GEMINI.md.
- **Key changes**:
  - Added strict rule to `AGENTS.md` and `GEMINI.md`: "Never state in the UI that something is pending investigation, to be researched, or that it is test/mock data. That belongs in documentation files, never in the site's UI."
  - Removed "Hipótesis por investigar" from Slide 8 adverse scenario (`ForecastUncertaintyStep.tsx`) and polished draft footnotes and detail copy into academic, objective explanations.
  - Removed unverified/pending strings from `DevelopmentStep.tsx` ("definiciones y series en investigación", "Sin cifras verificadas", "Serie pendiente de verificación", "Pendientes", "aporte a investigar").
  - Cleaned `quality.ts` table descriptions and `slides.ts` tables for slides 16 and 17, replacing placeholder investigation labels with structured conceptual schemas and multilateral reference organizations.
  - Removed verification badge rendering from Data page Referencias tab (`DataPage.tsx`).
  - Cleaned internal verification annotations from bibliographic labels in `references.ts`.
  - Added comprehensive automated assertions in `noDataLabels.test.tsx` verifying that `DevelopmentStep`, `ForecastUncertaintyStep`, and Data tabs contain no forbidden investigation/unverified labels.
  - Verified with `web/tests/unit/noDataLabels.test.tsx`, `dataMigration.test.ts`, `eslint`, and `tsc --noEmit`.

## Next
- Intro scene enhancements:
  - On hover over "Cruce de los Andes" button, illuminate San Juan and Mendoza on the 3D intro map.
  - On hover over "Hacia 2056" button, illuminate all Argentine provinces in gold, including Islas Malvinas.
  - On hover over the 3D map provinces, display a tooltip with the province name.
