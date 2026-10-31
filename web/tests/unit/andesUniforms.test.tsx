// @vitest-environment jsdom
import React from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { Group, Object3D } from 'three';
import { afterEach, describe, expect, it } from 'vitest';
import {
  ANDES_INTRO_MARCH_FORMATION,
  INTRO_HOVER_ESCORT_FORMATION,
  MODEL_URLS,
  MUSKET_BACK_MOUNT,
  UNIFORM_MODELS,
  attachMusketToBack
} from '../../src/scenes/andes/uniformModels';
import { createFigureColumn } from '../../src/scenes/andes/figures3d';
import { buildPath } from '../../src/scenes/andes/pathAlong';
import { AndesIntro } from '../../src/scenes/andes/AndesIntro';
import { Intro } from '../../src/intro/Intro';
import { Header } from '../../src/app/Header';

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe('uniformModels and musket on back', () => {
  it('defines the 4 GLB model URLs (San Martín, blue soldier, red soldier, flintlock musket)', () => {
    expect(MODEL_URLS).toEqual({
      'san-martin': '/models/san-martin.glb',
      'soldier-blue': '/models/soldier-blue.glb',
      'soldier-red': '/models/soldier-red.glb',
      musket: '/models/musket.glb'
    });
  });

  it('lists the 3 uniform models for the showcase, with the rifle on the back of both soldiers', () => {
    expect(UNIFORM_MODELS.map((m) => m.id)).toEqual(['san-martin', 'soldier-blue', 'soldier-red']);
    const sanMartin = UNIFORM_MODELS.find((m) => m.id === 'san-martin')!;
    const blue = UNIFORM_MODELS.find((m) => m.id === 'soldier-blue')!;
    const red = UNIFORM_MODELS.find((m) => m.id === 'soldier-red')!;
    expect(sanMartin.hasMusketOnBack).toBe(false);
    expect(blue.hasMusketOnBack).toBe(true);
    expect(red.hasMusketOnBack).toBe(true);
  });

  it('attaches a cloned musket onto the soldier Spine2 bone on the back with diagonal sling rotation', () => {
    const root = new Group();
    const hips = new Object3D();
    hips.name = 'mixamorig:Hips';
    const spine2 = new Object3D();
    spine2.name = 'mixamorig:Spine2';
    hips.add(spine2);
    root.add(hips);

    const musketTemplate = new Group();
    musketTemplate.name = 'flintlock_musket';

    const mounted = attachMusketToBack(root, musketTemplate);
    expect(mounted.name).toBe('musket-on-back');
    expect(spine2.children).toContain(mounted);
    expect(mounted.position.z).toBeLessThan(0);
    expect(mounted.position.toArray()).toEqual([...MUSKET_BACK_MOUNT.position]);
    expect(mounted.rotation.z).toBeCloseTo(MUSKET_BACK_MOUNT.rotation[2], 5);
  });
});

describe('AndesIntro march formation (San Martín + 5 soldiers: 3 blue, 2 red)', () => {
  it('places San Martín in front followed by 3 blue soldiers and 2 red soldiers, scaled larger with rifles on their backs', () => {
    expect(ANDES_INTRO_MARCH_FORMATION).toHaveLength(6);
    const [leader, ...soldiers] = ANDES_INTRO_MARCH_FORMATION;
    expect(leader!.model).toBe('san-martin');
    expect(leader!.hasMusketOnBack).toBe(false);
    expect(leader!.scale).toBeGreaterThan(1.2);
    expect(soldiers).toHaveLength(5);
    expect(soldiers.filter((s) => s.model === 'soldier-blue')).toHaveLength(3);
    expect(soldiers.filter((s) => s.model === 'soldier-red')).toHaveLength(2);
    for (const s of soldiers) {
      expect(s.hasMusketOnBack).toBe(true);
      expect(s.z).toBeLessThan(leader!.z);
      expect(s.scale).toBeGreaterThan(1.15);
    }
  });

  it('renders the 3D march formation right above the "Cruce de los Andes" / "1817" text in AndesIntro', () => {
    render(<AndesIntro ready={false} />);
    const march = screen.getByTestId('andes-intro-march');
    expect(march.getAttribute('data-leader')).toBe('san-martin');
    expect(march.getAttribute('data-blue-soldiers')).toBe('3');
    expect(march.getAttribute('data-red-soldiers')).toBe('2');
    const nextSibling = march.nextElementSibling;
    expect(nextSibling?.className).toContain('andes-intro-text');
    expect(nextSibling?.textContent).toContain('1817');
  });
});

