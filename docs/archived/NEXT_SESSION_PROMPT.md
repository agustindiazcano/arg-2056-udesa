Contexto: repo C:\projects\projects-github-agustindiazcano\arg-2056-udesa (GitHub agustindiazcano/arg-2056-udesa). Proyecto "Argentina 2056": app web (TypeScript estricto, React 19, Vite, Zustand, ECharts, Three.js, MapLibre) + pipeline de datos en Python. Respondé en español, con tablas para estados/planes y semáforo de prioridad (🔴 bloqueante, 🟡 siguiente, 🟢 después, ⚪ backlog). Una pregunta simple se responde en una frase.

Primero: `git checkout main && git pull`, leé LASTCONTEXT.md y PENDING.md, después `git fetch` y `gh pr list --state all --limit 8` para ver el estado real.

== Reglas del dueño (mandan sobre AGENTS.md si chocan) ==
1. NO correr scripts/precheck.py ni las suites completas en local. Local: solo los archivos de test que toco, `tsc --noEmit` y `eslint` sobre lo tocado. Después push, PR y leer el CI con `gh pr checks`. Un cambio de texto/color/docs no necesita tests (el CI ya ignora **.md y docs/**).
2. Una rama por tarea `task/<slug>`, un PR por tarea, nunca commit ni push a main, nunca mergear (los merges los hace el dueño). TDD: primero el test.
3. Si la carpeta principal tiene cambios sin commitear de otra rama, NO tocarlos: trabajar en un worktree aparte (existen ..\arg-2056-udesa-wt y ..\arg-2056-udesa-wt2, con node_modules enlazado y web\.env.local copiado: la clave VITE_MAPTILER_KEY vive ahí y está en .gitignore). Ojo: `task/rule70-scenarios` está checkeada en wt2.
4. El front NO muestra etiquetas sobre la calidad de los datos ("Datos de prueba", "Datos reales", "leída", "sin verificar"...). Lo que no está terminado o no tiene datos reales va SOLO en LASTCONTEXT.md, PENDING.md y docs/, nunca en el README (lo leen jueces). noDataLabels.test.tsx lo vigila.
5. Prohibido en el código: role="alert" / aria-live assertive (usar role="status"), colores literales fuera de tokens.css (usar var(--...)).
6. Todo PBI es real, a dólares constantes de 2015, una sola fuente; sin PPA. Los años sin dato quedan vacíos (null), nunca se interpolan.
7. Al mergear conflictos en LASTCONTEXT.md: conservar ambas notas (sacar solo los marcadores), no reescribirlo entero.

== Estado al cerrar la sesión anterior (verificar con gh) ==
Mergeados en main: #93 a #100 y #102 (footer sin los botones Fuentes/Metodología + LICENSE MIT "Agustin Diaz Cano", package.json en MIT).
Abierto, a la espera del dueño: #103 (R5: escenarios + proyecciones del FMI, rama task/rule70-scenarios). Se abrió porque #101 se mergeó contra task/rule70-diagnostics y no contra main. Se resolvió un conflicto en LASTCONTEXT.md; tras el push el CI corrió de nuevo: leer `gh pr checks 103` antes de decir que está verde.
Lección: antes de dar por mergeado un PR apilado, comprobar que su base sea main (`gh pr view N --json baseRefName`).

Estructura: "Hacia el 2056" abre en una diapositiva índice (id 20, número 0) y tiene 13 más. Los ids internos no son los números mostrados: la fuente única es TOUR_ORDER/stepNumber en web/src/tour/chartSteps.ts. La diapositiva de la regla del 70 (id 5) tiene 4 pestañas: Calculadora, Países reales, Escenarios, Proyecciones del FMI.

== Lo que sigue (por prioridad) ==
🟡 R6 de la regla del 70: exportar a CSV cada tabla/serie mostrada, con columnas de procedencia (fuente, indicador, url, retrieved_at). Las tablas ya están en la página Data (slide id '5'). Partir de main una vez mergeado #103 (si no, apilar sobre task/rule70-scenarios y avisar).
🟡 Diapositiva E "Recursos": pestañas Minería / Hidrocarburos / Agro (toneladas, no USD) / Stock, "hoy vs potencial" + serie temporal. Ver docs/consolidation-plan.md.
🟢 Resto del plan de consolidación: F productividad (botones TFP/producto por hora y selector de país), C estructura productiva (mapa con botones de sector), B bootstrap, A "Dónde estuvo y dónde está Argentina".
🟢 Limpieza: CSS sin uso `.site-links` / `.site-btn` en web/src/styles/ui.css (el footer ya no los usa).
🟢 Modelo de proyección a 2056: hoy solo existe model/src/argmodel/population (73 líneas). 14 tareas en PENDING.md; faltan parámetros y datos (docs/model-data-status.md, docs/data-requests.md sección 6).
⚪ Decidir con el dueño si se borra references.html (aloja Visitas y las fuentes de los Andes).
Le toca al dueño: bajar la serie de PTF del INDEC, y series con fuente para lo provisorio (provincias, curva de IA, agro en USD, stock de recursos, proyección de hidrocarburos y PBI desde 2027).

== Trampas conocidas (Windows + Git Bash) ==
- Los heredocs largos de Python con comillas o con "\\" se rompen. Para scripts de edición usar la herramienta Write sobre el scratchpad y ejecutarlo.
- Los archivos tienen CRLF: al editar con Python leer con newline='' y conservar el fin de línea.
- `sleep` largo en primer plano está bloqueado: usar Monitor con until-loop o run_in_background. Las suites por archivo van con `timeout`.
- Para ver la app: `cd web && npm run dev -- --port 5181 --strictPort --force` (si dice "Outdated Optimize Dep", abrir en incógnito o Ctrl+Shift+R). Las capturas se sacan con un script temporal de Playwright (nunca se commitea).
- Un `taskkill //F //IM python.exe` mata procesos ajenos: usar taskkill solo con el PID propio.
- `gh pr list --head <rama>` puede devolver un PR viejo de esa rama: leer los checks con el número de PR.

Al terminar cada tarea: agregar una línea a LASTCONTEXT.md, abrir el PR, leer `gh pr checks` y reportar con una tabla de estado. No decir "CI verde" sin haberlo leído.
