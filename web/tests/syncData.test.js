import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { syncData } from '../scripts/sync-data.mjs';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

describe('syncData', () => {
  const tmpDir = path.join(__dirname, 'tmp_sync');
  const mockDir = path.join(tmpDir, 'mock');
  const processedDir = path.join(tmpDir, 'processed');
  const destDir = path.join(tmpDir, 'public_data');

  beforeEach(() => {
    fs.mkdirSync(mockDir, { recursive: true });
    fs.mkdirSync(processedDir, { recursive: true });
    fs.mkdirSync(destDir, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('empty processed equals old mock behavior plus new files', () => {
    fs.writeFileSync(path.join(mockDir, 'population.json'), '{"mock":true}');
    fs.writeFileSync(path.join(mockDir, 'other.json'), '{"mock":true}');
    fs.writeFileSync(path.join(mockDir, '_hidden.json'), '{"hidden":true}');

    syncData(mockDir, processedDir, destDir);

    expect(fs.existsSync(path.join(destDir, 'population.json'))).toBe(true);
    expect(fs.existsSync(path.join(destDir, 'other.json'))).toBe(true);
    expect(fs.existsSync(path.join(destDir, '_hidden.json'))).toBe(false);

    const manifest = JSON.parse(fs.readFileSync(path.join(destDir, '_manifest.json'), 'utf-8'));
    expect(manifest.files).toEqual([
      { name: 'other.json', origin: 'mock' },
      { name: 'population.json', origin: 'mock' }
    ]);

    const version = JSON.parse(fs.readFileSync(path.join(destDir, '_version.json'), 'utf-8'));
    expect(version.data_version).toMatch(/^[0-9a-f]{12}$/);
    
    // verify exact hash logic
    const h1 = crypto.createHash('sha256').update('{"mock":true}').digest('hex');
    const concat = `other.json:${h1}\npopulation.json:${h1}\n`;
    const expectedHash = crypto.createHash('sha256').update(concat).digest('hex').substring(0, 12);
    expect(version.data_version).toBe(expectedHash);
  });

  it('processed overrides mock', () => {
    fs.writeFileSync(path.join(mockDir, 'population.json'), '{"mock":true}');
    fs.writeFileSync(path.join(processedDir, 'population.json'), '{"processed":true}');
    fs.writeFileSync(path.join(processedDir, 'sources.json'), '[]');

    syncData(mockDir, processedDir, destDir);

    const pop = fs.readFileSync(path.join(destDir, 'population.json'), 'utf-8');
    expect(pop).toBe('{"processed":true}');

    const manifest = JSON.parse(fs.readFileSync(path.join(destDir, '_manifest.json'), 'utf-8'));
    expect(manifest.files).toEqual([
      { name: 'population.json', origin: 'processed' },
      { name: 'sources.json', origin: 'processed' }
    ]);
  });
});
