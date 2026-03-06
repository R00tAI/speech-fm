/**
 * NPC Memory System
 *
 * Per-NPC memory with time-decay, emotional state tracking,
 * gossip propagation, and recall strength based on importance.
 * Memories are stored per-NPC in the RPG save file and loaded
 * into this system for context building.
 */

import type { GameTime, GameTimeDelta } from './game-clock';
import { GameClock } from './game-clock';

// =============================================================================
// TYPES
// =============================================================================

export type MemoryType = 'interaction' | 'witnessed' | 'gossip' | 'world_event' | 'gift' | 'combat' | 'betrayal';

export interface Memory {
  id: string;
  type: MemoryType;
  description: string;
  importance: number;        // 0-100 (higher = remembered longer)
  emotionalImpact: number;   // -100 to 100 (negative = bad memory)
  timestamp: GameTime;
  locationId?: string;
  locationName?: string;
  involvedCharacters: string[]; // Character IDs
  tags: string[];             // Searchable tags like 'theft', 'kindness', 'combat'
}

export interface EmotionalState {
  primary: string;     // 'grateful', 'suspicious', 'angry', 'fearful', 'friendly', 'neutral'
  intensity: number;   // 0-100
  reason: string;      // Why they feel this way
}

export interface GossipItem {
  id: string;
  content: string;           // What the gossip says
  aboutCharacterId?: string; // Who it's about (player or NPC)
  sourceNpcId: string;       // Who told this NPC
  originalSourceId: string;  // Who started the rumor
  reliability: number;       // 0-1 (degrades as it spreads)
  timestamp: GameTime;
  spread: boolean;           // Has this NPC told others?
}

export interface NPCMemoryState {
  npcId: string;
  npcName: string;
  memories: Memory[];
  emotionalState: EmotionalState;
  gossipKnown: GossipItem[];
  lastInteractionTime: GameTime | null;
  interactionCount: number;
}

// =============================================================================
// DEFAULTS
// =============================================================================

export const DEFAULT_EMOTIONAL_STATE: EmotionalState = {
  primary: 'neutral',
  intensity: 20,
  reason: 'No prior interactions',
};

export function createNPCMemoryState(npcId: string, npcName: string): NPCMemoryState {
  return {
    npcId,
    npcName,
    memories: [],
    emotionalState: { ...DEFAULT_EMOTIONAL_STATE },
    gossipKnown: [],
    lastInteractionTime: null,
    interactionCount: 0,
  };
}

// =============================================================================
// MEMORY RECALL
// =============================================================================

/**
 * Calculate how well an NPC remembers something based on:
 * - Importance (critical events never fade)
 * - Time elapsed (memories decay)
 * - Emotional impact (strong emotions persist)
 */
export function getRecallStrength(memory: Memory, currentTime: GameTime): number {
  const delta = GameClock.timeDelta(memory.timestamp, currentTime);
  const daysPassed = delta.totalMinutes / (24 * 60);

  // Very important memories never fade
  if (memory.importance >= 90) return 1.0;

  // Strong emotional memories fade slowly
  const emotionalFactor = Math.abs(memory.emotionalImpact) / 100;
  const decayRate = 0.03 * (1 - emotionalFactor * 0.7); // Emotional memories decay 70% slower

  // Base decay: importance slows it, time increases it
  const importanceFactor = memory.importance / 100;
  const decay = daysPassed * decayRate / Math.max(0.1, importanceFactor);

  return Math.max(0, Math.min(1, 1.0 - decay));
}

/**
 * Get memories the NPC can actually recall right now,
 * sorted by recall strength (strongest first), filtered by minimum threshold.
 */
export function getRelevantMemories(
  state: NPCMemoryState,
  currentTime: GameTime,
  minRecall: number = 0.15,
  maxMemories: number = 8,
): Array<Memory & { recallStrength: number }> {
  return state.memories
    .map((m) => ({ ...m, recallStrength: getRecallStrength(m, currentTime) }))
    .filter((m) => m.recallStrength >= minRecall)
    .sort((a, b) => b.recallStrength - a.recallStrength)
    .slice(0, maxMemories);
}

