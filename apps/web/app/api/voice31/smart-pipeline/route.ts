/**
 * Smart Pipeline API
 * Intelligent FAL model router: analyzes content type and chains the right
 * models (upscale → depth → 3D mesh) for optimal 3D canvas results.
 */

import { auth } from "@/app/(auth)/auth";
import { fal } from "@fal-ai/client";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 120;

// Initialize FAL client
fal.config({
  credentials: process.env.FAL_KEY,
});

type Pipeline = "enhance" | "3d_scene" | "depth_layers" | "full_3d" | "auto";

interface PipelineRequest {
  imageUrl: string;
  contentType: string;
  pipeline: Pipeline;
  style?: string;
}

interface PipelineResult {
  pipeline: string;
  highResUrl?: string;
  depthMapUrl?: string;
  meshUrl?: string;
}

/** Determine automatic pipeline based on content type */
function resolvePipeline(pipeline: Pipeline, contentType: string): Pipeline {
  if (pipeline !== "auto") return pipeline;
  if (
    contentType === "architecture_blueprint" ||
    contentType === "technical_diagram"
  ) {
    return "full_3d";
  }
  if (contentType?.startsWith("photo_")) {
    return "depth_layers";
  }
  return "enhance";
}

/** Step 1: Upscale image using Real-ESRGAN */
async function upscaleImage(imageUrl: string): Promise<string> {
  console.log("[smart-pipeline] Upscaling image...");
  const result = (await fal.subscribe("fal-ai/esrgan", {
    input: {
      image_url: imageUrl,
      scale: 2,
      model: "RealESRGAN_x4plus",
      output_format: "png",
    },
    logs: true,
  })) as any;

  const output = result.image?.url || result.images?.[0]?.url;
  if (!output) throw new Error("Upscale returned no image");
  console.log("[smart-pipeline] Upscale complete");
  return output;
}

/** Step 2: Depth estimation using depth-anything-v2 */
async function estimateDepth(imageUrl: string): Promise<string> {
  console.log("[smart-pipeline] Estimating depth...");
  const result = (await fal.subscribe(
    "fal-ai/image-preprocessors/depth-anything/v2",
    {
      input: { image_url: imageUrl },
      logs: true,
    },
  )) as any;

  const depthUrl = result.image?.url || result.depth_map?.url;
  if (!depthUrl) throw new Error("Depth estimation returned no depth map");
  console.log("[smart-pipeline] Depth estimation complete");
  return depthUrl;
}

/** Step 3: Image-to-3D mesh using Trellis-2 */
async function imageToMesh(imageUrl: string): Promise<string> {
  console.log("[smart-pipeline] Generating 3D mesh...");
  const result = (await fal.subscribe("fal-ai/trellis-2", {
    input: {
      image_url: imageUrl,
      ss_guidance_strength: 7.5,
      slat_guidance_strength: 3.0,
    },
    logs: true,
  })) as any;

  const meshUrl = result.model_mesh?.url || result.glb?.url || result.mesh?.url;
  if (!meshUrl) throw new Error("3D generation returned no mesh");
  console.log("[smart-pipeline] 3D mesh complete");
  return meshUrl;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as PipelineRequest;
    const { imageUrl, contentType } = body;

    if (!imageUrl) {
      return NextResponse.json(
        { error: "imageUrl is required" },
        { status: 400 },
      );
    }

    const resolvedPipeline = resolvePipeline(
      body.pipeline || "auto",
      contentType || "",
    );

    console.log(
      `[smart-pipeline] Running pipeline: ${resolvedPipeline} (contentType: ${contentType})`,
    );

    const result: PipelineResult = { pipeline: resolvedPipeline };

    switch (resolvedPipeline) {
      case "full_3d": {
        // Upscale → Depth → 3D Mesh (sequential, each depends on previous)
        result.highResUrl = await upscaleImage(imageUrl);
        result.depthMapUrl = await estimateDepth(result.highResUrl);
        result.meshUrl = await imageToMesh(result.highResUrl);
        break;
      }
      case "depth_layers": {
        // Upscale + Depth in parallel (depth can run on original while upscaling)
        const [highRes, depth] = await Promise.all([
          upscaleImage(imageUrl),
          estimateDepth(imageUrl),
        ]);
        result.highResUrl = highRes;
        result.depthMapUrl = depth;
        break;
      }
      case "enhance":
      default: {
        result.highResUrl = await upscaleImage(imageUrl);
        break;
      }
    }

    console.log(`[smart-pipeline] Pipeline ${resolvedPipeline} complete`);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[smart-pipeline] Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Pipeline failed",
        pipeline: "error",
      },
      { status: 500 },
    );
  }
}
