"use client";

/**
 * Voice31 ElevenLabs Provider
 *
 * Alternative provider using ElevenLabs Conversational AI instead of Hume.
 * Uses the @elevenlabs/react SDK with clientTools for tool calling.
 */

import { useConversation } from "@elevenlabs/react";
import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  STORY_DRIVE_PROMPTS,
  WORLD_DIFFICULTY_PROMPTS,
} from "@/lib/design-studio/voice31-rpg-tools";
import { generateThinkingHint } from "./Voice31ProgressiveRenderer";
import { NPC_VOICE_LIBRARY, useVoice31RPGStore } from "./Voice31RPGStore";
import { createRPGToolHandler } from "./Voice31RPGTools";
import { useVoice31Store } from "./Voice31Store";
import {
  createVoice31ToolHandler,
  executeScheduledEvents,
} from "./Voice31Tools";

// =============================================================================
// CONFIG
// =============================================================================

// You'll need to create an agent in ElevenLabs dashboard and get its ID
// Set this in .env.local as NEXT_PUBLIC_ELEVENLABS_AGENT_ID
export const ELEVENLABS_AGENT_ID =
  process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || "";

// =============================================================================
// CONTEXT
// =============================================================================

interface StartConversationOptions {
  rpgContinue?: boolean;
}

interface Voice31ElevenLabsContextType {
  agentId: string;
  startConversation: (options?: StartConversationOptions) => Promise<void>;
  endConversation: () => Promise<void>;
  micMuted: boolean;
  setMicMuted: (muted: boolean) => void;
}

const Voice31ElevenLabsContext =
  createContext<Voice31ElevenLabsContextType | null>(null);

export const useVoice31ElevenLabs = () => {
  const ctx = useContext(Voice31ElevenLabsContext);
  if (!ctx) {
    throw new Error(
      "useVoice31ElevenLabs must be used within Voice31ElevenLabsProvider",
    );
  }
  return ctx;
};

// =============================================================================
// TOOL HANDLER WRAPPER
// =============================================================================

// Create tool handler instances
const toolHandler = createVoice31ToolHandler();
const rpgToolHandler = createRPGToolHandler();

// =============================================================================
// NPC VOICE SYNTHESIS
// =============================================================================

// Audio queue for NPC voices to prevent overlapping
const npcAudioQueue: Array<{ audio: HTMLAudioElement; npcName: string }> = [];
let isPlayingNPCVoice = false;

// Synthesize and play NPC voice using server-side proxy (keeps API key off client)
async function synthesizeNPCVoice(
  voiceId: string,
  text: string,
  npcName: string,
  emotion?: string,
): Promise<void> {
  try {
    const response = await fetch("/api/elevenlabs/npc-tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voiceId, text, emotion }),
    });

    if (!response.ok) {
      throw new Error(`NPC TTS proxy failed: ${response.status}`);
    }

    // Get audio blob and create audio element
    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);

    // Add to queue with NPC name for turn tracking
    npcAudioQueue.push({ audio, npcName });

    // Play queue if not already playing
    if (!isPlayingNPCVoice) {
      playNextNPCVoice();
    }
  } catch (error) {
    console.error("[Voice31-EL] NPC voice synthesis failed:", error);
  }
}

// Play the next NPC voice in queue
function playNextNPCVoice() {
  if (npcAudioQueue.length === 0) {
    isPlayingNPCVoice = false;
    // Signal turn management: NPC done speaking
    useVoice31Store.getState().setNpcAudioPlaying(false);
    // Clear speaking state for NPCs
    const rpgStore = useVoice31RPGStore.getState();
    const speakingNpc = rpgStore.activeScene.activeNPCs.find(
      (n) => n.isSpeaking,
    );
    if (speakingNpc) {
      rpgStore.stopNPCSpeaking(speakingNpc.id);
    }
    console.log("[Voice31-EL] NPC audio queue empty, turn released");
    return;
  }

  isPlayingNPCVoice = true;
  const { audio, npcName } = npcAudioQueue.shift()!;

  // Signal turn management: NPC is speaking
  useVoice31Store.getState().setTurnState("npc_speaking", npcName);
  useVoice31Store.getState().setNpcAudioPlaying(true);
  console.log(`[Voice31-EL] NPC "${npcName}" audio playing, turn locked`);

  audio.onended = () => {
    URL.revokeObjectURL(audio.src);
    playNextNPCVoice();
  };

  audio.onerror = () => {
    console.error("[Voice31-EL] NPC audio playback error");
    URL.revokeObjectURL(audio.src);
    playNextNPCVoice();
  };

  audio.play().catch((err) => {
    console.error("[Voice31-EL] Failed to play NPC audio:", err);
    playNextNPCVoice();
  });
}

// Get voice ID for an NPC from the voice library
function getNPCVoiceId(voiceType: string): string | null {
  const voiceProfile = NPC_VOICE_LIBRARY.find((v) => v.id === voiceType);
  return voiceProfile?.voiceId || null;
}

// Helper to parse comma-separated strings to arrays
const parseCommaSeparated = (str?: string): string[] => {
  if (!str) return [];
  return str
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
};

