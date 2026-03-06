import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";

export const runtime = "nodejs";

/**
 * GET /api/voice31/artifacts
 * List user's artifacts (paginated, filterable by type/tags)
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const tag = searchParams.get("tag");
  const limit = Math.min(
    Number.parseInt(searchParams.get("limit") || "50"),
    100,
  );
  const offset = Number.parseInt(searchParams.get("offset") || "0");

  try {
    const { db } = await import("@/lib/db");
    const { voice31_artifacts } = await import("@/lib/db/schema");
    const { eq, desc, and, sql } = await import("drizzle-orm");

    const conditions = [eq(voice31_artifacts.user_id, session.user.id)];

    if (type && type !== "all") {
      conditions.push(eq(voice31_artifacts.type, type));
    }

    const results = await db
      .select()
      .from(voice31_artifacts)
      .where(and(...conditions))
      .orderBy(desc(voice31_artifacts.created_at))
      .limit(limit)
      .offset(offset);

    // Parse JSON fields
    const artifacts = results.map((r) => ({
      id: r.id,
      type: r.type,
      title: r.title,
      preview: r.preview,
      content: JSON.parse(r.content || "{}"),
      tags: JSON.parse(r.tags || "[]"),
      source: r.source,
      pinned: r.pinned,
      createdAt: new Date(r.created_at).getTime(),
      updatedAt: new Date(r.updated_at).getTime(),
    }));

    // Filter by tag in-memory (JSON array in text field)
    const filtered = tag
      ? artifacts.filter((a: any) => a.tags.includes(tag))
      : artifacts;

    return NextResponse.json({ artifacts: filtered, total: filtered.length });
  } catch (error) {
    const pgCode = (error as any)?.code || (error as any)?.cause?.code;
    const msg = (error as any)?.message || "";
    if (pgCode === "42P01" || msg.includes("does not exist")) {
      return NextResponse.json({ artifacts: [], total: 0 });
    }
    console.error("[Voice31 Artifacts API] GET error:", error);
    return NextResponse.json(
      { error: "Failed to load artifacts" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/voice31/artifacts
 * Create artifact
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { type, title, preview, content, tags, source, pinned } = body;

    if (!(type && title)) {
      return NextResponse.json(
        { error: "type and title are required" },
        { status: 400 },
      );
    }

    const { db } = await import("@/lib/db");
    const { voice31_artifacts } = await import("@/lib/db/schema");

    const [inserted] = await db
      .insert(voice31_artifacts)
      .values({
        user_id: session.user.id,
        type,
        title,
        preview: preview || null,
        content: JSON.stringify(content || {}),
        tags: JSON.stringify(tags || []),
        source: source || "voice31",
        pinned: pinned,
      })
      .returning({ id: voice31_artifacts.id });

    return NextResponse.json({ id: inserted.id, success: true });
  } catch (error) {
    const pgCode = (error as any)?.code || (error as any)?.cause?.code;
    const msg = (error as any)?.message || "";
    if (pgCode === "42P01" || msg.includes("does not exist")) {
      return NextResponse.json(
        { error: "Artifacts table not yet created", id: null },
        { status: 200 },
      );
    }
    console.error("[Voice31 Artifacts API] POST error:", error);
    return NextResponse.json(
      { error: "Failed to create artifact" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/voice31/artifacts?id=xxx
 * Delete artifact
 */
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  try {
    const { db } = await import("@/lib/db");
    const { voice31_artifacts } = await import("@/lib/db/schema");
    const { eq, and } = await import("drizzle-orm");

    await db
      .delete(voice31_artifacts)
      .where(
        and(
          eq(voice31_artifacts.id, id),
          eq(voice31_artifacts.user_id, session.user.id),
        ),
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    const pgCode = (error as any)?.code || (error as any)?.cause?.code;
    const msg = (error as any)?.message || "";
    if (pgCode === "42P01" || msg.includes("does not exist")) {
      return NextResponse.json({ success: true });
    }
    console.error("[Voice31 Artifacts API] DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete artifact" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/voice31/artifacts
 * Update artifact (tags, pinned)
 */
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, tags, pinned } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const { db } = await import("@/lib/db");
    const { voice31_artifacts } = await import("@/lib/db/schema");
    const { eq, and } = await import("drizzle-orm");

    const updates: Record<string, any> = {
      updated_at: new Date(),
    };
    if (tags !== undefined) updates.tags = JSON.stringify(tags);
    if (pinned !== undefined) updates.pinned = pinned;

    await db
      .update(voice31_artifacts)
      .set(updates)
      .where(
        and(
          eq(voice31_artifacts.id, id),
          eq(voice31_artifacts.user_id, session.user.id),
        ),
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    const pgCode = (error as any)?.code || (error as any)?.cause?.code;
    const msg = (error as any)?.message || "";
    if (pgCode === "42P01" || msg.includes("does not exist")) {
      return NextResponse.json({ success: true });
    }
    console.error("[Voice31 Artifacts API] PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update artifact" },
      { status: 500 },
    );
  }
}
