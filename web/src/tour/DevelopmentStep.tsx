import React, { useMemo, useState } from 'react';
import { EChart } from '../charts/EChart.js';
import { Reveal } from '../motion/Reveal.js';
import { ChartHelp } from '../ui/ChartHelp.js';
import { RefList } from '../ui/RefLink.js';
import { DEVELOPMENT_TITLE } from './slideTitles.js';
import { DEVELOPMENT_INDICATORS_DATA } from './developmentData.js';
import type { IndicatorData } from './developmentData.js';
import { chartSeries, flagOf, higherIsBetter, lineOption, rankingRows } from './developmentView.js';

const INDICATORS = {
  Salud: ['Esperanza de vida al nacer', 'Mortalidad infantil', 'IDH · salud'],
  Educación: ['Resultados PISA', 'Años de escolaridad', 'Población graduada universitaria', 'Graduación STEM', 'IDH · educación'],
  Igualdad: ['Índice de Gini', 'Pobreza monetaria', 'IDH general']
} as const;

type Category = keyof typeof INDICATORS;

const fmt = (v: number | undefined): string => (v === undefined ? '—' : v.toLocaleString('es-AR', { maximumFractionDigits: 3 }));

/**
 * Slide 7, development indicators: the dimension and the indicator in small buttons on top, small boxes with the numbers of Argentina, a big chart on the
 * left with the last years year by year and several countries, and on the right the ranking of the region for the indicator.
 */
export function DevelopmentStep() {
  const [category, setCategory] = useState<Category>('Salud');
  const [indicator, setIndicator] = useState<string>(INDICATORS.Salud[0]);

  const chooseCategory = (next: Category) => {
    setCategory(next);
    setIndicator(INDICATORS[next][0]);
  };

  const data: IndicatorData = DEVELOPMENT_INDICATORS_DATA[indicator] ?? DEVELOPMENT_INDICATORS_DATA['Esperanza de vida al nacer']!;
  const ranking = useMemo(() => rankingRows(indicator), [indicator]);
  const chart = useMemo(() => chartSeries(indicator), [indicator]);

  const own = data.timeSeries;
  const latest = own.at(-1);
  const first = own[0];
  const delta = latest && first ? latest.value - first.value : 0;
  const argentinaRank = ranking.find((r) => r.isArgentina)?.rank;
  const better = higherIsBetter(indicator);

  const summary = `${data.title}, ${chart.years[0]} a ${chart.years.at(-1)}: ${chart.series.map((s) => `${s.name} ${fmt(s.values.filter((v): v is number => v !== null).at(-1))}`).join(', ')}`;
  const option = useMemo(
    () => lineOption(chart, { unit: data.unit, summary }),
    [chart, data.unit, summary]
  );

  const boxes: Array<[string, string]> = [
    ['Argentina, último dato', `${fmt(latest?.value)}${latest ? ` (${latest.year})` : ''}`],
    ['Punto inicial', `${fmt(first?.value)}${first ? ` (${first.year})` : ''}`],
    ['Variación', `${delta >= 0 ? '+' : ''}${delta.toLocaleString('es-AR', { maximumFractionDigits: 2 })}`],
    ['Lugar en la región', argentinaRank ? `${argentinaRank}.º de ${ranking.length}` : '—']
  ];

  return (
    <section className="gdp-step dev-slide" aria-label={DEVELOPMENT_TITLE}>
      <header className="gdp-head">
        <div>
          <div className="slide-title-row">
            <h2>{DEVELOPMENT_TITLE}</h2>
            <ChartHelp
              title={DEVELOPMENT_TITLE}
              lead="Dimensiones sociales y humanas del desarrollo económico"
              paragraphs={[
                'El crecimiento del PBI por habitante resume la capacidad productiva agregada, pero el desarrollo humano requiere evaluar también salud, educación y distribución del ingreso.',
                'Este panel consolida series del Banco Mundial, PNUD, OCDE e INDEC para comparar el capital humano y la equidad de Argentina con los países de la región.'
              ]}
              how="Elegí una dimensión y un indicador arriba. El gráfico grande muestra los últimos años año por año, con varios países cuando hay serie anual; la tabla de la derecha ordena la región del mejor al peor."
              refs={['W1', 'D1', 'D2', 'S3']}
            />
          </div>
          <p className="gdp-sub">
            <RefList ids={['W1', 'D1', 'D2', 'S3']} />
          </p>
        </div>
        <div className="dev-controls">
          <div role="group" aria-label="Dimensión del desarrollo" className="dev-chips">
            {(Object.keys(INDICATORS) as Category[]).map((item) => (
              <button key={item} type="button" className="dev-chip dev-chip--dim" aria-pressed={category === item} onClick={() => chooseCategory(item)}>
                {item}
              </button>
            ))}
          </div>
          <div role="group" aria-label={`Indicadores de ${category}`} className="dev-chips">
            {INDICATORS[category].map((item) => (
              <button key={item} type="button" className="dev-chip" aria-pressed={indicator === item} onClick={() => setIndicator(item)}>
                {item}
              </button>
            ))}
          </div>
        </div>
      </header>

      <ul className="dev-boxes" aria-label="Números de Argentina">
        {boxes.map(([label, value]) => (
          <li key={label} className="dev-box">
            <span>{label}</span>
            <strong>{value}</strong>
          </li>
        ))}
      </ul>

      <div className="dev-grid" aria-live="polite">
        <Reveal k="chart" className="gdp-chart rule70-card dev-main">
          <div className="rule70-card-head">
            <div className="ai-head-group">
              <strong>{data.title}</strong>
              <span className="ai-head-year">{data.unit}</span>
            </div>
            <div className="rule70-legend">
              {chart.series.map((s) => (
                <span key={s.name} className="ai-legend-item">
                  <span className="rule70-key" style={{ background: s.color }} aria-hidden="true" /> {s.name}
                </span>
              ))}
            </div>
          </div>
          <div className="rule70-chart dev-chart">
            <EChart option={option} aria-label={summary} />
          </div>
          <p className="dev-source">
            {data.definition} Fuente:{' '}
            <a href={data.sourceUrl} target="_blank" rel="noreferrer">
              {data.source}
            </a>
          </p>
        </Reveal>

        <Reveal k="ranking" delay={0.08} className="gdp-chart rule70-card dev-rank" role="region" aria-label="Ranking regional">
          <div className="rule70-card-head">
            <strong>Ranking regional</strong>
            <span className="ai-head-year">{better ? 'más alto es mejor' : 'más bajo es mejor'}</span>
          </div>
          <table className="ai-access-table dev-rank-table" aria-label={`Ranking regional de ${data.title}`}>
            <thead>
              <tr>
                <th scope="col">Lugar y país</th>
                <th scope="col">{data.unit}</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((r) => (
                <tr key={r.country} className={r.isArgentina ? 'dev-rank-row--home' : undefined}>
                  <th scope="row">
                    {r.rank}.º <img src={flagOf(r.country)} alt="" width={20} height={15} />
                    {r.country}
                  </th>
                  <td>
                    {fmt(r.value)}
                    {r.note ? <small> · {r.note}</small> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Reveal>
      </div>
    </section>
  );
}