// Helper to parse JSON strings safely
const parseJSON = (str?: string): any => {
  if (!str) return null;
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
};

// Safe wrapper — prevents unhandled rejections from crashing the ElevenLabs WebSocket
async function safeTool(
  name: string,
  fn: () => Promise<string>,
): Promise<string> {
  try {
    return await fn();
  } catch (err) {
    console.error(`[Voice31-EL] Tool "${name}" threw:`, err);
    return JSON.stringify({
      success: false,
      message: `Tool error: ${err instanceof Error ? err.message : "unknown"}`,
    });
  }
}

// Build clientTools object for ElevenLabs SDK
// Each tool returns a string response that goes back to the agent
// Note: ElevenLabs doesn't support array params well, so we use comma-separated strings
// disabledTools: blocklist — tools in this list are blocked. Empty = all enabled.
const buildClientTools = () => {
  // Helper: wrap a tool so it checks enablement at call-time
  const gated = (
    name: string,
    fn: (...args: any[]) => Promise<string>,
  ): ((...args: any[]) => Promise<string>) => {
    return async (...args: any[]) => {
      // Re-read disabledTools from store at call time for live updates
      const currentDisabled =
        useVoice31Store.getState().assistantSettings.currentConfig.disabledTools;
      if (currentDisabled && currentDisabled.includes(name)) {
        return JSON.stringify({
          success: false,
          message: `The "${name}" tool is currently disabled by the user. Please inform the user this tool is not enabled in their settings.`,
        });
      }
      return fn(...args);
    };
  };

  const allTools: Record<string, (...args: any[]) => Promise<string>> = {
    // === VISUAL TOOLS ===
    show_text: async (params: { text: string; emotion?: string }) => {
      return safeTool("show_text", async () => {
        const result = await toolHandler.handleToolCall("show_text", params);
        return JSON.stringify(result);
      });
    },
    show_list: async (params: { items: string; title?: string }) =>
      safeTool("show_list", async () =>
        JSON.stringify(
          await toolHandler.handleToolCall("show_list", {
            items: parseCommaSeparated(params.items),
            title: params.title,
          }),
        ),
      ),
    show_image: async (params: { prompt: string; style?: string }) =>
      safeTool("show_image", async () =>
        JSON.stringify(await toolHandler.handleToolCall("show_image", params)),
      ),
    trigger_effect: async (params: {
      type: string;
      intensity?: number;
      duration?: number;
    }) =>
      safeTool("trigger_effect", async () =>
        JSON.stringify(
          await toolHandler.handleToolCall("trigger_effect", params),
        ),
      ),
    set_mood: async (params: { mood: string }) =>
      safeTool("set_mood", async () =>
        JSON.stringify(await toolHandler.handleToolCall("set_mood", params)),
      ),
    set_color: async (params: { color: string }) =>
      safeTool("set_color", async () =>
        JSON.stringify(await toolHandler.handleToolCall("set_color", params)),
      ),
    clear_display: async () =>
      safeTool("clear_display", async () =>
        JSON.stringify(await toolHandler.handleToolCall("clear_display", {})),
      ),
    show_wireframe: async (params: {
      type: string;
      labels?: string;
      duration?: number;
    }) =>
      safeTool("show_wireframe", async () =>
        JSON.stringify(
          await toolHandler.handleToolCall("show_wireframe", {
            type: params.type,
            labels: parseCommaSeparated(params.labels),
            duration: params.duration,
          }),
        ),
      ),
    show_visualization: async (params: {
      type: string;
      title?: string;
      duration?: number;
    }) =>
      safeTool("show_visualization", async () =>
        JSON.stringify(
          await toolHandler.handleToolCall("show_visualization", params),
        ),
      ),
    show_smart_diagram: async (params: {
      topic: string;
      context?: string;
      complexity?: string;
      labels?: string;
    }) =>
      safeTool("show_smart_diagram", async () =>
        JSON.stringify(
          await toolHandler.handleToolCall("show_smart_diagram", {
            topic: params.topic,
            context: params.context,
            complexity: params.complexity,
            labels: parseCommaSeparated(params.labels),
          }),
        ),
      ),
    schedule_visual_sequence: async (params: {
      name: string;
      events_json: string;
    }) =>
      safeTool("schedule_visual_sequence", async () =>
        JSON.stringify(
          await toolHandler.handleToolCall("schedule_visual_sequence", {
            name: params.name,
            events: parseJSON(params.events_json) || [],
            auto_play: true,
          }),
        ),
      ),

    // === WEB TOOLS ===
    search_web: async (params: { query: string; num_results?: number }) =>
      safeTool("search_web", async () =>
        JSON.stringify(await toolHandler.handleToolCall("search_web", params)),
      ),
    fetch_article: async (params: { url: string }) =>
      safeTool("fetch_article", async () =>
        JSON.stringify(
          await toolHandler.handleToolCall("fetch_article", params),
        ),
      ),
    read_search_result: async (params: { url: string; title?: string }) =>
      safeTool("read_search_result", async () =>
        JSON.stringify(
          await toolHandler.handleToolCall("read_search_result", params),
        ),
      ),

    // === PROGRESSIVE DIAGRAM TOOLS ===
    show_progressive_diagram: async (params: {
      title: string;
      nodes_json: string;
      style?: string;
      auto_advance?: boolean;
    }) =>
      safeTool("show_progressive_diagram", async () =>
        JSON.stringify(
          await toolHandler.handleToolCall("show_progressive_diagram", {
            title: params.title,
            nodes: parseJSON(params.nodes_json) || [],
            style: params.style,
            auto_advance: params.auto_advance,
          }),
        ),
      ),
    advance_diagram: async (params: { highlight_node?: string }) =>
      safeTool("advance_diagram", async () =>
        JSON.stringify(
          await toolHandler.handleToolCall("advance_diagram", params || {}),
        ),
      ),
    clear_diagram: async () =>
      safeTool("clear_diagram", async () =>
        JSON.stringify(await toolHandler.handleToolCall("clear_diagram", {})),
      ),

    // === CANVAS TOOLS ===
    add_character_rig: async (params: {
      character_description: string;
      style?: string;
      name?: string;
    }) =>
      safeTool("add_character_rig", async () =>
        JSON.stringify(
          await toolHandler.handleToolCall("add_character_rig", params),
        ),
      ),
    add_to_canvas: async (params: {
      element_type: string;
      content?: string;
      name?: string;
      position_x?: number;
      position_y?: number;
    }) =>
      safeTool("add_to_canvas", async () =>
        JSON.stringify(
          await toolHandler.handleToolCall("add_to_canvas", {
            element_type: params.element_type,
            content: params.content,
            name: params.name,
            position:
              params.position_x !== undefined
                ? { x: params.position_x, y: params.position_y }
                : undefined,
          }),
        ),
      ),
    generate_image_for_canvas: async (params: {
      prompt: string;
      style?: string;
      name?: string;
    }) =>
      safeTool("generate_image_for_canvas", async () =>
        JSON.stringify(
          await toolHandler.handleToolCall("generate_image_for_canvas", params),
        ),
      ),

    // === VISUAL STORYTELLING ===
    start_visual_story: async (params: { question: string }) =>
      safeTool("start_visual_story", async () =>
        JSON.stringify(
          await toolHandler.handleToolCall("start_visual_story", params),
        ),
      ),

    // === CODE GENERATION TOOLS ===
    generate_code_display: async (params: {
      prompt: string;
      fullscreen?: boolean;
    }) =>
      safeTool("generate_code_display", async () =>
        JSON.stringify(
          await toolHandler.handleToolCall("generate_code_display", params),
        ),
      ),
    generate_visual_with_image: async (params: {
      image_prompt: string;
      layout_prompt: string;
      fullscreen?: boolean;
    }) =>
      safeTool("generate_visual_with_image", async () =>
        JSON.stringify(
          await toolHandler.handleToolCall(
            "generate_visual_with_image",
            params,
          ),
        ),
      ),

    // === MEMORY & NOTES TOOLS ===
    remember: async (params: { content: string; category?: string }) =>
      safeTool("remember", async () =>
        JSON.stringify(await toolHandler.handleToolCall("remember", params)),
      ),
    create_note: async (params: { title: string; content?: string }) =>
      safeTool("create_note", async () =>
        JSON.stringify(await toolHandler.handleToolCall("create_note", params)),
      ),
    update_note: async (params: { content: string }) =>
      safeTool("update_note", async () =>
        JSON.stringify(await toolHandler.handleToolCall("update_note", params)),
      ),
    show_notes: async () =>
      safeTool("show_notes", async () =>
        JSON.stringify(await toolHandler.handleToolCall("show_notes", {})),
      ),
    list_memories: async () =>
      safeTool("list_memories", async () =>
        JSON.stringify(await toolHandler.handleToolCall("list_memories", {})),
      ),

    // === WEATHER TOOL ===
    show_weather: async (params: { location: string }) =>
      safeTool("show_weather", async () =>
        JSON.stringify(await toolHandler.handleToolCall("show_weather", params)),
      ),

    // === BROWSER AUTOMATION TOOLS ===
    browse_web: async (params: { instruction: string; url?: string }) =>
      safeTool("browse_web", async () =>
        JSON.stringify(await toolHandler.handleToolCall("browse_web", params)),
      ),
    extract_web_data: async (params: { url: string; what: string }) =>
      safeTool("extract_web_data", async () =>
        JSON.stringify(await toolHandler.handleToolCall("extract_web_data", params)),
      ),

    // === RPG MODE TOOLS ===
    set_scene: async (params: {
      location_name: string;
      background_prompt: string;
      ambient_effect?: string;
      transition?: string;
      theme?: string;
    }) =>
      safeTool("set_scene", async () =>
        JSON.stringify(
          await rpgToolHandler.handleToolCall("set_scene", params),
        ),
      ),
    show_npc: async (params: {
      name: string;
      portrait_prompt: string;
      voice_type?: string;
      voice_id?: string;
      title?: string;
      position?: string;
      relationship?: number;
      race?: string;
      personality?: string;
      gender?: string;
      age?: string;
      accent?: string;
      archetype?: string;
      description?: string;
    }) =>
      safeTool("show_npc", async () =>
        JSON.stringify(await rpgToolHandler.handleToolCall("show_npc", params)),
      ),
    npc_speak: async (params: {
      npc_id: string;
      dialogue: string;
      emotion?: string;
    }) =>
      safeTool("npc_speak", async () => {
        // Strip any audio tags from dialogue for display (tags are for TTS only)
        const displayDialogue = params.dialogue.replace(/\[.*?\]\s*/g, "");
        const result = await rpgToolHandler.handleToolCall("npc_speak", {
          ...params,
          dialogue: displayDialogue,
        });
        const rpgStore = useVoice31RPGStore.getState();
        if (rpgStore.rpgModeActive) {
          const npc = rpgStore.activeScene.activeNPCs.find(
            (n) =>
              n.id === params.npc_id ||
              n.name.toLowerCase() === params.npc_id.toLowerCase(),
          );
          if (npc && npc.voiceId) {
            // Send full text (with any inline tags) to TTS; server adds emotion tags
            synthesizeNPCVoice(
              npc.voiceId,
              params.dialogue,
              npc.name,
              params.emotion,
            );
          } else if (npc && !npc.voiceId) {
            console.warn(
              `[ElevenLabs] NPC "${npc.name}" has no voiceId — skipping voice synthesis. Voice type: ${npc.voiceType}`,
            );
          } else {
            console.warn(
              `[ElevenLabs] NPC "${params.npc_id}" not found in active NPCs. Active: ${rpgStore.activeScene.activeNPCs.map((n) => n.id).join(", ")}`,
            );
          }
        }
        // Tell the agent to wait for NPC speech to finish before continuing
        // This is the key to preventing the "talking over" problem
        const enhanced = {
          ...result,
          instructions: `${(result as any).context?.npcName || "NPC"} is now speaking their dialogue aloud to the player. Wait silently for them to finish before speaking or narrating. Do NOT speak, narrate, or ask the player anything until the NPC has finished. The NPC audio takes several seconds to play.`,
        };
        return JSON.stringify(enhanced);
      }),
    dismiss_npc: async (params: { npc_id: string }) =>
      safeTool("dismiss_npc", async () =>
        JSON.stringify(
          await rpgToolHandler.handleToolCall("dismiss_npc", params),
        ),
      ),
    dismiss_all_npcs: async () =>
      safeTool("dismiss_all_npcs", async () =>
        JSON.stringify(
          await rpgToolHandler.handleToolCall("dismiss_all_npcs", {}),
        ),
      ),
    update_player_stats: async (params: {
      health_change?: number;
      mana_change?: number;
      exp_gain?: number;
    }) =>
      safeTool("update_player_stats", async () =>
        JSON.stringify(
          await rpgToolHandler.handleToolCall("update_player_stats", params),
        ),
      ),
    give_item: async (params: {
      item_name: string;
      item_type: string;
      description: string;
      rarity?: string;
      quantity?: number;
      value?: number;
    }) =>
      safeTool("give_item", async () =>
        JSON.stringify(
          await rpgToolHandler.handleToolCall("give_item", params),
        ),
      ),
    give_gold: async (params: { amount: number }) =>
      safeTool("give_gold", async () =>
        JSON.stringify(
          await rpgToolHandler.handleToolCall("give_gold", params),
        ),
      ),
    add_quest: async (params: {
      name: string;
      description: string;
      giver_name?: string;
    }) =>
      safeTool("add_quest", async () =>
        JSON.stringify(
          await rpgToolHandler.handleToolCall("add_quest", params),
        ),
      ),
    update_quest: async (params: {
      quest_id: string;
      status?: string;
      objective_id?: string;
      progress?: number;
    }) =>
      safeTool("update_quest", async () =>
        JSON.stringify(
          await rpgToolHandler.handleToolCall("update_quest", params),
        ),
      ),
    show_choices: async (params: { prompt?: string; choices_json: string }) =>
      safeTool("show_choices", async () =>
        JSON.stringify(
          await rpgToolHandler.handleToolCall("show_choices", {
            prompt: params.prompt,
            choices: parseJSON(params.choices_json) || [],
          }),
        ),
      ),
    log_story_event: async (params: {
      type: string;
      summary: string;
      full_text: string;
      important?: boolean;
    }) =>
      safeTool("log_story_event", async () =>
        JSON.stringify(
          await rpgToolHandler.handleToolCall("log_story_event", params),
        ),
      ),
    roll_dice: async (params: { dice: string; purpose: string; dc?: number }) =>
      safeTool("roll_dice", async () =>
        JSON.stringify(
          await rpgToolHandler.handleToolCall("roll_dice", params),
        ),
      ),
    start_combat: async (params: { enemies_json: string }) =>
      safeTool("start_combat", async () =>
        JSON.stringify(
          await rpgToolHandler.handleToolCall("start_combat", {
            enemies: parseJSON(params.enemies_json) || [],
          }),
        ),
      ),
    end_combat: async (params: { victory: boolean }) =>
      safeTool("end_combat", async () =>
        JSON.stringify(
          await rpgToolHandler.handleToolCall("end_combat", params),
        ),
      ),
    update_relationship: async (params: { npc_id: string; change: number }) =>
      safeTool("update_relationship", async () =>
        JSON.stringify(
          await rpgToolHandler.handleToolCall("update_relationship", params),
        ),
      ),
    set_flag: async (params: { key: string; value: string }) =>
      safeTool("set_flag", async () =>
        JSON.stringify(await rpgToolHandler.handleToolCall("set_flag", params)),
      ),
    save_game: async (params?: { slot_name?: string }) =>
      safeTool("save_game", async () =>
        JSON.stringify(
          await rpgToolHandler.handleToolCall("save_game", params || {}),
        ),
      ),
    play_sfx: async (params: { sfx: string }) =>
      safeTool("play_sfx", async () =>
        JSON.stringify(await rpgToolHandler.handleToolCall("play_sfx", params)),
      ),
    set_narration: async (params: { text: string }) =>
      safeTool("set_narration", async () =>
        JSON.stringify(
          await rpgToolHandler.handleToolCall("set_narration", params),
        ),
      ),
    check_flag: async (params: { key: string }) =>
      safeTool("check_flag", async () =>
        JSON.stringify(
          await rpgToolHandler.handleToolCall("check_flag", params),
        ),
      ),
    update_scene_background: async (params: {
      background_prompt: string;
      reason?: string;
    }) =>
      safeTool("update_scene_background", async () =>
        JSON.stringify(
          await rpgToolHandler.handleToolCall(
            "update_scene_background",
            params,
          ),
        ),
      ),
  };

  // Wrap every tool with the enablement gate
  const gatedTools: Record<string, (...args: any[]) => Promise<string>> = {};
  for (const [name, fn] of Object.entries(allTools)) {
    gatedTools[name] = gated(name, fn);
  }
  return gatedTools;
};

