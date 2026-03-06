/**
 * Shared Image Generation Utility
 *
 * Centralizes FAL.ai model registry, input building, and base64 conversion.
 * Used by Print Cut Fold and future routes to eliminate duplication.
 */

import * as fal from "@fal-ai/serverless-client";

fal.config({ credentials: process.env.FAL_KEY });

// ── Model Registry ──────────────────────────────────────────────────

export type ModelTier =
  | "flux-schnell"
  | "flux-dev"
  | "flux-kontext-pro"
  | "nano-banana"
  | "nano-banana-pro"
  | "gpt-image-1"
  | "gpt-image-1.5"
  | "gpt-image-1-mini";

export const MODEL_ENDPOINTS: Record<ModelTier, string> = {
  "flux-schnell": "fal-ai/flux/schnell",
  "flux-dev": "fal-ai/flux/dev",
  "flux-kontext-pro": "fal-ai/flux-pro/kontext",
  "nano-banana": "fal-ai/nano-banana",
  "nano-banana-pro": "fal-ai/nano-banana-pro",
  "gpt-image-1": "fal-ai/gpt-image-1",
  "gpt-image-1.5": "fal-ai/gpt-image-1.5",
  "gpt-image-1-mini": "fal-ai/gpt-image-1-mini",
};

export const MODEL_COSTS: Record<ModelTier, number> = {
  "flux-schnell": 0.003,
  "flux-dev": 0.025,
  "flux-kontext-pro": 0.04,
  "nano-banana": 0.039,
  "nano-banana-pro": 0.15,
  "gpt-image-1": 0.04,
  "gpt-image-1.5": 0.08,
  "gpt-image-1-mini": 0.02,
};

// ── Input Builder ───────────────────────────────────────────────────

interface GenerateOptions {
  prompt: string;
  model?: ModelTier;
  seed?: number;
  imageSize?: string | { width: number; height: number };
  numImages?: number;
}

function buildInput(options: GenerateOptions): Record<string, any> {
  const modelKey = options.model || "flux-schnell";
  const isGoogle = modelKey.startsWith("nano-banana");
  const isOpenAI = modelKey.startsWith("gpt-image");

  const input: Record<string, any> = {
    prompt: options.prompt,
    seed: options.seed || Math.floor(Math.random() * 2147483647),
    num_images: options.numImages || 1,
  };

  if (isGoogle) {
    input.aspect_ratio = "1:1";
    input.image_size = options.imageSize || { width: 1024, height: 1024 };
  } else if (isOpenAI) {
    input.size = "1024x1024";
  } else {
    // Flux models
    input.image_size = options.imageSize || "square_hd";
    input.num_inference_steps = modelKey === "flux-schnell" ? 4 : 28;
    input.enable_safety_checker = true;
    if (modelKey === "flux-dev") {
      input.guidance_scale = 3.5;
    }
  }

  return input;
}

// ── Generate with Base64 ────────────────────────────────────────────

export interface GenerateImageResult {
  imageUrl: string;
  seed: number;
  cost: number;
  model: ModelTier;
}

/**
 * Generate an image via FAL, convert to base64, and return.
 * Single entry point for all image generation needs.
 */
export async function generateImageWithBase64(
  options: GenerateOptions,
): Promise<GenerateImageResult> {
  const modelKey = options.model || "flux-schnell";
  const endpoint = MODEL_ENDPOINTS[modelKey] || MODEL_ENDPOINTS["flux-schnell"];
  const cost = MODEL_COSTS[modelKey] || MODEL_COSTS["flux-schnell"];

  const input = buildInput(options);

  const result = await fal.subscribe(endpoint, {
    input,
    logs: false,
  });

  const imageUrl =
    (result as any)?.images?.[0]?.url ||
    (result as any)?.data?.images?.[0]?.url;

  if (!imageUrl) {
    throw new Error(`No image returned from ${modelKey}`);
  }

  // Convert to base64 for persistence
  let permanentUrl = imageUrl;
  try {
    const imageResponse = await fetch(imageUrl);
    if (imageResponse.ok) {
      const imageBlob = await imageResponse.blob();
      const imageBuffer = Buffer.from(await imageBlob.arrayBuffer());
      permanentUrl = `data:${imageBlob.type};base64,${imageBuffer.toString("base64")}`;
    }
  } catch {
    permanentUrl = imageUrl;
  }

  return {
    imageUrl: permanentUrl,
    seed: input.seed,
    cost,
    model: modelKey,
  };
}
