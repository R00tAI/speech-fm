/**
 * World Evolution Engine
 *
 * Processes how locations and NPCs change when the player is away.
 * On revisiting a location, this engine:
 * 1. Calculates time passed since last visit
 * 2. Determines physical changes (repairs, decay, weather damage)
 * 3. Computes NPC mood shifts and gossip propagation
 * 4. Generates updated scene descriptions and prompt modifiers
 *
 * Uses lightweight heuristics for most changes, reserving AI calls
 * for significant narrative moments.
 */

import type { GameTime, GameTimeDelta } from './game-clock';
import { GameClock } from './game-clock';
import {
  type LocationState,
  type LocationEvent,
  type LocationModification,
  addModification,
  getSignificantEvents,
  getVisualModifiers,
  generateWeather,
} from './location-state-manager';
import {
  type NPCMemoryState,
  type GossipItem,
  addGossip,
  markGossipSpread,
  getUnspreadGossip,
  decayEmotionalState,
} from './npc-memory';

// =============================================================================
// TYPES
// =============================================================================

export interface LocationEvolutionResult {
  /** Updated location description reflecting time passage */
  updatedDescription: string;
  /** Visual prompt modifiers for scene regeneration */
  scenePromptModifiers: string[];
  /** Whether the scene image should be regenerated */
  shouldRegenerateScene: boolean;
  /** NPC emotional state updates */
  npcUpdates: Array<{ npcId: string; mood: string; reason: string }>;
  /** Narrative summary of what changed (shown to player) */
  changeSummary: string | null;
  /** New modifications applied to the location */
  newModifications: Array<Omit<LocationModification, 'id'>>;
}

export interface BackgroundProcessResult {
  /** Gossip that spread between NPCs */
  gossipSpread: Array<{ fromNpcId: string; toNpcId: string; gossip: string }>;
  /** World events that occurred in the background */
  worldEvents: string[];
  /** Quest timers that expired */
  expiredQuests: string[];
}

// =============================================================================
// WORLD EVOLUTION
// =============================================================================

/**
 * Process what happened at a location while the player was away.
 * Called when the player enters/returns to a location.
 */
export function evolveLocation(
  location: LocationState,
  timePassed: GameTimeDelta,
  currentTime: GameTime,
  globalFlags: Record<string, boolean | number | string>,
): LocationEvolutionResult {
  const daysPassed = timePassed.totalMinutes / (24 * 60);

  // No significant evolution for short absences
  if (daysPassed < 0.25) {
    return {
      updatedDescription: location.currentCondition,
      scenePromptModifiers: getVisualModifiers(location),
      shouldRegenerateScene: false,
      npcUpdates: [],
      changeSummary: null,
      newModifications: [],
    };
  }

  const newMods: Array<Omit<LocationModification, 'id'>> = [];
  const promptMods: string[] = [...getVisualModifiers(location)];
  const npcUpdates: Array<{ npcId: string; mood: string; reason: string }> = [];
  const changes: string[] = [];

  // ── Physical evolution based on events ──────────────────────────

  const significantEvents = getSignificantEvents(location, 40);

  for (const event of significantEvents) {
    if (event.resolved) continue;

    // Destruction events → repairs over time
    if (event.consequences.some((c) => c.includes('destroy') || c.includes('damage'))) {
      if (daysPassed >= 2) {
        const repairProgress = Math.min(1, daysPassed / 7); // Full repair in ~7 days
        if (repairProgress < 1) {
          const mod = {
            type: 'repair' as const,
            description: `Repairs in progress (${Math.round(repairProgress * 100)}% complete)`,
            appliedAt: currentTime,
            permanent: false,
            visualImpact: 'scaffolding and construction materials visible, partially repaired damage',
          };
          newMods.push(mod);
          promptMods.push(mod.visualImpact);
          changes.push(`Repairs are underway after the recent damage.`);
        } else {
          const mod = {
            type: 'repair' as const,
            description: 'Repairs completed - location restored',
            appliedAt: currentTime,
            permanent: true,
            visualImpact: 'freshly repaired structures, new materials visible',
          };
          newMods.push(mod);
          promptMods.push(mod.visualImpact);
          changes.push('The damage has been fully repaired.');
        }
      }
    }
  }

  // ── Weather-based changes ──────────────────────────────────────

  if (daysPassed >= 1) {
    const newWeather = generateWeather(currentTime.season);
    if (newWeather.condition === 'storm' && daysPassed >= 2) {
      const mod = {
        type: 'weather_damage' as const,
        description: 'Minor storm damage: puddles, fallen branches, overturned crates',
        appliedAt: currentTime,
        permanent: false,
        visualImpact: 'wet surfaces, puddles, scattered debris from recent storm',
      };
      newMods.push(mod);
      promptMods.push(mod.visualImpact);
      changes.push('A recent storm has left its mark on the area.');
    }
  }

  // ── Seasonal visual changes ────────────────────────────────────

  if (daysPassed >= 5) {
    const seasonPrompt = {
      spring: 'fresh green growth, budding flowers, light rain puddles',
      summer: 'lush full foliage, warm golden light, dry paths',
      autumn: 'fallen leaves, amber and golden colors, crisp atmosphere',
      winter: 'frost on surfaces, bare branches, cold grey light',
    }[currentTime.season];

    if (seasonPrompt) {
      promptMods.push(seasonPrompt);
    }
  }

  // ── Nature reclamation (abandoned/unvisited locations) ─────────

  if (daysPassed >= 14 && location.totalVisits <= 2) {
    const mod = {
      type: 'nature_reclaim' as const,
      description: 'Nature is slowly reclaiming the area',
      appliedAt: currentTime,
      permanent: false,
      visualImpact: 'overgrown vegetation, vines creeping over structures, dusty and neglected',
    };
    newMods.push(mod);
    promptMods.push(mod.visualImpact);
    changes.push('This place looks neglected and overgrown.');
  }

  // ── NPC mood evolution ─────────────────────────────────────────

  for (const npcId of location.npcsCurrentlyPresent) {
    if (daysPassed >= 1) {
      // NPCs grow impatient if the player promised something and hasn't returned
      const relevantEvents = significantEvents.filter(
        (e) => e.participants.includes(npcId) && !e.resolved
      );

      if (relevantEvents.length > 0 && daysPassed >= 3) {
        npcUpdates.push({
          npcId,
          mood: 'impatient',
          reason: `Has been waiting ${Math.round(daysPassed)} days for the player to return`,
        });
      }
    }
  }

  // ── Build description ──────────────────────────────────────────

  let updatedDescription = location.currentCondition;
  if (changes.length > 0) {
    updatedDescription += '. ' + changes.join(' ');
  }

  const shouldRegenerate = newMods.length > 0 || daysPassed >= 3;

  return {
    updatedDescription,
    scenePromptModifiers: promptMods,
    shouldRegenerateScene: shouldRegenerate,
    npcUpdates,
    changeSummary: changes.length > 0 ? changes.join(' ') : null,
    newModifications: newMods,
  };
}

