import React, { useEffect, useRef } from 'react';
import { AmbientLight, Color, DirectionalLight, ExtrudeGeometry, Mesh, MeshStandardMaterial, Path, Shape, Vector2 } from 'three';
import { projectFeatures, provinceStyle } from '../charts3d/mapGeometry';
import type { Map3DSpec } from '../charts3d/types';
import { useQualityOptional } from '../runtime/CapabilityProvider';
import { QUALITY_PRESETS } from '../runtime/capabilities';
import { useReducedMotion } from '../runtime/useReducedMotion';
import { SEQUENTIAL_BLUE, tokens } from '../styles/tokens';
import { fixedView } from './fixedView';
import { createPicker, showTip } from './pick';
import { createTourScene } from './tourScene';

const GROW_MS = 600;
const SELECTED_LIFT = 0.35;
const CLICK_SLOP = 4;
/** Seen almost straight down, a little from the south: the country stands upright, north at the top. */
const PHI = 0.22;

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

/** The provinces extruded, seen from a fixed camera: hover names the province, a click selects it (it rises and lights up); nothing moves the view. */
export function TourMap({ spec }: { spec: Map3DSpec }) {
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
    const viewFor = (aspect: number) => fixedView({ width: map.bounds.width, height: map.bounds.height }, aspect, { phi: PHI, margin: 1.1 });
    const tour = createTourScene(host, { pixelRatioCap, view: viewFor(host.clientHeight > 0 ? host.clientWidth / host.clientHeight : 1), viewFor });
    const { scene } = tour;
    scene.add(new AmbientLight(tokens.ink, 1.2));
    const sun = new DirectionalLight(tokens.ink, 2.4);
    sun.position.set(-3, 8, 6);
    scene.add(sun);

    const lit = new Color(SEQUENTIAL_BLUE[9]);
    const all: Mesh[] = [];
    for (const province of map.provinces) {
      const style = provinceStyle(spec.values.values[province.id]?.plotted, spec.values.domain, spec.metric);
      const selected = spec.selectedId === province.id;
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
        mesh.userData = { id: province.id, name: province.name, base: style.height + (selected ? SELECTED_LIFT : 0) };
        scene.add(mesh);
        all.push(mesh);
      }
    }
    const setGrowth = (t: number) => {
      const k = easeOutCubic(t);
      for (const m of all) m.scale.y = Math.max((m.userData.base as number) * k, 0.001);
    };
    let cancel = () => {};
    if (reduced) {
      setGrowth(1);
      tour.requestRender();
    } else {
      setGrowth(0);
      cancel = tour.animate(GROW_MS, setGrowth);
    }

    const canvas = tour.renderer.domElement;
    const pick = createPicker(canvas, tour.camera, all);
    const tip = tipRef.current;
    const onMove = (e: PointerEvent) => {
      const hit = pick(e);
      const value = hit ? spec.values.values[hit.userData.id as string] : undefined;
      showTip(tip, host, e, hit ? `${hit.userData.name as string}: ${value ? spec.formatValue(value.plotted) : 'sin datos'}` : null);
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
      tour.dispose();
    };
  }, [spec.geo, spec.values, spec.metric, spec.selectedId, spec.formatValue, pixelRatioCap, reduced]);

  return (
    <div className="chart3d-wrap">
      <div ref={hostRef} className="chart3d chart3d-still" role="img" aria-label={spec.summary} data-chart3d="map">
        <div ref={tipRef} className="chart3d-tip" hidden />
      </div>
    </div>
  );
}
