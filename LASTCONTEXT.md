# LASTCONTEXT.md

## State
- **Branch**: `task/map-zoom-limits` (rebased on `main` @ `c4f69b5`).
- **Task**: C8 of `docs/action-plan-correcciones-nuevas.md`: liberar el zoom del mapa 2D.
- **Key changes**:
  - `ZOOM_MAX` elevado de 8 a 32 en `web/src/charts/navState.ts`, aplicando a mapas nacional y departamental (`scaleLimit` en `provinceMap.ts`).
  - Tests actualizados y en verde: `navState.test.ts`, `forecastMap.test.tsx`, `provinceMapBuilder.test.ts`.
  - Agregadas en `PENDING.md` las secciones en inglés de:
    1. Contextos históricos, desindustrialización y límites del pronóstico (Jack Welch/GE, shock China/OMC, colapso URSS, histéresis industrial a servicios frente a Super AGI, Mercosur/Brasil, límites de recursos naturales, sesgos de analistas/expertos en olas tecnológicas y políticas, e IA 2021 vs. hoy).
    2. Comparativa nice-to-have de economías con abundantes recursos naturales y alto capital humano (Noruega, Australia, Canadá, Chile: ratio reservas/exportaciones, fondos soberanos y valor agregado per cápita).

## Next
- Finalizar ejecución de `python scripts/precheck.py`.
- Abrir PR de `task/map-zoom-limits` y continuar con C7 `map-drill-transition`.