describe('Intro hover escort on Cruce de los Andes button', () => {
  it('defines San Martín escorted by two blue grenadiers with rifles on their backs', () => {
    expect(INTRO_HOVER_ESCORT_FORMATION).toHaveLength(3);
    const leader = INTRO_HOVER_ESCORT_FORMATION.find((f) => f.role === 'leader')!;
    const escorts = INTRO_HOVER_ESCORT_FORMATION.filter((f) => f.role !== 'leader');
    expect(leader.model).toBe('san-martin');
    expect(escorts).toHaveLength(2);
    expect(escorts.every((e) => e.model === 'soldier-blue' && e.hasMusketOnBack)).toBe(true);
  });

  it('shows San Martín and two grenadiers on the right over the Argentina map when hovering "Cruce de los Andes"', () => {
    render(<Intro onStart={() => undefined} />);
    expect(screen.queryByTestId('intro-andes-escort')).toBeNull();

    const andesBtn = screen.getByRole('button', { name: 'Cruce de los Andes' });
    fireEvent.mouseEnter(andesBtn);

    const escort = screen.getByTestId('intro-andes-escort');
    expect(escort).toBeTruthy();
    expect(escort.getAttribute('data-leader')).toBe('san-martin');
    expect(escort.getAttribute('data-escorts')).toBe('2');

    fireEvent.mouseLeave(andesBtn);
    expect(screen.queryByTestId('intro-andes-escort')).toBeNull();
  });
});

describe('Header "Ver uniformes" button and 3D uniforms popup', () => {
  it('opens a popup with the 3 3D uniform models, supports zooming out ("Alejar zoom"), and closes on Cerrar', async () => {
    render(<Header />);
    const btn = screen.getByRole('button', { name: /Ver uniformes/i });
    expect(btn.getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(btn);
    const dialog = await screen.findByRole('dialog', { name: /Uniformes del Ejército de los Andes/i });
    expect(btn.getAttribute('aria-expanded')).toBe('true');

    for (const model of UNIFORM_MODELS) {
      expect(within(dialog).getByText(model.title)).toBeTruthy();
    }
    expect(within(dialog).getAllByText(/Fusil de chispa en la espalda/i).length).toBeGreaterThanOrEqual(2);

    const stageCanvas = dialog.querySelector('.uniforms-stage-canvas')!;
    expect(stageCanvas.getAttribute('data-zoom-scale')).toBe('1.00');

    const zoomOutBtn = within(dialog).getByRole('button', { name: /Alejar zoom/i });
    fireEvent.click(zoomOutBtn);
    expect(Number(stageCanvas.getAttribute('data-zoom-scale'))).toBeGreaterThan(1);

    const closeBtn = within(dialog).getByRole('button', { name: 'Cerrar' });
    fireEvent.click(closeBtn);
    expect(screen.queryByRole('dialog', { name: /Uniformes del Ejército de los Andes/i })).toBeNull();
  });
});

describe('Detailed models infantry poses in createFigureColumn', () => {
  it('provides infantry poses for foot and foot_afro slots and hides their box parts when hideInfantryBoxes is set', () => {
    const path = buildPath(new Float32Array([0, 0, 0, 0, 0, 5]));
    const col = createFigureColumn(20, path, () => 0, 1);
    act(() => {
      col.update(2, 0, 1, null, true);
    });
    expect(col.infantryPoses.length).toBeGreaterThan(0);
    expect(col.infantryPoses.every((p) => p.kind === 'foot' || p.kind === 'foot_afro' || p.kind === 'leader')).toBe(true);
  });
});
