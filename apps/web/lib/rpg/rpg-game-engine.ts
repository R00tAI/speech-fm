/**
 * RPG Game Engine - Dynamic Structured Data for Live Generation
 *
 * Comprehensive game loop system featuring:
 * - Instant title, subtitle, and intro narration
 * - Structured data generating scenes/chunks for streaming
 * - Character backstory, tone, atmosphere, voice descriptions
 * - Statistical event chances and dynamic interactions
 * - Items, locations, and branching pathways
 * - Pre-generated visual states for instant choice feedback
 */

import type { RPGTheme } from './rpg-theme-system';

// ============================================================================
// CORE TYPES - GAME STATE
// ============================================================================

/** Game session configuration */
export interface GameSessionConfig {
  id: string;
  title: string;
  subtitle?: string;
  theme: RPGTheme;
  setting: GameSetting;
  playerCharacter: CharacterData;
  companions: CharacterData[];
  currentSceneId: string;
  gameState: GameState;
  createdAt: number;
  lastPlayedAt: number;
}

/** World setting and atmosphere */
export interface GameSetting {
  name: string;
  era: string;
  description: string;
  tone: Tone;
  atmosphere: Atmosphere;
  worldRules: WorldRule[];
  majorLocations: Location[];
  factions: Faction[];
  storyArcs: StoryArc[];
}

/** Tone configuration for narrative generation */
export interface Tone {
  primary: 'dark' | 'light' | 'neutral' | 'gritty' | 'whimsical' | 'epic';
  humor: 'none' | 'subtle' | 'moderate' | 'frequent';
  violence: 'none' | 'implied' | 'moderate' | 'graphic';
  romance: 'none' | 'subtle' | 'moderate' | 'prominent';
  horror: 'none' | 'subtle' | 'moderate' | 'intense';
  pacing: 'slow' | 'moderate' | 'fast' | 'varied';
  complexity: 'simple' | 'moderate' | 'complex' | 'intricate';
}

/** Atmospheric elements for scene generation */
export interface Atmosphere {
  lighting: string; // "neon-lit", "dim candlelight", "harsh sunlight"
  weather: string; // "acid rain", "perpetual fog", "clear skies"
  soundscape: string; // "distant sirens", "crackling fire", "eerie silence"
  scent: string; // "ozone and burnt chrome", "incense", "decay"
  mood: string; // "oppressive", "mysterious", "hopeful"
  visualStyle: string; // "high contrast shadows", "soft ethereal glow"
  colorPalette: string[]; // ["cyan", "magenta", "black"]
}

/** World rules and mechanics */
export interface WorldRule {
  name: string;
  description: string;
  mechanicType: 'magic' | 'technology' | 'social' | 'physical' | 'economic';
  effects: string[];
}

// ============================================================================
// CHARACTER SYSTEM
// ============================================================================

/** Complete character data */
export interface CharacterData {
  id: string;
  name: string;
  title?: string; // "The Lone Wanderer", "Archmage"
  description: string;

  // Appearance
  physicalDescription: string;
  distinguishingFeatures: string[];
  attire: string;

  // Personality
  personality: PersonalityProfile;
  backstory: CharacterBackstory;

  // Voice for TTS
  voice: VoiceDescription;

  // Stats
  attributes: CharacterAttributes;
  skills: CharacterSkill[];

  // Relationships
  relationships: Relationship[];

  // Inventory
  inventory: InventoryItem[];
  equippedItems: string[]; // item IDs
  currency: Record<string, number>;

  // Status
  status: CharacterStatus;

  // AI/NPC specific
  isPlayer: boolean;
  aiPersonality?: AIPersonalityConfig;
}

export interface PersonalityProfile {
  traits: string[]; // ["curious", "impulsive", "loyal"]
  values: string[]; // ["justice", "freedom", "knowledge"]
  fears: string[]; // ["abandonment", "failure"]
  desires: string[]; // ["revenge", "redemption", "power"]
  quirks: string[]; // ["nervous laugh", "always carries a coin"]
  speechPatterns: string[]; // ["formal", "uses slang", "quotes poetry"]
  catchphrases?: string[]; // memorable lines
}

