import fs from 'fs';

// fix echart.test.tsx environment
let echartContent = fs.readFileSync('web/tests/unit/echart.test.tsx', 'utf8');
if (!echartContent.includes('@vitest-environment')) {
  echartContent = '// @vitest-environment jsdom\n' + echartContent;
}
fs.writeFileSync('web/tests/unit/echart.test.tsx', echartContent);

// fix resourcesScene.test.tsx cleanup import
let rsContent = fs.readFileSync('web/tests/unit/resourcesScene.test.tsx', 'utf8');
if (!rsContent.includes('cleanup }')) {
  rsContent = rsContent.replace(
    "import { render, screen, fireEvent } from '@testing-library/react';",
    "import { render, screen, fireEvent, cleanup } from '@testing-library/react';"
  );
}
fs.writeFileSync('web/tests/unit/resourcesScene.test.tsx', rsContent);

// Update PENDING.md
let pending = fs.readFileSync('PENDING.md', 'utf8');
pending = pending.replace(
  "6. [ ] `scene-resources`: treemap, bars, critical resources, investment and production.",
  "6. [x] `scene-resources`: treemap, bars, critical resources, investment and production."
);
fs.writeFileSync('PENDING.md', pending);
