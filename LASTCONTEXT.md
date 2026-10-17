# LASTCONTEXT.md

## State
- **Branch**: `task/nav-deadline-badge` (PR #121, merged with `main` @ `de76d64` after PR #119 C8 and PR #122 C7).
- **Features added**:
  1. Cartel rojo en el navbar inmediatamente a la derecha de los botones de navegación: `En desarrollo hasta el deadline 31/10` con punto blanco pulsante y soporte para `prefers-reduced-motion` (`Header.tsx`, `ui.css` usando tokens de `tokens.css`, `navSlot.test.tsx`).
  2. Blindaje de opacidad inicial en `Reveal.tsx` para evitar condiciones de carrera en animaciones de GSAP en CI.
  3. Reglas en `AGENTS.md`: tests corren en CI (Rule #1) y prohibición de literales de color fuera de `tokens.css`.
  4. Agregadas en `PENDING.md` las especificaciones en inglés de:
     - Diapositiva sobre consumo global de tokens de IA, pirámide de uso de LLMs, costo de acceso relativo en PPP y trabas impositivas locales en Argentina.
     - Contextos históricos y estructurales (doctrina Jack Welch, colapso URSS, desindustrialización, shock China/OMC, precedentes hacia Super AGI, límites de recursos naturales, Mercosur/Brasil, sesgos en olas tecnológicas y políticas).
     - Comparativa nice-to-have de economías con abundantes recursos naturales y alto capital humano (Noruega, Australia, Canadá, Chile).

## Next
- Revisión y merge de PR #121 y PR #120.
