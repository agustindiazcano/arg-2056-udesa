import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.{test,spec}.{ts,tsx}'],
    // Several tests read every file of src (live regions, ajv imports, data smoke). Alone they take under a second, but with 150
    // test files in parallel on a laptop or a CI runner they pass the default 5 s and fail without any code being wrong.
    testTimeout: 30_000,
    hookTimeout: 30_000
  }
});
