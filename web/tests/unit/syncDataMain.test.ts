import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { isMainModule } from '../../scripts/sync-data.mjs';

describe('isMainModule', () => {
  const script = path.resolve('scripts', 'sync-data.mjs');

  it('is true when the script path is the module that is running, on any platform', () => {
    expect(isMainModule(pathToFileURL(script).href, script)).toBe(true);
  });

  it('works with a relative path as given by node on the command line', () => {
    expect(isMainModule(pathToFileURL(script).href, path.join('scripts', 'sync-data.mjs'))).toBe(true);
  });

  it('works when the path has spaces, which a file URL percent-encodes', () => {
    const spaced = path.resolve('some folder', 'sync-data.mjs');
    expect(isMainModule(pathToFileURL(spaced).href, spaced)).toBe(true);
  });

  it('is false for another script or when there is no entry script', () => {
    expect(isMainModule(pathToFileURL(script).href, path.resolve('scripts', 'other.mjs'))).toBe(false);
    expect(isMainModule(pathToFileURL(script).href, undefined)).toBe(false);
  });
});
