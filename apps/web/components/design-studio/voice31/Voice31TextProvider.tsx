"use client";

/**
 * Voice31 Text Provider
 *
 * Lightweight provider for text chat mode — no WebSocket, no microphone.
 * Sends messages via /api/voice31/chat and executes tool_calls client-side.
 * Optionally plays TTS audio via FAL F5-TTS.
 */

import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from "react";
import type Anthropic from "@anthropic-ai/sdk";
import { createVoice31ToolHandler, executeScheduledEvents } from "./Voice31Tools";
import { createRPGToolHandler } from "./Voice31RPGTools";
import { useVoice31Store } from "./Voice31Store";
import { useVoice31RPGStore } from "./Voice31RPGStore";

// =============================================================================
// CONTEXT
// =============================================================================

interface Voice31TextContextType {
  sendMessage: (text: string) => Promise<void>;
}

const Voice31TextContext = createContext<Voice31TextContextType | null>(null);

export const useVoice31Text = () => {
  return useContext(Voice31TextContext);
};

// =============================================================================
// TOOL EXECUTION (mirrors FAL provider pattern)
// =============================================================================

const toolHandler = createVoice31ToolHandler();
const rpgToolHandler = createRPGToolHandler();

const RPG_TOOLS = [
  "set_scene", "show_npc", "npc_speak", "dismiss_npc", "dismiss_all_npcs",
  "update_player_stats", "give_item", "give_gold", "add_quest", "update_quest",
  "show_choices", "log_story_event", "roll_dice", "start_combat", "end_combat",
  "update_relationship", "set_flag", "save_game", "play_sfx", "set_narration",
  "check_flag",
];

async function executeToolCalls(
  toolCalls: Array<{ name: string; input: Record<string, unknown> }>,
): Promise<void> {
  for (const tool of toolCalls) {
    console.log("[Voice31-Text] Executing tool:", tool.name);
    if (RPG_TOOLS.includes(tool.name)) {
      await rpgToolHandler.handleToolCall(tool.name, tool.input);
    } else {
      await toolHandler.handleToolCall(tool.name, tool.input);
    }
  }
}

// =============================================================================
// PROVIDER
// =============================================================================

interface Voice31TextProviderProps {
  children: React.ReactNode;
}

export const Voice31TextProvider: React.FC<Voice31TextProviderProps> = ({
  children,
}) => {
  const historyRef = useRef<Anthropic.MessageParam[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const store = useVoice31Store;
  const ttsEnabled = store((s) => s.ttsEnabled);

  // Text mode is always "connected"
  useEffect(() => {
    store.getState().setConnected(true);
    // Generate gentle idle visualizer data
    const interval = setInterval(() => {
      const data = Array.from({ length: 16 }, () => 0.05 + Math.random() * 0.1);
      store.getState().setVisualizerData(data);
    }, 200);
    return () => {
      clearInterval(interval);
      store.getState().setConnected(false);
    };
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;
      const state = store.getState();

      // Add user message to chat
      state.addChatMessage({ role: "user", content: text.trim() });
      state.setChatProcessing(true);
      state.setThinking(true);
      state.setUserTranscript(text.trim());

      try {
        const response = await fetch("/api/voice31/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text.trim(),
            history: historyRef.current,
            ttsEnabled: state.ttsEnabled,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        // Update history
        if (data.history) {
          historyRef.current = data.history;
        }

        // Show assistant text
        if (data.assistant_text) {
          state.setAssistantText(
            data.assistant_text.slice(0, 20).toUpperCase() || "REPLY",
          );
          state.addChatMessage({
            role: "assistant",
            content: data.assistant_text,
            toolCalls: data.tool_calls,
          });
        }

        // Execute tool calls
        if (data.tool_calls && data.tool_calls.length > 0) {
          await executeToolCalls(data.tool_calls);
          executeScheduledEvents();
        }

        // Play TTS audio if available
        if (data.audio_url) {
          if (audioRef.current) {
            audioRef.current.pause();
          }
          const audio = new Audio(data.audio_url);
          audioRef.current = audio;
          state.setSpeaking(true);
          audio.onended = () => {
            state.setSpeaking(false);
            audioRef.current = null;
          };
          audio.onerror = () => {
            state.setSpeaking(false);
            audioRef.current = null;
          };
          audio.play().catch(() => {
            state.setSpeaking(false);
          });
        }
      } catch (error) {
        console.error("[Voice31-Text] Chat error:", error);
        state.addChatMessage({
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        });
      } finally {
        state.setChatProcessing(false);
        state.setThinking(false);
      }
    },
    [ttsEnabled],
  );

  const contextValue: Voice31TextContextType = { sendMessage };

  return (
    <Voice31TextContext.Provider value={contextValue}>
      {children}
    </Voice31TextContext.Provider>
  );
};

export default Voice31TextProvider;
