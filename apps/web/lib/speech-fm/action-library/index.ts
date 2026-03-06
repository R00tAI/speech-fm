/**
 * Action Library Entry Point
 *
 * Import this module to initialize the action registry and gain access
 * to the controller, types, and registry functions.
 */

// Side-effect: register all built-in actions
import './actions';

// Re-export public API
export { ActionController } from './controller';
export { getAction, getAllActions, hasAction, registerAction } from './registry';
export { generateVariation, randomInRange } from './variation';
export type {
  AssistantActivity,
  ActionPhase,
  ActionProp,
  PoseModifier,
  ActionVariation,
  ActionDefinition,
  ActionControllerState,
} from './types';