export interface CharacterBackstory {
  origin: string; // birthplace/origin story
  upbringing: string;
  definingMoment: string; // key moment that shaped them
  secrets: Secret[];
  goals: {
    shortTerm: string;
    longTerm: string;
    hiddenAgenda?: string;
  };
  timeline: BackstoryEvent[];
}

export interface Secret {
  id: string;
  content: string;
  severity: 'minor' | 'moderate' | 'major' | 'devastating';
  knownBy: string[]; // character IDs who know
  revealCondition?: string; // when this might come out
}

export interface BackstoryEvent {
  age: number | string;
  event: string;
  impact: string;
  witnesses?: string[];
}

/** Voice configuration for TTS */
export interface VoiceDescription {
  pitch: 'very-low' | 'low' | 'medium' | 'high' | 'very-high';
  speed: 'very-slow' | 'slow' | 'medium' | 'fast' | 'very-fast';
  tone: string; // "gruff and weathered", "melodic and soothing"
  accent?: string; // "Eastern European", "Southern drawl"
  mannerisms: string[]; // "pauses dramatically", "speaks in clipped sentences"
  emotionalRange: string; // "stoic with rare outbursts", "openly emotional"
  sampleDialogue: string[]; // example lines in their voice
}

export interface CharacterAttributes {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  luck?: number;
  // Derived stats
  maxHealth: number;
  currentHealth: number;
  maxMana?: number;
  currentMana?: number;
  armorClass: number;
  initiative: number;
}

export interface CharacterSkill {
  id: string;
  name: string;
  category: 'combat' | 'social' | 'stealth' | 'magic' | 'technical' | 'survival';
  level: number;
  experience: number;
  experienceToNext: number;
  specializations?: string[];
}

export interface Relationship {
  characterId: string;
  type: 'ally' | 'enemy' | 'neutral' | 'romantic' | 'family' | 'mentor' | 'rival';
  level: number; // -100 to 100
  history: string;
  lastInteraction?: string;
  knownSecrets: string[]; // secret IDs
}

export interface CharacterStatus {
  conditions: StatusCondition[];
  activeEffects: ActiveEffect[];
  fatigue: number; // 0-100
  morale: number; // 0-100
  reputation: Record<string, number>; // faction reputation
}

export interface StatusCondition {
  id: string;
  name: string;
  description: string;
  severity: 'minor' | 'moderate' | 'severe' | 'critical';
  duration?: number; // in game turns or -1 for permanent
  effects: string[];
}

export interface ActiveEffect {
  id: string;
  name: string;
  source: string;
  duration: number;
  statModifiers?: Partial<CharacterAttributes>;
  skillModifiers?: Record<string, number>;
}

// ============================================================================
// INVENTORY SYSTEM
// ============================================================================

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  category: ItemCategory;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'unique';
  weight: number;
  value: number;
  quantity: number;
  isStackable: boolean;
  maxStack: number;

  // Visual
  iconUrl?: string;
  artUrl?: string;

  // Effects
  effects?: ItemEffect[];
  requirements?: ItemRequirement[];

  // Equipment
  equipSlot?: EquipSlot;
  statBonuses?: Partial<CharacterAttributes>;
  skillBonuses?: Record<string, number>;

  // Consumable
  isConsumable?: boolean;
  uses?: number;
  maxUses?: number;

  // Special
  isQuestItem?: boolean;
  lore?: string;
  discoveredProperties?: string[];
  hiddenProperties?: string[];
}

export type ItemCategory =
  | 'weapon' | 'armor' | 'accessory' | 'consumable'
  | 'material' | 'quest' | 'key' | 'misc' | 'currency';

export type EquipSlot =
  | 'head' | 'chest' | 'hands' | 'legs' | 'feet'
  | 'mainHand' | 'offHand' | 'twoHand' | 'ring1' | 'ring2'
  | 'amulet' | 'back' | 'implant' | 'augment';

export interface ItemEffect {
  type: 'healing' | 'damage' | 'buff' | 'debuff' | 'special';
  target: 'self' | 'ally' | 'enemy' | 'area';
  value: number;
  duration?: number;
  description: string;
}

export interface ItemRequirement {
  type: 'attribute' | 'skill' | 'level' | 'class' | 'quest';
  name: string;
  value: number;
}

// ============================================================================
// LOCATION SYSTEM
// ============================================================================

