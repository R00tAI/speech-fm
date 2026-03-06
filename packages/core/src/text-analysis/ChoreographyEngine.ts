/**
 * ChoreographyEngine
 *
 * The director that orchestrates all animations. Takes animation directives
 * and produces frame-by-frame character transforms.
 *
 * Handles:
 * - Animation sequencing and timing
 * - Entrance/exit/continuous animations
 * - Character-level choreography
 * - Physics integration
 * - Easing functions
 */

import {
  AnimationDirective,
  CharacterAnimation,
  RenderedUnit,
  RenderedCharacter,
  SemanticUnit,
  EntranceAnimation,
  ExitAnimation,
  ContinuousAnimation,
  PhysicsParams,
  EasingName,
  EasingFunction,
} from './types';
import { PhysicsSimulator, SpringSystem } from './PhysicsSimulator';

// =============================================================================
// DETERMINISTIC PSEUDO-RANDOM (replaces Math.random() in per-frame generators)
// =============================================================================

/** Deterministic hash: returns 0..1 for any integer seed */
function hash(seed: number): number {
  let x = Math.sin(seed * 12.9898 + seed * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/** Deterministic per-character random: stable across frames for same (charIndex, slot) */
function charRand(charIndex: number, slot: number = 0): number {
  return hash(charIndex * 7919 + slot * 104729);
}

/** Deterministic per-character random centered on 0: returns -0.5..0.5 */
function charRandC(charIndex: number, slot: number = 0): number {
  return charRand(charIndex, slot) - 0.5;
}

// =============================================================================
// EASING FUNCTIONS
// =============================================================================

const EASINGS: Record<EasingName, EasingFunction> = {
  linear: (t) => t,
  easeIn: (t) => t * t,
  easeOut: (t) => t * (2 - t),
  easeInOut: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  easeInQuad: (t) => t * t,
  easeOutQuad: (t) => t * (2 - t),
  easeInCubic: (t) => t * t * t,
  easeOutCubic: (t) => (--t) * t * t + 1,
  easeInQuart: (t) => t * t * t * t,
  easeOutQuart: (t) => 1 - (--t) * t * t * t,
  easeInExpo: (t) => (t === 0 ? 0 : Math.pow(2, 10 * (t - 1))),
  easeOutExpo: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  easeInBack: (t) => {
    const c = 1.70158;
    return t * t * ((c + 1) * t - c);
  },
  easeOutBack: (t) => {
    const c = 1.70158;
    return 1 + (--t) * t * ((c + 1) * t + c);
  },
  easeInElastic: (t) => {
    if (t === 0 || t === 1) return t;
    return -Math.pow(2, 10 * (t - 1)) * Math.sin((t - 1.1) * 5 * Math.PI);
  },
  easeOutElastic: (t) => {
    if (t === 0 || t === 1) return t;
    return Math.pow(2, -10 * t) * Math.sin((t - 0.1) * 5 * Math.PI) + 1;
  },
  easeOutBounce: (t) => {
    if (t < 1 / 2.75) {
      return 7.5625 * t * t;
    } else if (t < 2 / 2.75) {
      return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
    } else if (t < 2.5 / 2.75) {
      return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
    } else {
      return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
    }
  },
  spring: (t) => {
    return 1 - Math.cos(t * Math.PI * 4.5) * Math.exp(-t * 6);
  },
  springAlt: (t) => {
    return 1 - Math.pow(Math.cos(t * Math.PI * 4.5), 3) * Math.pow(1 - t, 2);
  },
};

// =============================================================================
// ENTRANCE ANIMATION GENERATORS
// =============================================================================

type AnimationGenerator = (
  progress: number,
  charIndex: number,
  totalChars: number,
  basePosition: { x: number; y: number }
) => CharacterAnimation;

const ENTRANCE_GENERATORS: Record<EntranceAnimation, AnimationGenerator> = {
  fade_in: (progress) => ({
    x: 0, y: 0, scale: 1, rotation: 0, opacity: progress,
  }),

  slide_up: (progress, i, total, base) => ({
    x: 0,
    y: (1 - progress) * 50,
    scale: 1,
    rotation: 0,
    opacity: progress,
  }),

  slide_down: (progress) => ({
    x: 0,
    y: (1 - progress) * -50,
    scale: 1,
    rotation: 0,
    opacity: progress,
  }),

  slide_left: (progress) => ({
    x: (1 - progress) * 100,
    y: 0,
    scale: 1,
    rotation: 0,
    opacity: progress,
  }),

  slide_right: (progress) => ({
    x: (1 - progress) * -100,
    y: 0,
    scale: 1,
    rotation: 0,
    opacity: progress,
  }),

  scale_up: (progress) => ({
    x: 0,
    y: 0,
    scale: 0.3 + progress * 0.7,
    rotation: 0,
    opacity: progress,
  }),

  scale_down: (progress) => ({
    x: 0,
    y: 0,
    scale: 1.5 - progress * 0.5,
    rotation: 0,
    opacity: progress,
  }),

  gravity_drop: (progress, i) => {
    const bounceProgress = EASINGS.easeOutBounce(progress);
    return {
      x: 0,
      y: (1 - bounceProgress) * -200,
      scale: 1,
      rotation: (1 - progress) * charRandC(i) * 20,
      opacity: Math.min(1, progress * 2),
    };
  },

  balloon_float: (progress) => {
    const wobble = Math.sin(progress * Math.PI * 4) * (1 - progress) * 10;
    return {
      x: wobble,
      y: (1 - progress) * 100,
      scale: 0.8 + progress * 0.2,
      rotation: wobble * 0.5,
      opacity: progress,
    };
  },

  pendulum_swing: (progress, i, total) => {
    const angle = (1 - progress) * 45 * (i % 2 === 0 ? 1 : -1);
    const radians = angle * (Math.PI / 180);
    return {
      x: Math.sin(radians) * 30,
      y: (1 - Math.cos(radians)) * 20,
      scale: 1,
      rotation: angle,
      opacity: progress,
    };
  },

  bounce_in: (progress) => {
    const bounce = EASINGS.easeOutBounce(progress);
    return {
      x: 0,
      y: (1 - bounce) * -50,
      scale: 0.5 + bounce * 0.5,
      rotation: 0,
      opacity: Math.min(1, progress * 1.5),
    };
  },

  elastic_pop: (progress, i) => {
    const elastic = EASINGS.easeOutElastic(progress);
    return {
      x: 0,
      y: 0,
      scale: elastic,
      rotation: (1 - progress) * charRandC(i) * 10,
      opacity: Math.min(1, progress * 2),
    };
  },

  spring_in: (progress) => {
    const spring = EASINGS.spring(progress);
    return {
      x: 0,
      y: (1 - spring) * 30,
      scale: 0.8 + spring * 0.2,
      rotation: 0,
      opacity: progress,
    };
  },

  ricochet: (progress, i) => {
    const bounces = 3;
    const bouncePhase = progress * bounces;
    const currentBounce = Math.floor(bouncePhase);
    const bounceProgress = bouncePhase - currentBounce;
    const dampening = Math.pow(0.6, currentBounce);

    const direction = i % 2 === 0 ? 1 : -1;
    const x = direction * (1 - progress) * 150 * dampening;

    return {
      x,
      y: Math.sin(bounceProgress * Math.PI) * 20 * dampening,
      scale: 1,
      rotation: x * 0.1,
      opacity: Math.min(1, progress * 2),
    };
  },

  slam_in: (progress) => {
    const ease = EASINGS.easeOutQuart(progress);
    const shake = progress > 0.8 ? Math.sin(progress * 50) * 5 * (1 - progress) * 5 : 0;
    return {
      x: shake,
      y: (1 - ease) * -300,
      scale: 1 + (1 - ease) * 0.5,
      rotation: shake,
      opacity: 1,
    };
  },

  crash_down: (progress) => {
    const ease = EASINGS.easeOutBounce(progress);
    const squash = progress > 0.9 ? 1 + (1 - progress) * 2 : 1;
    return {
      x: 0,
      y: (1 - ease) * -400,
      scale: 1,
      rotation: 0,
      opacity: 1,
      skewX: (squash - 1) * 20,
    };
  },

  explode_in: (progress, i, total, base) => {
    const angle = (i / total) * Math.PI * 2;
    const radius = (1 - progress) * 150;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      scale: progress,
      rotation: (1 - progress) * 360,
      opacity: progress,
    };
  },

  zoom_punch: (progress) => {
    const punch = progress < 0.3
      ? progress / 0.3 * 3
      : 3 - (progress - 0.3) / 0.7 * 2;
    return {
      x: 0,
      y: 0,
      scale: Math.max(0, punch),
      rotation: 0,
      opacity: progress < 0.1 ? progress * 10 : 1,
      blur: (1 - progress) * 10,
    };
  },

  whip_in: (progress, i, total) => {
    const delay = i / total * 0.3;
    const adjustedProgress = Math.max(0, (progress - delay) / (1 - delay));
    const ease = EASINGS.easeOutBack(adjustedProgress);
    return {
      x: (1 - ease) * -200,
      y: 0,
      scale: ease,
      rotation: (1 - ease) * -30,
      opacity: adjustedProgress,
    };
  },

  wave_in: (progress, i, total) => {
    const phase = (i / total) * Math.PI * 2;
    const wave = Math.sin(progress * Math.PI * 2 + phase);
    const dampedWave = wave * (1 - progress) * 20;
    return {
      x: 0,
      y: dampedWave + (1 - progress) * 30,
      scale: 0.8 + progress * 0.2 + wave * 0.1 * (1 - progress),
      rotation: dampedWave * 0.5,
      opacity: progress,
    };
  },

  ripple_in: (progress, i, total) => {
    const center = total / 2;
    const distFromCenter = Math.abs(i - center);
    const delay = distFromCenter / total * 0.5;
    const adjustedProgress = Math.max(0, (progress - delay) / (1 - delay));

    return {
      x: 0,
      y: (1 - adjustedProgress) * 20,
      scale: adjustedProgress,
      rotation: 0,
      opacity: adjustedProgress,
    };
  },

  pour_in: (progress, i, total) => {
    const delay = i / total * 0.8;
    const adjustedProgress = Math.max(0, (progress - delay) / (1 - delay));
    const ease = EASINGS.easeOutCubic(adjustedProgress);
    return {
      x: (1 - ease) * (i - total / 2) * 5,
      y: (1 - ease) * -100,
      scale: ease,
      rotation: (1 - ease) * (i - total / 2) * 10,
      opacity: adjustedProgress,
    };
  },

  grow_in: (progress) => {
    const ease = EASINGS.easeOutBack(progress);
    return {
      x: 0,
      y: (1 - ease) * 10,
      scale: ease,
      rotation: 0,
      opacity: ease,
    };
  },

  bloom: (progress, i, total) => {
    const delay = Math.abs(i - total / 2) / total * 0.3;
    const adjustedProgress = Math.max(0, (progress - delay) / (1 - delay));
    const ease = EASINGS.easeOutBack(adjustedProgress);
    return {
      x: 0,
      y: (1 - ease) * -20,
      scale: ease,
      rotation: (1 - ease) * (i % 2 === 0 ? 10 : -10),
      opacity: adjustedProgress,
    };
  },

  glitch_in: (progress, i) => {
    const glitchIntensity = 1 - progress;
    // Use stepped progress so glitch changes in discrete jumps, not per-frame
    const step = Math.floor(progress * 12);
    const glitch = glitchIntensity > 0.3
      ? charRandC(i, step) * 30 * glitchIntensity
      : 0;
    return {
      x: glitch,
      y: charRandC(i, step + 100) * 10 * glitchIntensity,
      scale: 1 + charRandC(i, step + 200) * 0.2 * glitchIntensity,
      rotation: glitch * 0.5,
      opacity: progress > 0.2 ? 1 : charRand(i, step + 300) > 0.5 ? 1 : 0,
      skewX: glitch,
    };
  },

  ascii_decode: (progress, i) => {
    const showReal = progress > 0.3 + charRand(i) * 0.4;
    return {
      x: 0,
      y: 0,
      scale: 1,
      rotation: 0,
      opacity: showReal ? 1 : 0.5,
    };
  },

  binary_stream: (progress, i, total) => {
    const delay = i / total * 0.6;
    const adjustedProgress = Math.max(0, (progress - delay) / (1 - delay));
    return {
      x: 0,
      y: (1 - adjustedProgress) * -30,
      scale: adjustedProgress,
      rotation: 0,
      opacity: adjustedProgress,
    };
  },

  typewriter: (progress, i, total) => {
    const charProgress = progress * total;
    const isVisible = charProgress > i;
    const isCurrentChar = Math.floor(charProgress) === i;
    return {
      x: 0,
      y: 0,
      scale: 1,
      rotation: 0,
      opacity: isVisible ? 1 : 0,
    };
  },

  terminal_print: (progress, i, total) => {
    const charProgress = progress * total;
    const isVisible = charProgress > i;
    const scanline = Math.sin(progress * 50) * 0.1 + 0.9;
    return {
      x: 0,
      y: 0,
      scale: 1,
      rotation: 0,
      opacity: isVisible ? scanline : 0,
    };
  },

  dissolve_in: (progress, i) => {
    // Each character has a stable appearance threshold based on its index
    const charThreshold = charRand(i);
    return {
      x: 0,
      y: 0,
      scale: 1,
      rotation: 0,
      opacity: charThreshold < progress * 1.5 ? Math.min(1, progress * 2) : 0,
    };
  },

  materialize: (progress) => {
    const ease = EASINGS.easeOutCubic(progress);
    return {
      x: 0,
      y: 0,
      scale: 0.95 + ease * 0.05,
      rotation: 0,
      opacity: ease,
      blur: (1 - progress) * 5,
    };
  },

  unfold: (progress, i, total) => {
    const center = total / 2;
    const distFromCenter = (i - center) / total;
    const foldProgress = EASINGS.easeOutCubic(progress);
    return {
      x: distFromCenter * (1 - foldProgress) * -100,
      y: 0,
      scale: foldProgress,
      rotation: distFromCenter * (1 - foldProgress) * -90,
      opacity: foldProgress,
    };
  },

  reveal_mask: (progress, i, total) => {
    const revealPoint = progress * total * 1.5;
    const isRevealed = i < revealPoint;
    const edgeGlow = Math.abs(i - revealPoint) < 2 ? 1.5 : 1;
    return {
      x: 0,
      y: 0,
      scale: edgeGlow,
      rotation: 0,
      opacity: isRevealed ? 1 : 0,
    };
  },

  curtain_reveal: (progress, i, total) => {
    const center = total / 2;
    const distFromCenter = Math.abs(i - center);
    const revealProgress = Math.max(0, progress * 2 - distFromCenter / total);
    return {
      x: 0,
      y: 0,
      scale: 1,
      rotation: 0,
      opacity: Math.min(1, revealProgress),
    };
  },

  cascade_letters: (progress, i, total) => {
    const delay = i / total * 0.7;
    const adjustedProgress = Math.max(0, (progress - delay) / (1 - delay));
    const ease = EASINGS.easeOutBack(adjustedProgress);
    return {
      x: 0,
      y: (1 - ease) * -50,
      scale: ease,
      rotation: (1 - ease) * 15,
      opacity: adjustedProgress,
    };
  },

  domino_chain: (progress, i, total) => {
    const delay = i / total * 0.6;
    const adjustedProgress = Math.max(0, (progress - delay) / (1 - delay));
    const rotationProgress = EASINGS.easeOutBounce(adjustedProgress);
    return {
      x: 0,
      y: 0,
      scale: 1,
      rotation: (1 - rotationProgress) * -90,
      opacity: adjustedProgress > 0 ? 1 : 0,
    };
  },

  scatter_gather: (progress, i, total) => {
    const angle = (i / total) * Math.PI * 2 + charRand(i);
    const radius = (1 - EASINGS.easeOutBack(progress)) * 200;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      scale: 0.5 + progress * 0.5,
      rotation: (1 - progress) * 720,
      opacity: Math.min(1, progress * 2),
    };
  },

  orbit_settle: (progress, i, total) => {
    const angle = (i / total) * Math.PI * 2 + progress * Math.PI * 4;
    const radius = (1 - progress) * 100;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      scale: 0.5 + progress * 0.5,
      rotation: angle * (180 / Math.PI),
      opacity: progress,
    };
  },

  magnetic_pull: (progress, i, total) => {
    const center = total / 2;
    const distFromCenter = i - center;
    const pullProgress = EASINGS.easeOutCubic(progress);
    return {
      x: distFromCenter * (1 - pullProgress) * 20,
      y: 0,
      scale: 0.8 + pullProgress * 0.2,
      rotation: 0,
      opacity: pullProgress,
    };
  },

  // ── PREMIUM CINEMATIC ENTRANCES ──

  cinematic_reveal: (progress, i, total) => {
    // Multi-phase: blur→scale→settle with dramatic timing
    const p = EASINGS.easeOutQuart(progress);
    const blurPhase = progress < 0.4 ? 1 - progress / 0.4 : 0;
    const scalePhase = progress < 0.3
      ? 0.5 + (progress / 0.3) * 0.7
      : progress < 0.6
        ? 1.2 - ((progress - 0.3) / 0.3) * 0.2
        : 1.0;
    return {
      x: 0,
      y: (1 - p) * 20,
      scale: scalePhase,
      rotation: 0,
      opacity: Math.min(1, progress * 3),
      blur: blurPhase * 20,
    };
  },

  impact_slam: (progress) => {
    // Huge scale overshoot then snap, with screen-shake feel
    const p = EASINGS.easeOutQuart(progress);
    const scaleOvershoot = progress < 0.2
      ? 3 - (progress / 0.2) * 1.5
      : progress < 0.5
        ? 1.5 - ((progress - 0.2) / 0.3) * 0.5
        : 1.0;
    const shake = progress > 0.15 && progress < 0.4
      ? Math.sin(progress * 80) * 8 * (1 - progress)
      : 0;
    return {
      x: shake,
      y: (1 - p) * -100 + shake * 0.5,
      scale: scaleOvershoot,
      rotation: shake * 0.3,
      opacity: progress < 0.05 ? progress * 20 : 1,
    };
  },

  liquid_morph: (progress, i, total) => {
    // Organic blob-like formation with skew
    const ease = EASINGS.easeOutCubic(progress);
    const phase = (i / Math.max(1, total)) * Math.PI;
    const blobX = Math.sin(phase + progress * Math.PI * 2) * (1 - progress) * 30;
    const blobY = Math.cos(phase + progress * Math.PI) * (1 - progress) * 20;
    return {
      x: blobX,
      y: blobY,
      scale: 0.3 + ease * 0.7,
      rotation: (1 - ease) * Math.sin(phase) * 15,
      opacity: ease,
      skewX: (1 - ease) * Math.sin(phase) * 20,
      skewY: (1 - ease) * Math.cos(phase) * 10,
    };
  },

  brush_stroke_reveal: (progress, i, total) => {
    // Left-to-right reveal with slight vertical offset per char
    const charDelay = (i / total) * 0.6;
    const cp = Math.max(0, (progress - charDelay) / (1 - charDelay));
    const ease = EASINGS.easeOutCubic(cp);
    const verticalJitter = Math.sin(i * 1.3) * 4 * (1 - ease);
    return {
      x: (1 - ease) * -15,
      y: verticalJitter,
      scale: 0.9 + ease * 0.1,
      rotation: (1 - ease) * -3,
      opacity: cp > 0 ? Math.min(1, cp * 3) : 0,
    };
  },

  word_cascade: (progress, i, total) => {
    // Staggered waterfall with bounce
    const charDelay = (i / total) * 0.5;
    const cp = Math.max(0, (progress - charDelay) / (1 - charDelay));
    const bounce = EASINGS.easeOutBounce(cp);
    return {
      x: 0,
      y: (1 - bounce) * -120 - (1 - cp) * 30,
      scale: 0.8 + cp * 0.2,
      rotation: (1 - cp) * (i % 2 === 0 ? 8 : -8),
      opacity: cp > 0 ? Math.min(1, cp * 2) : 0,
    };
  },

  perspective_roll: (progress, i, total) => {
    // 3D-like roll from side with perspective skew
    const ease = EASINGS.easeOutBack(progress);
    const perspective = (1 - ease) * 45;
    return {
      x: (1 - ease) * 80,
      y: 0,
      scale: 0.7 + ease * 0.3,
      rotation: (1 - ease) * -20,
      opacity: progress,
      skewY: perspective * 0.3,
      skewX: -perspective * 0.1,
    };
  },

  scale_compress: (progress) => {
    // Squash horizontally then expand to full with vertical compensation
    const ease = EASINGS.springAlt(progress);
    const squashX = progress < 0.3
      ? 0.3 + (progress / 0.3) * 1.2
      : progress < 0.5
        ? 1.5 - ((progress - 0.3) / 0.2) * 0.5
        : 1.0;
    const squashY = progress < 0.3
      ? 1.4 - (progress / 0.3) * 0.6
      : progress < 0.5
        ? 0.8 + ((progress - 0.3) / 0.2) * 0.2
        : 1.0;
    return {
      x: 0,
      y: (1 - ease) * 10,
      scale: squashX,
      rotation: 0,
      opacity: Math.min(1, progress * 2.5),
      skewX: (squashX - 1) * 8,
      skewY: (squashY - 1) * -4,
    };
  },

  smoke_form: (progress, i, total) => {
    // Wispy formation from random positions, like smoke coalescing
    const seed = (i * 7919) % 100 / 100; // deterministic per-char random
    const ease = EASINGS.easeOutCubic(progress);
    const driftX = (seed - 0.5) * 80 * (1 - ease);
    const driftY = -40 * (1 - ease) + Math.sin(seed * Math.PI * 4 + progress * 3) * 10 * (1 - ease);
    return {
      x: driftX,
      y: driftY,
      scale: 0.6 + ease * 0.4,
      rotation: (seed - 0.5) * 30 * (1 - ease),
      opacity: ease * 0.95,
      blur: (1 - ease) * 8,
    };
  },

  curtain_drop_pro: (progress, i, total) => {
    // Top-down with stagger and slight spring settle
    const charDelay = (i / total) * 0.4;
    const cp = Math.max(0, (progress - charDelay) / (1 - charDelay));
    const spring = EASINGS.spring(cp);
    return {
      x: 0,
      y: (1 - spring) * -80,
      scale: 1,
      rotation: 0,
      opacity: cp > 0 ? 1 : 0,
    };
  },

  ink_drop: (progress, i, total) => {
    // Center outward spread like ink hitting paper
    const center = total / 2;
    const dist = Math.abs(i - center) / (total / 2);
    const charDelay = dist * 0.5;
    const cp = Math.max(0, (progress - charDelay) / (1 - charDelay));
    const ease = EASINGS.easeOutCubic(cp);
    return {
      x: 0,
      y: (1 - ease) * 5,
      scale: ease * (1 + (1 - dist) * 0.1),
      rotation: 0,
      opacity: cp > 0 ? Math.min(1, cp * 3) : 0,
      blur: (1 - ease) * 3,
    };
  },

  tracking_in: (progress, i, total) => {
    // Letters start with wide tracking then compress to final spacing
    const ease = EASINGS.easeOutCubic(progress);
    const center = total / 2;
    const offset = (i - center) * (1 - ease) * 15;
    return {
      x: offset,
      y: 0,
      scale: 1,
      rotation: 0,
      opacity: Math.min(1, progress * 2),
    };
  },

  flip_in_x: (progress, i, total) => {
    // 3D-like flip around X axis using skew
    const ease = EASINGS.easeOutBack(progress);
    const flipAngle = (1 - ease) * 90;
    const scaleY = Math.cos((flipAngle * Math.PI) / 180);
    return {
      x: 0,
      y: (1 - ease) * -20,
      scale: Math.max(0.1, scaleY),
      rotation: 0,
      opacity: progress > 0.2 ? 1 : progress * 5,
      skewX: (1 - ease) * 15,
    };
  },

  cinematic_flash: (progress) => {
    // Flash of white then resolve to text
    const flashIntensity = progress < 0.15
      ? progress / 0.15
      : progress < 0.3
        ? 1 - (progress - 0.15) / 0.15
        : 0;
    const ease = EASINGS.easeOutCubic(Math.max(0, (progress - 0.2) / 0.8));
    return {
      x: 0,
      y: 0,
      scale: progress < 0.2 ? 1.3 - progress * 1.5 : 0.8 + ease * 0.2,
      rotation: 0,
      opacity: progress < 0.1 ? 0 : Math.min(1, (progress - 0.1) * 3),
      blur: flashIntensity * 15,
    };
  },
};

