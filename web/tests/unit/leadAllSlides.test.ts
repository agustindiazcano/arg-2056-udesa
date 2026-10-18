import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/** Slide by slide: the unit and the one-line description of a chart live inside its question mark, as the first (sky blue) line. */
const SLIDES = ['WorldStep', 'ChartStep', 'ProvinceStep', 'ResourcesStep', 'Rule70Step', 'CompositionStep', 'AiStep', 'ProductivityStep', 'DevelopmentStep', 'ForecastUncertaintyStep', 'ExportsStep'];

describe('units and descriptions inside the question marks', () => {
  for (const name of SLIDES) {
    it(`${name} passes a lead line to its ChartHelp`, () => {
      expect(readFileSync(`src/tour/${name}.tsx`, 'utf8')).toMatch(/<ChartHelp[^>]*\slead=|\slead=/);
    });
  }

  it('the subtitles no longer carry the units that moved into the question marks', () => {
    const read = (n: string) => readFileSync(`src/tour/${n}.tsx`, 'utf8');
    expect(read('AiStep')).not.toMatch(/\{GDP_UNIT\}, \{FIRST\}/);
    expect(read('ProvinceStep')).not.toMatch(/\{PRODUCTION_UNIT\} por año; elegí/);
    expect(read('ProductivityStep')).not.toMatch(/className="prod-unit"/);
    expect(read('ExportsStep')).not.toMatch(/\{metric === 'usd' \? 'miles de millones de USD' : 'porcentaje del total exportado'\} · <span/);
  });
});