export interface Location {
  id: string;
  name: string;
  type: LocationType;
  description: string;

  // Atmosphere
  atmosphere: Atmosphere;

  // Visual
  scenePrompt: string; // for image generation
  backgroundUrl?: string;

  // Navigation
  connectedLocations: LocationConnection[];
  subLocations?: Location[];
  parentLocationId?: string;

  // Inhabitants
  permanentNpcs: string[]; // character IDs
  spawnableNpcs: SpawnableNpc[];

  // Interactions
  interactables: Interactable[];
  discoveredSecrets: string[];
  hiddenSecrets: HiddenSecret[];

  // Events
  possibleEvents: LocationEvent[];
  activeEvents: string[];

  // Economy
  shops?: Shop[];
  services?: Service[];

  // Status
  dangerLevel: number; // 0-10
  isDiscovered: boolean;
  isAccessible: boolean;
  accessRequirements?: string[];

  // Time
  timeOfDay?: 'any' | 'day' | 'night' | 'dawn' | 'dusk';
  weather?: string;
}

export type LocationType =
  | 'city' | 'town' | 'village' | 'wilderness' | 'dungeon'
  | 'building' | 'room' | 'landmark' | 'road' | 'underground'
  | 'space' | 'virtual' | 'pocket-dimension';

export interface LocationConnection {
  locationId: string;
  direction?: string;
  distance: number;
  travelTime: number;
  travelMethod: 'walk' | 'vehicle' | 'teleport' | 'fast-travel' | 'special';
  requirements?: string[];
  dangers?: string[];
}

export interface SpawnableNpc {
  characterTemplateId: string;
  spawnChance: number; // 0-1
  conditions?: string[];
  maxCount: number;
}

export interface Interactable {
  id: string;
  name: string;
  type: 'object' | 'device' | 'container' | 'door' | 'npc' | 'environment';
  description: string;
  actions: InteractableAction[];
  state: Record<string, any>;
}

export interface InteractableAction {
  id: string;
  name: string;
  description: string;
  requirements?: ActionRequirement[];
  outcomes: ActionOutcome[];
  cooldown?: number;
  usesRemaining?: number;
}

export interface ActionRequirement {
  type: 'skill' | 'item' | 'attribute' | 'state' | 'relationship';
  target: string;
  value: number | string;
  consumeItem?: boolean;
}

export interface ActionOutcome {
  chance: number; // 0-1
  description: string;
  effects: OutcomeEffect[];
  nextSceneId?: string;
  triggeredEvents?: string[];
}

export interface OutcomeEffect {
  type: 'item' | 'experience' | 'relationship' | 'stat' | 'state' | 'narrative';
  target?: string;
  value: number | string | boolean;
}

export interface HiddenSecret {
  id: string;
  name: string;
  discoveryMethod: 'search' | 'skill-check' | 'item' | 'dialogue' | 'quest';
  difficulty: number;
  content: string;
  rewards: OutcomeEffect[];
}

export interface LocationEvent {
  id: string;
  name: string;
  type: 'random' | 'scheduled' | 'triggered' | 'one-time';
  chance: number;
  conditions?: string[];
  sceneId: string;
  cooldown?: number;
}

export interface Shop {
  id: string;
  name: string;
  ownerId?: string;
  type: 'general' | 'weapons' | 'armor' | 'magic' | 'consumables' | 'special';
  inventory: ShopItem[];
  buyMultiplier: number;
  sellMultiplier: number;
  restockInterval?: number;
}

export interface ShopItem {
  itemId: string;
  quantity: number;
  price?: number; // override default
}

export interface Service {
  id: string;
  name: string;
  type: 'rest' | 'healing' | 'repair' | 'transport' | 'information' | 'training';
  cost: number;
  effects: OutcomeEffect[];
  requirements?: ActionRequirement[];
}

// ============================================================================
// FACTION SYSTEM
// ============================================================================

export interface Faction {
  id: string;
  name: string;
  description: string;
  type: 'government' | 'criminal' | 'religious' | 'mercantile' | 'military' | 'secret' | 'guild';

  // Relationships
  alliedFactions: string[];
  rivalFactions: string[];

  // Hierarchy
  leaderId?: string;
  memberIds: string[];

  // Player standing
  playerReputation: number; // -100 to 100
  reputationTiers: ReputationTier[];

