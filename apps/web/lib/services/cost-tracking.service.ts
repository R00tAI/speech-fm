/**
 * Cost Tracking Service
 *
 * Tracks API usage per user for billing/budgeting.
 * Writes to the fal_api_usage table and calculates costs
 * from the pricing config.
 */

import db from "@/lib/db/connection";
import { fal_api_usage } from "@/lib/db/schema";
import { calculateUnitCost, calculateCharacterCost } from "@/lib/config/pricing.config";
import { sql } from "drizzle-orm";

export interface UsageUnit {
  userId: string;
  service: string;
  operation: string;
  units: number;
  // Extended fields accepted from various callers
  provider?: string;
  model?: string;
  endpoint?: string;
  requestId?: string;
  metadata?: Record<string, unknown>;
}

export async function trackUnitUsage(usage: UsageUnit): Promise<void> {
  // Use model if provided, fall back to operation
  const modelId = usage.model || usage.operation;
  const provider = usage.provider || "fal";
  const costUsd = calculateUnitCost(provider as "fal", modelId, usage.units);

  try {
    await db.insert(fal_api_usage).values({
      user_id: usage.userId,
      model: modelId,
      operation: usage.service,
      units: usage.units,
      cost_usd: costUsd > 0 ? costUsd.toFixed(6) : "0.000000",
      input_params: usage.metadata ? JSON.stringify(usage.metadata) : null,
    });
  } catch (error) {
    // Don't let tracking failures break the main flow
    console.error("[cost-tracking] DB insert failed:", error);
    // Fallback to console log
    if (process.env.NODE_ENV === "development") {
      console.log(
        `[cost-tracking] ${usage.service}/${usage.operation}: ${usage.units} units ($${costUsd.toFixed(4)}) (user: ${usage.userId})`,
      );
    }
  }
}

export async function getUserUsage(userId: string): Promise<number> {
  try {
    const result = await db
      .select({ total: sql<string>`COALESCE(SUM(${fal_api_usage.cost_usd}), 0)` })
      .from(fal_api_usage)
      .where(sql`${fal_api_usage.user_id} = ${userId}`);
    return parseFloat(result[0]?.total || "0");
  } catch {
    return 0;
  }
}

export interface CharacterUsage {
  userId: string;
  provider: string;
  model: string;
  service: string;
  endpoint: string;
  characters: number;
  metadata?: Record<string, unknown>;
}

export async function trackCharacterUsage(usage: CharacterUsage): Promise<void> {
  const costUsd = calculateCharacterCost(
    usage.provider as "elevenlabs",
    usage.model,
    usage.characters,
  );

  try {
    await db.insert(fal_api_usage).values({
      user_id: usage.userId,
      model: usage.model,
      operation: usage.service,
      units: usage.characters,
      cost_usd: costUsd > 0 ? costUsd.toFixed(6) : "0.000000",
      input_params: usage.metadata ? JSON.stringify(usage.metadata) : null,
    });
  } catch (error) {
    console.error("[cost-tracking] Character usage DB insert failed:", error);
    if (process.env.NODE_ENV === "development") {
      console.log(
        `[cost-tracking] ${usage.provider}/${usage.service}: ${usage.characters} chars ($${costUsd.toFixed(4)}) (user: ${usage.userId})`,
      );
    }
  }
}
