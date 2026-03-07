/**
 * Voice31 Uploads API
 * GET: Fetch user's persisted uploads from DB
 * DELETE: Remove an upload record
 */

import { auth } from "@/app/(auth)/auth";
import { db } from "@/lib/db";
import { voice31_uploads } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const uploads = await db
      .select()
      .from(voice31_uploads)
      .where(eq(voice31_uploads.user_id, session.user.id))
      .orderBy(desc(voice31_uploads.created_at))
      .limit(100);

    // Transform to match client-side UploadedFile shape
    const result = uploads.map((u) => ({
      id: u.id,
      filename: u.filename,
      blobUrl: u.blob_url,
      fileType: u.file_type,
      mimeType: u.mime_type,
      analysis: u.analysis,
      contentType: u.content_type,
      keywords: (() => {
        try { return JSON.parse(u.keywords); } catch { return []; }
      })(),
      processed: u.processed ? (() => {
        try { return JSON.parse(u.processed); } catch { return undefined; }
      })() : undefined,
      uploadedAt: new Date(u.created_at).getTime(),
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("[voice31/uploads] GET error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch uploads" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "Missing upload ID" }, { status: 400 });
    }

    await db
      .delete(voice31_uploads)
      .where(
        and(
          eq(voice31_uploads.id, id),
          eq(voice31_uploads.user_id, session.user.id),
        ),
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[voice31/uploads] DELETE error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete upload" },
      { status: 500 },
    );
  }
}
