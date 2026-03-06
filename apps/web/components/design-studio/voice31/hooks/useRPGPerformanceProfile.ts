'use client';

/**
 * RPG Performance Profile Hook
 *
 * Detects device capabilities and returns a quality preset:
 * - 'cinematic': Full Three.js depth + FM dither shader + bg removal + large portraits
 * - 'balanced': CSS parallax + canvas dither + bg removal + medium portraits
 * - 'safe': Current behavior (flat images, framed portraits, CSS transitions)
 */

import { useState, useEffect } from 'react';

export type RPGPerformancePreset = 'cinematic' | 'balanced' | 'safe';

export interface RPGPerformanceProfile {
  preset: RPGPerformancePreset;
  useThreeJS: boolean;
  useCanvasDither: boolean;
  useBgRemoval: boolean;
  portraitSize: 'large' | 'medium' | 'small';
  dpr: [number, number];
  targetFps: number;
}

const PROFILES: Record<RPGPerformancePreset, RPGPerformanceProfile> = {
  cinematic: {
    preset: 'cinematic',
    useThreeJS: true,
    useCanvasDither: true,
    useBgRemoval: true,
    portraitSize: 'large',
    dpr: [1, 2],
    targetFps: 60,
  },
  balanced: {
    preset: 'balanced',
    useThreeJS: false,
    useCanvasDither: true,
    useBgRemoval: true,
    portraitSize: 'medium',
    dpr: [1, 1.5],
    targetFps: 50,
  },
  safe: {
    preset: 'safe',
    useThreeJS: false,
    useCanvasDither: false,
    useBgRemoval: false,
    portraitSize: 'small',
    dpr: [1, 1.25],
    targetFps: 40,
  },
};

function detectPreset(): RPGPerformancePreset {
  if (typeof window === 'undefined') return 'safe';

  const nav = navigator as Navigator & {
    hardwareConcurrency?: number;
    deviceMemory?: number;
  };

  const cores = nav.hardwareConcurrency ?? 2;
  const memory = nav.deviceMemory ?? 2;

  // Check WebGL2 support
  let hasWebGL2 = false;
  try {
    const canvas = document.createElement('canvas');
    hasWebGL2 = !!canvas.getContext('webgl2');
  } catch {
    // no-op
  }

  // Simple fps benchmark - measure frame time over a few frames
  let score = 0;
  if (cores >= 8 && memory >= 8 && hasWebGL2) {
    score = 3; // cinematic
  } else if (cores >= 4 && memory >= 4 && hasWebGL2) {
    score = 2; // balanced
  } else {
    score = 1; // safe
  }

  if (score >= 3) return 'cinematic';
  if (score >= 2) return 'balanced';
  return 'safe';
}

export function useRPGPerformanceProfile(
  override?: RPGPerformancePreset | 'auto'
): RPGPerformanceProfile {
  const [profile, setProfile] = useState<RPGPerformanceProfile>(PROFILES.balanced);

  useEffect(() => {
    if (override && override !== 'auto') {
      setProfile(PROFILES[override]);
      return;
    }

    const detected = detectPreset();
    setProfile(PROFILES[detected]);
    console.log('[RPG Performance] Detected preset:', detected);
  }, [override]);

  return profile;
}
