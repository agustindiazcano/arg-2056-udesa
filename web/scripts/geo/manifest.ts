import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { GeoError } from './lib.js';

/**
 * TypeScript port of `verify_manifest` from `scripts/datapipe/manifest.py` (the data-pipeline loader is Python and
 * this tool runs in Node). Same checks, same reasons: every registered file exists and matches its sha256, no
 * path escapes the dataset folder, and no unregistered file is present. Messages read `<dataset> <path> <reason>`.
 */
export interface ManifestEntry {
  path: string;
  sha256: string;
  source: string;
  source_url?: string | null;
  retrieved_at: string;
  license_or_terms?: string | null;
  redistributable: boolean;
  private?: boolean;
  note?: string;
}

export function sha256File(file: string): string {
  return createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

/** Real location of a registered file; private files live in `<raw root>/_private/<dataset>/`. */
export function entryPath(entry: ManifestEntry, datasetId: string, datasetDir: string): string {
  return entry.private
    ? path.join(path.dirname(datasetDir), '_private', datasetId, entry.path)
    : path.join(datasetDir, entry.path);
}

function walk(dir: string, base: string, out: string[]): void {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) walk(full, base, out);
    else out.push(path.relative(base, full).split(path.sep).join('/'));
  }
}

export function verifyManifest(datasetId: string, datasetDir: string): ManifestEntry[] {
  const manifestPath = path.join(datasetDir, 'MANIFEST.json');
  if (!fs.existsSync(manifestPath)) throw new GeoError(`${datasetId} MANIFEST.json missing`);

  let manifest: { files?: ManifestEntry[] };
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch {
    throw new GeoError(`${datasetId} MANIFEST.json is not valid JSON`);
  }

  const entries = manifest.files ?? [];
  const registered = new Set<string>();
  for (const entry of entries) {
    if (entry.path.includes('..') || entry.path.startsWith('/') || entry.path.startsWith('\\')) {
      throw new GeoError(`${datasetId} ${entry.path} invalid path`);
    }
    const real = entryPath(entry, datasetId, datasetDir);
    if (!fs.existsSync(real)) throw new GeoError(`${datasetId} ${entry.path} file missing`);
    if (sha256File(real) !== entry.sha256) throw new GeoError(`${datasetId} ${entry.path} sha256 mismatch`);
    registered.add(entry.path);
  }

  const present: string[] = [];
  walk(datasetDir, datasetDir, present);
  for (const file of present) {
    if (file !== 'MANIFEST.json' && !registered.has(file)) {
      throw new GeoError(`${datasetId} ${file} unregistered file present`);
    }
  }
  return entries;
}
