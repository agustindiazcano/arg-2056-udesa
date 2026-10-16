# LASTCONTEXT.md

## State
- **Branch**: `task/map-zoom-limits` (rebased on `main` @ `c4f69b5`).
- **Task**: C8 of `docs/action-plan-correcciones-nuevas.md` (plan from `test/correcciones-nuevas.png`): liberar el zoom del mapa 2D.
- **Key changes**:
  - `ZOOM_MAX` elevado de 8 a 32 en `web/src/charts/navState.ts`, aplicando a mapas nacional y departamental (`scaleLimit` en `provinceMap.ts`).
  - Tests actualizados y en verde: `navState.test.ts`, `forecastMap.test.tsx`, `provinceMapBuilder.test.ts`.
  - Acciones `+` / `-` y reset de mapa verificados en tests unitarios.

## Next
- Ejecutar `python scripts/precheck.py` y verificar tests de la suite completa.
- Abrir PR para C8 `map-zoom-limits` o continuar con C7 `map-drill-transition`.