// =============================================================================
// EXIT ANIMATION GENERATORS
// =============================================================================

type ExitGenerator = (
  progress: number,
  charIndex: number,
  totalChars: number,
  basePosition: { x: number; y: number }
) => CharacterAnimation;

const EXIT_GENERATORS: Partial<Record<ExitAnimation, ExitGenerator>> = {
  shatter_out: (progress, i, total) => {
    // Per-char random trajectories flying outward
    const seed = ((i * 7919 + 13) % 100) / 100;
    const angle = seed * Math.PI * 2;
    const velocity = 150 + seed * 200;
    const ease = EASINGS.easeInQuad(progress);
    return {
      x: Math.cos(angle) * velocity * ease,
      y: Math.sin(angle) * velocity * ease - 50 * ease,
      scale: 1 - ease * 0.5,
      rotation: (seed - 0.5) * 720 * ease,
      opacity: 1 - ease,
    };
  },

  vaporize: (progress, i, total) => {
    // Upward blur dissolve — chars drift up and blur out
    const seed = ((i * 3571) % 100) / 100;
    const ease = EASINGS.easeInCubic(progress);
    return {
      x: (seed - 0.5) * 30 * ease,
      y: -60 * ease - seed * 30 * ease,
      scale: 1 + ease * 0.3,
      rotation: (seed - 0.5) * 20 * ease,
      opacity: 1 - ease,
      blur: ease * 12,
    };
  },

  eraser_wipe: (progress, i, total) => {
    // Right-to-left wipe erasing characters
    const safeTotal = Math.max(1, total);
    const charThreshold = (1 - i / safeTotal) * 0.8;
    const denom = Math.max(0.001, 1 - charThreshold);
    const charProgress = Math.max(0, (progress - charThreshold) / denom);
    const ease = EASINGS.easeInQuad(charProgress);
    return {
      x: -20 * ease,
      y: 0,
      scale: 1 - ease * 0.3,
      rotation: 0,
      opacity: 1 - ease,
    };
  },

  gravity_collapse: (progress, i, total) => {
    // Accelerating fall with increasing rotation
    const ease = EASINGS.easeInQuad(progress);
    const seed = ((i * 4157) % 100) / 100;
    return {
      x: (seed - 0.5) * 40 * ease,
      y: 200 * ease * ease, // accelerating
      scale: 1 - ease * 0.2,
      rotation: (seed - 0.5) * 180 * ease,
      opacity: 1 - ease * 0.8,
    };
  },

  blur_dissolve: (progress) => {
    // Progressive blur + scale up + fade
    const ease = EASINGS.easeInCubic(progress);
    return {
      x: 0,
      y: 0,
      scale: 1 + ease * 0.4,
      rotation: 0,
      opacity: 1 - ease,
      blur: ease * 20,
    };
  },
};

