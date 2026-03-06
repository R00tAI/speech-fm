'use client';

/**
 * Voice31 RPG Store
 *
 * Complete state management for RPG mode including:
 * - Player character with stats, inventory, abilities
 * - NPCs with portraits, voices, relationships
 * - Locations with backgrounds and ambient effects
 * - Quest system
 * - Save file / notebook system
 * - Combat state
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { EffectType } from './Voice31Store';
import { type GameTime, type GameTimeDelta, DEFAULT_GAME_TIME, GameClock } from '@/lib/rpg/game-clock';
import { type NPCMemoryState, createNPCMemoryState } from '@/lib/rpg/npc-memory';
import { type LocationState, createLocationState } from '@/lib/rpg/location-state-manager';

// =============================================================================
// CHARACTER STATS
// =============================================================================

export interface CharacterStats {
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  strength: number;
  dexterity: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  constitution: number;
  level: number;
  experience: number;
  experienceToLevel: number;
}

export const DEFAULT_STATS: CharacterStats = {
  health: 100,
  maxHealth: 100,
  mana: 50,
  maxMana: 50,
  strength: 10,
  dexterity: 10,
  intelligence: 10,
  wisdom: 10,
  charisma: 10,
  constitution: 10,
  level: 1,
  experience: 0,
  experienceToLevel: 100,
};

// =============================================================================
// STATUS EFFECTS & ABILITIES
// =============================================================================

export interface StatusEffect {
  id: string;
  name: string;
  description: string;
  type: 'buff' | 'debuff' | 'neutral';
  icon?: string;
  duration: number; // Turns remaining, -1 for permanent
  statModifiers?: Partial<CharacterStats>;
  damagePerTurn?: number;
  healPerTurn?: number;
}

export interface Ability {
  id: string;
  name: string;
  description: string;
  type: 'attack' | 'spell' | 'skill' | 'passive';
  manaCost: number;
  cooldown: number;
  currentCooldown: number;
  damage?: string; // Dice notation: "2d6+4"
  healing?: string;
  effects?: string[]; // Status effect IDs to apply
  unlockLevel: number;
}

// =============================================================================
// INVENTORY
// =============================================================================

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type ItemType = 'weapon' | 'armor' | 'consumable' | 'quest' | 'misc' | 'accessory';

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  rarity: ItemRarity;
  equipped: boolean;
  quantity: number;
  imageUrl?: string;
  statModifiers?: Partial<CharacterStats>;
  consumeEffect?: {
    healthRestore?: number;
    manaRestore?: number;
    statusEffect?: string;
  };
  value: number; // Gold value
}

// =============================================================================
// PLAYER CHARACTER
// =============================================================================

export type PlayerRace = 'human' | 'elf' | 'dwarf' | 'halfling' | 'orc' | 'tiefling' | 'dragonborn';
export type PlayerClass = 'warrior' | 'mage' | 'rogue' | 'ranger' | 'cleric' | 'paladin' | 'bard';

export interface PlayerCharacter {
  id: string;
  name: string;
  race: PlayerRace;
  class: PlayerClass;
  backstory: string;
  personality: string[];
  appearance: string;
  portraitUrl?: string;
  voiceId?: string;
  stats: CharacterStats;
  inventory: InventoryItem[];
  abilities: Ability[];
  statusEffects: StatusEffect[];
  gold: number;
  createdAt: number;
}

// =============================================================================
// NPC (Non-Player Character)
// =============================================================================

export type NPCPosition = 'left' | 'right' | 'center';
export type PortraitStyle = 'transparent' | 'framed' | 'floating';

export interface DialogueLine {
  speaker: string;
  text: string;
  timestamp: number;
  emotion?: string;
}

export interface NPCharacter {
  id: string;
  name: string;
  title?: string;
  race: string;
  description: string;
  personality: string[];
  portraitUrl?: string;
  portraitPrompt?: string;
  portraitStyle: PortraitStyle;
  portraitBgRemovedUrl?: string;
  portraitDepthUrl?: string;
  displaySize?: 'large' | 'medium' | 'small';
  voiceId: string;
  voiceName?: string;
  relationship: number; // -100 (hostile) to 100 (friendly)
  isVisible: boolean;
  position: NPCPosition;
  isSpeaking: boolean;
  currentDialogue?: string;
  dialogueHistory: DialogueLine[];
  metAt?: string; // Location ID where first met
  metTimestamp?: number;
}

// =============================================================================
// LOCATIONS
// =============================================================================

export interface GameLocation {
  id: string;
  name: string;
  description: string;
  backgroundPrompt: string;
  backgroundUrl?: string;
  thumbnailUrl?: string;
  ambientEffect?: EffectType;
  ambientIntensity?: number;
  music?: string;
  connectedLocations: string[];
  npcsPresent: string[];
  itemsPresent: string[];
  discovered: boolean;
  visitCount: number;
  firstVisitedAt?: number;
  lastVisitedAt?: number;
}

// =============================================================================
// QUESTS
// =============================================================================

export type QuestStatus = 'available' | 'active' | 'completed' | 'failed';

export interface QuestObjective {
  id: string;
  description: string;
  type: 'kill' | 'collect' | 'talk' | 'explore' | 'escort' | 'custom';
  target?: string;
  required: number;
  current: number;
  completed: boolean;
  optional: boolean;
}

export interface QuestReward {
  type: 'gold' | 'experience' | 'item' | 'reputation' | 'ability';
  amount?: number;
  itemId?: string;
  npcId?: string;
}

export interface Quest {
  id: string;
  name: string;
  description: string;
  objectives: QuestObjective[];
  rewards: QuestReward[];
  status: QuestStatus;
  giverId?: string;
  giverName?: string;
  locationId?: string;
  startedAt?: number;
  completedAt?: number;
  failedAt?: number;
  expiresAt?: number;
  chainId?: string; // For quest chains
  chainOrder?: number;
}

// =============================================================================
// STORY EVENTS (For Notebook/Save File)
// =============================================================================

export type StoryEventType = 'narrative' | 'dialogue' | 'combat' | 'discovery' | 'death' | 'levelup' | 'quest' | 'item';

export interface StoryEvent {
  id: string;
  type: StoryEventType;
  timestamp: number;
  chapter?: number;
  summary: string;
  fullText: string;
  locationId: string;
  locationName: string;
  participants: string[];
  outcome?: string;
  important: boolean; // Highlighted in notebook
}

// =============================================================================
// COMBAT
// =============================================================================

export interface CombatParticipant {
  id: string;
  name: string;
  isPlayer: boolean;
  isNPC: boolean;
  health: number;
  maxHealth: number;
  initiative: number;
  statusEffects: StatusEffect[];
  portraitUrl?: string;
}

export interface CombatAction {
  actorId: string;
  targetId: string;
  actionType: 'attack' | 'ability' | 'item' | 'flee' | 'defend';
  abilityId?: string;
  itemId?: string;
  roll?: number;
  damage?: number;
  healing?: number;
  success: boolean;
  description: string;
}

export interface CombatState {
  active: boolean;
  round: number;
  turnOrder: string[];
  currentTurnIndex: number;
  participants: CombatParticipant[];
  actionLog: CombatAction[];
  playerVictory?: boolean;
}

// =============================================================================
// RPG SETTINGS
// =============================================================================

export type Difficulty = 'easy' | 'normal' | 'hard' | 'nightmare';
export type StoryDriveLevel = 'passive' | 'balanced' | 'aggressive' | 'railroaded';
export type WorldDifficulty = 'god_mode' | 'easy' | 'normal' | 'hard' | 'hardcore';
export type NarrativeStyle = 'verbose' | 'balanced' | 'minimal';
export type CombatStyle = 'descriptive' | 'quick';

export type VisualQuality = 'auto' | 'cinematic' | 'balanced' | 'safe';
export type FMDitherPattern = 'bayer4' | 'bayer8' | 'bayer16' | 'halftone' | 'noise';
export type PortraitDisplaySize = 'small' | 'medium' | 'large' | 'auto';

export interface RPGSettings {
  autoSave: boolean;
  autoSaveInterval: number; // seconds
  narrativeStyle: NarrativeStyle;
  combatStyle: CombatStyle;
  showDiceRolls: boolean;
  showDamageNumbers: boolean;
  backgroundTransitionSpeed: number; // ms
  npcVoiceEnabled: boolean;
  ambientEffectsEnabled: boolean;
  hudOpacity: number; // 0-1
  // Visual enhancement settings
  visualQuality: VisualQuality;
  enableDepthParallax: boolean;
  enableFMDither: boolean;
  enableBgRemoval: boolean;
  fmDitherPattern: FMDitherPattern;
  fmDitherColorDepth: number; // 2-16
  portraitSize: PortraitDisplaySize;
  // Transition settings
  sceneTransition: SceneTransitionType;
  // Filigree settings
  enableFiligree: boolean;
  filigreeOpacity: number; // 0-1
  filigreeScale: number; // 0.5-2
  // Story & Difficulty settings
  storyDriveLevel: StoryDriveLevel;
  worldDifficulty: WorldDifficulty;
}

export const DEFAULT_RPG_SETTINGS: RPGSettings = {
  autoSave: true,
  autoSaveInterval: 60,
  narrativeStyle: 'balanced',
  combatStyle: 'descriptive',
  showDiceRolls: true,
  showDamageNumbers: true,
  backgroundTransitionSpeed: 800,
  npcVoiceEnabled: true,
  ambientEffectsEnabled: true,
  hudOpacity: 0.9,
  // Visual defaults - enhanced visuals on by default
  visualQuality: 'auto',
  enableDepthParallax: true,
  enableFMDither: true,
  enableBgRemoval: true,
  fmDitherPattern: 'bayer8',
  fmDitherColorDepth: 4,
  portraitSize: 'auto',
  // Transition defaults
  sceneTransition: 'crt_static',
  // Filigree defaults
  enableFiligree: true,
  filigreeOpacity: 0.6,
  filigreeScale: 1.0,
  // Story & Difficulty defaults
  storyDriveLevel: 'balanced',
  worldDifficulty: 'normal',
};

// =============================================================================
// SAVE FILE (The Notebook)
// =============================================================================

export interface RPGSaveFile {
  id: string;
  name: string;
  createdAt: number;
  lastPlayedAt: number;
  playTime: number; // Total seconds

  // Player
  player: PlayerCharacter;

  // World State
  currentLocationId: string;
  locations: Record<string, GameLocation>;
  npcs: Record<string, NPCharacter>;

  // Progress
  quests: Quest[];
  storyEvents: StoryEvent[];
  currentChapter: number;
  globalFlags: Record<string, boolean | number | string>;

  // Settings
  difficulty: Difficulty;
  settings: RPGSettings;

  // World Simulation
  gameTime: GameTime;
  npcMemories: Record<string, NPCMemoryState>;
  locationStates: Record<string, LocationState>;

  // Meta
  version: string;
  thumbnail?: string;
}

// =============================================================================
// DIALOGUE OPTIONS
// =============================================================================

export interface DialogueOption {
  id: string;
  text: string;
  consequence?: string; // Hidden consequence hint
  requirement?: {
    stat?: keyof CharacterStats;
    minValue?: number;
    item?: string;
    flag?: string;
  };
  disabled?: boolean;
  disabledReason?: string;
}

// =============================================================================
// ACTIVE SCENE STATE
// =============================================================================

export type SceneTransitionType = 'none' | 'fade' | 'slide' | 'dissolve' | 'zoom' | 'crt_static' | 'scanline_wipe' | 'ink_bleed';

// =============================================================================
// SCENE TYPE & CAMERA
// =============================================================================

export type RPGSceneType = 'depthmap' | 'webgl_dither' | 'parallax_popup' | 'css_only';

export type CameraPreset = 'static' | 'push_in' | 'pull_out' | 'orbital' | 'drift' | 'slow_pan' | 'dramatic_reveal' | 'tracking' | 'figure_eight';

export interface CameraConfig {
  preset: CameraPreset;
  speed: number;       // 0.1 - 3.0
  amplitude: number;   // 0.01 - 0.2
  mouseInfluence: number; // 0 - 1
}

export interface FiligreeElement {
  id: string;
  url: string; // bg-removed filigree image URL
  depthMapUrl?: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';
  opacity: number;
  scale: number;
  prompt: string; // What was generated
}

// Scene lighting — slim config that feeds into the depth scene shader
export interface RPGSceneLighting {
  fogColor: [number, number, number]; // RGB 0-1, depth fog tint
  fogDensity: number; // 0-1
  ambientTint: [number, number, number]; // RGB 0-1, overall color shift
  ambientIntensity: number; // 0-2
  colorTemperature: number; // -1 (cool) to 1 (warm)
  vignetteIntensity: number; // 0-1
  vignetteColor: [number, number, number]; // RGB 0-1
  godRays: {
    enabled: boolean;
    position: [number, number]; // screen-space 0-1
    color: [number, number, number]; // RGB 0-1
    intensity: number; // 0-1
  };
}

// Theme-based lighting presets for RPG scenes
export const RPG_SCENE_LIGHTING_PRESETS: Record<string, RPGSceneLighting> = {
  fantasy: {
    fogColor: [0.12, 0.10, 0.08],
    fogDensity: 0.2,
    ambientTint: [1.0, 0.92, 0.78],
    ambientIntensity: 1.0,
    colorTemperature: 0.3,
    vignetteIntensity: 0.5,
    vignetteColor: [0.05, 0.03, 0.01],
    godRays: { enabled: true, position: [0.5, 0.1], color: [1.0, 0.8, 0.4], intensity: 0.2 },
  },
  cyberpunk: {
    fogColor: [0.04, 0.06, 0.14],
    fogDensity: 0.3,
    ambientTint: [0.7, 0.85, 1.0],
    ambientIntensity: 0.9,
    colorTemperature: -0.4,
    vignetteIntensity: 0.6,
    vignetteColor: [0.02, 0.0, 0.08],
    godRays: { enabled: false, position: [0.5, 0.5], color: [0, 1, 1], intensity: 0 },
  },
  noir: {
    fogColor: [0.06, 0.06, 0.08],
    fogDensity: 0.25,
    ambientTint: [0.9, 0.88, 0.85],
    ambientIntensity: 0.75,
    colorTemperature: -0.1,
    vignetteIntensity: 0.7,
    vignetteColor: [0.0, 0.0, 0.0],
    godRays: { enabled: true, position: [0.8, 0.2], color: [0.9, 0.85, 0.75], intensity: 0.15 },
  },
  fallout: {
    fogColor: [0.14, 0.12, 0.08],
    fogDensity: 0.35,
    ambientTint: [1.0, 0.95, 0.7],
    ambientIntensity: 1.1,
    colorTemperature: 0.15,
    vignetteIntensity: 0.55,
    vignetteColor: [0.06, 0.04, 0.01],
    godRays: { enabled: false, position: [0.5, 0.0], color: [1, 0.9, 0.5], intensity: 0 },
  },
  medieval: {
    fogColor: [0.10, 0.09, 0.06],
    fogDensity: 0.2,
    ambientTint: [1.0, 0.94, 0.82],
    ambientIntensity: 1.0,
    colorTemperature: 0.2,
    vignetteIntensity: 0.45,
    vignetteColor: [0.04, 0.02, 0.01],
    godRays: { enabled: true, position: [0.3, 0.0], color: [1.0, 0.85, 0.5], intensity: 0.25 },
  },
  scifi: {
    fogColor: [0.05, 0.08, 0.15],
    fogDensity: 0.2,
    ambientTint: [0.8, 0.9, 1.0],
    ambientIntensity: 1.05,
    colorTemperature: -0.25,
    vignetteIntensity: 0.5,
    vignetteColor: [0.0, 0.02, 0.06],
    godRays: { enabled: false, position: [0.5, 0.5], color: [0.5, 0.8, 1.0], intensity: 0 },
  },
  // Fallback for unknown themes
  default: {
    fogColor: [0.15, 0.18, 0.25],
    fogDensity: 0.2,
    ambientTint: [1.0, 1.0, 1.0],
    ambientIntensity: 1.0,
    colorTemperature: 0.0,
    vignetteIntensity: 0.5,
    vignetteColor: [0.0, 0.0, 0.0],
    godRays: { enabled: false, position: [0.5, 0.5], color: [1, 1, 1], intensity: 0 },
  },
};

export interface ActiveScene {
  location: GameLocation | null;
  backgroundUrl: string | null;
  backgroundTransition: SceneTransitionType;
  backgroundLoading: boolean;
  depthMapUrl: string | null;
  depthMapLoading: boolean;
  sceneLighting: RPGSceneLighting | null;
  sceneType: RPGSceneType;
  cameraConfig: CameraConfig | null;
  activeNPCs: NPCharacter[];
  currentSpeakerId: string | null;
  dialogueOptions: DialogueOption[];
  showingDialogueOptions: boolean;
  lastNarration: string;
  // Session filigree decorations
  filigree: FiligreeElement[];
  filigreeLoading: boolean;
  filigreeTheme: string | null; // The theme/story description used to generate
  // Location image cache
  locationImageCache: Record<string, { backgroundUrl: string; depthMapUrl?: string; generatedAt: number }>;
}

// =============================================================================
// RPG STORE STATE
// =============================================================================

interface RPGState {
  // Mode
  rpgModeActive: boolean;
  rpgModeInitialized: boolean;

  // Current Game
  currentSaveFile: RPGSaveFile | null;
  savedGames: RPGSaveFile[];
  lastAutoSave: number;
  serverSyncStatus: 'idle' | 'syncing' | 'synced' | 'error';

  // Active Scene
  activeScene: ActiveScene;

  // UI State
  hudVisible: boolean;
  inventoryOpen: boolean;
  questLogOpen: boolean;
  saveFileViewerOpen: boolean;
  characterSheetOpen: boolean;
  characterCreatorOpen: boolean;
  settingsOpen: boolean;
  sceneInspectorOpen: boolean;
  notebookTab: 'story' | 'locations' | 'characters' | 'quests' | 'inventory' | 'stats';

  // Combat
  combatState: CombatState | null;

  // Dice Roll Display
  diceRoll: {
    active: boolean;
    dice: string;
    purpose: string;
    result: number | null;
    success: boolean | null;
    dc?: number;
  } | null;

  // Damage/Heal Numbers
  floatingNumbers: Array<{
    id: string;
    value: number;
    type: 'damage' | 'heal' | 'xp' | 'gold';
    x: number;
    y: number;
    timestamp: number;
  }>;
}

interface RPGActions {
  // Mode Control
  enableRPGMode: () => void;
  disableRPGMode: () => void;
  toggleRPGMode: () => void;
  initializeRPGMode: () => void;
  setShowCharacterCreator: (show: boolean) => void;

  // Save/Load
  createNewGame: (playerName: string, race: PlayerRace, playerClass: PlayerClass) => string;
  loadGame: (saveId: string) => boolean;
  saveGame: (slotName?: string) => void;
  deleteSave: (saveId: string) => void;
  exportSave: (saveId: string) => string;
  importSave: (jsonData: string) => boolean;
  syncSaveToServer: (save: RPGSaveFile) => Promise<void>;
  loadSavesFromServer: () => Promise<void>;

  // Player Management
  updatePlayerStats: (changes: Partial<CharacterStats>) => void;
  applyDamage: (amount: number, source?: string) => void;
  applyHealing: (amount: number, source?: string) => void;
  addExperience: (amount: number) => void;
  levelUp: () => void;
  addItem: (item: Omit<InventoryItem, 'id'>) => string;
  removeItem: (itemId: string, quantity?: number) => void;
  equipItem: (itemId: string) => void;
  unequipItem: (itemId: string) => void;
  useItem: (itemId: string) => void;
  addGold: (amount: number) => void;
  removeGold: (amount: number) => boolean;
  addAbility: (ability: Omit<Ability, 'id' | 'currentCooldown'>) => string;
  addStatusEffect: (effect: Omit<StatusEffect, 'id'>) => string;
  removeStatusEffect: (effectId: string) => void;
  updatePlayerPortrait: (url: string) => void;
  updatePlayerVoice: (voiceId: string) => void;

  // Scene Management
  setScene: (location: Omit<GameLocation, 'id' | 'discovered' | 'visitCount'>, transition?: ActiveScene['backgroundTransition']) => Promise<void>;
  updateSceneBackground: (url: string) => void;
  setBackgroundLoading: (loading: boolean) => void;
  updateSceneDepthMap: (url: string) => void;
  setDepthMapLoading: (loading: boolean) => void;
  setSceneLighting: (lighting: RPGSceneLighting | null) => void;
  cacheLocationImage: (locationName: string, backgroundUrl: string, depthMapUrl?: string) => void;
  getCachedLocationImage: (locationName: string) => { backgroundUrl: string; depthMapUrl?: string } | null;
  clearScene: () => void;

  // Filigree
  addFiligree: (element: Omit<FiligreeElement, 'id'>) => string;
  removeFiligree: (id: string) => void;
  clearFiligree: () => void;
  setFiligreeLoading: (loading: boolean) => void;
  setFiligreeTheme: (theme: string | null) => void;

  // NPC Management
  showNPC: (npc: Omit<NPCharacter, 'id' | 'isVisible' | 'isSpeaking' | 'dialogueHistory'>) => string;
  dismissNPC: (npcId: string, transition?: 'fade' | 'slide') => void;
  dismissAllNPCs: () => void;
  npcSpeak: (npcId: string, dialogue: string, emotion?: string) => void;
  stopNPCSpeaking: (npcId: string) => void;
  updateNPCRelationship: (npcId: string, change: number) => void;
  updateNPCPosition: (npcId: string, position: NPCPosition) => void;
  updateNPCPortrait: (npcId: string, url: string) => void;
  updateNPCBgRemoved: (npcId: string, url: string) => void;
  updateNPCDepthMap: (npcId: string, url: string) => void;
  updateNPCDisplaySize: (npcId: string, size: 'large' | 'medium' | 'small') => void;

  // Character Creator (voice-driven)
  characterCreatorStep: number | null;
  characterCreatorData: Partial<{ name: string; race: string; class: string; backstory: string }>;
  advanceCharacterCreation: (answer: string) => void;
  getCharacterCreatorPrompt: () => string;
  resetCharacterCreator: () => void;

  // Dialogue
  showDialogueOptions: (options: DialogueOption[]) => void;
  hideDialogueOptions: () => void;
  selectDialogueOption: (optionId: string) => DialogueOption | null;

  // Quests
  addQuest: (quest: Omit<Quest, 'id' | 'status' | 'startedAt'>) => string;
  updateQuestStatus: (questId: string, status: QuestStatus) => void;
  updateQuestObjective: (questId: string, objectiveId: string, progress: number) => void;
  completeQuest: (questId: string) => void;
  failQuest: (questId: string) => void;

  // Story Events
  logStoryEvent: (event: Omit<StoryEvent, 'id' | 'timestamp'>) => string;

  // Combat
  startCombat: (enemies: CombatParticipant[]) => void;
  endCombat: (playerVictory: boolean) => void;
  nextCombatTurn: () => void;
  logCombatAction: (action: CombatAction) => void;

  // Dice Rolls
  rollDice: (dice: string, purpose: string, dc?: number) => Promise<{ result: number; success: boolean }>;
  clearDiceRoll: () => void;

  // Floating Numbers
  showFloatingNumber: (value: number, type: 'damage' | 'heal' | 'xp' | 'gold', x?: number, y?: number) => void;
  clearFloatingNumbers: () => void;

  // Global Flags
  setFlag: (key: string, value: boolean | number | string) => void;
  getFlag: (key: string) => boolean | number | string | undefined;

  // UI Controls
  toggleHUD: () => void;
  setHUDVisible: (visible: boolean) => void;
  toggleInventory: () => void;
  toggleQuestLog: () => void;
  toggleSaveFileViewer: () => void;
  toggleCharacterSheet: () => void;
  toggleCharacterCreator: () => void;
  toggleSettings: () => void;
  setNotebookTab: (tab: RPGState['notebookTab']) => void;
  closeAllPanels: () => void;

  // Scene Inspector & Scene Type
  toggleSceneInspector: () => void;
  setSceneType: (sceneType: RPGSceneType) => void;
  setCameraConfig: (config: CameraConfig | null) => void;

  // Settings
  updateSettings: (settings: Partial<RPGSettings>) => void;

  // World Simulation
  tickGameClock: () => GameTime | null;
  advanceGameTime: (minutes: number) => void;
  getGameTime: () => GameTime | null;
  setGameTime: (time: GameTime) => void;
  getNPCMemory: (npcId: string) => NPCMemoryState | null;
  updateNPCMemory: (npcId: string, updater: (state: NPCMemoryState) => NPCMemoryState) => void;
  getLocationState: (locationId: string) => LocationState | null;
  updateLocationState: (locationId: string, updater: (state: LocationState) => LocationState) => void;

  // Reset
  resetRPGState: () => void;
}

export type Voice31RPGStore = RPGState & RPGActions;

// =============================================================================
// DEFAULT STATE
// =============================================================================

const DEFAULT_ACTIVE_SCENE: ActiveScene = {
  location: null,
  backgroundUrl: null,
  backgroundTransition: 'none',
  backgroundLoading: false,
  depthMapUrl: null,
  depthMapLoading: false,
  sceneLighting: null,
  sceneType: 'depthmap',
  cameraConfig: null,
  activeNPCs: [],
  currentSpeakerId: null,
  dialogueOptions: [],
  showingDialogueOptions: false,
  lastNarration: '',
  filigree: [],
  filigreeLoading: false,
  filigreeTheme: null,
  locationImageCache: {},
};

const DEFAULT_RPG_STATE: RPGState = {
  rpgModeActive: false,
  rpgModeInitialized: false,
  currentSaveFile: null,
  savedGames: [],
  lastAutoSave: 0,
  serverSyncStatus: 'idle',
  activeScene: DEFAULT_ACTIVE_SCENE,
  hudVisible: true,
  inventoryOpen: false,
  questLogOpen: false,
  saveFileViewerOpen: false,
  characterSheetOpen: false,
  characterCreatorOpen: false,
  settingsOpen: false,
  sceneInspectorOpen: false,
  notebookTab: 'story',
  combatState: null,
  diceRoll: null,
  floatingNumbers: [],
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

const generateId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const parseDiceNotation = (dice: string): { count: number; sides: number; modifier: number } => {
  const match = dice.match(/^(\d+)d(\d+)([+-]\d+)?$/i);
  if (!match) return { count: 1, sides: 20, modifier: 0 };
  return {
    count: parseInt(match[1], 10),
    sides: parseInt(match[2], 10),
    modifier: match[3] ? parseInt(match[3], 10) : 0,
  };
};

const rollDiceValue = (dice: string): number => {
  const { count, sides, modifier } = parseDiceNotation(dice);
  let total = modifier;
  for (let i = 0; i < count; i++) {
    total += Math.floor(Math.random() * sides) + 1;
  }
  return total;
};

const calculateXPToLevel = (level: number): number => {
  return Math.floor(100 * Math.pow(1.5, level - 1));
};

// =============================================================================
// STORE
// =============================================================================

export const useVoice31RPGStore = create<Voice31RPGStore>()(
  persist(
    (set, get) => ({
      ...DEFAULT_RPG_STATE,

      // Mode Control
      enableRPGMode: () => set({ rpgModeActive: true }),
      disableRPGMode: () => set({
        rpgModeActive: false,
        activeScene: DEFAULT_ACTIVE_SCENE,
        combatState: null,
        diceRoll: null,
      }),
      toggleRPGMode: () => {
        const state = get();
        if (state.rpgModeActive) {
          get().disableRPGMode();
        } else {
          get().enableRPGMode();
          // Show character creator if no save file exists
          if (!state.currentSaveFile && state.savedGames.length === 0) {
            set({ characterCreatorOpen: true });
          }
        }
      },
      setShowCharacterCreator: (show) => set({ characterCreatorOpen: show }),
      initializeRPGMode: () => set({ rpgModeInitialized: true }),

      // Save/Load
      createNewGame: (playerName, race, playerClass) => {
        const saveId = crypto.randomUUID();
        const playerId = generateId('player');
        const now = Date.now();

        const player: PlayerCharacter = {
          id: playerId,
          name: playerName,
          race,
          class: playerClass,
          backstory: '',
          personality: [],
          appearance: '',
          stats: { ...DEFAULT_STATS },
          inventory: [],
          abilities: [],
          statusEffects: [],
          gold: 50,
          createdAt: now,
        };

        const saveFile: RPGSaveFile = {
          id: saveId,
          name: `${playerName}'s Adventure`,
          createdAt: now,
          lastPlayedAt: now,
          playTime: 0,
          player,
          currentLocationId: 'starting_location',
          locations: {},
          npcs: {},
          quests: [],
          storyEvents: [],
          currentChapter: 1,
          globalFlags: {},
          difficulty: 'normal',
          settings: { ...DEFAULT_RPG_SETTINGS },
          gameTime: { ...DEFAULT_GAME_TIME },
          npcMemories: {},
          locationStates: {},
          version: '1.0.0',
        };

        set((state) => ({
          currentSaveFile: saveFile,
          savedGames: [...state.savedGames, saveFile],
          rpgModeActive: true,
          rpgModeInitialized: true,
          characterCreatorOpen: false,
        }));

        return saveId;
      },

      loadGame: (saveId) => {
        const state = get();
        const save = state.savedGames.find((s) => s.id === saveId);
        if (!save) return false;

        set({
          currentSaveFile: { ...save, lastPlayedAt: Date.now() },
          rpgModeActive: true,
          rpgModeInitialized: true,
        });
        return true;
      },

      saveGame: (slotName) => {
        const state = get();
        if (!state.currentSaveFile) return;

        const updatedSave: RPGSaveFile = {
          ...state.currentSaveFile,
          name: slotName || state.currentSaveFile.name,
          lastPlayedAt: Date.now(),
          locations: { ...state.currentSaveFile.locations },
          npcs: { ...state.currentSaveFile.npcs },
        };

        // Update active scene NPCs in save
        for (const npc of state.activeScene.activeNPCs) {
          updatedSave.npcs[npc.id] = npc;
        }

        // Update current location if set
        if (state.activeScene.location) {
          updatedSave.locations[state.activeScene.location.id] = state.activeScene.location;
          updatedSave.currentLocationId = state.activeScene.location.id;
        }

        set((s) => ({
          currentSaveFile: updatedSave,
          savedGames: s.savedGames.map((g) => (g.id === updatedSave.id ? updatedSave : g)),
          lastAutoSave: Date.now(),
        }));

        // Non-blocking server sync
        get().syncSaveToServer(updatedSave).catch((err) => {
          console.warn('[RPG] Server sync failed (save persisted locally):', err);
        });
      },

      syncSaveToServer: async (save) => {
        set({ serverSyncStatus: 'syncing' });
        try {
          const response = await fetch('/api/rpg/saves', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              session_id: save.id, // Use save ID as session reference
              name: save.name,
              description: `Level ${save.player.stats.level} - ${save.currentLocationId || 'Unknown'}`,
              snapshot: JSON.stringify(save),
              upsert: true, // Update existing save with same name
            }),
          });

          if (response.ok) {
            set({ serverSyncStatus: 'synced' });
            console.log('[RPG] Save synced to server:', save.name);
          } else {
            set({ serverSyncStatus: 'error' });
            console.warn('[RPG] Server sync response error:', response.status);
          }
        } catch {
          set({ serverSyncStatus: 'error' });
        }
      },

      loadSavesFromServer: async () => {
        try {
          const response = await fetch('/api/rpg/saves');
          if (!response.ok) return;

          const data = await response.json();
          if (!data.success || !data.saves) return;

          console.log(`[RPG] Found ${data.saves.length} saves on server`);
          // Server saves are available for loading via the API
          // The full snapshot is fetched on-demand via GET /api/rpg/saves/[saveId]
        } catch {
          // Silently fail — localStorage saves are still available
        }
      },

      deleteSave: (saveId) => {
        set((state) => ({
          savedGames: state.savedGames.filter((s) => s.id !== saveId),
          currentSaveFile: state.currentSaveFile?.id === saveId ? null : state.currentSaveFile,
        }));
      },

      exportSave: (saveId) => {
        const state = get();
        const save = state.savedGames.find((s) => s.id === saveId);
        return save ? JSON.stringify(save, null, 2) : '';
      },

      importSave: (jsonData) => {
        try {
          const save = JSON.parse(jsonData) as RPGSaveFile;
          if (!save.id || !save.player) return false;

          // Generate new UUID to avoid conflicts (API requires UUID format)
          save.id = crypto.randomUUID();
          save.lastPlayedAt = Date.now();

          set((state) => ({
            savedGames: [...state.savedGames, save],
          }));
          return true;
        } catch {
          return false;
        }
      },

      // Player Management
      updatePlayerStats: (changes) => {
        set((state) => {
          if (!state.currentSaveFile) return state;
          return {
            currentSaveFile: {
              ...state.currentSaveFile,
              player: {
                ...state.currentSaveFile.player,
                stats: { ...state.currentSaveFile.player.stats, ...changes },
              },
            },
          };
        });
      },

      applyDamage: (amount, source) => {
        const state = get();
        if (!state.currentSaveFile) return;

        const newHealth = Math.max(0, state.currentSaveFile.player.stats.health - amount);
        get().updatePlayerStats({ health: newHealth });
        get().showFloatingNumber(amount, 'damage');

        if (newHealth <= 0) {
          get().logStoryEvent({
            type: 'death',
            summary: `${state.currentSaveFile.player.name} fell in battle${source ? ` to ${source}` : ''}.`,
            fullText: `The world grows dark as ${state.currentSaveFile.player.name} collapses...`,
            locationId: state.activeScene.location?.id || 'unknown',
            locationName: state.activeScene.location?.name || 'Unknown',
            participants: source ? [source] : [],
            important: true,
          });
        }
      },

      applyHealing: (amount, source) => {
        const state = get();
        if (!state.currentSaveFile) return;

        const maxHealth = state.currentSaveFile.player.stats.maxHealth;
        const newHealth = Math.min(maxHealth, state.currentSaveFile.player.stats.health + amount);
        get().updatePlayerStats({ health: newHealth });
        get().showFloatingNumber(amount, 'heal');
      },

      addExperience: (amount) => {
        const state = get();
        if (!state.currentSaveFile) return;

        const stats = state.currentSaveFile.player.stats;
        let newXP = stats.experience + amount;
        let newLevel = stats.level;
        let xpToLevel = stats.experienceToLevel;

        // Check for level up
        while (newXP >= xpToLevel) {
          newXP -= xpToLevel;
          newLevel++;
          xpToLevel = calculateXPToLevel(newLevel);
        }

        get().updatePlayerStats({
          experience: newXP,
          level: newLevel,
          experienceToLevel: xpToLevel,
        });

        get().showFloatingNumber(amount, 'xp');

        if (newLevel > stats.level) {
          get().levelUp();
        }
      },

      levelUp: () => {
        const state = get();
        if (!state.currentSaveFile) return;

        const player = state.currentSaveFile.player;
        get().updatePlayerStats({
          maxHealth: player.stats.maxHealth + 10,
          health: player.stats.maxHealth + 10, // Full heal on level up
          maxMana: player.stats.maxMana + 5,
          mana: player.stats.maxMana + 5,
        });

        // Note: level was already incremented by addExperience() before calling levelUp()
        const currentLevel = get().currentSaveFile?.player.stats.level || player.stats.level;
        get().logStoryEvent({
          type: 'levelup',
          summary: `${player.name} reached level ${currentLevel}!`,
          fullText: `Through trials and tribulations, ${player.name} has grown stronger. Level ${currentLevel} achieved!`,
          locationId: state.activeScene.location?.id || 'unknown',
          locationName: state.activeScene.location?.name || 'Unknown',
          participants: [],
          important: true,
        });
      },

      addItem: (item) => {
        const itemId = generateId('item');
        set((state) => {
          if (!state.currentSaveFile) return state;

          // Check if stackable item already exists
          const existingIndex = state.currentSaveFile.player.inventory.findIndex(
            (i) => i.name === item.name && i.type === item.type && !i.equipped
          );

          let newInventory: InventoryItem[];
          if (existingIndex >= 0 && (item.type === 'consumable' || item.type === 'misc')) {
            // Stack with existing
            newInventory = [...state.currentSaveFile.player.inventory];
            newInventory[existingIndex] = {
              ...newInventory[existingIndex],
              quantity: newInventory[existingIndex].quantity + (item.quantity || 1),
            };
          } else {
            // Add new
            newInventory = [
              ...state.currentSaveFile.player.inventory,
              { ...item, id: itemId, equipped: false, quantity: item.quantity || 1 },
            ];
          }

          return {
            currentSaveFile: {
              ...state.currentSaveFile,
              player: {
                ...state.currentSaveFile.player,
                inventory: newInventory,
              },
            },
          };
        });
        return itemId;
      },

      removeItem: (itemId, quantity = 1) => {
        set((state) => {
          if (!state.currentSaveFile) return state;

          const itemIndex = state.currentSaveFile.player.inventory.findIndex((i) => i.id === itemId);
          if (itemIndex < 0) return state;

          const item = state.currentSaveFile.player.inventory[itemIndex];
          let newInventory: InventoryItem[];

          if (item.quantity <= quantity) {
            newInventory = state.currentSaveFile.player.inventory.filter((i) => i.id !== itemId);
          } else {
            newInventory = [...state.currentSaveFile.player.inventory];
            newInventory[itemIndex] = { ...item, quantity: item.quantity - quantity };
          }

          return {
            currentSaveFile: {
              ...state.currentSaveFile,
              player: {
                ...state.currentSaveFile.player,
                inventory: newInventory,
              },
            },
          };
        });
      },

      equipItem: (itemId) => {
        set((state) => {
          if (!state.currentSaveFile) return state;

          const item = state.currentSaveFile.player.inventory.find((i) => i.id === itemId);
          if (!item || item.type === 'consumable' || item.type === 'quest' || item.type === 'misc') return state;

          // Unequip any item of same type
          const newInventory = state.currentSaveFile.player.inventory.map((i) => {
            if (i.id === itemId) return { ...i, equipped: true };
            if (i.type === item.type && i.equipped) return { ...i, equipped: false };
            return i;
          });

          return {
            currentSaveFile: {
              ...state.currentSaveFile,
              player: {
                ...state.currentSaveFile.player,
                inventory: newInventory,
              },
            },
          };
        });
      },

      unequipItem: (itemId) => {
        set((state) => {
          if (!state.currentSaveFile) return state;

          return {
            currentSaveFile: {
              ...state.currentSaveFile,
              player: {
                ...state.currentSaveFile.player,
                inventory: state.currentSaveFile.player.inventory.map((i) =>
                  i.id === itemId ? { ...i, equipped: false } : i
                ),
              },
            },
          };
        });
      },

      useItem: (itemId) => {
        const state = get();
        if (!state.currentSaveFile) return;

        const item = state.currentSaveFile.player.inventory.find((i) => i.id === itemId);
        if (!item || item.type !== 'consumable') return;

        if (item.consumeEffect) {
          if (item.consumeEffect.healthRestore) {
            get().applyHealing(item.consumeEffect.healthRestore);
          }
          if (item.consumeEffect.manaRestore) {
            const newMana = Math.min(
              state.currentSaveFile.player.stats.maxMana,
              state.currentSaveFile.player.stats.mana + item.consumeEffect.manaRestore
            );
            get().updatePlayerStats({ mana: newMana });
          }
        }

        get().removeItem(itemId, 1);
      },

      addGold: (amount) => {
        set((state) => {
          if (!state.currentSaveFile) return state;
          return {
            currentSaveFile: {
              ...state.currentSaveFile,
              player: {
                ...state.currentSaveFile.player,
                gold: state.currentSaveFile.player.gold + amount,
              },
            },
          };
        });
        get().showFloatingNumber(amount, 'gold');
      },

      removeGold: (amount) => {
        const state = get();
        if (!state.currentSaveFile || state.currentSaveFile.player.gold < amount) return false;

        set((s) => ({
          currentSaveFile: {
            ...s.currentSaveFile!,
            player: {
              ...s.currentSaveFile!.player,
              gold: s.currentSaveFile!.player.gold - amount,
            },
          },
        }));
        return true;
      },

      addAbility: (ability) => {
        const abilityId = generateId('ability');
        set((state) => {
          if (!state.currentSaveFile) return state;
          return {
            currentSaveFile: {
              ...state.currentSaveFile,
              player: {
                ...state.currentSaveFile.player,
                abilities: [
                  ...state.currentSaveFile.player.abilities,
                  { ...ability, id: abilityId, currentCooldown: 0 },
                ],
              },
            },
          };
        });
        return abilityId;
      },

      addStatusEffect: (effect) => {
        const effectId = generateId('effect');
        set((state) => {
          if (!state.currentSaveFile) return state;
          return {
            currentSaveFile: {
              ...state.currentSaveFile,
              player: {
                ...state.currentSaveFile.player,
                statusEffects: [...state.currentSaveFile.player.statusEffects, { ...effect, id: effectId }],
              },
            },
          };
        });
        return effectId;
      },

      removeStatusEffect: (effectId) => {
        set((state) => {
          if (!state.currentSaveFile) return state;
          return {
            currentSaveFile: {
              ...state.currentSaveFile,
              player: {
                ...state.currentSaveFile.player,
                statusEffects: state.currentSaveFile.player.statusEffects.filter((e) => e.id !== effectId),
              },
            },
          };
        });
      },

      updatePlayerPortrait: (url) => {
        set((state) => {
          if (!state.currentSaveFile) return state;
          return {
            currentSaveFile: {
              ...state.currentSaveFile,
              player: { ...state.currentSaveFile.player, portraitUrl: url },
            },
          };
        });
      },

      updatePlayerVoice: (voiceId) => {
        set((state) => {
          if (!state.currentSaveFile) return state;
          return {
            currentSaveFile: {
              ...state.currentSaveFile,
              player: { ...state.currentSaveFile.player, voiceId },
            },
          };
        });
      },

      // Scene Management
      setScene: async (locationData, transition = 'fade') => {
        const locationId = generateId('loc');
        const location: GameLocation = {
          ...locationData,
          id: locationId,
          discovered: true,
          visitCount: 1,
          firstVisitedAt: Date.now(),
          lastVisitedAt: Date.now(),
        };

        // Use settings-based transition if available, fallback to parameter
        const settings = get().currentSaveFile?.settings;
        const effectiveTransition = settings?.sceneTransition || transition;

        // Clear old scene visuals before setting new location.
        // Keep backgroundUrl intact so the previous scene stays visible during crossfade.
        // Preserve locationImageCache and filigree (regenerated separately).
        set((state) => ({
          activeScene: {
            ...state.activeScene,
            location,
            // backgroundUrl preserved — crossfade happens when updateSceneBackground is called
            backgroundTransition: effectiveTransition,
            backgroundLoading: true,
            depthMapUrl: null,           // Clear old depth map
            depthMapLoading: false,
            sceneLighting: null,         // Will be reset by set_scene handler
            activeNPCs: [],              // Dismiss NPCs from previous scene
            currentSpeakerId: null,
            dialogueOptions: [],
            showingDialogueOptions: false,
            lastNarration: '',
          },
        }));

        // Background will be set separately via updateSceneBackground
      },

      updateSceneBackground: (url) => {
        set((state) => ({
          activeScene: {
            ...state.activeScene,
            backgroundUrl: url,
            backgroundLoading: false,
          },
        }));

        // Also update location in save
        const s = get();
        if (s.activeScene.location && s.currentSaveFile) {
          const updatedLocation = { ...s.activeScene.location, backgroundUrl: url };
          set((state) => ({
            currentSaveFile: {
              ...state.currentSaveFile!,
              locations: {
                ...state.currentSaveFile!.locations,
                [updatedLocation.id]: updatedLocation,
              },
            },
          }));
        }
      },

      setBackgroundLoading: (loading) => {
        set((state) => ({
          activeScene: { ...state.activeScene, backgroundLoading: loading },
        }));
      },

      updateSceneDepthMap: (url) => {
        set((state) => ({
          activeScene: { ...state.activeScene, depthMapUrl: url, depthMapLoading: false },
        }));
      },

      setDepthMapLoading: (loading) => {
        set((state) => ({
          activeScene: { ...state.activeScene, depthMapLoading: loading },
        }));
      },

      setSceneLighting: (lighting) => {
        set((state) => ({
          activeScene: { ...state.activeScene, sceneLighting: lighting },
        }));
      },

      cacheLocationImage: (locationName, backgroundUrl, depthMapUrl) => {
        const key = locationName.toLowerCase().trim();
        set((state) => ({
          activeScene: {
            ...state.activeScene,
            locationImageCache: {
              ...(state.activeScene.locationImageCache || {}),
              [key]: { backgroundUrl, depthMapUrl, generatedAt: Date.now() },
            },
          },
        }));
      },

      getCachedLocationImage: (locationName) => {
        const key = locationName.toLowerCase().trim();
        const cache = get().activeScene.locationImageCache;
        if (!cache) return null;
        const cached = cache[key];
        if (!cached) return null;
        // Cache is valid for 2 hours
        if (Date.now() - cached.generatedAt > 2 * 60 * 60 * 1000) return null;
        // Empty/missing URL means the cache was invalidated
        if (!cached.backgroundUrl) return null;
        return { backgroundUrl: cached.backgroundUrl, depthMapUrl: cached.depthMapUrl };
      },

      clearScene: () => {
        // Preserve location cache across scene changes
        const cache = get().activeScene.locationImageCache || {};
        set({ activeScene: { ...DEFAULT_ACTIVE_SCENE, locationImageCache: cache } });
      },

      // Filigree
      addFiligree: (element) => {
        const id = generateId('filigree');
        set((state) => ({
          activeScene: {
            ...state.activeScene,
            filigree: [...state.activeScene.filigree, { ...element, id }],
          },
        }));
        return id;
      },

      removeFiligree: (id) => {
        set((state) => ({
          activeScene: {
            ...state.activeScene,
            filigree: state.activeScene.filigree.filter((f) => f.id !== id),
          },
        }));
      },

      clearFiligree: () => {
        set((state) => ({
          activeScene: {
            ...state.activeScene,
            filigree: [],
            filigreeTheme: null,
          },
        }));
      },

      setFiligreeLoading: (loading) => {
        set((state) => ({
          activeScene: { ...state.activeScene, filigreeLoading: loading },
        }));
      },

      setFiligreeTheme: (theme) => {
        set((state) => ({
          activeScene: { ...state.activeScene, filigreeTheme: theme },
        }));
      },

      // NPC Management
      showNPC: (npcData) => {
        const npcId = generateId('npc');
        const npc: NPCharacter = {
          ...npcData,
          id: npcId,
          isVisible: true,
          isSpeaking: false,
          dialogueHistory: [],
        };

        set((state) => ({
          activeScene: {
            ...state.activeScene,
            activeNPCs: [...state.activeScene.activeNPCs, npc],
          },
        }));

        // Add to save file NPCs
        const s = get();
        if (s.currentSaveFile) {
          set((state) => ({
            currentSaveFile: {
              ...state.currentSaveFile!,
              npcs: { ...state.currentSaveFile!.npcs, [npcId]: npc },
            },
          }));
        }

        return npcId;
      },

      dismissNPC: (npcId) => {
        set((state) => ({
          activeScene: {
            ...state.activeScene,
            activeNPCs: state.activeScene.activeNPCs.map((npc) =>
              npc.id === npcId ? { ...npc, isVisible: false } : npc
            ),
            currentSpeakerId: state.activeScene.currentSpeakerId === npcId ? null : state.activeScene.currentSpeakerId,
          },
        }));

        // Remove from active after animation
        setTimeout(() => {
          set((state) => ({
            activeScene: {
              ...state.activeScene,
              activeNPCs: state.activeScene.activeNPCs.filter((npc) => npc.id !== npcId),
            },
          }));
        }, 500);
      },

      dismissAllNPCs: () => {
        set((state) => ({
          activeScene: {
            ...state.activeScene,
            activeNPCs: [],
            currentSpeakerId: null,
          },
        }));
      },

      npcSpeak: (npcId, dialogue, emotion) => {
        set((state) => {
          const npcIndex = state.activeScene.activeNPCs.findIndex((n) => n.id === npcId);
          if (npcIndex < 0) return state;

          const npc = state.activeScene.activeNPCs[npcIndex];
          const dialogueLine: DialogueLine = {
            speaker: npc.name,
            text: dialogue,
            timestamp: Date.now(),
            emotion,
          };

          const updatedNPCs = [...state.activeScene.activeNPCs];
          updatedNPCs[npcIndex] = {
            ...npc,
            isSpeaking: true,
            currentDialogue: dialogue,
            dialogueHistory: [...npc.dialogueHistory, dialogueLine],
          };

          // Stop other NPCs from speaking
          updatedNPCs.forEach((n, i) => {
            if (i !== npcIndex) updatedNPCs[i] = { ...n, isSpeaking: false };
          });

          return {
            activeScene: {
              ...state.activeScene,
              activeNPCs: updatedNPCs,
              currentSpeakerId: npcId,
            },
          };
        });
      },

      stopNPCSpeaking: (npcId) => {
        set((state) => ({
          activeScene: {
            ...state.activeScene,
            activeNPCs: state.activeScene.activeNPCs.map((npc) =>
              npc.id === npcId ? { ...npc, isSpeaking: false, currentDialogue: undefined } : npc
            ),
            currentSpeakerId: state.activeScene.currentSpeakerId === npcId ? null : state.activeScene.currentSpeakerId,
          },
        }));
      },

      updateNPCRelationship: (npcId, change) => {
        set((state) => ({
          activeScene: {
            ...state.activeScene,
            activeNPCs: state.activeScene.activeNPCs.map((npc) =>
              npc.id === npcId
                ? { ...npc, relationship: Math.max(-100, Math.min(100, npc.relationship + change)) }
                : npc
            ),
          },
        }));
      },

      updateNPCPosition: (npcId, position) => {
        set((state) => ({
          activeScene: {
            ...state.activeScene,
            activeNPCs: state.activeScene.activeNPCs.map((npc) =>
              npc.id === npcId ? { ...npc, position } : npc
            ),
          },
        }));
      },

      updateNPCPortrait: (npcId, url) => {
        set((state) => ({
          activeScene: {
            ...state.activeScene,
            activeNPCs: state.activeScene.activeNPCs.map((npc) =>
              npc.id === npcId ? { ...npc, portraitUrl: url } : npc
            ),
          },
        }));
      },

      updateNPCBgRemoved: (npcId, url) => {
        set((state) => ({
          activeScene: {
            ...state.activeScene,
            activeNPCs: state.activeScene.activeNPCs.map((npc) =>
              npc.id === npcId ? { ...npc, portraitBgRemovedUrl: url } : npc
            ),
          },
        }));
      },

      updateNPCDepthMap: (npcId, url) => {
        set((state) => ({
          activeScene: {
            ...state.activeScene,
            activeNPCs: state.activeScene.activeNPCs.map((npc) =>
              npc.id === npcId ? { ...npc, portraitDepthUrl: url } : npc
            ),
          },
        }));
      },

      updateNPCDisplaySize: (npcId, size) => {
        set((state) => ({
          activeScene: {
            ...state.activeScene,
            activeNPCs: state.activeScene.activeNPCs.map((npc) =>
              npc.id === npcId ? { ...npc, displaySize: size } : npc
            ),
          },
        }));
      },

      // Character Creator (voice-driven)
      characterCreatorStep: null,
      characterCreatorData: {},

      advanceCharacterCreation: (answer) => {
        const step = get().characterCreatorStep;
        const data = { ...get().characterCreatorData };

        if (step === 0) data.name = answer;
        else if (step === 1) data.race = answer;
        else if (step === 2) data.class = answer;
        else if (step === 3) data.backstory = answer;

        const nextStep = (step ?? -1) + 1;
        set({
          characterCreatorStep: nextStep > 3 ? null : nextStep,
          characterCreatorData: data,
        });

        // If creation is complete (step > 3), open the full creator with pre-filled data
        if (nextStep > 3) {
          set({ characterCreatorOpen: true });
        }
      },

      getCharacterCreatorPrompt: () => {
        const step = get().characterCreatorStep;
        const prompts = [
          'What is your name, adventurer?',
          'What race are you? Human, elf, dwarf, or something else?',
          'What is your class? Warrior, mage, rogue, or another path?',
          'Tell me about your backstory. What brought you here?',
        ];
        return prompts[step ?? 0] || '';
      },

      resetCharacterCreator: () => {
        set({ characterCreatorStep: null, characterCreatorData: {} });
      },

      // Dialogue
      showDialogueOptions: (options) => {
        set((state) => ({
          activeScene: {
            ...state.activeScene,
            dialogueOptions: options,
            showingDialogueOptions: true,
          },
        }));
      },

      hideDialogueOptions: () => {
        set((state) => ({
          activeScene: {
            ...state.activeScene,
            dialogueOptions: [],
            showingDialogueOptions: false,
          },
        }));
      },

      selectDialogueOption: (optionId) => {
        const state = get();
        const option = state.activeScene.dialogueOptions.find((o) => o.id === optionId);
        get().hideDialogueOptions();
        return option || null;
      },

      // Quests
      addQuest: (questData) => {
        const questId = generateId('quest');
        const quest: Quest = {
          ...questData,
          id: questId,
          status: 'active',
          startedAt: Date.now(),
        };

        set((state) => {
          if (!state.currentSaveFile) return state;
          return {
            currentSaveFile: {
              ...state.currentSaveFile,
              quests: [...state.currentSaveFile.quests, quest],
            },
          };
        });

        get().logStoryEvent({
          type: 'quest',
          summary: `New quest: ${quest.name}`,
          fullText: `Quest accepted: ${quest.name}. ${quest.description}`,
          locationId: get().activeScene.location?.id || 'unknown',
          locationName: get().activeScene.location?.name || 'Unknown',
          participants: quest.giverId ? [quest.giverId] : [],
          important: true,
        });

        return questId;
      },

      updateQuestStatus: (questId, status) => {
        set((state) => {
          if (!state.currentSaveFile) return state;
          return {
            currentSaveFile: {
              ...state.currentSaveFile,
              quests: state.currentSaveFile.quests.map((q) =>
                q.id === questId
                  ? {
                      ...q,
                      status,
                      completedAt: status === 'completed' ? Date.now() : q.completedAt,
                      failedAt: status === 'failed' ? Date.now() : q.failedAt,
                    }
                  : q
              ),
            },
          };
        });
      },

      updateQuestObjective: (questId, objectiveId, progress) => {
        set((state) => {
          if (!state.currentSaveFile) return state;
          return {
            currentSaveFile: {
              ...state.currentSaveFile,
              quests: state.currentSaveFile.quests.map((q) => {
                if (q.id !== questId) return q;
                return {
                  ...q,
                  objectives: q.objectives.map((o) => {
                    if (o.id !== objectiveId) return o;
                    const newProgress = Math.min(o.required, o.current + progress);
                    return {
                      ...o,
                      current: newProgress,
                      completed: newProgress >= o.required,
                    };
                  }),
                };
              }),
            },
          };
        });
      },

      completeQuest: (questId) => {
        const state = get();
        const quest = state.currentSaveFile?.quests.find((q) => q.id === questId);
        if (!quest) return;

        get().updateQuestStatus(questId, 'completed');

        // Apply rewards
        for (const reward of quest.rewards) {
          switch (reward.type) {
            case 'gold':
              if (reward.amount) get().addGold(reward.amount);
              break;
            case 'experience':
              if (reward.amount) get().addExperience(reward.amount);
              break;
            case 'item':
              // Item would need to be defined elsewhere
              break;
          }
        }

        get().logStoryEvent({
          type: 'quest',
          summary: `Quest completed: ${quest.name}`,
          fullText: `The quest "${quest.name}" has been completed!`,
          locationId: state.activeScene.location?.id || 'unknown',
          locationName: state.activeScene.location?.name || 'Unknown',
          participants: [],
          important: true,
        });
      },

      failQuest: (questId) => {
        const state = get();
        const quest = state.currentSaveFile?.quests.find((q) => q.id === questId);
        if (!quest) return;

        get().updateQuestStatus(questId, 'failed');

        get().logStoryEvent({
          type: 'quest',
          summary: `Quest failed: ${quest.name}`,
          fullText: `The quest "${quest.name}" has been failed.`,
          locationId: state.activeScene.location?.id || 'unknown',
          locationName: state.activeScene.location?.name || 'Unknown',
          participants: [],
          important: true,
        });
      },

      // Story Events
      logStoryEvent: (eventData) => {
        const eventId = generateId('event');
        const event: StoryEvent = {
          ...eventData,
          id: eventId,
          timestamp: Date.now(),
        };

        set((state) => {
          if (!state.currentSaveFile) return state;
          return {
            currentSaveFile: {
              ...state.currentSaveFile,
              storyEvents: [...state.currentSaveFile.storyEvents, event],
            },
          };
        });

        return eventId;
      },

      // Combat
      startCombat: (enemies) => {
        const state = get();
        if (!state.currentSaveFile) return;

        const player = state.currentSaveFile.player;
        const playerParticipant: CombatParticipant = {
          id: player.id,
          name: player.name,
          isPlayer: true,
          isNPC: false,
          health: player.stats.health,
          maxHealth: player.stats.maxHealth,
          initiative: rollDiceValue('1d20') + Math.floor((player.stats.dexterity - 10) / 2),
          statusEffects: [...player.statusEffects],
          portraitUrl: player.portraitUrl,
        };

        const allParticipants = [playerParticipant, ...enemies];
        allParticipants.sort((a, b) => b.initiative - a.initiative);

        set({
          combatState: {
            active: true,
            round: 1,
            turnOrder: allParticipants.map((p) => p.id),
            currentTurnIndex: 0,
            participants: allParticipants,
            actionLog: [],
          },
        });

        get().logStoryEvent({
          type: 'combat',
          summary: `Combat began with ${enemies.map((e) => e.name).join(', ')}`,
          fullText: `A battle has begun!`,
          locationId: state.activeScene.location?.id || 'unknown',
          locationName: state.activeScene.location?.name || 'Unknown',
          participants: enemies.map((e) => e.id),
          important: false,
        });
      },

      endCombat: (playerVictory) => {
        const state = get();
        if (!state.combatState) return;

        set((s) => ({
          combatState: { ...s.combatState!, active: false, playerVictory },
        }));

        get().logStoryEvent({
          type: 'combat',
          summary: playerVictory ? 'Victory!' : 'Defeat...',
          fullText: playerVictory
            ? 'The battle is won!'
            : 'The battle was lost...',
          locationId: state.activeScene.location?.id || 'unknown',
          locationName: state.activeScene.location?.name || 'Unknown',
          participants: state.combatState.participants.filter((p) => !p.isPlayer).map((p) => p.id),
          outcome: playerVictory ? 'victory' : 'defeat',
          important: true,
        });

        // Clear combat state after a delay
        setTimeout(() => {
          set({ combatState: null });
        }, 2000);
      },

      nextCombatTurn: () => {
        set((state) => {
          if (!state.combatState) return state;

          let nextIndex = state.combatState.currentTurnIndex + 1;
          let newRound = state.combatState.round;

          if (nextIndex >= state.combatState.turnOrder.length) {
            nextIndex = 0;
            newRound++;
          }

          return {
            combatState: {
              ...state.combatState,
              currentTurnIndex: nextIndex,
              round: newRound,
            },
          };
        });
      },

      logCombatAction: (action) => {
        set((state) => {
          if (!state.combatState) return state;
          return {
            combatState: {
              ...state.combatState,
              actionLog: [...state.combatState.actionLog, action],
            },
          };
        });
      },

      // Dice Rolls
      rollDice: async (dice, purpose, dc) => {
        const result = rollDiceValue(dice);
        const success = dc !== undefined ? result >= dc : true;

        set({
          diceRoll: {
            active: true,
            dice,
            purpose,
            result: null,
            success: null,
            dc,
          },
        });

        // Animate the roll
        await new Promise((resolve) => setTimeout(resolve, 1500));

        set({
          diceRoll: {
            active: true,
            dice,
            purpose,
            result,
            success,
            dc,
          },
        });

        // Clear after display
        setTimeout(() => {
          get().clearDiceRoll();
        }, 3000);

        return { result, success };
      },

      clearDiceRoll: () => {
        set({ diceRoll: null });
      },

      // Floating Numbers
      showFloatingNumber: (value, type, x = 50, y = 50) => {
        const id = generateId('float');
        set((state) => ({
          floatingNumbers: [
            ...state.floatingNumbers,
            { id, value, type, x, y, timestamp: Date.now() },
          ],
        }));

        // Auto-remove after animation
        setTimeout(() => {
          set((state) => ({
            floatingNumbers: state.floatingNumbers.filter((n) => n.id !== id),
          }));
        }, 2000);
      },

      clearFloatingNumbers: () => {
        set({ floatingNumbers: [] });
      },

      // Global Flags
      setFlag: (key, value) => {
        set((state) => {
          if (!state.currentSaveFile) return state;
          return {
            currentSaveFile: {
              ...state.currentSaveFile,
              globalFlags: { ...state.currentSaveFile.globalFlags, [key]: value },
            },
          };
        });
      },

      getFlag: (key) => {
        const state = get();
        return state.currentSaveFile?.globalFlags[key];
      },

      // UI Controls
      toggleHUD: () => set((state) => ({ hudVisible: !state.hudVisible })),
      setHUDVisible: (visible) => set({ hudVisible: visible }),
      toggleInventory: () => set((state) => ({
        inventoryOpen: !state.inventoryOpen,
        questLogOpen: false, saveFileViewerOpen: false, characterSheetOpen: false, settingsOpen: false,
      })),
      toggleQuestLog: () => set((state) => ({
        questLogOpen: !state.questLogOpen,
        inventoryOpen: false, saveFileViewerOpen: false, characterSheetOpen: false, settingsOpen: false,
      })),
      toggleSaveFileViewer: () => set((state) => ({
        saveFileViewerOpen: !state.saveFileViewerOpen,
        inventoryOpen: false, questLogOpen: false, characterSheetOpen: false, settingsOpen: false,
      })),
      toggleCharacterSheet: () => set((state) => ({
        characterSheetOpen: !state.characterSheetOpen,
        inventoryOpen: false, questLogOpen: false, saveFileViewerOpen: false, settingsOpen: false,
      })),
      toggleCharacterCreator: () => set((state) => ({ characterCreatorOpen: !state.characterCreatorOpen })),
      toggleSettings: () => set((state) => ({
        settingsOpen: !state.settingsOpen,
        inventoryOpen: false, questLogOpen: false, saveFileViewerOpen: false, characterSheetOpen: false,
      })),
      setNotebookTab: (tab) => set({ notebookTab: tab }),
      closeAllPanels: () =>
        set({
          inventoryOpen: false,
          questLogOpen: false,
          saveFileViewerOpen: false,
          characterSheetOpen: false,
          characterCreatorOpen: false,
          settingsOpen: false,
          sceneInspectorOpen: false,
        }),

      // Scene Inspector & Scene Type
      toggleSceneInspector: () => set((state) => ({ sceneInspectorOpen: !state.sceneInspectorOpen })),
      setSceneType: (sceneType) => {
        set((state) => ({
          activeScene: { ...state.activeScene, sceneType },
        }));
      },
      setCameraConfig: (config) => {
        set((state) => ({
          activeScene: { ...state.activeScene, cameraConfig: config },
        }));
      },

      // Settings
      updateSettings: (settings) => {
        set((state) => {
          if (!state.currentSaveFile) return state;
          return {
            currentSaveFile: {
              ...state.currentSaveFile,
              settings: { ...state.currentSaveFile.settings, ...settings },
            },
          };
        });
      },

      // World Simulation
      tickGameClock: () => {
        const save = get().currentSaveFile;
        if (!save) return null;
        const clock = new GameClock(save.gameTime);
        const newTime = clock.tick();
        set((state) => ({
          currentSaveFile: state.currentSaveFile ? {
            ...state.currentSaveFile,
            gameTime: newTime,
          } : null,
        }));
        return newTime;
      },

      advanceGameTime: (minutes) => {
        const save = get().currentSaveFile;
        if (!save) return;
        const clock = new GameClock(save.gameTime);
        clock.advanceMinutes(minutes);
        set((state) => ({
          currentSaveFile: state.currentSaveFile ? {
            ...state.currentSaveFile,
            gameTime: clock.getTime(),
          } : null,
        }));
      },

      getGameTime: () => {
        return get().currentSaveFile?.gameTime || null;
      },

      setGameTime: (time) => {
        set((state) => ({
          currentSaveFile: state.currentSaveFile ? {
            ...state.currentSaveFile,
            gameTime: time,
          } : null,
        }));
      },

      getNPCMemory: (npcId) => {
        const save = get().currentSaveFile;
        return save?.npcMemories?.[npcId] || null;
      },

      updateNPCMemory: (npcId, updater) => {
        set((state) => {
          if (!state.currentSaveFile) return state;
          const npcName = state.currentSaveFile.npcs[npcId]?.name || npcId;
          const existing = state.currentSaveFile.npcMemories?.[npcId] || createNPCMemoryState(npcId, npcName);
          return {
            currentSaveFile: {
              ...state.currentSaveFile,
              npcMemories: {
                ...state.currentSaveFile.npcMemories,
                [npcId]: updater(existing),
              },
            },
          };
        });
      },

      getLocationState: (locationId) => {
        const save = get().currentSaveFile;
        return save?.locationStates?.[locationId] || null;
      },

      updateLocationState: (locationId, updater) => {
        set((state) => {
          if (!state.currentSaveFile) return state;
          const locName = state.currentSaveFile.locations[locationId]?.name || locationId;
          const existing = state.currentSaveFile.locationStates?.[locationId] || createLocationState(locationId, locName);
          return {
            currentSaveFile: {
              ...state.currentSaveFile,
              locationStates: {
                ...state.currentSaveFile.locationStates,
                [locationId]: updater(existing),
              },
            },
          };
        });
      },

      // Reset
      resetRPGState: () => set(DEFAULT_RPG_STATE),
    }),
    {
      name: 'voice31-rpg-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Persist save games
        savedGames: state.savedGames,
        rpgModeInitialized: state.rpgModeInitialized,
        // Persist current session state
        currentSaveFile: state.currentSaveFile,
        // rpgModeActive intentionally NOT persisted — user must explicitly enter RPG mode each session
        // Persist active scene for session continuity (excluding transient states)
        activeScene: state.currentSaveFile ? {
          location: state.activeScene.location,
          backgroundUrl: state.activeScene.backgroundUrl,
          backgroundTransition: 'none' as const,
          backgroundLoading: false,
          depthMapUrl: state.activeScene.depthMapUrl,
          depthMapLoading: false,
          sceneLighting: state.activeScene.sceneLighting,
          sceneType: state.activeScene.sceneType,
          cameraConfig: state.activeScene.cameraConfig,
          activeNPCs: [],              // NPCs are transient — repopulated by AI each session
          currentSpeakerId: null,
          dialogueOptions: [],
          showingDialogueOptions: false,
          lastNarration: state.activeScene.lastNarration,
          filigree: state.activeScene.filigree,
          filigreeLoading: false,
          filigreeTheme: state.activeScene.filigreeTheme,
        } : state.activeScene,
        // Persist UI state
        hudVisible: state.hudVisible,
      }),
      // Restore session state
      onRehydrateStorage: () => (state) => {
        if (state) {
          console.log('[RPG Store] Rehydrated state:', {
            hasCurrentSave: !!state.currentSaveFile,
            rpgModeActive: state.rpgModeActive,
            savedGamesCount: state.savedGames?.length || 0,
          });
        }
      },
    }
  )
);

// =============================================================================
// NPC VOICE LIBRARY
// =============================================================================

export interface VoiceProfile {
  id: string;
  voiceId: string;
  name: string;
  description: string;
  gender: 'male' | 'female' | 'neutral';
  archetype: string;
}

export const NPC_VOICE_LIBRARY: VoiceProfile[] = [
  // Male Voices
  { id: 'gruff_warrior', voiceId: 'pNInz6obpgDQGcFmaJgB', name: 'Gruff Warrior', description: 'Deep, battle-worn', gender: 'male', archetype: 'warrior' },
  { id: 'wise_elder', voiceId: 'VR6AewLTigWG4xSOukaG', name: 'Wise Elder', description: 'Aged, sagely', gender: 'male', archetype: 'sage' },
  { id: 'young_hero', voiceId: 'TxGEqnHWrfWFTfGW9XjX', name: 'Young Hero', description: 'Energetic, brave', gender: 'male', archetype: 'hero' },
  { id: 'sinister_villain', voiceId: 'yoZ06aMxZJJ28mfd3POQ', name: 'Sinister Villain', description: 'Menacing, cold', gender: 'male', archetype: 'villain' },
  { id: 'jolly_merchant', voiceId: 'jBpfuIE2acCO8z3wKNLl', name: 'Jolly Merchant', description: 'Cheerful, persuasive', gender: 'male', archetype: 'merchant' },
  { id: 'mysterious_mage', voiceId: 'onwK4e9ZLuTAKqWW03F9', name: 'Mysterious Mage', description: 'Ethereal, knowing', gender: 'male', archetype: 'mage' },

  // Female Voices
  { id: 'noble_queen', voiceId: 'EXAVITQu4vr4xnSDxMaL', name: 'Noble Queen', description: 'Regal, commanding', gender: 'female', archetype: 'royalty' },
  { id: 'fierce_warrior', voiceId: 'XB0fDUnXU5powFXDhCwa', name: 'Fierce Warrior', description: 'Strong, determined', gender: 'female', archetype: 'warrior' },
  { id: 'forest_spirit', voiceId: 'pFZP5JQG7iQjIQuC4Bku', name: 'Forest Spirit', description: 'Whimsical, nature-like', gender: 'female', archetype: 'spirit' },
  { id: 'cunning_rogue', voiceId: 'jsCqWAovK2LkecY7zXl4', name: 'Cunning Rogue', description: 'Sly, quick-witted', gender: 'female', archetype: 'rogue' },
  { id: 'gentle_healer', voiceId: 'oWAxZDx7w5VEj9dCyTzz', name: 'Gentle Healer', description: 'Warm, compassionate', gender: 'female', archetype: 'healer' },
  { id: 'dark_sorceress', voiceId: 'XrExE9yKIg1WjnnlVkGX', name: 'Dark Sorceress', description: 'Seductive, dangerous', gender: 'female', archetype: 'villain' },

  // Creature Voices
  { id: 'goblin', voiceId: 'SOYHLrjzK2X1ezoPC6cr', name: 'Goblin', description: 'Scratchy, mischievous', gender: 'neutral', archetype: 'creature' },
  { id: 'dragon', voiceId: 'N2lVS1w4EtoT3dr4eOWO', name: 'Dragon', description: 'Booming, ancient', gender: 'neutral', archetype: 'creature' },
  { id: 'fairy', voiceId: 'MF3mGyEYCl7XYWbV9V6O', name: 'Fairy', description: 'Tiny, musical', gender: 'neutral', archetype: 'spirit' },
];

export const getVoiceById = (id: string): VoiceProfile | undefined => {
  return NPC_VOICE_LIBRARY.find((v) => v.id === id);
};

export const getVoicesByArchetype = (archetype: string): VoiceProfile[] => {
  return NPC_VOICE_LIBRARY.filter((v) => v.archetype === archetype);
};

export const getVoicesByGender = (gender: 'male' | 'female' | 'neutral'): VoiceProfile[] => {
  return NPC_VOICE_LIBRARY.filter((v) => v.gender === gender);
};
