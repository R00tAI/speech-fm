'use client';

/**
 * Voice31 FAL Provider
 *
 * Alternative provider using FAL.ai models (Whisper + Claude + F5-TTS).
 * This is a turn-based approach rather than real-time streaming,
 * but provides a cost-effective alternative when ElevenLabs/Hume is unavailable.
 */

import React, { useEffect, useRef, useCallback, createContext, useContext, useState } from 'react';
import { useVoice31Store } from './Voice31Store';
import { createVoice31ToolHandler, executeScheduledEvents } from './Voice31Tools';
import { useVoice31RPGStore, NPC_VOICE_LIBRARY } from './Voice31RPGStore';
import { createRPGToolHandler } from './Voice31RPGTools';

// =============================================================================
// CONFIG
// =============================================================================

const SILENCE_THRESHOLD = 0.01;
const SILENCE_DURATION_MS = 1500; // How long to wait for silence before processing
const MIN_AUDIO_DURATION_MS = 500; // Minimum audio to capture

// =============================================================================
// CONTEXT
// =============================================================================

interface Voice31FALContextType {
  startConversation: () => Promise<void>;
  endConversation: () => Promise<void>;
  isProcessing: boolean;
}

const Voice31FALContext = createContext<Voice31FALContextType | null>(null);

export const useVoice31FAL = () => {
  const ctx = useContext(Voice31FALContext);
  if (!ctx) {
    throw new Error('useVoice31FAL must be used within Voice31FALProvider');
  }
  return ctx;
};

// =============================================================================
// TOOL HANDLERS
// =============================================================================

const toolHandler = createVoice31ToolHandler();
const rpgToolHandler = createRPGToolHandler();

// =============================================================================
// NPC VOICE SYNTHESIS (using FAL F5-TTS)
// =============================================================================

let npcAudioQueue: HTMLAudioElement[] = [];
let isPlayingNPCVoice = false;

async function synthesizeNPCVoice(text: string, emotion?: string): Promise<void> {
  try {
    // Call our FAL TTS endpoint
    const response = await fetch('/api/fal/voice/synthesize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        // Could customize reference audio per NPC for different voices
      }),
    });

    if (!response.ok) {
      throw new Error(`FAL TTS failed: ${response.statusText}`);
    }

    const data = await response.json();
    const audio = new Audio(data.audio_url);

    npcAudioQueue.push(audio);

    if (!isPlayingNPCVoice) {
      playNextNPCVoice();
    }
  } catch (error) {
    console.error('[Voice31-FAL] NPC voice synthesis failed:', error);
  }
}

function playNextNPCVoice() {
  if (npcAudioQueue.length === 0) {
    isPlayingNPCVoice = false;
    const rpgStore = useVoice31RPGStore.getState();
    const speakingNpc = rpgStore.activeScene.activeNPCs.find((n) => n.isSpeaking);
    if (speakingNpc) {
      rpgStore.stopNPCSpeaking(speakingNpc.id);
    }
    return;
  }

  isPlayingNPCVoice = true;
  const audio = npcAudioQueue.shift()!;

  audio.onended = () => {
    URL.revokeObjectURL(audio.src);
    playNextNPCVoice();
  };

  audio.onerror = () => {
    console.error('[Voice31-FAL] NPC audio playback error');
    URL.revokeObjectURL(audio.src);
    playNextNPCVoice();
  };

  audio.play().catch((err) => {
    console.error('[Voice31-FAL] Failed to play NPC audio:', err);
    playNextNPCVoice();
  });
}

// =============================================================================
// TOOL EXECUTION
// =============================================================================

