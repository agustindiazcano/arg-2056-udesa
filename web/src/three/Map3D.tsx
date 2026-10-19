import React, { useEffect, useRef, useState } from 'react';
import {
  AmbientLight,
  BufferGeometry,
  Color,
  DirectionalLight,
  ExtrudeGeometry,
  Float32BufferAttribute,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshStandardMaterial,
  Path,
  Raycaster,
  Shape,
  SphereGeometry,
  Vector2,
  Vector3
} from 'three';
import { projectDepartments, projectFeatures, provinceStyle } from '../charts3d/mapGeometry';
import type { ProjectionRequest } from '../charts3d/projection';
import type { Map3DSpec } from '../charts3d/types';
import { NavControls } from '../ui/NavControls';
import { useQualityOptional } from '../runtime/CapabilityProvider';
import { QUALITY_PRESETS } from '../runtime/capabilities';
import { useReducedMotion } from '../runtime/useReducedMotion';
import { SEQUENTIAL_BLUE, tokens } from '../styles/tokens';
import { addProjection } from './projection';
import { fitRadius, openingAngles } from '../charts3d/camera';
import { useSideView } from './useSideView';
import { createStage } from './stage';
import { useCameraNav } from './useCameraNav';
import { loadDepartments } from '../geo/departments';
import { PROVINCES } from '../types/province';

const GROW_MS = 600;
const SELECTED_LIFT = 0.15;
const CLICK_SLOP = 4;
/** Aerial top-down perspective: seen almost straight down from above, 100% like 2D with physical relief. */
const UPRIGHT_PHI = 0.04;
/** How much of the view the selected province fills when the camera flies to it. */
const ZOOM_FILL = 1.6;

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

