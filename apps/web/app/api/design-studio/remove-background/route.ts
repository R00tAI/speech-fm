/**
 * Background Removal API
 * Uses fal-ai/birefnet/v2 for high-quality background removal
 */

import { NextRequest, NextResponse } from "next/server";
import { fal } from "@fal-ai/client";

export async function POST(req: NextRequest) {
  try {
    if (!process.env.FAL_KEY) {
      return NextResponse.json(
        { success: false, error: "FAL_KEY not configured" },
        { status: 500 }
      );
    }

    const body = await req.json();

    if (!body.image_url) {
      return NextResponse.json(
        { success: false, error: "image_url is required" },
        { status: 400 }
      );
    }

    let imageUrl: string = body.image_url;

    // Handle base64 data URLs — upload to FAL storage first
    if (imageUrl.startsWith("data:")) {
      const base64Data = imageUrl.split(",")[1];
      const mimeMatch = imageUrl.match(/data:([^;]+);/);
      const mimeType = mimeMatch?.[1] || "image/png";

      const byteCharacters = atob(base64Data);
      const byteArray = new Uint8Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteArray[i] = byteCharacters.charCodeAt(i);
      }
      const blob = new Blob([byteArray], { type: mimeType });
      imageUrl = await fal.storage.upload(blob);
    }

    const result = await fal.subscribe("fal-ai/birefnet/v2", {
      input: { image_url: imageUrl },
    });

    const data = result.data as {
      image?: { url: string; width?: number; height?: number };
    };

    if (!data.image?.url) {
      return NextResponse.json(
        {
          success: false,
          error: "Background removal failed - no image returned",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      image_url: data.image.url,
      width: data.image.width,
      height: data.image.height,
      requestId: result.requestId,
    });
  } catch (error) {
    console.error("[BG Removal API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error during background removal",
      },
      { status: 500 }
    );
  }
}