  // Quests and rewards
  availableQuests: string[];
  factionRewards: FactionReward[];

  // Control
  controlledLocations: string[];
  influence: Record<string, number>; // location-based influence
}

export interface ReputationTier {
  name: string;
  minReputation: number;
  perks: string[];
  restrictions?: string[];
}

export interface FactionReward {
  reputation: number;
  items?: string[];
  skills?: string[];
  access?: string[]; // location or content IDs
}

// ============================================================================
// STORY & QUEST SYSTEM
// ============================================================================

export interface StoryArc {
  id: string;
  name: string;
  description: string;
  type: 'main' | 'side' | 'faction' | 'personal' | 'hidden';

  // Structure
  chapters: StoryChapter[];
  currentChapter: number;

  // Status
  status: 'not-started' | 'in-progress' | 'completed' | 'failed' | 'abandoned';

  // Choices made
  majorChoices: StoryChoice[];

  // Outcomes
  possibleEndings: StoryEnding[];
  currentEnding?: string;
}

export interface StoryChapter {
  id: string;
  name: string;
  description: string;
  objectives: Objective[];
  triggerConditions: string[];
  completionConditions: string[];
  scenes: string[];
  nextChapters: string[]; // branching
}

export interface Objective {
  id: string;
  description: string;
  type: 'kill' | 'collect' | 'reach' | 'interact' | 'survive' | 'protect' | 'discover' | 'dialogue';
  target: string;
  currentProgress: number;
  requiredProgress: number;
  isOptional: boolean;
  isHidden: boolean;
  rewards: OutcomeEffect[];
}

export interface StoryChoice {
  id: string;
  sceneId: string;
  choiceText: string;
  consequences: string[];
  timestamp: number;
}

export interface StoryEnding {
  id: string;
  name: string;
  description: string;
  requirements: string[];
  epilogue: string;
  rewards: OutcomeEffect[];
}

// ============================================================================
// SCENE SYSTEM - LIVE GENERATION
// ============================================================================

/** Complete scene data for rendering and generation */
export interface GameScene {
  id: string;
  type: SceneType;

  // Narrative
  title?: string;
  subtitle?: string;
  introNarration: string;
  bodyNarration: string;
  outroNarration?: string;

  // Location
  locationId: string;
  atmosphere?: Atmosphere;

  // Characters present
  presentCharacters: PresentCharacter[];

  // Dialogue
  dialogueSequence?: DialogueLine[];

  // Choices
  playerChoices: PlayerChoice[];

  // Events
  triggeredEvents: string[];
  pendingEvents: SceneEvent[];

  // State changes
  stateChanges: StateChange[];

  // Visual
  sceneImagePrompt: string;
  sceneImageUrl?: string;
  visualTransition?: 'fade' | 'cut' | 'slide' | 'dissolve';

  // Audio
  ambientAudio?: string;
  musicTrack?: string;

  // Generation flags
  isStreaming: boolean;
  streamProgress: number;
  generatedChunks: SceneChunk[];
}

export type SceneType =
  | 'exploration' | 'dialogue' | 'combat' | 'cutscene'
  | 'shop' | 'rest' | 'travel' | 'event' | 'choice';

export interface PresentCharacter {
  characterId: string;
  position: 'left' | 'center' | 'right' | 'background';
  state: 'idle' | 'speaking' | 'thinking' | 'acting' | 'hidden';
  expression?: string;
}

export interface DialogueLine {
  speakerId: string;
  text: string;
  emotion?: string;
  action?: string; // accompanying action
  voiceDirection?: string;
  choices?: DialogueChoice[];
}

export interface DialogueChoice {
  id: string;
  text: string;
  requirements?: ActionRequirement[];
  relationshipChange?: number;
  leadsTo: string; // next dialogue line ID or scene ID
  isAvailable: boolean;
  unavailableReason?: string;
}

export interface PlayerChoice {
  id: string;
  text: string;
  description?: string; // hover description

  // Requirements
  requirements?: ActionRequirement[];
  isAvailable: boolean;
  unavailableReason?: string;

  // Outcome preview (for instant feedback)
  previewEffect?: string; // "Nova will appreciate this"
  riskLevel?: 'safe' | 'low' | 'moderate' | 'high' | 'extreme';

