import { describe, expect, it } from 'vitest';
import { REFERENCES } from '../../src/datasets/references';

const ref = (id: string) => REFERENCES.find((r) => r.id === id);

// The productivity sources that were "not verified" until 2026-10-14 (docs/data-requests.md, D2 to D8).
describe('the productivity references after the verification of 2026-10-14', () => {
  it('has the article of Baumann Fonay as read, and the Alphacast series at the address the article cites', () => {
    expect(ref('P2')!.status).toBe('leída');
    expect(ref('P2')!.label).not.toMatch(/no verificada/);
    expect(ref('P3')!.url).toBe('https://www.alphacast.io/datasets/potential-gross-domestic-product-output-gap-tfp-9670');
  });

  it('has the original METR study and its arXiv paper, both read', () => {
    expect(ref('P10c')).toMatchObject({ status: 'leída', url: 'https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/' });
    expect(ref('P10d')).toMatchObject({ status: 'leída', url: 'https://arxiv.org/abs/2507.09089' });
  });

  it('has the Hacienda 2018 document with its address, but not as read (its text could not be extracted)', () => {
    expect(ref('P5')).toMatchObject({ status: 'citada', url: 'https://www.argentina.gob.ar/sites/default/files/crecimiento-economico-ptf-y-pib-potencial-en-argentina_1.pdf' });
  });

  it('keeps every id unique', () => {
    const ids = REFERENCES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
