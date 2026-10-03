import { describe, it, expect } from 'vitest';
import config, { manualChunks } from '../../vite.config';

describe('manualChunks', () => {
  it('puts echarts and its renderer zrender in the chunk named echarts, on posix and windows paths', () => {
    expect(manualChunks('/repo/web/node_modules/echarts/core.js')).toBe('echarts');
    expect(manualChunks('/repo/web/node_modules/echarts/lib/chart/line/LineSeries.js')).toBe('echarts');
    expect(manualChunks('/repo/web/node_modules/zrender/lib/zrender.js')).toBe('echarts');
    expect(manualChunks('C:\\repo\\web\\node_modules\\echarts\\lib\\echarts.js')).toBe('echarts');
    expect(manualChunks('C:\\repo\\web\\node_modules\\zrender\\lib\\zrender.js')).toBe('echarts');
  });

  it('leaves every other module to the default chunking', () => {
    expect(manualChunks('/repo/web/node_modules/react/index.js')).toBeUndefined();
    expect(manualChunks('/repo/web/node_modules/echarts-like/index.js')).toBeUndefined();
    expect(manualChunks('/repo/web/src/charts/echarts.ts')).toBeUndefined();
    expect(manualChunks('/repo/web/src/scenes/economy/index.tsx')).toBeUndefined();
  });

  it('is wired into the build as the function form of output.manualChunks', () => {
    const output = config.build?.rollupOptions?.output;
    expect(output && !Array.isArray(output) ? output.manualChunks : undefined).toBe(manualChunks);
  });
});
