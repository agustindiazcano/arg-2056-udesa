import { createHash } from 'node:crypto';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { runCli } from '../../../scripts/geo/build-provinces.js';
import { SIMPLIFICATION_ALGORITHM } from '../../../scripts/geo/lib.js';
import { parseProvincesGeo } from '../../../src/geo/provinces.js';
import { parseGeoMeta } from '../../../src/geo/meta.js';
import { PROVINCES } from '../../../src/types/province.js';
import { baseConfig, gridCollection } from './geoFixtures.js';

const roots: string[] = [];

afterEach(() => {
  vi.restoreAllMocks();
  for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});

interface Setup {
  root: string;
  raw: string;
  config: string;
  out: string;
  dataset: string;
}

function setup(configOverrides: Record<string, unknown> = {}, register = true): Setup {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'geo-cli-'));
  roots.push(root);
  const raw = path.join(root, 'raw');
  const dataset = path.join(raw, 'geo_example');
  fs.mkdirSync(dataset, { recursive: true });
  const input = Buffer.from(JSON.stringify(gridCollection()));
  fs.writeFileSync(path.join(dataset, 'input.geojson'), input);
  if (register) {
    const manifest = {
      dataset_id: 'geo_example',
      files: [
        {
          path: 'input.geojson',
          sha256: createHash('sha256').update(input).digest('hex'),
          source: 'Example source',
          source_url: 'https://example.com/provinces',
          retrieved_at: '2026-01-01',
          license_or_terms: 'Example terms',
          redistributable: true
        }
      ]
    };
    fs.writeFileSync(path.join(dataset, 'MANIFEST.json'), JSON.stringify(manifest, null, 2));
  }
  const config = path.join(root, 'config.json');
  fs.writeFileSync(config, JSON.stringify(baseConfig(configOverrides)));
  return { root, raw, config, out: path.join(root, 'out'), dataset };
}

function run(s: Setup, extra: string[] = [], attribution = 'Example attribution', out = s.out) {
  const stdout: string[] = [];
  const stderr: string[] = [];
  const code = runCli(
    ['--config', s.config, '--attribution', attribution, '--raw-root', s.raw, '--out-root', out, ...extra],
    { stdout: (t) => stdout.push(t), stderr: (t) => stderr.push(t) }
  );
  return { code, stdout: stdout.join(''), stderr: stderr.join('') };
}

const listing = (dir: string) => (fs.existsSync(dir) ? fs.readdirSync(dir).sort() : []);