/** The provinces extruded: height and color follow the value, the selected province rises, a click selects. */
export function Map3D({ spec, projection, free = false }: { spec: Map3DSpec; projection?: ProjectionRequest; free?: boolean }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const [deptCount, setDeptCount] = useState<number>(0);
  // the data the map last grew for: a new stage for the same data (a selection, a camera setting) shows it at once instead of growing it again
  const grownFor = useRef<unknown>(null);
  const onSelectRef = useRef(spec.onSelect);
  onSelectRef.current = spec.onSelect;
  const onSelectDeptRef = useRef(spec.onSelectDepartment);
  onSelectDeptRef.current = spec.onSelectDepartment;
  const selectedDeptRef = useRef(spec.selectedDepartment ?? null);
  selectedDeptRef.current = spec.selectedDepartment ?? null;
  const reduced = useReducedMotion();
  const quality = useQualityOptional();
  const pixelRatioCap = QUALITY_PRESETS[quality?.tier ?? 'medium'].pixelRatioCap;
  const { stageRef, poseRef, chartControls } = useCameraNav();
  // a map seen edge-on shows nothing (it is tall, not wide): in the Recorrido it keeps its oblique view, fitted to the box
  const tour = useSideView() && !free;
  const side = false;
  const upright = spec.upright === true;

  const selectedProvince = spec.selectedId ? PROVINCES.find((p) => p.id === spec.selectedId) : null;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const map = projectFeatures(spec.geo);
    const aspect = host.clientHeight > 0 ? host.clientWidth / host.clientHeight : 0;
    const startRadius = upright
      ? fitRadius({ width: map.bounds.width, height: map.bounds.height }, 32, aspect, 1.1)
      : side
        ? fitRadius({ width: map.bounds.width, height: 3.2 }, 32, aspect, 1.02)
        : tour
          ? Math.max(7, map.bounds.height * 2.1)
          : Math.max(7, map.bounds.height * 1.55) * (projection ? 1.9 : 1);
    const stage = createStage(host, {
      pixelRatioCap,
      target: side ? new Vector3(0, 0.9, 0) : new Vector3(0, upright ? 0 : 0.5 + (projection ? 0.8 : 0), 0),
      radius: startRadius,
      ...(upright ? { theta: 0, phi: UPRIGHT_PHI } : openingAngles(side, { theta: 0, phi: 0.05 })),
      box: { minX: -map.bounds.width / 2, maxX: map.bounds.width / 2, minY: 0, maxY: 3, minZ: -map.bounds.height / 2, maxZ: map.bounds.height / 2 },
      pose: poseRef.current ?? undefined,
      animateReset: !reduced && quality?.tier !== 'low',
      wheelZoom: tour ? 'modifier' : 'always'
    });
    poseRef.current = stage.pose;
    stageRef.current = stage;

    // a selected province: the camera flies to it; nothing selected: back to the whole map
    if (spec.zoomToSelected) {
      const selected = spec.selectedId ? map.provinces.find((p) => p.id === spec.selectedId) : undefined;
      const points = selected ? selected.polygons.flatMap((p) => p.outer) : [];
      if (selected && points.length > 0) {
        const xs = points.map((p) => p[0]);
        const ys = points.map((p) => p[1]);
        const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
        const extent = Math.max(x1 - x0, y1 - y0, 0.6);
        const fit = fitRadius({ width: extent * ZOOM_FILL, height: extent * ZOOM_FILL }, 32, aspect, 1);
        stage.nav.flyTo({ ...stage.pose, x: (x0 + x1) / 2, y: 0, z: -(y0 + y1) / 2, radius: Math.min(startRadius, fit), theta: 0, phi: UPRIGHT_PHI });
      } else stage.nav.reset();
    }
    const { scene } = stage;
    scene.add(new AmbientLight(tokens.ink, 1.3));
    const sun = new DirectionalLight(tokens.ink, 2.5);
    sun.position.set(-3, 8, 6);
    scene.add(sun);

    const lit = new Color(SEQUENTIAL_BLUE[9]);
    const borders: LineSegments[] = [];
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

        // Raised provincial border with physical relief
        const bPositions: number[] = [];
        for (const ring of [polygon.outer, ...polygon.holes]) {
          for (let i = 0; i < ring.length; i++) {
            const p1 = ring[i]!;
            const p2 = ring[(i + 1) % ring.length]!;
            bPositions.push(p1[0], 1.018, -p1[1]);
            bPositions.push(p2[0], 1.018, -p2[1]);
          }
        }
        const bGeom = new BufferGeometry();
        bGeom.setAttribute('position', new Float32BufferAttribute(bPositions, 3));
        const bMat = new LineBasicMaterial({
          color: new Color(selected ? '#38bdf8' : '#334155'),
          transparent: true,
          opacity: selected ? 0.95 : 0.8,
          depthWrite: false
        });
        const bLine = new LineSegments(bGeom, bMat);
        bLine.userData = { base: mesh.userData.base };
        scene.add(bLine);
        borders.push(bLine);
      }
      return group;
    });
    const all = meshes.flat();

    // the Malvinas: flat, in the no-data color, not part of `all` so they are neither raised nor picked
    const flat = provinceStyle(undefined, null, 'level');
    for (const decor of map.decor ?? []) {
      for (const polygon of decor.polygons) {
        const geometry = new ExtrudeGeometry(new Shape(polygon.outer.map(([x, y]) => new Vector2(x, y))), { depth: 1, bevelEnabled: false });
        geometry.rotateX(-Math.PI / 2);
        const mesh = new Mesh(geometry, new MeshStandardMaterial({ color: new Color(flat.color), roughness: 0.65 }));
        mesh.scale.y = flat.height;
        scene.add(mesh);
      }
    }

    // Dynamic departmental drill-down and municipal markers when a province is selected
    const deptMeshes: Mesh[] = [];
    const deptBorders: LineSegments[] = [];
    const pinMeshes: Mesh[] = [];
    let active = true;

    if (spec.selectedId) {
      loadDepartments(spec.selectedId).then((data) => {
        if (!active || !data || !map.params) return;
        setDeptCount(data.features.length);
        const depts = projectDepartments(data, map.params);
        const selMesh = all.find((m) => m.userData.id === spec.selectedId);
        const selBase = (selMesh?.userData.base as number) || (0.05 + SELECTED_LIFT);

        for (const dept of depts) {
          const isDeptSelected = spec.selectedDepartment === dept.name;
          // Department surface polygon
          for (const poly of dept.polygons) {
            const shape = new Shape(poly.outer.map(([x, y]) => new Vector2(x, y)));
            for (const hole of poly.holes) shape.holes.push(new Path(hole.map(([x, y]) => new Vector2(x, y))));
            const geom = new ExtrudeGeometry(shape, { depth: 0.02, bevelEnabled: false });
            geom.rotateX(-Math.PI / 2);
            const mat = new MeshStandardMaterial({
              color: new Color(isDeptSelected ? '#0284c7' : '#1e293b'),
              emissive: new Color(isDeptSelected ? '#38bdf8' : tokens.page),
              emissiveIntensity: isDeptSelected ? 0.35 : 0,
              roughness: 0.5,
              metalness: 0.1,
              transparent: true,
              opacity: isDeptSelected ? 0.95 : 0.85
            });
            const dMesh = new Mesh(geom, mat);
            dMesh.position.y = selBase + 0.005;
            dMesh.userData = { isDept: true, deptName: dept.name, cabecera: dept.cabecera, provinceName: selMesh?.userData.name ?? '' };
            scene.add(dMesh);
            deptMeshes.push(dMesh);

            // Department border lines
            const positions: number[] = [];
            for (const ring of [poly.outer, ...poly.holes]) {
              for (let i = 0; i < ring.length; i++) {
                const p1 = ring[i]!;
                const p2 = ring[(i + 1) % ring.length]!;
                positions.push(p1[0], selBase + 0.028, -p1[1]);
                positions.push(p2[0], selBase + 0.028, -p2[1]);
              }
            }
            const bGeom = new BufferGeometry();
            bGeom.setAttribute('position', new Float32BufferAttribute(positions, 3));
            const bMat = new LineBasicMaterial({ color: new Color('#38bdf8'), transparent: true, opacity: 0.9, depthWrite: false });
            const dBorder = new LineSegments(bGeom, bMat);
            scene.add(dBorder);
            deptBorders.push(dBorder);
          }

          // Municipal marker (cabecera)
          const pinGeom = new SphereGeometry(0.018, 12, 12);
          const pinMat = new MeshStandardMaterial({
            color: new Color('#38bdf8'),
            emissive: new Color('#38bdf8'),
            emissiveIntensity: 0.85,
            roughness: 0.2
          });
          const pinMesh = new Mesh(pinGeom, pinMat);
          pinMesh.position.set(dept.centroid[0], selBase + 0.035, -dept.centroid[1]);
          pinMesh.userData = { isDept: true, deptName: dept.name, cabecera: dept.cabecera, provinceName: selMesh?.userData.name ?? '' };
          scene.add(pinMesh);
          pinMeshes.push(pinMesh);
        }
        stage.requestRender();
      });
    } else {
      setDeptCount(0);
    }

    const setGrowth = (t: number) => {
      const k = easeOutCubic(t);
      for (const m of all) m.scale.y = Math.max((m.userData.base as number) * k, 0.001);
      for (const b of borders) b.scale.y = Math.max((b.userData.base as number) * k, 0.001);
    };
    let cancel = () => {};
    const sameData = grownFor.current === spec.values && !projection;
    grownFor.current = spec.values;
    if (reduced || sameData) {
      setGrowth(1);
      stage.requestRender();
    } else {
      setGrowth(0);
      cancel = stage.animate(GROW_MS, setGrowth);
    }

    // an optional projected title over the map (the projection test)
    const stopProjection = projection
      ? addProjection(stage, {
          title: projection.title,
          bounds: {
            width: map.bounds.width,
            depth: map.bounds.height,
            height: Math.max(1, ...all.map((m) => m.userData.base as number))
          },
          reduced,
          animated: quality?.tier !== 'low'
        })
      : () => {};

    // hover shows the name and the value; a click (not a drag) selects, a second click clears
    const raycaster = new Raycaster();
    const pointer = new Vector2();
    const canvas = stage.renderer.domElement;
    const tip = tipRef.current;
    const pick = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(pointer, stage.camera);
      const targets = [...pinMeshes, ...deptMeshes, ...all];
      return raycaster.intersectObjects(targets, false)[0]?.object as Mesh | undefined;
    };
    const onMove = (e: PointerEvent) => {
      if (e.buttons !== 0 || !tip) return;
      const hit = pick(e);
      if (hit) {
        if (hit.userData.isDept) {
          tip.innerHTML = `<div style="font-weight:700;font-size:13px;color:#f8fafc;margin-bottom:2px">${hit.userData.deptName}</div><div style="font-size:11px;color:#7dd3fc;margin-bottom:1px">Cabecera / Municipio: <strong>${hit.userData.cabecera}</strong></div><div style="font-size:10px;color:#94a3b8">${hit.userData.provinceName}</div>`;
        } else {
          const id = hit.userData.id as string;
          const value = spec.values.values[id];
          tip.textContent = `${hit.userData.name as string}: ${value ? spec.formatValue(value.plotted) : 'sin datos'}`;
        }
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
      if (hit.userData.isDept) {
        const dName = hit.userData.deptName as string;
        if (onSelectDeptRef.current) {
          onSelectDeptRef.current(selectedDeptRef.current === dName ? null : dName);
        } else {
          onSelectRef.current(null);
        }
        return;
      }
      const id = hit.userData.id as string;
      onSelectRef.current(id === spec.selectedId ? null : id);
    };
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerleave', onLeave);
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointerup', onUp);

    return () => {
      active = false;
      cancel();
      stopProjection();
      for (const m of deptMeshes) {
        scene.remove(m);
        m.geometry.dispose();
        (m.material as MeshStandardMaterial).dispose();
      }
      for (const b of deptBorders) {
        scene.remove(b);
        b.geometry.dispose();
        (b.material as LineBasicMaterial).dispose();
      }
      for (const p of pinMeshes) {
        scene.remove(p);
        p.geometry.dispose();
        (p.material as MeshStandardMaterial).dispose();
      }
      for (const b of borders) {
        scene.remove(b);
        b.geometry.dispose();
        (b.material as LineBasicMaterial).dispose();
      }
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointerup', onUp);
      stageRef.current = null;
      stage.dispose();
    };
  }, [spec.geo, spec.values, spec.metric, spec.selectedId, spec.selectedDepartment, spec.formatValue, spec.upright, spec.zoomToSelected, projection?.title, quality?.tier, pixelRatioCap, reduced, side, tour]);

  return (
    <div className="chart3d-wrap">
      {selectedProvince && (
        <div className="map-breadcrumb-bar">
          <button
            type="button"
            className="map-back-btn"
            onClick={() => {
              onSelectDeptRef.current?.(null);
              onSelectRef.current(null);
            }}
            title="Volver a ver todo el país"
          >
            <span className="back-arrow">←</span> Argentina
          </button>
          <span className="breadcrumb-sep">›</span>
          {spec.selectedDepartment ? (
            <>
              <button
                type="button"
                className="map-back-btn"
                onClick={() => onSelectDeptRef.current?.(null)}
                style={{ padding: '1px 6px' }}
              >
                {selectedProvince.name}
              </button>
              <span className="breadcrumb-sep">›</span>
              <span className="breadcrumb-current">{spec.selectedDepartment}</span>
            </>
          ) : (
            <span className="breadcrumb-current">{selectedProvince.name}</span>
          )}
          {deptCount > 0 && !spec.selectedDepartment && <span className="dept-badge">{deptCount} departamentos y municipios</span>}
        </div>
      )}
      <div ref={hostRef} className="chart3d" role="img" aria-label={spec.summary} data-chart3d="map">
        <div ref={tipRef} className="chart3d-tip" hidden />
      </div>
      <NavControls {...chartControls} />
    </div>
  );
}
