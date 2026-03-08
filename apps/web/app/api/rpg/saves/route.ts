import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import {
  createRPGSave,
  getUserRPGSaves,
  upsertRPGSave,
} from "@/lib/db/rpg-save-queries";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { session_id, name, description, snapshot, upsert } = body;

    if (!session_id || !name || !snapshot) {
      return NextResponse.json(
        { error: "session_id, name, and snapshot are required" },
        { status: 400 }
      );
    }

    if (typeof session_id !== "string" || !UUID_REGEX.test(session_id)) {
      return NextResponse.json(
        { error: "session_id must be a valid UUID" },
        { status: 400 }
      );
    }

    const saveData = {
      session_id,
      user_id: session.user.id,
      name,
      description,
      snapshot:
        typeof snapshot === "string" ? snapshot : JSON.stringify(snapshot),
    };

    const save = upsert
      ? await upsertRPGSave(saveData)
      : await createRPGSave(saveData);

    return NextResponse.json({ success: true, save });
  } catch (error) {
    console.error("[RPG Saves] POST error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create save",
      },
      { status: 500 }
    );
  }
}

function extractSaveMetadata(
  snapshot: string
): Record<string, unknown> {
  try {
    const data = JSON.parse(snapshot);
    return {
      playerName: data.player?.name,
      playerLevel: data.player?.stats?.level,
      currentLocation: data.currentLocationId,
      playTime: data.playTime,
      thumbnail: data.thumbnail,
    };
  } catch {
    return {};
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const saves = await getUserRPGSaves(session.user.id);

    const summaries = saves.map((s) => ({
      id: s.id,
      session_id: s.session_id,
      name: s.name,
      description: s.description,
      created_at: s.created_at,
      ...extractSaveMetadata(s.snapshot),
    }));

    return NextResponse.json({ success: true, saves: summaries });
  } catch (error) {
    console.error("[RPG Saves] GET error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to list saves",
      },
      { status: 500 }
    );
  }
}
