/**
 * Unified Image Generation API
 *
 * Generates images via FAL.ai Flux models.
 * Replaces both /api/voice-canvas/generate-media and
 * /api/pipelines/agency-orchestration/rpg/generate-image from a2m.ai.
 *
 * POST /api/voice31/generate-image
 * Body: { prompt, model?, width?, height?, category?, style?, num_images? }
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { fal } from "@fal-ai/client";
import { trackUnitUsage } from "@/lib/services/cost-tracking.service";

export const runtime = "nodejs";
export const maxDuration = 120;

// Initialize FAL client
const FAL_API_KEY = process.env.FAL_KEY;
if (FAL_API_KEY) {
  fal.config({ credentials: FAL_API_KEY });
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ImageCategory = "character" | "scene" | "background" | "item" | "action";
type ImageStyle =
  | "anime"
  | "realistic"
  | "pixel"
  | "watercolor"
  | "comic"
  | "fantasy"
  | "illustration"
  | "cyberpunk"
  | "noir"
  | "steampunk"
  | "cosmic_horror"
  | "mythological"
  | "postapocalyptic";

// ---------------------------------------------------------------------------
// Style & category prompt modifiers
// ---------------------------------------------------------------------------

const STYLE_PROMPTS: Record<string, string> = {
  anime: "anime style, vibrant colors, detailed features, cel shading, clean lines",
  realistic: "photorealistic, highly detailed, cinematic lighting, 8k resolution",
  pixel: "pixel art style, 16-bit aesthetic, retro game graphics, clean pixels",
  watercolor: "watercolor painting, soft brush strokes, artistic, flowing colors",
  comic: "comic book style, bold outlines, dynamic composition, halftone dots",
  fantasy: "fantasy art style, epic, magical lighting, detailed illustration",
  illustration: "detailed illustration, painterly, high quality, masterpiece",
  cyberpunk: "blade runner aesthetic, neon-lit dystopia, rain, high contrast",
  noir: "film noir 1940s aesthetic, dramatic shadows, high contrast, moody",
  steampunk: "steampunk aesthetic, Victorian industrial, brass and gears, sepia tones",
  cosmic_horror: "cosmic horror, eldritch, dark atmosphere, unsettling, detailed",
  mythological: "mythological, classical art, epic composition, divine lighting",
  postapocalyptic: "post-apocalyptic, desolate, atmospheric, detailed ruins",
};

const CATEGORY_PROMPTS: Record<ImageCategory, string> = {
  character: "character portrait, detailed face, expressive, centered composition",
  scene: "wide shot scene, environmental storytelling, atmospheric, detailed setting",
  background: "panoramic background, environment art, detailed scenery, no characters",
  item: "item illustration, detailed object, clean background, product shot style",
  action: "dynamic action scene, motion blur, intense composition, dramatic lighting",
};

const CATEGORY_SIZES: Record<ImageCategory, { width: number; height: number }> = {
  character: { width: 1024, height: 1024 },
  scene: { width: 1280, height: 720 },
  background: { width: 1280, height: 720 },
  item: { width: 512, height: 512 },
  action: { width: 1024, height: 768 },
};

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    const userId = session.user.id;

    if (!FAL_API_KEY) {
      return NextResponse.json(
        { error: "FAL_KEY not configured. Image generation requires FAL AI credentials." },
        { status: 500 },
      );
    }

    const body = await request.json();
    const {
      prompt,
      model: requestedModel,
      width: requestedWidth,
      height: requestedHeight,
      category = "scene" as ImageCategory,
      style = "fantasy" as string,
      num_images = 1,
      type, // legacy compat from voice-canvas callers
      forceSchnell = false,
      saveToAccount, // accepted but ignored (no asset-storage in speech-fm)
    } = body;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // Resolve category (legacy callers may pass `type` instead of `category`)
    const resolvedCategory: ImageCategory =
      (category as ImageCategory) || (type as ImageCategory) || "scene";

    // Build enhanced prompt
    const stylePrompt = STYLE_PROMPTS[style] || STYLE_PROMPTS.fantasy;
    const categoryPrompt = CATEGORY_PROMPTS[resolvedCategory] || CATEGORY_PROMPTS.scene;
    const fullPrompt = `${prompt}, ${categoryPrompt}, ${stylePrompt}, high quality, masterpiece`;

    // Resolve dimensions
    const defaults = CATEGORY_SIZES[resolvedCategory] || CATEGORY_SIZES.scene;
    const width = requestedWidth || defaults.width;
    const height = requestedHeight || defaults.height;

    // Select model
    const model =
      forceSchnell || !requestedModel
        ? "fal-ai/flux/schnell"
        : requestedModel.startsWith("fal-ai/")
          ? requestedModel
          : `fal-ai/flux/${requestedModel}`;

    const isSchnell = model.includes("schnell");

    console.log("[generate-image] Starting:", {
      model,
      category: resolvedCategory,
      style,
      width,
      height,
      promptLength: fullPrompt.length,
    });

    // Build FAL input
    const falInput: Record<string, unknown> = {
      prompt: fullPrompt,
      image_size: { width, height },
      num_images: Math.min(num_images, 4),
      num_inference_steps: isSchnell ? 4 : 28,
      enable_safety_checker: true,
      output_format: "png",
    };

    if (!isSchnell) {
      falInput.guidance_scale = 3.5;
    }

    // Call FAL API
    const result = await fal.subscribe(model, {
      input: falInput,
      logs: false,
      onQueueUpdate: (update) => {
        console.log("[generate-image] Queue:", update.status);
      },
    });

    // Unwrap: @fal-ai/client wraps in { data, requestId }
    const payload = (result as { data?: unknown }).data ?? result;
    const images = (payload as { images?: Array<{ url: string; width?: number; height?: number; content_type?: string }> }).images;

    if (!images || images.length === 0) {
      return NextResponse.json({ error: "No images generated" }, { status: 500 });
    }

    const seed = (payload as { seed?: number }).seed;
    const timings = (payload as { timings?: { inference?: number } }).timings;

    console.log("[generate-image] Generated", images.length, "images");

    // Track cost (non-blocking)
    trackUnitUsage({
      userId,
      service: "image",
      operation: model,
      units: images.length,
      metadata: { category: resolvedCategory, style, source: "voice31-generate-image" },
    }).catch((err) => console.error("[generate-image] Cost tracking failed:", err));

    // Build response compatible with BOTH old caller shapes:
    // voice-canvas callers expect: { media: [{ url }] }
    // rpg callers expect: { image: { url } }
    const media = images.map((img, i) => ({
      id: `media_${Date.now()}_${i}`,
      url: img.url,
      type: resolvedCategory,
      prompt: fullPrompt,
      width: img.width || width,
      height: img.height || height,
      createdAt: new Date().toISOString(),
    }));

    return NextResponse.json({
      success: true,
      // voice-canvas shape
      media,
      // rpg shape
      image: {
        url: images[0].url,
        originalUrl: images[0].url,
        width: images[0].width || width,
        height: images[0].height || height,
        contentType: images[0].content_type || "image/png",
      },
      metadata: {
        category: resolvedCategory,
        style,
        prompt: fullPrompt,
        generatedAt: new Date().toISOString(),
      },
      timing: timings?.inference,
      seed,
    });
  } catch (error: unknown) {
    console.error("[generate-image] Failed:", error);
    const falError = error as { body?: unknown; status?: number; message?: string };

    const detail = (falError.body as { detail?: unknown } | undefined)?.detail;
    let errorMessage = falError.message || "Failed to generate image";
    if (typeof detail === "string") {
      errorMessage = detail;
    } else if (Array.isArray(detail)) {
      errorMessage = detail.map((d: { msg?: string }) => d?.msg || String(d)).join("; ");
    }

    return NextResponse.json(
      { error: errorMessage, details: error instanceof Error ? error.message : "Unknown error" },
      { status: (falError.status as number) || 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    styles: Object.keys(STYLE_PROMPTS),
    categories: Object.keys(CATEGORY_PROMPTS),
    sizes: CATEGORY_SIZES,
    defaultSize: CATEGORY_SIZES.scene,
  });
}
