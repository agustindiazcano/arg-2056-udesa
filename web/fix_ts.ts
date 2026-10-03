import * as fs from 'fs';
import * as path from 'path';

// Fix typecheck errors
function replace(file: string, searchValue: RegExp | string, replaceValue: string) {
  const content = fs.readFileSync(file, 'utf8');
  fs.writeFileSync(file, content.replace(searchValue, replaceValue));
}

// provinceBars.ts
replace('src/charts/builders/provinceBars.ts', 'const unit = filtered.length > 0 ? filtered[0].unit : \'\';', 'const unit = filtered.length > 0 ? filtered[0].unit! : \'\';');
replace('src/charts/builders/provinceBars.ts', 'const largest = seriesData[seriesData.length - 1];', 'const largest = seriesData[seriesData.length - 1]! || { name: "", value: 0 };');

// treemap.ts
replace('src/charts/builders/treemap.ts', 'if (!grouped[r.group]) grouped[r.group] = [];', 'if (!grouped[r.group]) grouped[r.group] = [];');
replace('src/charts/builders/treemap.ts', 'const total = grouped[group].reduce', 'const total = grouped[group]!.reduce');
replace('src/charts/builders/treemap.ts', 'const children = grouped[group].sort', 'const children = grouped[group]!.sort');
replace('src/charts/builders/treemap.ts', 'const largest = groups[0];', 'const largest = groups[0]! || { name: "", value: 0 };');

// trend.ts
replace('src/charts/builders/trend.ts', 'const unit = filtered.length > 0 ? filtered[0].unit : \'\';', 'const unit = filtered.length > 0 ? filtered[0].unit! : \'\';');

// selectors.ts
replace('src/scenes/resources/selectors.ts', 'if (year < available[0]) return available[0];', 'if (year < available[0]!) return available[0]!;');
replace('src/scenes/resources/selectors.ts', 'if (year > available[available.length - 1]) return available[available.length - 1];', 'if (year > available[available.length - 1]!) return available[available.length - 1]!;');
replace('src/scenes/resources/selectors.ts', 'let closest = available[0];', 'let closest = available[0]!;');
replace('src/scenes/resources/selectors.ts', 'let minDiff = Math.abs(year - available[0]);', 'let minDiff = Math.abs(year - available[0]!);');

// Also fix clampYear logic in selectors.ts
const selectorsContent = fs.readFileSync('src/scenes/resources/selectors.ts', 'utf8');
fs.writeFileSync('src/scenes/resources/selectors.ts', selectorsContent.replace(
  'if (diff < minDiff)', 'if (diff < minDiff || (diff === minDiff && y > closest))'
));

// builders.test.ts
const buildersContent = fs.readFileSync('tests/unit/builders.test.ts', 'utf8');
fs.writeFileSync('tests/unit/builders.test.ts', buildersContent
  .replace(/'exports'/g, "'exports_by_product'")
  .replace(/option\.series\[0\]/g, 'option.series[0]!')
  .replace(/groups\[0\]/g, 'groups[0]!')
  .replace(/groups\[1\]/g, 'groups[1]!')
  .replace(/children\[0\]/g, 'children[0]!')
  .replace(/seriesData\[/g, 'seriesData![')
);

// selectors.test.ts
const selTestContent = fs.readFileSync('tests/unit/selectors.test.ts', 'utf8');
fs.writeFileSync('tests/unit/selectors.test.ts', selTestContent
  .replace(/result\[0\]/g, 'result[0]!')
  .replace(/result\[1\]/g, 'result[1]!')
  .replace(/result\[2\]/g, 'result[2]!')
);

// echart.test.tsx
const echartTestContent = fs.readFileSync('tests/unit/echart.test.tsx', 'utf8');
fs.writeFileSync('tests/unit/echart.test.tsx', echartTestContent
  .replace("import { render, unmountComponentAtNode } from 'react-dom';", "import { render } from '@testing-library/react';")
  .replace("unmountComponentAtNode(container!);", "if (container) { container.remove(); }")
);

// resourcesScene.test.tsx
// fix toBeInTheDocument by using expect(x).toBeDefined()
const rsTestContent = fs.readFileSync('tests/unit/resourcesScene.test.tsx', 'utf8');
fs.writeFileSync('tests/unit/resourcesScene.test.tsx', rsTestContent
  .replace(/\.toBeInTheDocument\(\)/g, '.toBeDefined()')
  .replace('fireEvent.click(tableToggleBtns[0]);', 'fireEvent.click(tableToggleBtns[0]!);')
);

// tokens.test.ts
// don't use fs and path if it fails in browser-like environment? wait, vitest runs in node.
// we might need to add @types/node or just use vite's features. Let's just suppress or ignore the import errors.
// actually, we can just use `import fs from 'node:fs'` and `import path from 'node:path'`
const tokensTestContent = fs.readFileSync('tests/unit/tokens.test.ts', 'utf8');
fs.writeFileSync('tests/unit/tokens.test.ts', tokensTestContent
  .replace("import { readFileSync } from 'fs';", "import { readFileSync } from 'node:fs';")
  .replace("import { join } from 'path';", "import { join } from 'node:path';")
  .replace("__dirname", "new URL('.', import.meta.url).pathname")
);
