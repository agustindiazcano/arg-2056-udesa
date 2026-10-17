import React from 'react';

/**
 * AiUsageView: Documentation of the multi-agent engineering methodology,
 * human-in-the-loop governance, Git workflow, and automated testing stack
 * used to build and validate the platform while optimizing token consumption.
 */
export function AiUsageView() {
  return (
    <article className="data-slide data-methodology" aria-labelledby="data-title-ai-usage">
      <h3 id="data-title-ai-usage">Uso de AI y flujo de ingeniería</h3>

      <p className="data-intro">
        Para el desarrollo del proyecto se combinó un framework propio de ingeniería de contexto con las últimas
        buenas prácticas que hoy son estándar en la industria del software, orquestando múltiples agentes en
        simultáneo bajo supervisión humana continua, flujo Git estructurado y validación determinística automatizada.
      </p>

      <div className="data-cards">
        <section className="data-table-block" aria-labelledby="ai-orchestration-heading">
          <div className="data-table-head">
            <strong id="ai-orchestration-heading">1. Orquestación multi-agente y prevención de alucinaciones</strong>
          </div>
          <div className="data-meth-body">
            <h4>Framework propio y ejecución en paralelo</h4>
            <p>
              Se implementó una metodología de trabajo con múltiples agentes operando en simultáneo sobre contextos
              acotados y árboles de trabajo aislados (<em>git worktrees</em>) para la gestión de estado del proyecto
              (mediante archivos de protocolo como <code>AGENTS.md</code>, <code>LASTCONTEXT.md</code> y{' '}
              <code>PENDING.md</code>), orquestación de subtareas, búsqueda web, <em>web scraping</em>, generación de
              scripts de ingesta, limpieza y normalización de series estadísticas.
            </p>

            <h4>Consumo directo sin datos hardcodeados</h4>
            <p>
              Para evitar alucinaciones numéricas, ningún indicador se introduce de forma <em>hardcodeada</em> en los
              componentes visuales: una vez extraídos, limpiados y auditados contra esquemas formales (JSON Schema),
              los conjuntos de datos procesados se consumen directamente desde el frontend tipado, preservando en cada
              registro su organismo emisor, enlace de origen y fecha de relevamiento.
            </p>

            <h4>Dirección y validación humana (Human-in-the-Loop)</h4>
            <p>
              El humano planifica, diseña la arquitectura, organiza las prioridades, revisa, valida y confirma en cada
              etapa del ciclo. Esta intervención constante no solo reduce errores y asegura el rigor metodológico de
              las proyecciones, sino que evita que los agentes entren en bucles autónomos innecesarios que consumen
              tiempo y tokens sin aportar valor.
            </p>
          </div>
        </section>

        <section className="data-table-block" aria-labelledby="ai-workflow-heading">
          <div className="data-table-head">
            <strong id="ai-workflow-heading">
              2. Flujo Gitflow, Branches, Worktrees, TDD y optimización del consumo de tokens
            </strong>
          </div>
          <div className="data-meth-body">
            <h4>Ramas por tarea, commits atómicos y aprobación humana</h4>
            <p>
              El repositorio sigue un flujo de ramas aisladas por funcionalidad o corrección (<code>task/&lt;slug&gt;</code>),
              con <em>commits</em> atómicos por cada <em>fix</em> o unidad lógica bajo formato convencional
              (<code>feat</code>, <code>fix</code>, <code>test</code>, <code>data</code>, <code>refactor</code>) e
              integración exclusivamente mediante <em>Pull Requests</em> sujetas a revisión y aprobación humana antes
              de fusionarse a <code>main</code>.
            </p>

            <h4>Uso de Branches y Worktrees en Git para evitar conflictos entre agentes</h4>
            <p>
              En Git, <code>branch</code> y <code>worktree</code> resuelven dos problemas completamente distintos pero
              complementarios para coordinar el trabajo en paralelo:
            </p>
            <ul>
              <li>
                <strong>¿Qué es una Branch (Rama)?</strong> Es un puntero móvil a un <em>commit</em> dentro de la base
                de datos de Git (<code>.git/</code>) que representa una línea de desarrollo lógica o historial
                independiente (ej. <code>main</code>, <code>task/map-search</code>). Ocupa casi cero espacio en disco
                (solo un archivo de texto con el hash del <em>commit</em>), pero en un directorio tradicional de Git
                solo puede haber una única <em>branch</em> activa en el disco a la vez: al ejecutar{' '}
                <code>git checkout</code> o <code>git switch</code>, Git modifica los archivos físicos de esa carpeta
                para reflejar la nueva rama.
              </li>
              <li>
                <strong>¿Qué es un Worktree (Árbol de Trabajo)?</strong> Es una carpeta física separada en el disco
                vinculada al mismo repositorio Git (<code>.git</code>). Permite tener múltiples <em>branches</em>{' '}
                abiertas al mismo tiempo en carpetas distintas sin necesidad de clonar el repositorio nuevamente: todas
                comparten el mismo historial, los mismos <em>commits</em> y los mismos remotos (<code>origin</code>), y
                cada <em>worktree</em> mantiene su propia rama activa independiente.
              </li>
            </ul>

            <div className="data-scroll" style={{ marginTop: '0.75rem', marginBottom: '0.75rem' }}>
              <table className="data-table" aria-label="Comparativa directa entre Branch tradicional y Git Worktree">
                <thead>
                  <tr>
                    <th scope="col">Característica</th>
                    <th scope="col">Branch tradicional (git checkout / switch)</th>
                    <th scope="col">Worktree (git worktree add)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row">¿Qué es?</th>
                    <td>Un puntero lógico a un commit en el historial.</td>
                    <td>Una carpeta física en el disco conectada al mismo repositorio.</td>
                  </tr>
                  <tr>
                    <th scope="row">Simultaneidad</th>
                    <td>Solo permite ver o editar una rama a la vez en el directorio.</td>
                    <td>Permite tener múltiples ramas distintas abiertas en carpetas separadas a la vez.</td>
                  </tr>
                  <tr>
                    <th scope="row">Servidores y procesos</th>
                    <td>
                      Cambiar de rama mientras corre <code>npm run dev</code> rompe el proceso o fuerza a recompilar
                      todo.
                    </td>
                    <td>
                      Permite mantener un servidor corriendo en la carpeta A y programar en la carpeta B sin que se
                      toquen.
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">Trabajo en paralelo / Multitarea</th>
                    <td>
                      Para cambiar de tarea requiere hacer <code>git stash</code> o un commit provisional.
                    </td>
                    <td>Basta con cambiar de pestaña o terminal hacia la otra carpeta física.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p>
              <strong>¿Por qué lo usamos con múltiples agentes de IA en simultáneo?</strong> Git impide que dos árboles
              modifiquen la misma rama a la vez, y si dos agentes de IA trabajan sobre la misma carpeta física, uno
              guarda un archivo y pisa los cambios en curso del otro mientras compila, además de producir bloqueos de
              archivos en Windows (<code>EBUSY</code> o archivos <code>.lock</code>). Con un <em>worktree</em> aislado
              por tarea, cada agente opera en su propia carpeta física y en su propia rama sin colisiones.
            </p>

            <h4>TDD y testing automatizado frente al costo de Code Review con IA</h4>
            <p>
              Dado que la revisión exhaustiva de código (<em>code review</em>) ejecutada por modelos de IA conlleva un
              alto consumo de tokens al reanalizar grandes ventanas de contexto en cada iteración, se adoptó desarrollo
              guiado por pruebas (<strong>TDD</strong>: escribir primero el test que falla, implementar la solución
              mínima y refactorizar) junto con baterías de pruebas en integración continua (GitHub Actions). De este
              modo, los invariantes matemáticos, de estado y de interfaz quedan garantizados por código ejecutable,
              reduciendo drásticamente la carga de revisión manual y el gasto de tokens.
            </p>

            <h4>Validación visual en dos etapas</h4>
            <p>
              El <strong>testing visual se valida con un primer filtro con Playwright mediante agente</strong> (pruebas
              automatizadas de renderizado, capturas y humo E2E en navegador headless), mientras que el{' '}
              <strong>producto final es resultado de la iteración humana</strong> directa sobre el diseño, las
              transiciones 2D/3D y la experiencia de usuario.
            </p>
          </div>
        </section>

        <section className="data-table-block" aria-labelledby="ai-tools-heading">
          <div className="data-table-head">
            <strong id="ai-tools-heading">3. Herramientas y plataformas de IA utilizadas</strong>
          </div>
          <div className="data-meth-body">
            <ul>
              <li>
                <strong>Claude y Claude Code (Anthropic):</strong> diseño de arquitectura, desarrollo bajo TDD,
                refactorización de módulos en TypeScript/Python y ejecución agéntica en terminal.
              </li>
              <li>
                <strong>Google AI Studio, Gemini y Antigravity (el nuevo Gemini CLI):</strong> orquestación multi-agente,
                iteración de componentes interactivos, generación de pruebas y mantenimiento del contexto vivo del
                repositorio.
              </li>
              <li>
                <strong>Grok (xAI):</strong> búsqueda web ágil, rastreo de fuentes públicas, informes sectoriales y
                contraste rápido de publicaciones técnicas.
              </li>
            </ul>
          </div>
        </section>

        <section className="data-table-block" aria-labelledby="ai-stack-heading">
          <div className="data-table-head">
            <strong id="ai-stack-heading">4. Librerías y baterías de testing para reducir la revisión de código</strong>
          </div>
          <div className="data-meth-body">
            <h4>Testing unitario, de componentes, paridad y mutación</h4>
            <ul>
              <li>
                <strong>Vitest + React Testing Library + jsdom:</strong> suite de pruebas unitarias y de integración en
                frontend para máquinas de estado (Zustand), selectores de datos, regresiones matemáticas (Regla del 70,
                simulador), componentes interactivos y paridad numérica contra vectores dorados (<em>golden vectors</em>).
              </li>
              <li>
                <strong>pytest (Python 3.12):</strong> pruebas unitarias del modelo demográfico y macroeconómico,
                invariantes contables, <em>backtesting</em> histórico con tolerancias bloqueantes y pruebas de scripts
                del pipeline de datos (verificando códigos de salida exactos y mensajes).
              </li>
              <li>
                <strong>mutmut:</strong> pruebas de mutación (<em>mutation testing</em>) sobre los diffs del modelo y
                la lógica de estado para comprobar que la batería de tests detecte cambios semánticos reales.
              </li>
            </ul>

            <h4>Testing End-to-End (E2E), visual y accesibilidad</h4>
            <ul>
              <li>
                <strong>Playwright (<code>@playwright/test</code>):</strong> ejecución E2E sobre el <em>build</em> de
                producción en Chromium con WebGL por software, verificación de cabeceras de seguridad CSP y primer
                filtro de validación visual.
              </li>
              <li>
                <strong>axe-core (<code>@axe-core/playwright</code>) + eslint-plugin-jsx-a11y:</strong> auditorías
                automáticas de accesibilidad WCAG, contraste tipográfico, roles ARIA, navegación íntegra por teclado y
                soporte de <code>prefers-reduced-motion</code>.
              </li>
            </ul>

            <h4>Tipado estricto, análisis estático, contratos de datos y presupuestos</h4>
            <ul>
              <li>
                <strong>TypeScript (<code>strict</code>, <code>tsc --noEmit</code>):</strong> verificación estática de
                tipos de extremo a extremo entre esquemas de datos, estado global y vistas 2D/3D.
              </li>
              <li>
                <strong>ESLint 10 + typescript-eslint:</strong> reglas estáticas sobre código React/TypeScript y tests
                de arquitectura (como la prohibición de colores literales fuera de <code>tokens.css</code>).
              </li>
              <li>
                <strong>Ruff:</strong> linter y analizador estático de alta velocidad con versión fijada en Python.
              </li>
              <li>
                <strong>Ajv (<code>ajv</code> + <code>ajv-formats</code>) y jsonschema:</strong> validación de esquemas
                JSON Schema (Draft 2020-12) mediante validadores standalone precompilados en el cliente y validación en
                el pipeline de Python.
              </li>
              <li>
                <strong>Gates de presupuesto y lanzamiento en CI:</strong> scripts automatizados para control de tamaño
                de bundles Gzip (<code>check-bundle.ts</code>), presupuesto de datos (<code>check_data_budget.py</code>),
                integridad de referencias (<code>build_references.py</code>) y activos de producción (
                <code>check_release_assets.py</code>).
              </li>
            </ul>
          </div>
        </section>
      </div>
    </article>
  );
}
