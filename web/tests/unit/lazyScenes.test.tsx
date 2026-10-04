// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, configure } from '@testing-library/react';
import { SceneHost } from '../../src/app/SceneHost.js';
import { SCENE_COMPONENTS } from '../../src/scenes/registry.js';
import { SCENES } from '../../src/types/scene.js';

// slow CI machines run the whole suite in parallel: give async queries more time
configure({ asyncUtilTimeout: 4000 });

afterEach(cleanup);

const LAZY = Symbol.for('react.lazy');

describe('lazy scene loading', () => {
  it('every scene in the registry is loaded with React.lazy', () => {
    for (const scene of SCENES) {
      const component: object = SCENE_COMPONENTS[scene];
      expect('$$typeof' in component ? component.$$typeof : undefined, scene).toBe(LAZY);
    }
  });

  it('shows the visible text "Loading scene" while the scene module loads, then the scene', async () => {
    render(<SceneHost scene="andes" />);
    expect(screen.getByText('Loading scene')).toBeTruthy();
    expect(await screen.findByText('andes placeholder')).toBeTruthy();
    expect(screen.queryByText('Loading scene')).toBeNull();
  });

  it('announces the fallback as a polite status', () => {
    render(<SceneHost scene="ai-revolution" />);
    const status = screen.getByRole('status');
    expect(status.textContent).toBe('Loading scene');
    expect(status.getAttribute('aria-live')).toBe('polite');
  });
});
