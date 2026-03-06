import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { db } from "@/lib/db/connection";
import { voice31_notes } from "@/lib/db/schema";

export const runtime = "nodejs";

/**
 * PUT /api/voice31/notes/[id] - Update a note
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { title, content, tags } = body;

    const updates: Record<string, any> = {
      updated_at: new Date(),
    };
    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.content = content;
    if (tags !== undefined) updates.tags = JSON.stringify(tags);

    const [note] = await db
      .update(voice31_notes)
      .set(updates)
      .where(
        and(
          eq(voice31_notes.id, id),
          eq(voice31_notes.user_id, session.user.id),
        ),
      )
      .returning();

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    return NextResponse.json({ note });
  } catch (error: any) {
    const isTableMissing =
      error?.code === "42P01" ||
      error?.cause?.code === "42P01" ||
      (error instanceof Error && error.message?.includes("does not exist"));
    if (isTableMissing) {
      return NextResponse.json(
        { error: "Notes feature not yet available" },
        { status: 503 },
      );
    }
    console.error("[Voice31 Notes PUT] Error:", error);
    return NextResponse.json(
      { error: "Failed to update note" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/voice31/notes/[id] - Delete a note
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const [deleted] = await db
      .delete(voice31_notes)
      .where(
        and(
          eq(voice31_notes.id, id),
          eq(voice31_notes.user_id, session.user.id),
        ),
      )
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    const isTableMissing =
      error?.code === "42P01" ||
      error?.cause?.code === "42P01" ||
      (error instanceof Error && error.message?.includes("does not exist"));
    if (isTableMissing) {
      return NextResponse.json(
        { error: "Notes feature not yet available" },
        { status: 503 },
      );
    }
    console.error("[Voice31 Notes DELETE] Error:", error);
    return NextResponse.json(
      { error: "Failed to delete note" },
      { status: 500 },
    );
  }
}
