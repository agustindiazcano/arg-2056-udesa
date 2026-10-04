import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

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

export default defineConfig({
  plugins: [react()],
  build: {
    manifest: true,
    rollupOptions: { input: inputs, output: { manualChunks } }
  },
});
