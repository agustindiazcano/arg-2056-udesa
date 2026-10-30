import React, { useMemo, useState } from 'react';
import { EChart } from '../charts/EChart.js';
import { tokens } from '../styles/tokens.js';
import { RefList } from '../ui/RefLink.js';
import { Segmented } from '../ui/Segmented.js';
import { ADOPTION, AI_EVIDENCE_SLIDES, ENTERPRISE, PERSONAL_USAGE, PYRAMID_LEVELS, RESEARCH_PLATFORMS, TOKEN_PROVIDERS, paidPopulationShare } from './aiEvidence.js';
import arxiv from './aiResearchCounts.json';
import './aiEvidence.css';

const count = (n: number) => n.toLocaleString('es-AR');

function barOption(labels: string[], values: number[], unit: string, max?: number) {
  return {
    animation: false,
    grid: { left: 12, right: 65, top: 18, bottom: 25, containLabel: true },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: (v: number) => `${count(v)} ${unit}` },
    xAxis: { type: 'value', max, axisLabel: { color: tokens.ink2 }, splitLine: { lineStyle: { color: tokens.grid } } },
    yAxis: { type: 'category', inverse: true, data: labels, axisLabel: { color: tokens.ink2 }, axisTick: { show: false }, axisLine: { show: false } },
    series: [{ type: 'bar', data: values, barMaxWidth: 42, itemStyle: { color: tokens.blue }, label: { show: true, position: 'right', color: tokens.ink, formatter: (p: { value: number }) => `${count(p.value)}${unit === '%' ? ' %' : ''}` } }]
  };
}

function AdoptionContent() {
  const chart = useMemo(() => barOption(ADOPTION.map((r) => r.label), ADOPTION.map((r) => r.value), '%', 100), []);
  return <div className="ai-evidence-grid">
    <article className="ai-evidence-card"><h3>IT: la frecuencia cambia la historia</h3><p>Empleados de tecnología en EE. UU. · Q4 2025</p><div className="ai-evidence-chart"><EChart option={chart} aria-label="Gallup: 77 % de empleados de tecnología usó IA alguna vez; 57 % la usa frecuentemente y 31 % diariamente. Categorías anidadas, no sumables." /></div><p className="ai-evidence-caption">Frecuente: al menos algunas veces por semana. Las categorías se incluyen entre sí. El uso total en IT pasó de 76 % a 77 % entre Q3 y Q4, mientras la frecuencia creció. <RefList ids={['AI35']} /></p></article>
    <div className="ai-evidence-column"><article className="ai-evidence-card"><h3>Grandes empresas: integración limitada</h3><div className="ai-stat-pair"><div><strong>{ENTERPRISE[0].value} %</strong><span>integración profunda</span></div><div><strong>{ENTERPRISE[1].value} %</strong><span>uso productivo adicional</span></div></div><p>S&P 500, 2025. Clasificación de informes 10-K; estudio MIT FutureTech/CMU. El sector tecnológico concentra buena parte de la adopción profunda. Es un preprint, no un censo directo de herramientas instaladas. <RefList ids={['AI36']} /></p></article>
    <article className="ai-evidence-card"><strong className="ai-stat">{ENTERPRISE[2].value} %</strong><h3>sin impacto declarado en productividad</h3><p>Empresas de EE. UU., Reino Unido, Alemania y Australia; encuestas de noviembre de 2025 a enero de 2026 sobre los tres años anteriores. Productividad: ventas por empleado. <RefList ids={['AI37']} /></p><p className="ai-evidence-caption">La encuesta encuentra alrededor de 70 % de uso empresarial. La brecha está entre adoptar una herramienta e integrarla con resultados; estos datos no prueban que la IA no funcione.</p></article></div>
  </div>;
}

