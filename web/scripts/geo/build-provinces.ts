import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';
import { parseGeoMeta } from '../../src/geo/meta.js';
import { parseProvincesGeo } from '../../src/geo/provinces.js';
import { buildProvinces, GeoError, validateConfig } from './lib.js';
import type { BuildResult, GeoConfig } from './lib.js';
import { entryPath, verifyManifest } from './manifest.js';
import type { ManifestEntry } from './manifest.js';

export interface Io {
  stdout: (text: string) => void;
  stderr: (text: string) => void;
}

const defaultIo: Io = {
  stdout: (text) => process.stdout.write(text),
  stderr: (text) => process.stderr.write(text)
};

function writeAtomically(files: Array<[string, string]>): void {
  const temps: Array<[string, string]> = [];
  try {
    for (const [file, content] of files) {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      const temp = path.join(path.dirname(file), `.${path.basename(file)}.tmp`);
      fs.writeFileSync(temp, content);
      temps.push([temp, file]);
    }
    for (const [temp, file] of temps) fs.renameSync(temp, file);
  } finally {
    for (const [temp] of temps) fs.rmSync(temp, { force: true });
  }
}

/** Runs one stage; a GeoError becomes `ERROR <stage> <reason>`, anything else is a bug and is rethrown. */
function stage<T>(label: string, io: Io, body: () => T): { ok: true; value: T } | { ok: false } {
  try {
    return { ok: true, value: body() };
  } catch (err) {
    if (!(err instanceof GeoError)) throw err;
    io.stderr(`ERROR ${label} ${err.message}\n`);
    return { ok: false };
  }
}

function readJson(file: string, what: string): unknown {
  let text: string;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch {
    throw new GeoError(`cannot read ${file}`);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new GeoError(`${what} is not valid JSON`);
  }
}

/** Runs the build. Exit codes: 0 success, 1 validation or processing error, 2 usage error. */
export function runCli(argv: string[], io: Io = defaultIo): number {
  let values: { config?: string; attribution?: string; 'raw-root'?: string; 'out-root'?: string };
  try {
    values = parseArgs({
      args: argv,
      strict: true,
      options: {
        config: { type: 'string' },
        attribution: { type: 'string' },
        'raw-root': { type: 'string' },
        'out-root': { type: 'string' }
      }
    }).values;
  } catch (err) {
    io.stderr(`usage error: ${err instanceof Error ? err.message : String(err)}\n`);
    return 2;
  }
  if (!values.config || values.attribution === undefined) {
    io.stderr('usage error: --config and --attribution are required\n');
    return 2;
  }
  if (values.attribution.trim() === '') {
    io.stderr('usage error: --attribution must be non-empty\n');
    return 2;
  }
  const configPath = values.config;
  const attribution = values.attribution;
  const rawRoot = values['raw-root'] ?? 'data/raw';
  const outRoot = values['out-root'] ?? 'web/public/geo';

  const config = stage<GeoConfig>('config', io, () => validateConfig(readJson(configPath, 'file')));
  if (!config.ok) return 1;
  const cfg = config.value;

  const datasetDir = path.join(rawRoot, cfg.dataset_id);
  const manifest = stage<ManifestEntry[]>('manifest', io, () => verifyManifest(cfg.dataset_id, datasetDir));
  if (!manifest.ok) return 1;
  const entry = manifest.value.find((e) => e.path === cfg.input_file);
  if (!entry) {
    io.stderr(`ERROR manifest ${cfg.dataset_id} ${cfg.input_file} is not registered\n`);
    return 1;
  }

  const input = stage<unknown>('input', io, () =>
    readJson(entryPath(entry, cfg.dataset_id, datasetDir), cfg.input_file)
  );
  if (!input.ok) return 1;

  const built = stage<BuildResult>('build', io, () => buildProvinces(input.value, cfg));
  if (!built.ok) return 1;
  const result = built.value;

  const meta = {
    source: entry.source,
    source_url: entry.source_url ?? null,
    retrieved_at: entry.retrieved_at,
    license_or_terms: entry.license_or_terms ?? null,
    attribution,
    input_sha256: entry.sha256,
    simplification: result.meta.simplification,
    dropped_polygons: result.meta.dropped_polygons,
    area_change_pct: result.meta.area_change_pct,
    provinces_count: 24,
    generated_by: 'web/scripts/geo'
  };
  try {
    parseGeoMeta(meta);
    parseProvincesGeo(JSON.parse(result.geojson));
  } catch (err) {
    io.stderr(`ERROR build output does not match its schema: ${err instanceof Error ? err.message : String(err)}\n`);
    return 1;
  }

  writeAtomically([
    [path.join(outRoot, 'provinces.geojson'), result.geojson],
    [path.join(outRoot, 'provinces.meta.json'), JSON.stringify(meta, null, 2) + '\n']
  ]);
  io.stdout(`OK provinces.geojson ${result.meta.simplification.bytes} bytes\n`);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  process.exitCode = runCli(process.argv.slice(2));
}
