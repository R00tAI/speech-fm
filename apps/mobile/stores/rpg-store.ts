/**
 * RPG Store
 * Ported from Voice31RPGStore.ts - localStorage persist → AsyncStorage
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { EffectType } from './voice-store';

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
  health: 100, maxHealth: 100, mana: 50, maxMana: 50,
  strength: 10, dexterity: 10, intelligence: 10,
  wisdom: 10, charisma: 10, constitution: 10,
  level: 1, experience: 0, experienceToLevel: 100,
};

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
  value: number;
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
  stats: CharacterStats;
  inventory: InventoryItem[];
  gold: number;
  createdAt: number;
}

// =============================================================================
// NPC
// =============================================================================

export type NPCPosition = 'left' | 'right' | 'center';

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
  voiceId: string;
  voiceName?: string;
  relationship: number; // -100 to 100
  isVisible: boolean;
  position: NPCPosition;
  isSpeaking: boolean;
  currentDialogue?: string;
  dialogueHistory: DialogueLine[];
}

// =============================================================================
// QUEST SYSTEM
// =============================================================================

export interface QuestObjective {
  id: string;
  description: string;
  completed: boolean;
  progress: number;
  total: number;
}

export interface Quest {
  id: string;
  name: string;
  description: string;
  giverName?: string;
  status: 'active' | 'completed' | 'failed';
  objectives: QuestObjective[];
  rewards: { type: string; amount: number }[];
  acceptedAt: number;
}

// =============================================================================
// DIALOGUE OPTIONS
// =============================================================================

export interface DialogueOption {
  id: string;
  text: string;
  icon?: string;
  disabled?: boolean;
  consequences?: string;
}

// =============================================================================
// STORY EVENTS
// =============================================================================

export interface StoryEvent {
  id: string;
  type: 'dialogue' | 'combat' | 'exploration' | 'quest' | 'death' | 'relationship' | 'secret' | 'discovery';
  summary: string;
  fullText: string;
  important: boolean;
  timestamp: number;
  location?: string;
}

// =============================================================================
// SAVE SYSTEM
// =============================================================================

export interface RPGSaveFile {
  id: string;
  name: string;
  playerCharacter: PlayerCharacter;
  quests: Quest[];
  storyLog: StoryEvent[];
  flags: Record<string, string | number | boolean>;
  savedAt: number;
  playTime: number;
}

// =============================================================================
// VOICE LIBRARY
// =============================================================================

export interface VoiceProfile {
  id: string;
  name: string;
  voiceId: string;
  gender: 'male' | 'female' | 'neutral';
  race: string;
  personality: string[];
}

export const NPC_VOICE_LIBRARY: VoiceProfile[] = [
  { id: 'wise_elder', name: 'Wise Elder', voiceId: 'pNInz6obpgDQGcFmaJgB', gender: 'male', race: 'human', personality: ['wise', 'calm'] },
  { id: 'young_warrior', name: 'Young Warrior', voiceId: 'ErXwobaYiN019PkySvjV', gender: 'male', race: 'human', personality: ['brave', 'impulsive'] },
  { id: 'mysterious_mage', name: 'Mysterious Mage', voiceId: 'VR6AewLTigWG4xSOukaG', gender: 'female', race: 'elf', personality: ['mysterious', 'intelligent'] },
  { id: 'tavern_keeper', name: 'Tavern Keeper', voiceId: 'yoZ06aMxZJJ28mfd3POQ', gender: 'female', race: 'dwarf', personality: ['friendly', 'gossip'] },
  { id: 'rogue', name: 'Rogue', voiceId: 'EXAVITQu4vr4xnSDxMaL', gender: 'female', race: 'halfling', personality: ['cunning', 'charming'] },
  { id: 'villain', name: 'Villain', voiceId: 'N2lVS1w4EtoT3dr4eOWO', gender: 'male', race: 'tiefling', personality: ['menacing', 'eloquent'] },
  { id: 'merchant', name: 'Merchant', voiceId: 'IKne3meq5aSn9XLyUdCD', gender: 'male', race: 'human', personality: ['greedy', 'persuasive'] },
  { id: 'healer', name: 'Healer', voiceId: 'XB0fDUnXU5powFXDhCwa', gender: 'female', race: 'elf', personality: ['gentle', 'nurturing'] },
];

// =============================================================================
// ACTIVE SCENE
// =============================================================================

export interface ActiveScene {
  locationName: string;
  backgroundUrl?: string;
  backgroundPrompt?: string;
  ambientEffect?: EffectType;
  activeNPCs: NPCharacter[];
  narrationText?: string;
  dialogueOptions: DialogueOption[];
  showingDialogueOptions: boolean;
}

const DEFAULT_SCENE: ActiveScene = {
  locationName: '',
  activeNPCs: [],
  dialogueOptions: [],
  showingDialogueOptions: false,
};

// =============================================================================
// STORE STATE
// =============================================================================

interface RPGState {
  rpgModeActive: boolean;
  playerCharacter: PlayerCharacter | null;
  quests: Quest[];
  storyLog: StoryEvent[];
  activeScene: ActiveScene;
  flags: Record<string, string | number | boolean>;
  savedGames: RPGSaveFile[];
  showCharacterCreator: boolean;
  characterCreatorStep: number | null;
  sidebarVisible: boolean;
  sidebarTab: 'inventory' | 'quests' | 'journal' | 'map';
}

interface RPGActions {
  enableRPGMode: () => void;
  disableRPGMode: () => void;
  setPlayerCharacter: (character: PlayerCharacter) => void;
  updatePlayerStats: (updates: Partial<CharacterStats>) => void;
  addItem: (item: InventoryItem) => void;
  removeItem: (itemId: string) => void;
  updateGold: (amount: number) => void;
  addQuest: (quest: Quest) => void;
  updateQuest: (questId: string, updates: Partial<Quest>) => void;
  addStoryEvent: (event: Omit<StoryEvent, 'id' | 'timestamp'>) => void;
  setScene: (scene: Partial<ActiveScene>) => void;
  addNPC: (npc: NPCharacter) => void;
  removeNPC: (npcId: string) => void;
  removeAllNPCs: () => void;
  updateNPCRelationship: (npcId: string, change: number) => void;
  setNPCSpeaking: (npcId: string, dialogue: string, emotion?: string) => void;
  stopNPCSpeaking: (npcId: string) => void;
  showDialogueOptions: (options: DialogueOption[], prompt?: string) => void;
  selectDialogueOption: (optionId: string) => void;
  hideDialogueOptions: () => void;
  setFlag: (key: string, value: string | number | boolean) => void;
  getFlag: (key: string) => string | number | boolean | undefined;
  saveGame: (name?: string) => void;
  loadGame: (saveId: string) => void;
  setShowCharacterCreator: (show: boolean) => void;
  advanceCharacterCreation: (input: string) => void;
  toggleSidebar: () => void;
  setSidebarTab: (tab: RPGState['sidebarTab']) => void;
  setNarration: (text: string) => void;
  reset: () => void;
}

export type RPGStore = RPGState & RPGActions;

// =============================================================================
// DEFAULT STATE
// =============================================================================

const DEFAULT_STATE: RPGState = {
  rpgModeActive: false,
  playerCharacter: null,
  quests: [],
  storyLog: [],
  activeScene: { ...DEFAULT_SCENE },
  flags: {},
  savedGames: [],
  showCharacterCreator: false,
  characterCreatorStep: null,
  sidebarVisible: false,
  sidebarTab: 'inventory',
};

// =============================================================================
// STORE
// =============================================================================

export const useRPGStore = create<RPGStore>()(
  persist(
    (set, get) => ({
      ...DEFAULT_STATE,

      enableRPGMode: () => set({ rpgModeActive: true }),
      disableRPGMode: () => set({ rpgModeActive: false }),

      setPlayerCharacter: (character) => set({ playerCharacter: character }),

      updatePlayerStats: (updates) => set((state) => {
        if (!state.playerCharacter) return {};
        return {
          playerCharacter: {
            ...state.playerCharacter,
            stats: { ...state.playerCharacter.stats, ...updates },
          },
        };
      }),

      addItem: (item) => set((state) => {
        if (!state.playerCharacter) return {};
        const existing = state.playerCharacter.inventory.find(i => i.id === item.id);
        if (existing) {
          return {
            playerCharacter: {
              ...state.playerCharacter,
              inventory: state.playerCharacter.inventory.map(i =>
                i.id === item.id ? { ...i, quantity: i.quantity + (item.quantity || 1) } : i
              ),
            },
          };
        }
        return {
          playerCharacter: {
            ...state.playerCharacter,
            inventory: [...state.playerCharacter.inventory, item],
          },
        };
      }),

      removeItem: (itemId) => set((state) => {
        if (!state.playerCharacter) return {};
        return {
          playerCharacter: {
            ...state.playerCharacter,
            inventory: state.playerCharacter.inventory.filter(i => i.id !== itemId),
          },
        };
      }),

      updateGold: (amount) => set((state) => {
        if (!state.playerCharacter) return {};
        return {
          playerCharacter: {
            ...state.playerCharacter,
            gold: Math.max(0, state.playerCharacter.gold + amount),
          },
        };
      }),

      addQuest: (quest) => set((state) => ({
        quests: [...state.quests, quest],
      })),

      updateQuest: (questId, updates) => set((state) => ({
        quests: state.quests.map(q => q.id === questId ? { ...q, ...updates } : q),
      })),

      addStoryEvent: (event) => set((state) => ({
        storyLog: [...state.storyLog, {
          ...event,
          id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          timestamp: Date.now(),
        }],
      })),

      setScene: (scene) => set((state) => ({
        activeScene: { ...state.activeScene, ...scene },
      })),

      addNPC: (npc) => set((state) => {
        const existing = state.activeScene.activeNPCs.find(n => n.id === npc.id);
        if (existing) {
          return {
            activeScene: {
              ...state.activeScene,
              activeNPCs: state.activeScene.activeNPCs.map(n =>
                n.id === npc.id ? { ...n, ...npc, isVisible: true } : n
              ),
            },
          };
        }
        return {
          activeScene: {
            ...state.activeScene,
            activeNPCs: [...state.activeScene.activeNPCs, { ...npc, isVisible: true }],
          },
        };
      }),

      removeNPC: (npcId) => set((state) => ({
        activeScene: {
          ...state.activeScene,
          activeNPCs: state.activeScene.activeNPCs.filter(n => n.id !== npcId),
        },
      })),

      removeAllNPCs: () => set((state) => ({
        activeScene: { ...state.activeScene, activeNPCs: [] },
      })),

      updateNPCRelationship: (npcId, change) => set((state) => ({
        activeScene: {
          ...state.activeScene,
          activeNPCs: state.activeScene.activeNPCs.map(n =>
            n.id === npcId ? { ...n, relationship: Math.max(-100, Math.min(100, n.relationship + change)) } : n
          ),
        },
      })),

      setNPCSpeaking: (npcId, dialogue, emotion) => set((state) => ({
        activeScene: {
          ...state.activeScene,
          activeNPCs: state.activeScene.activeNPCs.map(n =>
            n.id === npcId ? {
              ...n,
              isSpeaking: true,
              currentDialogue: dialogue,
              dialogueHistory: [...n.dialogueHistory, { speaker: n.name, text: dialogue, timestamp: Date.now(), emotion }],
            } : n
          ),
        },
      })),

      stopNPCSpeaking: (npcId) => set((state) => ({
        activeScene: {
          ...state.activeScene,
          activeNPCs: state.activeScene.activeNPCs.map(n =>
            n.id === npcId ? { ...n, isSpeaking: false } : n
          ),
        },
      })),

      showDialogueOptions: (options, prompt) => set((state) => ({
        activeScene: {
          ...state.activeScene,
          dialogueOptions: options,
          showingDialogueOptions: true,
          narrationText: prompt || state.activeScene.narrationText,
        },
      })),

      selectDialogueOption: (optionId) => {
        const state = get();
        const option = state.activeScene.dialogueOptions.find(o => o.id === optionId);
        if (option) {
          set((s) => ({
            activeScene: {
              ...s.activeScene,
              showingDialogueOptions: false,
              dialogueOptions: [],
            },
          }));
        }
      },

      hideDialogueOptions: () => set((state) => ({
        activeScene: { ...state.activeScene, showingDialogueOptions: false, dialogueOptions: [] },
      })),

      setFlag: (key, value) => set((state) => ({
        flags: { ...state.flags, [key]: value },
      })),

      getFlag: (key) => get().flags[key],

      saveGame: (name) => {
        const state = get();
        if (!state.playerCharacter) return;
        const save: RPGSaveFile = {
          id: `save_${Date.now()}`,
          name: name || `Save ${new Date().toLocaleString()}`,
          playerCharacter: state.playerCharacter,
          quests: state.quests,
          storyLog: state.storyLog,
          flags: state.flags,
          savedAt: Date.now(),
          playTime: 0,
        };
        set((s) => ({
          savedGames: [...s.savedGames, save],
        }));
      },

      loadGame: (saveId) => {
        const state = get();
        const save = state.savedGames.find(s => s.id === saveId);
        if (!save) return;
        set({
          playerCharacter: save.playerCharacter,
          quests: save.quests,
          storyLog: save.storyLog,
          flags: save.flags,
          rpgModeActive: true,
        });
      },

      setShowCharacterCreator: (show) => set({
        showCharacterCreator: show,
        characterCreatorStep: show ? 0 : null,
      }),

      advanceCharacterCreation: (_input) => set((state) => ({
        characterCreatorStep: state.characterCreatorStep !== null ? state.characterCreatorStep + 1 : null,
      })),

      toggleSidebar: () => set((state) => ({ sidebarVisible: !state.sidebarVisible })),
      setSidebarTab: (tab) => set({ sidebarTab: tab }),
      setNarration: (text) => set((state) => ({
        activeScene: { ...state.activeScene, narrationText: text },
      })),

      reset: () => set(DEFAULT_STATE),
    }),
    {
      name: 'speechfm-rpg-storage',
      storage: createJSONStorage(() => ({
        getItem: async (name: string) => {
          const value = await AsyncStorage.getItem(name);
          return value;
        },
        setItem: async (name: string, value: string) => {
          await AsyncStorage.setItem(name, value);
        },
        removeItem: async (name: string) => {
          await AsyncStorage.removeItem(name);
        },
      })),
      partialize: (state) => ({
        playerCharacter: state.playerCharacter,
        quests: state.quests,
        storyLog: state.storyLog,
        flags: state.flags,
        savedGames: state.savedGames,
      }),
    }
  )
);
