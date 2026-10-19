# LASTCONTEXT.md

## State
- **Branch**: `task/model-params` (Transcribe 35 forecasting parameters, Draft 2020-12 schema, frozen Param dataclass, loader, and tests).
- **Hitos completados en la sesión**:
  1. **Especificación y transcripción de parámetros (`model/params/params.json`)**:
     - 35 parámetros de las tablas 2.1 a 2.6 de `docs/model-design.md`: 5 de demografía (`pop.*`), 5 de crecimiento/contabilidad (`gro.*`), 2 de IDH (`hdi.*`), 20 de recursos (`res.*`, incluyendo las 10 constantes de valor agregado $v_r$ según decisión `D-res-3`), 1 provincial (`prov.kappa`) y 2 de IA (`ai.*`).
     - Distribución por rol: 23 fijos, 1 calibrado (`pop.kappa_f`), 11 aleatorios en Monte Carlo.
     - Estados canónicos: 0 sourced, 20 assumption (con rangos y `assumption_id`), 15 needs_source (sin valor o rango inventado, `low/high/value: null`).
  2. **Esquema JSON Draft 2020-12 (`model/params/params.schema.json`)**:
     - `additionalProperties: false`, 14 campos requeridos por parámetro.
     - `oneOf` que valida exhaustivamente los 3 estados (sourced, assumption, needs_source).
     - `allOf` que exige `distribution: "fixed"` en roles fijos/calibrados, distribuciones no fijas en roles aleatorios, y rangos obligatorios para parámetros aleatorios con `needs_source: false`.
  3. **Módulo de carga y validación (`model/src/argmodel/params/`)**:
     - `Param` (dataclass inmutable congelado con propiedad de estado), `ParamsError`, `load_params()` (retorna `MappingProxyType` inmutable), `get()`, `by_component()` y `summary()`.
     - Validaciones de consistencia cruzada: `low <= high`, `low <= value <= high`, unicidad de nombres.
  4. **Documentación y decisiones**:
     - `docs/params.md` creado detallando estructura, estados, tabla de recuentos, API y guía para fuentes.
     - Decisión `D-params-1` registrada en `docs/decisions.md` (permitir cotas `low`/`high` en parámetros fijos para el análisis de sensibilidad).
  5. **Tests (`model/tests/test_params.py`)**:
     - Validación de esquema en casos positivos y rechazo en cada caso negativo.
     - Verificación exacta de los 35 IDs, rangos de diseño, ausencia de fuentes inventadas y existencia de todos los `assumption_id` en `docs/assumptions.md`.

## Reglas operativas vigentes
- **RULE #1**: Tests corren exclusivamente en CI (GitHub Actions), nunca localmente.
- **Datos**: Ningún número ni fuente inventada; trazabilidad total a través de `docs/model-design.md` y `docs/assumptions.md`.

## Next
- Hacer commit atómico, pushear rama `task/model-params`, verificar estado de CI en GitHub Actions y abrir PR.
