import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import crypto from 'node:crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function syncData(mockDir, processedDir, destDir) {
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  const manifestFiles = [];
  const hashList = [];

  const addFile = (dir, file, origin) => {
    if (file.startsWith('_') && file !== '_version.json') return;
    if (!file.endsWith('.json')) return;

    const content = fs.readFileSync(path.join(dir, file));
    fs.writeFileSync(path.join(destDir, file), content);
    
    // We only hash copied data files (not sources.json, maybe? "all copied data files" - assuming all .json copied)
    const hash = crypto.createHash('sha256').update(content).digest('hex');
    manifestFiles.push({ name: file, origin });
    hashList.push({ name: file, hash });
  };

  // 1. Start from mock
  if (fs.existsSync(mockDir)) {
    for (const file of fs.readdirSync(mockDir)) {
      addFile(mockDir, file, 'mock');
    }
  }

  // 2. Overlay processed
  if (fs.existsSync(processedDir)) {
    for (const file of fs.readdirSync(processedDir)) {
      // replace if exists
      const existing = manifestFiles.findIndex(m => m.name === file);
      if (existing !== -1) {
        manifestFiles.splice(existing, 1);
        const hi = hashList.findIndex(h => h.name === file);
        if (hi !== -1) hashList.splice(hi, 1);
      }
      addFile(processedDir, file, 'processed');
    }
  }

  manifestFiles.sort((a, b) => a.name.localeCompare(b.name));
  hashList.sort((a, b) => a.name.localeCompare(b.name));

  fs.writeFileSync(
    path.join(destDir, '_manifest.json'),
    JSON.stringify({ files: manifestFiles }, null, 2) + '\n'
  );

  const concat = hashList.map(h => `${h.name}:${h.hash}\n`).join('');
  const versionHash = crypto.createHash('sha256').update(concat).digest('hex').substring(0, 12);

  fs.writeFileSync(
    path.join(destDir, '_version.json'),
    JSON.stringify({ data_version: versionHash }, null, 2) + '\n'
  );
}

/** True when this module is the script node was started with (comparing file URLs works on Windows too). */
export function isMainModule(moduleUrl, entryPath) {
  return entryPath !== undefined && moduleUrl === pathToFileURL(path.resolve(entryPath)).href;
}

if (isMainModule(import.meta.url, process.argv[1])) {
  const root = path.join(__dirname, '..', '..');
  syncData(
    path.join(root, 'data', 'mock'),
    path.join(root, 'data', 'processed'),
    path.join(__dirname, '..', 'public', 'data')
  );
  console.log('Synced data to public/data/');
}
