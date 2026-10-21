# LASTCONTEXT.md

## State
- **Branch**: `task/population-age-contract`.
- **Hitos completados en la sesión**:
  1. **Contratos y JSON Schemas (Draft 2020-12)**:
     - `data/schemas/population_by_age.schema.json`: cohorte por edad simple (0-100+), sexo (`both`), personas no negativas, reglas de nulos con nota.
     - `data/schemas/fertility_schedule.schema.json`: patrón de fecundidad (`shape_f` >= 0), `female_share` en [0, 1], y `tfr` anual.
     - `data/schemas/life_table.schema.json`: tabla de vida con `survival` en [0, 1] y esperanza de vida al nacer `e0`.
     - `data/schemas/migration_schedule.schema.json`: patrón de migración neta (`shape_m`) y `net_migrants` total anual.
  2. **Verificaciones de consistencia (`scripts/dataset_checks.py` & `scripts/validate_data.py`)**:
     - `check_population_by_age`: verifica 101 edades exactas (0 a 100), no negatividad de personas y consistencia con totales de `population.json` dentro del 0.5% cuando coexisten.
     - `check_fertility_schedule`: valida suma de `shape_f` igual a 1.0 (tol 1e-9), `female_share` en [0, 1] y constancia de `tfr` por año.
     - `check_life_table`: valida 101 edades, `survival` en [0, 1], constancia de `e0` y consistencia de `e0` con survivorship $l_a$, $L_a = 0.5(l_a + l_{a+1})$ e intervalo abierto $100+$ ($L_{100+} = l_{100}/(1 - S_{100})$) dentro de 0.1 años.
     - `check_migration_schedule`: valida suma de `shape_m` igual a 1.0 (tol 1e-9) y constancia de `net_migrants` por año.
     - Validaciones comunes de `source`, `retrieved_at` y notas ante valores nulos.
  3. **Generador mock determinista (`scripts/gen_mock.py`)**:
     - Generación determinista para `AR` (2000-2005) de los 4 datasets.
     - `population_by_age.json` (101 KB), `fertility_schedule.json` (40 KB), `life_table.json` (99 KB), `migration_schedule.json` (105 KB), todos dentro del presupuesto de datos (< 1.5 MB por archivo).
  4. **Tipos TypeScript, validadores y registro (`web/`)**:
     - `web/src/types/populationAge.ts`: interfaces tipadas y parsers (`parsePopulationByAge`, `parseFertilitySchedule`, `parseLifeTable`, `parseMigrationSchedule`).
     - Registro de validadores en `web/src/validation/schemaNames.ts` y compilación precompilada en `generated.js` / `generated.d.ts` vía `npm run gen:validators`.
     - Entradas opcionales (`requiredBy: []`) en `web/src/data/registry.ts`.
  5. **Documentación**:
     - `docs/data-dictionary.md`: documentación completa de los cuatro contratos y fórmula matemática explícita de consistencia actuarial para $e_0$.
  6. **Estabilización de tests y listeners (`CrossingInfo.tsx`, `andesScene.test.tsx`, `aiStepCharts.test.tsx`)**:
     - `CrossingInfo`: Se simplificó a listener estándar en `window` en fase bubble, resolviendo la carrera en el cierre del modal con `Escape`.
     - `andesScene.test.tsx`: Despacha `Escape` dentro de `waitFor(..., { timeout: 5000 })` en `document` y `document.body` para eliminar flakiness en CI bajo concurrencia.
     - `aiStepCharts.test.tsx`: Llamada a `unmount()` para cancelar el rAF pendiente del hook antes del teardown.

## Reglas operativas vigentes
- **RULE #1**: Tests corren exclusivamente en CI (GitHub Actions), nunca localmente.
- Commits atómicos: `test(...)`, `feat(...)`, `data(...)`, `docs(...)`, `fix(...)`.
- Sin dependencias nuevas, sin silenciamiento de checkers.

## Next
- PR para `population-age-contract` verificado en CI de GitHub Actions.
- Iniciar `model-population-drivers` (`docs/tasks/model-population-drivers.md`), que queda desbloqueado por este contrato.
