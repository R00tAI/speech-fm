/**
 * Point Cloud Stage
 *
 * R3F Canvas wrapper that renders a depth-map-driven point cloud
 * with atmosphere particles and orbital drift camera.
 *
 * GPU shader: pinhole camera unprojection (ported from dreams.fm world-engine).
 */

'use client';

import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbitalDriftCamera } from './orbital-drift-camera';
import type { CinematicPreset } from './scene-presets';
import type { ShaderVariant } from './shader-variants';
import { getShaderVariant } from './shader-variants';
import {
  POINT_CLOUD_VERTEX_SHADER,
  computeIntrinsics,
} from '@/lib/world-engine-shim/point-cloud-shaders';

// ---------------------------------------------------------------------------
// Point Cloud Layer (R3F component)
// ---------------------------------------------------------------------------

interface PointCloudLayerProps {
  colorUrl: string;
  depthUrl: string;
  shaderVariant?: ShaderVariant;
  pointSize?: number;
  depthScale?: number;
  nearPlane?: number;
  subdivisions?: number;
  fogDensity?: number;
  fogColor?: string;
  dissolveProgress?: number;
}

function PointCloudLayer({
  colorUrl,
  depthUrl,
  shaderVariant = 'default',
  pointSize = 4,
  depthScale = 5,
  nearPlane = 0.5,
  subdivisions = 256,
  fogDensity = 0.003,
  fogColor = '#0a0a0f',
  dissolveProgress = 0,
}: PointCloudLayerProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const [colorTex, setColorTex] = useState<THREE.Texture | null>(null);
  const [depthTex, setDepthTex] = useState<THREE.Texture | null>(null);

  // Load textures
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.crossOrigin = 'anonymous';

    let disposed = false;
    const loadedTextures: THREE.Texture[] = [];

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
        loadedTextures.push(color, depth);
        setColorTex(color);
        setDepthTex(depth);
      })
      .catch((err) => {
        console.warn('[PointCloudLayer] Texture load failed:', err);
      });

    return () => {
      disposed = true;
      loadedTextures.forEach((t) => t.dispose());
    };
  }, [colorUrl, depthUrl]);

  // UV grid geometry (disposed on unmount or dep change)
  const geometryRef = useRef<THREE.BufferGeometry | null>(null);
  const geometry = useMemo(() => {
    geometryRef.current?.dispose();
    const positions: number[] = [];
    for (let y = 0; y < subdivisions; y++) {
      for (let x = 0; x < subdivisions; x++) {
        positions.push(x / (subdivisions - 1), y / (subdivisions - 1), 0);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometryRef.current = geo;
    return geo;
  }, [subdivisions]);

  // Shader material (disposed on unmount or dep change)
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const material = useMemo(() => {
    materialRef.current?.dispose();
    if (!colorTex || !depthTex) return null;

    const imgW = colorTex.image?.width || 1024;
    const imgH = colorTex.image?.height || 1024;
    const intrinsics = computeIntrinsics(imgW, imgH, 60);
    const fog = new THREE.Color(fogColor);

    const mat = new THREE.ShaderMaterial({
      vertexShader: POINT_CLOUD_VERTEX_SHADER,
      fragmentShader: getShaderVariant(shaderVariant),
      transparent: true,
      depthWrite: false,
      uniforms: {
        uColorTexture: { value: colorTex },
        uDepthTexture: { value: depthTex },
        uResolution: { value: new THREE.Vector2(imgW, imgH) },
        uFx: { value: intrinsics.fx },
        uFy: { value: intrinsics.fy },
        uCx: { value: intrinsics.cx },
        uCy: { value: intrinsics.cy },
        uPointSize: { value: pointSize },
        uDepthScale: { value: depthScale },
        uNearPlane: { value: nearPlane },
        uFlipY: { value: 1.0 },
        uOpacity: { value: 1.0 },
        uDissolveProgress: { value: 0.0 },
        uTurbulence: { value: 0.3 },
        uParticleSpeed: { value: 0.2 },
        uDispersalRadius: { value: 3.0 },
        uTime: { value: 0.0 },
        fogColor: { value: fog },
        fogDensity: { value: fogDensity },
      },
    });
    materialRef.current = mat;
    return mat;
  }, [colorTex, depthTex, shaderVariant, pointSize, depthScale, nearPlane, fogDensity, fogColor]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      geometryRef.current?.dispose();
      materialRef.current?.dispose();
    };
  }, []);

  // Animate
  useFrame((_, delta) => {
    if (!pointsRef.current || !material) return;
    const uniforms = (pointsRef.current.material as THREE.ShaderMaterial).uniforms;
    if (uniforms.uTime) uniforms.uTime.value += delta;
    if (uniforms.uDissolveProgress) uniforms.uDissolveProgress.value = dissolveProgress;
  });

  if (!material) return null;

  return <points ref={pointsRef} geometry={geometry} material={material} />;
}

