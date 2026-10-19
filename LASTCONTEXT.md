# LASTCONTEXT.md

## State
- **Branch**: `task/model-population-hardening`.
- **Hitos completados en la sesión**:
  1. **TDD estricto**:
     - Commit 1 (`test(model)`): tests exhaustivos para Python (`model/tests/test_population.py`) y TypeScript (`web/tests/parity/population.test.ts`), suite de casos inválidos (`model/parity/population_invalid.json`) y actualización de `gen_parity.py` (con guard `sys.path` que resuelve F10).
     - Commit 2 (`feat(model)`): implementación de validación de entradas y emisión de errores en `model/src/argmodel/population/cohort.py` y `web/src/model-ts/population.ts`.
  2. **Cierre de hallazgos de auditoría (F5, F8, F9)**:
     - **F5**: test de recomputación manual para `migration[0] != 0` (erradicando la mutación sobreviviente M1), lectura directa del archivo golden `population_parity.json` por parte de Python y verificación contra el generador.
     - **F8**: validación explícita de `A < 2` (rechaza `A = 0` y `A = 1` con mensaje idéntico en ambos lenguajes, acepta `A = 2`).
     - **F9**: validación completa de formas y rangos (finitos, `survival` en [0, 1], `fertility >= 0`, `n_t >= 0`) y emisión de `ValueError`/`Error` ante cohortes negativas según decisión `D-pop-1`.
  3. **Paridad exacta entre Python y TypeScript**:
     - Mensajes de error idénticos byte a byte verificados mediante `population_invalid.json`.
     - Casos analíticos calculados a mano para cada término del modelo (nacimientos, envejecimiento, intervalo abierto, migración).
     - Conservación de población según criterio C5 (`sum(n_next) = births + survivors + migration` con tolerancia relativa < 1e-9).
     - Preservación byte a byte de los vectores golden `population_parity.json` para casos válidos.
  4. **Decisiones documentadas**:
     - Decisión `D-pop-1` aplicada como "raise" ante cohortes negativas.

## Reglas operativas vigentes
- **RULE #1**: Tests corren exclusivamente en CI (GitHub Actions), nunca localmente.
- **TDD**: Commits atómicos separados en `test(...)` y `feat(...)`.

## Next
- Push a `origin task/model-population-hardening` y verificación de CI en GitHub Actions.
- Apertura del Pull Request y revisión humana.
- Iniciar la siguiente tarea en cola: `population-age-contract` (`docs/tasks/population-age-contract.md`).