// =============================================================================
// BACKGROUND PROCESSING
// =============================================================================

/**
 * Simulate NPC-to-NPC gossip propagation.
 * NPCs in the same location share gossip with each other.
 */
export function propagateGossip(
  npcStates: Map<string, NPCMemoryState>,
  locationNpcMap: Record<string, string[]>, // locationId → npcIds present
): Array<{ fromNpcId: string; toNpcId: string; gossip: string }> {
  const spreadEvents: Array<{ fromNpcId: string; toNpcId: string; gossip: string }> = [];

  for (const [_locationId, npcIds] of Object.entries(locationNpcMap)) {
    if (npcIds.length < 2) continue;

    // Each NPC with unspread gossip tries to tell others
    for (const fromId of npcIds) {
      const fromState = npcStates.get(fromId);
      if (!fromState) continue;

      const unspread = getUnspreadGossip(fromState);
      if (unspread.length === 0) continue;

      for (const toId of npcIds) {
        if (toId === fromId) continue;
        const toState = npcStates.get(toId);
        if (!toState) continue;

        // Share the most recent piece of gossip
        const gossipItem = unspread[0];

        // Add to recipient with degraded reliability
        const received = addGossip(toState, {
          content: gossipItem.content,
          aboutCharacterId: gossipItem.aboutCharacterId,
          sourceNpcId: fromId,
          originalSourceId: gossipItem.originalSourceId,
          reliability: gossipItem.reliability * 0.8, // Degrades with each spread
          timestamp: gossipItem.timestamp,
          spread: false,
        });

        npcStates.set(toId, received);

        // Mark as spread for the sender
        npcStates.set(fromId, markGossipSpread(fromState, gossipItem.id));

        spreadEvents.push({
          fromNpcId: fromId,
          toNpcId: toId,
          gossip: gossipItem.content,
        });
      }
    }
  }

  return spreadEvents;
}

/**
 * Process background world events (called periodically).
 * Handles gossip, emotional decay, and random events.
 */
export function processBackgroundTick(
  npcStates: Map<string, NPCMemoryState>,
  locationNpcMap: Record<string, string[]>,
  currentTime: GameTime,
  activeQuestDeadlines: Array<{ questId: string; deadline: GameTime }>,
): BackgroundProcessResult {
  // 1. Gossip propagation
  const gossipSpread = propagateGossip(npcStates, locationNpcMap);

  // 2. Emotional decay — NPCs calm down over time
  for (const [npcId, state] of npcStates.entries()) {
    npcStates.set(npcId, decayEmotionalState(state, currentTime));
  }

  // 3. Check quest timers
  const expiredQuests: string[] = [];
  for (const { questId, deadline } of activeQuestDeadlines) {
    const delta = GameClock.timeDelta(deadline, currentTime);
    if (delta.totalMinutes <= 0) {
      expiredQuests.push(questId);
    }
  }

  // 4. Random world events (simple probability-based)
  const worldEvents: string[] = [];
  if (Math.random() < 0.05) { // 5% chance per tick
    const events = [
      'A traveling merchant has arrived in the area.',
      'Rumors of bandit activity on the roads.',
      'A festival is being planned in the nearby town.',
      'Strange lights were seen in the wilderness at night.',
      'A new bounty has been posted at the tavern.',
    ];
    worldEvents.push(events[Math.floor(Math.random() * events.length)]);
  }

  return {
    gossipSpread,
    worldEvents,
    expiredQuests,
  };
}

/**
 * Create a gossip item from a significant event.
 * Called when something noteworthy happens that NPCs would talk about.
 */
export function createGossipFromEvent(
  event: LocationEvent,
  witnessNpcId: string,
  playerName: string,
): Omit<GossipItem, 'id'> {
  // Summarize the event as gossip
  const gossipTemplates = [
    `I heard that ${playerName} was involved in ${event.description.toLowerCase()}.`,
    `Word is that something happened at ${event.description.toLowerCase()}.`,
    `Did you hear? ${event.description}`,
  ];

  return {
    content: gossipTemplates[Math.floor(Math.random() * gossipTemplates.length)],
    aboutCharacterId: undefined, // Could be set if event involves player
    sourceNpcId: witnessNpcId,
    originalSourceId: witnessNpcId,
    reliability: event.significance / 100, // More significant = more reliable
    timestamp: event.timestamp,
    spread: false,
  };
}
