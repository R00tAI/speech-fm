/**
 * EmotionMapper
 *
 * Maps emotional states and linguistic patterns to visual parameters.
 * This is the translator between meaning and motion.
 *
 * Converts:
 * - Emotional states → color palettes, intensities, speeds
 * - Linguistic patterns → animation presets
 * - Narrative context → compositional styles
 */

import {
  EmotionalState,
  LinguisticPattern,
  NarrativeContext,
  EntranceAnimation,
  ExitAnimation,
  ContinuousAnimation,
  EffectType,
  AnimationDirective,
  SemanticUnit,
  PhysicsParams,
} from './types';
import { typographySelector } from './TypographyStyleSelector';

// =============================================================================
// EMOTION TO VISUAL MAPPING
// =============================================================================

export interface EmotionVisuals {
  primaryColor: string;
  secondaryColor: string;
  glowColor: string;
  glowIntensity: number;
  baseScale: number;
  fontWeight: number;
  letterSpacing: number;
  speed: number;                  // animation speed multiplier
  jitter: number;                 // micro-movement amount
  preferredEntrances: EntranceAnimation[];
  preferredEffects: EffectType[];
  continuousAnimation?: ContinuousAnimation;
}

const EMOTION_VISUALS: Record<EmotionalState, EmotionVisuals> = {
  shock: {
    primaryColor: '#FFFFFF',
    secondaryColor: '#FF4444',
    glowColor: '#FF6666',
    glowIntensity: 1.5,
    baseScale: 1.4,
    fontWeight: 800,
    letterSpacing: 0.15,
    speed: 0.6,                   // slightly slower for impact
    jitter: 0.02,
    preferredEntrances: ['slam_in', 'crash_down', 'zoom_punch', 'explode_in', 'impact_slam', 'cinematic_flash'],
    preferredEffects: ['screen_shake', 'flash', 'chromatic_aberration'],
    continuousAnimation: 'jitter',
  },
  joy: {
    primaryColor: '#FFD700',
    secondaryColor: '#FFA500',
    glowColor: '#FFEE88',
    glowIntensity: 1.2,
    baseScale: 1.15,
    fontWeight: 600,
    letterSpacing: 0.08,
    speed: 1.2,
    jitter: 0,
    preferredEntrances: ['bounce_in', 'elastic_pop', 'balloon_float', 'bloom', 'word_cascade'],
    preferredEffects: ['confetti', 'glitter_burst', 'stardust'],
    continuousAnimation: 'breathe',
  },
  anger: {
    primaryColor: '#FF2222',
    secondaryColor: '#880000',
    glowColor: '#FF4444',
    glowIntensity: 1.8,
    baseScale: 1.3,
    fontWeight: 900,
    letterSpacing: 0.02,
    speed: 0.8,
    jitter: 0.05,
    preferredEntrances: ['slam_in', 'crash_down', 'whip_in', 'impact_slam', 'scale_compress'],
    preferredEffects: ['ember_trail', 'screen_shake', 'heat_distortion'],
    continuousAnimation: 'jitter',
  },
  sadness: {
    primaryColor: '#6688AA',
    secondaryColor: '#445566',
    glowColor: '#8899AA',
    glowIntensity: 0.5,
    baseScale: 0.9,
    fontWeight: 300,
    letterSpacing: 0.05,
    speed: 0.6,
    jitter: 0,
    preferredEntrances: ['fade_in', 'gravity_drop', 'dissolve_in', 'smoke_form', 'tracking_in'],
    preferredEffects: ['rain_streak', 'vignette_pulse'],
    continuousAnimation: 'breathe',
  },
  sarcasm: {
    primaryColor: '#AA88FF',
    secondaryColor: '#6644AA',
    glowColor: '#BB99FF',
    glowIntensity: 0.8,
    baseScale: 1.05,
    fontWeight: 400,
    letterSpacing: 0.1,
    speed: 1.1,
    jitter: 0,
    preferredEntrances: ['slide_left', 'pendulum_swing', 'wave_in', 'perspective_roll', 'flip_in_x'],
    preferredEffects: ['chromatic_aberration'],
    continuousAnimation: 'subtle_rotate',
  },
  confusion: {
    primaryColor: '#AABBCC',
    secondaryColor: '#778899',
    glowColor: '#BBCCDD',
    glowIntensity: 0.6,
    baseScale: 1.0,
    fontWeight: 400,
    letterSpacing: 0.12,
    speed: 0.9,
    jitter: 0.03,
    preferredEntrances: ['scatter_gather', 'glitch_in', 'ascii_decode'],
    preferredEffects: ['glitter_burst'],
    continuousAnimation: 'hover',
  },
  confidence: {
    primaryColor: '#FFD700',
    secondaryColor: '#DAA520',
    glowColor: '#FFEE55',
    glowIntensity: 1.0,
    baseScale: 1.2,
    fontWeight: 700,
    letterSpacing: 0.08,
    speed: 1.0,
    jitter: 0,
    preferredEntrances: ['materialize', 'reveal_mask', 'scale_up', 'unfold', 'cinematic_reveal', 'brush_stroke_reveal'],
    preferredEffects: ['neon_glow', 'drop_shadow', 'chrome_shimmer'],
    continuousAnimation: 'glow_pulse',
  },
  fear: {
    primaryColor: '#88AACC',
    secondaryColor: '#445566',
    glowColor: '#99BBDD',
    glowIntensity: 0.4,
    baseScale: 0.85,
    fontWeight: 400,
    letterSpacing: -0.02,
    speed: 1.3,
    jitter: 0.06,
    preferredEntrances: ['glitch_in', 'fade_in', 'typewriter'],
    preferredEffects: ['scan_lines', 'vignette_pulse', 'film_grain'],
    continuousAnimation: 'jitter',
  },
  relief: {
    primaryColor: '#88DDAA',
    secondaryColor: '#66AA88',
    glowColor: '#AAFFCC',
    glowIntensity: 0.8,
    baseScale: 1.0,
    fontWeight: 400,
    letterSpacing: 0.15,
    speed: 0.7,
    jitter: 0,
    preferredEntrances: ['fade_in', 'balloon_float', 'dissolve_in', 'grow_in'],
    preferredEffects: ['stardust'],
    continuousAnimation: 'breathe',
  },
  awe: {
    primaryColor: '#FFFFFF',
    secondaryColor: '#AACCFF',
    glowColor: '#DDEEFF',
    glowIntensity: 1.5,
    baseScale: 1.3,
    fontWeight: 300,
    letterSpacing: 0.2,
    speed: 0.5,
    jitter: 0,
    preferredEntrances: ['materialize', 'bloom', 'reveal_mask', 'dissolve_in', 'smoke_form', 'liquid_morph'],
    preferredEffects: ['stardust', 'neon_glow', 'ghost_trail', 'neon_layers'],
    continuousAnimation: 'glow_pulse',
  },
  excitement: {
    primaryColor: '#FF6600',
    secondaryColor: '#FFAA00',
    glowColor: '#FFCC44',
    glowIntensity: 1.3,
    baseScale: 1.25,
    fontWeight: 700,
    letterSpacing: 0.05,
    speed: 1.4,
    jitter: 0.02,
    preferredEntrances: ['elastic_pop', 'bounce_in', 'whip_in', 'spring_in', 'word_cascade', 'scale_compress'],
    preferredEffects: ['sparks', 'confetti', 'electric_arc'],
    continuousAnimation: 'pulse',
  },
  tenderness: {
    primaryColor: '#FFAACC',
    secondaryColor: '#FF88AA',
    glowColor: '#FFCCDD',
    glowIntensity: 0.6,
    baseScale: 0.95,
    fontWeight: 300,
    letterSpacing: 0.1,
    speed: 0.6,
    jitter: 0,
    preferredEntrances: ['fade_in', 'bloom', 'grow_in', 'dissolve_in'],
    preferredEffects: ['stardust'],
    continuousAnimation: 'breathe',
  },
  frustration: {
    primaryColor: '#FF8844',
    secondaryColor: '#CC4422',
    glowColor: '#FFAA66',
    glowIntensity: 1.0,
    baseScale: 1.1,
    fontWeight: 600,
    letterSpacing: 0,
    speed: 1.0,
    jitter: 0.04,
    preferredEntrances: ['slam_in', 'whip_in', 'crash_down'],
    preferredEffects: ['ember_trail', 'screen_shake'],
    continuousAnimation: 'jitter',
  },
  curiosity: {
    primaryColor: '#44DDFF',
    secondaryColor: '#22AACC',
    glowColor: '#66EEFF',
    glowIntensity: 0.9,
    baseScale: 1.05,
    fontWeight: 500,
    letterSpacing: 0.08,
    speed: 1.1,
    jitter: 0,
    preferredEntrances: ['pendulum_swing', 'balloon_float', 'wave_in', 'unfold', 'ink_drop', 'tracking_in'],
    preferredEffects: ['stardust'],
    continuousAnimation: 'hover',
  },
  determination: {
    primaryColor: '#FFFFFF',
    secondaryColor: '#CCCCCC',
    glowColor: '#FFFFFF',
    glowIntensity: 1.2,
    baseScale: 1.15,
    fontWeight: 800,
    letterSpacing: 0.05,
    speed: 0.9,
    jitter: 0,
    preferredEntrances: ['reveal_mask', 'scale_up', 'materialize', 'unfold'],
    preferredEffects: ['neon_glow', 'drop_shadow'],
    continuousAnimation: 'glow_pulse',
  },
  neutral: {
    primaryColor: '#DDDDDD',
    secondaryColor: '#AAAAAA',
    glowColor: '#EEEEEE',
    glowIntensity: 0.3,
    baseScale: 1.0,
    fontWeight: 400,
    letterSpacing: 0.05,
    speed: 1.0,
    jitter: 0,
    preferredEntrances: ['slide_up', 'reveal_mask', 'materialize', 'spring_in', 'grow_in', 'curtain_reveal'],
    preferredEffects: [],
    continuousAnimation: undefined,
  },
};

