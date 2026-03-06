/**
 * VoiceProvider
 * Adapted from Voice31ElevenLabsProvider.tsx for React Native
 * Uses @elevenlabs/react-native instead of @elevenlabs/react
 * Uses expo-av instead of new Audio() for NPC voice playback
 */

import React, { useEffect, useRef, useCallback, createContext, useContext } from 'react';
import { useConversation } from '@elevenlabs/react-native';
import { Audio } from 'expo-av';
import { useVoiceStore } from '@/stores/voice-store';
import { useRPGStore, NPC_VOICE_LIBRARY } from '@/stores/rpg-store';
import { createVoiceToolHandler, executeScheduledEvents } from '@/lib/tools/voice-tools';
import { createRPGToolHandler } from '@/lib/tools/rpg-tools';
import { getSignedUrl } from '@/lib/api/elevenlabs';
import { apiRawFetch } from '@/lib/api/client';

// =============================================================================
// CONFIG
// =============================================================================

const ELEVENLABS_AGENT_ID = process.env.EXPO_PUBLIC_ELEVENLABS_AGENT_ID || '';

// =============================================================================
// CONTEXT
// =============================================================================

interface VoiceContextType {
  agentId: string;
  startConversation: () => Promise<void>;
  endConversation: () => Promise<void>;
}

const VoiceContext = createContext<VoiceContextType | null>(null);

export const useVoice = () => {
  const ctx = useContext(VoiceContext);
  if (!ctx) throw new Error('useVoice must be used within VoiceProvider');
  return ctx;
};

// =============================================================================
// TOOL HANDLERS
// =============================================================================

const toolHandler = createVoiceToolHandler();
const rpgToolHandler = createRPGToolHandler();

// =============================================================================
// NPC VOICE SYNTHESIS (expo-av based)
// =============================================================================

interface NPCAudioItem {
  sound: Audio.Sound;
  npcName: string;
}

let npcAudioQueue: NPCAudioItem[] = [];
let isPlayingNPCVoice = false;