function TokensContent() {
  const [provider, setProvider] = useState('Claude');
  const record = TOKEN_PROVIDERS.find((p) => p.name === provider) ?? TOKEN_PROVIDERS[0];
  return <div className="ai-evidence-grid">
    <article className="ai-evidence-card"><h3>La concentración del uso intensivo</h3><p>Percentiles publicados: investigadores internos de OpenAI · agosto de 2026</p>
      <div className="ai-percentile-pyramid" role="img" aria-label="Investigadores de OpenAI: percentil 90, más de 7.000 USD por día; mediana, más de 600 USD por día. Consumo valuado a precios de API, no cantidad de tokens ni facturación real.">
        <div className="ai-pyramid-band ai-pyramid-band--top"><strong>P90 · &gt;7.000 USD/día</strong><span>consumo equivalente API</span></div>
        <div className="ai-pyramid-band ai-pyramid-band--base"><strong>P50 · &gt;600 USD/día</strong><span>mediana de investigadores</span></div>
      </div>
      <p className="ai-evidence-caption">Esquema de concentración: anchos ilustrativos, no proporcionales al gasto. Son umbrales reportados de valor API del consumo, no pagos reales ni una distribución de tokens mensuales del mercado. <RefList ids={['AI55']} /></p>
      <div className="ai-personal"><strong>{count(PERSONAL_USAGE.tokens)} tokens</strong><span>Claude Code · últimos {PERSONAL_USAGE.days} días</span><p>Consumo personal declarado por el autor el 30-10-2026. Sin desglose de caché ni percentil asignado; no se compara con la muestra interna ni se convierte en una factura.</p></div>
    </article>
    <article className="ai-evidence-card"><h3>Qué publica cada proveedor</h3><Segmented label="Proveedor" options={TOKEN_PROVIDERS.map((p) => ({ value: p.name, label: p.name }))} value={provider} onChange={setProvider} /><strong className="ai-provider-figure">{record.figure}</strong><p>{record.scope}</p><RefList ids={[record.ref]} /><div className="ai-evidence-callout"><strong>Un total de plataforma no revela el percentil de una persona</strong><p>Los percentiles mensuales por usuario de estos cinco productos no están disponibles de forma comparable en las fuentes citadas. Por eso no se deducen a partir de tokens agregados, planes o mensajes.</p></div><p className="ai-evidence-caption">Anthropic también publica percentiles por artefacto normalizados respecto de la mediana de conversación: otra unidad de análisis. OpenRouter observa su propia plataforma, con una mezcla de modelos y clientes distinta del mercado completo.</p></article>
  </div>;
}

function PyramidContent() {
  const [selected, setSelected] = useState(0);
  const level = PYRAMID_LEVELS[selected]!;
  const ratio = paidPopulationShare(PYRAMID_LEVELS[0].count, PYRAMID_LEVELS[2].count);
  return <div className="ai-evidence-grid">
    <article className="ai-evidence-card"><h3>Del alcance al pago</h3><p>ChatGPT como caso documentado; no suma de todos los LLM</p>
      <div className="ai-adoption-pyramid" role="group" aria-label="Pirámide conceptual de alcance y suscripción">
        {PYRAMID_LEVELS.map((r, i) => <button type="button" key={r.label} className={`ai-pyramid-band ai-pyramid-level-${i}`} aria-pressed={selected === i} onClick={() => setSelected(i)}><strong>{r.qualifier === 'Más de' ? '>' : '≈'}{i === 2 ? '8.200' : i === 1 ? '900' : '50'} millones</strong><span>{r.label}</span><small>{r.period}</small></button>)}
      </div><p className="ai-evidence-caption">Diagrama conceptual: áreas y anchos no proporcionales. Usuarios semanales y suscriptores son métricas distintas; los pagos no se restan de los activos semanales. La base es una referencia demográfica de 2024.</p><RefList ids={['AI38', 'AI39']} /></article>
    <article className="ai-evidence-card"><h3>{level.label}</h3><strong className="ai-provider-figure">{level.qualifier} {count(level.count)}</strong><p>{level.note}</p><RefList ids={[level.ref]} /><div className="ai-evidence-callout"><strong>{ratio.toLocaleString('es-AR', { maximumFractionDigits: 2 })} % como comparación de escala</strong><p>50 millones divididos por 8.200 millones. El numerador publicado es “más de 50 millones”; no es el total mundial de personas que pagan IA ni una tasa precisa actual.</p></div><p>El plan de 20 USD es una referencia de acceso, pero la cifra de suscriptores de OpenAI no distingue cuánto paga cada uno. No permite afirmar que todos pagan 20 USD.</p><p className="ai-evidence-caption">Redibujo propio del formato de pirámide/embudo de adopción. Inspiración visual: AI Bear; cifras y definiciones reemplazadas por OpenAI y ONU. <RefList ids={['AI54']} /></p></article>
  </div>;
}

