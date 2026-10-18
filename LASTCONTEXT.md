# LASTCONTEXT.md

## State
- **Branch**: `task/data-rigi-official` (unificación y contrastación de la cartera RIGI contra resoluciones oficiales y registro del Ministerio de Economía).
- **Hitos completados recientemente**:
  1. **Cartera RIGI auditada** (`web/src/tour/rigiProjects.ts`, `slides.ts`, tests): incorporada verificación oficial contra el Boletín Oficial (Resolución 1771/2026 para Los Toldos II Este de Tecpetrol por 6.432 M USD en Vaca Muerta) y resoluciones/registros de la Secretaría de Coordinación de Producción / Ministerio de Economía.
  2. **Proyectos formalmente clasificados**: minería (Vicuña, MARA, Rincón, Los Azules, Cauchari-Olaroz, San Jorge, Diablillos, 3Q, Gualcamayo, Sal de Oro II, Fénix, Veladero, HMW; evaluación: Pachón, Sal de Vida, Taca Taca, Arenas); hidrocarburos y energía (Argentina LNG, VMOS, Gasoducto San Matías, Los Toldos II Este, Bajo del Choique-La Invernada, Rincón de Aranda, Parques Solares RIGI).
  3. **Registro de fuentes y referencias**: añadida referencia formal `R14` en `docs/references.md` y `web/src/datasets/references.ts`; actualizados `docs/data-requests.md` (H1 completado) y `PENDING.md`. Tests unitarios en `web/tests/unit/miningByProvince.test.ts`.
  4. **Perfil Provincial oficial integrado** (PR #132): series de PBG (DNAP/INDEC), empleo SIPA, pobreza EPH, coparticipación real, seguridad SNIC y exportaciones OPEX para las 24 provincias (fuentes S1 a S5).
  5. **Mejoras visuales y navegación integradas** (PR #130, #131, #133): Slide 1 comparativa con banderas, tabla clickeable, escala logarítmica condicional; dorado champagne unificado (`--nav-gold*`), hover suave de logo e iluminación de provincias al cargar intro.

## Reglas operativas vigentes
- **RULE #1**: Tests corren exclusivamente en CI (GitHub Actions), nunca localmente.
- **Estilos**: Cero literales de color fuera de `tokens.css` (usar siempre `var(--token)` o `color-mix()`).
- **Multi-agente**: Usar `git worktree` para tareas paralelas independientes sin bloquear carpetas de build en Windows.
- **Datos**: Todo dato presentado debe incluir `source` y `retrieved_at`. Ningún mock sin documentar en `docs/mock-data.md`.

## Next
- Verificar CI en GitHub Actions para el merge en `task/data-rigi-official` (PR #134).
- Proceder con la Tarea 3: Integración de Agro Provincial (`agroByProvince.json`) en el selector provincial y gráficos de las diapositivas 2 y 7.
