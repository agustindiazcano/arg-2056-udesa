import fs from 'fs';
import path from 'path';

// Fix resourcesScene.test.tsx cleanup
let rsContent = fs.readFileSync('tests/unit/resourcesScene.test.tsx', 'utf8');
if (!rsContent.includes('afterEach(cleanup)')) {
  rsContent = rsContent.replace(
    "import { render, screen, fireEvent } from '@testing-library/react';",
    "import { render, screen, fireEvent, cleanup } from '@testing-library/react';"
  );
  rsContent = rsContent.replace(
    "import { describe, it, expect, vi, beforeEach } from 'vitest';",
    "import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';"
  );
  rsContent = rsContent.replace(
    "beforeEach(() => {",
    "afterEach(cleanup);\n  beforeEach(() => {"
  );
  fs.writeFileSync('tests/unit/resourcesScene.test.tsx', rsContent);
}

// Fix tokens.test.ts path
let tokenContent = fs.readFileSync('tests/unit/tokens.test.ts', 'utf8');
tokenContent = tokenContent.replace(
  "const cssPath = join(new URL('.', import.meta.url).pathname, '../../src/styles/tokens.css');",
  "const cssPath = join(process.cwd(), 'src/styles/tokens.css');"
);
fs.writeFileSync('tests/unit/tokens.test.ts', tokenContent);
