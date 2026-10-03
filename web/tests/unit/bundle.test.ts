import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import {
  closureOf,
  compare,
  dynamicChunks,
  entryNames,
  gzipSizes,
  initialViolations,
  measure,
  suggestedBudget,
  type Budgets,
  type ViteManifest
} from '../../scripts/lib/bundle';
import config from '../../vite.config';

// Shaped like the real web/dist/.vite/manifest.json: html entries, a chunk shared by both, one dynamic entry.
const MANIFEST: ViteManifest = {
  'index.html': {
    file: 'assets/index-A.js',
    src: 'index.html',
    isEntry: true,
    imports: ['_shared-B.js'],
    css: ['assets/index-A.css'],
    dynamicImports: ['src/lazy.ts']
  },
  'references.html': {
    file: 'assets/references-D.js',
    src: 'references.html',
    isEntry: true,
    imports: ['_shared-B.js'],
    css: ['assets/references-D.css']
  },
  '_shared-B.js': { file: 'assets/shared-B.js', imports: ['_vendor-C.js'], css: ['assets/shared-B.css'] },
  '_vendor-C.js': { file: 'assets/vendor-C.js' },
  'src/lazy.ts': {
    file: 'assets/lazy-E.js',
    src: 'src/lazy.ts',
    isDynamicEntry: true,
    imports: ['_vendor-C.js', '_lazyonly-F.js'],
    css: ['assets/lazy-E.css']
  },
  '_lazyonly-F.js': { file: 'assets/lazyonly-F.js' }
};

let dir: string;

/** Writes each file with distinct, compressible content and returns the independent gzip length of each. */
function writeFiles(files: string[]): Record<string, number> {
  const expected: Record<string, number> = {};
  files.forEach((file, i) => {
    const full = path.join(dir, file);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    const content = `${file}\n`.repeat(40 + i * 17) + 'x'.repeat(i * 31);
    fs.writeFileSync(full, content);
    expected[file] = gzipSync(content, { level: 9 }).length;
  });
  return expected;
}

const ALL_FILES = Object.values(MANIFEST).flatMap((c) => [c.file, ...(c.css ?? [])]);

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-test-'));
});
afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

describe('vite config', () => {
  it('writes a manifest', () => {
    expect(config.build?.manifest).toBe(true);
  });
});

describe('entryNames', () => {
  it('names the html entries main and references, in manifest order', () => {
    expect(entryNames(MANIFEST)).toEqual([
      { name: 'main', key: 'index.html' },
      { name: 'references', key: 'references.html' }
    ]);
  });
});

describe('closureOf', () => {
  it('includes the entry, its transitive static imports and every css, each once', () => {
    expect(closureOf(MANIFEST, 'index.html')).toEqual([
      'assets/index-A.css',
      'assets/index-A.js',
      'assets/shared-B.css',
      'assets/shared-B.js',
      'assets/vendor-C.js'
    ]);
  });

  it('excludes dynamic imports and their own imports and css', () => {
    const files = closureOf(MANIFEST, 'index.html');
    for (const f of ['assets/lazy-E.js', 'assets/lazy-E.css', 'assets/lazyonly-F.js']) expect(files).not.toContain(f);
  });

  it('a chunk shared by two entries is in the closure of each', () => {
    const refs = closureOf(MANIFEST, 'references.html');
    expect(refs).toEqual([
      'assets/references-D.css',
      'assets/references-D.js',
      'assets/shared-B.css',
      'assets/shared-B.js',
      'assets/vendor-C.js'
    ]);
    expect(closureOf(MANIFEST, 'index.html')).toEqual(expect.arrayContaining(['assets/shared-B.js', 'assets/vendor-C.js']));
  });

  it('counts a file once even when it is imported along two paths (diamond) or in a cycle', () => {
    const diamond: ViteManifest = {
      'e.html': { file: 'e.js', isEntry: true, imports: ['a', 'b'] },
      a: { file: 'a.js', imports: ['c'] },
      b: { file: 'b.js', imports: ['c', 'e.html'] },
      c: { file: 'c.js', css: ['c.css', 'c.css'] }
    };
    expect(closureOf(diamond, 'e.html')).toEqual(['a.js', 'b.js', 'c.css', 'c.js', 'e.js']);
  });

  it('throws for an unknown key and for an import that is not in the manifest', () => {
    expect(() => closureOf(MANIFEST, 'nope.html')).toThrow('manifest has no entry "nope.html"');
    const broken: ViteManifest = { 'e.html': { file: 'e.js', isEntry: true, imports: ['ghost'] } };
    expect(() => closureOf(broken, 'e.html')).toThrow('manifest has no entry "ghost"');
  });
});