// =============================================================================
// LFO WAVEFORM GENERATORS
// =============================================================================

type LFOWaveform = (phase: number) => number;

const LFO_WAVEFORMS: Record<string, LFOWaveform> = {
  sine: (phase) => Math.sin(phase),
  triangle: (phase) => {
    const t = ((phase / (Math.PI * 2)) % 1 + 1) % 1;
    return t < 0.5 ? 4 * t - 1 : 3 - 4 * t;
  },
  square: (phase) => Math.sin(phase) >= 0 ? 1 : -1,
  sawtooth: (phase) => {
    const t = ((phase / (Math.PI * 2)) % 1 + 1) % 1;
    return 2 * t - 1;
  },
  noise: (phase) => hash(Math.floor(phase * 10)) * 2 - 1,
};

function lfo(waveform: string, time: number, freq: number, amp: number, phaseOffset: number = 0): number {
  const wave = LFO_WAVEFORMS[waveform] || LFO_WAVEFORMS.sine;
  return wave(time * freq * Math.PI * 2 + phaseOffset) * amp;
}

// =============================================================================
// CONTINUOUS ANIMATION GENERATORS
// =============================================================================

const CONTINUOUS_GENERATORS: Record<ContinuousAnimation, (time: number, i: number) => Partial<CharacterAnimation>> = {
  breathe: (time, i) => ({
    scale: 1 + Math.sin(time * 2) * 0.03 + lfo('sine', time, 0.3, 0.01, i * 0.2),
    y: Math.sin(time * 2) * 2 + lfo('sine', time, 0.5, 1, i * 0.3),
  }),

  pulse: (time, i) => ({
    scale: 1 + Math.sin(time * 4) * 0.05 + lfo('triangle', time, 0.8, 0.02, i * 0.1),
  }),

  hover: (time, i) => ({
    y: Math.sin(time * 2 + i * 0.3) * 5 + lfo('sine', time, 0.4, 2, i * 0.5),
    x: lfo('sine', time, 0.3, 1.5, i * 0.7),
  }),

  jitter: (time, i) => {
    // Use time-stepped hash for discrete jitter jumps (not per-frame noise)
    const step = Math.floor(time * 15);
    return {
      x: (hash(i * 31 + step) - 0.5) * 3,
      y: (hash(i * 37 + step + 1000) - 0.5) * 3,
      rotation: (hash(i * 41 + step + 2000) - 0.5) * 2,
    };
  },

  wave: (time, i) => ({
    y: Math.sin(time * 3 + i * 0.5) * 8,
  }),

  flicker: (time, i) => ({
    opacity: hash(Math.floor(time * 8) + i) > 0.1 ? 1 : 0.7,
  }),

  glow_pulse: (time, i) => ({
    scale: 1 + Math.sin(time * 2) * 0.02 + lfo('sine', time, 0.6, 0.01, i * 0.3),
  }),

  color_shift: (time) => ({
    // Color would need special handling
  }),

  subtle_rotate: (time, i) => ({
    rotation: Math.sin(time * 1.5 + i * 0.5) * 3,
  }),

  heartbeat: (time) => {
    const beat = Math.sin(time * 5);
    const pulse = beat > 0.8 ? (beat - 0.8) * 5 : 0;
    return {
      scale: 1 + pulse * 0.1,
    };
  },

  // ── PREMIUM CONTINUOUS ──

  gentle_sway: (time, i) => ({
    x: lfo('sine', time, 0.4, 4, i * 0.6),
    y: lfo('sine', time, 0.3, 2, i * 0.8 + Math.PI / 3),
    rotation: lfo('sine', time, 0.35, 2, i * 0.5),
  }),

  pulse_scale: (time, i) => ({
    scale: 1 + lfo('sine', time, 1.2, 0.08, i * 0.4) + lfo('triangle', time, 0.3, 0.03, i * 0.2),
  }),

  metallic_shimmer: (time, i) => ({
    x: lfo('sine', time, 2, 0.5, i * 1.2),
    scale: 1 + lfo('triangle', time, 1.5, 0.02, i * 0.8),
    opacity: 0.85 + lfo('sine', time, 3, 0.15, i * 0.6),
  }),

  glow_breathe: (time, i) => ({
    scale: 1 + lfo('sine', time, 0.8, 0.04, i * 0.3),
    y: lfo('sine', time, 0.6, 3, i * 0.4),
    opacity: 0.9 + lfo('sine', time, 1.2, 0.1, i * 0.5),
  }),

  lfo_modulate: (time, i) => {
    // Multi-waveform organic motion combining sine, triangle, and noise
    const xMotion = lfo('sine', time, 0.5, 3, i * 0.7)
      + lfo('triangle', time, 0.2, 1.5, i * 1.3);
    const yMotion = lfo('sine', time, 0.4, 4, i * 0.5 + Math.PI / 4)
      + lfo('sawtooth', time, 0.15, 1, i * 0.9);
    const scaleMotion = lfo('sine', time, 0.6, 0.03, i * 0.4)
      + lfo('triangle', time, 0.25, 0.015, i * 0.8);
    const rotMotion = lfo('sine', time, 0.3, 2, i * 0.6)
      + lfo('noise', time, 1, 0.3, 0); // subtle noise
    return {
      x: xMotion,
      y: yMotion,
      scale: 1 + scaleMotion,
      rotation: rotMotion,
    };
  },
};

