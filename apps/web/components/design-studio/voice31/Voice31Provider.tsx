'use client';

/**
 * Voice31 Provider
 *
 * Hume EVI connection with proper tool call handling via onToolCall prop.
 */

import React, { useEffect, useState, useRef, createContext, useContext, useCallback } from 'react';
import { VoiceProvider, useVoice, VoiceReadyState } from '@humeai/voice-react';
import { useVoice31Store } from './Voice31Store';
import { createVoice31ToolHandler, executeScheduledEvents } from './Voice31Tools';
import { createRPGToolHandler } from './Voice31RPGTools';
import { useVoice31RPGStore } from './Voice31RPGStore';
import { generateThinkingHint } from './Voice31ProgressiveRenderer';

// =============================================================================
// CONFIG
// =============================================================================

export const VOICE26_CONFIG_ID = '2674d56c-2545-4162-9445-0442c7e42676';

// =============================================================================
// CONTEXT
// =============================================================================

interface Voice31ContextType {
  accessToken: string;
}

const Voice31Context = createContext<Voice31ContextType | null>(null);

export const useVoice31Context = () => {
  const ctx = useContext(Voice31Context);
  if (!ctx) {
    throw new Error('useVoice31Context must be used within Voice31Provider');
  }
  return ctx;
};

// =============================================================================
// VOICE26 CONTROLLER (inside VoiceProvider)
// =============================================================================

interface Voice31ControllerProps {
  children: React.ReactNode;
}

const Voice31Controller: React.FC<Voice31ControllerProps> = ({ children }) => {
  const {
    readyState,
    status,
    isMuted,
    isPlaying,
    messages,
    unmute,
    // NOTE: sendSessionSettings removed - tools are synced to Hume config via /api/hume/sync-tools
    // Sending session_settings at runtime causes "failed_to_send_message" errors with EVI v1
    error: sdkError,
  } = useVoice();

  const setConnected = useVoice31Store((s) => s.setConnected);
  const setListening = useVoice31Store((s) => s.setListening);
  const setSpeaking = useVoice31Store((s) => s.setSpeaking);
  const setUserTranscript = useVoice31Store((s) => s.setUserTranscript);
  const setAssistantText = useVoice31Store((s) => s.setAssistantText);
  const setVisualizerData = useVoice31Store((s) => s.setVisualizerData);

  const processedMessagesRef = useRef(0);
  const unmuteAttemptedRef = useRef(false);

  const resolvedReadyState = readyState ?? (status as any)?.value ?? VoiceReadyState.CLOSED;
  const isConnected = resolvedReadyState === VoiceReadyState.OPEN;
  const isConnecting = resolvedReadyState === VoiceReadyState.CONNECTING;

  // Log SDK errors
  useEffect(() => {
    if (sdkError) {
      console.error('[Voice31] SDK error:', sdkError);
    }
  }, [sdkError]);

  // Update connection state
  useEffect(() => {
    setConnected(isConnected);
    if (!isConnected && !isConnecting) {
      unmuteAttemptedRef.current = false;
    }
  }, [resolvedReadyState, isConnected, isConnecting, setConnected]);

  // NOTE: Session settings are NOT sent at runtime
  // Tools and system prompt are synced to Hume config via POST /api/hume/sync-tools
  // This avoids "failed_to_send_message" errors with EVI v1 configs

  // Auto-unmute
  useEffect(() => {
    if (isConnected && typeof unmute === 'function' && !unmuteAttemptedRef.current) {
      unmuteAttemptedRef.current = true;
      unmute();
      const retryTimer = setTimeout(() => {
        if (isMuted) unmute();
      }, 500);
      return () => clearTimeout(retryTimer);
    }
  }, [isConnected, unmute, isMuted]);

  // Track speaking/listening state for visual triggers
  const prevSpeakingRef = useRef(false);
  const prevListeningRef = useRef(false);
  const thinkingStartRef = useRef<number>(0);

  useEffect(() => {
    const wasSpeaking = prevSpeakingRef.current;
    const wasListening = prevListeningRef.current;
    const nowSpeaking = isPlaying;
    const nowListening = !isMuted && !isPlaying && isConnected;

    setSpeaking(nowSpeaking);
    setListening(nowListening);

    // Fire visual triggers on state changes
    if (!wasSpeaking && nowSpeaking) {
      executeScheduledEvents('on_speech_start');
      // Audio started — clear buffering state, track TTFB
      useVoice31Store.getState().setBufferingPhase('idle');
      useVoice31Store.getState().setAudioBuffering(false);
      if (thinkingStartRef.current > 0) {
        const ttfb = Date.now() - thinkingStartRef.current;
        useVoice31Store.getState().setAudioTTFB(ttfb);
        console.log(`[Voice31-Hume] Audio TTFB: ${ttfb}ms`);
        thinkingStartRef.current = 0;
      }
    } else if (wasSpeaking && !nowSpeaking) {
      executeScheduledEvents('on_speech_end');
    }

    if (!wasListening && nowListening) {
      executeScheduledEvents('on_user_speaking');
    } else if (wasListening && !nowListening && !nowSpeaking) {
      executeScheduledEvents('on_silence');
      // User stopped talking, AI is processing — start buffering
      thinkingStartRef.current = Date.now();
      useVoice31Store.getState().setBufferingPhase('processing');
      useVoice31Store.getState().setAudioBuffering(true);
    }

    prevSpeakingRef.current = nowSpeaking;
    prevListeningRef.current = nowListening;
  }, [isPlaying, isMuted, isConnected, setSpeaking, setListening]);

  // Process messages for transcripts and kinetic text display
  useEffect(() => {
    if (!messages || messages.length === 0) return;

    const newMessages = messages.slice(processedMessagesRef.current);
    processedMessagesRef.current = messages.length;

    const showText = useVoice31Store.getState().showText;

    for (const message of newMessages) {
      if (message.type === 'user_message' && message.message?.content) {
        setUserTranscript(message.message.content);
        // Track user query for context-aware thinking hints
        useVoice31Store.getState().setLastUserQuery(message.message.content);
        const hint = generateThinkingHint(message.message.content);
        if (hint) {
          useVoice31Store.getState().setBufferingPhase('receiving', hint);
        }
      }
      if (message.type === 'assistant_message' && message.message?.content) {
        const fullContent = message.message.content;
        // Show full content with kinetic typography system
        showText(fullContent);
        // Also set the abbreviated version for status display
        setAssistantText(fullContent.slice(0, 20).toUpperCase() || 'VOICE26');
      }
    }
  }, [messages, setUserTranscript, setAssistantText]);

  // Generate visualizer data
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

  return <>{children}</>;
};