  // Branching
  outcomes: ChoiceOutcome[];

  // Pre-generated state for instant visual feedback
  preloadedSceneId?: string;
  preloadedVisualState?: VisualState;
}

export interface ChoiceOutcome {
  chance: number;
  resultSceneId: string;
  immediateEffects: OutcomeEffect[];
  narrativePreview?: string;
}

export interface VisualState {
  characterStates: Record<string, { expression: string; position: string }>;
  atmosphereChange?: Partial<Atmosphere>;
  visualEffect?: string; // "screen shake", "flash", "fade"
  transitionTime: number;
}

export interface SceneEvent {
  id: string;
  type: 'immediate' | 'delayed' | 'conditional';
  trigger?: string;
  delay?: number;
  effects: OutcomeEffect[];
}

export interface StateChange {
  type: 'relationship' | 'stat' | 'inventory' | 'quest' | 'world' | 'character';
  target: string;
  change: any;
  description?: string;
}

/** Chunks for streaming scene generation */
export interface SceneChunk {
  id: string;
  type: 'title' | 'subtitle' | 'narration' | 'dialogue' | 'choice' | 'visual' | 'state';
  content: string | object;
  order: number;
  isComplete: boolean;
  streamTokens?: string[];
}

// ============================================================================
// GAME STATE
// ============================================================================

export interface GameState {
  // Current position
  currentSceneId: string;
  currentLocationId: string;

  // Time
  gameTime: GameTime;

  // Progress
  questProgress: Record<string, QuestProgress>;
  discoveredLocations: string[];
  discoveredSecrets: string[];

  // World state
  worldFlags: Record<string, boolean | number | string>;
  npcStates: Record<string, NpcState>;
  locationStates: Record<string, LocationState>;

  // History
  recentScenes: string[];
  majorDecisions: StoryChoice[];
  combatLog: CombatEntry[];

  // Statistics
  playTime: number;
  scenesVisited: number;
  choicesMade: number;
  secretsFound: number;
  deathCount: number;
}

export interface GameTime {
  day: number;
  hour: number;
  minute: number;
  season?: string;
  year?: number;
  timeOfDay: 'dawn' | 'morning' | 'midday' | 'afternoon' | 'dusk' | 'evening' | 'night' | 'midnight';
}

export interface QuestProgress {
  questId: string;
  status: 'active' | 'completed' | 'failed' | 'abandoned';
  currentObjectiveId?: string;
  objectiveProgress: Record<string, number>;
  choicesMade: string[];
}

export interface NpcState {
  characterId: string;
  isAlive: boolean;
  currentLocationId?: string;
  disposition: number;
  knownFacts: string[];
  activeDialogueTree?: string;
}

export interface LocationState {
  locationId: string;
  isAccessible: boolean;
  modifiers: string[];
  activeEvents: string[];
  lootedContainers: string[];
}

export interface CombatEntry {
  timestamp: number;
  participants: string[];
  outcome: 'victory' | 'defeat' | 'fled' | 'negotiated';
  casualties: string[];
  loot: string[];
}

// ============================================================================
// STATISTICAL EVENT SYSTEM
// ============================================================================

export interface EventChance {
  eventId: string;
  baseChance: number; // 0-1
  modifiers: ChanceModifier[];
  conditions: EventCondition[];
  cooldown?: number;
  maxOccurrences?: number;
  currentOccurrences: number;
}

export interface ChanceModifier {
  type: 'attribute' | 'skill' | 'item' | 'relationship' | 'state' | 'time' | 'location';
  target: string;
  modifier: number; // multiplier or additive
  isMultiplier: boolean;
}

export interface EventCondition {
  type: 'has-item' | 'has-skill' | 'in-location' | 'time' | 'state' | 'relationship';
  target: string;
  operator: '=' | '!=' | '>' | '<' | '>=' | '<=';
  value: any;
}