// =============================================================================
// PATTERN TO ANIMATION MAPPING
// =============================================================================

interface PatternAnimation {
  entrance: EntranceAnimation;
  characterLevel: boolean;         // animate per-character or whole word
  staggerMs: number;               // delay between characters
  durationMultiplier: number;
  specialBehavior?: 'wave' | 'ripple' | 'cascade' | 'random' | 'converge';
  exitAnimation?: ExitAnimation;
  physicsPreset?: 'bouncy' | 'heavy' | 'floaty' | 'snappy' | 'elastic';
}

const PATTERN_ANIMATIONS: Record<LinguisticPattern, PatternAnimation> = {
  elongated_vowel: {
    entrance: 'wave_in',
    characterLevel: true,
    staggerMs: 60,
    durationMultiplier: 1.5,
    specialBehavior: 'wave',
  },
  stuttered: {
    entrance: 'glitch_in',
    characterLevel: true,
    staggerMs: 30,
    durationMultiplier: 1.2,
    specialBehavior: 'random',
  },
  trailing_off: {
    entrance: 'fade_in',
    characterLevel: true,
    staggerMs: 80,
    durationMultiplier: 2.0,
    exitAnimation: 'dissolve',
  },
  building_intensity: {
    entrance: 'scale_up',
    characterLevel: false,
    staggerMs: 0,
    durationMultiplier: 1.0,
  },
  sudden_realization: {
    entrance: 'crash_down',
    characterLevel: false,
    staggerMs: 0,
    durationMultiplier: 0.6,
    physicsPreset: 'heavy',
  },
  rhetorical_question: {
    entrance: 'pendulum_swing',
    characterLevel: false,
    staggerMs: 0,
    durationMultiplier: 1.2,
  },
  enumeration: {
    entrance: 'cascade_letters',
    characterLevel: true,
    staggerMs: 50,
    durationMultiplier: 1.0,
    specialBehavior: 'cascade',
  },
  contrast_pair: {
    entrance: 'slide_left',
    characterLevel: false,
    staggerMs: 0,
    durationMultiplier: 0.8,
  },
  onomatopoeia: {
    entrance: 'explode_in',
    characterLevel: true,
    staggerMs: 20,
    durationMultiplier: 0.8,
    specialBehavior: 'ripple',
    physicsPreset: 'elastic',
  },
  whispered_aside: {
    entrance: 'fade_in',
    characterLevel: false,
    staggerMs: 0,
    durationMultiplier: 1.5,
  },
  all_caps_emphasis: {
    entrance: 'slam_in',
    characterLevel: false,
    staggerMs: 0,
    durationMultiplier: 0.7,
    physicsPreset: 'heavy',
  },
  exclamation_burst: {
    entrance: 'elastic_pop',
    characterLevel: false,
    staggerMs: 0,
    durationMultiplier: 0.6,
    physicsPreset: 'elastic',
  },
  question_float: {
    entrance: 'balloon_float',
    characterLevel: false,
    staggerMs: 0,
    durationMultiplier: 1.3,
    physicsPreset: 'floaty',
  },
  repetition: {
    entrance: 'bounce_in',
    characterLevel: false,
    staggerMs: 0,
    durationMultiplier: 0.5,
    physicsPreset: 'bouncy',
  },
  pause_beat: {
    entrance: 'fade_in',
    characterLevel: false,
    staggerMs: 0,
    durationMultiplier: 3.0,
  },
  quoted_speech: {
    entrance: 'curtain_reveal',
    characterLevel: false,
    staggerMs: 0,
    durationMultiplier: 1.2,
  },
  parenthetical: {
    entrance: 'fade_in',
    characterLevel: false,
    staggerMs: 0,
    durationMultiplier: 1.0,
  },
  dramatic_pause: {
    entrance: 'fade_in',
    characterLevel: false,
    staggerMs: 0,
    durationMultiplier: 2.5,
  },
  normal: {
    entrance: 'slide_up',
    characterLevel: false,
    staggerMs: 0,
    durationMultiplier: 1.0,
  },
};

