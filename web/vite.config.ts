import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/** The HTML entries of the build (vite and vitest both run from web/): the app and the standalone References page. */
export const inputs = {
  main: resolve(process.cwd(), 'index.html'),
  references: resolve(process.cwd(), 'references.html')
};

export default defineConfig({
  plugins: [react()],
  build: {
    manifest: true,
    rollupOptions: { input: inputs }
  },
});