// ---------------------------------------------------------------------------
// Atmosphere Particles
// ---------------------------------------------------------------------------

interface AtmosphereParticlesProps {
  type: string;
  count: number;
  speed: number;
  opacity: number;
  color?: string;
}

function AtmosphereParticles({
  type,
  count,
  speed,
  opacity,
  color = '#ffffff',
}: AtmosphereParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10;

      const isRising = type === 'ember' || type === 'fireflies';
      vel[i * 3] = (Math.random() - 0.5) * 0.02;
      vel[i * 3 + 1] = isRising
        ? Math.random() * 0.03
        : type === 'rain' || type === 'snow'
          ? -Math.random() * 0.05
          : (Math.random() - 0.5) * 0.01;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.01;
    }
    return { positions: pos, velocities: vel };
  }, [count, type]);

  useFrame(() => {
    if (!pointsRef.current) return;
    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;

    for (let i = 0; i < count; i++) {
      arr[i * 3] += velocities[i * 3] * speed;
      arr[i * 3 + 1] += velocities[i * 3 + 1] * speed;
      arr[i * 3 + 2] += velocities[i * 3 + 2] * speed;

      // Wrap around
      if (Math.abs(arr[i * 3]) > 5) arr[i * 3] *= -0.5;
      if (Math.abs(arr[i * 3 + 1]) > 5) arr[i * 3 + 1] *= -0.5;
      if (Math.abs(arr[i * 3 + 2]) > 5) arr[i * 3 + 2] *= -0.5;
    }
    posAttr.needsUpdate = true;
  });

  if (type === 'none' || count === 0) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={count}
        />
      </bufferGeometry>
      <pointsMaterial
        size={type === 'fireflies' || type === 'ember' ? 0.06 : 0.03}
        color={color}
        transparent
        opacity={opacity}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

// ---------------------------------------------------------------------------
// Point Cloud Stage (full scene)
// ---------------------------------------------------------------------------

export interface PointCloudStageProps {
  colorUrl: string;
  depthUrl: string;
  preset: CinematicPreset;
  progress: number; // 0-1
  shaderVariant?: ShaderVariant;
  dissolveProgress?: number;
  className?: string;
}

export function PointCloudStage({
  colorUrl,
  depthUrl,
  preset,
  progress,
  shaderVariant,
  dissolveProgress = 0,
  className,
}: PointCloudStageProps) {
  const effectiveShader = shaderVariant || preset.shader;

  return (
    <Canvas
      className={className}
      style={{ width: '100%', height: '100%', background: preset.atmosphere.fogColor }}
      camera={{ fov: preset.camera.fov, position: [0, 0, preset.camera.startZ], near: 0.1, far: 50 }}
      gl={{ alpha: false, antialias: false }}
    >
      <OrbitalDriftCamera preset={preset} progress={progress} />
      <PointCloudLayer
        colorUrl={colorUrl}
        depthUrl={depthUrl}
        shaderVariant={effectiveShader}
        fogDensity={preset.atmosphere.fogDensity}
        fogColor={preset.atmosphere.fogColor}
        dissolveProgress={dissolveProgress}
      />
      <AtmosphereParticles
        type={preset.particles.type}
        count={preset.particles.count}
        speed={preset.particles.speed}
        opacity={preset.particles.opacity}
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