/** Roll for an event based on chance and modifiers */
export function rollEventChance(
  eventChance: EventChance,
  character: CharacterData,
  gameState: GameState
): boolean {
  if (eventChance.maxOccurrences && eventChance.currentOccurrences >= eventChance.maxOccurrences) {
    return false;
  }

  // Check conditions
  for (const condition of eventChance.conditions) {
    if (!evaluateCondition(condition, character, gameState)) {
      return false;
    }
  }

  // Calculate modified chance
  let finalChance = eventChance.baseChance;

  for (const mod of eventChance.modifiers) {
    const modValue = getModifierValue(mod, character, gameState);
    if (mod.isMultiplier) {
      finalChance *= modValue;
    } else {
      finalChance += modValue;
    }
  }

  // Clamp to 0-1
  finalChance = Math.max(0, Math.min(1, finalChance));

  return Math.random() < finalChance;
}

function evaluateCondition(
  condition: EventCondition,
  character: CharacterData,
  gameState: GameState
): boolean {
  let value: any;

  switch (condition.type) {
    case 'has-item':
      value = character.inventory.some(i => i.id === condition.target);
      break;
    case 'has-skill':
      const skill = character.skills.find(s => s.id === condition.target);
      value = skill ? skill.level : 0;
      break;
    case 'in-location':
      value = gameState.currentLocationId === condition.target;
      break;
    case 'time':
      value = gameState.gameTime[condition.target as keyof GameTime];
      break;
    case 'state':
      value = gameState.worldFlags[condition.target];
      break;
    case 'relationship':
      const rel = character.relationships.find(r => r.characterId === condition.target);
      value = rel ? rel.level : 0;
      break;
    default:
      value = null;
  }

  switch (condition.operator) {
    case '=': return value === condition.value;
    case '!=': return value !== condition.value;
    case '>': return value > condition.value;
    case '<': return value < condition.value;
    case '>=': return value >= condition.value;
    case '<=': return value <= condition.value;
    default: return false;
  }
}

function getModifierValue(
  mod: ChanceModifier,
  character: CharacterData,
  gameState: GameState
): number {
  switch (mod.type) {
    case 'attribute':
      return (character.attributes[mod.target as keyof CharacterAttributes] as number || 0) * mod.modifier;
    case 'skill':
      const skill = character.skills.find(s => s.id === mod.target);
      return (skill?.level || 0) * mod.modifier;
    case 'item':
      return character.inventory.some(i => i.id === mod.target) ? mod.modifier : 0;
    case 'relationship':
      const rel = character.relationships.find(r => r.characterId === mod.target);
      return ((rel?.level || 0) / 100) * mod.modifier;
    case 'state':
      const stateVal = gameState.worldFlags[mod.target];
      return (typeof stateVal === 'number' ? stateVal : stateVal ? 1 : 0) * mod.modifier;
    case 'time':
      return mod.modifier; // Time-based modifiers are static
    case 'location':
      return gameState.currentLocationId === mod.target ? mod.modifier : 0;
    default:
      return 0;
  }
}

// ============================================================================
// SCENE GENERATION HELPERS
// ============================================================================

/** Generate structured data for streaming scene generation */
export function generateSceneStructure(
  scene: GameScene,
  characters: CharacterData[],
  setting: GameSetting
): SceneChunk[] {
  const chunks: SceneChunk[] = [];
  let order = 0;

  // Title chunk
  if (scene.title) {
    chunks.push({
      id: `${scene.id}-title`,
      type: 'title',
      content: scene.title,
      order: order++,
      isComplete: true,
    });
  }

  // Subtitle chunk
  if (scene.subtitle) {
    chunks.push({
      id: `${scene.id}-subtitle`,
      type: 'subtitle',
      content: scene.subtitle,
      order: order++,
      isComplete: true,
    });
  }

  // Intro narration
  chunks.push({
    id: `${scene.id}-intro`,
    type: 'narration',
    content: scene.introNarration,
    order: order++,
    isComplete: false,
    streamTokens: [],
  });

  // Dialogue sequence
  if (scene.dialogueSequence) {
    for (const line of scene.dialogueSequence) {
      const speaker = characters.find(c => c.id === line.speakerId);
      chunks.push({
        id: `${scene.id}-dialogue-${order}`,
        type: 'dialogue',
        content: {
          speaker: speaker?.name || 'Unknown',
          text: line.text,
          emotion: line.emotion,
          voiceConfig: speaker?.voice,
        },
        order: order++,
        isComplete: false,
        streamTokens: [],
      });
    }
  }

  // Body narration
  chunks.push({
    id: `${scene.id}-body`,
    type: 'narration',
    content: scene.bodyNarration,
    order: order++,
    isComplete: false,
    streamTokens: [],
  });

  // Player choices
  for (const choice of scene.playerChoices) {
    chunks.push({
      id: `${scene.id}-choice-${choice.id}`,
      type: 'choice',
      content: {
        id: choice.id,
        text: choice.text,
        description: choice.description,
        isAvailable: choice.isAvailable,
        unavailableReason: choice.unavailableReason,
        previewEffect: choice.previewEffect,
        riskLevel: choice.riskLevel,
      },
      order: order++,
      isComplete: true,
    });
  }

  return chunks;
}

