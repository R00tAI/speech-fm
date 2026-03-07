import { NextResponse } from "next/server";
import {
  STORY_DRIVE_PROMPTS,
  VOICE31_RPG_SYSTEM_PROMPT,
  VOICE31_RPG_TOOLS,
  WORLD_DIFFICULTY_PROMPTS,
} from "@/lib/design-studio/voice31-rpg-tools";
import {
  VOICE31_SYSTEM_PROMPT,
  VOICE31_TOOLS,
} from "@/lib/design-studio/voice31-tools";

export const runtime = "nodejs";

const ELEVENLABS_API_BASE = "https://api.elevenlabs.io/v1/convai";

// Combine all tools - Voice31 core + RPG for full functionality
const ALL_VOICE31_TOOLS = [...VOICE31_TOOLS, ...VOICE31_RPG_TOOLS];

/**
 * Convert Voice31 tool definitions to ElevenLabs client tool format
 * ElevenLabs requires 'description' field on each parameter property
 * For arrays, we convert to comma-separated strings since ElevenLabs doesn't handle arrays well
 */
function convertToElevenLabsTools() {
  return ALL_VOICE31_TOOLS.map((tool) => {
    // Convert parameters to ensure each property has a description
    // For arrays, convert to string type with "_json" suffix hint
    const properties: Record<string, any> = {};
    const required: string[] = [];

    for (const [key, prop] of Object.entries(
      tool.parameters.properties || {},
    )) {
      const typedProp = prop as {
        type: string;
        description?: string;
        enum?: string[];
        items?: any;
      };

      if (typedProp.type === "array") {
        // Convert array params to string with _json suffix for complex arrays, or comma-separated hint
        const isComplexArray = typedProp.items?.type === "object";
        const newKey = isComplexArray ? `${key}_json` : key;
        properties[newKey] = {
          type: "string",
          description: isComplexArray
            ? `${typedProp.description || key} - Pass as JSON string`
            : `${typedProp.description || key} - Comma-separated values`,
        };
        // Update required array if needed
        if ((tool.parameters.required || []).includes(key)) {
          required.push(newKey);
        }
      } else if (typedProp.type === "object" && key !== "properties") {
        // Convert nested objects to JSON strings
        properties[`${key}_json`] = {
          type: "string",
          description: `${typedProp.description || key} - Pass as JSON string`,
        };
        if ((tool.parameters.required || []).includes(key)) {
          required.push(`${key}_json`);
        }
      } else {
        properties[key] = {
          type: typedProp.type,
          description: typedProp.description || `The ${key} parameter`,
          ...(typedProp.enum && { enum: typedProp.enum }),
        };
        if ((tool.parameters.required || []).includes(key)) {
          required.push(key);
        }
      }
    }

    return {
      type: "client",
      name: tool.name,
      description: tool.description,
      parameters: {
        type: "object",
        properties,
        required,
      },
      expects_response: true,
    };
  });
}

// Combined system prompt for Voice31 + RPG - the full personality
// Default difficulty: balanced drive, normal difficulty (overridden via session overrides)
const COMBINED_SYSTEM_PROMPT = `${VOICE31_SYSTEM_PROMPT}

=== RPG MODE ===
When RPG Mode is active (user says "start RPG", "enter RPG mode", etc.), you become an expert Game Master:

${VOICE31_RPG_SYSTEM_PROMPT}

${STORY_DRIVE_PROMPTS.balanced}

${WORLD_DIFFICULTY_PROMPTS.normal}`;

/**
 * POST /api/elevenlabs/sync-agent
 * Creates or updates the Voice31 ElevenLabs agent with all tools including RPG.
 * Accepts optional body params to override defaults:
 * {
 *   model?: string,           // LLM model (default: claude-sonnet-4-5)
 *   temperature?: number,     // 0-1 (default: 0.8)
 *   voiceId?: string,         // ElevenLabs voice ID (default: 4YYIPFl9wE5c4L2eu2Gb)
 *   firstMessage?: string,    // Agent greeting (default: built-in)
 *   systemPromptAppendix?: string, // Extra text appended to system prompt
 *   language?: string,        // Language code (default: en)
 *   name?: string,            // Agent display name (default: Voice31)
 * }
 */
