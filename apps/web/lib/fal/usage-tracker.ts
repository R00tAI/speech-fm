import { db } from "@/lib/db";
import { fal_api_usage, subscriptions } from "@/lib/db/schema";
import { eq, and, gte } from "drizzle-orm";

/**
 * Credit costs by fal.ai model endpoint
 * Adjust these based on actual costs and desired margins
 */
const CREDIT_COST_TABLE: Record<string, number> = {
  "fal-ai/flux-pro": 5,
  "fal-ai/flux/schnell": 1,
  "fal-ai/flux/dev": 2,
  "fal-ai/stable-diffusion": 1,
  "fal-ai/kling-video": 50,
  "fal-ai/minimax-video": 30,
  "fal-ai/luma-dream-machine": 40,
  "fal-ai/runway-gen3": 35,
};

/**
 * Resolution multipliers for image generation
 */
const RESOLUTION_MULTIPLIERS: Record<string, number> = {
  landscape_16_9: 1.5,
  portrait_9_16: 1.5,
  square: 1.0,
  landscape_4_3: 1.3,
  portrait_3_4: 1.3,
};

interface TrackFalUsageParams {
  userId: string;
  chatId?: string;
  endpoint: string;
  requestType: "image" | "video" | "audio";
  prompt: string;
  parameters: any;
  requestId: string;
}

interface UsageTracker {
  usageId: string;
  updateSuccess: (resultUrl: string, falCost?: number) => Promise<void>;
  updateFailure: (errorMessage: string) => Promise<void>;
}

/**
 * Calculate credit cost based on endpoint and parameters
 */
export function calculateCredits(endpoint: string, parameters: any): number {
  const baseCost = CREDIT_COST_TABLE[endpoint] || 1;

  // Adjust for resolution if it's an image
  if (parameters?.image_size && RESOLUTION_MULTIPLIERS[parameters.image_size]) {
    return Math.ceil(baseCost * RESOLUTION_MULTIPLIERS[parameters.image_size]);
  }

  // Adjust for video duration if applicable
  if (parameters?.duration && typeof parameters.duration === "number") {
    // Each 5 seconds adds 50% to cost
    const durationMultiplier = 1 + (parameters.duration / 5) * 0.5;
    return Math.ceil(baseCost * durationMultiplier);
  }

  return baseCost;
}

/**
 * Track a fal.ai API usage event
 * Returns functions to update the tracking record with success/failure
 */
export async function trackFalUsage(
  params: TrackFalUsageParams
): Promise<UsageTracker> {
  const { userId, chatId, endpoint, requestType, prompt, parameters, requestId } = params;
  const startTime = Date.now();

  // Calculate credit cost
  const creditsUsed = calculateCredits(endpoint, parameters);

  // Insert tracking record with pending status
  const [usage] = await db
    .insert(fal_api_usage)
    .values({
      user_id: userId,
      chat_id: chatId,
      endpoint,
      request_type: requestType,
      prompt,
      parameters: JSON.stringify(parameters),
      request_id: requestId,
      credits_used: creditsUsed,
      status: "pending",
    })
    .returning();

  return {
    usageId: usage.id,

    async updateSuccess(resultUrl: string, falCost?: number) {
      const durationMs = Date.now() - startTime;

      await db
        .update(fal_api_usage)
        .set({
          status: "success",
          result_url: resultUrl,
          fal_cost: falCost ? falCost.toString() : null,
          duration_ms: durationMs,
        })
        .where(eq(fal_api_usage.id, usage.id));

      // Update user subscription usage counter
      await incrementUsageCounter(userId, requestType);
    },

    async updateFailure(errorMessage: string) {
      const durationMs = Date.now() - startTime;

      await db
        .update(fal_api_usage)
        .set({
          status: "failed",
          error_message: errorMessage,
          duration_ms: durationMs,
        })
        .where(eq(fal_api_usage.id, usage.id));

      // Don't increment usage counter on failure
    },
  };
}