function ResearchContent() {
  const [view, setView] = useState<'trend' | 'platforms'>('trend');
  const platforms = [{ platform: 'arXiv', count: arxiv.find((r) => r.year === 2025)!.count }, ...RESEARCH_PLATFORMS];
  const chart = useMemo(() => view === 'trend' ? {
    animation: false,
    grid: { left: 12, right: 35, top: 25, bottom: 25, containLabel: true },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: arxiv.map((r) => r.year), axisLabel: { color: tokens.ink2 } },
    yAxis: { type: 'value', axisLabel: { color: tokens.ink2 }, splitLine: { lineStyle: { color: tokens.grid } } },
    series: [{ type: 'line', data: arxiv.map((r) => r.count), symbolSize: 8, itemStyle: { color: tokens.blue }, lineStyle: { width: 3 }, label: { show: true, color: tokens.ink, formatter: (p: { value: number }) => count(p.value) } }]
  } : barOption(platforms.map((r) => r.platform), platforms.map((r) => r.count), 'trabajos'), [view]);
  return <div className="ai-evidence-grid"><article className="ai-evidence-card"><h3>{view === 'trend' ? 'arXiv: nuevos envíos por año' : 'Repositorios de preprints en 2025'}</h3><Segmented label="Publicaciones" options={[{ value: 'trend', label: 'Evolución arXiv' }, { value: 'platforms', label: 'Otros repositorios' }]} value={view} onChange={setView} /><div className="ai-evidence-chart"><EChart option={chart} aria-label={view === 'trend' ? `Nuevos envíos de arXiv por año: ${arxiv.map((r) => `${r.year}: ${r.count}`).join('; ')}` : `2025: ${platforms.map((p) => `${p.platform}: ${p.count}`).join('; ')}. Métricas distintas, no sumables.`} /></div><p className="ai-evidence-caption">Años completos. arXiv: nuevos envíos; Preprints.org: preprints publicados; SocArXiv: trabajos aceptados. Coberturas distintas, posible duplicación: no se suman ni equivalen a papers revisados por pares. <RefList ids={['AI44', 'AI45', 'AI46']} /></p></article>
    <div className="ai-evidence-column"><article className="ai-evidence-card"><h3>De ciclos largos a iteraciones en días</h3><p>El caso AI co-scientist de Google reconstruyó una hipótesis sobre transferencia genética bacteriana que los colaboradores de Imperial ya habían comprobado experimentalmente. El sistema se apoyó en literatura pública sin conocer esos resultados inéditos.</p><div className="ai-research-flow"><span>Literatura</span><span aria-hidden="true">→</span><span>Hipótesis</span><span aria-hidden="true">→</span><span>Validación humana</span></div><p className="ai-evidence-caption">Es evidencia de aceleración de una etapa de investigación, no de sustituir los años de experimentos por unos días. Redibujo conceptual propio del proceso de Google Research. <RefList ids={['AI47']} /></p></article><article className="ai-evidence-card"><h3>Más cómputo no garantiza más ciencia</h3><p>OpenAI reporta más experimentos por investigador junto con mayor uso de agentes, pero también más capacidad de cómputo. Es telemetría interna y correlación; no una estimación causal del efecto de IA.</p><RefList ids={['AI55']} /><p className="ai-evidence-caption">El crecimiento de publicaciones puede incluir más producción, cambios de cobertura y menor calidad. No se atribuye todo el aumento a los LLM.</p></article></div>
  </div>;
}

export function AiEvidenceStep({ step }: { step: number }) {
  const def = AI_EVIDENCE_SLIDES.find((s) => s.id === step);
  if (!def) return null;
  return <section className="gdp-step ai-evidence-step" aria-label={def.title}><header className="gdp-head"><div className="gdp-title"><h2>{def.title}</h2><p className="gdp-sub">{def.lead}</p><RefList ids={def.refs} /></div></header>{step === 27 ? <AdoptionContent /> : step === 28 ? <TokensContent /> : step === 26 ? <PyramidContent /> : <ResearchContent />}</section>;
}
