/**
 * Voice31 Kinetic Typography System - Type Definitions
 *
 * A dynamic typography engine that makes text perform, not just display.
 * Every word is an actor that knows its role, emotional weight, and timing.
 */

// =============================================================================
// SEMANTIC ANALYSIS TYPES
// =============================================================================

export type LinguisticPattern =
  | 'elongated_vowel'      // "ohhhhh", "nooooo"
  | 'stuttered'            // "w-w-wait"
  | 'trailing_off'         // "maybe..."
  | 'building_intensity'   // "bigger and BIGGER"
  | 'sudden_realization'   // "wait... OH!"
  | 'rhetorical_question'  // "You know what?"
  | 'enumeration'          // "first, second, third"
  | 'contrast_pair'        // "not this, but THAT"
  | 'onomatopoeia'         // "BOOM", "whoosh"
  | 'whispered_aside'      // "(just between us)"
  | 'all_caps_emphasis'    // "ABSOLUTELY"
  | 'exclamation_burst'    // "WOW!"
  | 'question_float'       // "really?"
  | 'repetition'           // "no no no"
  | 'pause_beat'           // "..."
  | 'quoted_speech'        // '"hello" she said'
  | 'parenthetical'        // "(by the way)"
  | 'dramatic_pause'       // "and then—"
  | 'normal';              // regular text

export type EmotionalState =
  | 'shock'
  | 'joy'
  | 'anger'
  | 'sadness'
  | 'sarcasm'
  | 'confusion'
  | 'confidence'
  | 'fear'
  | 'relief'
  | 'awe'
  | 'excitement'
  | 'tenderness'
  | 'frustration'
  | 'curiosity'
  | 'determination'
  | 'neutral';

export type NarrativeContext =
  | 'story_climax'
  | 'punchline'
  | 'plot_twist'
  | 'confession'
  | 'explanation'
  | 'memory'
  | 'prediction'
  | 'quote'
  | 'casual'
  | 'formal';

export interface SemanticUnit {
  id: string;
  text: string;
  characters: CharacterData[];
  pattern: LinguisticPattern;
  emotion: EmotionalState;
  intensity: number;          // 0-1 scale
  isEmphasis: boolean;
  startTime: number;          // estimated ms from start
  duration: number;           // estimated ms
  metadata: {
    isAllCaps: boolean;
    hasElongation: boolean;
    elongationFactor: number; // how stretched (1 = normal, 2 = double)
    punctuation: string[];
    isQuoted: boolean;
    isParenthetical: boolean;
    position: 'start' | 'middle' | 'end';
    wordIndex: number;
    totalWords: number;
  };
}

export interface CharacterData {
  char: string;
  index: number;
  isSpace: boolean;
  isElongated: boolean;
  elongationIndex: number;    // position in elongation sequence
  wordPosition: 'first' | 'middle' | 'last' | 'only';
}

export interface AnalysisResult {
  units: SemanticUnit[];
  overallEmotion: EmotionalState;
  narrativeContext: NarrativeContext;
  hasDramaticMoments: boolean;
  climaxIndex: number | null;  // which unit is the climax
  totalDuration: number;
}

// =============================================================================
// ANIMATION TYPES
// =============================================================================

