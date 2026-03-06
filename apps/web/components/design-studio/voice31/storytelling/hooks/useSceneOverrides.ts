'use client';

import { useStorytellingStore } from '../StorytellingStore';
import type { SceneVisualOverrides } from '../types';

const EMPTY: SceneVisualOverrides = {};

/**
 * Returns the visual overrides for a given scene.
 * Subscribes only to changes for this specific sceneId to avoid unnecessary re-renders.
 */
export function useSceneOverrides(sceneId: string): SceneVisualOverrides {
  return useStorytellingStore((s) => s.sceneOverrides[sceneId] ?? EMPTY);
}