async function executeToolCalls(
  toolCalls: Array<{ name: string; input: Record<string, unknown> }>
): Promise<void> {
  for (const tool of toolCalls) {
    console.log('[Voice31-FAL] Executing tool:', tool.name);

    // Check if it's an RPG tool
    const rpgTools = [
      'set_scene',
      'show_npc',
      'npc_speak',
      'dismiss_npc',
      'dismiss_all_npcs',
      'update_player_stats',
      'give_item',
      'give_gold',
      'add_quest',
      'update_quest',
      'show_choices',
      'log_story_event',
      'roll_dice',
      'start_combat',
      'end_combat',
      'update_relationship',
      'set_flag',
      'save_game',
      'play_sfx',
      'set_narration',
      'check_flag',
    ];

    if (rpgTools.includes(tool.name)) {
      await rpgToolHandler.handleToolCall(tool.name, tool.input);

      // Handle NPC voice synthesis for npc_speak
      if (tool.name === 'npc_speak') {
        const rpgStore = useVoice31RPGStore.getState();
        if (rpgStore.rpgModeActive) {
          const npcId = tool.input.npc_id as string;
          const dialogue = tool.input.dialogue as string;
          const emotion = tool.input.emotion as string | undefined;

          const npc = rpgStore.activeScene.activeNPCs.find(
            (n) => n.id === npcId || n.name.toLowerCase() === npcId.toLowerCase()
          );
          if (npc && dialogue) {
            synthesizeNPCVoice(dialogue, emotion);
          }
        }
      }
    } else {
      await toolHandler.handleToolCall(tool.name, tool.input);
    }
  }
}

// =============================================================================
// PROVIDER
// =============================================================================

interface Voice31FALProviderProps {
  children: React.ReactNode;
}

