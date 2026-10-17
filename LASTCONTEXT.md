# LASTCONTEXT.md

## State
- **Branch**: `task/nav-deadline-badge` (PR #121, branched from `main` @ `de32237`, post-merge of PR #119).
- **Features added**:
  1. Cartel rojo en el navbar inmediatamente a la derecha de los botones de navegación: `En desarrollo hasta el deadline 31/10` con punto blanco pulsante y soporte para `prefers-reduced-motion` (`Header.tsx`, `ui.css`, `navSlot.test.tsx`).
  2. Blindaje de opacidad inicial en `Reveal.tsx` para evitar condiciones de carrera en animaciones de GSAP en CI.
  3. Agregadas en `PENDING.md` las especificaciones en inglés de:
     - Diapositiva sobre consumo global de tokens de IA, pirámide de uso de LLMs, costo de acceso relativo en PPP y trabas impositivas locales en Argentina (la carrera global de IA frente a los obstáculos autoflagelantes que encarecen el acceso de desarrolladores, investigadores y startups locales).
     - Contextos históricos y estructurales (doctrina Jack Welch, colapso URSS, desindustrialización, shock China/OMC, precedentes hacia Super AGI, límites de recursos naturales, Mercosur/Brasil, sesgos en olas tecnológicas y políticas).
     - Comparativa nice-to-have de economías con abundantes recursos naturales y alto capital humano (Noruega, Australia, Canadá, Chile).

## Next
- Revisión y merge de PR #121.
- Continuar con C7 `map-drill-transition` (transición suave entre país, provincia y departamento).
