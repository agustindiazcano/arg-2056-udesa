# LASTCONTEXT.md

## State
- **Branch**: `task/data-rigi-official` (unificación y contrastación de la cartera RIGI contra resoluciones oficiales y registro del Ministerio de Economía).
- **Hitos completados en la sesión**:
  1. **Cartera RIGI auditada** (`web/src/tour/rigiProjects.ts`, `slides.ts`, tests): incorporada verificación oficial contra el Boletín Oficial (Resolución 1771/2026 para Los Toldos II Este de Tecpetrol por 6.432 M USD en Vaca Muerta) y resoluciones/registros de la Secretaría de Coordinación de Producción / Ministerio de Economía.
  2. **Proyectos formalmente clasificados**: minería (Vicuña 9.737 M USD, MARA 4.000 M USD, Rincón 2.744 M USD, Los Azules 2.672 M USD, Cauchari-Olaroz 1.241 M USD, San Jorge 891 M USD, Diablillos 764 M USD, 3Q 710 M USD, Gualcamayo 665 M USD, Sal de Oro II 547 M USD, Fénix 531 M USD, Veladero 436 M USD, HMW 292 M USD; evaluación: Pachón 9.533 M USD, Sal de Vida 818 M USD, Taca Taca 4.232 M USD, Arenas 232 M USD); hidrocarburos y energía (Argentina LNG 6.878 M USD, VMOS 2.900 M USD, Gasoducto San Matías 1.300 M USD, Los Toldos II Este 6.432 M USD, Bajo del Choique-La Invernada 12.400 M USD, Rincón de Aranda 4.521 M USD, Parques Solares RIGI 520 M USD).
  3. **Registro de fuentes y referencias**: añadida referencia formal `R14` en `docs/references.md` y `web/src/datasets/references.ts`; actualizados `docs/data-requests.md` (H1 completado) y `PENDING.md`.
  4. **Tests unitarios añadidos**: en `web/tests/unit/miningByProvince.test.ts` se validan resoluciones oficiales, estados y referencias `R14`.

## Reglas operativas vigentes
- **RULE #1**: Tests corren exclusivamente en CI (GitHub Actions), nunca localmente.
- **Estilos**: Cero literales de color fuera de `tokens.css` (usar siempre `var(--token)` o `color-mix()`).
- **Multi-agente**: Usar `git worktree` para tareas paralelas independientes sin bloquear carpetas de build en Windows.
- **Datos**: Todo dato presentado debe incluir `source` y `retrieved_at`. Ningún mock sin documentar en `docs/mock-data.md`.

## Next
- Verificar CI en GitHub Actions para `task/data-rigi-official` y abrir PR.
- Proceder con la Tarea 3: Integración de Agro Provincial en Mapas (Diapositivas 2 y 7).