export const Voice31FALProvider: React.FC<Voice31FALProviderProps> = ({ children }) => {
  const setConnected = useVoice31Store((s) => s.setConnected);
  const setListening = useVoice31Store((s) => s.setListening);
  const setSpeaking = useVoice31Store((s) => s.setSpeaking);
  const setUserTranscript = useVoice31Store((s) => s.setUserTranscript);
  const setAssistantText = useVoice31Store((s) => s.setAssistantText);
  const setVisualizerData = useVoice31Store((s) => s.setVisualizerData);
  const showText = useVoice31Store((s) => s.showText);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isActive, setIsActive] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const silenceStartRef = useRef<number | null>(null);
  const recordingStartRef = useRef<number | null>(null);
  const conversationHistoryRef = useRef<unknown[]>([]);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // Visualizer data generation
  useEffect(() => {
    const interval = setInterval(() => {
      const { isSpeaking, isListening } = useVoice31Store.getState();
      let data: number[];
      if (isSpeaking) {
        data = Array.from({ length: 16 }, () => Math.random() * 0.9 + 0.1);
      } else if (isListening) {
        data = Array.from({ length: 16 }, () => Math.random() * 0.5);
      } else {
        data = Array.from({ length: 16 }, () => Math.random() * 0.15);
      }
      setVisualizerData(data);
    }, 80);

    return () => clearInterval(interval);
  }, [setVisualizerData]);

  // Process recorded audio
  const processAudio = useCallback(async () => {
    if (audioChunksRef.current.length === 0) return;

    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    audioChunksRef.current = [];

    // Don't process very short recordings
    if (audioBlob.size < 1000) {
      console.log('[Voice31-FAL] Audio too short, skipping');
      return;
    }

    setIsProcessing(true);
    setListening(false);
    executeScheduledEvents('on_user_speaking');

    try {
      // Send to conversation endpoint
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('history', JSON.stringify(conversationHistoryRef.current));

      console.log('[Voice31-FAL] Sending audio for processing...');
      const response = await fetch('/api/fal/voice/conversation', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Conversation failed: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[Voice31-FAL] Response:', data);

      // Update transcripts
      if (data.user_text) {
        setUserTranscript(data.user_text);
      }

      if (data.assistant_text) {
        showText(data.assistant_text);
        setAssistantText(data.assistant_text.slice(0, 20).toUpperCase() || 'FAL VOICE');
      }

      // Execute tool calls
      if (data.tool_calls && data.tool_calls.length > 0) {
        await executeToolCalls(data.tool_calls);
      }

      // Update conversation history
      if (data.history) {
        conversationHistoryRef.current = data.history;
      }

      // Play audio response
      if (data.audio_url) {
        setSpeaking(true);
        executeScheduledEvents('on_speech_start');

        const audio = new Audio(data.audio_url);
        currentAudioRef.current = audio;

        audio.onended = () => {
          setSpeaking(false);
          executeScheduledEvents('on_speech_end');
          currentAudioRef.current = null;
          // Resume listening after response
          if (isActive) {
            setListening(true);
          }
        };

        audio.onerror = () => {
          console.error('[Voice31-FAL] Audio playback error');
          setSpeaking(false);
          currentAudioRef.current = null;
          if (isActive) {
            setListening(true);
          }
        };

        await audio.play();
      } else {
        // No audio response, resume listening
        if (isActive) {
          setListening(true);
        }
      }
    } catch (error) {
      console.error('[Voice31-FAL] Processing error:', error);
      if (isActive) {
        setListening(true);
      }
    } finally {
      setIsProcessing(false);
    }
  }, [isActive, setListening, setSpeaking, setUserTranscript, setAssistantText, showText]);

  // Voice activity detection
  const checkVoiceActivity = useCallback(() => {
    if (!analyserRef.current || !mediaRecorderRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Calculate average amplitude
    const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length / 255;

    if (average > SILENCE_THRESHOLD) {
      // Voice detected
      silenceStartRef.current = null;

      // Start recording if not already
      if (mediaRecorderRef.current.state === 'inactive') {
        audioChunksRef.current = [];
        recordingStartRef.current = Date.now();
        mediaRecorderRef.current.start();
        console.log('[Voice31-FAL] Started recording');
      }
    } else if (mediaRecorderRef.current.state === 'recording') {
      // Silence detected while recording
      if (!silenceStartRef.current) {
        silenceStartRef.current = Date.now();
      } else if (Date.now() - silenceStartRef.current > SILENCE_DURATION_MS) {
        // Enough silence, stop recording
        const recordingDuration = Date.now() - (recordingStartRef.current || 0);
        if (recordingDuration > MIN_AUDIO_DURATION_MS) {
          console.log('[Voice31-FAL] Stopping recording after silence');
          mediaRecorderRef.current.stop();
        } else {
          // Recording too short, discard
          audioChunksRef.current = [];
          mediaRecorderRef.current.stop();
        }
        silenceStartRef.current = null;
      }
    }
  }, []);

  // Start conversation
  const startConversation = useCallback(async () => {
    if (isActive) return;

    console.log('[Voice31-FAL] Starting conversation...');

    try {
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Set up audio context for VAD
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Set up media recorder
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        processAudio();
      };

      setIsActive(true);
      setConnected(true);
      setListening(true);

      // Start VAD loop
      const vadInterval = setInterval(() => {
        if (!isActive) {
          clearInterval(vadInterval);
          return;
        }
        checkVoiceActivity();
      }, 100);

      console.log('[Voice31-FAL] Conversation started');
    } catch (error) {
      console.error('[Voice31-FAL] Failed to start:', error);
    }
  }, [isActive, setConnected, setListening, checkVoiceActivity, processAudio]);

  // End conversation
  const endConversation = useCallback(async () => {
    console.log('[Voice31-FAL] Ending conversation...');

    setIsActive(false);
    setConnected(false);
    setListening(false);
    setSpeaking(false);

    // Stop any playing audio
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }

    // Stop recording
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    // Stop audio context
    if (audioContextRef.current) {
      await audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Stop media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Clear conversation history
    conversationHistoryRef.current = [];

    console.log('[Voice31-FAL] Conversation ended');
  }, [setConnected, setListening, setSpeaking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isActive) {
        endConversation();
      }
    };
  }, [isActive, endConversation]);

  const contextValue: Voice31FALContextType = {
    startConversation,
    endConversation,
    isProcessing,
  };

  return (
    <Voice31FALContext.Provider value={contextValue}>{children}</Voice31FALContext.Provider>
  );
};

export default Voice31FALProvider;
