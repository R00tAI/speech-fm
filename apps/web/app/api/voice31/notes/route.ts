import { desc, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { db } from "@/lib/db/connection";
import { voice31_notes } from "@/lib/db/schema";

export const runtime = "nodejs";

/**
 * GET /api/voice31/notes - List all notes for the authenticated user
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notes = await db
      .select()
      .from(voice31_notes)
      .where(eq(voice31_notes.user_id, session.user.id))
      .orderBy(desc(voice31_notes.updated_at));

    return NextResponse.json({ notes });
  } catch (error: any) {
    // Gracefully return empty notes on any DB error (table missing, connection timeout, pool exhaustion, etc.)
    // This endpoint is called on every page load — a 500 here is noisy and non-critical
    const msg = error?.message || String(error);
    console.warn("[Voice31 Notes GET] DB error (returning empty):", msg);
    return NextResponse.json({ notes: [] });
  }
}

/**
 * POST /api/voice31/notes - Create a new note
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, tags } = body;

    const [note] = await db
      .insert(voice31_notes)
      .values({
        user_id: session.user.id,
        title: title || "Untitled",
        content: content || "",
        tags: tags ? JSON.stringify(tags) : null,
      })
      .returning();

    return NextResponse.json({ note }, { status: 201 });
  } catch (error: any) {
    const isTableMissing =
      error?.code === "42P01" ||
      error?.cause?.code === "42P01" ||
      (error instanceof Error && error.message?.includes("does not exist"));
    if (isTableMissing) {
      console.warn("[Voice31 Notes POST] Table not yet created");
      return NextResponse.json(
        {
          error: "Notes feature not yet available — database migration pending",
        },
        { status: 503 },
      );
    }
    console.error("[Voice31 Notes POST] Error:", error);
    return NextResponse.json(
      { error: "Failed to create note" },
      { status: 500 },
    );
  }
}