// =============================================================================
// CHOREOGRAPHY ENGINE CLASS
// =============================================================================

export class ChoreographyEngine {
  private physics: PhysicsSimulator;
  private springs: SpringSystem;
  private activeUnits: Map<string, ActiveUnitState> = new Map();
  private globalTime: number = 0;
  private charWidthRatio: number = 0.6;

  constructor() {
    this.physics = new PhysicsSimulator();
    this.springs = new SpringSystem();
  }

  /**
   * Set the character width ratio (measured charWidth / fontSize).
   * Call this after measuring with canvas for accurate monospace spacing.
   */
  setCharWidthRatio(ratio: number): void {
    this.charWidthRatio = ratio;
  }

  getCharWidthRatio(): number {
    return this.charWidthRatio;
  }

  /**
   * Initialize a unit for animation
   */
  initializeUnit(
    unit: SemanticUnit,
    directive: AnimationDirective,
    basePosition: { x: number; y: number },
    fontSize: number
  ): RenderedUnit {
    const chars: RenderedCharacter[] = [];
    let charX = 0;

    for (let i = 0; i < unit.characters.length; i++) {
      const charData = unit.characters[i];
      const charWidth = this.estimateCharWidth(charData.char, fontSize);

      const basePos = {
        x: basePosition.x + charX,
        y: basePosition.y,
      };

      const initialTransform: CharacterAnimation = {
        x: 0,
        y: 0,
        scale: 0,
        rotation: 0,
        opacity: 0,
      };

      chars.push({
        char: charData.char,
        index: i,
        basePosition: basePos,
        currentTransform: { ...initialTransform },
        targetTransform: {
          x: 0,
          y: 0,
          scale: directive.style.scale,
          rotation: directive.style.rotation,
          opacity: directive.style.opacity,
        },
      });

      // Initialize physics if needed
      if (directive.physics) {
        const physicsId = `${unit.id}-char-${i}`;
        this.physics.initializeState(physicsId, basePos, directive.physics);
      }

      charX += charWidth;
    }

    const renderedUnit: RenderedUnit = {
      id: unit.id,
      unit,
      directive,
      position: basePosition,
      bounds: {
        x: basePosition.x,
        y: basePosition.y,
        width: charX,
        height: fontSize,
      },
      zIndex: 0,
      state: 'entering',
      startTime: this.globalTime + directive.timing.delay,
      characters: chars,
    };

    this.activeUnits.set(unit.id, {
      renderedUnit,
      entranceProgress: 0,
      exitProgress: 0,
      isComplete: false,
    });

    return renderedUnit;
  }

