import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';
import { SCHEMA_FILES } from '../src/validation/schemaNames.js';
import { generateDeclarations, generateValidators } from './lib/validators.js';

export interface Io {
  stdout: (text: string) => void;
  stderr: (text: string) => void;
}

const defaultIo: Io = {
  stdout: (text) => process.stdout.write(text),
  stderr: (text) => process.stderr.write(text)
};

const USAGE = 'usage: gen-validators [--check] [--out FILE] [--schemas DIR]\n';

/** Line endings differ between a Windows checkout and the generated text; the content is what is compared. */
const normalize = (text: string) => text.replace(/\r\n/g, '\n');

/**
 * Compiles every schema of SCHEMA_FILES into src/validation/generated.js (and generated.d.ts next to it). With --check
 * it writes nothing and exits 1 when the committed files are not what the schemas generate.
 * Exit 0: done or up to date. Exit 1: --check found them stale. Exit 2: usage error or unreadable input.
 */
export function runCli(argv: string[], io: Io = defaultIo): number {
  let values: { check?: boolean; out?: string; schemas?: string };
  try {
    values = parseArgs({
      args: argv,
      options: { check: { type: 'boolean' }, out: { type: 'string' }, schemas: { type: 'string' } },
      strict: true
    }).values;
  } catch (error) {
    io.stderr(`${error instanceof Error ? error.message : String(error)}\n${USAGE}`);
    return 2;
  }

  const out = values.out ?? path.join('src', 'validation', 'generated.js');
  const declarations = out.replace(/\.js$/, '.d.ts');
  const schemasDir = values.schemas ?? path.join('..', 'data', 'schemas');

  try {
    const schemas = Object.fromEntries(
      Object.entries(SCHEMA_FILES).map(([name, stem]) => [name, JSON.parse(fs.readFileSync(path.join(schemasDir, `${stem}.schema.json`), 'utf8')) as object])
    );
    const files: Array<[string, string]> = [
      [out, generateValidators(schemas)],
      [declarations, generateDeclarations(Object.keys(SCHEMA_FILES))]
    ];

    if (values.check) {
      const stale = files.filter(([file, text]) => !fs.existsSync(file) || normalize(fs.readFileSync(file, 'utf8')) !== text);
      for (const [file] of stale) io.stderr(`${file} is out of date: run "npm run gen:validators" in web/ and commit it\n`);
      if (stale.length > 0) return 1;
      io.stdout('validators are up to date\n');
      return 0;
    }

    for (const [file, text] of files) fs.writeFileSync(file, text);
    io.stdout(`wrote ${out} and ${declarations}\n`);
    return 0;
  } catch (error) {
    io.stderr(`${error instanceof Error ? error.message : String(error)}\n`);
    return 2;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  process.exitCode = runCli(process.argv.slice(2));
}
