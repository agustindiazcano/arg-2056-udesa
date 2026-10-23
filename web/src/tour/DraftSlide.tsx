import React from 'react';
import { Reveal } from '../motion/Reveal.js';
import { ChartHelp } from '../ui/ChartHelp.js';
import type { DraftSlideDef } from './draftSlides.js';

/** A slide that is an outline: the title, one line and the topics it will cover, in cards. */
export function DraftSlide({ def }: { def: DraftSlideDef }) {
  return (
    <section className="gdp-step draft-slide" aria-label={def.title}>
      <header className="gdp-head draft-slide-head">
        <div>
          <div className="slide-title-row">
            <h2>{def.title}</h2>
            <ChartHelp title={def.title} lead={def.lead} paragraphs={def.topics.map((t) => `${t.heading}: ${t.text}`)} />
          </div>
          <p className="gdp-sub">{def.lead}</p>
        </div>
        <span className="draft-status">Borrador</span>
      </header>
      <div className="draft-topics">
        {def.topics.map((t, i) => (
          <Reveal key={t.heading} k={`topic-${i}`} delay={i * 0.05} className="gdp-chart draft-card">
            <strong>{t.heading}</strong>
            <p>{t.text}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
