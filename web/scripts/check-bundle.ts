import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';
import { compare, measure, suggestedBudget } from './lib/bundle.js';
import type { Budgets, BundleSizes, ViteManifest } from './lib/bundle.js';

export interface Io {
  stdout: (text: string) => void;
  stderr: (text: string) => void;
}

const defaultIo: Io = {
  stdout: (text) => process.stdout.write(text),
  stderr: (text) => process.stderr.write(text)
};

const USAGE = 'usage: check-bundle [--report] [--dist DIR] [--budgets FILE]\n';

function table(rows: string[][]): string {
  const widths = rows[0]!.map((_, i) => Math.max(...rows.map((row) => row[i]!.length)));
  return rows.map((row) => row.map((cell, i) => cell.padEnd(widths[i]!)).join('  ').trimEnd()).join('\n') + '\n';
}

function readBudgets(file: string): Budgets {
  const parsed: unknown = JSON.parse(fs.readFileSync(file, 'utf8'));
  const b = parsed as Partial<Budgets> | null;
  if (!b || typeof b.initial !== 'object' || b.initial === null || typeof b.chunk_max !== 'number') {
    throw new Error('budgets file is invalid: expected { "initial": { name: bytes }, "chunk_max": bytes }');
  }
  return b as Budgets;
}

function reportTable(sizes: BundleSizes): string {
  const rows = [['kind', 'name', 'gzip bytes', 'suggested budget']];
  for (const [name, bytes] of Object.entries(sizes.initial)) {
    rows.push(['initial', name, String(bytes), String(suggestedBudget(bytes))]);
  }
  for (const [name, bytes] of Object.entries(sizes.chunks)) {
    rows.push(['chunk', name, String(bytes), String(suggestedBudget(bytes))]);
  }
  return table(rows);
}

/** Exit 0: within budget (or --report). Exit 1: something is over budget. Exit 2: usage error or unreadable input. */
export function runCli(argv: string[], io: Io = defaultIo): number {
  let values: { report?: boolean; dist?: string; budgets?: string };
  try {
    values = parseArgs({
      args: argv,
      options: {
        report: { type: 'boolean' },
        dist: { type: 'string' },
        budgets: { type: 'string' }
      },
      strict: true
    }).values;
  } catch (error) {
    io.stderr(`${error instanceof Error ? error.message : String(error)}\n${USAGE}`);
    return 2;
  }

  const dist = values.dist ?? 'dist';
  const budgetsFile = values.budgets ?? 'budgets.json';
  const manifestFile = path.join(dist, '.vite', 'manifest.json');

  try {
    if (!fs.existsSync(manifestFile)) {
      io.stderr(`manifest not found: ${manifestFile}\n`);
      return 2;
    }
    const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8')) as ViteManifest;
    const sizes = measure(manifest, dist);

    if (values.report) {
      io.stdout(reportTable(sizes));
      return 0;
    }

    if (!fs.existsSync(budgetsFile)) {
      io.stderr(`budgets file not found: ${budgetsFile}\n`);
      return 2;
    }
    const rows = compare(sizes, readBudgets(budgetsFile));
    io.stdout(
      table([
        ['kind', 'name', 'gzip bytes', 'budget', 'status'],
        ...rows.map((r) => [r.kind, r.name, String(r.bytes), String(r.budget), r.over ? 'OVER' : 'ok'])
      ])
    );
    const over = rows.filter((r) => r.over).length;
    if (over > 0) {
      io.stdout(`${over} over budget\n`);
      return 1;
    }
    return 0;
  } catch (error) {
    io.stderr(`${error instanceof Error ? error.message : String(error)}\n`);
    return 2;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  process.exitCode = runCli(process.argv.slice(2));
}