  /**
   * Update all active units for the current frame
   */
  update(deltaTime: number): RenderedUnit[] {
    this.globalTime += deltaTime;
    const results: RenderedUnit[] = [];

    for (const [id, state] of this.activeUnits) {
      const { renderedUnit, isComplete } = state;

      if (isComplete) continue;

      const elapsed = this.globalTime - renderedUnit.startTime;
      const directive = renderedUnit.directive;

      if (elapsed < 0) {
        // Not started yet
        results.push(renderedUnit);
        continue;
      }

      // Update animation phase
      if (renderedUnit.state === 'entering') {
        state.entranceProgress = Math.min(1, elapsed / directive.timing.entranceDuration);

        if (state.entranceProgress >= 1) {
          renderedUnit.state = 'active';
        }
      } else if (renderedUnit.state === 'active') {
        const activeTime = elapsed - directive.timing.entranceDuration;

        if (directive.timing.holdDuration && activeTime > directive.timing.holdDuration) {
          if (directive.exit) {
            renderedUnit.state = 'exiting';
          } else {
            renderedUnit.state = 'complete';
            state.isComplete = true;
          }
        }
      } else if (renderedUnit.state === 'exiting') {
        const exitStart = directive.timing.entranceDuration + (directive.timing.holdDuration || 0);
        const exitElapsed = elapsed - exitStart;
        state.exitProgress = Math.min(1, exitElapsed / (directive.timing.exitDuration || 300));

        if (state.exitProgress >= 1) {
          renderedUnit.state = 'complete';
          state.isComplete = true;
        }
      }

      // Update each character
      this.updateCharacters(renderedUnit, state, deltaTime);

      results.push(renderedUnit);
    }

    return results;
  }

