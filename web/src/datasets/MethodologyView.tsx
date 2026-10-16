import React from 'react';

/**
 * MethodologyView: Detailed documentation of the data pipeline architecture
 * and the specific methodology applied to each slide, module, and simulator.
 */
export function MethodologyView() {
  return (
    <article className="data-slide data-methodology" aria-labelledby="data-title-methodology">
      <h3 id="data-title-methodology">Metodología y pipeline de datos</h3>
      
      <p className="data-intro">
        Principios de ingesta, normalización y modelado cuantitativo aplicados en la plataforma.
        Los datos no son estáticos ni se introducen de manera aislada en la interfaz: provienen de un pipeline
        automatizado y reproducible de fuentes oficiales nacionales e internacionales, garantizando consistencia,
        trazabilidad y rigor matemático.
      </p>

      <div className="data-cards">
        <section className="data-table-block" aria-labelledby="meth-general-heading">
          <div className="data-table-head">
            <strong id="meth-general-heading">1. Pipeline de datos y arquitectura</strong>
          </div>
          <div className="data-meth-body">
            <h4>Pipelines automatizados vía API</h4>
            <p>
              Para las series macroeconómicas, energéticas y agropecuarias (Banco Mundial, FMI, Secretaría de Energía y Secretaría de Agricultura),
              se implementaron scripts en Python que consultan de manera periódica sus APIs oficiales (REST, SDMX y CKAN).
              Estos procesos realizan la limpieza, la conversión a unidades homogéneas (como dólares constantes de 2015 o toneladas físicas)
              y exportan conjuntos estructurados en formato JSON versionados en el repositorio.
            </p>

            <h4>Extracción y normalización de documentos oficiales</h4>
            <p>
              En el caso de publicaciones e informes técnicos periódicos sin API pública (cuentas nacionales, informes de complejos exportadores y reportes de productividad del INDEC, y balances de la Secretaría de Minería o USGS),
              los datos se extrajeron directamente de los documentos y cuadros estadísticos primarios.
              Su consistencia contable, sumas de componentes y variaciones interanuales se verifican mediante pruebas automáticas en la integración continua.
            </p>

            <h4>Arquitectura desacoplada y tipado estricto</h4>
            <p>
              El frontend consume exclusivamente estos conjuntos estructurados (JSON y módulos tipados en TypeScript).
              Cada serie y tabla incluye metadatos de trazabilidad: organismo emisor, identificador o URL de la publicación, fecha de relevamiento, período analizado y unidad de medida.
            </p>
          </div>
        </section>

        <section className="data-table-block" aria-labelledby="meth-world-heading">
          <div className="data-table-head">
            <strong id="meth-world-heading">2. Diapositiva 0: PBI desde 1960 y ranking regional</strong>
          </div>
          <div className="data-meth-body">
            <p>
              <strong>Moneda constante y comparabilidad:</strong> Se utiliza la serie de PBI en dólares constantes de 2015 del Banco Mundial (indicador <code>NY.GDP.MKTP.KD</code>)
              para aislar el efecto de la inflación y las fluctuaciones cambiarias nominales extremas de la historia argentina.
            </p>
            <p>
              <strong>Empalme 2026:</strong> Dado que el último año de serie cerrada observada del Banco Mundial es 2025, el valor de 2026 se obtiene aplicando la tasa de crecimiento real proyectada por el FMI en el World Economic Outlook (2,06%).
            </p>
            <p>
              <strong>Población oficial:</strong> La población nacional y el cálculo del PBI por habitante adoptan las proyecciones oficiales del INDEC elaboradas sobre la base del Censo Nacional 2022.
            </p>
          </div>
        </section>

        <section className="data-table-block" aria-labelledby="meth-resources-heading">
          <div className="data-table-head">
            <strong id="meth-resources-heading">3. Diapositiva 8: Recursos naturales</strong>
          </div>
          <div className="data-meth-body">
            <p>
              <strong>Tratamiento físico vs. monetario:</strong> La producción de hidrocarburos y de granos se analiza primariamente en unidades físicas volumétricas: miles de barriles diarios de petróleo y millones de m³ diarios de gas natural (Secretaría de Energía), y toneladas de producción por campaña agrícola (MAGyP).
            </p>
            <p>
              <strong>Minería y proyectos:</strong> Las exportaciones mineras se expresan en valores FOB oficiales de la Secretaría de Minería (informes mensuales y ARMINERA). La cartera de proyectos de litio y cobre clasifica capacidades nominales y gastos de capital proyectados según informes técnicos de las operadoras.
            </p>
            <p>
              <strong>Reservas:</strong> Se adopta la clasificación estándar de la Secretaría de Energía: reservas comprobadas (desagregadas en convencional y no convencional / Vaca Muerta), probables y posibles al cierre del último período auditado.
            </p>
          </div>
        </section>

        <section className="data-table-block" aria-labelledby="meth-rule70-heading">
          <div className="data-table-head">
            <strong id="meth-rule70-heading">4. Diapositiva 5: La regla del 70</strong>
          </div>
          <div className="data-meth-body">
            <p>
              <strong>Deducción matemática:</strong> Se expone la aproximación clásica del tiempo de duplicación: <code>t ≈ 70 / g</code> (donde <code>g</code> es la tasa porcentual anual de crecimiento), derivada de la solución exacta <code>t = ln(2) / ln(1 + g/100)</code>.
            </p>
            <p>
              <strong>Regresión log-lineal:</strong> Para calcular la tasa de crecimiento tendencial de cada período, el motor estadístico implementado en TypeScript (<code>doubling.ts</code>) ajusta una regresión por mínimos cuadrados de <code>ln(PBI)</code> frente al tiempo, calculando el coeficiente de determinación R² y el análisis de residuos.
            </p>
            <p>
              <strong>Ventanas móviles:</strong> Se evalúan tasas compuestas móviles sobre series históricas de Argentina y países comparables para contrastar la volatilidad temporal del crecimiento frente a trayectorias estables.
            </p>
          </div>
        </section>

        <section className="data-table-block" aria-labelledby="meth-comp-heading">
          <div className="data-table-head">
            <strong id="meth-comp-heading">5. Diapositiva 12: Composición del PBI y exportaciones</strong>
          </div>
          <div className="data-meth-body">
            <p>
              <strong>Valor Agregado Bruto:</strong> Desagregación de la producción nacional en 16 sectores económicos con base en el informe preliminar de Cuentas Nacionales del INDEC a precios constantes de 2004.
            </p>
            <p>
              <strong>Complejos exportadores:</strong> Agrupamiento oficial de comercio exterior de bienes del INDEC, evaluando valores anuales en millones de dólares y variaciones porcentuales interanuales.
            </p>
            <p>
              <strong>Servicios y SBC:</strong> Incorporación de la balanza de pagos (Cancillería / CEI con base en INDEC) para registrar las exportaciones de servicios totales y de servicios basados en el conocimiento (software, consultoría, I+D).
            </p>
          </div>
        </section>

        <section className="data-table-block" aria-labelledby="meth-prod-heading">
          <div className="data-table-head">
            <strong id="meth-prod-heading">6. Diapositiva 14: Productividad</strong>
          </div>
          <div className="data-meth-body">
            <p>
              <strong>Contabilidad del crecimiento:</strong> Marco metodológico de descomposición del crecimiento (Solow) entre acumulación de factores (capital y trabajo) y Productividad Total de los Factores (PTF).
            </p>
            <p>
              <strong>Series de largo plazo:</strong> Uso de la Penn World Table versión 11.0 obtenida a través de la Reserva Federal de San Luis (FRED) para el período 1955-2023, comparando Argentina con Chile, Brasil y Estados Unidos en PTF y producto por hora trabajada.
            </p>
            <p>
              <strong>Medición oficial reciente:</strong> Incorporación de la serie oficial de productividad del INDEC (Documento de Trabajo N.º 52, 2016-2025) que detalla la variación del stock de capital y horas trabajadas.
            </p>
          </div>
        </section>

        <section className="data-table-block" aria-labelledby="meth-ai-heading">
          <div className="data-table-head">
            <strong id="meth-ai-heading">7. Diapositiva 3: Impacto de la inteligencia artificial</strong>
          </div>
          <div className="data-meth-body">
            <p>
              <strong>Evidencia empírica internacional:</strong> Los rangos de impacto se fundamentan en literatura económica académica (Acemoglu 2024 / NBER Working Paper 32487) e investigaciones sobre productividad laboral de modelos de lenguaje (Anthropic / Korinek 2026).
            </p>
            <p>
              <strong>Desacople tasa vs. nivel:</strong> La metodología distingue entre el incremento transitorio en la tasa de crecimiento anual de la PTF y el salto acumulado en el nivel de producto potencial una vez completada la ventana de adopción tecnológica.
            </p>
          </div>
        </section>

        <section className="data-table-block" aria-labelledby="meth-sim-heading">
          <div className="data-table-head">
            <strong id="meth-sim-heading">8. Simulador del PBI y Proyecciones a 2056</strong>
          </div>
          <div className="data-meth-body">
            <p>
              <strong>Simulación recursiva anual:</strong> El simulador proyecta año a año el PBI real a partir de la base unificada de 2026 ($621,8 mil millones de dólares constantes de 2015), aplicando elasticidades paramétricas de formación bruta de capital, trayectoria demográfica, rampa de difusión de IA a 15 años y crecimiento base de productividad.
            </p>
            <p>
              <strong>Abanico de incertidumbre y proyecciones multilaterales:</strong> Para la visión a tres décadas, la dispersión se proyecta mediante conos de percentiles, contrastados en la sección de datos con los escenarios oficiales de largo plazo de la OCDE (Economic Outlook 117) y las variantes poblacionales de la ONU (World Population Prospects 2024).
            </p>
          </div>
        </section>
      </div>
    </article>
  );
}