describe('build-provinces CLI', () => {
  it('writes both files and the metadata equals the expected object exactly', () => {
    const s = setup();
    const result = run(s);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain('OK provinces.geojson');
    expect(listing(s.out)).toEqual(['provinces.geojson', 'provinces.meta.json']);

    const geojsonPath = path.join(s.out, 'provinces.geojson');
    const meta = JSON.parse(fs.readFileSync(path.join(s.out, 'provinces.meta.json'), 'utf8'));
    const inputHash = createHash('sha256').update(fs.readFileSync(path.join(s.dataset, 'input.geojson'))).digest('hex');
    expect(meta).toEqual({
      source: 'Example source',
      source_url: 'https://example.com/provinces',
      retrieved_at: '2026-01-01',
      license_or_terms: 'Example terms',
      attribution: 'Example attribution',
      input_sha256: inputHash,
      simplification: {
        algorithm: SIMPLIFICATION_ALGORITHM,
        parameter: 0,
        vertices_before: 120,
        vertices_after: 120,
        bytes: fs.statSync(geojsonPath).size
      },
      dropped_polygons: [],
      area_change_pct: Object.fromEntries(PROVINCES.map((p) => [p.id, 0])),
      provinces_count: 24,
      generated_by: 'web/scripts/geo'
    });
    expect(Object.keys(meta)).toEqual([
      'source', 'source_url', 'retrieved_at', 'license_or_terms', 'attribution', 'input_sha256',
      'simplification', 'dropped_polygons', 'area_change_pct', 'provinces_count', 'generated_by'
    ]);
    expect(() => parseGeoMeta(meta)).not.toThrow();
    expect(parseProvincesGeo(JSON.parse(fs.readFileSync(geojsonPath, 'utf8'))).features).toHaveLength(24);
  });

  it('copies null source fields from the manifest as null', () => {
    const s = setup();
    const manifestPath = path.join(s.dataset, 'MANIFEST.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    delete manifest.files[0].source_url;
    manifest.files[0].license_or_terms = null;
    fs.writeFileSync(manifestPath, JSON.stringify(manifest));
    expect(run(s).code).toBe(0);
    const meta = JSON.parse(fs.readFileSync(path.join(s.out, 'provinces.meta.json'), 'utf8'));
    expect(meta.source_url).toBeNull();
    expect(meta.license_or_terms).toBeNull();
  });

  it('writes nothing when a gate fails', () => {
    const s = setup({ target_max_bytes: 10 });
    const result = run(s);
    expect(result.code).toBe(1);
    expect(result.stderr).toMatch(/^ERROR build cannot fit target_max_bytes 10: achieved size \d+ bytes/);
    expect(listing(s.out)).toEqual([]);
  });

  it('gives byte-identical files on two runs', () => {
    const s = setup();
    const second = path.join(s.root, 'out2');
    expect(run(s).code).toBe(0);
    expect(run(s, [], 'Example attribution', second).code).toBe(0);
    for (const name of ['provinces.geojson', 'provinces.meta.json']) {
      expect(fs.readFileSync(path.join(second, name)).equals(fs.readFileSync(path.join(s.out, name)))).toBe(true);
    }
  });

  it('fails through the manifest check for an unregistered file', () => {
    const s = setup();
    fs.writeFileSync(path.join(s.dataset, 'extra.txt'), 'x');
    const result = run(s);
    expect(result.code).toBe(1);
    expect(result.stderr).toContain('ERROR manifest geo_example extra.txt unregistered file present');
    expect(listing(s.out)).toEqual([]);
  });

  it('fails through the manifest check for a hash mismatch', () => {
    const s = setup();
    fs.appendFileSync(path.join(s.dataset, 'input.geojson'), ' ');
    const result = run(s);
    expect(result.code).toBe(1);
    expect(result.stderr).toContain('ERROR manifest geo_example input.geojson sha256 mismatch');
  });

  it('fails when a registered file is missing', () => {
    const s = setup();
    fs.rmSync(path.join(s.dataset, 'input.geojson'));
    expect(run(s).stderr).toContain('ERROR manifest geo_example input.geojson file missing');
  });

  it('fails when the manifest is missing', () => {
    const s = setup({}, false);
    expect(run(s).stderr).toContain('ERROR manifest geo_example MANIFEST.json missing');
  });

  it('fails when the input file is not registered in the manifest', () => {
    const s = setup({ input_file: 'other.geojson' });
    expect(run(s).stderr).toContain('ERROR manifest geo_example other.geojson is not registered');
  });

  it('fails with ERROR config for an invalid config', () => {
    const map = baseConfig().id_map as Record<string, string>;
    delete map.P24;
    const s = setup({ id_map: map });
    const result = run(s);
    expect(result.code).toBe(1);
    expect(result.stderr).toContain('ERROR config id_map is missing province id AR-Z');
  });

  it('fails with ERROR config when the config file is missing or not JSON', () => {
    const s = setup();
    fs.rmSync(s.config);
    expect(run(s).stderr).toContain('ERROR config cannot read');
    fs.writeFileSync(s.config, '{nope');
    expect(run(s).stderr).toContain('ERROR config file is not valid JSON');
  });

  it('fails with ERROR input when the input is not valid JSON', () => {
    const s = setup();
    const bad = Buffer.from('{nope');
    fs.writeFileSync(path.join(s.dataset, 'input.geojson'), bad);
    const manifestPath = path.join(s.dataset, 'MANIFEST.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    manifest.files[0].sha256 = createHash('sha256').update(bad).digest('hex');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest));
    expect(run(s).stderr).toContain('ERROR input input.geojson is not valid JSON');
  });

  it.each([
    ['no arguments', []],
    ['an unknown flag', ['--config', 'c.json', '--attribution', 'A', '--nope']],
    ['no attribution', ['--config', 'c.json']],
    ['no config', ['--attribution', 'A']]
  ])('exits 2 on a usage error: %s', (_name, argv) => {
    const stderr: string[] = [];
    const code = runCli(argv, { stdout: () => undefined, stderr: (t) => stderr.push(t) });
    expect(code).toBe(2);
    expect(stderr.join('')).toContain('usage error');
  });

  it('exits 2 on an empty attribution', () => {
    const s = setup();
    const result = run(s, [], '   ');
    expect(result.code).toBe(2);
    expect(result.stderr).toContain('usage error: --attribution must be non-empty');
  });

  it('never touches the network', () => {
    const blocked = (what: string) => () => {
      throw new Error(`network access attempted: ${what}`);
    };
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(blocked('fetch'));
    const connectSpy = vi.spyOn(net.Socket.prototype, 'connect').mockImplementation(blocked('net.Socket.connect'));
    const createSpy = vi.spyOn(net, 'createConnection').mockImplementation(blocked('net.createConnection'));
    const s = setup();
    expect(run(s).code).toBe(0);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(connectSpy).not.toHaveBeenCalled();
    expect(createSpy).not.toHaveBeenCalled();
  });
});
