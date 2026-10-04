import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { SCHEMA_FILES } from '../../src/validation/schemaNames';
import type { SchemaName } from '../../src/validation/schemaNames';
import { errorsText, validator } from '../../src/validation/validators';
import * as generated from '../../src/validation/generated.js';
import { UCS2LENGTH_SOURCE, generateValidators } from '../../scripts/lib/validators';
import { runCli } from '../../scripts/gen-validators';

const SRC = path.resolve(__dirname, '../../src');
// the function exactly as the generated module contains it
const ucs2length = new Function(`${UCS2LENGTH_SOURCE}; return ucs2length;`)() as (text: string) => number;
const SCHEMAS = path.resolve(__dirname, '../../../data/schemas');

afterEach(() => vi.unstubAllGlobals());

describe('SCHEMA_FILES', () => {
  it('names these sixteen validators, each backed by an existing schema file', () => {
    expect(Object.keys(SCHEMA_FILES).sort()).toEqual([
      'aiEstimates',
      'andesEvents',
      'baseRates',
      'composition',
      'datasetCatalog',
      'economy',
      'externalForecasts',
      'forecast',
      'forecastVintages',
      'geoMeta',
      'population',
      'productionProjections',
      'projects',
      'provincesGeo',
      'references',
      'terrainMeta'
    ]);
    for (const stem of Object.values(SCHEMA_FILES)) {
      expect(fs.existsSync(path.join(SCHEMAS, `${stem}.schema.json`)), stem).toBe(true);
    }
  });

  it('every name has a generated validator', () => {
    for (const name of Object.keys(SCHEMA_FILES) as SchemaName[]) {
      expect(typeof (generated as Record<string, unknown>)[name], name).toBe('function');
    }
  });
});

describe('validator', () => {
  const record = { kind: 'gdp_by_sector', year: 2020, group: 'A', category: 'a-1', label: 'a1', value_usd: 5, source: 'S', retrieved_at: '2026-01-01' };

  it('accepts a valid document and rejects an invalid one with the Ajv error list', () => {
    const validate = validator('composition');
    expect(validate([record])).toBe(true);
    expect(validate([{ ...record, year: 1500 }])).toBe(false);
    expect(errorsText(validate.errors)).toBe('data/0/year must be >= 1810');
  });

  it('reports every error, not only the first', () => {
    const validate = validator('composition');
    expect(validate([{ ...record, year: 1500, label: '' }])).toBe(false);
    expect(errorsText(validate.errors)).toBe('data/0/year must be >= 1810, data/0/label must NOT have fewer than 1 characters');
  });

  it('checks the formats of the schema: dates', () => {
    const validate = validator('composition');
    expect(validate([{ ...record, retrieved_at: '2026-13-45' }])).toBe(false);
    expect(errorsText(validate.errors)).toContain('must match format "date"');
  });

  it('counts characters like Ajv does for minLength (surrogate pairs are one character)', () => {
    expect(ucs2length('abc')).toBe(3);
    expect(ucs2length('\u{1F1E6}\u{1F1F7}')).toBe(2);
    expect(ucs2length('')).toBe(0);
    expect(ucs2length('a\uD83D')).toBe(2); // a lone surrogate is one character
  });

  it('never builds code at run time: it works when Function() and eval are not available', () => {
    const validate = validator('composition');
    vi.stubGlobal(
      'Function',
      () => {
        throw new Error('Function() was called');
      }
    );
    expect(validate([record])).toBe(true);
    expect(validate([{ ...record, year: 1500 }])).toBe(false);
  });
});

describe('errorsText', () => {
  it('is empty for no errors and joins the errors with a comma', () => {
    expect(errorsText(null)).toBe('No errors');
    expect(errorsText(undefined)).toBe('No errors');
    expect(
      errorsText([
        { instancePath: '/a', schemaPath: '#', keyword: 'type', params: {}, message: 'must be string' },
        { instancePath: '', schemaPath: '#', keyword: 'required', params: {}, message: 'must have required property x' }
      ])
    ).toBe('data/a must be string, data must have required property x');
  });
});

describe('no validator is built in the browser', () => {
  it('no source file imports ajv or ajv-formats (the generator and the tests are the only users)', () => {
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (/\.(ts|tsx)$/.test(entry.name) && /from ['"]ajv/.test(fs.readFileSync(full, 'utf8'))) offenders.push(path.relative(SRC, full));
      }
    };
    walk(SRC);
    expect(offenders).toEqual([]);
  });

  it('the generated module has no require, no eval and no Function constructor', () => {
    const text = fs.readFileSync(path.join(SRC, 'validation', 'generated.js'), 'utf8');
    expect(text).not.toMatch(/\brequire\(/);
    expect(text).not.toMatch(/\beval\(/);
    expect(text).not.toMatch(/new Function/);
  });
});

describe('generateValidators', () => {
  it('turns schemas into a module with one exported function per name', () => {
    const code = generateValidators({ small: { type: 'object', required: ['a'], properties: { a: { type: 'integer' } } } });
    expect(code).toContain('export const small = ');
    expect(code).not.toMatch(/\brequire\(/);
  });
});

describe('gen-validators', () => {
  const out: string[] = [];
  const err: string[] = [];
  const io = { stdout: (t: string) => out.push(t), stderr: (t: string) => err.push(t) };

  it('--check passes: the committed generated module is what the schemas generate', () => {
    expect(runCli(['--check'], io)).toBe(0);
  });

  it('--check exits 1 and names the file when it is stale', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'validators-'));
    const stale = path.join(dir, 'generated.js');
    fs.writeFileSync(stale, '// old\n');
    err.length = 0;
    expect(runCli(['--check', '--out', stale], io)).toBe(1);
    expect(err.join('')).toContain(`${stale} is out of date`);
    fs.rmSync(dir, { recursive: true });
  });

  it('writes the module to --out, and the d.ts next to it', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'validators-'));
    const target = path.join(dir, 'generated.js');
    expect(runCli(['--out', target], io)).toBe(0);
    // a Windows checkout turns the committed files into CRLF; the content is what is compared
    const text = (file: string) => fs.readFileSync(file, 'utf8').replaceAll('\r\n', '\n');
    expect(text(target)).toBe(text(path.join(SRC, 'validation', 'generated.js')));
    expect(text(path.join(dir, 'generated.d.ts'))).toBe(text(path.join(SRC, 'validation', 'generated.d.ts')));
    fs.rmSync(dir, { recursive: true });
  });

  it('exits 2 for an unknown option', () => {
    err.length = 0;
    expect(runCli(['--nope'], io)).toBe(2);
    expect(err.join('')).toContain('usage: gen-validators');
  });
});
