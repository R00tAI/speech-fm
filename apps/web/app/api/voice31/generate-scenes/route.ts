import { streamText } from "ai";
import type { NextRequest } from "next/server";
import { gateway } from "@/lib/ai/vercel-gateway";
import { enrichScenesWithResearch } from "@/lib/exa/progressive-enrichment";
import {
  formatResearchForPrompt,
  researchDeep,
  researchInstant,
} from "@/lib/exa/research-pipeline";
import {
  buildScenePrompt,
  SCENE_GEN_SYSTEM_PROMPT,
} from "@/lib/storytelling/scene-gen-prompt";

export const runtime = "nodejs";
export const maxDuration = 120;

// Fast models for structured JSON scene generation
const MODELS = [
  "google/gemini-2.5-flash",
  "anthropic/claude-sonnet-4.5",
  "openai/gpt-4o",
];

/**
 * Strip markdown code fences and other wrappers from LLM output.
 * Many models wrap JSON in ```json ... ``` even when told not to.
 */
function stripMarkdownFences(text: string): string {
  // Remove ```json ... ``` or ``` ... ```
  let cleaned = text
    .replace(/^```(?:json)?\s*\n?/gm, "")
    .replace(/\n?```\s*$/gm, "");
  // Trim leading/trailing whitespace
  cleaned = cleaned.trim();
  return cleaned;
}

/**
 * Parse a complete buffer into scene objects.
 * Handles: JSON array, NDJSON, markdown-wrapped JSON.
 */
function parseSceneBuffer(buffer: string): Array<Record<string, unknown>> {
  const cleaned = stripMarkdownFences(buffer);
  const scenes: Array<Record<string, unknown>> = [];

  // Try 1: Parse as JSON array or wrapped object
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) {
      for (const item of parsed) {
        if (item && typeof item === "object" && item.type && item.id) {
          scenes.push(item);
        }
      }
      if (scenes.length > 0) return scenes;
    } else if (parsed && typeof parsed === "object") {
      // Check if it's a single scene
      if (parsed.type && parsed.id) {
        return [parsed];
      }
      // Check if scenes are wrapped in an object (e.g., { "scenes": [...] })
      for (const key of Object.keys(parsed)) {
        const val = parsed[key];
        if (
          Array.isArray(val) &&
          val.length > 0 &&
          val[0]?.type &&
          val[0]?.id
        ) {
          for (const item of val) {
            if (item && typeof item === "object" && item.type && item.id) {
              scenes.push(item);
            }
          }
          if (scenes.length > 0) return scenes;
        }
      }
    }
  } catch {
    // Not valid JSON as-is, try extraction
  }

  // Try 2: Extract individual JSON objects using brace matching
  let braceDepth = 0;
  let inString = false;
  let escapeNext = false;
  let objectStart = -1;

  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    if (char === "\\" && inString) {
      escapeNext = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (char === "{") {
      if (braceDepth === 0) objectStart = i;
      braceDepth++;
    } else if (char === "}") {
      braceDepth--;
      if (braceDepth === 0 && objectStart >= 0) {
        try {
          const obj = JSON.parse(cleaned.substring(objectStart, i + 1));
          if (obj.type && obj.id) {
            scenes.push(obj);
          }
        } catch {
          /* skip malformed object */
        }
        objectStart = -1;
      }
    }
  }

  return scenes;
}

