/**
 * Shared easing functions for storytelling animations.
 */

export const easeInOutCubic = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export const easeOutCubic = (t: number): number =>
  1 - Math.pow(1 - t, 3);

export const easeInCubic = (t: number): number =>
  t * t * t;

export const easeOutQuart = (t: number): number =>
  1 - Math.pow(1 - t, 4);

export const easeInOutQuad = (t: number): number =>
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

export const easeOutBack = (t: number): number => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

export const easeOutElastic = (t: number): number => {
  if (t === 0 || t === 1) return t;
  const c4 = (2 * Math.PI) / 3;
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
};

/** Linear interpolation between two values */
export const lerp = (a: number, b: number, t: number): number =>
  a + (b - a) * t;

/** Clamp a value between min and max */
export const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

/** Map a value from one range to another */
export const mapRange = (
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number => {
  const t = clamp((value - inMin) / (inMax - inMin), 0, 1);
  return lerp(outMin, outMax, t);
};

/** Stagger delay for list items */
export const stagger = (index: number, total: number, start: number, end: number): number =>
  start + (index / Math.max(1, total - 1)) * (end - start);
