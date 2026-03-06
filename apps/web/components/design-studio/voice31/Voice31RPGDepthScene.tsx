'use client';

/**
 * Voice31 RPG Depth Scene
 *
 * Three.js depth-based parallax background for RPG scenes.
 * Uses depth maps to create subtle 3D parallax on scene backgrounds.
 * Auto-pans with breathing animation for ambient movement.
 *
 * Falls back to CSS background on low-end devices.
 */

import React, { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useRPGPerformanceProfile } from './hooks/useRPGPerformanceProfile';
import type { VisualQuality, RPGSceneLighting, CameraConfig } from './Voice31RPGStore';
import { computeCameraOffset, DEFAULT_CAMERA_CONFIG } from './scene/CameraController';

interface Voice31RPGDepthSceneProps {
  backgroundUrl: string | null;
  depthMapUrl: string | null;
  width: number;
  height: number;
  visualQuality?: VisualQuality;
  sceneLighting?: RPGSceneLighting | null;
  cameraConfig?: CameraConfig | null;
}

// =============================================================================
// DEPTH PARALLAX MESH
// =============================================================================

const DepthParallaxPlane: React.FC<{
  backgroundUrl: string;
  depthMapUrl: string;
  displacementScale?: number;
  sceneLighting?: RPGSceneLighting | null;
  cameraConfig?: CameraConfig | null;
}> = ({ backgroundUrl, depthMapUrl, displacementScale = 0.12, sceneLighting, cameraConfig }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { viewport } = useThree();

  // Load textures
  const [colorMap, setColorMap] = useState<THREE.Texture | null>(null);
  const [depthMap, setDepthMap] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load(
      backgroundUrl,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        setColorMap(tex);
      },
      undefined,
      (err) => {
        console.error('[DepthScene] Failed to load background texture:', err);
      }
    );
  }, [backgroundUrl]);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load(
      depthMapUrl,
      (tex) => {
        setDepthMap(tex);
      },
      undefined,
      (err) => {
        console.error('[DepthScene] Failed to load depth map texture:', err);
      }
    );
  }, [depthMapUrl]);

  // Default lighting values (neutral)
  const fog = sceneLighting?.fogColor || [0.15, 0.18, 0.25];
  const fogD = sceneLighting?.fogDensity ?? 0.08;
  const tint = sceneLighting?.ambientTint || [1.0, 1.0, 1.0];
  const tintI = sceneLighting?.ambientIntensity ?? 1.0;
  const temp = sceneLighting?.colorTemperature ?? 0.0;
  const vigI = sceneLighting?.vignetteIntensity ?? 0.25;
  const vigC = sceneLighting?.vignetteColor || [0.0, 0.0, 0.0];
  const gr = sceneLighting?.godRays || { enabled: false, position: [0.5, 0.5], color: [1, 1, 1], intensity: 0 };

  // Custom shader material for depth-based displacement + theme lighting
  const shaderMaterial = useMemo(() => {
    if (!colorMap || !depthMap) return null;

    return new THREE.ShaderMaterial({
      uniforms: {
        uColorMap: { value: colorMap },
        uDepthMap: { value: depthMap },
        uDisplacementScale: { value: displacementScale },
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(0, 0) },
        // Theme lighting
        uFogColor: { value: new THREE.Vector3(fog[0], fog[1], fog[2]) },
        uFogDensity: { value: fogD },
        uAmbientTint: { value: new THREE.Vector3(tint[0], tint[1], tint[2]) },
        uAmbientIntensity: { value: tintI },
        uColorTemperature: { value: temp },
        uVignetteIntensity: { value: vigI },
        uVignetteColor: { value: new THREE.Vector3(vigC[0], vigC[1], vigC[2]) },
        uGodRaysEnabled: { value: gr.enabled ? 1.0 : 0.0 },
        uGodRaysPosition: { value: new THREE.Vector2(gr.position[0], gr.position[1]) },
        uGodRaysColor: { value: new THREE.Vector3(gr.color[0], gr.color[1], gr.color[2]) },
        uGodRaysIntensity: { value: gr.intensity },
      },
      vertexShader: `
        uniform sampler2D uDepthMap;
        uniform float uDisplacementScale;
        uniform float uTime;
        uniform vec2 uMouse;

        varying vec2 vUv;

        void main() {
          vUv = uv;

          vec3 pos = position;

          // Sample depth
          float depth = texture2D(uDepthMap, uv).r;

          // Breathing animation
          float breathe = sin(uTime * 0.5) * 0.02;

          // Mouse/auto-pan parallax offset
          float parallaxFactor = (1.0 - depth) * uDisplacementScale;
          pos.x += uMouse.x * parallaxFactor * 0.3;
          pos.y += uMouse.y * parallaxFactor * 0.3;

          // Depth displacement on Z
          pos.z += depth * uDisplacementScale + breathe * depth;

          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D uColorMap;
        uniform sampler2D uDepthMap;
        uniform float uTime;

        // Theme lighting uniforms
        uniform vec3 uFogColor;
        uniform float uFogDensity;
        uniform vec3 uAmbientTint;
        uniform float uAmbientIntensity;
        uniform float uColorTemperature;
        uniform float uVignetteIntensity;
        uniform vec3 uVignetteColor;
        uniform float uGodRaysEnabled;
        uniform vec2 uGodRaysPosition;
        uniform vec3 uGodRaysColor;
        uniform float uGodRaysIntensity;

        varying vec2 vUv;

        void main() {
          vec4 color = texture2D(uColorMap, vUv);
          float depth = texture2D(uDepthMap, vUv).r;

          // Apply ambient tint and intensity
          color.rgb *= uAmbientTint * uAmbientIntensity;

          // Atmospheric depth fog — farther pixels blend toward fog color
          color.rgb = mix(color.rgb, uFogColor, depth * uFogDensity);

          // Color temperature shift (warm/cool)
          float tempShift = uColorTemperature * 0.06;
          float timeShift = sin(uTime * 0.15) * 0.015;
          color.r += tempShift + timeShift;
          color.b -= tempShift + timeShift;

          // God rays (screen-space radial light)
          if (uGodRaysEnabled > 0.5) {
            vec2 rayDir = vUv - uGodRaysPosition;
            float dist = length(rayDir);
            float rayFalloff = exp(-dist * 3.0);
            // Depth occlusion: rays are stronger where depth is high (far away)
            float depthOcclusion = mix(0.3, 1.0, depth);
            vec3 rays = uGodRaysColor * uGodRaysIntensity * rayFalloff * depthOcclusion;
            color.rgb += rays;
          }

          // Vignette — mix toward vignette color at edges
          vec2 center = vUv - 0.5;
          float vignetteMask = dot(center, center) * uVignetteIntensity * 2.0;
          vignetteMask = clamp(vignetteMask, 0.0, 1.0);
          color.rgb = mix(color.rgb, uVignetteColor, vignetteMask);

          gl_FragColor = vec4(color.rgb, 1.0);
        }
      `,
    });
  }, [colorMap, depthMap, displacementScale]);

  // Update lighting uniforms when sceneLighting changes (without re-creating shader)
  useEffect(() => {
    if (!shaderMaterial || !sceneLighting) return;
    shaderMaterial.uniforms.uFogColor.value.set(sceneLighting.fogColor[0], sceneLighting.fogColor[1], sceneLighting.fogColor[2]);
    shaderMaterial.uniforms.uFogDensity.value = sceneLighting.fogDensity;
    shaderMaterial.uniforms.uAmbientTint.value.set(sceneLighting.ambientTint[0], sceneLighting.ambientTint[1], sceneLighting.ambientTint[2]);
    shaderMaterial.uniforms.uAmbientIntensity.value = sceneLighting.ambientIntensity;
    shaderMaterial.uniforms.uColorTemperature.value = sceneLighting.colorTemperature;
    shaderMaterial.uniforms.uVignetteIntensity.value = sceneLighting.vignetteIntensity;
    shaderMaterial.uniforms.uVignetteColor.value.set(sceneLighting.vignetteColor[0], sceneLighting.vignetteColor[1], sceneLighting.vignetteColor[2]);
    shaderMaterial.uniforms.uGodRaysEnabled.value = sceneLighting.godRays.enabled ? 1.0 : 0.0;
    shaderMaterial.uniforms.uGodRaysPosition.value.set(sceneLighting.godRays.position[0], sceneLighting.godRays.position[1]);
    shaderMaterial.uniforms.uGodRaysColor.value.set(sceneLighting.godRays.color[0], sceneLighting.godRays.color[1], sceneLighting.godRays.color[2]);
    shaderMaterial.uniforms.uGodRaysIntensity.value = sceneLighting.godRays.intensity;
  }, [shaderMaterial, sceneLighting]);

  // Track mouse position for interactive parallax
  const mouseTarget = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseTarget.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseTarget.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Animate: camera controller + mouse parallax blend
  const smoothMouse = useRef({ x: 0, y: 0 });
  useFrame((state) => {
    if (!shaderMaterial) return;

    const t = state.clock.elapsedTime;
    shaderMaterial.uniforms.uTime.value = t;

    // Smooth mouse input (lerp toward target)
    smoothMouse.current.x += (mouseTarget.current.x - smoothMouse.current.x) * 0.05;
    smoothMouse.current.y += (mouseTarget.current.y - smoothMouse.current.y) * 0.05;

    // Use CameraController for offset computation
    const config = cameraConfig || DEFAULT_CAMERA_CONFIG;
    const offset = computeCameraOffset(config, t, smoothMouse.current.x, smoothMouse.current.y);

    shaderMaterial.uniforms.uMouse.value.set(offset.x, offset.y);
  });

  if (!shaderMaterial) return null;

  // Calculate plane dimensions to fill viewport
  const aspect = colorMap ? colorMap.image.width / colorMap.image.height : 16 / 9;
  const planeWidth = viewport.width * 1.1; // Slightly oversized for parallax room
  const planeHeight = planeWidth / aspect;

  return (
    <mesh ref={meshRef} material={shaderMaterial}>
      <planeGeometry args={[planeWidth, planeHeight, 64, 64]} />
    </mesh>
  );
};

