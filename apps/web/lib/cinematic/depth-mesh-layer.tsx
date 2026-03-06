/**
 * Depth Mesh Layer
 *
 * R3F component wrapping the existing depth-mesh.ts utility functions.
 * Renders a PlaneGeometry displaced by a depth map with Ken Burns drift.
 */

'use client';

import { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  createDepthMeshGeometry,
  updateDepthDisplacement,
  type DepthMeshConfig,
} from '@/lib/design-studio/cinematic/depth-mesh';
import { OrbitalDriftCamera } from './orbital-drift-camera';
import type { CinematicPreset } from './scene-presets';

// ---------------------------------------------------------------------------
// Depth Mesh (inner R3F component)
// ---------------------------------------------------------------------------

interface DepthMeshProps {
  colorUrl: string;
  depthUrl: string;
  subdivisions?: number;
  depthScale?: number;
}

function DepthMesh({
  colorUrl,
  depthUrl,
  subdivisions = 128,
  depthScale = 2.0,
}: DepthMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [colorTex, setColorTex] = useState<THREE.Texture | null>(null);
  const [depthTex, setDepthTex] = useState<THREE.Texture | null>(null);

  // Load textures
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.crossOrigin = 'anonymous';
    let disposed = false;
    const loaded: THREE.Texture[] = [];

    Promise.all([
      new Promise<THREE.Texture>((resolve, reject) =>
        loader.load(colorUrl, resolve, undefined, reject)
      ),
      new Promise<THREE.Texture>((resolve, reject) =>
        loader.load(depthUrl, resolve, undefined, reject)
      ),
    ])
      .then(([color, depth]) => {
        if (disposed) {
          color.dispose();
          depth.dispose();
          return;
        }
        depth.colorSpace = THREE.LinearSRGBColorSpace;
        loaded.push(color, depth);
        setColorTex(color);
        setDepthTex(depth);
      })
      .catch((err) => {
        console.warn('[DepthMesh] Texture load failed:', err);
      });

    return () => {
      disposed = true;
      loaded.forEach((t) => t.dispose());
    };
  }, [colorUrl, depthUrl]);

  // Build geometry from depth map (disposed on dep change / unmount)
  const geometryRef = useRef<THREE.PlaneGeometry | null>(null);
  const geometry = useMemo(() => {
    geometryRef.current?.dispose();
    if (!depthTex) return null;
    const geo = createDepthMeshGeometry(depthTex, {
      subdivisions,
      depthScale,
      width: 8,
      height: 4.5,
    });
    geometryRef.current = geo;
    return geo;
  }, [depthTex, subdivisions, depthScale]);

  useEffect(() => {
    return () => { geometryRef.current?.dispose(); };
  }, []);

  if (!geometry || !colorTex) return null;

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshStandardMaterial
        map={colorTex}
        side={THREE.DoubleSide}
        roughness={0.8}
        metalness={0.1}
      />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// Depth Mesh Layer (full canvas)
// ---------------------------------------------------------------------------

export interface DepthMeshLayerProps {
  colorUrl: string;
  depthUrl: string;
  preset: CinematicPreset;
  progress: number;
  subdivisions?: number;
  depthScale?: number;
  className?: string;
}

export function DepthMeshLayer({
  colorUrl,
  depthUrl,
  preset,
  progress,
  subdivisions = 128,
  depthScale = 2.0,
  className,
}: DepthMeshLayerProps) {
  return (
    <Canvas
      className={className}
      style={{ width: '100%', height: '100%', background: preset.atmosphere.fogColor }}
      camera={{ fov: preset.camera.fov, position: [0, 0, preset.camera.startZ], near: 0.1, far: 50 }}
      gl={{ alpha: false, antialias: true }}
    >
      <OrbitalDriftCamera preset={preset} progress={progress} />
      <DepthMesh
        colorUrl={colorUrl}
        depthUrl={depthUrl}
        subdivisions={subdivisions}
        depthScale={depthScale}
      />
      <ambientLight intensity={preset.lighting.ambient} />
      <directionalLight
        intensity={preset.lighting.directional}
        position={[3, 4, 5]}
        color={preset.lighting.warmth > 0 ? '#fff5e0' : preset.lighting.warmth < 0 ? '#e0e8ff' : '#ffffff'}
      />
    </Canvas>
  );
}
