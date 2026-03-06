import crypto from "crypto";
import { and, eq, sql } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  subscriptions,
  voice_agents,
  voice_embeds,
  voice_sessions,
} from "@/lib/db/schema";

export const runtime = "nodejs";

/**
 * GET /api/voice31/embed/signed-url
 *
 * Returns a signed URL for embedded voice widgets.
 * Authenticates via API key instead of Clerk session.
 */
export async function GET(request: NextRequest) {
  try {
    const apiKey =
      request.headers.get("x-api-key") ||
      request.nextUrl.searchParams.get("key");

    if (!apiKey) {
      return NextResponse.json({ error: "API key required" }, { status: 401 });
    }

    // Validate API key
    const [embed] = await db
      .select({
        id: voice_embeds.id,
        agent_id: voice_embeds.agent_id,
        user_id: voice_embeds.user_id,
        is_active: voice_embeds.is_active,
        allowed_domains: voice_embeds.allowed_domains,
        rate_limit_per_minute: voice_embeds.rate_limit_per_minute,
        max_session_duration_ms: voice_embeds.max_session_duration_ms,
        max_messages_per_session: voice_embeds.max_messages_per_session,
      })
      .from(voice_embeds)
      .where(eq(voice_embeds.api_key, apiKey))
      .limit(1);

    if (!embed) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }

    if (!embed.is_active) {
      return NextResponse.json(
        { error: "Embed is not active" },
        { status: 403 },
      );
    }

    // Check allowed domains
    const origin =
      request.headers.get("origin") || request.headers.get("referer");
    if (embed.allowed_domains && origin) {
      const allowedDomains = JSON.parse(embed.allowed_domains) as string[];
      if (allowedDomains.length > 0) {
        const originHost = new URL(origin).hostname;
        const isAllowed = allowedDomains.some(
          (domain) =>
            originHost === domain || originHost.endsWith(`.${domain}`),
        );
        if (!isAllowed) {
          return NextResponse.json(
            { error: "Domain not allowed" },
            { status: 403 },
          );
        }
      }
    }

    // Check user's credit balance
    const [subscription] = await db
      .select({ credits_balance: subscriptions.credits_balance })
      .from(subscriptions)
      .where(eq(subscriptions.user_id, embed.user_id))
      .limit(1);

    const creditsBalance = subscription?.credits_balance ?? 0;

    if (creditsBalance < 1) {
      return NextResponse.json(
        { error: "Insufficient credits" },
        { status: 402 },
      );
    }

    // Get ElevenLabs config
    const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
    const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;

    if (!(elevenLabsApiKey && agentId)) {
      return NextResponse.json(
        { error: "Voice service not configured" },
        { status: 500 },
      );
    }

    // Get signed URL from ElevenLabs
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${agentId}`,
      {
        headers: {
          "xi-api-key": elevenLabsApiKey,
        },
      },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to get voice session" },
        { status: 500 },
      );
    }

    const data = await response.json();

    // Create a session for tracking
    const [session] = await db
      .insert(voice_sessions)
      .values({
        user_id: embed.user_id,
        agent_id: embed.agent_id,
        embed_id: embed.id,
        status: "active",
        started_at: new Date(),
      })
      .returning({ id: voice_sessions.id });

    // Update embed usage
    await db
      .update(voice_embeds)
      .set({
        total_sessions: sql`${voice_embeds.total_sessions} + 1`,
        last_used_at: new Date(),
      })
      .where(eq(voice_embeds.id, embed.id));

    return NextResponse.json({
      signedUrl: data.signed_url,
      sessionId: session.id,
      config: {
        maxDurationMs: embed.max_session_duration_ms,
        maxMessages: embed.max_messages_per_session,
      },
    });
  } catch (error) {
    const pgCode = (error as any)?.code || (error as any)?.cause?.code;
    const msg = (error as any)?.message || "";
    if (pgCode === "42P01" || msg.includes("does not exist")) {
      console.warn("[Voice31 Embed] Table not yet created:", msg);
      return NextResponse.json(
        { error: "Embed tables not yet configured" },
        { status: 503 },
      );
    }
    console.error("[Voice31 Embed] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/voice31/embed/signed-url
 *
 * End an embed session and track usage.
 */
export async function POST(request: NextRequest) {
  try {
    const apiKey =
      request.headers.get("x-api-key") ||
      request.nextUrl.searchParams.get("key");

    if (!apiKey) {
      return NextResponse.json({ error: "API key required" }, { status: 401 });
    }

    // Validate API key
    const [embed] = await db
      .select({ id: voice_embeds.id, user_id: voice_embeds.user_id })
      .from(voice_embeds)
      .where(eq(voice_embeds.api_key, apiKey))
      .limit(1);

    if (!embed) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId, durationMs, messageCount } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID required" },
        { status: 400 },
      );
    }

    // Update session
    await db
      .update(voice_sessions)
      .set({
        status: "completed",
        ended_at: new Date(),
        total_duration_ms: durationMs || 0,
        message_count: messageCount || 0,
        end_reason: "embed_ended",
      })
      .where(
        and(
          eq(voice_sessions.id, sessionId),
          eq(voice_sessions.embed_id, embed.id),
        ),
      );

    // Update embed totals
    await db
      .update(voice_embeds)
      .set({
        total_messages: sql`${voice_embeds.total_messages} + ${messageCount || 0}`,
        total_duration_ms: sql`${voice_embeds.total_duration_ms} + ${durationMs || 0}`,
      })
      .where(eq(voice_embeds.id, embed.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    const pgCode = (error as any)?.code || (error as any)?.cause?.code;
    const msg = (error as any)?.message || "";
    if (pgCode === "42P01" || msg.includes("does not exist")) {
      console.warn("[Voice31 Embed] Table not yet created:", msg);
      return NextResponse.json(
        { error: "Embed tables not yet configured" },
        { status: 503 },
      );
    }
    console.error("[Voice31 Embed] Error ending session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
