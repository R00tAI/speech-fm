import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { fal } from "@fal-ai/client";

/**
 * POST /api/rpg/persist-media
 * Copy a temporary image URL (FAL, etc.) to FAL storage for permanent access.
 * Falls back to the original URL on any error so RPG mode isn't broken.
 */
export async function POST(request: NextRequest) {
  let parsedBody: { url?: string; type?: string; context?: unknown } = {};

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    parsedBody = await request.json();
    const { url, type, context } = parsedBody;

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "url is required" }, { status: 400 });
    }

    // Fetch the temporary image
    const imageResponse = await fetch(url);
    if (!imageResponse.ok) {
      // Fall back to original URL
      return NextResponse.json({
        success: true,
        permanentUrl: url,
        originalUrl: url,
        type: type || "rpg-media",
        context,
        persisted: false,
      });
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType =
      imageResponse.headers.get("content-type") || "image/png";

    // Upload to FAL storage
    const blob = new Blob([imageBuffer], { type: contentType });
    const permanentUrl = await fal.storage.upload(blob);

    return NextResponse.json({
      success: true,
      permanentUrl,
      originalUrl: url,
      type: type || "rpg-media",
      context,
      persisted: true,
    });
  } catch (error) {
    console.error("[RPG Persist Media] Error:", error);
    if (parsedBody.url) {
      return NextResponse.json({
        success: true,
        permanentUrl: parsedBody.url,
        originalUrl: parsedBody.url,
        type: parsedBody.type || "rpg-media",
        persisted: false,
      });
    }
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to persist media",
      },
      { status: 500 }
    );
  }
}