async function synthesizeNPCVoice(voiceId: string, text: string, npcName: string, emotion?: string) {
  try {
    const response = await apiRawFetch('/api/elevenlabs/npc-tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ voiceId, text, emotion }),
    });

    if (!response.ok) throw new Error(`NPC TTS failed: ${response.status}`);

    // Get audio data and create a temporary file URI
    const blob = await response.blob();
    const reader = new FileReader();

    const base64Promise = new Promise<string>((resolve, reject) => {
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    const base64 = await base64Promise;
    const uri = `data:audio/mpeg;base64,${base64}`;

    const { sound } = await Audio.Sound.createAsync({ uri });
    npcAudioQueue.push({ sound, npcName });

    if (!isPlayingNPCVoice) {
      playNextNPCVoice();
    }
  } catch (error) {
    console.error('[Voice] NPC voice synthesis failed:', error);
  }
}

async function playNextNPCVoice() {
  if (npcAudioQueue.length === 0) {
    isPlayingNPCVoice = false;
    useVoiceStore.getState().setNpcAudioPlaying(false);
    const rpgStore = useRPGStore.getState();
    const speakingNpc = rpgStore.activeScene.activeNPCs.find(n => n.isSpeaking);
    if (speakingNpc) rpgStore.stopNPCSpeaking(speakingNpc.id);
    return;
  }

  isPlayingNPCVoice = true;
  const { sound, npcName } = npcAudioQueue.shift()!;

  useVoiceStore.getState().setTurnState('npc_speaking', npcName);
  useVoiceStore.getState().setNpcAudioPlaying(true);

  sound.setOnPlaybackStatusUpdate((status) => {
    if (status.isLoaded && status.didJustFinish) {
      sound.unloadAsync();
      playNextNPCVoice();
    }
  });

  try {
    await sound.playAsync();
  } catch (err) {
    console.error('[Voice] Failed to play NPC audio:', err);
    await sound.unloadAsync();
    playNextNPCVoice();
  }
}

// =============================================================================
// HELPERS
// =============================================================================

const parseCommaSeparated = (str?: string): string[] => {
  if (!str) return [];
  return str.split(',').map(s => s.trim()).filter(Boolean);
};

const parseJSON = (str?: string): any => {
  if (!str) return null;
  try { return JSON.parse(str); } catch { return null; }
};

async function safeTool(name: string, fn: () => Promise<string>): Promise<string> {
  try {
    return await fn();
  } catch (err) {
    console.error(`[Voice] Tool "${name}" threw:`, err);
    return JSON.stringify({ success: false, message: `Tool error: ${err instanceof Error ? err.message : 'unknown'}` });
  }
}

// =============================================================================
// CLIENT TOOLS
// =============================================================================

const buildClientTools = (): Record<string, (parameters: any) => Promise<string | undefined>> => ({
  // Visual tools
  show_text: async (params: { text: string }) =>
    safeTool('show_text', async () => JSON.stringify(await toolHandler.handleToolCall('show_text', params))),
  show_list: async (params: { items: string; title?: string }) =>
    safeTool('show_list', async () => JSON.stringify(await toolHandler.handleToolCall('show_list', { items: parseCommaSeparated(params.items), title: params.title }))),
  show_image: async (params: { prompt: string }) =>
    safeTool('show_image', async () => JSON.stringify(await toolHandler.handleToolCall('show_image', params))),
  trigger_effect: async (params: { type: string; intensity?: number; duration?: number }) =>
    safeTool('trigger_effect', async () => JSON.stringify(await toolHandler.handleToolCall('trigger_effect', params))),
  set_mood: async (params: { mood: string }) =>
    safeTool('set_mood', async () => JSON.stringify(await toolHandler.handleToolCall('set_mood', params))),
  set_color: async (params: { color: string }) =>
    safeTool('set_color', async () => JSON.stringify(await toolHandler.handleToolCall('set_color', params))),
  clear_display: async () =>
    safeTool('clear_display', async () => JSON.stringify(await toolHandler.handleToolCall('clear_display', {}))),

  // RPG tools
  set_scene: async (params: { location_name: string; background_prompt: string; ambient_effect?: string }) =>
    safeTool('set_scene', async () => JSON.stringify(await rpgToolHandler.handleToolCall('set_scene', params))),
  show_npc: async (params: { name: string; portrait_prompt: string; voice_type: string; title?: string; position?: string; relationship?: number; race?: string; personality?: string }) =>
    safeTool('show_npc', async () => JSON.stringify(await rpgToolHandler.handleToolCall('show_npc', params))),
  npc_speak: async (params: { npc_id: string; dialogue: string; emotion?: string }) =>
    safeTool('npc_speak', async () => {
      const result = await rpgToolHandler.handleToolCall('npc_speak', params);
      const rpgStore = useRPGStore.getState();
      if (rpgStore.rpgModeActive) {
        const npc = rpgStore.activeScene.activeNPCs.find(
          n => n.id === params.npc_id || n.name.toLowerCase() === params.npc_id.toLowerCase()
        );
        if (npc?.voiceId) {
          synthesizeNPCVoice(npc.voiceId, params.dialogue, npc.name, params.emotion);
        }
      }
      return JSON.stringify({
        ...result,
        instructions: `${(result as any).context?.npcName || 'NPC'} is speaking. Wait for them to finish.`,
      });
    }),
  dismiss_npc: async (params: { npc_id: string }) =>
    safeTool('dismiss_npc', async () => JSON.stringify(await rpgToolHandler.handleToolCall('dismiss_npc', params))),
  dismiss_all_npcs: async () =>
    safeTool('dismiss_all_npcs', async () => JSON.stringify(await rpgToolHandler.handleToolCall('dismiss_all_npcs', {}))),
  update_player_stats: async (params: { health_change?: number; mana_change?: number; exp_gain?: number }) =>
    safeTool('update_player_stats', async () => JSON.stringify(await rpgToolHandler.handleToolCall('update_player_stats', params))),
  give_item: async (params: { item_name: string; item_type: string; description: string; rarity?: string; quantity?: number; value?: number }) =>
    safeTool('give_item', async () => JSON.stringify(await rpgToolHandler.handleToolCall('give_item', params))),
  give_gold: async (params: { amount: number }) =>
    safeTool('give_gold', async () => JSON.stringify(await rpgToolHandler.handleToolCall('give_gold', params))),
  add_quest: async (params: { name: string; description: string; giver_name?: string }) =>
    safeTool('add_quest', async () => JSON.stringify(await rpgToolHandler.handleToolCall('add_quest', params))),
  update_quest: async (params: { quest_id: string; status?: string }) =>
    safeTool('update_quest', async () => JSON.stringify(await rpgToolHandler.handleToolCall('update_quest', params))),
  show_choices: async (params: { prompt?: string; choices_json: string }) =>
    safeTool('show_choices', async () => JSON.stringify(await rpgToolHandler.handleToolCall('show_choices', { prompt: params.prompt, choices: parseJSON(params.choices_json) || [] }))),
  log_story_event: async (params: { type: string; summary: string; full_text: string; important?: boolean }) =>
    safeTool('log_story_event', async () => JSON.stringify(await rpgToolHandler.handleToolCall('log_story_event', params))),
  roll_dice: async (params: { dice: string; purpose: string; dc?: number }) =>
    safeTool('roll_dice', async () => JSON.stringify(await rpgToolHandler.handleToolCall('roll_dice', params))),
  update_relationship: async (params: { npc_id: string; change: number }) =>
    safeTool('update_relationship', async () => JSON.stringify(await rpgToolHandler.handleToolCall('update_relationship', params))),
  set_flag: async (params: { key: string; value: string }) =>
    safeTool('set_flag', async () => JSON.stringify(await rpgToolHandler.handleToolCall('set_flag', params))),
  save_game: async (params?: { slot_name?: string }) =>
    safeTool('save_game', async () => JSON.stringify(await rpgToolHandler.handleToolCall('save_game', params || {}))),
  set_narration: async (params: { text: string }) =>
    safeTool('set_narration', async () => JSON.stringify(await rpgToolHandler.handleToolCall('set_narration', params))),
  check_flag: async (params: { key: string }) =>
    safeTool('check_flag', async () => JSON.stringify(await rpgToolHandler.handleToolCall('check_flag', params))),
  update_scene_background: async (params: { background_prompt: string }) =>
    safeTool('update_scene_background', async () => JSON.stringify(await rpgToolHandler.handleToolCall('update_scene_background', params))),
});

// =============================================================================
// PROVIDER
// =============================================================================

interface VoiceProviderProps {
  children: React.ReactNode;
  agentId?: string;
}

export function VoiceProvider({ children, agentId = ELEVENLABS_AGENT_ID }: VoiceProviderProps) {
  const setConnected = useVoiceStore(s => s.setConnected);
  const setListening = useVoiceStore(s => s.setListening);
  const setSpeaking = useVoiceStore(s => s.setSpeaking);
  const setUserTranscript = useVoiceStore(s => s.setUserTranscript);
  const setAssistantText = useVoiceStore(s => s.setAssistantText);
  const setVisualizerData = useVoiceStore(s => s.setVisualizerData);

  const prevModeRef = useRef<string>('');
  const clientTools = useRef(buildClientTools());

  // Configure audio mode for playback + recording
  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
  }, []);

  const conversation = useConversation({
    clientTools: clientTools.current,
    onConnect: () => {
      console.log('[Voice] Connected');
      setConnected(true);
    },
    onDisconnect: () => {
      console.log('[Voice] Disconnected');
      setConnected(false);
      setListening(false);
      setSpeaking(false);
      useVoiceStore.getState().setThinking(false);
    },
    onMessage: (message: any) => {
      if (message.source === 'user' && message.message) {
        setUserTranscript(message.message);

        // RPG keyword detection
        const text = message.message.toLowerCase().trim();
        const rpgStore = useRPGStore.getState();
        if (!rpgStore.rpgModeActive) {
          const rpgKeywords = ['rpg', 'roleplay', 'dungeon', 'quest', 'adventure', 'campaign', 'fantasy game'];
          if (rpgKeywords.some(kw => text.includes(kw))) {
            rpgStore.enableRPGMode();
            if (rpgStore.savedGames.length === 0) {
              rpgStore.setShowCharacterCreator(true);
            }
          }
        }

        // Voice dialogue selection
        if (rpgStore.rpgModeActive && rpgStore.activeScene.showingDialogueOptions) {
          const options = rpgStore.activeScene.dialogueOptions;
          const numberWords: Record<string, number> = {
            one: 1, two: 2, three: 3, four: 4, five: 5,
            '1': 1, '2': 2, '3': 3, '4': 4, '5': 5,
          };
          let matchedIndex = -1;
          for (const [word, num] of Object.entries(numberWords)) {
            if (text.includes(word) && num <= options.length) {
              matchedIndex = num - 1;
              break;
            }
          }
          if (matchedIndex >= 0 && !options[matchedIndex].disabled) {
            rpgStore.selectDialogueOption(options[matchedIndex].id);
          }
        }
      }

      if (message.source === 'ai' && message.message) {
        const rpgActive = useRPGStore.getState().rpgModeActive;
        if (!rpgActive) {
          useVoiceStore.getState().showText(message.message);
        }
        setAssistantText(message.message.slice(0, 20).toUpperCase() || 'SPEECH.FM');
      }
    },
    onError: (error: any) => {
      console.error('[Voice] Error:', error);
    },
    onStatusChange: (status: any) => {
      setConnected(status === 'connected');
    },
    onModeChange: (mode: any) => {
      const wasSpeaking = prevModeRef.current === 'speaking';
      const wasListening = prevModeRef.current === 'listening';
      const nowSpeaking = mode.mode === 'speaking';
      const nowListening = mode.mode === 'listening';
      const { npcAudioPlaying } = useVoiceStore.getState();

      if (npcAudioPlaying && nowSpeaking) {
        setSpeaking(false);
        setListening(false);
        prevModeRef.current = mode.mode;
        return;
      }

      setSpeaking(nowSpeaking);
      setListening(nowListening);

      if (nowSpeaking && !npcAudioPlaying) {
        useVoiceStore.getState().setTurnState('assistant_speaking', 'DM');
      } else if (nowListening) {
        useVoiceStore.getState().setTurnState('user_speaking', 'Player');
      } else if (!nowSpeaking && !nowListening && !npcAudioPlaying) {
        useVoiceStore.getState().setTurnState('idle', null);
      }

      if (wasListening && !nowListening && !nowSpeaking) {
        useVoiceStore.getState().setThinking(true);
      }
      if (!wasSpeaking && nowSpeaking && !npcAudioPlaying) {
        useVoiceStore.getState().setThinking(false);
      }

      if (!wasSpeaking && nowSpeaking && !npcAudioPlaying) executeScheduledEvents('on_speech_start');
      if (wasSpeaking && !nowSpeaking) executeScheduledEvents('on_speech_end');

      prevModeRef.current = mode.mode;
    },
  });

  // Visualizer data generation
  useEffect(() => {
    const interval = setInterval(() => {
      const { isSpeaking, isListening, isThinking } = useVoiceStore.getState();
      let data: number[];
      if (isSpeaking) {
        data = Array.from({ length: 16 }, () => Math.random() * 0.9 + 0.1);
      } else if (isThinking) {
        const t = Date.now() * 0.003;
        data = Array.from({ length: 16 }, (_, i) => {
          const wave = Math.sin(t + i * 0.4) * 0.5 + 0.5;
          return wave * 0.5 + 0.1;
        });
      } else if (isListening) {
        data = Array.from({ length: 16 }, () => Math.random() * 0.5);
      } else {
        data = Array.from({ length: 16 }, () => Math.random() * 0.15);
      }
      setVisualizerData(data);
    }, 80);

    return () => clearInterval(interval);
  }, [setVisualizerData]);

  const startConversation = useCallback(async () => {
    if (!agentId) return;

    try {
      const data = await getSignedUrl();
      await conversation.startSession({ signedUrl: data.signedUrl } as any);
    } catch (err) {
      console.log('[Voice] Signed URL failed, trying direct agentId');
      try {
        await conversation.startSession({ agentId } as any);
      } catch (err2) {
        console.error('[Voice] Failed to start conversation:', err2);
      }
    }
  }, [agentId, conversation]);

  const endConversation = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  return (
    <VoiceContext.Provider value={{ agentId, startConversation, endConversation }}>
      {children}
    </VoiceContext.Provider>
  );
}