// =============================================================================
// VOICE26 PROVIDER
// =============================================================================

interface Voice31ProviderProps {
  children: React.ReactNode;
}

export const Voice31Provider: React.FC<Voice31ProviderProps> = ({ children }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const toolHandlerRef = useRef(createVoice31ToolHandler());
  const rpgToolHandlerRef = useRef(createRPGToolHandler());

  // Fetch access token
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const response = await fetch('/api/hume/access-token');
        if (!response.ok) {
          throw new Error(`Token fetch failed: ${response.status}`);
        }
        const data = await response.json();
        setAccessToken(data.accessToken);
        console.log('[Voice31] Access token fetched');
      } catch (err) {
        console.error('[Voice31] Token error:', err);
        setError(err instanceof Error ? err.message : 'Failed to get access token');
      }
    };
    fetchToken();
  }, []);

  // Tool call handler - this is called by VoiceProvider when Hume sends a tool call
  const handleToolCall = useCallback(async (
    message: any,
    send: {
      success: (content: unknown) => any;
      error: (e: { error: string; code: string; level: string; content: string }) => any;
    }
  ) => {
    const toolName = message.name;

    // Parse parameters - Hume sends them as JSON string
    let toolArgs: Record<string, unknown> = {};
    if (message.parameters) {
      if (typeof message.parameters === 'string') {
        try {
          toolArgs = JSON.parse(message.parameters);
        } catch (e) {
          console.error('[Voice31] Failed to parse tool parameters:', message.parameters);
        }
      } else {
        toolArgs = message.parameters;
      }
    }

    console.log('[Voice31] Tool call received:', toolName, toolArgs);

    // RPG tools are routed to the RPG handler when RPG mode is active
    const rpgToolNames = [
      'set_scene', 'show_npc', 'npc_speak', 'dismiss_npc', 'dismiss_all_npcs',
      'update_player_stats', 'give_item', 'give_gold', 'add_quest', 'update_quest',
      'show_choices', 'log_story_event', 'roll_dice', 'start_combat', 'end_combat',
      'update_relationship', 'set_flag', 'save_game', 'play_sfx', 'set_narration',
      'check_flag', 'update_scene_background',
    ];
    const isRPGTool = rpgToolNames.includes(toolName);
    const rpgModeActive = useVoice31RPGStore.getState().rpgModeActive;

    try {
      let result;
      if (isRPGTool && rpgModeActive) {
        result = await rpgToolHandlerRef.current.handleToolCall(toolName, toolArgs);
      } else {
        result = await toolHandlerRef.current.handleToolCall(toolName, toolArgs);
      }
      console.log('[Voice31] Tool result:', result);

      // Send success response back to Hume
      const context = result.context ?? (result.success ? toolArgs : undefined);
      const payload = {
        success: result.success,
        message: result.message,
        context,
      };
      return send.success(JSON.stringify(payload));
    } catch (err) {
      console.error('[Voice31] Tool call failed:', err);
      return send.error({
        error: err instanceof Error ? err.message : 'Tool call failed',
        code: 'TOOL_ERROR',
        level: 'error',
        content: 'The tool encountered an error',
      });
    }
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-black">
        <div className="text-red-500 font-mono text-sm">ERROR: {error}</div>
      </div>
    );
  }

  if (!accessToken) {
    return (
      <div className="flex items-center justify-center h-full bg-black">
        <div className="text-amber-500 font-mono text-sm animate-pulse">
          INITIALIZING VOICE SYSTEM...
        </div>
      </div>
    );
  }

  return (
    <Voice31Context.Provider value={{ accessToken }}>
      <VoiceProvider
        auth={{ type: 'accessToken', value: accessToken }}
        configId={VOICE26_CONFIG_ID}
        onToolCall={handleToolCall}
        onToolCallError={(message, error) => {
          console.error('[Voice31] Tool call error:', message, error);
        }}
      >
        <Voice31Controller>
          {children}
        </Voice31Controller>
      </VoiceProvider>
    </Voice31Context.Provider>
  );
};

export default Voice31Provider;