describe('dynamicChunks', () => {
  it('lists the files reachable only through dynamic imports, per dynamic entry', () => {
    expect(dynamicChunks(MANIFEST)).toEqual([
      { key: 'src/lazy.ts', files: ['assets/lazy-E.css', 'assets/lazy-E.js', 'assets/lazyonly-F.js'] }
    ]);
  });

  it('is empty when the build has no dynamic entry', () => {
    const { 'src/lazy.ts': _lazy, '_lazyonly-F.js': _only, ...rest } = MANIFEST;
    expect(dynamicChunks(rest)).toEqual([]);
  });

  it('skips a dynamic entry whose files are all part of an initial load', () => {
    const m: ViteManifest = {
      'e.html': { file: 'e.js', isEntry: true, imports: ['s'], dynamicImports: ['d'] },
      s: { file: 's.js' },
      d: { file: 's.js', isDynamicEntry: true }
    };
    expect(dynamicChunks(m)).toEqual([]);
  });
});

describe('gzipSizes', () => {
  it('returns the gzip level 9 length of each file, equal to an independent computation', () => {
    const expected = writeFiles(ALL_FILES);
    const sizes = gzipSizes(ALL_FILES, dir);
    expect(sizes.map((s) => s.file)).toEqual(ALL_FILES);
    for (const s of sizes) expect(s.bytes, s.file).toBe(expected[s.file]);
  });

  it('throws naming the file when the manifest names a file that is missing', () => {
    writeFiles(['assets/a.js']);
    expect(() => gzipSizes(['assets/a.js', 'assets/gone.js'], dir)).toThrow(
      'file named by the manifest is missing: assets/gone.js'
    );
  });
});

describe('measure', () => {
  it('sums the closure per entry and sizes every dynamic chunk, counting the shared chunk once per entry', () => {
    const expected = writeFiles(ALL_FILES);
    const sum = (files: string[]) => files.reduce((total, f) => total + (expected[f] as number), 0);

    const result = measure(MANIFEST, dir);

    expect(result.initial).toEqual({
      main: sum(closureOf(MANIFEST, 'index.html')),
      references: sum(closureOf(MANIFEST, 'references.html'))
    });
    expect(result.chunks).toEqual({ 'src/lazy.ts': sum(['assets/lazy-E.css', 'assets/lazy-E.js', 'assets/lazyonly-F.js']) });
    // the shared files are in both initial loads
    const shared = sum(['assets/shared-B.css', 'assets/shared-B.js', 'assets/vendor-C.js']);
    expect(result.initial.main).toBe(sum(['assets/index-A.css', 'assets/index-A.js']) + shared);
    expect(result.initial.references).toBe(sum(['assets/references-D.css', 'assets/references-D.js']) + shared);
  });

  it('throws when a file of the manifest is missing', () => {
    writeFiles(ALL_FILES.filter((f) => f !== 'assets/vendor-C.js'));
    expect(() => measure(MANIFEST, dir)).toThrow('file named by the manifest is missing: assets/vendor-C.js');
  });
});

describe('compare', () => {
  const budgets: Budgets = { initial: { main: 1000, references: 500 }, chunk_max: 200 };

  it('returns one row per initial load and per chunk with its budget and verdict', () => {
    const rows = compare({ initial: { main: 900, references: 400 }, chunks: { 'src/lazy.ts': 150 } }, budgets);
    expect(rows).toEqual([
      { kind: 'initial', name: 'main', bytes: 900, budget: 1000, over: false },
      { kind: 'initial', name: 'references', bytes: 400, budget: 500, over: false },
      { kind: 'chunk', name: 'src/lazy.ts', bytes: 150, budget: 200, over: false }
    ]);
  });

  it('flags only what is strictly over its budget; equal is within', () => {
    const rows = compare({ initial: { main: 1001, references: 500 }, chunks: { a: 200, b: 201 } }, budgets);
    expect(rows.map((r) => [r.name, r.over])).toEqual([
      ['main', true],
      ['references', false],
      ['a', false],
      ['b', true]
    ]);
  });

  it('throws when an initial load has no budget', () => {
    expect(() => compare({ initial: { main: 1, other: 1 }, chunks: {} }, budgets)).toThrow(
      'no budget for the initial load "other"'
    );
  });
});

