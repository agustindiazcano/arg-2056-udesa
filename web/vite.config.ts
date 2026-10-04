import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { metaPlugin } from './src/content/metaTags';

/** The HTML entries of the build (vite and vitest both run from web/): the app and the standalone References page. */
export const inputs = {
  main: resolve(process.cwd(), 'index.html'),
  references: resolve(process.cwd(), 'references.html')
};

/**
 * ECharts and its renderer zrender go to one vendor chunk, named `echarts`, so that it loads only with the first chart
 * scene and never with the initial load (scripts/check-bundle.ts asserts it by that name). Function form, no plugin.
 */
export function manualChunks(id: string): string | undefined {
  return /[\\/]node_modules[\\/](echarts|zrender)[\\/]/.test(id) ? 'echarts' : undefined;
}

/** The terrains baked into `public/terrain/` (ids of the `<id>.json` files): the app asks only for those. Changing them needs a restart of the dev server. */
function bakedTerrains(): string[] {
  const dir = resolve(process.cwd(), 'public/terrain');
  return existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5)) : [];
}

export default defineConfig({
  plugins: [react(), metaPlugin()],
  // The analytics scripts exist only on Vercel (see src/runtime/VercelMetrics.tsx)
  define: { 'import.meta.env.VITE_ON_VERCEL': JSON.stringify(process.env.VERCEL === '1'), __BAKED_TERRAINS__: JSON.stringify(bakedTerrains()) },
  build: {
    manifest: true,
    rollupOptions: { input: inputs, output: { manualChunks } }
  },
});
