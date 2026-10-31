import React, { useMemo, useState } from 'react';
import { EChart } from '../charts/EChart.js';
import { tokens } from '../styles/tokens.js';
import { RefList } from '../ui/RefLink.js';
import { Segmented } from '../ui/Segmented.js';
import {
  ADOPTION,
  AI_EVIDENCE_SLIDES,
  ENTERPRISE,
  PAID_LLM_WORLD_ESTIMATE,
  PYRAMID_LEVELS,
  RESEARCH_PLATFORMS,
  TOKEN_LOG_BENCHMARKS,
  TOKEN_PYRAMID_TIERS,
  paidPopulationShare
} from './aiEvidence.js';
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
  const [tierId, setTierId] = useState('t2');
  const activeTier = TOKEN_PYRAMID_TIERS.find((t) => t.id === tierId) ?? TOKEN_PYRAMID_TIERS[1]!;
  return (
    <div className="ai-evidence-single">
      <article className="ai-evidence-card ai-token-pyramid-card">
        <div className="ai-tri-layout">
          <div className="ai-tri-col">
            <h3>Pirámide de consumo mensual de tokens (6 niveles)</h3>
            <p>Seleccioná cualquier sección del triángulo para inspeccionar su escala</p>
            <div className="ai-triangle-7" role="group" aria-label="Pirámide triangular de consumo mensual de tokens">
              {TOKEN_PYRAMID_TIERS.map((t, idx) => (
                <button
                  type="button"
                  key={t.id}
                  className={`ai-tri-slice ai-tri-slice--${idx}`}
                  aria-pressed={tierId === t.id}
                  onClick={() => setTierId(t.id)}
                >
                  <span className="ai-tri-slice-content">
                    <span className="ai-tri-slice-tier">{t.tier}</span>
                    <strong>{t.monthlyTokens}</strong>
                  </span>
                </button>
              ))}
            </div>
            <p className="ai-author-mini">★ &quot;Autor - últimos 30 días (8.000 M solo en claude code)&quot;</p>
            <p className="ai-evidence-caption">
              Muestra Jellyfish: telemetría corporativa de miles de ingenieros en cientos de empresas utilizando Claude Code, Cursor y GitHub Copilot (P50 = 51 M / ~81 USD; P90 = 380 M; top 2 % ≈ 2.000–2.200 M; quintil empresarial más intensivo ≈ 2.500 M/mes; P99 gasto ≈ 2.452 USD/mes). VibeCafé ubica el P99 de Claude Code en ~4.800 M/mes (~160 M/día), Cursor reporta que el top 10 % concentra ~2/3 de los tokens y Anthropic estima ~13 USD/día activo (90 % &lt;30 USD/día). <RefList ids={['AI56', 'AI57', 'AI68', 'AI69', 'AI70', 'AI71', 'AI72', 'AI73', 'AI74']} />
            </p>
          </div>
          <div className="ai-tri-side">
            <div className="ai-personal">
              <strong>{activeTier.tier} · {activeTier.monthlyTokens}</strong>
              <span>{activeTier.title} — {activeTier.actors}</span>
              <p>{activeTier.detail} <RefList ids={activeTier.refs} /></p>
            </div>
            <div className="ai-log-scale" aria-label="Comparador en escala logarítmica de tokens mensuales">
              <strong className="ai-log-title">Escala logarítmica (10⁶ a 10¹¹ tokens/mes): P50 (51 M), P90 (380 M) y cola P99 (1.350 a 5.000 M)</strong>
              {TOKEN_LOG_BENCHMARKS.map((b) => {
                const widthPct = Math.max(8, Math.min(100, ((b.exp - 5.8) / (11.2 - 5.8)) * 100));
                return (
                  <div key={b.label} className="ai-log-row">
                    <span>{b.label}</span>
                    <div className="ai-log-bar-track">
                      <div className={`ai-log-bar-fill ai-log-bar-fill--${b.tone}`} style={{ width: `${widthPct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}

function PyramidContent() {
  const [mode, setMode] = useState<'paid' | '0' | '1' | '2' | '3'>('paid');
  const selectedIndex = mode === 'paid' ? 1 : Number(mode);
  const level = PYRAMID_LEVELS[selectedIndex]!;
  const ratio = paidPopulationShare(PYRAMID_LEVELS[0].count, PYRAMID_LEVELS[3].count);
  return <div className="ai-evidence-grid">
    <article className="ai-evidence-card">
      <h3>Pirámide global de los modelos de lenguaje (ChatGPT, Claude, Gemini, Copilot, Meta AI, DeepSeek)</h3>
      <Segmented
        label="Foco"
        options={[
          { value: 'paid', label: 'Población mundial que paga LLMs (por defecto)' },
          { value: '0', label: 'Cúspide agéntica / API' },
          { value: '1', label: 'Pagos (~75–100 M)' },
          { value: '2', label: 'Gratuitos (~1.300 M)' },
          { value: '3', label: 'Mundo (8.200 M)' }
        ]}
        value={mode}
        onChange={setMode}
      />
      <div className="ai-triangle-4" role="group" aria-label="Pirámide triangular de adopción global de modelos de lenguaje">
        {PYRAMID_LEVELS.map((r, i) => (
          <button
            type="button"
            key={r.label}
            className={`ai-tri4-slice ai-tri4-slice--${i}`}
            aria-pressed={selectedIndex === i}
            onClick={() => setMode(i === 1 ? 'paid' : (String(i) as '0' | '2' | '3'))}
          >
            <span className="ai-tri-slice-content">
              <strong>{r.shareBadge}</strong>
              <span>{r.shortTitle}</span>
            </span>
          </button>
        ))}
      </div>
      <p className="ai-evidence-caption">Pirámide multi-modelo: combina suscriptores pagos (&gt;50 M en ChatGPT + Claude, Gemini, Copilot y Cursor), difusión global del 18,8 % en edad activa (Microsoft AI Economy Institute), cuota empresarial (Menlo Ventures: Claude 40 %, OpenAI 27 %, Gemini 21 %) y población mundial ONU (8.200 M). <RefList ids={['AI38', 'AI39', 'AI66', 'AI67']} /></p>
    </article>
    <article className="ai-evidence-card">
      <h3>{mode === 'paid' ? '¿Cuántas personas del mundo pagan LLMs y por qué multiplican la productividad?' : level.label}</h3>
      <div className="ai-stat-pair">
        <div>
          <strong>{ratio.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %</strong>
          <span>piso documentado (&gt;50 M en ChatGPT / 8.200 M)</span>
        </div>
        <div>
          <strong>~0,9 a 1,2 %</strong>
          <span>estimado global (~75–100 M sumando Claude, Gemini, Copilot y Cursor)</span>
        </div>
      </div>
      <strong className="ai-provider-figure">{level.qualifier} {count(level.count)} personas ({level.shareBadge})</strong>
      <p>{level.note}</p>
      <RefList ids={[level.ref, 'AI66', 'AI67']} />
      <div className="ai-evidence-callout">
        <strong>Los modelos verdaderamente inteligentes están en el ~1 % pago (Claude, GPT, Gemini, Copilot)</strong>
        <p>{PAID_LLM_WORLD_ESTIMATE.whyItMatters}</p>
      </div>
      <p className="ai-evidence-caption">50 millones divididos por 8.200 millones = {ratio.toLocaleString('es-AR', { maximumFractionDigits: 2 })} % como piso documentado; sumando Claude Pro/Max, Gemini Advanced y Copilot Pro se ubica en ~0,9–1,2 % mundial. <RefList ids={['AI30', 'AI32', 'AI38', 'AI39', 'AI54', 'AI66', 'AI67']} /></p>
    </article>
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
