import React, { useMemo, useState } from 'react';
import { Reveal } from '../motion/Reveal.js';
import { ChartHelp } from '../ui/ChartHelp.js';
import { RefList } from '../ui/RefLink.js';
import { DEVELOPMENT_TITLE } from './slideTitles.js';
import { DEVELOPMENT_INDICATORS_DATA, IndicatorData } from './developmentData.js';

const INDICATORS = {
  Salud: ['Esperanza de vida al nacer', 'Mortalidad infantil', 'IDH · salud'],
  Educación: ['Resultados PISA', 'Años de escolaridad', 'Población graduada universitaria', 'Graduación STEM', 'IDH · educación'],
  Igualdad: ['Índice de Gini', 'Pobreza monetaria', 'IDH general']
} as const;

type Category = keyof typeof INDICATORS;
type DisplayMode = 'Serie temporal' | 'Comparación regional';
type GrowthDriver = 'Educación y capital humano' | 'Ahorro e inversión';

export function DevelopmentStep() {
  const [category, setCategory] = useState<Category>('Salud');
  const [indicator, setIndicator] = useState<string>(INDICATORS.Salud[0]);
  const [display, setDisplay] = useState<DisplayMode>('Serie temporal');
  const [growthDriver, setGrowthDriver] = useState<GrowthDriver>('Educación y capital humano');

  const chooseCategory = (next: Category) => {
    setCategory(next);
    setIndicator(INDICATORS[next][0]);
  };

  const currentData: IndicatorData = useMemo(() => {
    return DEVELOPMENT_INDICATORS_DATA[indicator] ?? DEVELOPMENT_INDICATORS_DATA['Esperanza de vida al nacer']!;
  }, [indicator]);

  const latestPoint = currentData.timeSeries[currentData.timeSeries.length - 1];
  const initialPoint = currentData.timeSeries[0];
  const delta = latestPoint && initialPoint ? latestPoint.value - initialPoint.value : 0;
  const deltaFormatted = delta >= 0 ? `+${delta.toFixed(1)}` : `${delta.toFixed(1)}`;

  // Normalization for SVG time series chart
  const seriesValues = currentData.timeSeries.map((d) => d.value);
  const minVal = Math.min(...seriesValues);
  const maxVal = Math.max(...seriesValues);
  const valRange = maxVal - minVal || 1;

  // Normalization for regional comparison
  const regionalMax = Math.max(...currentData.regionalComparison.map((r) => r.value)) || 1;

  return (
    <section className="gdp-step draft-slide" aria-label={DEVELOPMENT_TITLE}>
      <header className="gdp-head draft-slide-head">
        <div>
          <div className="slide-title-row">
            <h2>{DEVELOPMENT_TITLE}</h2>
            <ChartHelp
              title={DEVELOPMENT_TITLE}
              lead="Dimensiones sociales y humanas del desarrollo económico"
              paragraphs={[
                'El crecimiento del PBI por habitante resume la capacidad productiva agregada, pero el desarrollo humano requiere evaluar también salud, educación y distribución del ingreso.',
                'Este panel consolida series auditadas del Banco Mundial, PNUD, OCDE e INDEC para evaluar el capital humano y la equidad distributiva de Argentina en perspectiva histórica y regional.'
              ]}
              how="Seleccioná una dimensión (Salud, Educación o Igualdad), un indicador específico y alterná entre Serie temporal y Comparación regional para analizar los datos oficiales."
              refs={['W1', 'D1', 'D2', 'S3']}
            />
          </div>
          <p className="gdp-sub">
            <RefList ids={['W1', 'D1', 'D2', 'S3']} />
          </p>
        </div>
        <span className="draft-status">Métricas oficiales</span>
      </header>

      <div className="draft-slide-layout">
        <Reveal k="indicators" className="gdp-chart draft-card draft-selector">
          <div className="draft-section-head">
            <div>
              <span className="draft-kicker">Dimensiones</span>
              <h3>Indicadores de desarrollo</h3>
            </div>
            <div className="draft-mode" role="group" aria-label="Forma de comparar">
              {(['Serie temporal', 'Comparación regional'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className="btn"
                  aria-pressed={display === mode}
                  onClick={() => setDisplay(mode)}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div role="group" aria-label="Dimensión del desarrollo" className="draft-tabs">
            {(Object.keys(INDICATORS) as Category[]).map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={category === item}
                onClick={() => chooseCategory(item)}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="draft-indicator-list" role="group" aria-label={`Indicadores de ${category}`}>
            {INDICATORS[category].map((item) => (
              <button
                key={item}
                type="button"
                className="draft-indicator"
                aria-pressed={indicator === item}
                onClick={() => setIndicator(item)}
              >
                <span>{item}</span>
                <span aria-hidden="true">{indicator === item ? '●' : '↗'}</span>
              </button>
            ))}
          </div>
        </Reveal>

        <Reveal k="indicator-view" delay={0.08} className="gdp-chart draft-card draft-detail" aria-live="polite">
          <div>
            <span className="draft-kicker">{display} · {category}</span>
            <h3>{currentData.title}</h3>
            <p className="draft-muted">{currentData.unit}</p>
          </div>

          {display === 'Serie temporal' ? (
            <div className="development-series-container" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 'var(--space-2)' }}>
                <div style={{ padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', background: 'color-mix(in srgb, var(--surface) 80%, transparent)', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--muted)', textTransform: 'uppercase' }}>Valor más reciente</span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--ink)' }}>
                    {latestPoint?.value ?? '—'} <small style={{ fontSize: '0.72rem', fontWeight: 400, color: 'var(--muted)' }}>({latestPoint?.year})</small>
                  </div>
                </div>
                <div style={{ padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', background: 'color-mix(in srgb, var(--surface) 80%, transparent)', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--muted)', textTransform: 'uppercase' }}>Punto inicial</span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--ink)' }}>
                    {initialPoint?.value ?? '—'} <small style={{ fontSize: '0.72rem', fontWeight: 400, color: 'var(--muted)' }}>({initialPoint?.year})</small>
                  </div>
                </div>
                <div style={{ padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', background: 'color-mix(in srgb, var(--surface) 80%, transparent)', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--muted)', textTransform: 'uppercase' }}>Variación neta</span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--seq-9)' }}>
                    {deltaFormatted}
                  </div>
                </div>
              </div>

              {/* Responsive SVG chart */}
              <div style={{ width: '100%', height: '140px', position: 'relative', marginTop: 'var(--space-1)' }}>
                <svg viewBox="0 0 500 130" style={{ width: '100%', height: '100%', overflow: 'visible' }} role="img" aria-label={`Evolución de ${currentData.title}`}>
                  <line x1="20" y1="105" x2="480" y2="105" stroke="var(--border)" strokeWidth="1" />
                  <line x1="20" y1="20" x2="480" y2="20" stroke="var(--border)" strokeWidth="1" strokeDasharray="3,3" opacity="0.4" />
                  
                  {/* Connect points with a polyline */}
                  <polyline
                    fill="none"
                    stroke="var(--blue)"
                    strokeWidth="2.5"
                    points={currentData.timeSeries
                      .map((d, i) => {
                        const x = 30 + (i * 440) / (currentData.timeSeries.length - 1 || 1);
                        const y = 100 - ((d.value - minVal) / valRange) * 80;
                        return `${x},${y}`;
                      })
                      .join(' ')}
                  />

                  {currentData.timeSeries.map((d, i) => {
                    const x = 30 + (i * 440) / (currentData.timeSeries.length - 1 || 1);
                    const y = 100 - ((d.value - minVal) / valRange) * 80;
                    return (
                      <g key={d.year}>
                        <circle cx={x} cy={y} r="4" fill="var(--surface)" stroke="var(--blue)" strokeWidth="2" />
                        <text x={x} y={y - 8} textAnchor="middle" fontSize="10" fill="var(--ink)" fontWeight="500">
                          {d.value}
                        </text>
                        <text x={x} y="122" textAnchor="middle" fontSize="9" fill="var(--muted)">
                          {d.year}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {latestPoint?.note && (
                <div style={{ fontSize: '0.75rem', color: 'var(--ink-2)', fontStyle: 'italic', marginTop: 'var(--space-1)' }}>
                  Nota técnica: {latestPoint.note}
                </div>
              )}
            </div>
          ) : (
            <div className="development-regional-container" style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginBottom: '0.2rem' }}>
                Comparación con países pares de América Latina ({currentData.unit})
              </div>
              {currentData.regionalComparison.map((item) => {
                const isArgentina = item.country === 'Argentina';
                const percent = Math.min(100, Math.max(10, (item.value / regionalMax) * 100));
                return (
                  <div
                    key={item.country}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.15rem',
                      padding: '0.35rem 0.6rem',
                      borderRadius: 'var(--radius-sm)',
                      background: isArgentina
                        ? 'color-mix(in srgb, var(--blue) 18%, var(--surface))'
                        : 'color-mix(in srgb, var(--surface) 60%, transparent)',
                      border: isArgentina ? '1px solid var(--blue)' : '1px solid var(--border)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: isArgentina ? 700 : 500, color: isArgentina ? 'var(--ink)' : 'var(--ink-2)', fontSize: '0.84rem' }}>
                        {item.country} {isArgentina && '(Referencia nacional)'}
                      </span>
                      <span style={{ fontWeight: 600, color: 'var(--ink)', fontSize: '0.88rem' }}>
                        {item.value} {item.note && <small style={{ fontSize: '0.7rem', color: 'var(--muted)', fontWeight: 400 }}>· {item.note}</small>}
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${percent}%`,
                          height: '100%',
                          background: isArgentina ? 'var(--blue)' : 'var(--muted)',
                          borderRadius: '3px'
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <dl className="draft-meta-list" style={{ marginTop: 'var(--space-2)' }}>
            <div>
              <dt>Definición metodológica</dt>
              <dd>{currentData.definition}</dd>
            </div>
            <div>
              <dt>Fuente oficial</dt>
              <dd>
                <a
                  href={currentData.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: 'var(--seq-9)', textDecoration: 'underline' }}
                >
                  {currentData.source}
                </a>
              </dd>
            </div>
          </dl>

          <div className="draft-context">
            <h4>Canales de transmisión hacia el crecimiento económico</h4>
            <p>
              El bienestar social y el desarrollo humano potencian la productividad total de los factores a través de externalidades positivas de capital humano, salud preventiva e inclusión laboral.
            </p>
            <div className="draft-choice-row" role="group" aria-label="Factores del crecimiento para revisar">
              {(['Educación y capital humano', 'Ahorro e inversión'] as const).map((driver) => (
                <button
                  key={driver}
                  type="button"
                  className="btn"
                  aria-pressed={growthDriver === driver}
                  onClick={() => setGrowthDriver(driver)}
                >
                  {driver}
                </button>
              ))}
            </div>
            <p style={{ marginTop: 'var(--space-1)' }}>
              <strong>{growthDriver}</strong>: factor esencial en los modelos de crecimiento endógeno y convergencia estructural.
            </p>
          </div>
        </Reveal>
      </div>
      <p className="draft-footnote">
        Las series históricas provienen del Banco Mundial (WDI), PNUD e INDEC bajo estándares internacionales homogéneos para garantizar comparabilidad.
      </p>
    </section>
  );
}