export type EntranceAnimation =
  // Basic
  | 'fade_in'
  | 'slide_up'
  | 'slide_down'
  | 'slide_left'
  | 'slide_right'
  | 'scale_up'
  | 'scale_down'
  // Physics-based
  | 'gravity_drop'
  | 'balloon_float'
  | 'pendulum_swing'
  | 'bounce_in'
  | 'elastic_pop'
  | 'spring_in'
  | 'ricochet'
  // Dramatic
  | 'slam_in'
  | 'crash_down'
  | 'explode_in'
  | 'zoom_punch'
  | 'whip_in'
  // Organic
  | 'wave_in'
  | 'ripple_in'
  | 'pour_in'
  | 'grow_in'
  | 'bloom'
  // Tech/Glitch
  | 'glitch_in'
  | 'ascii_decode'
  | 'binary_stream'
  | 'typewriter'
  | 'terminal_print'
  // Elegant
  | 'dissolve_in'
  | 'materialize'
  | 'unfold'
  | 'reveal_mask'
  | 'curtain_reveal'
  // Character-level
  | 'cascade_letters'
  | 'domino_chain'
  | 'scatter_gather'
  | 'orbit_settle'
  | 'magnetic_pull'
  // Premium cinematic
  | 'cinematic_reveal'
  | 'impact_slam'
  | 'liquid_morph'
  | 'brush_stroke_reveal'
  | 'word_cascade'
  | 'perspective_roll'
  | 'scale_compress'
  | 'smoke_form'
  | 'curtain_drop_pro'
  | 'ink_drop'
  | 'tracking_in'
  | 'flip_in_x'
  | 'cinematic_flash';

export type ExitAnimation =
  | 'fade_out'
  | 'slide_out'
  | 'scale_down'
  | 'gravity_fall'
  | 'float_away'
  | 'explode_out'
  | 'shatter'
  | 'vacuum_suck'
  | 'dissolve'
  | 'smoke_out'
  | 'glitch_out'
  | 'melt'
  | 'burn_away'
  | 'sweep_away'
  // Premium exits
  | 'shatter_out'
  | 'vaporize'
  | 'eraser_wipe'
  | 'gravity_collapse'
  | 'blur_dissolve';

export type ContinuousAnimation =
  | 'breathe'
  | 'pulse'
  | 'hover'
  | 'jitter'
  | 'wave'
  | 'flicker'
  | 'glow_pulse'
  | 'color_shift'
  | 'subtle_rotate'
  | 'heartbeat'
  // Premium continuous
  | 'gentle_sway'
  | 'pulse_scale'
  | 'metallic_shimmer'
  | 'glow_breathe'
  | 'lfo_modulate';

export type EffectType =
  // Particles
  | 'ember_trail'
  | 'frost_crystals'
  | 'electric_arc'
  | 'glitter_burst'
  | 'rain_streak'
  | 'smoke_wisps'
  | 'stardust'
  | 'confetti'
  | 'sparks'
  // Visual
  | 'neon_glow'
  | 'drop_shadow'
  | 'chromatic_aberration'
  | 'scan_lines'
  | 'film_grain'
  | 'heat_distortion'
  | 'ink_bleed'
  | 'ghost_trail'
  // Environmental
  | 'screen_shake'
  | 'vignette_pulse'
  | 'flash'
  | 'ripple_distort'
  // Premium effects
  | 'liquid_metal_distort'
  | 'chrome_shimmer'
  | 'neon_layers'
  | 'retro_crt';

export interface AnimationDirective {
  unitId: string;
  entrance: EntranceAnimation;
  exit?: ExitAnimation;
  continuous?: ContinuousAnimation;
  effects: EffectType[];
  timing: {
    delay: number;
    entranceDuration: number;
    holdDuration: number;
    exitDuration?: number;
    staggerPerChar: number;
  };
  style: {
    scale: number;
    rotation: number;
    color?: string;
    fontFamily?: string;
    fontWeight?: number;
    letterSpacing?: number;
    italic?: boolean;
    opacity: number;
  };
  physics?: PhysicsParams;
  characterOverrides?: Map<number, Partial<CharacterAnimation>>;
}

export interface CharacterAnimation {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
  color?: string;
  blur?: number;
  skewX?: number;
  skewY?: number;
}

export interface PhysicsParams {
  gravity: number;
  bounce: number;
  friction: number;
  mass: number;
  tension: number;      // spring tension
  dampening: number;    // spring dampening
  velocity: { x: number; y: number };
  angularVelocity: number;
}

// =============================================================================
// COMPOSITION TYPES
// =============================================================================

export interface CompositionState {
  activeUnits: Map<string, RenderedUnit>;
  exitingUnits: Map<string, RenderedUnit>;
  availableSpace: BoundingBox;
  focusPoint: { x: number; y: number };
  zIndexCounter: number;
}