// =============================================================================
// VOICE26 ELEVENLABS PROVIDER
// =============================================================================

interface Voice31ElevenLabsProviderProps {
  children: React.ReactNode;
  agentId?: string;
}

export const Voice31ElevenLabsProvider: React.FC<
  Voice31ElevenLabsProviderProps
> = ({ children, agentId = ELEVENLABS_AGENT_ID }) => {
  const setConnected = useVoice31Store((s) => s.setConnected);
  const setListening = useVoice31Store((s) => s.setListening);
  const setSpeaking = useVoice31Store((s) => s.setSpeaking);
  const setUserTranscript = useVoice31Store((s) => s.setUserTranscript);
  const setAssistantText = useVoice31Store((s) => s.setAssistantText);
  const setVisualizerData = useVoice31Store((s) => s.setVisualizerData);

  const prevModeRef = useRef<string>("");
  const clientTools = useRef(buildClientTools());
  const thinkingStartRef = useRef<number>(0); // Track when thinking starts for TTFB
  const [micMuted, setMicMuted] = useState(false);

  const conversation = useConversation({
    clientTools: clientTools.current,
    micMuted,
    onConnect: () => {
      console.log("[Voice31-EL] ✅ Connected successfully");
      setConnected(true);
      // Re-hydrate notes on every new session to ensure persistence
      useVoice31Store.getState().hydrateNotesFromDB();
    },
    onDisconnect: (details) => {
      console.warn(
        "[Voice31-EL] ❌ Disconnected:",
        JSON.stringify(details, null, 2),
      );
      setConnected(false);
      setListening(false);
      setSpeaking(false);
      useVoice31Store.getState().setThinking(false);
    },
    onMessage: (message) => {
      console.log(
        "[Voice31-EL] 💬 Message:",
        message.source,
        message.message?.substring(0, 50),
      );

      // Handle transcriptions
      if (message.source === "user" && message.message) {
        setUserTranscript(message.message);

        // Track user query for context-aware thinking hints
        useVoice31Store.getState().setLastUserQuery(message.message);
        const hint = generateThinkingHint(message.message);
        if (hint) {
          useVoice31Store.getState().setBufferingPhase("receiving", hint);
        }

        const text = message.message.toLowerCase().trim();
        const rpgStore = useVoice31RPGStore.getState();

        // Phase 3A: Auto-enter RPG mode when user says RPG-related keywords
        if (!rpgStore.rpgModeActive) {
          const rpgKeywords = [
            "rpg",
            "roleplay",
            "role play",
            "dungeon",
            "quest",
            "adventure",
            "campaign",
            "d&d",
            "dungeons and dragons",
            "fantasy game",
            "let's play",
            "start a game",
            "play a game",
            "tabletop",
            "character creation",
            "create a character",
            "roll a character",
          ];
          const hasRPGIntent = rpgKeywords.some((kw) => text.includes(kw));
          if (hasRPGIntent) {
            console.log("[Voice31-EL] RPG intent detected, enabling RPG mode");
            rpgStore.enableRPGMode();
            if (rpgStore.savedGames.length === 0) {
              rpgStore.setShowCharacterCreator(true);
            }
          }
        }

        // Phase 3B: Voice dialogue selection
        if (
          rpgStore.rpgModeActive &&
          rpgStore.activeScene.showingDialogueOptions
        ) {
          const options = rpgStore.activeScene.dialogueOptions;
          const numberWords: Record<string, number> = {
            one: 1,
            two: 2,
            three: 3,
            four: 4,
            five: 5,
            "1": 1,
            "2": 2,
            "3": 3,
            "4": 4,
            "5": 5,
            first: 1,
            second: 2,
            third: 3,
            fourth: 4,
            fifth: 5,
          };

          // Try number match first
          let matchedIndex = -1;
          for (const [word, num] of Object.entries(numberWords)) {
            if (text.includes(word) && num <= options.length) {
              matchedIndex = num - 1;
              break;
            }
          }

          // Try partial text content match
          if (matchedIndex === -1) {
            for (let i = 0; i < options.length; i++) {
              const optionWords = options[i].text.toLowerCase().split(/\s+/);
              const matchCount = optionWords.filter((w) =>
                text.includes(w),
              ).length;
              if (
                matchCount >= 2 ||
                (optionWords.length <= 3 && matchCount >= 1)
              ) {
                matchedIndex = i;
                break;
              }
            }
          }

          if (matchedIndex >= 0 && !options[matchedIndex].disabled) {
            console.log(
              "[Voice31-EL] Voice dialogue match:",
              options[matchedIndex].text,
            );
            rpgStore.selectDialogueOption(options[matchedIndex].id);
          }
        }

        // Phase 3C: Voice character creation
        if (
          rpgStore.characterCreatorStep !== null &&
          rpgStore.characterCreatorStep !== undefined
        ) {
          rpgStore.advanceCharacterCreation(message.message);
        }
      }

      if (message.source === "ai" && message.message) {
        const fullContent = message.message;
        const rpgActive = useVoice31RPGStore.getState().rpgModeActive;

        // In RPG mode, skip the kinetic text display - RPG scene layers handle visuals
        if (!rpgActive) {
          // showText will auto-route to overlayText if visual content is active
          const showText = useVoice31Store.getState().showText;
          showText(fullContent);
        }

        // Also set the abbreviated version for status display
        setAssistantText(fullContent.slice(0, 20).toUpperCase() || "VOICE26");
      }
    },
    onError: (error) => {
      console.error("[Voice31-EL] ⚠️ Error:", error);
      console.error(
        "[Voice31-EL] Error details:",
        JSON.stringify(error, null, 2),
      );
    },
    onStatusChange: (status) => {
      console.log("[Voice31-EL] 📊 Status changed:", status);
      setConnected(status === "connected");
    },
    onModeChange: (mode) => {
      console.log("[Voice31-EL] 🎤 Mode:", mode.mode);

      const wasSpeaking = prevModeRef.current === "speaking";
      const wasListening = prevModeRef.current === "listening";
      const nowSpeaking = mode.mode === "speaking";
      const nowListening = mode.mode === "listening";

      // Turn management: Check if NPC is currently speaking
      const { npcAudioPlaying } = useVoice31Store.getState();

      // If NPC is speaking and the assistant tries to speak,
      // suppress the assistant's speaking state to avoid "talking over"
      if (npcAudioPlaying && nowSpeaking) {
        console.log(
          "[Voice31-EL] 🚫 Suppressing assistant speech - NPC is speaking",
        );
        // Don't update speaking state, let NPC finish
        // The assistant audio will still play from ElevenLabs but we suppress the UI state
        // This helps because the agent is instructed to wait, and any brief overlap is minimized
        setSpeaking(false);
        setListening(false);
        prevModeRef.current = mode.mode;
        return;
      }

      setSpeaking(nowSpeaking);
      setListening(nowListening);

      // Update turn state
      if (nowSpeaking && !npcAudioPlaying) {
        useVoice31Store.getState().setTurnState("assistant_speaking", "DM");
      } else if (nowListening) {
        useVoice31Store.getState().setTurnState("user_speaking", "Player");
      } else if (!(nowSpeaking || nowListening || npcAudioPlaying)) {
        useVoice31Store.getState().setTurnState("idle", null);
      }

      // THINKING STATE: fires when user stops talking, clears when AI starts
      if (wasListening && !nowListening && !nowSpeaking) {
        useVoice31Store.getState().setThinking(true);
        // Start tracking latency — record when thinking begins
        thinkingStartRef.current = Date.now();
        useVoice31Store.getState().setBufferingPhase("processing");
        useVoice31Store.getState().setAudioBuffering(true);
      }
      if (!wasSpeaking && nowSpeaking && !npcAudioPlaying) {
        useVoice31Store.getState().setThinking(false);
        // Calculate audio TTFB — time from thinking start to first audio
        if (thinkingStartRef.current > 0) {
          const ttfb = Date.now() - thinkingStartRef.current;
          useVoice31Store.getState().setAudioTTFB(ttfb);
          console.log(`[Voice31-EL] Audio TTFB: ${ttfb}ms`);
          thinkingStartRef.current = 0;
        }
        useVoice31Store.getState().setBufferingPhase("idle");
        useVoice31Store.getState().setAudioBuffering(false);
      }

      // Fire visual triggers on state changes
      if (!wasSpeaking && nowSpeaking && !npcAudioPlaying) {
        executeScheduledEvents("on_speech_start");
      } else if (wasSpeaking && !nowSpeaking) {
        executeScheduledEvents("on_speech_end");
      }

      if (!wasListening && nowListening) {
        executeScheduledEvents("on_user_speaking");
      } else if (wasListening && !nowListening && !nowSpeaking) {
        executeScheduledEvents("on_silence");
      }

      prevModeRef.current = mode.mode;
    },
    onUnhandledClientToolCall: (toolCall) => {
      console.warn("[Voice31-EL] Unhandled tool call:", toolCall);
    },
  });

  // Generate visualizer data
  useEffect(() => {
    const interval = setInterval(() => {
      const { isSpeaking, isListening, isThinking } =
        useVoice31Store.getState();
      let data: number[];
      if (isSpeaking) {
        data = Array.from({ length: 16 }, () => Math.random() * 0.9 + 0.1);
      } else if (isThinking) {
        // Smooth sine wave pulse — feels alive, not random
        const t = Date.now() * 0.003;
        data = Array.from({ length: 16 }, (_, i) => {
          const wave = Math.sin(t + i * 0.4) * 0.5 + 0.5;
          return wave * 0.5 + 0.1; // Range 0.1-0.6, smooth pulse
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

  const startConversation = useCallback(
    async (options?: StartConversationOptions) => {
      if (!agentId) {
        console.error("[Voice31-EL] No agent ID configured");
        return;
      }

      console.log(
        "[Voice31-EL] 🚀 Starting conversation with agent:",
        agentId,
        options?.rpgContinue ? "(RPG Continue)" : "",
      );
      console.log("[Voice31-EL] Current status:", conversation.status);

      // Read user's assistant settings for session overrides
      const userSettings =
        useVoice31Store.getState().assistantSettings.currentConfig;
      const userPersonality = userSettings.personality;
      const userVoice = userSettings.voice;

      // Build session overrides — layer user settings, then RPG on top
      let sessionOverrides: Record<string, unknown> | undefined;

      // --- Layer 1: User personality/voice settings ---
      {
        const agentOverride: Record<string, unknown> = {};
        let promptAppendix = "";

        // Custom system prompt — append to agent baseline
        if (
          userPersonality.systemPrompt &&
          userPersonality.systemPrompt.trim().length > 0
        ) {
          promptAppendix += `\n\n=== USER CUSTOMIZATION ===\n${userPersonality.systemPrompt}`;
        }

        // Personality traits — inject as behavioral guidance
        if (userPersonality.traits && userPersonality.traits.length > 0) {
          promptAppendix += `\n\nKey personality traits to embody: ${userPersonality.traits.join(", ")}.`;
        }

        // Personality type shorthand
        if (
          userPersonality.personality &&
          userPersonality.personality !== "custom"
        ) {
          const personalityGuide: Record<string, string> = {
            professional:
              "Maintain a professional, concise, and business-appropriate tone.",
            friendly:
              "Be warm, approachable, and conversational. Use casual language.",
            creative:
              "Be imaginative and expressive. Use vivid language and creative metaphors.",
            technical:
              "Be precise and technical. Use accurate terminology and provide detailed explanations.",
          };
          if (personalityGuide[userPersonality.personality]) {
            promptAppendix += `\n\n${personalityGuide[userPersonality.personality]}`;
          }
        }

        // Custom greeting — inject as prompt instruction since firstMessage
        // override requires explicit agent-level config permission
        if (
          userPersonality.greeting &&
          userPersonality.greeting.trim().length > 0
        ) {
          promptAppendix += `\n\nIMPORTANT: When starting a conversation, greet the user with: "${userPersonality.greeting}"`;
        }

        // Note: prompt override requires agent-level permission in ElevenLabs
        // Security tab. Attempting it without permission causes WebSocket
        // disconnect (closeCode 1008). Personality/greeting injections are
        // handled via the sync-agent route instead.
        if (promptAppendix) {
          console.log(
            "[Voice31-EL] Prompt appendix ready (applied via sync-agent, not session override):",
            promptAppendix.slice(0, 100),
          );
        }

        // Custom voice — voiceId override requires explicit agent-level
        // permission (same as firstMessage). Attempting it without permission
        // causes WebSocket disconnect (closeCode 1008, override_error).
        // Voice changes must be applied via the sync-agent route or by
        // enabling the "Voice ID" override in the ElevenLabs agent Security tab.
        if (userVoice.voiceId && userVoice.voiceId.trim().length > 0) {
          console.log(
            "[Voice31-EL] Custom voiceId configured:",
            userVoice.voiceId,
            "(applied via sync-agent, not session override)",
          );
        }

        if (Object.keys(agentOverride).length > 0) {
          sessionOverrides = {
            agent: agentOverride,
          };
          console.log("[Voice31-EL] User settings overrides applied:", {
            hasPrompt: !!promptAppendix,
          });
        }
      }

      // --- Layer 2: RPG mode overrides (take precedence) ---
      {
        const rpgStore = useVoice31RPGStore.getState();
        const rpgActive = rpgStore.rpgModeActive;
        const saveFile = rpgStore.currentSaveFile;

        if (rpgActive && saveFile) {
          const settings = saveFile.settings;
          const storyDrive = settings?.storyDriveLevel || "balanced";
          const difficulty = settings?.worldDifficulty || "normal";

          // Dynamic prompt appendix based on RPG settings
          const drivePrompt = STORY_DRIVE_PROMPTS[storyDrive] || "";
          const difficultyPrompt = WORLD_DIFFICULTY_PROMPTS[difficulty] || "";
          const rpgPromptAppendix = `\n\n${drivePrompt}\n\n${difficultyPrompt}`;

          // Merge RPG prompt with any existing user prompt override
          const existingPrompt = (
            sessionOverrides?.agent as Record<string, unknown>
          )?.prompt;
          const existingPromptText =
            (existingPrompt as Record<string, unknown>)?.prompt || "";
          const mergedPrompt = `${existingPromptText}${rpgPromptAppendix}`;

          if (options?.rpgContinue) {
            const playerName = saveFile.playerName || "Adventurer";
            const playerClass = saveFile.playerClass || "unknown";
            const playerLevel = saveFile.playerStats?.level || 1;
            const lastScene =
              rpgStore.activeScene.locationName || "unknown location";
            const recentEvents = (saveFile.storyLog || [])
              .slice(-3)
              .map((e: { summary?: string }) => e.summary)
              .filter(Boolean)
              .join("; ");

            const levelInfo =
              playerLevel > 1
                ? ` You're a level ${playerLevel} ${playerClass}.`
                : "";
            const recentInfo = recentEvents
              ? ` Recently: ${recentEvents}.`
              : "";

            // Inject RPG continue context into prompt (not firstMessage — that requires agent-level override permission)
            const continueContext = `\n\nIMPORTANT: This is a CONTINUING session. The player is ${playerName}.${levelInfo} Last location: ${lastScene}.${recentInfo} Welcome them back and resume the adventure.`;

            // Note: prompt override requires agent-level permission in ElevenLabs
            // Security tab — cannot inject via session overrides without 1008 disconnect.
            // RPG context is logged for debugging; apply via sync-agent route for runtime injection.
            console.log("[Voice31-EL] RPG Continue context ready (not session override):", {
              storyDrive,
              difficulty,
              playerName,
              promptLength: (mergedPrompt + continueContext).length,
            });
          } else {
            // New RPG session — prompt override not allowed via session overrides.
            console.log("[Voice31-EL] RPG session context ready (not session override):", {
              storyDrive,
              difficulty,
              promptLength: mergedPrompt.length,
            });
          }
        }
      }

      try {
        // First try to get a signed URL for authenticated connection
        console.log("[Voice31-EL] 🔑 Fetching signed URL...");
        const signedUrlResponse = await fetch("/api/elevenlabs/signed-url");

        if (signedUrlResponse.ok) {
          const data = await signedUrlResponse.json();
          console.log("[Voice31-EL] ✅ Got signed URL");
          console.log("[Voice31-EL] 📞 Starting session...");
          const conversationId = await conversation.startSession({
            signedUrl: data.signedUrl,
            ...(sessionOverrides ? { overrides: sessionOverrides } : {}),
          });
          console.log(
            "[Voice31-EL] ✅ Session started, conversationId:",
            conversationId,
          );
        } else {
          // Fallback to direct agent ID (for public agents)
          const errorText = await signedUrlResponse.text();
          console.log(
            "[Voice31-EL] ⚠️ Signed URL failed:",
            signedUrlResponse.status,
            errorText,
          );
          console.log("[Voice31-EL] 📞 Trying direct agentId...");
          const conversationId = await conversation.startSession({
            agentId,
            ...(sessionOverrides ? { overrides: sessionOverrides } : {}),
          });
          console.log(
            "[Voice31-EL] ✅ Session started with agentId, conversationId:",
            conversationId,
          );
        }
      } catch (error) {
        console.error("[Voice31-EL] ❌ Failed to start conversation:", error);
        if (error instanceof Error) {
          console.error("[Voice31-EL] Error message:", error.message);
          console.error("[Voice31-EL] Error stack:", error.stack);
        }
      }
    },
    [agentId, conversation],
  );

  const endConversation = useCallback(async () => {
    console.log("[Voice31-EL] Ending conversation");
    await conversation.endSession();
  }, [conversation]);

  // Auto-start if we have an agent ID
  useEffect(() => {
    if (agentId && conversation.status === "disconnected") {
      // Don't auto-start, let user initiate
      console.log("[Voice31-EL] Ready to connect, agent ID:", agentId);
    }
  }, [agentId, conversation.status]);

  const contextValue: Voice31ElevenLabsContextType = {
    agentId,
    startConversation,
    endConversation,
    micMuted,
    setMicMuted,
  };

  if (!agentId) {
    return (
      <div className="flex items-center justify-center h-full bg-black">
        <div className="text-red-500 font-mono text-sm">
          ERROR: ELEVENLABS_AGENT_ID not configured
        </div>
      </div>
    );
  }

  return (
    <Voice31ElevenLabsContext.Provider value={contextValue}>
      {children}
    </Voice31ElevenLabsContext.Provider>
  );
};

export default Voice31ElevenLabsProvider;