// =============================================================================
// PHYSICS PRESETS
// =============================================================================

const PHYSICS_PRESETS: Record<string, PhysicsParams> = {
  bouncy: {
    gravity: 800,
    bounce: 0.6,
    friction: 0.1,
    mass: 1,
    tension: 200,
    dampening: 15,
    velocity: { x: 0, y: 0 },
    angularVelocity: 0,
  },
  heavy: {
    gravity: 1500,
    bounce: 0.2,
    friction: 0.3,
    mass: 3,
    tension: 400,
    dampening: 30,
    velocity: { x: 0, y: 0 },
    angularVelocity: 0,
  },
  floaty: {
    gravity: 100,
    bounce: 0.1,
    friction: 0.05,
    mass: 0.3,
    tension: 50,
    dampening: 5,
    velocity: { x: 0, y: 0 },
    angularVelocity: 0,
  },
  snappy: {
    gravity: 0,
    bounce: 0,
    friction: 0.5,
    mass: 1,
    tension: 600,
    dampening: 25,
    velocity: { x: 0, y: 0 },
    angularVelocity: 0,
  },
  elastic: {
    gravity: 400,
    bounce: 0.8,
    friction: 0.05,
    mass: 0.8,
    tension: 150,
    dampening: 8,
    velocity: { x: 0, y: 0 },
    angularVelocity: 0,
  },
};

