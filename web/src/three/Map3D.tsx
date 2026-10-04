import React, { useEffect, useRef } from 'react';
import {
  AmbientLight,
  Color,
  DirectionalLight,
  ExtrudeGeometry,
  Mesh,
  MeshStandardMaterial,
  Raycaster,
  Shape,
  Path,
  Vector2,
  Vector3
} from 'three';
import { projectFeatures, provinceStyle } from '../charts3d/mapGeometry';
import type { Map3DSpec } from '../charts3d/types';
import { useQualityOptional } from '../runtime/CapabilityProvider';
import { QUALITY_PRESETS } from '../runtime/capabilities';
import { useReducedMotion } from '../runtime/useReducedMotion';
import { SEQUENTIAL_BLUE, tokens } from '../styles/tokens';
import { createStage } from './stage';

const GROW_MS = 600;
const SELECTED_LIFT = 0.35;
const CLICK_SLOP = 4;

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

/** The provinces extruded: height and color follow the value, the selected province rises, a click selects. */
export function Map3D({ spec }: { spec: Map3DSpec }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const onSelectRef = useRef(spec.onSelect);
  onSelectRef.current = spec.onSelect;
  const reduced = useReducedMotion();
  const quality = useQualityOptional();
  const pixelRatioCap = QUALITY_PRESETS[quality?.tier ?? 'medium'].pixelRatioCap;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const map = projectFeatures(spec.geo);
    const stage = createStage(host, {
      pixelRatioCap,
      target: new Vector3(0, 0.5, 0),
      radius: Math.max(7, map.bounds.height * 1.55),
      theta: 0,
      phi: 0.8
    });
    const { scene } = stage;
    scene.add(new AmbientLight(tokens.ink, 1.2));
    const sun = new DirectionalLight(tokens.ink, 2.4);
    sun.position.set(-3, 8, 6);
    scene.add(sun);

    const lit = new Color(SEQUENTIAL_BLUE[9]);
    const meshes = map.provinces.map((province) => {
      const style = provinceStyle(spec.values.values[province.id]?.plotted, spec.values.domain, spec.metric);
      const selected = spec.selectedId === province.id;
      const group: Mesh[] = [];
      for (const polygon of province.polygons) {
        const shape = new Shape(polygon.outer.map(([x, y]) => new Vector2(x, y)));
        for (const hole of polygon.holes) shape.holes.push(new Path(hole.map(([x, y]) => new Vector2(x, y))));
        const geometry = new ExtrudeGeometry(shape, { depth: 1, bevelEnabled: false });
        geometry.rotateX(-Math.PI / 2); // x east, y up, north is -z
        const material = new MeshStandardMaterial({
          color: new Color(style.color),
          emissive: selected ? lit : new Color(tokens.page),
          emissiveIntensity: selected ? 0.35 : 0,
          roughness: 0.65
        });
        const mesh = new Mesh(geometry, material);
        mesh.userData = { id: province.id, name: province.name, base: style.height + (selected ? SELECTED_LIFT : 0), style };
        scene.add(mesh);
        group.push(mesh);
      }
      return group;
    });
    const all = meshes.flat();

    const setGrowth = (t: number) => {
      const k = easeOutCubic(t);
      for (const m of all) m.scale.y = Math.max((m.userData.base as number) * k, 0.001);
    };
    let cancel = () => {};
    if (reduced) {
      setGrowth(1);
      stage.requestRender();
    } else {
      setGrowth(0);
      cancel = stage.animate(GROW_MS, setGrowth);
    }

    // hover shows the name and the value; a click (not a drag) selects, a second click clears
    const raycaster = new Raycaster();
    const pointer = new Vector2();
    const canvas = stage.renderer.domElement;
    const tip = tipRef.current;
    const pick = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(pointer, stage.camera);
      return raycaster.intersectObjects(all, false)[0]?.object as Mesh | undefined;
    };
    const onMove = (e: PointerEvent) => {
      if (e.buttons !== 0 || !tip) return;
      const hit = pick(e);
      if (hit) {
        const id = hit.userData.id as string;
        const value = spec.values.values[id];
        tip.textContent = `${hit.userData.name as string}: ${value ? spec.formatValue(value.plotted) : 'sin datos'}`;
        const rect = host.getBoundingClientRect();
        tip.style.left = `${e.clientX - rect.left + 12}px`;
        tip.style.top = `${e.clientY - rect.top + 12}px`;
        tip.hidden = false;
      } else tip.hidden = true;
    };
    const onLeave = () => {
      if (tip) tip.hidden = true;
    };
    let downAt: Vector2 | null = null;
    const onDown = (e: PointerEvent) => {
      downAt = new Vector2(e.clientX, e.clientY);
    };
    const onUp = (e: PointerEvent) => {
      if (!downAt || downAt.distanceTo(new Vector2(e.clientX, e.clientY)) > CLICK_SLOP) return;
      const hit = pick(e);
      if (!hit) return;
      const id = hit.userData.id as string;
      onSelectRef.current(id === spec.selectedId ? null : id);
    };
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerleave', onLeave);
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointerup', onUp);

    return () => {
      cancel();
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointerup', onUp);
      stage.dispose();
    };
  }, [spec.geo, spec.values, spec.metric, spec.selectedId, spec.formatValue, pixelRatioCap, reduced]);

  return (
    <div ref={hostRef} className="chart3d" role="img" aria-label={spec.summary} data-chart3d="map">
      <div ref={tipRef} className="chart3d-tip" hidden />
    </div>
  );
}
