/**
 * Dialog Context Builder
 *
 * Assembles NPC memories, relationship history, emotional state,
 * and location context into a structured prompt string for the AI
 * to use when generating NPC dialogue. Memories are revealed naturally
 * over conversation — not dumped all at once.
 */

import type { GameTime } from './game-clock';
import { GameClock } from './game-clock';
import {
  type NPCMemoryState,
  type Memory,
  getRelevantMemories,
  getUnspreadGossip,
} from './npc-memory';

// =============================================================================
// TYPES
// =============================================================================

export interface DialogContext {
  /** Full context string to inject into the NPC system prompt */
  systemContext: string;
  /** Short summary for token-efficient contexts */
  shortContext: string;
  /** Memories to potentially reference (ordered by relevance) */
  memorySuggestions: string[];
  /** Available gossip to share */
  gossipToShare: string[];
}

export interface DialogContextInput {
  npcMemory: NPCMemoryState;
  currentTime: GameTime;
  playerName: string;
  playerLevel: number;
  locationName: string;
  locationDescription?: string;
  currentTheme?: string;
}

// =============================================================================
// CONTEXT BUILDER
// =============================================================================

/**
 * Build a dialogue context from NPC memory state.
 * This gets injected into the NPC's system prompt so they can
 * reference past events naturally.
 */
export function buildDialogContext(input: DialogContextInput): DialogContext {
  const {
    npcMemory,
    currentTime,
    playerName,
    playerLevel,
    locationName,
    locationDescription,
    currentTheme,
  } = input;

  const relevant = getRelevantMemories(npcMemory, currentTime, 0.2, 6);
  const unspreadGossip = getUnspreadGossip(npcMemory);

  // Time since last meeting
  const timeSinceText = npcMemory.lastInteractionTime
    ? GameClock.describeDelta(
        GameClock.timeDelta(npcMemory.lastInteractionTime, currentTime)
      )
    : null;

  // Build memory suggestions — one-line summaries the NPC can reference
  const memorySuggestions = relevant.map((m) => {
    const strength = m.recallStrength > 0.7 ? 'vivid' : m.recallStrength > 0.4 ? 'clear' : 'faint';
    return `[${strength}] ${m.description}`;
  });

  const gossipToShare = unspreadGossip
    .slice(0, 3)
    .map((g) => `[reliability: ${Math.round(g.reliability * 100)}%] ${g.content}`);

  // ── Full system context ──────────────────────────────────────────
  const contextParts: string[] = [];

  // Emotional state
  const { emotionalState } = npcMemory;
  contextParts.push(
    `Your current feelings toward ${playerName}: ${emotionalState.primary} (intensity: ${emotionalState.intensity}/100).`,
    `Reason: ${emotionalState.reason}.`
  );

  // Relationship depth
  if (npcMemory.interactionCount > 0) {
    contextParts.push(
      `You have interacted with ${playerName} ${npcMemory.interactionCount} time(s) before.`
    );
  }

  // Time apart
  if (timeSinceText) {
    contextParts.push(`It has been ${timeSinceText} since you last spoke with ${playerName}.`);
  } else {
    contextParts.push(`This is the first time you are meeting ${playerName}.`);
  }

  // Relevant memories
  if (relevant.length > 0) {
    contextParts.push('');
    contextParts.push('Things you remember about your interactions:');
    for (const m of relevant) {
      const clarity = m.recallStrength > 0.7
        ? 'You remember clearly:'
        : m.recallStrength > 0.4
        ? 'You recall:'
        : 'You vaguely remember:';
      contextParts.push(`- ${clarity} ${m.description}`);
    }
  }

  // Gossip
  if (gossipToShare.length > 0) {
    contextParts.push('');
    contextParts.push('Rumors and gossip you have heard (you may choose to share):');
    for (const g of gossipToShare) {
      contextParts.push(`- ${g}`);
    }
  }

  // Behavioral guidelines
  contextParts.push('');
  contextParts.push('Guidelines for referencing memories:');
  contextParts.push('- Do NOT dump all memories at once. Reveal them naturally as conversation flows.');
  contextParts.push('- Vivid memories can be referenced directly. Faint ones should be hinted at vaguely.');
  contextParts.push('- If your emotional state is negative, let it color your tone but don\'t be one-dimensional.');
  contextParts.push('- Share gossip only if it fits the conversation context.');
  if (timeSinceText && npcMemory.interactionCount > 0) {
    contextParts.push(`- You haven\'t seen ${playerName} in ${timeSinceText}. React appropriately to the reunion.`);
  }

  const systemContext = contextParts.join('\n');

  // ── Short context (for token-limited scenarios) ──────────────────
  const shortParts: string[] = [
    `Mood: ${emotionalState.primary} (${emotionalState.intensity}/100). ${emotionalState.reason}.`,
  ];
  if (timeSinceText) shortParts.push(`Last met: ${timeSinceText} ago.`);
  if (relevant.length > 0) {
    shortParts.push(`Key memory: ${relevant[0].description}`);
  }

  const shortContext = shortParts.join(' ');

  return {
    systemContext,
    shortContext,
    memorySuggestions,
    gossipToShare,
  };
}

/**
 * Build a brief time-of-day context line for scene descriptions.
 * Used when the NPC doesn't have significant memories to reference.
 */
export function buildTimeContext(currentTime: GameTime, locationName: string): string {
  const clock = new GameClock(currentTime);
  return `It is ${clock.getTimeDescriptor()} at ${locationName}. ${clock.getLightingDescriptor()}.`;
}