// =============================================================================
// EMOTION MAPPER CLASS
// =============================================================================

export class EmotionMapper {
  private recentEntrances: EntranceAnimation[] = [];
  private maxRecentHistory = 5;

  /**
   * Map a semantic unit to an animation directive
   */
  mapToDirective(unit: SemanticUnit, contextEmotion?: EmotionalState): AnimationDirective {
    const emotion = unit.emotion !== 'neutral' ? unit.emotion : (contextEmotion || 'neutral');
    const emotionVisuals = EMOTION_VISUALS[emotion];
    const patternAnim = PATTERN_ANIMATIONS[unit.pattern];

    // Choose entrance animation
    const entrance = this.selectEntrance(unit, emotionVisuals, patternAnim);
    this.recordEntrance(entrance);

    // Choose effects based on intensity
    const effects = this.selectEffects(unit, emotionVisuals);

    // Snappy entrance — text should feel responsive, not sluggish
    const baseDuration = 320; // ms
    const entranceDuration = baseDuration * patternAnim.durationMultiplier * (1 / emotionVisuals.speed);

    // Hold just long enough to be read, then get out of the way for new text
    const rawHoldDuration = unit.duration - entranceDuration;
    const minHoldDuration = 350 + (unit.text.length * 18); // shorter hold prevents pile-up
    const holdDuration = Math.max(minHoldDuration, rawHoldDuration);

    // Select typography style (font family, weight, spacing)
    const isPhrase = unit.text.includes(' ');
    const typoStyle = typographySelector.selectStyle(emotion, unit.pattern, unit.intensity, isPhrase);

    // Build directive
    // ALL units get exit animations (reversed entrance) for motion-graphics lifecycle
    const exitAnim = patternAnim.exitAnimation || ('fade_out' as any);
    const exitDur = patternAnim.exitAnimation ? 250 : 300;

    const directive: AnimationDirective = {
      unitId: unit.id,
      entrance,
      exit: exitAnim,
      continuous: unit.intensity > 0.5 ? emotionVisuals.continuousAnimation : undefined,
      effects,
      timing: {
        delay: unit.startTime,
        entranceDuration,
        holdDuration,
        exitDuration: exitDur,
        staggerPerChar: patternAnim.characterLevel ? patternAnim.staggerMs : 0,
      },
      style: {
        scale: emotionVisuals.baseScale * (1 + (unit.intensity - 0.5) * 0.4),
        rotation: 0,
        color: emotionVisuals.primaryColor,
        fontFamily: typoStyle.fontFamily,
        fontWeight: typoStyle.fontWeight,
        letterSpacing: typoStyle.letterSpacing,
        italic: typoStyle.italic,
        opacity: 1,
      },
    };

    // Add physics if specified
    if (patternAnim.physicsPreset) {
      directive.physics = { ...PHYSICS_PRESETS[patternAnim.physicsPreset] };
    }

    // Special handling for specific patterns
    this.applyPatternSpecializations(directive, unit, patternAnim, emotionVisuals);

    return directive;
  }

