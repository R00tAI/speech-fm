/**
 * Voice Store
 * Ported from Voice31Store.ts - localStorage → AsyncStorage, stripped DOM helpers
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

// =============================================================================
// TYPES
// =============================================================================

export type PhosphorColor = 'green' | 'red' | 'blue' | 'amber' | 'white';
export type DisplayContentType = 'text' | 'list' | 'image' | 'generating' | 'visualization' | null;
export type VisualizationType = 'waveform' | 'particles' | 'matrix' | null;
export type EffectType = 'rain' | 'snow' | 'confetti' | 'sparkles' | 'fire' | 'hearts' | 'stars' | null;

export interface DisplayContent {
  type: DisplayContentType;
  text?: string;
  list?: string[];
  listTitle?: string;
  imageUrl?: string;
  imagePrompt?: string;
  visualizationType?: VisualizationType;
  visualizationTitle?: string;
}

export interface PersistentImageLayer {
  url: string;
  prompt?: string;
  position: 'background' | 'left' | 'right' | 'center';
  opacity: number;
  timestamp: number;
}

export interface ActiveEffect {
  type: EffectType;
  intensity: number;
  startTime: number;
  duration: number;
}

// =============================================================================
// STORE STATE
// =============================================================================

interface VoiceState {
  isConnected: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  isThinking: boolean;
  userTranscript: string;
  assistantText: string;
  phosphorColor: PhosphorColor;
  displayContent: DisplayContent;
  activeEffect: ActiveEffect | null;
  visualizerData: number[];
  persistentImage: PersistentImageLayer | null;
  overlayText: string | null;
  // Turn management for RPG mode
  turnState: 'idle' | 'npc_speaking' | 'assistant_speaking' | 'user_speaking' | 'processing';
  currentSpeakerName: string | null;
  npcAudioPlaying: boolean;
}

interface VoiceActions {
  setConnected: (connected: boolean) => void;
  setListening: (listening: boolean) => void;
  setSpeaking: (speaking: boolean) => void;
  setThinking: (thinking: boolean) => void;
  setUserTranscript: (text: string) => void;
  setAssistantText: (text: string) => void;
  setPhosphorColor: (color: PhosphorColor) => void;
  showText: (text: string) => void;
  showList: (items: string[], title?: string) => void;
  showGenerating: (prompt: string) => void;
  showImage: (url: string, prompt?: string, persist?: boolean) => void;
  showVisualization: (type: VisualizationType, title?: string) => void;
  clearContent: () => void;
  setPersistentImage: (url: string, prompt?: string, position?: PersistentImageLayer['position']) => void;
  clearPersistentImage: () => void;
  setOverlayText: (text: string | null) => void;
  triggerEffect: (type: EffectType, intensity?: number, duration?: number) => void;
  clearEffect: () => void;
  setVisualizerData: (data: number[]) => void;
  setTurnState: (state: VoiceState['turnState'], speakerName?: string | null) => void;
  setNpcAudioPlaying: (playing: boolean) => void;
  reset: () => void;
}

export type VoiceStore = VoiceState & VoiceActions;

// =============================================================================
// DEFAULT STATE
// =============================================================================

const DEFAULT_STATE: VoiceState = {
  isConnected: false,
  isListening: false,
  isSpeaking: false,
  isThinking: false,
  userTranscript: '',
  assistantText: 'SPEECH.FM',
  phosphorColor: 'amber',
  displayContent: { type: null },
  activeEffect: null,
  visualizerData: Array(16).fill(0.1),
  persistentImage: null,
  overlayText: null,
  turnState: 'idle',
  currentSpeakerName: null,
  npcAudioPlaying: false,
};

// =============================================================================
// STORE
// =============================================================================

export const useVoiceStore = create<VoiceStore>((set, get) => ({
  ...DEFAULT_STATE,

  setConnected: (connected) => set({ isConnected: connected }),
  setListening: (listening) => set({ isListening: listening }),
  setSpeaking: (speaking) => set({ isSpeaking: speaking }),
  setThinking: (thinking) => set({ isThinking: thinking }),

  setUserTranscript: (text) => set({ userTranscript: text }),
  setAssistantText: (text) => set({ assistantText: text }),
  setPhosphorColor: (color) => set({ phosphorColor: color }),

  showText: (text) => set((state) => {
    const activeType = state.displayContent.type;
    const hasVisualContent = activeType === 'image' || activeType === 'visualization' || activeType === 'generating';

    if (hasVisualContent) {
      return {
        overlayText: text,
        assistantText: text.slice(0, 20).toUpperCase() || 'TEXT',
      };
    }

    return {
      displayContent: { type: 'text', text },
      overlayText: null,
      assistantText: text.slice(0, 20).toUpperCase() || 'TEXT',
    };
  }),

  showList: (items, title) => set({
    displayContent: { type: 'list', list: items, listTitle: title },
    assistantText: title?.toUpperCase() || 'LIST',
  }),

  showGenerating: (prompt) => set({
    displayContent: { type: 'generating', imagePrompt: prompt },
    assistantText: 'GENERATING',
  }),

  showImage: (url, prompt, persist = true) => set((state) => ({
    displayContent: { type: 'image', imageUrl: url, imagePrompt: prompt },
    assistantText: 'IMAGE',
    persistentImage: persist ? {
      url,
      prompt,
      position: 'background' as const,
      opacity: 1,
      timestamp: Date.now(),
    } : state.persistentImage,
  })),

  showVisualization: (visualizationType, title) => set({
    displayContent: {
      type: 'visualization',
      visualizationType,
      visualizationTitle: title,
    },
    assistantText: title?.toUpperCase() || visualizationType?.toUpperCase().replace('_', ' ') || 'VISUAL',
  }),

  clearContent: () => set({
    displayContent: { type: null },
    persistentImage: null,
    overlayText: null,
  }),

  setPersistentImage: (url, prompt, position = 'background') => set({
    persistentImage: { url, prompt, position, opacity: 1, timestamp: Date.now() },
  }),
  clearPersistentImage: () => set({ persistentImage: null }),

  setOverlayText: (text) => set({ overlayText: text }),

  triggerEffect: (type, intensity = 0.5, duration = 5000) => set({
    activeEffect: { type, intensity, startTime: Date.now(), duration },
  }),
  clearEffect: () => set({ activeEffect: null }),

  setVisualizerData: (data) => set({ visualizerData: data }),

  setTurnState: (turnState, speakerName = null) => set({ turnState, currentSpeakerName: speakerName }),
  setNpcAudioPlaying: (npcAudioPlaying) => set({
    npcAudioPlaying,
    turnState: npcAudioPlaying ? 'npc_speaking' : 'idle',
    currentSpeakerName: npcAudioPlaying ? get().currentSpeakerName : null,
  }),

  reset: () => set(DEFAULT_STATE),
}));

// =============================================================================
// PERSISTENCE HELPERS
// =============================================================================

const STORAGE_KEY = 'speechfm_voice_settings';

export async function loadPersistedSettings() {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      useVoiceStore.setState({
        phosphorColor: parsed.phosphorColor || 'amber',
      });
    }
  } catch (e) {
    console.warn('[VoiceStore] Failed to load settings:', e);
  }
}

export async function persistSettings() {
  try {
    const { phosphorColor } = useVoiceStore.getState();
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ phosphorColor }));
  } catch (e) {
    console.warn('[VoiceStore] Failed to persist settings:', e);
  }
}
