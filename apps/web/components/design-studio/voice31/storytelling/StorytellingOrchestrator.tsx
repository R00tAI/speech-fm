"use client";

import type React from "react";
import { useCallback, useEffect, useRef } from "react";
import { SceneGenerationClient } from "./generation/SceneGenerationClient";
import { useAutoAdvance } from "./hooks/useAutoAdvance";
import { useNarrationSync } from "./hooks/useNarrationSync";
import { useSceneBuffer } from "./hooks/useSceneBuffer";
import {
  clearResearchPromiseRef,
  getResearchPromiseRef,
} from "./researchPromiseRef";
import { StorytellingPlayer } from "./StorytellingPlayer";
import { useStorytellingStore } from "./StorytellingStore";
import type {
  KineticTitleData,
  NarrationScript,
  ResearchContext,
  Scene,
} from "./types";

// Scene types that need image generation + depth maps
const CINEMATIC_DEPTH_TYPES = new Set([
  "cinematic_point_cloud",
  "cinematic_depth_mesh",
  "cinematic_composition",
]);

// Scene types that need image generation only (no depth)
const CINEMATIC_IMAGE_TYPES = new Set([
  "cinematic_dither",
  "cinematic_flat",
  "cinematic_layered",
]);

/** Check if a URL is a placeholder that needs resolution */
function needsResolution(url: string | undefined): boolean {
  if (!url) return false;
  return url.startsWith("GENERATE:") || url === "AUTO" || url === "auto";
}

/** Extract prompt from GENERATE:description URLs */
function extractPrompt(url: string): string {
  if (url.startsWith("GENERATE:")) return url.replace("GENERATE:", "").trim();
  return "";
}

// Eagerly preload AlgorithmicBackground chunk so it's ready when scenes render
if (typeof window !== "undefined") {
  import("@/components/art/AlgorithmicBackground").catch((e) =>
    console.warn(
      "[StorytellingOrchestrator] AlgorithmicBackground preload failed:",
      e,
    ),
  );
}

interface StorytellingOrchestratorProps {
  question: string;
  width: number;
  height: number;
  onClose: () => void;
  narrationScript?: NarrationScript | null;
  researchContext?: ResearchContext | null;
}

export const StorytellingOrchestrator: React.FC<
  StorytellingOrchestratorProps