  /**
   * Select entrance animation, avoiding repetition
   */
  private selectEntrance(
    unit: SemanticUnit,
    emotionVisuals: EmotionVisuals,
    patternAnim: PatternAnimation
  ): EntranceAnimation {
    // High-intensity patterns use their specific animation (unless it's a basic one)
    if (unit.intensity > 0.7 && patternAnim.entrance !== 'fade_in' && patternAnim.entrance !== 'slide_up') {
      return patternAnim.entrance;
    }

    // Build pool from pattern + emotion + global variety entrances
    const varietyEntrances: EntranceAnimation[] = [
      'reveal_mask', 'materialize', 'spring_in', 'grow_in', 'curtain_reveal',
      'wave_in', 'scale_up', 'unfold', 'bloom',
    ];

    const pool: EntranceAnimation[] = [
      patternAnim.entrance,
      ...emotionVisuals.preferredEntrances,
      ...varietyEntrances,
    ];

    // Filter out recent animations to avoid repetition
    const filtered = pool.filter(e => !this.recentEntrances.includes(e));
    const finalPool = filtered.length > 0 ? filtered : pool;

    // For normal pattern, prefer variety over repetition
    const patternWeight = unit.pattern === 'normal' ? 0.25 : 0.6;
    if (Math.random() < patternWeight) {
      return patternAnim.entrance;
    }

    return finalPool[Math.floor(Math.random() * finalPool.length)];
  }

