# LASTCONTEXT.md

## State
- **Branch**: `task/data-agro-provincial` (incorporación de datos oficiales de producción agrícola provincial SAGyP y desglose oficial de exportaciones mineras de Catamarca y Salta).
- **Hitos completados en la sesión**:
  1. **Agro provincial oficial** (`web/src/tour/agroByProvince.json`): extraída la serie completa de la Secretaría de Agricultura, Ganadería y Pesca (campaña 2024/25) para soja (51,1 Mt), maíz (51,7 Mt), trigo (18,5 Mt) y girasol (5,6 Mt) en todas las provincias productoras (116,9 Mt en total), con valuación FOB de referencia (~37.320 M USD).
  2. **Minería Catamarca y Salta desagregadas** (`web/src/tour/miningByProvince.ts`, `slides.ts`, tests): verificado en los treemaps oficiales de la Secretaría de Minería (informes 2026.01 y 2026.09). Cifras oficiales 2025: Santa Cruz 2.383 M USD, San Juan 1.757 M USD, Jujuy 953 M USD, Salta 498 M USD, Catamarca 351 M USD, Resto 95 M USD (total 6.037 M USD). Enero-agosto 2026: Salta 706 M USD, Catamarca 419 M USD.
  3. **Registro de fuentes y referencias**: añadidas referencias `E12` y `E13` a `docs/references.md` y `web/src/datasets/references.ts`; actualizados `docs/data-requests.md` (D12, H9 como completados) y `PENDING.md`.

## Reglas operativas vigentes
- **RULE #1**: Tests corren exclusivamente en CI (GitHub Actions), nunca localmente.
- **Estilos**: Cero literales de color fuera de `tokens.css` (usar siempre `var(--token)` o `color-mix()`).
- **Multi-agente**: Usar `git worktree` para tareas paralelas independientes sin bloquear carpetas de build en Windows.
- **Datos**: Todo dato presentado debe incluir `source` y `retrieved_at`. Ningún mock sin documentar en `docs/mock-data.md`.

## Next
- Subir rama `task/data-agro-provincial` a GitHub y verificar CI en verde.
- Continuar con el Perfil Socioeconómico Provincial (C6) y la cartera RIGI oficial.