describe('suggestedBudget', () => {
  it('is the measured value times 1.15 rounded up to the next 1024 bytes', () => {
    expect(suggestedBudget(1000)).toBe(2048); // 1150 -> 2048
    expect(suggestedBudget(10000)).toBe(12288); // 11500 -> 12 * 1024
    expect(suggestedBudget(8192)).toBe(10240); // 9420.8 -> 10 * 1024
  });

  it('is 0 for 0 and rounds a value just past a multiple up to the next one', () => {
    expect(suggestedBudget(0)).toBe(0);
    expect(suggestedBudget(2000)).toBe(3072); // 2300 -> 3 * 1024
  });
});

// ---- initial-load assertions: no ECharts and no scene chunk in an initial load -------------------------------------

const SPLIT: ViteManifest = {
  'index.html': {
    file: 'assets/index-A.js',
    src: 'index.html',
    isEntry: true,
    imports: ['_react-R.js'],
    dynamicImports: ['src/scenes/economy/index.tsx', 'src/scenes/andes/index.tsx']
  },
  'references.html': { file: 'assets/references-D.js', src: 'references.html', isEntry: true, imports: ['_react-R.js'] },
  '_react-R.js': { file: 'assets/react-R.js', name: 'react' },
  '_echarts-E.js': { file: 'assets/echarts-E.js', name: 'echarts' },
  'src/scenes/economy/index.tsx': {
    file: 'assets/economy-S.js',
    src: 'src/scenes/economy/index.tsx',
    isDynamicEntry: true,
    imports: ['_react-R.js', '_echarts-E.js']
  },
  'src/scenes/andes/index.tsx': {
    file: 'assets/andes-T.js',
    src: 'src/scenes/andes/index.tsx',
    isDynamicEntry: true,
    imports: ['_react-R.js']
  }
};

describe('initialViolations', () => {
  it('finds nothing when ECharts and the scenes are only dynamic imports', () => {
    expect(initialViolations(SPLIT)).toEqual([]);
  });

  it('reports the ECharts chunk when main imports it statically', () => {
    const manifest: ViteManifest = {
      ...SPLIT,
      'index.html': { ...SPLIT['index.html']!, imports: ['_react-R.js', '_echarts-E.js'] }
    };
    expect(initialViolations(manifest)).toEqual([{ entry: 'main', file: 'assets/echarts-E.js', kind: 'echarts' }]);
  });

  it('reports the ECharts chunk when it arrives through another static import, and names the entry', () => {
    const manifest: ViteManifest = {
      ...SPLIT,
      '_react-R.js': { file: 'assets/react-R.js', name: 'react', imports: ['_echarts-E.js'] }
    };
    expect(initialViolations(manifest)).toEqual([
      { entry: 'main', file: 'assets/echarts-E.js', kind: 'echarts' },
      { entry: 'references', file: 'assets/echarts-E.js', kind: 'echarts' }
    ]);
  });

  it('reports a scene chunk that main imports statically', () => {
    const manifest: ViteManifest = {
      ...SPLIT,
      'index.html': { ...SPLIT['index.html']!, imports: ['_react-R.js', 'src/scenes/andes/index.tsx'] }
    };
    expect(initialViolations(manifest)).toEqual([{ entry: 'main', file: 'assets/andes-T.js', kind: 'scene' }]);
  });

  it('does not follow dynamic imports', () => {
    const manifest: ViteManifest = {
      ...SPLIT,
      'references.html': { ...SPLIT['references.html']!, dynamicImports: ['src/scenes/economy/index.tsx'] }
    };
    expect(initialViolations(manifest)).toEqual([]);
  });
});
