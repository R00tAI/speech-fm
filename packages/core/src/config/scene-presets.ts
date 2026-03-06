/**
 * Cinematic Scene Presets
 *
 * Each preset defines camera behavior, lighting, particle atmosphere,
 * shader variant, and general mood for cinematic scenes.
 */

import type { ShaderVariant } from './shader-variants';

export type CinematicPresetName =
  | 'intimate'
  | 'dramatic'
  | 'breaking-news'
  | 'editorial'
  | 'social-viral'
  | 'documentary';

export type CameraMotionPath = 'orbit' | 'push' | 'crane' | 'dolly' | 'drift';

export interface CinematicPreset {
  name: CinematicPresetName;
  label: string;
  camera: {
    path: CameraMotionPath;
    speed: number;       // multiplier (1.0 = normal)
    amplitude: number;   // movement range (1.0 = normal)
    fov: number;
    startZ: number;      // initial camera Z distance
  };
  lighting: {
    ambient: number;     // 0-1
    directional: number; // 0-1
    warmth: number;      // -1 (cool) to 1 (warm)
  };
  particles: {
    type: 'dust' | 'fireflies' | 'rain' | 'snow' | 'ember' | 'none';
    count: number;
    speed: number;
    opacity: number;
  };
  atmosphere: {
    fogDensity: number;
    fogColor: string;
    vignetteIntensity: number;
  };
  shader: ShaderVariant;
}

export const CINEMATIC_PRESETS: Record<CinematicPresetName, CinematicPreset> = {
  intimate: {
    name: 'intimate',
    label: 'Intimate',
    camera: {
      path: 'drift',
      speed: 0.4,
      amplitude: 0.5,
      fov: 40,
      startZ: 3.5,
    },
    lighting: {
      ambient: 0.6,
      directional: 0.4,
      warmth: 0.3,
    },
    particles: {
      type: 'dust',
      count: 200,
      speed: 0.2,
      opacity: 0.3,
    },
    atmosphere: {
      fogDensity: 0.004,
      fogColor: '#1a1510',
      vignetteIntensity: 0.5,
    },
    shader: 'softGlow',
  },

  dramatic: {
    name: 'dramatic',
    label: 'Dramatic',
    camera: {
      path: 'crane',
      speed: 0.6,
      amplitude: 1.5,
      fov: 55,
      startZ: 5,
    },
    lighting: {
      ambient: 0.3,
      directional: 0.8,
      warmth: -0.2,
    },
    particles: {
      type: 'ember',
      count: 150,
      speed: 0.5,
      opacity: 0.6,
    },
    atmosphere: {
      fogDensity: 0.006,
      fogColor: '#0a0a12',
      vignetteIntensity: 0.7,
    },
    shader: 'breathing',
  },

  'breaking-news': {
    name: 'breaking-news',
    label: 'Breaking News',
    camera: {
      path: 'push',
      speed: 0.8,
      amplitude: 0.8,
      fov: 50,
      startZ: 4.5,
    },
    lighting: {
      ambient: 0.5,
      directional: 0.6,
      warmth: -0.1,
    },
    particles: {
      type: 'none',
      count: 0,
      speed: 0,
      opacity: 0,
    },
    atmosphere: {
      fogDensity: 0.002,
      fogColor: '#0c0c14',
      vignetteIntensity: 0.3,
    },
    shader: 'default',
  },

  editorial: {
    name: 'editorial',
    label: 'Editorial',
    camera: {
      path: 'dolly',
      speed: 0.3,
      amplitude: 0.6,
      fov: 45,
      startZ: 4,
    },
    lighting: {
      ambient: 0.55,
      directional: 0.5,
      warmth: 0.1,
    },
    particles: {
      type: 'dust',
      count: 100,
      speed: 0.15,
      opacity: 0.2,
    },
    atmosphere: {
      fogDensity: 0.003,
      fogColor: '#12120e',
      vignetteIntensity: 0.4,
    },
    shader: 'painterly',
  },

  'social-viral': {
    name: 'social-viral',
    label: 'Social / Viral',
    camera: {
      path: 'orbit',
      speed: 1.2,
      amplitude: 1.0,
      fov: 60,
      startZ: 3.8,
    },
    lighting: {
      ambient: 0.65,
      directional: 0.5,
      warmth: 0.2,
    },
    particles: {
      type: 'fireflies',
      count: 80,
      speed: 0.8,
      opacity: 0.5,
    },
    atmosphere: {
      fogDensity: 0.002,
      fogColor: '#0a0a0f',
      vignetteIntensity: 0.2,
    },
    shader: 'adaptive',
  },

  documentary: {
    name: 'documentary',
    label: 'Documentary',
    camera: {
      path: 'drift',
      speed: 0.25,
      amplitude: 0.3,
      fov: 42,
      startZ: 4.2,
    },
    lighting: {
      ambient: 0.5,
      directional: 0.5,
      warmth: 0.0,
    },
    particles: {
      type: 'dust',
      count: 60,
      speed: 0.1,
      opacity: 0.15,
    },
    atmosphere: {
      fogDensity: 0.003,
      fogColor: '#0e0e0e',
      vignetteIntensity: 0.35,
    },
    shader: 'default',
  },
};

/**
 * Get a preset by name, falling back to documentary.
 */
export function getCinematicPreset(name?: CinematicPresetName): CinematicPreset {
  if (!name) return CINEMATIC_PRESETS.documentary;
  return CINEMATIC_PRESETS[name] || CINEMATIC_PRESETS.documentary;
}
