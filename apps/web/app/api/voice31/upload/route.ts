/**
 * Voice31 Upload API
 * Handles file uploads (images, PDFs), stores to FAL storage,
 * analyzes content with Claude vision, and persists to DB.
 */

import { auth } from "@/app/(auth)/auth";
import { fal } from "@fal-ai/client";
import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { voice31_uploads } from "@/lib/db/schema";

export const runtime = "nodejs";
export const maxDuration = 60;

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: `Invalid file type: ${file.type}. Supported: JPEG, PNG, WebP, PDF`,
        },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 400 },
      );
    }

    // Upload to FAL storage
    const fileBlob = new Blob([await file.arrayBuffer()], { type: file.type });
    const fileUrl = await fal.storage.upload(fileBlob);

    const fileType = file.type === "application/pdf" ? "pdf" : "image";
    let analysis: string | null = null;
    let contentType: string | null = null;
    let keywords: string[] = [];

    // Analyze with Claude vision
    if (fileType === "image") {
      try {
        const anthropic = new Anthropic();

        const response = await anthropic.messages.create({
          model: "claude-sonnet-4-5-20250929",
          max_tokens: 300,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image",
                  source: { type: "url", url: fileUrl },
                },
                {
                  type: "text",
                  text: `Analyze this image. Respond as JSON only:
{
  "contentType": "<one of: architecture_blueprint, photo_landscape, photo_portrait, photo_object, technical_diagram, chart_data, ui_mockup, art_illustration, document_page>",
  "analysis": "<1-2 sentence description of key elements>",
  "keywords": ["<3-5 relevant keywords>"]
}`,
                },
              ],
            },
          ],
        });

        const text =
          response.content[0].type === "text" ? response.content[0].text : "";
        try {
          // Extract JSON from response (may have markdown fencing)
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            analysis = parsed.analysis || null;
            contentType = parsed.contentType || null;
            keywords = Array.isArray(parsed.keywords) ? parsed.keywords : [];
          }
        } catch {
          analysis = text;
        }
      } catch (err) {
        console.warn("[voice31/upload] Vision analysis failed:", err);
        analysis = "Analysis unavailable";
      }
    } else {
      // PDF — basic metadata, no vision
      analysis = `PDF document: ${file.name} (${(file.size / 1024).toFixed(1)}KB)`;
      contentType = "document_page";
      keywords = ["document", "pdf"];
    }

    // Persist to database
    let dbId: string | undefined;
    try {
      const [inserted] = await db.insert(voice31_uploads).values({
        user_id: session.user.id,
        filename: file.name,
        blob_url: fileUrl,
        file_type: fileType,
        mime_type: file.type,
        analysis,
        content_type: contentType,
        keywords: JSON.stringify(keywords),
      }).returning({ id: voice31_uploads.id });
      dbId = inserted?.id;
    } catch (dbErr) {
      console.warn("[voice31/upload] DB persistence failed:", dbErr);
    }

    const uploadedFile = {
      id: dbId || `upload_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      filename: file.name,
      blobUrl: fileUrl,
      fileType,
      mimeType: file.type,
      analysis,
      contentType,
      keywords,
      uploadedAt: Date.now(),
    };

    return NextResponse.json(uploadedFile);
  } catch (error) {
    console.error("[voice31/upload] Error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Upload failed",
      },
      { status: 500 },
    );
  }
}