/**
 * Increment the usage counter for a specific media type
 */
async function incrementUsageCounter(
  userId: string,
  type: "image" | "video" | "audio"
): Promise<void> {
  try {
    // Get current subscription
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.user_id, userId))
      .limit(1);

    if (!subscription) {
      console.warn(`[Usage Tracker] No subscription found for user ${userId}`);
      return;
    }

    // Increment the appropriate counter
    const updates: any = {
      updated_at: new Date(),
    };

    if (type === "image") {
      updates.current_image_generations = (subscription.current_image_generations || 0) + 1;
    } else if (type === "video") {
      updates.current_video_generations = (subscription.current_video_generations || 0) + 1;
    } else if (type === "audio") {
      updates.current_audio_generations = (subscription.current_audio_generations || 0) + 1;
    }

    await db
      .update(subscriptions)
      .set(updates)
      .where(eq(subscriptions.user_id, userId));
  } catch (error) {
    console.error(`[Usage Tracker] Error incrementing usage counter for user ${userId}:`, error);
    // Don't block the generation flow if usage tracking fails
  }
}

/**
 * Check if user has reached their usage limit for a specific media type
 * Returns true if user can generate, false if limit reached
 */
export async function checkUsageLimit(
  userId: string,
  type: "image" | "video" | "audio"
): Promise<{ allowed: boolean; current: number; limit: number }> {
  try {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.user_id, userId))
      .limit(1);

    if (!subscription) {
      // No subscription = allow with generous defaults for demo/testing
      return { allowed: true, current: 0, limit: 100 };
    }

    const limits = {
      image: subscription.image_generations_per_month || 0,
      video: subscription.video_generations_per_month || 0,
      audio: subscription.audio_generations_per_month || 0,
    };

    const current = {
      image: subscription.current_image_generations || 0,
      video: subscription.current_video_generations || 0,
      audio: subscription.current_audio_generations || 0,
    };

    const limit = limits[type];
    const usage = current[type];

    // -1 means unlimited (for enterprise tier)
    if (limit === -1) {
      return { allowed: true, current: usage, limit: -1 };
    }

    return {
      allowed: usage < limit,
      current: usage,
      limit,
    };
  } catch (error) {
    console.error(`[Usage Tracker] Error checking usage limit for user ${userId}:`, error);
    // On database error, allow with generous defaults to not block users
    return { allowed: true, current: 0, limit: 100 };
  }
}

/**
 * Get usage statistics for a user
 */
export async function getUserUsageStats(userId: string) {
  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.user_id, userId))
    .limit(1);

  if (!subscription) {
    return null;
  }

  return {
    tier: subscription.tier,
    limits: {
      images: subscription.image_generations_per_month || 0,
      videos: subscription.video_generations_per_month || 0,
      audio: subscription.audio_generations_per_month || 0,
    },
    usage: {
      images: subscription.current_image_generations || 0,
      videos: subscription.current_video_generations || 0,
      audio: subscription.current_audio_generations || 0,
    },
    resetAt: subscription.usage_reset_at,
  };
}

/**
 * Reset usage counters (should be called monthly via cron job)
 */
export async function resetMonthlyUsage(userId: string): Promise<void> {
  const nextResetDate = new Date();
  nextResetDate.setMonth(nextResetDate.getMonth() + 1);

  await db
    .update(subscriptions)
    .set({
      current_image_generations: 0,
      current_video_generations: 0,
      current_audio_generations: 0,
      usage_reset_at: nextResetDate,
      updated_at: new Date(),
    })
    .where(eq(subscriptions.user_id, userId));
}

/**
 * Get recent usage history for a user
 */
export async function getRecentUsage(userId: string, limit: number = 10) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return await db
    .select()
    .from(fal_api_usage)
    .where(
      and(
        eq(fal_api_usage.user_id, userId),
        gte(fal_api_usage.created_at, thirtyDaysAgo)
      )
    )
    .orderBy(fal_api_usage.created_at)
    .limit(limit);
}
