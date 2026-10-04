import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';
import { mergeVercel, toHeadersFile } from './lib/headers.js';
import type { HeadersConfig } from './lib/headers.js';

export interface Io {
  stdout: (text: string) => void;
  stderr: (text: string) => void;
}

const defaultIo: Io = {
  stdout: (text) => process.stdout.write(text),
  stderr: (text) => process.stderr.write(text)
};

const USAGE = 'usage: gen-headers [--check] [--config FILE] [--dist DIR] [--vercel FILE]\n';

/**
 * Generates dist/_headers and the headers of vercel.json from headers.config.json. vercel.json lives at the repository
 * root (the Vercel project builds from the root); its other keys are kept. With --check it writes nothing and exits 1
 * when vercel.json is not what the config generates.
 * Exit 0: done (or up to date). Exit 1: --check found it out of date. Exit 2: usage error or unreadable input.
 */
export function runCli(argv: string[], io: Io = defaultIo): number {
  let values: { check?: boolean; config?: string; dist?: string; vercel?: string };
  try {
    values = parseArgs({
      args: argv,
      options: { check: { type: 'boolean' }, config: { type: 'string' }, dist: { type: 'string' }, vercel: { type: 'string' } },
      strict: true
    }).values;
  } catch (error) {
    io.stderr(`${error instanceof Error ? error.message : String(error)}\n${USAGE}`);
    return 2;
  }

  const configFile = values.config ?? 'headers.config.json';
  const dist = values.dist ?? 'dist';
  const vercelFile = values.vercel ?? path.join('..', 'vercel.json');

  try {
    const config = JSON.parse(fs.readFileSync(configFile, 'utf8')) as HeadersConfig;
    const existing = fs.existsSync(vercelFile) ? (JSON.parse(fs.readFileSync(vercelFile, 'utf8')) as Record<string, unknown>) : null;
    const merged = mergeVercel(existing, config);

    if (values.check) {
      if (JSON.stringify(existing?.headers ?? null) !== JSON.stringify(merged.headers)) {
        io.stderr(`${vercelFile} is out of date: run "npm run build" in web/ (or tsx scripts/gen-headers.ts) and commit it\n`);
        return 1;
      }
      io.stdout(`${vercelFile} is up to date\n`);
      return 0;
    }

    if (!fs.existsSync(dist)) {
      io.stderr(`dist folder not found: ${dist}\n`);
      return 2;
    }
    fs.writeFileSync(path.join(dist, '_headers'), toHeadersFile(config));
    fs.writeFileSync(vercelFile, `${JSON.stringify(merged, null, 2)}\n`);
    io.stdout(`wrote ${path.join(dist, '_headers')} and the headers of ${vercelFile}\n`);
    return 0;
  } catch (error) {
    io.stderr(`${error instanceof Error ? error.message : String(error)}\n`);
    return 2;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  process.exitCode = runCli(process.argv.slice(2));
}
