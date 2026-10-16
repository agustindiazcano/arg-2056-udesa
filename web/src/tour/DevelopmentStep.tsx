import React, { useState } from 'react';
import { Reveal } from '../motion/Reveal.js';
import { DEVELOPMENT_TITLE } from './slideTitles.js';

const INDICATORS = {
  Salud: ['Esperanza de vida al nacer', 'Mortalidad infantil', 'IDH · salud'],
  Educación: ['Resultados PISA', 'Deserción universitaria', 'Población graduada universitaria', 'Graduación STEM', 'Maestría y doctorado', 'Años de escolaridad', 'IDH · educación'],
  Igualdad: ['Índice de Gini', 'Pobreza monetaria', 'Salarios reales']
} as const;

type Category = keyof typeof INDICATORS;
type DisplayMode = 'Serie temporal' | 'Comparación regional';
type GrowthDriver = 'Educación y capital humano' | 'Ahorro e inversión';

/** Draft UI for the development indicators slide. It intentionally contains no indicator values. */
export function DevelopmentStep() {
  const [category, setCategory] = useState<Category>('Educación');
  const [indicator, setIndicator] = useState<string>(INDICATORS.Educación[0]);
  const [display, setDisplay] = useState<DisplayMode>('Serie temporal');
  const [growthDriver, setGrowthDriver] = useState<GrowthDriver>('Educación y capital humano');

  const chooseCategory = (next: Category) => {
    setCategory(next);
    setIndicator(INDICATORS[next][0]);
  };

  return (
    <section className="gdp-step draft-slide" aria-label={DEVELOPMENT_TITLE}>
      <header className="gdp-head draft-slide-head">
        <div>
          <h2>{DEVELOPMENT_TITLE}</h2>
          <p className="gdp-sub">Dimensiones sociales y humanas del desarrollo económico</p>
        </div>
        <span className="draft-status">Métricas de desarrollo</span>
      </header>

      <div className="draft-slide-layout">
        <Reveal k="indicators" className="gdp-chart draft-card draft-selector">
          <div className="draft-section-head">
            <div>
              <span className="draft-kicker">Explorar</span>
              <h3>Indicadores de desarrollo</h3>
            </div>
            <div className="draft-mode" role="group" aria-label="Forma de comparar" >
              {(['Serie temporal', 'Comparación regional'] as const).map((mode) => (
                <button key={mode} type="button" className="btn" aria-pressed={display === mode} onClick={() => setDisplay(mode)}>
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div role="group" aria-label="Dimensión del desarrollo" className="draft-tabs">
            {(Object.keys(INDICATORS) as Category[]).map((item) => (
              <button key={item} type="button" aria-pressed={category === item} onClick={() => chooseCategory(item)}>
                {item}
              </button>
            ))}
          </div>

          <div className="draft-indicator-list" role="group" aria-label={`Indicadores de ${category}`}>
            {INDICATORS[category].map((item) => (
              <button key={item} type="button" className="draft-indicator" aria-pressed={indicator === item} onClick={() => setIndicator(item)}>
                <span>{item}</span>
                <span aria-hidden="true">↗</span>
              </button>
            ))}
          </div>
        </Reveal>

        <Reveal k="indicator-view" delay={0.08} className="gdp-chart draft-card draft-detail" aria-live="polite">
          <div>
            <span className="draft-kicker">{display}</span>
            <h3>{indicator}</h3>
            <p className="draft-muted">{category}</p>
          </div>
          <div className="draft-empty" role="status">
            <span className="draft-empty-mark" aria-hidden="true">—</span>
            <strong>Panel de métricas e indicadores</strong>
            <p>Estructura de indicadores agregados, cobertura y unidades estandarizadas.</p>
          </div>
          <dl className="draft-meta-list">
            <div><dt>Definición y denominador</dt><dd>Estándar internacional</dd></div>
            <div><dt>Fuente y comparabilidad</dt><dd>Organismos multilaterales</dd></div>
          </dl>
          <div className="draft-context">
            <h4>¿Por qué mirar el crecimiento del PBI?</h4>
            <p>El PBI por habitante y los salarios reales ayudan a ver si una mayor capacidad productiva llega a los hogares. El crecimiento no garantiza por sí solo mejores resultados: también importan la distribución y el acceso a salud y educación.</p>
            <div className="draft-choice-row" role="group" aria-label="Factores del crecimiento para revisar">
              {(['Educación y capital humano', 'Ahorro e inversión'] as const).map((driver) => (
                <button key={driver} type="button" className="btn" aria-pressed={growthDriver === driver} onClick={() => setGrowthDriver(driver)}>{driver}</button>
              ))}
            </div>
            <p>{growthDriver}: canal fundamental en la literatura económica sobre convergencia y productividad.</p>
            <small>Las relaciones describen canales teóricos y evidencia empírica de largo plazo.</small>
          </div>
        </Reveal>
      </div>
      <p className="draft-footnote">La comparación regional y las series articulan definiciones metodológicas homogéneas para permitir comparabilidad internacional.</p>
    </section>
  );
}
