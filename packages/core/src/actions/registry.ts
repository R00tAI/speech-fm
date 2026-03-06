/**
 * Action Registry
 *
 * Map-based singleton that stores all registered ActionDefinitions.
 * Actions register themselves via side-effect imports.
 */

import type { AssistantActivity, ActionDefinition } from './types';

const registry = new Map<AssistantActivity, ActionDefinition>();

export function registerAction(definition: ActionDefinition): void {
  registry.set(definition.activity, definition);
}

export function getAction(activity: AssistantActivity): ActionDefinition | undefined {
  return registry.get(activity);
}

export function getAllActions(): ActionDefinition[] {
  return Array.from(registry.values());
}

export function hasAction(activity: AssistantActivity): boolean {
  return registry.has(activity);
}
