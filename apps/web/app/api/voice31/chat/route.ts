import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  VOICE31_SYSTEM_PROMPT,
  VOICE31_TOOLS,
} from "@/lib/design-studio/voice31-tools";

export const runtime = "nodejs";
export const maxDuration = 60;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Convert Voice31 tools to Anthropic format
function convertToolsToAnthropic() {
  return VOICE31_TOOLS.map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: tool.parameters as Anthropic.Tool["input_schema"],
  }));
}

/**
 * POST /api/voice31/chat
 * Text chat endpoint — mirrors the FAL conversation route but accepts text instead of audio.
 * Calls Claude with Voice31 system prompt + tools, returns text + tool_calls + optional TTS.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, history, ttsEnabled } = body as {
      message: string;
      history?: Anthropic.MessageParam[];
      ttsEnabled?: boolean;
    };

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 },
      );
    }

    // Build conversation history (sliding window of 20 messages)
    let messages: Anthropic.MessageParam[] = [];
    if (history && Array.isArray(history)) {
      messages = history.slice(-20);
    }

    // Add user message
    messages.push({ role: "user", content: message.trim() });

    // Call Claude
    console.log("[Voice31 Chat] Calling Claude with", messages.length, "messages");
    const claudeResponse = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: VOICE31_SYSTEM_PROMPT,
      tools: convertToolsToAnthropic(),
      messages,
    });

    // Extract text and tool calls
    let assistantText = "";
    const toolCalls: Array<{ name: string; input: Record<string, unknown> }> =
      [];

    for (const block of claudeResponse.content) {
      if (block.type === "text") {
        assistantText += block.text;
      } else if (block.type === "tool_use") {
        toolCalls.push({
          name: block.name,
          input: block.input as Record<string, unknown>,
        });
      }
    }

    console.log(
      "[Voice31 Chat] Response:",
      assistantText.substring(0, 100),
      "| Tools:",
      toolCalls.length,
    );

    // Optional TTS via FAL F5-TTS
    let audioUrl: string | null = null;
    if (ttsEnabled && assistantText && assistantText.trim().length > 0) {
      try {
        const { fal } = await import("@fal-ai/client");
        fal.config({ credentials: process.env.FAL_KEY });

        const ttsResult = await fal.subscribe("fal-ai/f5-tts", {
          input: {
            gen_text: assistantText,
            ref_audio_url:
              "https://storage.googleapis.com/falserverless/example_inputs/reference_audio.wav",
            ref_text:
              "Some call me nature, others call me mother nature.",
            model_type: "F5-TTS",
            remove_silence: true,
          },
        });

        audioUrl =
          (ttsResult.data as any).audio_url?.url ||
          (ttsResult.data as any).audio_url ||
          null;
      } catch (ttsError) {
        console.error("[Voice31 Chat] TTS failed (non-fatal):", ttsError);
      }
    }

    // Add assistant message to history for return
    messages.push({
      role: "assistant",
      content: claudeResponse.content,
    });

    return NextResponse.json({
      assistant_text: assistantText,
      tool_calls: toolCalls,
      audio_url: audioUrl,
      history: messages.slice(-20),
      stop_reason: claudeResponse.stop_reason,
    });
  } catch (error) {
    console.error("[Voice31 Chat] Error:", error);
    return NextResponse.json(
      {
        error: "Chat failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
