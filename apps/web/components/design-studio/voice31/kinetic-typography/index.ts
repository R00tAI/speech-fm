/**
 * Voice31 Kinetic Typography System
 *
 * A dynamic typography engine that makes text perform, not just display.
 *
 * ARCHITECTURE:
 * ─────────────────────────────────────────────────────────────────────
 *
 *   INCOMING TEXT (from Hume EVI)
 *          │
 *          ▼
 *   ┌─────────────────────────────┐
 *   │   SemanticTextAnalyzer      │  Detects patterns, emotions,
 *   │                             │  linguistic structures
 *   └─────────────────────────────┘
 *          │
 *          ▼
 *   ┌─────────────────────────────┐
 *   │   EmotionMapper             │  Maps emotions to visual
 *   │                             │  parameters & animation presets
 *   └─────────────────────────────┘
 *          │
 *          ▼
 *   ┌─────────────────────────────┐
 *   │   SurpriseDirector          │  Decides when to deploy
 *   │                             │  "magic moments"
 *   └─────────────────────────────┘
 *          │
 *          ▼
 *   ┌─────────────────────────────┐
 *   │   ChoreographyEngine        │  Orchestrates all animations,
 *   │                             │  timing, and physics
 *   └─────────────────────────────┘
 *          │
 *          ├──────────────────────────────────┐
 *          │                                  │
 *          ▼                                  ▼
 *   ┌─────────────────────┐          ┌─────────────────────┐
 *   │   PhysicsSimulator  │          │   ParticleSystem    │
 *   │                     │          │                     │
 *   │   Gravity, springs, │          │   Embers, glitter,  │
 *   │   bouncing, etc.    │          │   sparks, etc.      │
 *   └─────────────────────┘          └─────────────────────┘
 *          │                                  │
 *          └──────────────────────────────────┘
 *                         │
 *                         ▼
 *   ┌─────────────────────────────────────────────────────┐
 *   │            CompositionManager                        │
 *   │                                                      │
 *   │   Spatial layout, collision avoidance, z-ordering   │
 *   └─────────────────────────────────────────────────────┘
 *                         │
 *                         ▼
 *   ┌─────────────────────────────────────────────────────┐
 *   │         KineticTypographyRenderer                    │
 *   │                                                      │
 *   │   Canvas-based rendering with CRT effects           │
 *   └─────────────────────────────────────────────────────┘
 *
 * ─────────────────────────────────────────────────────────────────────
 *
 * USAGE:
 *
 *   import { KineticTypographyRenderer } from './kinetic-typography';
 *
 *   <KineticTypographyRenderer
 *     text="ohhhhhh SHIT!"
 *     isActive={true}
 *     width={800}
 *     height={600}
 *     color="amber"
 *   />
 *
 * ─────────────────────────────────────────────────────────────────────
 *
 * KEY FEATURES:
 *
 * 1. SEMANTIC ANALYSIS
 *    - Detects elongated vowels ("ohhhhh" → wave animation)
 *    - Detects ALL CAPS ("SHIT" → slam/drop animation)
 *    - Detects punctuation patterns (!!!, ???, ...)
 *    - Detects onomatopoeia (BOOM, whoosh)
 *    - Detects emotional keywords
 *
 * 2. EMOTION MAPPING
 *    - Maps 16 emotional states to visual styles
 *    - Color palettes, glow intensities, animation speeds
 *    - Per-emotion animation preferences
 *
 * 3. PHYSICS
 *    - Gravity and falling
 *    - Bouncing and collisions
 *    - Spring/elastic behavior
 *    - Pendulum motion
 *    - Floating/buoyancy
 *
 * 4. PARTICLES
 *    - Ember trails, glitter bursts
 *    - Electric arcs, confetti
 *    - Smoke, stardust
 *    - Screen shake, flash
 *
 * 5. MAGIC MOMENTS
 *    - Callbacks (word from earlier returns)
 *    - Underline grow
 *    - Zoom punch
 *    - Ghost echo
 *    - Fourth wall breaking
 *    - And more...
 *
 * ─────────────────────────────────────────────────────────────────────
 */

// Core types
export * from './types';

// Analysis
export { SemanticTextAnalyzer, analyzeText } from './SemanticTextAnalyzer';

// Mapping
export {
  EmotionMapper,
  emotionMapper,
  getEmotionColor,
  getPatternAnimation,
  getPhysicsPreset,
} from './EmotionMapper';

// Animation
export { ChoreographyEngine, choreographyEngine } from './ChoreographyEngine';

// Physics
export {
  PhysicsSimulator,
  SpringSystem,
  physicsSimulator,
  springSystem,
  detectCollisions,
  resolveCollision,
} from './PhysicsSimulator';

// Particles & Effects
export {
  ParticleSystem,
  GlobalEffectsManager,
  particleSystem,
  globalEffects,
} from './ParticleSystem';

// Typography Style Selection
export { TypographyStyleSelector, typographySelector } from './TypographyStyleSelector';

// Composition
export { CompositionManager, createCompositionManager } from './CompositionManager';

// Surprise Director
export { SurpriseDirector, surpriseDirector } from './SurpriseDirector';

// Main Renderer
export { KineticTypographyRenderer } from './KineticTypographyRenderer';
export { default } from './KineticTypographyRenderer';