> = ({
  question,
  width,
  height,
  onClose,
  narrationScript,
  researchContext,
}) => {
  const startStory = useStorytellingStore((s) => s.startStory);
  const addScene = useStorytellingStore((s) => s.addScene);
  const updateSceneStatus = useStorytellingStore((s) => s.updateSceneStatus);
  const markGenerationComplete = useStorytellingStore(
    (s) => s.markGenerationComplete,
  );
  const setError = useStorytellingStore((s) => s.setError);
  const reset = useStorytellingStore((s) => s.reset);
  const narrationMode = useStorytellingStore((s) => s.narrationMode);
  const setNarrationScript = useStorytellingStore((s) => s.setNarrationScript);
  const setResearchContext = useStorytellingStore((s) => s.setResearchContext);

  const updateScenePrerenderData = useStorytellingStore(
    (s) => s.updateScenePrerenderData,
  );

  const genClientRef = useRef<SceneGenerationClient | null>(null);
  const hasStartedRef = useRef(false);
  const genTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const lastSceneTimeRef = useRef<number>(0);
  const prerenderAbortRef = useRef<AbortController | null>(null);

  // Background pre-render for scenes with GENERATE: placeholder urls
  const prerenderScene = useCallback(
    async (scene: Scene) => {
      const data = scene.data as unknown as Record<string, unknown>;
      const rawImageUrl = data.imageUrl as string | undefined;
      const rawDepthUrl = data.depthUrl as string | undefined;

      // Determine what this scene needs
      const needsImage = needsResolution(rawImageUrl);
      const needsDepth =
        needsResolution(rawDepthUrl) && CINEMATIC_DEPTH_TYPES.has(scene.type);

      // Skip if nothing to resolve
      if (!(needsImage || needsDepth)) return;

      const imagePrompt = rawImageUrl ? extractPrompt(rawImageUrl) : "";
      if (needsImage && !imagePrompt) return;

      console.log(
        "[Orchestrator] Pre-rendering scene",
        scene.id,
        scene.type,
        needsImage ? "image" : "",
        needsDepth ? "+depth" : "",
      );

      try {
        // Step 1: Generate image via FAL Schnell
        const signal = prerenderAbortRef.current?.signal;
        let imageUrl: string | undefined;
        if (needsImage) {
          const res = await fetch("/api/voice-canvas/generate-media", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal,
            body: JSON.stringify({
              prompt: imagePrompt,
              type: "illustration",
              style: "illustration",
              forceSchnell: true,
            }),
          });
          if (res.ok) {
            const result = await res.json();
            imageUrl = result.media?.[0]?.url;
          }
        }

        if (needsImage && !imageUrl) {
          console.warn("[Orchestrator] Image generation failed for", scene.id);
          return;
        }

        // Store imageUrl immediately so scene can start rendering
        if (imageUrl) {
          updateScenePrerenderData(scene.id, { imageUrl });
          console.log("[Orchestrator] Image ready for scene", scene.id);
        }

        // Step 2: Generate depth map if needed (requires imageUrl) — with 1 retry
        if (needsDepth && imageUrl) {
          const attemptDepth = async (attempt: number): Promise<string | null> => {
            try {
              const depthRes = await fetch(
                "/api/design-studio/depth-estimation",
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  signal,
                  body: JSON.stringify({
                    imageUrl,
                    model: "midas",
                  }),
                },
              );
              if (depthRes.ok) {
                const depthResult = await depthRes.json();
                return depthResult.depthMap?.url || null;
              }
              console.warn(`[Orchestrator] Depth HTTP ${depthRes.status} for ${scene.id} (attempt ${attempt})`);
              return null;
            } catch (depthErr) {
              console.warn(`[Orchestrator] Depth failed for ${scene.id} (attempt ${attempt}):`, depthErr);
              return null;
            }
          };

          let depthMapUrl = await attemptDepth(1);
          if (!depthMapUrl) {
            console.log("[Orchestrator] Retrying depth for", scene.id, "in 2s...");
            await new Promise((r) => setTimeout(r, 2000));
            depthMapUrl = await attemptDepth(2);
          }

          if (depthMapUrl) {
            updateScenePrerenderData(scene.id, { depthMapUrl });
            console.log("[Orchestrator] Depth map ready for scene", scene.id);
          } else {
            console.error("[Orchestrator] Depth failed after 2 attempts for", scene.id);
          }
        }
      } catch (e) {
        console.warn("[Orchestrator] Pre-render failed for scene", scene.id, e);
      }
    },
    [updateScenePrerenderData],
  );

  // Wire up hooks
  useSceneBuffer();
  useAutoAdvance();
  useNarrationSync();

  // Start the story generation pipeline
  useEffect(() => {
    if (hasStartedRef.current || !question) return;
    hasStartedRef.current = true;

    // Create AbortController for pre-render fetches
    prerenderAbortRef.current = new AbortController();

    console.log(
      "[Orchestrator] Starting story for:",
      question,
      "mode:",
      narrationMode,
    );
    startStory(question);

    // Store narration script and research context if provided
    if (narrationScript) {
      setNarrationScript(narrationScript);
    }
    if (researchContext) {
      setResearchContext(researchContext);
    }

    // Step 1: Instantly add a title scene
    const titleScene: Scene = {
      id: "title",
      type: "kinetic_title",
      duration: 4,
      caption: question,
      transcript: { fullText: "[[SCENE:1]] " + question, words: [] },
      data: {
        title: question,
        style: "bold",
      } as KineticTitleData,
      accent: "#ffaa00",
      transition: "fade",
    };

    addScene(titleScene, "immediate");

    // In assistant mode, title scene is ready immediately (no TTS needed)
    // In all modes, the title plays instantly
    updateSceneStatus("title", "ready");

    // Step 2: Start SSE generation (with research context if available)
    // Reset scene timeout tracker
    lastSceneTimeRef.current = Date.now();

    const resetGenTimeout = () => {
      if (genTimeoutRef.current) clearTimeout(genTimeoutRef.current);
      genTimeoutRef.current = setTimeout(() => {
        const state = useStorytellingStore.getState();
        if (
          !state.generationComplete &&
          state.playerState !== "idle" &&
          state.playerState !== "complete"
        ) {
          console.warn(
            "[Orchestrator] No new scenes for 30s — forcing generation complete",
          );
          markGenerationComplete();
        }
      }, 30_000);
    };

    resetGenTimeout();

    // Await research promise from module ref (set by tool handler) with a 3s timeout
    const storedResearchPromise = getResearchPromiseRef();
    const resolveResearch = async () => {
      if (!storedResearchPromise) return null;
      try {
        const result = await Promise.race([
          storedResearchPromise,
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
        ]);
        if (result) {
          setResearchContext(result);
          console.log(
            "[Orchestrator] Research resolved with",
            result.results?.length,
            "results",
          );
        }
        return result;
      } catch {
        return null;
      }
    };

    resolveResearch().then((resolvedResearch) => {
      if (!genClientRef.current) {
        genClientRef.current = new SceneGenerationClient();
      }
      genClientRef.current.generate(
        question,
        {
          onScene: (scene: Scene) => {
            console.log("[Orchestrator] Received scene:", scene.id, scene.type);
            lastSceneTimeRef.current = Date.now();
            resetGenTimeout();
            addScene(scene);

            // In assistant-narrated mode, scenes are ready immediately
            // (no separate TTS needed — the assistant IS the narrator)
            if (narrationMode === "assistant") {
              updateSceneStatus(scene.id, "ready");
            } else if (narrationMode === "text_only") {
              updateSceneStatus(scene.id, "ready");
            }

            // Trigger background pre-rendering for complex scenes
            prerenderScene(scene);
          },
          onDone: (total: number) => {
            console.log("[Orchestrator] Generation complete:", total, "scenes");
            if (genTimeoutRef.current) clearTimeout(genTimeoutRef.current);
            markGenerationComplete();
          },
          onError: (error: string) => {
            console.error("[Orchestrator] Generation error:", error);
            if (genTimeoutRef.current) clearTimeout(genTimeoutRef.current);
            markGenerationComplete();
            setError(error);
          },
        },
        resolvedResearch || researchContext || undefined,
      );
    });

    return () => {
      genClientRef.current?.abort();
      prerenderAbortRef.current?.abort();
      if (genTimeoutRef.current) clearTimeout(genTimeoutRef.current);
    };
  }, [
    question,
    startStory,
    addScene,
    updateSceneStatus,
    markGenerationComplete,
    setError,
    narrationMode,
    narrationScript,
    researchContext,
    setNarrationScript,
    setResearchContext,
    prerenderScene,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      genClientRef.current?.abort();
      prerenderAbortRef.current?.abort();
      if (genTimeoutRef.current) clearTimeout(genTimeoutRef.current);
      clearResearchPromiseRef();
      reset();
    };
  }, [reset]);

  const handleClose = useCallback(() => {
    genClientRef.current?.abort();
    prerenderAbortRef.current?.abort();
    if (genTimeoutRef.current) clearTimeout(genTimeoutRef.current);
    reset();
    onClose();
  }, [reset, onClose]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 15,
      }}
    >
      <StorytellingPlayer width={width} height={height} onClose={handleClose} />
    </div>
  );
};