/** Pre-load visual states for all choices */
export async function preloadChoiceVisualStates(
  choices: PlayerChoice[],
  currentScene: GameScene,
  generateImage: (prompt: string) => Promise<string>
): Promise<Map<string, VisualState>> {
  const states = new Map<string, VisualState>();

  await Promise.all(
    choices.map(async (choice) => {
      if (choice.preloadedVisualState) {
        states.set(choice.id, choice.preloadedVisualState);
        return;
      }

      // Generate visual state based on choice outcome
      const primaryOutcome = choice.outcomes[0];
      if (primaryOutcome) {
        const visualState: VisualState = {
          characterStates: {},
          transitionTime: 300,
        };

        // Analyze effects to determine visual changes
        for (const effect of primaryOutcome.immediateEffects) {
          if (effect.type === 'relationship') {
            const change = effect.value as number;
            visualState.characterStates[effect.target as string] = {
              expression: change > 0 ? 'pleased' : 'displeased',
              position: 'center',
            };
          }
        }

        states.set(choice.id, visualState);
      }
    })
  );

  return states;
}

// ============================================================================
// BRANCHING PATHWAY SYSTEM
// ============================================================================

export interface BranchingNode {
  sceneId: string;
  children: BranchingNode[];
  choice?: PlayerChoice;
  probability: number;
  depth: number;
}

/** Build branching tree for pre-generation */
export function buildBranchingTree(
  rootSceneId: string,
  scenes: Map<string, GameScene>,
  maxDepth: number = 3
): BranchingNode {
  const buildNode = (sceneId: string, depth: number): BranchingNode => {
    const scene = scenes.get(sceneId);
    if (!scene || depth >= maxDepth) {
      return { sceneId, children: [], probability: 1, depth };
    }

    const children: BranchingNode[] = [];
    for (const choice of scene.playerChoices) {
      if (choice.isAvailable) {
        for (const outcome of choice.outcomes) {
          const childNode = buildNode(outcome.resultSceneId, depth + 1);
          childNode.choice = choice;
          childNode.probability = outcome.chance;
          children.push(childNode);
        }
      }
    }

    return { sceneId, children, probability: 1, depth };
  };

  return buildNode(rootSceneId, 0);
}

/** Pre-generate likely paths for instant transitions */
export async function preGeneratePaths(
  tree: BranchingNode,
  scenes: Map<string, GameScene>,
  generateScene: (sceneId: string) => Promise<GameScene>,
  threshold: number = 0.3
): Promise<Map<string, GameScene>> {
  const generated = new Map<string, GameScene>();

  const processNode = async (node: BranchingNode, cumulativeProbability: number) => {
    // Only pre-generate if cumulative probability is above threshold
    if (cumulativeProbability >= threshold && !generated.has(node.sceneId)) {
      const scene = await generateScene(node.sceneId);
      generated.set(node.sceneId, scene);
    }

    // Process children
    for (const child of node.children) {
      await processNode(child, cumulativeProbability * child.probability);
    }
  };

  await processNode(tree, 1);
  return generated;
}

// ============================================================================
// EXPORT DEFAULTS
// ============================================================================

export const DEFAULT_TONE: Tone = {
  primary: 'neutral',
  humor: 'subtle',
  violence: 'moderate',
  romance: 'subtle',
  horror: 'none',
  pacing: 'moderate',
  complexity: 'moderate',
};

export const DEFAULT_ATMOSPHERE: Atmosphere = {
  lighting: 'ambient',
  weather: 'clear',
  soundscape: 'ambient environmental sounds',
  scent: 'neutral',
  mood: 'expectant',
  visualStyle: 'realistic',
  colorPalette: ['neutral', 'earth-tones'],
};