// =============================================================================
// MEMORY CREATION
// =============================================================================

const generateId = () => `mem_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

/**
 * Record a new memory for an NPC
 */
export function addMemory(
  state: NPCMemoryState,
  memory: Omit<Memory, 'id'>,
): NPCMemoryState {
  const newMemory: Memory = { ...memory, id: generateId() };

  // Update emotional state based on this memory
  const updatedEmotional = updateEmotionalState(state.emotionalState, newMemory);

  return {
    ...state,
    memories: [...state.memories, newMemory],
    emotionalState: updatedEmotional,
    lastInteractionTime: memory.type === 'interaction' ? memory.timestamp : state.lastInteractionTime,
    interactionCount: memory.type === 'interaction' ? state.interactionCount + 1 : state.interactionCount,
  };
}

/**
 * Add gossip that this NPC has heard
 */
export function addGossip(state: NPCMemoryState, gossip: Omit<GossipItem, 'id'>): NPCMemoryState {
  // Don't add duplicate gossip
  if (state.gossipKnown.some((g) => g.content === gossip.content)) return state;

  return {
    ...state,
    gossipKnown: [...state.gossipKnown, { ...gossip, id: generateId() }],
  };
}

/**
 * Get gossip this NPC hasn't spread yet
 */
export function getUnspreadGossip(state: NPCMemoryState): GossipItem[] {
  return state.gossipKnown.filter((g) => !g.spread);
}

/**
 * Mark gossip as spread
 */
export function markGossipSpread(state: NPCMemoryState, gossipId: string): NPCMemoryState {
  return {
    ...state,
    gossipKnown: state.gossipKnown.map((g) =>
      g.id === gossipId ? { ...g, spread: true } : g
    ),
  };
}

// =============================================================================
// EMOTIONAL STATE
// =============================================================================

function updateEmotionalState(current: EmotionalState, memory: Memory): EmotionalState {
  const impact = memory.emotionalImpact;
  const importance = memory.importance;

  // Only significant memories shift emotional state
  if (Math.abs(impact) < 20 && importance < 40) return current;

  // Determine new primary emotion
  let newPrimary = current.primary;
  if (impact >= 50) newPrimary = 'grateful';
  else if (impact >= 20) newPrimary = 'friendly';
  else if (impact <= -50) newPrimary = memory.type === 'betrayal' ? 'angry' : 'fearful';
  else if (impact <= -20) newPrimary = 'suspicious';

  // Blend intensity: strong events can override, weak events blend
  const impactWeight = Math.min(1, Math.abs(impact) / 80);
  const newIntensity = Math.round(
    current.intensity * (1 - impactWeight) + Math.abs(impact) * impactWeight
  );

  return {
    primary: newPrimary,
    intensity: Math.min(100, Math.max(0, newIntensity)),
    reason: memory.description,
  };
}

/**
 * Decay emotional intensity over time (emotions cool down)
 */
export function decayEmotionalState(state: NPCMemoryState, currentTime: GameTime): NPCMemoryState {
  if (!state.lastInteractionTime) return state;

  const delta = GameClock.timeDelta(state.lastInteractionTime, currentTime);
  const daysPassed = delta.totalMinutes / (24 * 60);

  if (daysPassed < 0.5) return state; // No decay within half a day

  // Emotions decay toward neutral at ~10% per day
  const decayFactor = Math.max(0.2, 1 - daysPassed * 0.1);
  const newIntensity = Math.round(state.emotionalState.intensity * decayFactor);

  return {
    ...state,
    emotionalState: {
      ...state.emotionalState,
      intensity: newIntensity,
      primary: newIntensity < 15 ? 'neutral' : state.emotionalState.primary,
    },
  };
}
