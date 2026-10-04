import {
  AdditiveBlending,
  CylinderGeometry,
  DoubleSide,
  EdgesGeometry,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry
} from 'three';
import { projectionFrame, projectionPose, titleHeight } from '../charts3d/projection';
import type { ProjectionBounds } from '../charts3d/projection';
import { SEQUENTIAL_BLUE, tokens } from '../styles/tokens';
import { textSprite } from './labels';
import type { Stage } from './stage';

export interface ProjectionLayerOptions {
  title: string;
  bounds: ProjectionBounds;
  /** reduced motion: the title and the beam are still and there is no scan plane */
  reduced: boolean;
  /** false on the weakest devices: the same still picture, no animation loop */
  animated: boolean;
}

/**
 * A projection over a 3D chart: a title floating above it, a beam of light from the title down to the chart, and a
 * scan plane that travels up and down through it. Everything is added to the stage's scene (the stage disposes it); the
 * returned function stops the animation loop.
 */
export function addProjection(stage: Stage, o: ProjectionLayerOptions): () => void {
  const pose = projectionPose(o.bounds);
  const glowColor = SEQUENTIAL_BLUE[9] ?? tokens.blue;

  const height = titleHeight(o.title.length, o.bounds);
  const glow = textSprite(o.title, glowColor, height * 1.15, true);
  const title = textSprite(o.title, tokens.ink, height, true);
  glow.position.set(0, pose.titleY, 0);
  title.position.set(0, pose.titleY, 0);
  stage.scene.add(glow, title);

  const beamMaterial = new MeshBasicMaterial({
    color: glowColor,
    transparent: true,
    opacity: 0,
    blending: AdditiveBlending,
    depthWrite: false,
    side: DoubleSide
  });
  const beam = new Mesh(new CylinderGeometry(0.04, pose.beamRadius, pose.beamHeight, 48, 1, true), beamMaterial);
  beam.position.y = pose.beamHeight / 2;
  stage.scene.add(beam);

  const planeGeometry = new PlaneGeometry(pose.planeWidth, pose.planeDepth);
  planeGeometry.rotateX(-Math.PI / 2);
  const planeMaterial = new MeshBasicMaterial({
    color: glowColor,
    transparent: true,
    opacity: 0,
    blending: AdditiveBlending,
    depthWrite: false,
    side: DoubleSide
  });
  const plane = new Mesh(planeGeometry, planeMaterial);
  const edgeMaterial = new LineBasicMaterial({ color: tokens.ink, transparent: true, opacity: 0 });
  plane.add(new LineSegments(new EdgesGeometry(planeGeometry), edgeMaterial));
  stage.scene.add(plane);

  const apply = (elapsedMs: number, still: boolean) => {
    const frame = projectionFrame(elapsedMs, o.bounds.height, still);
    plane.position.y = frame.planeY;
    plane.visible = frame.planeOpacity > 0;
    planeMaterial.opacity = frame.planeOpacity;
    edgeMaterial.opacity = Math.min(1, frame.planeOpacity * 2.2);
    beamMaterial.opacity = frame.beamOpacity;
    title.material.opacity = frame.titleOpacity;
    glow.material.opacity = frame.titleOpacity * 0.45;
    title.position.y = pose.titleY - frame.titleRise;
    glow.position.y = pose.titleY - frame.titleRise;
  };

  if (o.reduced || !o.animated) {
    apply(0, true);
    stage.requestRender();
    return () => {};
  }
  return stage.loop((elapsedMs) => apply(elapsedMs, false));
}
