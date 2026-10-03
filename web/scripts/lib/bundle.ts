import fs from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

/** One entry of web/dist/.vite/manifest.json (the fields this tool reads). */
export interface ManifestChunk {
  file: string;
  src?: string;
  isEntry?: boolean;
  isDynamicEntry?: boolean;
  imports?: string[];
  dynamicImports?: string[];
  css?: string[];
}

export type ViteManifest = Record<string, ManifestChunk>;

export interface Budgets {
  _note?: string;
  /** gzip bytes allowed for the initial load of each html entry, by entry name (main, references) */
  initial: Record<string, number>;
  /** gzip bytes allowed for any one dynamic chunk */
  chunk_max: number;
}

export interface BundleSizes {
  initial: Record<string, number>;
  chunks: Record<string, number>;
}

export interface BudgetRow {
  kind: 'initial' | 'chunk';
  name: string;
  bytes: number;
  budget: number;
  over: boolean;
}

function chunkOf(manifest: ViteManifest, key: string): ManifestChunk {
  const chunk = manifest[key];
  if (!chunk) throw new Error(`manifest has no entry "${key}"`);
  return chunk;
}

/** The html entries of the build, named like the vite inputs: index.html is `main`. In manifest order. */
export function entryNames(manifest: ViteManifest): Array<{ name: string; key: string }> {
  return Object.entries(manifest)
    .filter(([key, chunk]) => chunk.isEntry === true && key.endsWith('.html'))
    .map(([key]) => {
      const base = path.basename(key, '.html');
      return { name: base === 'index' ? 'main' : base, key };
    });
}

/**
 * Every file needed to load `entryKey`: its own file, the files of its transitive static imports and all their css,
 * each once, sorted. Dynamic imports are not followed.
 */
export function closureOf(manifest: ViteManifest, entryKey: string): string[] {
  const files = new Set<string>();
  const seen = new Set<string>();
  const visit = (key: string) => {
    if (seen.has(key)) return;
    seen.add(key);
    const chunk = chunkOf(manifest, key);
    files.add(chunk.file);
    for (const css of chunk.css ?? []) files.add(css);
    for (const imported of chunk.imports ?? []) visit(imported);
  };
  visit(entryKey);
  return [...files].sort();
}

/** For each dynamic entry, the files that no initial load already has. Entries left with no files are skipped. */
export function dynamicChunks(manifest: ViteManifest): Array<{ key: string; files: string[] }> {
  const initial = new Set(entryNames(manifest).flatMap(({ key }) => closureOf(manifest, key)));
  const chunks: Array<{ key: string; files: string[] }> = [];
  for (const [key, chunk] of Object.entries(manifest)) {
    if (chunk.isDynamicEntry !== true) continue;
    const files = closureOf(manifest, key).filter((file) => !initial.has(file));
    if (files.length > 0) chunks.push({ key, files });
  }
  return chunks;
}

/** gzip (level 9) size in bytes of each file under `dir`, in the order given. A missing file is an error. */
export function gzipSizes(files: readonly string[], dir: string): Array<{ file: string; bytes: number }> {
  return files.map((file) => {
    const full = path.join(dir, file);
    if (!fs.existsSync(full)) throw new Error(`file named by the manifest is missing: ${file}`);
    return { file, bytes: gzipSync(fs.readFileSync(full), { level: 9 }).length };
  });
}

function total(files: readonly string[], dir: string): number {
  return gzipSizes(files, dir).reduce((sum, { bytes }) => sum + bytes, 0);
}

/** Sizes of the initial load of every html entry and of every dynamic chunk. Shared files count once per entry. */
export function measure(manifest: ViteManifest, dir: string): BundleSizes {
  const initial: Record<string, number> = {};
  for (const { name, key } of entryNames(manifest)) initial[name] = total(closureOf(manifest, key), dir);
  const chunks: Record<string, number> = {};
  for (const { key, files } of dynamicChunks(manifest)) chunks[key] = total(files, dir);
  return { initial, chunks };
}

/** One row per initial load and per chunk, with its budget and whether it is strictly over it. */
export function compare(sizes: BundleSizes, budgets: Budgets): BudgetRow[] {
  const rows: BudgetRow[] = [];
  for (const [name, bytes] of Object.entries(sizes.initial)) {
    const budget = budgets.initial[name];
    if (budget === undefined) throw new Error(`no budget for the initial load "${name}"`);
    rows.push({ kind: 'initial', name, bytes, budget, over: bytes > budget });
  }
  for (const [name, bytes] of Object.entries(sizes.chunks)) {
    rows.push({ kind: 'chunk', name, bytes, budget: budgets.chunk_max, over: bytes > budgets.chunk_max });
  }
  return rows;
}

/** The measured value times 1.15, rounded up to the next 1024 bytes: how the first budgets were set. */
export function suggestedBudget(bytes: number): number {
  return Math.ceil((bytes * 1.15) / 1024) * 1024;
}
