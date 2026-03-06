/**
 * Camera Controller
 *
 * Pure math camera system — zero React/Three.js dependencies.
 * Computes x/y/zoom offsets from time, mouse input, and a preset.
 */

import type { CameraPreset, CameraConfig } from '../Voice31RPGStore';

export interface CameraOffset {
  x: number;
  y: number;
  zoom: number;
}

export const DEFAULT_CAMERA_CONFIG: CameraConfig = {
  preset: 'figure_eight',
  speed: 1.0,
  amplitude: 0.06,
  mouseInfluence: 0.5,
};

export const CAMERA_PRESETS: Record<CameraPreset, string> = {
  static: 'No auto-movement',
  push_in: 'Slow zoom forward',
  pull_out: 'Slow zoom backward',
  orbital: 'Circular orbit around center',
  drift: 'Gentle random drift',
  slow_pan: 'Linear horizontal pan',
  dramatic_reveal: 'Start zoomed, pull back',
  tracking: 'Follow mouse smoothly',
  figure_eight: 'Default figure-8 pattern',
};

/**
 * Compute camera offset for a given time and mouse position.
 * Returns x/y pan offsets and a zoom multiplier.
 */
export function computeCameraOffset(
  config: CameraConfig,
  time: number,
  mouseX: number, // -1 to 1
  mouseY: number, // -1 to 1
): CameraOffset {
  const { preset, speed, amplitude, mouseInfluence } = config;
  const t = time * speed;
  const a = amplitude;

  let autoX = 0;
  let autoY = 0;
  let zoom = 1;

  switch (preset) {
    case 'static':
      // No auto-movement at all
      break;

    case 'push_in':
      zoom = 1 + t * 0.002 * a * 10;
      autoY = Math.sin(t * 0.1) * a * 0.2;
      break;

    case 'pull_out':
      zoom = Math.max(0.8, 1 - t * 0.001 * a * 10);
      autoY = Math.sin(t * 0.1) * a * 0.2;
      break;

    case 'orbital':
      autoX = Math.cos(t * 0.3) * a;
      autoY = Math.sin(t * 0.3) * a * 0.6;
      break;

    case 'drift':
      // Perlin-like slow drift using multiple sin waves
      autoX = (Math.sin(t * 0.17) * 0.5 + Math.sin(t * 0.31) * 0.3 + Math.sin(t * 0.53) * 0.2) * a;
      autoY = (Math.cos(t * 0.13) * 0.5 + Math.cos(t * 0.37) * 0.3 + Math.cos(t * 0.47) * 0.2) * a * 0.7;
      break;

    case 'slow_pan':
      autoX = Math.sin(t * 0.1) * a * 1.5;
      autoY = Math.sin(t * 0.07) * a * 0.3;
      break;

    case 'dramatic_reveal':
      // Start zoomed in, gradually pull back, with slight drift
      const reveal = Math.min(1, t * 0.05);
      zoom = 1.3 - reveal * 0.3;
      autoX = Math.sin(t * 0.15) * a * reveal;
      autoY = Math.sin(t * 0.1) * a * 0.5 * reveal;
      break;

    case 'tracking':
      // Mostly follows mouse, minimal auto-movement
      autoX = Math.sin(t * 0.2) * a * 0.2;
      autoY = Math.cos(t * 0.15) * a * 0.15;
      break;

    case 'figure_eight':
    default:
      autoX = Math.sin(t * 0.25) * a;
      autoY = Math.sin(t * 0.15) * Math.cos(t * 0.1) * a * 0.67;
      break;
  }

  // Blend auto-pan with mouse influence
  const mouseWeight = mouseInfluence * (Math.abs(mouseX) + Math.abs(mouseY)) * 0.5;
  const blend = Math.min(mouseWeight, 0.8);
  const finalX = autoX * (1 - blend) + mouseX * 0.08 * blend;
  const finalY = autoY * (1 - blend) + mouseY * 0.05 * blend;

  return { x: finalX, y: finalY, zoom };
}
