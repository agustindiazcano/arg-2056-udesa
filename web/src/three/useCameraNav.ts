import { useMemo, useRef } from 'react';
import type { CameraState } from '../charts3d/camera';
import type { Stage } from './stage';

/**
 * What a 3D view needs to be navigable: the live stage (for the buttons) and the camera pose, which outlives the stage:
 * a view rebuilt for new data (the year, a filter) starts from the pose of the old one, so the camera does not jump.
 * The pose is lost when the view unmounts (the mode or the scene changes), which resets it.
 */
export function useCameraNav() {
  const stageRef = useRef<Stage | null>(null);
  const poseRef = useRef<CameraState | null>(null);
  const controls = useMemo(
    () => ({
      onZoomIn: () => stageRef.current?.nav.zoomIn(),
      onZoomOut: () => stageRef.current?.nav.zoomOut(),
      onReset: () => stageRef.current?.nav.reset(),
      onPreset: (preset: 'top' | 'perspective') => stageRef.current?.nav.preset(preset)
    }),
    []
  );
  // the 3D charts have the zoom and the reset only; the Andes scene also has the presets
  const chartControls = useMemo(() => ({ onZoomIn: controls.onZoomIn, onZoomOut: controls.onZoomOut, onReset: controls.onReset }), [controls]);
  return { stageRef, poseRef, controls, chartControls };
}
