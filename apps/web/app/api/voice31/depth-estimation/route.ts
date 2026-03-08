/**
 * Depth Estimation API
 *
 * Generates depth maps from images using FAL.ai depth models.
 * Used for parallax effects, 3D Ken Burns, depth-mesh scenes.
 *
 * POST /api/voice31/depth-estimation
 * Body: { imageUrl, model? }
 *
 * Models: midas (free/fast), depth-anything-v2 (best quality),
 *         marigold (high quality), zoedepth (metric depth)
 */

import { NextRequest, NextResponse } from "next/server";
import { fal } from "@fal-ai/client";

export const runtime = "nodejs";
export const maxDuration = 60;

// Initialize FAL client
const FAL_API_KEY = process.env.FAL_KEY;
if (FAL_API_KEY) {
  fal.config({ credentials: FAL_API_KEY });
}

// ---------------------------------------------------------------------------
// Model endpoints
// ---------------------------------------------------------------------------

const FAL_DEPTH_ENDPOINTS = {
  midas: "fal-ai/imageutils/depth",
  "depth-anything-v2": "fal-ai/image-preprocessors/depth-anything/v2",
  marigold: "fal-ai/imageutils/marigold-depth",
  zoedepth: "fal-ai/image-preprocessors/zoe",
} as const;

type DepthModel = keyof typeof FAL_DEPTH_ENDPOINTS;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizeModel(model?: string | null): DepthModel {
  if (!model) return "midas";
  return model in FAL_DEPTH_ENDPOINTS ? (model as DepthModel) : "midas";
}

function isBase64DataUrl(str: string): boolean {
  return str.startsWith("data:") && str.includes("base64,");
}

async function uploadBase64ToFalStorage(dataUrl: string): Promise<string> {
  const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches) throw new Error("Invalid base64 Data URL format");

  const mimeType = matches[1];
  const base64Data = matches[2];
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: mimeType });
  return fal.storage.upload(blob);
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    if (!FAL_API_KEY) {
      return NextResponse.json(
        { success: false, error: "FAL_KEY not configured. Set FAL_KEY environment variable." },
        { status: 500 },
      );
    }

    const body = await req.json();
    let imageUrl: string = (body.imageUrl || "").trim();
    const model = normalizeModel(body.model);

    if (!imageUrl) {
      return NextResponse.json(
        { success: false, error: "imageUrl is required" },
        { status: 400 },
      );
    }

    // Handle blob: URLs (can't be fetched server-side)
    if (imageUrl.startsWith("blob:")) {
      return NextResponse.json(
        { success: false, error: "Blob URLs cannot be processed server-side. Send a real URL or base64." },
        { status: 400 },
      );
    }

    // Handle base64 data URLs — upload to FAL storage first
    if (isBase64DataUrl(imageUrl)) {
      console.log("[depth-estimation] Uploading base64 to FAL storage...");
      try {
        imageUrl = await uploadBase64ToFalStorage(imageUrl);
      } catch (uploadError) {
        console.error("[depth-estimation] Base64 upload failed:", uploadError);
        return NextResponse.json(
          { success: false, error: "Failed to process base64 image" },
          { status: 400 },
        );
      }
    }

    const endpoint = FAL_DEPTH_ENDPOINTS[model];
    console.log(`[depth-estimation] Using ${model} (${endpoint}) for:`, imageUrl.substring(0, 80));

    // Build model-specific input
    let falInput: Record<string, unknown> = { image_url: imageUrl };
    if (model === "midas") {
      falInput = { image_url: imageUrl, a: body.a || 6.28, bg_th: body.bg_th || 0.1 };
    } else if (model === "marigold") {
      falInput = {
        image_url: imageUrl,
        num_inference_steps: body.num_inference_steps || 10,
        ensemble_size: body.ensemble_size || 10,
        processing_res: body.processing_res || 0,
      };
    }

    // Call FAL API
    const rawResult = await fal.subscribe(endpoint, {
      input: falInput,
      logs: false,
      onQueueUpdate: (update) => {
        console.log(`[depth-estimation] ${model} queue:`, update.status);
      },
    });

    // Unwrap: @fal-ai/client wraps in { data, requestId }
    const result =
      (rawResult as { data?: Record<string, unknown> }).data ??
      (rawResult as Record<string, unknown>);

    // All FAL depth models return the depth map in the `image` field
    const depthImage = result.image as
      | { url?: string; width?: number; height?: number; content_type?: string }
      | string
      | undefined;

    if (!depthImage) {
      console.error("[depth-estimation] No depth map in response:", Object.keys(result));
      return NextResponse.json(
        { success: false, error: "No depth map in response" },
        { status: 500 },
      );
    }

    console.log(`[depth-estimation] Depth map generated using ${model}`);

    return NextResponse.json({
      success: true,
      depthMap: {
        url: typeof depthImage === "string" ? depthImage : depthImage.url || "",
        width: typeof depthImage === "string" ? 0 : depthImage.width || 0,
        height: typeof depthImage === "string" ? 0 : depthImage.height || 0,
        content_type: typeof depthImage === "string" ? "image/png" : depthImage.content_type || "image/png",
      },
      model,
    });
  } catch (error: unknown) {
    console.error("[depth-estimation] Error:", error);
    const falError = error as { body?: unknown; status?: number; message?: string };

    const detail = (falError.body as { detail?: unknown } | undefined)?.detail;
    let errorMessage = falError.message || "Unknown error";
    if (Array.isArray(detail)) {
      errorMessage = detail
        .map((entry) =>
          entry && typeof entry === "object" && "msg" in entry
            ? String((entry as { msg?: unknown }).msg)
            : String(entry),
        )
        .join("; ");
    } else if (typeof detail === "string") {
      errorMessage = detail;
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: (falError.status as number) || 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    service: "depth-estimation",
    models: {
      midas: { cost: "FREE", quality: "standard", speed: "~3s" },
      "depth-anything-v2": { cost: "~$0.01", quality: "excellent", speed: "~5s" },
      marigold: { cost: "~$0.01", quality: "high", speed: "~10s" },
      zoedepth: { cost: "~$0.01", quality: "metric", speed: "~5s" },
    },
    usage: 'POST with { imageUrl, model?: "midas"|"depth-anything-v2"|"marigold"|"zoedepth" }',
  });
}
