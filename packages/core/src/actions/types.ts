/**
 * Action Library Types
 *
 * Type definitions for the assistant activity/action system.
 * Actions are contextual animations triggered by tool calls —
 * glasses for reading, pencil for writing, magnifying glass for searching, etc.
 */

// Activities the assistant can be performing
export type AssistantActivity =
  | 'idle'
  | 'reading'
  | 'writing'
  | 'searching'
  | 'presenting'
  | 'coding'
  | 'browsing'
  | 'remembering';

// Lifecycle phase of an action's entrance/exit
export type ActionPhase = 'entering' | 'active' | 'exiting' | 'idle';

// A visual prop drawn alongside the assistant face
export interface ActionProp {
  id: string;
  // Draw function receives canvas context, center position, scale, and 0-1 progress
  draw: (ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, progress: number, variation: ActionVariation) => void;
  // Offset from face center
  offsetX: number;
  offsetY: number;
  // Entrance/exit timing (ms)
  enterDuration: number;
  exitDuration: number;
}

// Pose modifications applied to eyes/mouth/head during an action
export interface PoseModifier {
  // Eye overrides (unicode glyph)
  leftEye?: string;
  rightEye?: string;
  // Eye animation speed multiplier
  eyeSpeed?: number;
  // Squint amount 0-1 (reduces eye socket height)
  squint?: number;
  // Mouth override glyph
  mouth?: string;
  // Head tilt in radians
  headTilt?: number;
  // Gaze offset (pixel nudge for eye glyphs)
  gazeX?: number;
  gazeY?: number;
}

// Randomized variation generated once per action trigger
export interface ActionVariation {
  // Per-prop variations
  rotation: number;    // Slight rotation variance (radians)
  scaleMultiplier: number; // 0.9-1.1 range
  speed: number;       // Animation speed multiplier
  // Style index (for props with multiple visual variants)
  styleIndex: number;
  // Seed for deterministic randomness within the action
  seed: number;
}

// Full action definition registered in the action registry
export interface ActionDefinition {
  activity: AssistantActivity;
  // Props to draw (can have multiple — e.g. glasses + book)
  props: ActionProp[];
  // Pose applied to the face while action is active
  pose: PoseModifier;
  // Number of visual style variants available
  styleVariants: number;
  // Minimum display duration (ms) — prevents flickering on fast tool calls
  minDuration: number;
}

// Runtime state tracked by ActionController
export interface ActionControllerState {
  currentActivity: AssistantActivity;
  phase: ActionPhase;
  phaseStartTime: number;
  variation: ActionVariation;
  pendingActivity: AssistantActivity | null;
  // Computed 0-1 progress for current phase
  phaseProgress: number;
}
