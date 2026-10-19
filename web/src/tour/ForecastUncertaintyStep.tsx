import React, { useState } from 'react';
import { Reveal } from '../motion/Reveal.js';
import { ChartHelp } from '../ui/ChartHelp.js';
import { RefList } from '../ui/RefLink.js';
import { FORECAST_UNCERTAINTY_TITLE } from './slideTitles.js';
import {
  ADVERSE_CHANNELS,
  HISTORICAL_DIFFUSION_LAGS,
  INFERENCE_COST_SERIES,
  MACRO_FORECAST_REVISION_DATA,
  TRAINING_COMPUTE_SERIES
} from './techUncertaintyData.js';

const SECTIONS = ['Difusión tecnológica', 'Capacidad y costos', 'Revisión de pronósticos', 'Escenario adverso'] as const;
type Section = (typeof SECTIONS)[number];

const HORIZONS = ['Corto (2026-2030)', 'Medio (2030-2040)', 'Largo (2040-2056)'] as const;

export function ForecastUncertaintyStep() {
  const [section, setSection] = useState<Section>('Difusión tecnológica');
  const [horizon, setHorizon] = useState(1);
  const [costView, setCostView] = useState<'inference' | 'training'>('inference');
  const [selectedTech, setSelectedTech] = useState(HISTORICAL_DIFFUSION_LAGS[0]?.technology ?? '');
  const [selectedChannel, setSelectedChannel] = useState<keyof typeof ADVERSE_CHANNELS>('Productividad');

  const horizonLabel = HORIZONS[horizon]!;
  const selectedLag = HISTORICAL_DIFFUSION_LAGS.find((d) => d.technology === selectedTech) ?? HISTORICAL_DIFFUSION_LAGS[0]!;
  const channelData = ADVERSE_CHANNELS[selectedChannel] ?? ADVERSE_CHANNELS['Productividad']!;

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
                'Las proyecciones económicas hacia 2056 descansan sobre la velocidad real de absorción tecnológica y la estructura de costos de cómputo.',
                'Históricamente, las tecnologías de red tardaron de 15 a 50 años en alcanzar adopción masiva productiva. Si bien la IA en consumo creció en meses, su integración en procesos core empresariales sigue rezagada por la "Curva J" de productividad.',
                'A su vez, los costos de inferencia se redujeron más de 280 veces entre 2022 y 2025 (Stanford HAI), abriendo una ventana de accesibilidad sin precedentes.'
              ]}
              how="Explorá las 4 pestañas para revisar rezagos históricos (CHAT/NBER), curvas de cómputo e inferencia (Stanford HAI/Epoch AI), revisiones de pronósticos del FMI, y los canales del escenario adverso."
              refs={['D3', 'A1', 'A8', 'F1']}
            />
          </div>
          <p className="gdp-sub">
            <RefList ids={['D3', 'A1', 'A8', 'F1']} />
          </p>
        </div>
        <span className="draft-status">Series empíricas auditadas</span>
      </header>

      <div className="draft-tabs" role="group" aria-label="Partes de la diapositiva">
        {SECTIONS.map((item) => (
          <button key={item} type="button" aria-pressed={section === item} onClick={() => setSection(item)}>
            {item}
          </button>
        ))}
      </div>

      <div className="draft-slide-layout uncertainty-layout">
        <Reveal k={`uncertainty-${section}`} className="gdp-chart draft-card uncertainty-main" aria-live="polite">
          <div className="draft-section-head">
            <div>
              <span className="draft-kicker">{section}</span>
              <h3>
                {section === 'Difusión tecnológica' && 'Rezagos históricos de adopción masiva (Años hasta >50%)'}
                {section === 'Capacidad y costos' && (costView === 'inference' ? 'Colapso de costo de inferencia (USD por 1M de tokens)' : 'Escala exponencial de cómputo de entrenamiento (FLOPs)')}
                {section === 'Revisión de pronósticos' && 'Desvíos empíricos en pronósticos del PBI (FMI WEO vs Observado)'}
                {section === 'Escenario adverso' && 'Canales de desacoplamiento: Productividad sin prosperidad compartida'}
              </h3>
            </div>
          </div>

          <div className="draft-horizon">
            <label htmlFor="uncertainty-horizon">Horizonte de análisis: <strong>{horizonLabel}</strong></label>
            <input
              id="uncertainty-horizon"
              type="range"
              min="0"
              max={HORIZONS.length - 1}
              step="1"
              value={horizon}
              onChange={(event) => setHorizon(Number(event.target.value))}
              aria-valuetext={horizonLabel}
            />
            <div className="draft-horizon-labels" aria-hidden="true">
              <span>Corto (2026-30)</span>
              <span>Medio (2030-40)</span>
              <span>Largo (2040-56)</span>
            </div>
          </div>

          {/* SECTION 1: DIFUSIÓN TECNOLÓGICA */}
          {section === 'Difusión tecnológica' && (
            <div className="uncertainty-data-view">
              <figure className="draft-fan-figure" style={{ padding: 'var(--space-2)' }}>
                <svg className="draft-fan" viewBox="0 0 640 220" role="img" aria-label="Gráfico de barras de años de adopción tecnológica">
                  <path className="draft-fan-grid" d="M140 20v170h470 M140 60h470 M140 110h470 M140 160h470" />
                  {HISTORICAL_DIFFUSION_LAGS.map((d, i) => {
                    const y = 30 + i * 22;
                    const barWidth = Math.max(10, (d.yearsToMassAdoption / 55) * 440);
                    const isSelected = d.technology === selectedTech || (!selectedTech && i === 0);
                    const barColor = d.category === 'Inteligencia Artificial'
                      ? 'var(--accent)'
                      : d.category === 'Digital / Software'
                        ? 'var(--blue)'
                        : 'var(--ink-2)';
                    return (
                      <g key={d.technology} style={{ cursor: 'pointer' }} onClick={() => setSelectedTech(d.technology)}>
                        <text x="132" y={y + 11} textAnchor="end" style={{ fontSize: '11px', fill: isSelected ? 'var(--ink)' : 'var(--muted)', fontWeight: isSelected ? 700 : 400 }}>
                          {d.technology.length > 20 ? `${d.technology.slice(0, 18)}…` : d.technology}
                        </text>
                        <rect
                          x="140"
                          y={y}
                          width={barWidth}
                          height="14"
                          rx="3"
                          fill={barColor}
                          opacity={isSelected ? 1 : 0.65}
                          stroke={isSelected ? 'var(--ink)' : 'none'}
                          strokeWidth="1.5"
                        />
                        <text x={148 + barWidth} y={y + 11} style={{ fontSize: '11px', fill: 'var(--ink)', fontWeight: 600 }}>
                          {d.yearsToMassAdoption} años
                        </text>
                      </g>
                    );
                  })}
                  <text x="140" y="210" style={{ fontSize: '10px', fill: 'var(--muted)' }}>0 años</text>
                  <text x="360" y="210" style={{ fontSize: '10px', fill: 'var(--muted)' }}>25 años</text>
                  <text x="580" y="210" style={{ fontSize: '10px', fill: 'var(--muted)' }}>50 años</text>
                </svg>
                <figcaption style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
                  Años transcurridos desde la invención comercial hasta la difusión masiva (&gt;50% hogares/usuarios). Fuente: Comin &amp; Hobijn (CHAT/NBER) y Our World in Data.
                </figcaption>
              </figure>

              <div className="draft-choice-row" role="group" aria-label="Innovación para explorar" style={{ marginTop: 'var(--space-2)' }}>
                {HISTORICAL_DIFFUSION_LAGS.map((item) => (
                  <button
                    key={item.technology}
                    type="button"
                    className="btn"
                    aria-pressed={selectedTech === item.technology}
                    onClick={() => setSelectedTech(item.technology)}
                  >
                    {item.technology}
                  </button>
                ))}
              </div>

              <div style={{ marginTop: 'var(--space-2)', padding: 'var(--space-2)', background: 'color-mix(in srgb, var(--surface) 60%, transparent)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <strong>{selectedLag.technology} ({selectedLag.inventionYear})</strong> — {selectedLag.category}: {selectedLag.description}
                <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '0.2rem' }}>Fuente: {selectedLag.source}</div>
              </div>
            </div>
          )}

          {/* SECTION 2: CAPACIDAD Y COSTOS */}
          {section === 'Capacidad y costos' && (
            <div className="uncertainty-data-view">
              <div className="draft-choice-row" role="group" aria-label="Métrica de costos" style={{ marginBottom: 'var(--space-2)' }}>
                <button type="button" className="btn" aria-pressed={costView === 'inference'} onClick={() => setCostView('inference')}>
                  Costo de inferencia ($/1M tokens)
                </button>
                <button type="button" className="btn" aria-pressed={costView === 'training'} onClick={() => setCostView('training')}>
                  Cómputo de entrenamiento (FLOPs)
                </button>
              </div>

              {costView === 'inference' ? (
                <div>
                  <figure className="draft-fan-figure">
                    <svg className="draft-fan" viewBox="0 0 640 210" role="img" aria-label="Curva de reducción de costo de inferencia">
                      <path className="draft-fan-grid" d="M60 20v150h540 M60 170h540 M60 120h540 M60 70h540 M60 20h540" />
                      {/* Trend line */}
                      <path
                        d="M 90 35 L 180 145 L 280 152 L 390 165 L 500 168 L 570 169"
                        fill="none"
                        stroke="var(--accent)"
                        strokeWidth="2.5"
                      />
                      {INFERENCE_COST_SERIES.map((pt, idx) => {
                        const x = 90 + idx * 96;
                        // Log scale for cost between $20 and $0.04
                        const y = 35 + (Math.log10(20) - Math.log10(Math.max(0.03, pt.costPerMillionTokensUsd))) * 48;
                        return (
                          <g key={pt.period}>
                            <circle cx={x} cy={y} r="5" fill="var(--accent)" stroke="var(--surface)" strokeWidth="1.5" />
                            <text x={x} y={y - 10} textAnchor="middle" style={{ fontSize: '10px', fill: 'var(--ink)', fontWeight: 600 }}>
                              ${pt.costPerMillionTokensUsd}
                            </text>
                            <text x={x} y="190" textAnchor="middle" style={{ fontSize: '9px', fill: 'var(--muted)' }}>
                              {pt.period}
                            </text>
                          </g>
                        );
                      })}
                      <text x="50" y="38" textAnchor="end" style={{ fontSize: '9px', fill: 'var(--muted)' }}>$20</text>
                      <text x="50" y="105" textAnchor="end" style={{ fontSize: '9px', fill: 'var(--muted)' }}>$1</text>
                      <text x="50" y="170" textAnchor="end" style={{ fontSize: '9px', fill: 'var(--muted)' }}>$0.05</text>
                    </svg>
                    <figcaption style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
                      Costo por millón de tokens en benchmarks equivalentes a GPT-3.5 (MMLU ~65%). Reducción superior a 280x en 2 años. Fuente: Stanford HAI AI Index 2025.
                    </figcaption>
                  </figure>
                </div>
              ) : (
                <div>
                  <figure className="draft-fan-figure">
                    <svg className="draft-fan" viewBox="0 0 640 210" role="img" aria-label="Escala de cómputo en FLOPs">
                      <path className="draft-fan-grid" d="M60 20v150h540 M60 170h540 M60 120h540 M60 70h540 M60 20h540" />
                      <path
                        d="M 80 162 L 160 148 L 240 135 L 320 115 L 410 70 L 500 45 L 570 38"
                        fill="none"
                        stroke="var(--blue)"
                        strokeWidth="2.5"
                      />
                      {TRAINING_COMPUTE_SERIES.map((pt, idx) => {
                        const x = 80 + idx * 81;
                        const y = 170 - ((pt.flopExponent - 8) / 18) * 145;
                        return (
                          <g key={pt.model}>
                            <circle cx={x} cy={y} r="4" fill="var(--blue)" stroke="var(--surface)" strokeWidth="1.5" />
                            <text x={x} y={y - 8} textAnchor="middle" style={{ fontSize: '9px', fill: 'var(--ink)', fontWeight: 600 }}>
                              {pt.model}
                            </text>
                            <text x={x} y="190" textAnchor="middle" style={{ fontSize: '9px', fill: 'var(--muted)' }}>
                              {pt.year}
                            </text>
                          </g>
                        );
                      })}
                      <text x="50" y="38" textAnchor="end" style={{ fontSize: '9px', fill: 'var(--muted)' }}>10²⁶</text>
                      <text x="50" y="105" textAnchor="end" style={{ fontSize: '9px', fill: 'var(--muted)' }}>10¹⁸</text>
                      <text x="50" y="170" textAnchor="end" style={{ fontSize: '9px', fill: 'var(--muted)' }}>10¹⁰</text>
                    </svg>
                    <figcaption style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
                      Cómputo acumulado de entrenamiento estimado en FLOPs (escala logarítmica). Duplicación cada ~5 meses post-2012. Fuente: Epoch AI.
                    </figcaption>
                  </figure>
                </div>
              )}
            </div>
          )}

          {/* SECTION 3: REVISIÓN DE PRONÓSTICOS */}
          {section === 'Revisión de pronósticos' && (
            <div className="uncertainty-data-view">
              <figure className="draft-fan-figure">
                <svg className="draft-fan" viewBox="0 0 640 210" role="img" aria-label="Comparación entre pronóstico del FMI y PBI observado">
                  <path className="draft-fan-grid" d="M60 20v150h540 M60 100h540" />
                  {/* Zero line */}
                  <line x1="60" y1="100" x2="600" y2="100" stroke="var(--ink-2)" strokeWidth="1" strokeDasharray="3 3" />
                  {MACRO_FORECAST_REVISION_DATA.map((pt, idx) => {
                    const x = 95 + idx * 72;
                    // Scale: 0% at y=100, +12% at y=25, -12% at y=175 (6.25 px per %)
                    const yForecast = 100 - pt.imfWEOForecastGrowth * 6.25;
                    const yActual = 100 - pt.actualObservedGrowth * 6.25;
                    return (
                      <g key={pt.targetYear}>
                        {/* Forecast bar */}
                        <rect x={x - 14} y={Math.min(100, yForecast)} width="12" height={Math.abs(100 - yForecast)} fill="var(--blue)" rx="2" />
                        {/* Actual bar */}
                        <rect x={x} y={Math.min(100, yActual)} width="12" height={Math.abs(100 - yActual)} fill={pt.actualObservedGrowth >= 0 ? 'var(--accent)' : 'var(--scenario-pessimistic)'} rx="2" />
                        <text x={x - 1} y="190" textAnchor="middle" style={{ fontSize: '10px', fill: 'var(--ink)' }}>
                          {pt.targetYear}
                        </text>
                        <text x={x - 1} y="202" textAnchor="middle" style={{ fontSize: '8px', fill: 'var(--muted)' }}>
                          Δ {pt.absoluteError.toFixed(1)} pp
                        </text>
                      </g>
                    );
                  })}
                  <text x="50" y="30" textAnchor="end" style={{ fontSize: '9px', fill: 'var(--muted)' }}>+10%</text>
                  <text x="50" y="103" textAnchor="end" style={{ fontSize: '9px', fill: 'var(--muted)' }}>0%</text>
                  <text x="50" y="170" textAnchor="end" style={{ fontSize: '9px', fill: 'var(--muted)' }}>-10%</text>
                </svg>
                <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center', fontSize: '0.75rem', marginTop: '0.2rem' }}>
                  <span><span style={{ display: 'inline-block', width: 10, height: 10, background: 'var(--blue)', borderRadius: 2, marginRight: 4 }} /> Pronóstico FMI WEO (t-1)</span>
                  <span><span style={{ display: 'inline-block', width: 10, height: 10, background: 'var(--accent)', borderRadius: 2, marginRight: 4 }} /> PBI real observado (INDEC)</span>
                </div>
                <figcaption style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
                  Desvío medio absoluto en Argentina: 3,9 puntos porcentuales por año en proyecciones a sólo 12 meses. A 30 años, la dispersión es exponencial. Fuente: FMI WEO Historical Database e INDEC.
                </figcaption>
              </figure>
            </div>
          )}

          {/* SECTION 4: ESCENARIO ADVERSO */}
          {section === 'Escenario adverso' && (
            <div className="uncertainty-data-view">
              <div className="draft-choice-row" role="group" aria-label="Canal del escenario adverso">
                {(['Productividad', 'Empleo', 'Salarios reales', 'PBI por habitante'] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    className="btn"
                    aria-pressed={selectedChannel === item}
                    onClick={() => setSelectedChannel(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <div className="draft-adverse-note" style={{ marginTop: 'var(--space-2)' }}>
                <strong style={{ color: 'var(--scenario-pessimistic)' }}>{channelData.title}</strong>
                <p style={{ margin: '0.3rem 0', fontSize: '0.85rem', color: 'var(--ink)' }}>
                  <strong>Mecanismo empírico:</strong> {channelData.empiricalMechanism}
                </p>
                <p style={{ margin: '0.3rem 0', fontSize: '0.82rem', color: 'var(--ink-2)' }}>
                  <strong>Precedente histórico:</strong> {channelData.historicalPrecedent}
                </p>
                <p style={{ margin: '0.3rem 0', fontSize: '0.82rem', color: 'var(--accent)' }}>
                  <strong>Factor amortiguador:</strong> {channelData.mitigationFactor}
                </p>
              </div>
            </div>
          )}
        </Reveal>

        <Reveal k="uncertainty-copy" delay={0.08} className="gdp-chart draft-card uncertainty-copy">
          <span className="draft-kicker">Relato analítico</span>
          <blockquote>
            Las curvas de costos de cómputo y algoritmos caen de manera vertical, pero los plazos de adopción en la economía real responden a restricciones institucionales, organizativas y humanas.
          </blockquote>
          <p>
            Mientras que el software escala a costo marginal decreciente, la infraestructura energética, el tendido de conectividad y la capacitación laboral requieren décadas de inversión sostenida.
          </p>
          <div className="draft-adverse-note">
            <strong style={{ color: 'var(--scenario-pessimistic)' }}>Restricción macroeconómica</strong>
            <p>
              En países con volatilidad de precios relativos y restricciones de capital como Argentina, los desvíos en pronósticos de 1 año promedian 3,9 puntos de PBI. Proyectar a 2056 exige tratar los resultados como un abanico probabilístico condicionado, no como certeza matemática.
            </p>
          </div>
          <p className="draft-footnote">
            Datos empíricos compilados de Stanford HAI AI Index 2025, Epoch AI (Compute Trends), CHAT Dataset (NBER) e IMF WEO Historical Database.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