  /**
   * Select effects based on intensity and emotion
   */
  private selectEffects(unit: SemanticUnit, emotionVisuals: EmotionVisuals): EffectType[] {
    const effects: EffectType[] = [];

    // Only add effects for high-intensity moments
    if (unit.intensity < 0.5) return effects;

    // Screen shake for very high intensity
    if (unit.intensity > 0.85) {
      effects.push('screen_shake');
    }

    // Add emotion-specific effects
    const numEffects = Math.floor(unit.intensity * 2);
    const available = [...emotionVisuals.preferredEffects];

    for (let i = 0; i < numEffects && available.length > 0; i++) {
      const idx = Math.floor(Math.random() * available.length);
      effects.push(available.splice(idx, 1)[0]);
    }

    return effects;
  }

  /**
   * Apply pattern-specific modifications to the directive
   */
  private applyPatternSpecializations(
    directive: AnimationDirective,
    unit: SemanticUnit,
    patternAnim: PatternAnimation,
    emotionVisuals: EmotionVisuals
  ): void {
    switch (unit.pattern) {
      case 'elongated_vowel':
        // Add wave behavior - each char animates with phase offset
        directive.characterOverrides = new Map();
        unit.characters.forEach((char, idx) => {
          if (char.isElongated) {
            directive.characterOverrides!.set(idx, {
              x: 0,
              y: Math.sin(idx * 0.5) * 10,
              scale: 1 + Math.sin(idx * 0.3) * 0.2,
              rotation: Math.sin(idx * 0.2) * 5,
              opacity: 1,
            });
          }
        });
        break;

      case 'all_caps_emphasis':
        // Make it HEAVY
        directive.style.scale *= 1.3;
        directive.style.fontWeight = 900;
        if (!directive.effects.includes('drop_shadow')) {
          directive.effects.push('drop_shadow');
        }
        break;

      case 'whispered_aside':
        // Small, light, to the side
        directive.style.scale *= 0.7;
        directive.style.opacity = 0.7;
        directive.style.fontWeight = 300;
        break;

      case 'onomatopoeia':
        // Explode outward from center
        directive.characterOverrides = new Map();
        const center = Math.floor(unit.characters.length / 2);
        unit.characters.forEach((char, idx) => {
          const distFromCenter = idx - center;
          directive.characterOverrides!.set(idx, {
            x: distFromCenter * 5,
            y: 0,
            scale: 1 + Math.abs(distFromCenter) * 0.05,
            rotation: distFromCenter * 3,
            opacity: 1,
          });
        });
        break;

      case 'trailing_off':
        // Fade and drift down
        directive.style.opacity = 0.6;
        directive.characterOverrides = new Map();
        unit.characters.forEach((char, idx) => {
          const progress = idx / unit.characters.length;
          directive.characterOverrides!.set(idx, {
            x: 0,
            y: progress * 20,
            scale: 1 - progress * 0.3,
            rotation: 0,
            opacity: 1 - progress * 0.5,
          });
        });
        break;

      case 'question_float':
        // Tilt slightly, add hover
        directive.style.rotation = 3;
        directive.continuous = 'hover';
        break;

      case 'stuttered':
        // Glitchy, jittery
        directive.continuous = 'jitter';
        if (!directive.effects.includes('chromatic_aberration')) {
          directive.effects.push('chromatic_aberration');
        }
        break;
    }
  }

  /**
   * Record entrance to avoid repetition
   */
  private recordEntrance(entrance: EntranceAnimation): void {
    this.recentEntrances.push(entrance);
    if (this.recentEntrances.length > this.maxRecentHistory) {
      this.recentEntrances.shift();
    }
  }

  /**
   * Get visual parameters for an emotion
   */
  getEmotionVisuals(emotion: EmotionalState): EmotionVisuals {
    return EMOTION_VISUALS[emotion];
  }

  /**
   * Reset state (for new conversation)
   */
  reset(): void {
    this.recentEntrances = [];
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export const emotionMapper = new EmotionMapper();

export const getEmotionColor = (emotion: EmotionalState): string => {
  return EMOTION_VISUALS[emotion].primaryColor;
};

export const getPatternAnimation = (pattern: LinguisticPattern): PatternAnimation => {
  return PATTERN_ANIMATIONS[pattern];
};

export const getPhysicsPreset = (preset: string): PhysicsParams | undefined => {
  return PHYSICS_PRESETS[preset];
};