  /**
   * Update character transforms for a unit
   */
  private updateCharacters(
    unit: RenderedUnit,
    state: ActiveUnitState,
    deltaTime: number
  ): void {
    const directive = unit.directive;
    const generator = ENTRANCE_GENERATORS[directive.entrance] || ENTRANCE_GENERATORS.fade_in;
    const totalChars = unit.characters.length;

    // Calculate shared stagger denominator — all chars share the same denominator
    // so the last character reaches progress=1 exactly when entrance ends
    const maxStaggerDelay = totalChars > 1
      ? (directive.timing.staggerPerChar * (totalChars - 1)) / directive.timing.entranceDuration
      : 0;
    const staggerDenom = Math.max(0.001, 1 - maxStaggerDelay);

    for (let i = 0; i < unit.characters.length; i++) {
      const char = unit.characters[i];

      // Calculate staggered progress for this character
      const staggerDelay = (directive.timing.staggerPerChar * i) / directive.timing.entranceDuration;
      const charProgress = Math.max(0, Math.min(1,
        (state.entranceProgress - staggerDelay) / staggerDenom
      ));

      let transform: CharacterAnimation;

      if (unit.state === 'entering') {
        transform = generator(charProgress, i, totalChars, char.basePosition);
      } else if (unit.state === 'exiting' && directive.exit) {
        // Use dedicated exit generator if available, otherwise reverse entrance
        const exitGen = EXIT_GENERATORS[directive.exit];
        if (exitGen) {
          transform = exitGen(state.exitProgress, i, totalChars, char.basePosition);
        } else {
          transform = generator(1 - state.exitProgress, i, totalChars, char.basePosition);
        }
      } else {
        // Active state - apply continuous animation if any
        transform = { ...char.targetTransform };

        if (directive.continuous) {
          const continuousGen = CONTINUOUS_GENERATORS[directive.continuous];
          if (continuousGen) {
            const continuous = continuousGen(this.globalTime / 1000, i);
            Object.assign(transform, continuous);
          }
        }
      }

      // Apply character overrides if specified
      if (directive.characterOverrides?.has(i)) {
        const override = directive.characterOverrides.get(i)!;
        transform = { ...transform, ...override };
      }

      // Apply final scale from directive
      transform.scale *= directive.style.scale;

      // Update physics if applicable
      if (directive.physics && unit.state === 'entering') {
        const physicsId = `${unit.id}-char-${i}`;
        const physicsState = this.physics.update(physicsId, directive.physics, deltaTime);

        if (physicsState) {
          transform.x += physicsState.position.x - char.basePosition.x;
          transform.y += physicsState.position.y - char.basePosition.y;
          transform.rotation += physicsState.rotation;
        }
      }

      char.currentTransform = transform;
    }
  }