// =============================================================================
// CSS PARALLAX FALLBACK
// =============================================================================

const CSSParallaxFallback: React.FC<{
  backgroundUrl: string;
  depthMapUrl?: string | null;
  width: number;
  height: number;
}> = ({ backgroundUrl, width, height }) => {
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    let frame: number;
    const startTime = Date.now();

    const animate = () => {
      const t = (Date.now() - startTime) / 1000;
      setOffset({
        x: Math.sin(t * 0.3) * 8,
        y: Math.cos(t * 0.2) * 5,
      });
      frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ width, height }}
    >
      <div
        className="absolute inset-0 transition-transform duration-100"
        style={{
          backgroundImage: `url(${backgroundUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transform: `translate(${offset.x}px, ${offset.y}px) scale(1.05)`,
        }}
      />
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/30" />
    </div>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export const Voice31RPGDepthScene: React.FC<Voice31RPGDepthSceneProps> = ({
  backgroundUrl,
  depthMapUrl,
  width,
  height,
  visualQuality = 'auto',
  sceneLighting,
  cameraConfig,
}) => {
  const profile = useRPGPerformanceProfile(visualQuality);

  if (!backgroundUrl) return null;

  // Use Three.js for cinematic profile with depth map
  if (profile.useThreeJS && depthMapUrl) {
    return (
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width, height }}
      >
        <Canvas
          dpr={profile.dpr}
          gl={{
            antialias: profile.preset === 'cinematic',
            powerPreference: profile.preset === 'cinematic' ? 'high-performance' : 'low-power',
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.0,
          }}
          camera={{ position: [0, 0, 2], fov: 45 }}
          style={{ background: '#000' }}
        >
          <DepthParallaxPlane
            backgroundUrl={backgroundUrl}
            depthMapUrl={depthMapUrl}
            displacementScale={0.12}
            sceneLighting={sceneLighting}
            cameraConfig={cameraConfig}
          />
        </Canvas>
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-black/20 pointer-events-none" />
      </div>
    );
  }

  // CSS parallax fallback for balanced/safe
  return (
    <CSSParallaxFallback
      backgroundUrl={backgroundUrl}
      depthMapUrl={depthMapUrl}
      width={width}
      height={height}
    />
  );
};

export default Voice31RPGDepthScene;
