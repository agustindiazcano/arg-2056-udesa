import React, { useState } from 'react';
import { Reveal } from '../motion/Reveal.js';
import { ChartHelp } from '../ui/ChartHelp.js';
import { RefList } from '../ui/RefLink.js';
import { FORECAST_UNCERTAINTY_TITLE } from './slideTitles.js';

const SECTIONS = ['Difusión tecnológica', 'Capacidad y costos', 'Revisión de pronósticos', 'Escenario adverso'] as const;
type Section = (typeof SECTIONS)[number];

const INNOVATIONS = ['Imprenta', 'Electricidad', 'Computación e internet', 'IA generativa y agentes'] as const;
type Innovation = (typeof INNOVATIONS)[number];

const HORIZONS = ['Corto', 'Medio', 'Largo'] as const;

const COST_METRICS = ['Tamaño y cómputo de modelos', 'Costo de inferencia', 'Hardware de cómputo', 'Hardware de robótica'] as const;

const CHANNELS = ['Productividad', 'Empleo', 'Salarios reales', 'PBI por habitante'] as const;
type Channel = (typeof CHANNELS)[number];

/** An interactive, explicitly conceptual draft. It deliberately has no forecast values or sourced claims. */
export function ForecastUncertaintyStep() {
  const [section, setSection] = useState<Section>('Difusión tecnológica');
  const [innovation, setInnovation] = useState<Innovation>('IA generativa y agentes');
  const [costMetric, setCostMetric] = useState<(typeof COST_METRICS)[number]>(COST_METRICS[0]);
  const [horizon, setHorizon] = useState(1);
  const [variable, setVariable] = useState('PBI real');
  const [channel, setChannel] = useState<Channel>('Productividad');

  const horizonLabel = HORIZONS[horizon]!;
  const detail = section === 'Difusión tecnológica'
    ? `${innovation}: comparación del momento de difusión de la innovación tecnológica frente a la productividad agregada y los rezagos de adopción.`
    : section === 'Capacidad y costos'
      ? `${costMetric}: distinción entre costos observados y trayectorias proyectadas ante economías de escala y avances en arquitectura de cómputo.`
    : section === 'Revisión de pronósticos'
      ? `${variable}: análisis comparativo entre proyecciones publicadas, revisiones periódicas y valores finales observados.`
      : `${channel}: análisis de escenarios distributivos y de absorción tecnológica, donde incrementos en productividad no se traducen necesariamente de forma uniforme en el ingreso real ni en el bienestar general.`;

  return (
    <section className="gdp-step draft-slide uncertainty-slide" aria-label={FORECAST_UNCERTAINTY_TITLE}>
      <header className="gdp-head draft-slide-head">
        <div>
          <div className="slide-title-row">
            <h2>{FORECAST_UNCERTAINTY_TITLE}</h2>
            <ChartHelp
              title={FORECAST_UNCERTAINTY_TITLE}
              lead="Una proyección orienta; no promete lo que ocurrirá"
              paragraphs={[
                'Las proyecciones económicas a largo plazo dependen de supuestos sobre adopción tecnológica, costos de cómputo, marcos regulatorios y complementariedad con el empleo.',
                'El abanico conceptual ilustra cómo la incertidumbre se amplía a medida que se extiende el horizonte temporal y por qué los escenarios deben leerse como rangos condicionales.'
              ]}
              how="Cambiá el horizonte temporal (Corto, Medio, Largo) y alterná entre las pestañas para explorar los canales de difusión tecnológica, costos y escenarios distributivos."
              refs={['A1', 'A5', 'F1']}
            />
          </div>
          <p className="gdp-sub">
            <RefList ids={['A1', 'A5', 'F1']} />
          </p>
        </div>
        <span className="draft-status">Esquema conceptual</span>
      </header>

      <div className="draft-tabs" role="group" aria-label="Partes de la diapositiva">
        {SECTIONS.map((item) => (
          <button key={item} type="button" aria-pressed={section === item} onClick={() => setSection(item)}>
            {item}
          </button>
        ))}
      </div>

      <div className="draft-slide-layout uncertainty-layout">
        <Reveal k="uncertainty" className="gdp-chart draft-card uncertainty-main" aria-live="polite">
          <div className="draft-section-head">
            <div>
              <span className="draft-kicker">{section}</span>
              <h3>{section === 'Escenario adverso' ? 'Productividad sin prosperidad compartida' : 'El horizonte amplía lo que no sabemos'}</h3>
            </div>
          </div>

          <div className="draft-horizon">
            <label htmlFor="uncertainty-horizon">Horizonte de lectura: <strong>{horizonLabel}</strong></label>
            <input id="uncertainty-horizon" type="range" min="0" max={HORIZONS.length - 1} step="1" value={horizon} onChange={(event) => setHorizon(Number(event.target.value))} aria-valuetext={horizonLabel} />
            <div className="draft-horizon-labels" aria-hidden="true"><span>Corto</span><span>Medio</span><span>Largo</span></div>
          </div>

          <figure className="draft-fan-figure">
            <svg className="draft-fan" viewBox="0 0 640 220" role="img" aria-label="Diagrama conceptual de rangos posibles; sin escala ni datos">
              <path className="draft-fan-grid" d="M46 24v160h566M46 144h566M46 104h566M46 64h566" />
              <g transform={`translate(0 108) scale(1 ${[0.42, 0.72, 1][horizon]}) translate(0 -108)`}>
                <path className="draft-fan-area" d="M48 108 C190 104 270 92 360 67 C450 45 520 20 610 10 L610 206 C520 198 450 172 360 149 C270 129 190 116 48 108Z" />
              </g>
              <path className="draft-fan-center" d="M48 108 C190 108 270 108 360 108 C450 108 520 108 610 108" />
              <text x="50" y="211">Hoy</text><text x="556" y="211">Más adelante</text>
            </svg>
            <figcaption>Representación conceptual del rango de resultados posibles. No contiene una serie ni valores de proyección.</figcaption>
          </figure>

          {section === 'Difusión tecnológica' && (
            <div className="draft-choice-row" role="group" aria-label="Innovación para explorar">
              {INNOVATIONS.map((item) => <button key={item} type="button" className="btn" aria-pressed={innovation === item} onClick={() => setInnovation(item)}>{item}</button>)}
            </div>
          )}
          {section === 'Capacidad y costos' && (
            <div className="draft-choice-row" role="group" aria-label="Métrica de capacidad o costos">
              {COST_METRICS.map((item) => <button key={item} type="button" className="btn" aria-pressed={costMetric === item} onClick={() => setCostMetric(item)}>{item}</button>)}
            </div>
          )}
          {section === 'Revisión de pronósticos' && (
            <div className="draft-choice-row" role="group" aria-label="Variable para revisar">
              {['PBI real', 'Inflación', 'Inversión'].map((item) => <button key={item} type="button" className="btn" aria-pressed={variable === item} onClick={() => setVariable(item)}>{item}</button>)}
            </div>
          )}
          {section === 'Escenario adverso' && (
            <div className="draft-choice-row" role="group" aria-label="Canal del escenario adverso">
              {CHANNELS.map((item) => <button key={item} type="button" className="btn" aria-pressed={channel === item} onClick={() => setChannel(item)}>{item}</button>)}
            </div>
          )}
          <p className="draft-detail-copy">{detail}</p>
        </Reveal>

        <Reveal k="uncertainty-copy" delay={0.08} className="gdp-chart draft-card uncertainty-copy">
          <span className="draft-kicker">Relato analítico</span>
          <blockquote>
            Una proyección a largo plazo depende de supuestos. La adopción empresarial, la capacitación y la integración de agentes llevan tiempo; nuevas tecnologías, políticas o formas de organizar el trabajo pueden cambiar el resultado.
          </blockquote>
          <p>La IA puede aumentar la productividad; cuánto tarda en difundirse y quién recibe sus beneficios son preguntas distintas.</p>
          <div className="draft-adverse-note">
            <strong>Hipótesis adversa</strong>
            <p>Si la adaptación y la capacitación quedan rezagadas, se desplazan empleos y los beneficios se concentran, una mayor productividad podría no traducirse en más empleo, mejores salarios reales ni mayor PBI por habitante.</p>
          </div>
          <p className="draft-footnote">El hito de referencia ilustra la ventana de adopción entre los primeros despliegues de modelos en círculos académicos y su posterior difusión masiva.</p>
          <p className="draft-footnote">La trayectoria futura de costos del hardware y la precisión proyectada dependen de la evolución en la eficiencia de semiconductores y algoritmos.</p>
        </Reveal>
      </div>
    </section>
  );
}
