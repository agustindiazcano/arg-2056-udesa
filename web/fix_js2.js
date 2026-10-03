import fs from 'fs';

function replace(file, searchValue, replaceValue) {
  const content = fs.readFileSync(file, 'utf8');
  fs.writeFileSync(file, content.replace(searchValue, replaceValue));
}

// Fix missing label in builders test
const buildersTestContent = fs.readFileSync('tests/unit/builders.test.ts', 'utf8');
fs.writeFileSync('tests/unit/builders.test.ts', buildersTestContent.replace(/category: 'a1', /g, "category: 'a1', label: 'a1', ")
  .replace(/category: 'a2', /g, "category: 'a2', label: 'a2', ")
  .replace(/category: 'b1', /g, "category: 'b1', label: 'b1', ")
  .replace(/category: 'c1', /g, "category: 'c1', label: 'c1', ")
);

// Fix echart test react-testing-library render api
const echartContent = fs.readFileSync('tests/unit/echart.test.tsx', 'utf8');
fs.writeFileSync('tests/unit/echart.test.tsx', echartContent.replace(/render\(<EChart([^>]+)>, container\)/g, "const { unmount } = render(<EChart$1>)")
  .replace(/unmountComponentAtNode\(container!\);/g, "unmount();")
  .replace(/if \(container\) { container\.remove\(\); }/g, "")
);

// Fix tokens.test.ts imports
const tokensContent = fs.readFileSync('tests/unit/tokens.test.ts', 'utf8');
fs.writeFileSync('tests/unit/tokens.test.ts', tokensContent.replace(/'node:fs'/g, "'fs'").replace(/'node:path'/g, "'path'"));
