/**
 * Variation System
 *
 * Generates randomized but bounded variations for each action trigger.
 * This makes the character feel alive — never exactly the same twice.
 */

import type { ActionVariation } from './types';

/** Random float in [min, max] */
export function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/** Random integer in [min, max] inclusive */
export function randomInt(min: number, max: number): number {
  return Math.floor(randomInRange(min, max + 1));
}

/** Generate a full variation set for an action trigger */
export function generateVariation(styleVariants: number): ActionVariation {
  return {
    rotation: randomInRange(-0.08, 0.08),       // ~4.5 degrees max
    scaleMultiplier: randomInRange(0.92, 1.08),
    speed: randomInRange(0.85, 1.15),
    styleIndex: randomInt(0, Math.max(0, styleVariants - 1)),
    seed: Math.random() * 10000,
  };
}