  /**
   * Estimate character width for layout.
   * Uses a single ratio for all characters since the default font (JetBrains Mono)
   * is monospace — every character including space has the same advance width.
   * Call setCharWidthRatio() with a canvas-measured value for best accuracy.
   */
  private estimateCharWidth(_char: string, fontSize: number): number {
    return fontSize * this.charWidthRatio;
  }

  /**
   * Trigger early exit for a unit
   */
  triggerExit(unitId: string): void {
    const state = this.activeUnits.get(unitId);
    if (state && state.renderedUnit.state === 'active') {
      state.renderedUnit.state = 'exiting';
    }
  }

  /**
   * Remove a completed unit
   */
  removeUnit(unitId: string): void {
    const state = this.activeUnits.get(unitId);
    if (state) {
      // Clean up physics
      for (let i = 0; i < state.renderedUnit.characters.length; i++) {
        this.physics.removeState(`${unitId}-char-${i}`);
      }
      this.activeUnits.delete(unitId);
    }
  }

  /**
   * Clear all units
   */
  clear(): void {
    this.physics.clear();
    this.springs.clear();
    this.activeUnits.clear();
    this.globalTime = 0;
  }

  /**
   * Get easing function by name
   */
  getEasing(name: EasingName): EasingFunction {
    return EASINGS[name] || EASINGS.easeOut;
  }

  /**
   * Set global time (for sync with audio)
   */
  setGlobalTime(time: number): void {
    this.globalTime = time;
  }
}

// =============================================================================
// TYPES
// =============================================================================

interface ActiveUnitState {
  renderedUnit: RenderedUnit;
  entranceProgress: number;
  exitProgress: number;
  isComplete: boolean;
}

// =============================================================================
// EXPORTS
// =============================================================================

export const choreographyEngine = new ChoreographyEngine();