export interface RenderedUnit {
  id: string;
  unit: SemanticUnit;
  directive: AnimationDirective;
  position: { x: number; y: number };
  bounds: BoundingBox;
  zIndex: number;
  state: 'entering' | 'active' | 'exiting' | 'complete';
  startTime: number;
  characters: RenderedCharacter[];
}

export interface RenderedCharacter {
  char: string;
  index: number;
  basePosition: { x: number; y: number };
  currentTransform: CharacterAnimation;
  targetTransform: CharacterAnimation;
  physics?: PhysicsState;
}

export interface PhysicsState {
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  acceleration: { x: number; y: number };
  rotation: number;
  angularVelocity: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

// =============================================================================
// SURPRISE DIRECTOR TYPES
// =============================================================================

export type MagicMoment =
  | 'callback'              // Word from earlier returns
  | 'underline_grow'        // Underline draws itself
  | 'thought_bubble'        // Parenthetical in bubble
  | 'redaction'             // Scribble out, rewrite
  | 'split_personality'     // Conflicting thoughts argue
  | 'zoom_punch'            // Camera zooms into word
  | 'letter_swap'           // Anagram shuffle
  | 'ghost_echo'            // Fading afterimages
  | 'magnetic_poetry'       // Words rearrange
  | 'fourth_wall'           // Text acknowledges screen
  | 'typewriter_jam'        // Letter stuck, repeats
  | 'palimpsest'            // Write over ghost text
  | 'stage_direction'       // Italics like script
  | 'footnote_drop'         // Context drops with asterisk
  | 'word_painting';        // Text forms shape

export interface SurpriseState {
  surpriseBudget: number;           // 0-1, decreases with use
  lastSurpriseTime: number;
  recentAnimations: EntranceAnimation[];
  conversationHistory: string[];    // for callbacks
  escalationLevel: number;          // how dramatic we've been
}

// =============================================================================
// SYNC CONTROLLER TYPES
// =============================================================================

export interface AudioState {
  isPlaying: boolean;
  currentTime: number;
  pitch: number;          // relative to baseline
  volume: number;         // 0-1
  speechRate: number;     // words per second
  isPaused: boolean;
  emotion?: EmotionalState;
}

export interface SyncEvent {
  type: 'word_start' | 'word_end' | 'pause' | 'emphasis' | 'pitch_change' | 'volume_change';
  timestamp: number;
  data?: any;
}

// =============================================================================
// RENDERER TYPES
// =============================================================================

export interface RenderConfig {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  pixelRatio: number;
  fontFamily: string;
  baseFontSize: number;
  baseColor: string;
  glowColor: string;
  backgroundColor: string;
  crtEffects: boolean;
  particlesEnabled: boolean;
}

export interface RenderFrame {
  timestamp: number;
  deltaTime: number;
  units: RenderedUnit[];
  particles: Particle[];
  globalEffects: GlobalEffect[];
}

export interface Particle {
  id: string;
  type: EffectType;
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  life: number;          // 0-1, decreases
  size: number;
  color: string;
  opacity: number;
  rotation: number;
}

export interface GlobalEffect {
  type: 'screen_shake' | 'vignette' | 'flash' | 'ripple';
  intensity: number;
  duration: number;
  elapsed: number;
}

// =============================================================================
// EASING FUNCTIONS
// =============================================================================

export type EasingFunction = (t: number) => number;

export type EasingName =
  | 'linear'
  | 'easeIn'
  | 'easeOut'
  | 'easeInOut'
  | 'easeInQuad'
  | 'easeOutQuad'
  | 'easeInCubic'
  | 'easeOutCubic'
  | 'easeInQuart'
  | 'easeOutQuart'
  | 'easeInExpo'
  | 'easeOutExpo'
  | 'easeInBack'
  | 'easeOutBack'
  | 'easeInElastic'
  | 'easeOutElastic'
  | 'easeOutBounce'
  | 'spring'
  | 'springAlt';
