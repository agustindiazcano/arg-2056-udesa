// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, act } from '@testing-library/react';
import { CapabilityProvider, QualityDebugLine, useQuality } from '../../src/runtime/CapabilityProvider';
import type { CapabilityEnv } from '../../src/runtime/capabilities';
import { WebGLRequired } from '../../src/runtime/WebGLRequired';

afterEach(cleanup);

const GL = { getContext: () => ({}) };
const HIGH: CapabilityEnv = {
  navigator: { hardwareConcurrency: 8, deviceMemory: 8 },
  matchMedia: () => ({ matches: false }),
  createCanvas: () => GL
};
const NO_GL: CapabilityEnv = { ...HIGH, createCanvas: () => ({ getContext: () => null }) };
const WEAK: CapabilityEnv = { ...HIGH, navigator: { hardwareConcurrency: 2, deviceMemory: 8 } };

type Quality = ReturnType<typeof useQuality>;

/** Renders inside a provider and keeps the latest value of the hook. */
function renderQuality(props: { env?: CapabilityEnv; search?: string } = {}) {
  const ref: { current: Quality | null } = { current: null };
  function Probe() {
    ref.current = useQuality();
    return <span data-testid="tier">{ref.current.tier}</span>;
  }
  render(
    <CapabilityProvider env={props.env ?? HIGH} search={props.search ?? ''}>
      <Probe />
    </CapabilityProvider>
  );
  return () => ref.current as Quality;
}

describe('CapabilityProvider and useQuality', () => {
  it('detects the tier and exposes the capabilities', () => {
    const quality = renderQuality({ env: HIGH });
    expect(quality().tier).toBe('high');
    expect(quality().caps).toEqual({
      webgl2: true,
      cores: 8,
      memoryGb: 8,
      coarsePointer: false,
      reducedMotion: false,
      saveData: false
    });
  });

  it('detects a lower tier on a weaker device', () => {
    expect(renderQuality({ env: WEAK })().tier).toBe('low');
    expect(renderQuality({ env: NO_GL })().tier).toBe('low');
  });

  it('?quality=low|medium|high overrides the detected tier', () => {
    expect(renderQuality({ env: HIGH, search: '?quality=low' })().tier).toBe('low');
    cleanup();
    expect(renderQuality({ env: WEAK, search: '?quality=high' })().tier).toBe('high');
    cleanup();
    expect(renderQuality({ env: HIGH, search: '?quality=medium' })().tier).toBe('medium');
  });

  it('an invalid ?quality value falls back to the detected tier', () => {
    expect(renderQuality({ env: WEAK, search: '?quality=ultra' })().tier).toBe('low');
  });

  it('setTier changes the tier', () => {
    const quality = renderQuality({ env: HIGH });
    act(() => quality().setTier('medium'));
    expect(quality().tier).toBe('medium');
    expect(screen.getByTestId('tier').textContent).toBe('medium');
  });

  it('downgrade moves one tier down for slow frames and never up', () => {
    const quality = renderQuality({ env: HIGH });
    const slow = Array.from({ length: 120 }, () => 30);
    const fast = Array.from({ length: 120 }, () => 5);
    act(() => quality().downgrade(fast));
    expect(quality().tier).toBe('high');
    act(() => quality().downgrade(slow));
    expect(quality().tier).toBe('medium');
    act(() => quality().downgrade(slow));
    expect(quality().tier).toBe('low');
    act(() => quality().downgrade(slow));
    expect(quality().tier).toBe('low');
    act(() => quality().downgrade(fast));
    expect(quality().tier).toBe('low');
  });

  it('useQuality outside a provider throws a clear error', () => {
    function Bad() {
      useQuality();
      return null;
    }
    const spy = console.error;
    console.error = () => undefined; // React logs the thrown render error
    try {
      expect(() => render(<Bad />)).toThrow('useQuality must be used inside a CapabilityProvider');
    } finally {
      console.error = spy;
    }
  });
});

describe('QualityDebugLine', () => {
  const mount = (search: string) =>
    render(
      <CapabilityProvider env={HIGH} search={search}>
        <QualityDebugLine search={search} />
      </CapabilityProvider>
    );

  it('shows "quality: <tier>" with ?debug=1', () => {
    mount('?debug=1&quality=low');
    expect(screen.getByText('quality: low')).toBeTruthy();
  });

  it('shows the detected tier with ?debug=1 and no override', () => {
    mount('?debug=1');
    expect(screen.getByText('quality: high')).toBeTruthy();
  });

  it('shows nothing without ?debug=1', () => {
    mount('?quality=low');
    expect(screen.queryByText(/^quality:/)).toBeNull();
  });
});

describe('WebGLRequired', () => {
  const mount = (env: CapabilityEnv, search = '') =>
    render(
      <CapabilityProvider env={env} search={search}>
        <WebGLRequired />
      </CapabilityProvider>
    );

  it('says the view needs WebGL2 and links to the references page when WebGL2 is missing', () => {
    mount(NO_GL);
    expect(screen.getByText('This view needs WebGL2. Your browser or device does not provide it.')).toBeTruthy();
    const link = screen.getByRole('link', { name: 'Sources and methods' });
    expect(link.getAttribute('href')).toBe('references.html');
  });

  it('says the view runs in reduced quality when WebGL2 exists but the tier is low (few cores)', () => {
    mount(WEAK);
    expect(screen.getByText('This view runs in reduced quality on this device.')).toBeTruthy();
    expect(screen.queryByText(/needs WebGL2/)).toBeNull();
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('says the view runs in reduced quality when the tier is forced low with ?quality=low', () => {
    mount(HIGH, '?quality=low');
    expect(screen.getByText('This view runs in reduced quality on this device.')).toBeTruthy();
  });

  it('shows nothing on a capable device', () => {
    const { container } = mount(HIGH);
    expect(container.textContent).toBe('');
  });

  it('shows nothing on a medium tier with WebGL2', () => {
    const { container } = mount(HIGH, '?quality=medium');
    expect(container.textContent).toBe('');
  });

  it('announces the message as a polite status', () => {
    mount(NO_GL);
    const status = screen.getByRole('status');
    expect(status.getAttribute('aria-live')).toBe('polite');
  });
});
