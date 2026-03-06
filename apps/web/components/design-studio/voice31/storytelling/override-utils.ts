import type { CinematicPreset } from '@/lib/cinematic/scene-presets';
import type { SceneVisualOverrides } from './types';

/**
 * Merges admin-panel overrides into a CinematicPreset, returning
 * a new preset with overridden camera/particles/atmosphere values.
 */
export function mergePresetWithOverrides(
  base: CinematicPreset,
  overrides: SceneVisualOverrides,
): CinematicPreset {
  return {
    ...base,
    camera: {
      ...base.camera,
      ...(overrides.cameraSpeed !== undefined && { speed: overrides.cameraSpeed }),
      ...(overrides.cameraAmplitude !== undefined && { amplitude: overrides.cameraAmplitude }),
      ...(overrides.cameraFov !== undefined && { fov: overrides.cameraFov }),
    },
    particles: {
      ...base.particles,
      ...(overrides.particleType !== undefined && { type: overrides.particleType }),
      ...(overrides.particleCount !== undefined && { count: overrides.particleCount }),
      ...(overrides.particleSpeed !== undefined && { speed: overrides.particleSpeed }),
      ...(overrides.particleOpacity !== undefined && { opacity: overrides.particleOpacity }),
    },
    atmosphere: {
      ...base.atmosphere,
      ...(overrides.atmosphereDensity !== undefined && { fogDensity: overrides.atmosphereDensity }),
      ...(overrides.vignetteIntensity !== undefined && { vignetteIntensity: overrides.vignetteIntensity }),
    },
    ...(overrides.shaderVariant !== undefined && { shader: overrides.shaderVariant }),
  };
}
