/**
 * Orbital Drift Camera Controller
 *
 * R3F `useFrame` camera controller with 5 motion paths.
 * Receives a CinematicPreset config and playback progress.
 *
 * Motion math patterns adapted from lib/design-studio/cinematic/camera-controller.ts
 */

'use client';

import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { CameraMotionPath, CinematicPreset } from './scene-presets';

interface OrbitalDriftCameraProps {
  preset: CinematicPreset;
  progress: number; // 0-1 overall playback progress
}

/**
 * Compute camera position offset for a given motion path.
 */
// Pre-allocated vectors to avoid GC pressure in render loop
const _posVec = new THREE.Vector3();
const _targetVec = new THREE.Vector3();

function computeMotionOffset(
  path: CameraMotionPath,
  time: number,
  speed: number,
  amplitude: number,
): { pos: THREE.Vector3; target: THREE.Vector3 } {
  const t = time * speed;
  const a = amplitude;

  switch (path) {
    case 'drift':
      _posVec.set(
        Math.sin(t * 0.3) * a * 0.15,
        Math.cos(t * 0.2) * a * 0.08,
        Math.sin(t * 0.15) * a * 0.05,
      );
      _targetVec.set(
        Math.sin(t * 0.2 + 1.5) * a * 0.05,
        Math.cos(t * 0.15 + 0.8) * a * 0.03,
        0,
      );
      return { pos: _posVec, target: _targetVec };

    case 'orbit':
      _posVec.set(
        Math.sin(t * 0.5) * a * 1.5,
        Math.sin(t * 0.25) * a * 0.3,
        Math.cos(t * 0.5) * a * 1.5,
      );
      _targetVec.set(0, 0, 0);
      return { pos: _posVec, target: _targetVec };

    case 'push': {
      const pushProgress = Math.min(t * 0.15, 1);
      _posVec.set(0, 0, -pushProgress * a * 2.0);
      _targetVec.set(0, 0, 0);
      return { pos: _posVec, target: _targetVec };
    }

    case 'crane':
      _posVec.set(0, Math.sin(t * 0.3) * a * 1.2, 0);
      _targetVec.set(0, Math.sin(t * 0.3 + 0.5) * a * 0.4, 0);
      return { pos: _posVec, target: _targetVec };

    case 'dolly':
      _posVec.set(0, 0, Math.sin(t * 0.4) * a * 1.0);
      _targetVec.set(0, 0, 0);
      return { pos: _posVec, target: _targetVec };

    default:
      _posVec.set(0, 0, 0);
      _targetVec.set(0, 0, 0);
      return { pos: _posVec, target: _targetVec };
  }
}

/**
 * R3F camera controller component.
 * Place inside <Canvas> to animate the default camera.
 */
export function OrbitalDriftCamera({ preset, progress }: OrbitalDriftCameraProps) {
  const timeRef = useRef(0);
  const lookTargetRef = useRef(new THREE.Vector3());
  const { camera } = useThree();

  useFrame((_, delta) => {
    timeRef.current += delta;
    const time = timeRef.current;

    const { path, speed, amplitude, fov, startZ } = preset.camera;
    const { pos, target } = computeMotionOffset(path, time, speed, amplitude);

    // Base position + motion offset
    camera.position.set(
      pos.x,
      pos.y,
      startZ + pos.z,
    );

    // Look at target with offset (reuse ref to avoid allocation)
    lookTargetRef.current.set(target.x, target.y, target.z);
    camera.lookAt(lookTargetRef.current);

    // Update FOV if perspective camera
    if ((camera as THREE.PerspectiveCamera).fov !== undefined) {
      (camera as THREE.PerspectiveCamera).fov = fov;
      (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
    }
  });

  return null;
}
