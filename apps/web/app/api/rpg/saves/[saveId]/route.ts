import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import {
  getRPGSave,
  updateRPGSave,
  deleteRPGSave,
} from "@/lib/db/rpg-save-queries";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ saveId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { saveId } = await params;
    const save = await getRPGSave(saveId);

    if (!save) {
      return NextResponse.json({ error: "Save not found" }, { status: 404 });
    }

    if (save.user_id !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      save: {
        ...save,
        snapshot: JSON.parse(save.snapshot),
      },
    });
  } catch (error) {
    console.error("[RPG Saves] GET by ID error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to load save",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ saveId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { saveId } = await params;
    const existing = await getRPGSave(saveId);

    if (!existing) {
      return NextResponse.json({ error: "Save not found" }, { status: 404 });
    }

    if (existing.user_id !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, snapshot } = body;

    const updated = await updateRPGSave(saveId, {
      name,
      description,
      snapshot: snapshot
        ? typeof snapshot === "string"
          ? snapshot
          : JSON.stringify(snapshot)
        : undefined,
    });

    return NextResponse.json({ success: true, save: updated });
  } catch (error) {
    console.error("[RPG Saves] PUT error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update save",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ saveId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { saveId } = await params;
    const existing = await getRPGSave(saveId);

    if (!existing) {
      return NextResponse.json({ error: "Save not found" }, { status: 404 });
    }

    if (existing.user_id !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await deleteRPGSave(saveId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[RPG Saves] DELETE error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to delete save",
      },
      { status: 500 }
    );
  }
}
