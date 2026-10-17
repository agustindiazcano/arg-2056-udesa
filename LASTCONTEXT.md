# LASTCONTEXT.md

## State
- **Branch**: `task/map-zoom-limits` (PR #119, rebased on `main` @ `c4f69b5`).
- **Features added**:
  1. `ZOOM_MAX` elevado de 8 a 32 en `web/src/charts/navState.ts`, aplicando a mapas nacional y departamental (`scaleLimit` en `provinceMap.ts`).
  2. Cartel rojo en el navbar a la derecha de los botones: `En desarrollo hasta el deadline 31/10` con punto indicador blanco pulsante y soporte para `prefers-reduced-motion` (`Header.tsx`, `ui.css`, `navSlot.test.tsx`).
  3. Agregadas en `PENDING.md` las secciones en inglés de:
     - Contextos históricos, desindustrialización y límites del pronóstico (Jack Welch/GE, shock China/OMC, colapso URSS, histéresis industrial a servicios frente a Super AGI, Mercosur/Brasil, límites de recursos naturales, sesgos en olas tecnológicas y políticas, e IA 2021 vs. hoy).
     - Comparativa nice-to-have de economías con abundantes recursos naturales y alto capital humano (Noruega, Australia, Canadá, Chile: ratio reservas/exportaciones, fondos soberanos y valor agregado per cápita).

## Next
- Revisión y merge de PR #119.
- Avanzar con C7 `map-drill-transition` (transición suave entre país, provincia y departamento).
