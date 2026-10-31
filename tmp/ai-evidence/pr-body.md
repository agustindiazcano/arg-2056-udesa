## Qué cambia

La diapositiva 9 explica el sobrecosto argentino bajo un supuesto explícito de pago, compara abonos de referencia de 20/100/200 USD y permite elegir mapa LATAM, barras o tarifas API por millón de tokens. El semáforo cubre Argentina, Chile, Uruguay y México; el resto queda gris sin imputaciones.

Al final se incorporan adopción empresarial, intensidad de consumo de tokens, una pirámide de adopción redibujada y producción de preprints/I+D. Menú, índice, Data, referencias y CSV/JSON comparten los nuevos registros. El catálogo de fuentes también figura en README. Se archivan el CSV oficial de arXiv y Natural Earth con SOURCE.md y un generador reproducible sin red. No se agregan dependencias.

La rama también incluye los ajustes solicitados en esta sesión: quitar el cartel del navbar, habilitar scroll de proyectos RIGI, cambiar el emoji de búsqueda por SVG, completar referencias del README, añadir su banner y mostrar nombres de departamentos solo al hover o selección.

## Evidencia y límites

Cada cifra tiene fecha, población, unidad y fuente. La cifra personal de 8.000 millones de tokens corresponde a los últimos 30 días declarados por el autor; no recibe un percentil ni una factura estimada. No se inventa una distribución mundial por usuario-mes. Los percentiles dibujados pertenecen a investigadores internos de OpenAI y están expresados en USD equivalentes API/día, no tokens. La pirámide de adopción usa cifras oficiales de ChatGPT y una base demográfica fechada; no cuenta todos los LLM ni todos los planes de 20 USD. Los preprints no prueban causalidad ni calidad, y el caso co-scientist no reemplaza la validación experimental.

## Verificación

GitHub Actions, ejecutado después del push y antes de abrir este PR. No se ejecutaron suites, precheck, Vitest, pytest ni Playwright localmente. Revisión interactiva en navegador a 1366×768 de las nuevas láminas y vistas de costos; corregidos scroll y desborde de pirámides.

Los tests se actualizan explícitamente por los requisitos del usuario: nuevo orden completo de diapositivas, reemplazo de draft-26 y ausencia del cartel de desarrollo. No se eliminan controles ni se bajan umbrales. También se corrige el acceso opcional de la prueba de departamentos y se declara check=False en subprocesos cuyos exit codes se comprueban.

## Verificación humana pendiente

Todas las cifras nuevas están en PENDING.md: precios/condiciones vigentes, impuestos y checkout efectivo según forma de pago, muestras/fechas de los estudios, conteos y límites del dato personal. El registro detallado está en docs/ai-evidence-2026-10-30.md. No modifica parámetros de escenarios ni modelos de proyección.
