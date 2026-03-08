import { eq, and, desc } from "drizzle-orm";
import db from "./connection";
import { rpg_game_saves } from "./schema";
import type { RpgGameSave } from "./schema";

export interface CreateSaveParams {
  session_id: string;
  user_id: string;
  name: string;
  description?: string;
  snapshot: string;
}

export async function createRPGSave(
  data: CreateSaveParams
): Promise<RpgGameSave> {
  const [save] = await db
    .insert(rpg_game_saves)
    .values({
      session_id: data.session_id,
      user_id: data.user_id,
      name: data.name,
      description: data.description || null,
      snapshot: data.snapshot,
    })
    .returning();
  return save;
}

export async function getRPGSave(
  saveId: string
): Promise<RpgGameSave | null> {
  const [save] = await db
    .select()
    .from(rpg_game_saves)
    .where(eq(rpg_game_saves.id, saveId));
  return save || null;
}

export async function getUserRPGSaves(
  userId: string
): Promise<RpgGameSave[]> {
  return db
    .select()
    .from(rpg_game_saves)
    .where(eq(rpg_game_saves.user_id, userId))
    .orderBy(desc(rpg_game_saves.created_at));
}

export async function updateRPGSave(
  saveId: string,
  data: { name?: string; description?: string; snapshot?: string }
): Promise<RpgGameSave | null> {
  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.snapshot !== undefined) updateData.snapshot = data.snapshot;

  if (Object.keys(updateData).length === 0) return null;

  const [updated] = await db
    .update(rpg_game_saves)
    .set(updateData)
    .where(eq(rpg_game_saves.id, saveId))
    .returning();
  return updated || null;
}

export async function deleteRPGSave(saveId: string): Promise<boolean> {
  const result = await db
    .delete(rpg_game_saves)
    .where(eq(rpg_game_saves.id, saveId))
    .returning();
  return result.length > 0;
}

export async function upsertRPGSave(
  data: CreateSaveParams
): Promise<RpgGameSave> {
  const [existing] = await db
    .select()
    .from(rpg_game_saves)
    .where(
      and(
        eq(rpg_game_saves.session_id, data.session_id),
        eq(rpg_game_saves.name, data.name)
      )
    );

  if (existing) {
    const [updated] = await db
      .update(rpg_game_saves)
      .set({ snapshot: data.snapshot, description: data.description || null })
      .where(eq(rpg_game_saves.id, existing.id))
      .returning();
    return updated;
  }

  return createRPGSave(data);
}