export async function POST(request: Request) {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ELEVENLABS_API_KEY not configured" },
        { status: 500 },
      );
    }

    // Parse optional body overrides
    let body: {
      model?: string;
      temperature?: number;
      voiceId?: string;
      firstMessage?: string;
      systemPromptAppendix?: string;
      language?: string;
      name?: string;
    } = {};
    try {
      const text = await request.text();
      if (text.trim()) {
        body = JSON.parse(text);
      }
    } catch {
      // No body or invalid JSON — use defaults
    }

    const headers = {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
    };

    console.log("[ElevenLabs Sync] Starting agent sync for Voice31...");

    // First, check if we have an existing agent
    const existingAgentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;

    // Convert tools to ElevenLabs format
    const clientTools = convertToElevenLabsTools();

    // Add skip_turn system tool — allows agent to pause and wait for user
    const skipTurnTool = {
      type: "system" as const,
      name: "skip_turn",
      description:
        'Use when the user says "hold on", "give me a sec", "brb", or indicates they need a moment. Also use after your single gentle reminder if the user remains silent — skip your turn and wait quietly.',
    };

    const allTools = [...clientTools, skipTurnTool];
    console.log(
      "[ElevenLabs Sync] Prepared",
      allTools.length,
      "tools (",
      clientTools.length,
      "client +",
      1,
      "system)",
    );
    console.log(
      "[ElevenLabs Sync] Tools:",
      allTools.map((t) => t.name).join(", "),
    );

    // Build system prompt — base + optional appendix
    const finalSystemPrompt = body.systemPromptAppendix
      ? `${COMBINED_SYSTEM_PROMPT}\n\n=== CUSTOM CONFIGURATION ===\n${body.systemPromptAppendix}`
      : COMBINED_SYSTEM_PROMPT;

    // Build agent config - using overrides where provided
    const agentConfig = {
      name: body.name || "Voice31",
      conversation_config: {
        agent: {
          prompt: {
            prompt: finalSystemPrompt,
            llm: body.model || "claude-sonnet-4-5",
            tools: allTools,
            temperature: body.temperature ?? 0.8,
          },
          first_message:
            body.firstMessage ||
            "Hey! I'm Voice31, your CRT companion. What can I help you with today?",
          language: body.language || "en",
        },
        turn: {
          turn_timeout: 30, // Wait 30s (max) before re-engaging — stop nagging every 6s
          silence_end_call_timeout: -1, // Never auto-end call due to silence
          turn_eagerness: "normal" as const, // Balance between responsive and patient for RPG pacing
          soft_timeout_config: {
            timeout_seconds: -1, // Disable "hmm..." filler messages
            use_llm_generated_message: false,
          },
        },
        conversation: {
          max_duration_seconds: 1800, // 30 min max conversation (was default 600s/10min)
        },
        tts: {
          voice_id: body.voiceId || "4YYIPFl9wE5c4L2eu2Gb",
        },
      },
      platform_settings: {
        auth: {
          enable_auth: false, // Allow public access
        },
      },
    };

    let agentId: string;
    let isUpdate = false;

    if (existingAgentId) {
      // Try to update existing agent
      console.log(
        "[ElevenLabs Sync] Updating existing agent:",
        existingAgentId,
      );

      const updateRes = await fetch(
        `${ELEVENLABS_API_BASE}/agents/${existingAgentId}`,
        {
          method: "PATCH",
          headers,
          body: JSON.stringify(agentConfig),
        },
      );

      if (updateRes.ok) {
        const data = await updateRes.json();
        agentId = data.agent_id;
        isUpdate = true;
        console.log("[ElevenLabs Sync] Agent updated successfully");
      } else {
        const error = await updateRes.text();
        console.error("[ElevenLabs Sync] Failed to update agent:", error);
        // Fall through to create new
        console.log("[ElevenLabs Sync] Will create new agent instead");
      }
    }

    if (!isUpdate) {
      // Create new agent
      console.log("[ElevenLabs Sync] Creating new agent...");

      const createRes = await fetch(`${ELEVENLABS_API_BASE}/agents/create`, {
        method: "POST",
        headers,
        body: JSON.stringify(agentConfig),
      });

      if (!createRes.ok) {
        const error = await createRes.text();
        console.error("[ElevenLabs Sync] Failed to create agent:", error);
        return NextResponse.json(
          { error: "Failed to create agent", details: error },
          { status: createRes.status },
        );
      }

      const data = await createRes.json();
      agentId = data.agent_id;
      console.log("[ElevenLabs Sync] Agent created with ID:", agentId);
    }

    return NextResponse.json({
      success: true,
      message: isUpdate
        ? "Agent updated successfully"
        : "Agent created successfully",
      agent_id: agentId!,
      tools_count: allTools.length,
      instructions: `Add this to your .env.local: NEXT_PUBLIC_ELEVENLABS_AGENT_ID=${agentId}`,
    });
  } catch (error) {
    console.error("[ElevenLabs Sync] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to sync agent",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * GET /api/elevenlabs/sync-agent
 * Returns current agent status and tools
 */
export async function GET() {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ELEVENLABS_API_KEY not configured" },
        { status: 500 },
      );
    }

    const headers = {
      "xi-api-key": apiKey,
    };

    const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;

    if (!agentId) {
      return NextResponse.json({
        status: "not_configured",
        message:
          "No NEXT_PUBLIC_ELEVENLABS_AGENT_ID set. POST to this endpoint to create an agent.",
        coreTools: ALL_VOICE31_TOOLS.map((t) => t.name),
        totalTools: ALL_VOICE31_TOOLS.length,
      });
    }

    // Get agent details
    const agentRes = await fetch(`${ELEVENLABS_API_BASE}/agents/${agentId}`, {
      method: "GET",
      headers,
    });

    if (!agentRes.ok) {
      const error = await agentRes.text();
      return NextResponse.json(
        { error: "Failed to get agent", details: error },
        { status: agentRes.status },
      );
    }

    const agent = await agentRes.json();

    return NextResponse.json({
      status: "configured",
      agent_id: agentId,
      agent,
      coreTools: ALL_VOICE31_TOOLS.map((t) => t.name),
      totalTools: ALL_VOICE31_TOOLS.length,
    });
  } catch (error) {
    console.error("[ElevenLabs Sync] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to get status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
