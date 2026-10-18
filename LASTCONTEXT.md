# LASTCONTEXT.md

## State
- **Branch**: `task/data-province-profile` (sustitución de datos ilustrativos por series socioeconómicas oficiales de las 24 provincias).
- **Hitos completados en la sesión**:
  1. **Perfil Socioeconómico Provincial auditado** (`web/src/tour/provinceProfileData.ts`, `ProvinceProfileStep.tsx`, tests): incorporadas series oficiales recientes para las 24 jurisdicciones: PBG provincial / VAB geográfico (DNAP/INDEC), Empleo registrado formal privado y público (OEDE/SIPA), Pobreza e indigencia por aglomerado urbano (EPH INDEC), Coparticipación federal efectiva secundaria (Min. Economía/DNAP), Estadísticas criminales / tasas de seguridad (SNIC/Min. Seguridad), Exportaciones OPEX (INDEC) y Población Censo 2022 (INDEC).
  2. **Trazabilidad y referencias formales**: registradas fuentes S1 a S5 en `docs/references.md` y `web/src/datasets/references.ts`; enlazado dinámico con `RefList` en el encabezado de la ficha provincial; actualizado `docs/mock-data.md` (removiendo `provinceProfileData.ts` de mock data), `PENDING.md` (C6 verificado) y `docs/data-requests.md` (D28 completado).
  3. **Tests unitarios alineados**: actualizado `web/tests/unit/provinceProfile.test.ts` para verificar la serie oficial y los metadatos de fuentes (`source`, `refId`, `retrievedAt`, `sourceUrl`).

- **Nav, dorado e intro** (rama `task/intro-load-lights`): el menú «Hacia el 2056» ya está en `main` (#127); esta rama agrega el dorado champagne único (`--nav-gold*`), el hover animado del logo y la carga del intro con todas las provincias iluminadas al final.

## Reglas operativas vigentes
- **RULE #1**: Tests corren exclusivamente en CI (GitHub Actions), nunca localmente.
- **Estilos**: Cero literales de color fuera de `tokens.css` (usar siempre `var(--token)` o `color-mix()`).
- **Multi-agente**: Usar `git worktree` para tareas paralelas independientes sin bloquear carpetas de build en Windows.
- **Datos**: Todo dato presentado debe incluir `source` y `retrieved_at`. Ningún mock sin documentar en `docs/mock-data.md`.

## Next
- Verificar CI en GitHub Actions para `task/data-province-profile` y abrir PR.
- Continuar con la Cartera RIGI e inversiones oficiales (`web/src/tour/rigiProjects.ts`).
- Conectar `agroByProvince.json` al selector provincial y gráficos de las diapositivas 2 y 7.
