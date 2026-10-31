/** Rebuild chart geometry and arXiv counts from the archived public sources, no network. */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve, sep } from 'node:path';
const root = process.argv[2] ? pathToFileURL(`${resolve(process.argv[2])}${sep}`) : new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');
const write = (p, obj) => writeFileSync(new URL(p, root), `${JSON.stringify(obj)}\n`);
const source = { name: 'arXiv Monthly Submissions', url: 'https://arxiv.org/stats/monthly_submissions' };
const rows = read('data/raw/arxiv/monthly-submissions-2026-10-30.csv').trim().split(/\r?\n/).slice(1).map((line) => {
  const [month, n] = line.split(',');
  if (!/^\d{4}-\d{2}$/.test(month) || !Number.isInteger(Number(n))) throw new Error(`Invalid arXiv row: ${line}`);
  return { month, count: Number(n) };
});
const years = [2020, 2021, 2022, 2023, 2024, 2025].map((year) => {
  const months = rows.filter((r) => r.month.startsWith(String(year)));
  if (months.length !== 12) throw new Error(`Incomplete year: ${year}`);
  return { year, count: months.reduce((n, r) => n + r.count, 0), source, retrieved_at: '2026-10-30' };
});
write('web/src/tour/aiResearchCounts.json', years);
const world = JSON.parse(read('data/raw/natural-earth/countries-110m.geojson'));
const countries = world.features.filter((f) => ['South America', 'North America'].includes(f.properties.CONTINENT) && !['CAN', 'USA', 'GRL', 'BMU'].includes(f.properties.ADM0_A3));
const point = ([lon, lat]) => `${((lon + 120) * 4).toFixed(1)},${((34 - lat) * 4).toFixed(1)}`;
const shapes = countries.map((f) => {
  const polygons = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
  return { id: f.properties.ADM0_A3, name: f.properties.NAME_ES ?? f.properties.NAME, path: polygons.flatMap((p) => p.map((ring) => `M${ring.map(point).join('L')}Z`)).join(''), source: { name: 'Natural Earth 1:110m', url: 'https://www.naturalearthdata.com/downloads/110m-cultural-vectors/110m-admin-0-countries/' }, retrieved_at: '2026-10-30' };
});
write('web/src/tour/latamGeometry.json', shapes);
console.log(`Built ${years.length} arXiv annual counts and ${shapes.length} map regions in ${fileURLToPath(root)}`);
