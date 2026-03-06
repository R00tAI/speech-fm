// @speech-fm/core — platform-agnostic shared logic

// Types
export * from './types/rpg';

// RPG Engine (pure logic, no DB/AI deps)
export { GameClock, getGameClock, resetGameClock, DEFAULT_GAME_TIME } from './rpg/game-clock';
export type { GameTime, Season, MoonPhase, TimeOfDay, GameTimeDelta } from './rpg/game-clock';
export * from './rpg/npc-memory';
export * from './rpg/dialog-context-builder';
export * from './rpg/location-state-manager';
export * from './rpg/world-evolution-engine';
export * from './rpg/art-style-presets';
export * from './rpg/rpg-theme-system';
// rpg-game-engine has name conflicts (LocationEvent, LocationState, CharacterData, GameTime)
// Import directly: import { ... } from '@speech-fm/core/rpg/rpg-game-engine'

// Action Library (canvas-based animations)
export * from './actions/types';
export { registerAction, getAction, getAllActions } from './actions/registry';
export { ActionController } from './actions/controller';
export { generateVariation } from './actions/variation';

// Storytelling
export * from './storytelling/easing';
export * from './storytelling/scene-schema';
export { SCENE_GEN_SYSTEM_PROMPT, buildScenePrompt } from './storytelling/scene-gen-prompt';

// Text Analysis / Kinetic Typography (pure logic)
// Re-export under namespace to avoid EmotionalState/CharacterData conflicts with RPG
export * as KineticTypes from './text-analysis/types';
export { SemanticTextAnalyzer } from './text-analysis/SemanticTextAnalyzer';
export { EmotionMapper } from './text-analysis/EmotionMapper';
export { SurpriseDirector } from './text-analysis/SurpriseDirector';
export { ChoreographyEngine } from './text-analysis/ChoreographyEngine';
export { typographySelector } from './text-analysis/TypographyStyleSelector';
export { ParticleSystem } from './text-analysis/ParticleSystem';
export { PhysicsSimulator } from './text-analysis/PhysicsSimulator';

// Config
export * from './config/pricing';
export * from './config/scene-presets';
export * from './config/shader-variants';