/**
 * SSE endpoint: streams scene JSON objects one-by-one.
 *
 * The LLM outputs a JSON array. We parse incrementally:
 * each time a complete scene object is found, we send it as an SSE event.
 * If incremental parsing fails, we fall back to parsing the whole buffer.
 *
 * SSE events:
 *   event: scene    data: { ...sceneObject }
 *   event: done     data: { total: N }
 *   event: error    data: { error: "message" }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.error(
      "[Scene Gen] Request body:",
      JSON.stringify(body).substring(0, 500),
    );
    const { question, researchContext } = body;

    if (!question) {
      return new Response(JSON.stringify({ error: "Question is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(
      "[Scene Gen] Generating scenes for:",
      question,
      researchContext ? "(with research)" : "",
    );

    // -----------------------------------------------------------------------
    // Parallel Exa research pre-step
    // -----------------------------------------------------------------------
    let instantResearch:
      | Awaited<ReturnType<typeof researchInstant>>
      | undefined;
    let deepResearchPromise:
      | Promise<Awaited<ReturnType<typeof researchDeep>> | undefined>
      | undefined;

    if (!researchContext) {
      // Fire instant research (~200ms) — wait for it before scene gen
      // Fire deep research (~3-15s) — don't wait, enrich later
      try {
        console.log(
          "[Scene Gen] Starting parallel Exa research for:",
          question,
        );
        const [instant] = await Promise.all([
          researchInstant(question).catch((err) => {
            console.warn("[Scene Gen] Instant research failed:", err);
            return undefined;
          }),
        ]);
        instantResearch = instant;
        // Fire deep research in background (fire-and-forget until enrichment)
        deepResearchPromise = researchDeep(question).catch((err) => {
          console.warn("[Scene Gen] Deep research failed:", err);
          return undefined;
        });
      } catch (err) {
        console.warn("[Scene Gen] Research pre-step failed:", err);
      }
    }

    // Build research context from instant results (or use provided)
    const effectiveResearchContext =
      researchContext ||
      (instantResearch ? formatResearchForPrompt(instantResearch) : undefined);

    for (const modelId of MODELS) {
      try {
        console.log(`[Scene Gen] Trying model: ${modelId}`);
        const result = await streamText({
          model: gateway(modelId as any),
          system: SCENE_GEN_SYSTEM_PROMPT,
          prompt: buildScenePrompt(question, effectiveResearchContext),
          temperature: 0.7,
          maxOutputTokens: 8192,
        });

        // Create SSE stream that parses scenes from the LLM output
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          async start(controller) {
            let fullBuffer = "";
            let parseBuffer = "";
            let braceDepth = 0;
            let inString = false;
            let escapeNext = false;
            let sceneCount = 0;
            let objectStart = -1;
            let passedFirstBrace = false;
            const streamedSceneIds = new Set<string>();

            const sendScene = (scene: Record<string, unknown>) => {
              const id = scene.id as string;
              if (streamedSceneIds.has(id)) return; // Dedup
              streamedSceneIds.add(id);
              sceneCount++;
              const sseEvent = `event: scene\ndata: ${JSON.stringify(scene)}\n\n`;
              controller.enqueue(encoder.encode(sseEvent));
              console.log(
                `[Scene Gen] Streamed scene ${sceneCount}: ${scene.type} (${id}) via ${modelId}`,
              );
            };

            try {
              let chunkCount = 0;
              for await (const chunk of result.textStream) {
                fullBuffer += chunk;
                chunkCount++;

                // Log first few chunks for debugging
                if (chunkCount <= 3) {
                  console.log(
                    `[Scene Gen] Chunk ${chunkCount} (${chunk.length} chars):`,
                    chunk.substring(0, 200),
                  );
                }

                // Strip markdown fences from accumulated buffer for parsing
                // We parse incrementally on a cleaned version
                const cleanChunk = chunk;
                parseBuffer += cleanChunk;

                // Skip past markdown fence prefix if present
                if (!passedFirstBrace) {
                  const firstBrace = parseBuffer.indexOf("{");
                  if (firstBrace === -1) continue;
                  passedFirstBrace = true;
                  // Reset parse position to start from first brace
                  parseBuffer = parseBuffer.substring(firstBrace);
                  objectStart = -1;
                  braceDepth = 0;
                  inString = false;
                  escapeNext = false;
                  // DON'T continue — fall through to scan the truncated buffer
                }

                // Incrementally parse: find complete JSON objects
                // On the first pass after truncation, scan from 0 (the whole truncated buffer)
                const startPos =
                  parseBuffer.length <= cleanChunk.length
                    ? 0
                    : Math.max(0, parseBuffer.length - cleanChunk.length);
                for (let i = startPos; i < parseBuffer.length; i++) {
                  const char = parseBuffer[i];

                  if (escapeNext) {
                    escapeNext = false;
                    continue;
                  }
                  if (char === "\\" && inString) {
                    escapeNext = true;
                    continue;
                  }
                  if (char === '"') {
                    inString = !inString;
                    continue;
                  }
                  if (inString) continue;

                  if (char === "{") {
                    if (braceDepth === 0) objectStart = i;
                    braceDepth++;
                  } else if (char === "}") {
                    braceDepth--;
                    if (braceDepth === 0 && objectStart >= 0) {
                      const objectStr = parseBuffer.substring(
                        objectStart,
                        i + 1,
                      );
                      try {
                        const scene = JSON.parse(objectStr);
                        if (scene.type && scene.id) {
                          sendScene(scene);
                        }
                      } catch {
                        // Malformed object, skip
                        console.warn(
                          "[Scene Gen] Incremental parse failed for object, will retry in fallback",
                        );
                      }
                      objectStart = -1;
                    }
                  }
                }
              }

              // FALLBACK: If incremental parsing got 0 scenes, try parsing full buffer
              if (sceneCount === 0 && fullBuffer.length > 10) {
                console.log(
                  "[Scene Gen] Incremental parsing got 0 scenes, trying full buffer parse...",
                );
                console.log(
                  "[Scene Gen] Full buffer length:",
                  fullBuffer.length,
                  "chars, chunks:",
                  chunkCount,
                );
                console.log(
                  "[Scene Gen] Full buffer (first 1000 chars):",
                  fullBuffer.substring(0, 1000),
                );
                console.log(
                  "[Scene Gen] Full buffer (last 500 chars):",
                  fullBuffer.substring(fullBuffer.length - 500),
                );
                const fallbackScenes = parseSceneBuffer(fullBuffer);
                for (const scene of fallbackScenes) {
                  sendScene(scene);
                }
                if (fallbackScenes.length > 0) {
                  console.log(
                    `[Scene Gen] Fallback parsed ${fallbackScenes.length} scenes`,
                  );
                } else {
                  console.error(
                    "[Scene Gen] Fallback also failed. Raw output (first 500 chars):",
                    fullBuffer.substring(0, 500),
                  );
                }
              }

              // ---------------------------------------------------------------
              // Deep research enrichment (non-blocking)
              // After initial scenes stream, await deep research and inject
              // enriched scenes into the same SSE stream.
              // ---------------------------------------------------------------
              if (deepResearchPromise && sceneCount > 0) {
                try {
                  const deepResult = await deepResearchPromise;
                  if (
                    deepResult &&
                    deepResult.facts.length + deepResult.stats.length > 0
                  ) {
                    console.log(
                      "[Scene Gen] Deep research complete, generating enriched scenes...",
                    );
                    const usedFacts = new Set<string>(); // TODO: track facts used in initial scenes
                    const enrichedScenes = await enrichScenesWithResearch(
                      sceneCount + 1, // +1 for auto title
                      deepResult,
                      usedFacts,
                    );
                    for (const enrichedScene of enrichedScenes) {
                      sendScene(
                        enrichedScene as unknown as Record<string, unknown>,
                      );
                    }
                    if (enrichedScenes.length > 0) {
                      console.log(
                        `[Scene Gen] Streamed ${enrichedScenes.length} enriched scenes`,
                      );
                    }
                  }
                } catch (enrichErr) {
                  console.warn("[Scene Gen] Enrichment failed:", enrichErr);
                }
              }

              // Send done event
              controller.enqueue(
                encoder.encode(
                  `event: done\ndata: ${JSON.stringify({ total: sceneCount })}\n\n`,
                ),
              );
              console.log(
                `[Scene Gen] Complete: ${sceneCount} scenes generated via ${modelId}`,
              );
            } catch (streamError) {
              console.error("[Scene Gen] Stream error:", streamError);

              // Even on stream error, try to salvage what we have
              if (sceneCount === 0 && fullBuffer.length > 10) {
                const rescued = parseSceneBuffer(fullBuffer);
                for (const scene of rescued) sendScene(scene);
                if (rescued.length > 0) {
                  console.log(
                    `[Scene Gen] Rescued ${rescued.length} scenes from partial stream`,
                  );
                }
              }

              if (sceneCount === 0) {
                const errorEvent = `event: error\ndata: ${JSON.stringify({ error: "Stream failed" })}\n\n`;
                controller.enqueue(encoder.encode(errorEvent));
              }
              controller.enqueue(
                encoder.encode(
                  `event: done\ndata: ${JSON.stringify({ total: sceneCount })}\n\n`,
                ),
              );
            } finally {
              controller.close();
            }
          },
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        });
      } catch (error) {
        console.warn(
          `[Scene Gen] ${modelId} failed, trying fallback:`,
          (error as Error).message || error,
        );
      }
    }

    // All models failed — return SSE error stream instead of JSON error
    // so the client's SSE parser handles it gracefully
    const encoder = new TextEncoder();
    const errorStream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            `event: error\ndata: ${JSON.stringify({ error: "All models failed" })}\n\n`,
          ),
        );
        controller.enqueue(
          encoder.encode(
            `event: done\ndata: ${JSON.stringify({ total: 0 })}\n\n`,
          ),
        );
        controller.close();
      },
    });

    return new Response(errorStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("[Scene Gen] Error:", error);
    return new Response(JSON.stringify({ error: "Scene generation failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
