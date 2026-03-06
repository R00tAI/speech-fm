/**
 * Artifact Manager
 *
 * Handles artifact CRUD operations + auto-tagging.
 * Works with Voice31Store for local state and /api/voice31/artifacts for persistence.
 */

import type { Artifact, ArtifactType } from '@/components/design-studio/voice31/Voice31Store';

// =============================================================================
// AUTO-TAGGING
// =============================================================================

function extractKeywords(text: string, maxTags = 5): string[] {
  if (!text) return [];
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 3);

  // Remove common stop words
  const stopWords = new Set([
    'this', 'that', 'with', 'from', 'have', 'been', 'were', 'they',
    'their', 'about', 'would', 'could', 'should', 'which', 'there',
    'what', 'when', 'make', 'like', 'just', 'over', 'such', 'some',
    'than', 'them', 'very', 'will', 'each', 'into', 'also', 'more',
  ]);

  const filtered = words.filter((w) => !stopWords.has(w));
  // Deduplicate and take top N
  return [...new Set(filtered)].slice(0, maxTags);
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return '';
  }
}

// =============================================================================
// AUTO-TAG GENERATORS BY ARTIFACT TYPE
// =============================================================================

export function generateAutoTags(type: ArtifactType, content: any, meta?: Record<string, any>): string[] {
  const tags: string[] = [];

  switch (type) {
    case 'image_generation':
      if (meta?.prompt) tags.push(...extractKeywords(meta.prompt, 4));
      if (meta?.style) tags.push(meta.style);
      break;

    case 'code_generation':
      if (meta?.prompt) tags.push(...extractKeywords(meta.prompt, 3));
      tags.push('code');
      break;

    case 'search_result':
      if (meta?.query) tags.push(...extractKeywords(meta.query, 3));
      tags.push('search');
      break;

    case 'article':
      if (meta?.source) tags.push(extractDomain(meta.source));
      if (meta?.title) tags.push(...extractKeywords(meta.title, 3));
      tags.push('article');
      break;

    case 'weather_snapshot':
      if (meta?.location) tags.push(meta.location.toLowerCase());
      if (meta?.condition) tags.push(meta.condition);
      tags.push('weather');
      break;

    case 'browser_result':
      if (meta?.url) tags.push(extractDomain(meta.url));
      if (meta?.action) tags.push(...extractKeywords(meta.action, 2));
      tags.push('browser');
      break;

    case 'note':
      if (meta?.tags) tags.push(...meta.tags);
      tags.push('note');
      break;

    case 'story_session':
      if (meta?.topic) tags.push(...extractKeywords(meta.topic, 3));
      tags.push('story');
      break;

    case 'rpg_scene':
      if (meta?.location) tags.push(meta.location.toLowerCase());
      if (meta?.characters) tags.push(...(meta.characters as string[]).slice(0, 3));
      tags.push('rpg');
      break;

    case 'rpg_character':
      if (meta?.name) tags.push(meta.name.toLowerCase());
      if (meta?.class) tags.push(meta.class.toLowerCase());
      tags.push('rpg', 'character');
      break;

    default:
      if (typeof content === 'string') tags.push(...extractKeywords(content, 3));
      break;
  }

  return [...new Set(tags.filter(Boolean))];
}

// =============================================================================
// SAVE HELPERS (used in tool handlers)
// =============================================================================

export interface SaveArtifactInput {
  type: ArtifactType;
  title: string;
  content: any;
  preview?: string;
  source?: string;
  tags?: string[];
  pinned?: boolean;
  meta?: Record<string, any>;
}

/**
 * Build a full artifact object ready for store.saveArtifact()
 * Auto-generates tags from content + metadata.
 */
export function buildArtifact(input: SaveArtifactInput): Omit<Artifact, 'id' | 'createdAt' | 'updatedAt'> {
  const autoTags = generateAutoTags(input.type, input.content, input.meta);
  const userTags = input.tags || [];
  const allTags = [...new Set([...userTags, ...autoTags])];

  return {
    type: input.type,
    title: input.title,
    preview: input.preview || (typeof input.content === 'string' ? input.content.slice(0, 100) : undefined),
    content: input.content,
    tags: allTags,
    source: input.source || 'voice31',
    pinned: input.pinned || false,
  };
}

// =============================================================================
// API PERSISTENCE (optional — fire-and-forget)
// =============================================================================

export async function persistArtifact(artifact: Artifact): Promise<void> {
  try {
    await fetch('/api/voice31/artifacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(artifact),
    });
  } catch (e) {
    console.warn('[ArtifactManager] Failed to persist artifact:', e);
  }
}

export async function deletePersistedArtifact(id: string): Promise<void> {
  try {
    await fetch(`/api/voice31/artifacts?id=${id}`, { method: 'DELETE' });
  } catch (e) {
    console.warn('[ArtifactManager] Failed to delete artifact:', e);
  }
}

export async function loadArtifacts(): Promise<Artifact[]> {
  try {
    const res = await fetch('/api/voice31/artifacts');
    if (res.ok) {
      const data = await res.json();
      return data.artifacts || [];
    }
  } catch (e) {
    console.warn('[ArtifactManager] Failed to load artifacts:', e);
  }
  return [];
}
