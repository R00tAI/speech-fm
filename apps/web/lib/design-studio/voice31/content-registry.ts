/**
 * Content Registry
 *
 * Deterministic Map-based registry that routes content types
 * to lazy-loaded display components. No LLM involvement needed
 * to pick the right component — tool handlers set the category,
 * registry resolves to the component.
 */

import React from 'react';

// =============================================================================
// TYPES
// =============================================================================

export type ContentCategory =
  | 'weather'
  | 'article'
  | 'search_results'
  | 'code_display'
  | 'image'
  | 'diagram'
  | 'visualization'
  | 'list'
  | 'text'
  | 'browser_automation'
  | 'document'
  | 'rpg_scene'
  | 'story';

export interface ContentRegistryEntry {
  category: ContentCategory;
  component: () => Promise<{ default: React.ComponentType<any> }>;
  label: string;
  fullscreenCapable: boolean;
  cornerCapable: boolean;
}

// =============================================================================
// REGISTRY
// =============================================================================

const registry = new Map<ContentCategory, ContentRegistryEntry>();

export function registerContent(entry: ContentRegistryEntry): void {
  registry.set(entry.category, entry);
}

export function resolveContent(category: ContentCategory): ContentRegistryEntry | undefined {
  return registry.get(category);
}

export function getRegisteredCategories(): ContentCategory[] {
  return Array.from(registry.keys());
}

export function getLazyComponent(category: ContentCategory): React.LazyExoticComponent<React.ComponentType<any>> | null {
  const entry = registry.get(category);
  if (!entry) return null;
  return React.lazy(entry.component);
}

// =============================================================================
// REGISTER BUILT-IN CONTENT TYPES
// =============================================================================

registerContent({
  category: 'weather',
  component: () => import('@/components/design-studio/voice31/display/WeatherDisplay'),
  label: 'Weather',
  fullscreenCapable: true,
  cornerCapable: true,
});

registerContent({
  category: 'article',
  component: () => import('@/components/design-studio/voice31/Voice31ReaderView').then(m => ({ default: m.Voice31ReaderView })),
  label: 'Article',
  fullscreenCapable: false,
  cornerCapable: false,
});

registerContent({
  category: 'code_display',
  component: () => import('@/components/design-studio/voice31/Voice31CodeDisplay').then(m => ({ default: m.Voice31CodeDisplay })),
  label: 'Code',
  fullscreenCapable: true,
  cornerCapable: false,
});

registerContent({
  category: 'image',
  component: () => import('@/components/design-studio/voice31/display/ImageDisplay').then(m => ({ default: m.ImageDisplay })),
  label: 'Image',
  fullscreenCapable: true,
  cornerCapable: false,
});

registerContent({
  category: 'visualization',
  component: () => import('@/components/design-studio/voice31/display/ProceduralVisualization').then(m => ({ default: m.ProceduralVisualization })),
  label: 'Visualization',
  fullscreenCapable: false,
  cornerCapable: false,
});

registerContent({
  category: 'list',
  component: () => import('@/components/design-studio/voice31/display/DynamicList').then(m => ({ default: m.DynamicList })),
  label: 'List',
  fullscreenCapable: false,
  cornerCapable: false,
});

registerContent({
  category: 'diagram',
  component: () => import('@/components/design-studio/voice31/Voice31ProgressiveDiagram').then(m => ({ default: m.Voice31ProgressiveDiagram })),
  label: 'Diagram',
  fullscreenCapable: false,
  cornerCapable: false,
});

registerContent({
  category: 'browser_automation',
  component: () => import('@/components/design-studio/voice31/sidebar/BrowserPanel').then(m => ({ default: m.BrowserPanel })),
  label: 'Browser',
  fullscreenCapable: false,
  cornerCapable: true,
});

registerContent({
  category: 'text',
  component: () => import('@/components/design-studio/voice31/kinetic-typography').then(m => ({ default: m.KineticTypographyRenderer })),
  label: 'Text',
  fullscreenCapable: true,
  cornerCapable: false,
});

registerContent({
  category: 'story',
  component: () => import('@/components/design-studio/voice31/storytelling').then(m => ({ default: m.StorytellingOrchestrator })),
  label: 'Story',
  fullscreenCapable: true,
  cornerCapable: false,
});

export { registry as contentRegistry };
