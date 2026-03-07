import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db';
import { subscriptions, voice_sessions, voice_agents, credit_transactions, usage_logs } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export const runtime = 'nodejs';

// Minimum credits required to start a voice session
const MIN_CREDITS_REQUIRED = 1;
// Credits per minute of voice conversation
const CREDITS_PER_MINUTE = 0.5;

/**
 * GET /api/elevenlabs/signed-url
 *
 * Returns a signed URL for ElevenLabs Conversational AI WebSocket connection.
 * Includes credit check and session creation for logged-in users.
 */
export async function GET() {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
    const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID?.trim();

    if (!apiKey) {
      return NextResponse.json(
        { error: 'ELEVENLABS_API_KEY not configured' },
        { status: 500 }
      );
    }

    if (!agentId) {
      return NextResponse.json(
        { error: 'NEXT_PUBLIC_ELEVENLABS_AGENT_ID not configured' },
        { status: 500 }
      );
    }

    // Auth + DB ops isolated — failures here must not block the signed URL
    let sessionId: string | null = null;
    let creditsBalance = 10; // Default for unauthenticated users

    try {
      const session = await auth();

      if (session?.user?.id) {
        const userId = session.user.id;

        // Check user's credit balance
        const [subscription] = await db
          .select({ credits_balance: subscriptions.credits_balance })
          .from(subscriptions)
          .where(eq(subscriptions.user_id, userId))
          .limit(1);

        creditsBalance = subscription?.credits_balance ?? 10;

        if (creditsBalance < MIN_CREDITS_REQUIRED) {
          return NextResponse.json(
            { error: 'Insufficient credits', credits_balance: creditsBalance },
            { status: 402 }
          );
        }

        // Get or create a voice agent record for this user
        let [agent] = await db
          .select({ id: voice_agents.id })
          .from(voice_agents)
          .where(
            and(
              eq(voice_agents.user_id, userId),
              eq(voice_agents.voice_provider, 'elevenlabs')
            )
          )
          .limit(1);

        if (!agent) {
          const [newAgent] = await db
            .insert(voice_agents)
            .values({
              user_id: userId,
              name: 'Voice31 Assistant',
              voice_provider: 'elevenlabs',
              voice_id: agentId,
              is_active: true,
            })
            .returning({ id: voice_agents.id });
          agent = newAgent;
        }

        // Create a new voice session
        const [newSession] = await db
          .insert(voice_sessions)
          .values({
            user_id: userId,
            agent_id: agent.id,
            status: 'active',
            started_at: new Date(),
          })
          .returning({ id: voice_sessions.id });

        sessionId = newSession.id;
      }
    } catch (authErr) {
      console.error('[ElevenLabs] Auth/DB error (non-fatal):', authErr instanceof Error ? authErr.message : authErr);
    }

    console.log('[ElevenLabs] Requesting signed URL for agent:', agentId, 'session:', sessionId);

    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${agentId}`,
      {
        headers: {
          'xi-api-key': apiKey,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ElevenLabs] Failed to get signed URL:', response.status, errorText);

      // Avoid surfacing upstream 404 as local route-not-found noise.
      const mappedStatus = response.status === 404 ? 502 : response.status;
      return NextResponse.json(
        {
          error: `Failed to get signed URL: ${response.status}`,
          upstreamStatus: response.status,
        },
        { status: mappedStatus }
      );
    }

    const data = await response.json();

    console.log('[ElevenLabs] Signed URL obtained successfully');

    return NextResponse.json({
      signedUrl: data.signed_url,
      agentId,
      sessionId,
      credits_balance: creditsBalance,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    console.error('[ElevenLabs] Error getting signed URL:', message, stack);
    return NextResponse.json(
      { error: 'Internal server error', detail: message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/elevenlabs/signed-url
 *
 * End a voice session and deduct credits based on duration.
 */
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId, durationMs, messageCount, toolCallsCount } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // Calculate credits to deduct
    const durationMinutes = Math.ceil((durationMs || 0) / 60000);
    const creditsUsed = Math.max(1, Math.round(durationMinutes * CREDITS_PER_MINUTE * 10) / 10);

    // Update session with end data
    await db
      .update(voice_sessions)
      .set({
        status: 'completed',
        ended_at: new Date(),
        total_duration_ms: durationMs || 0,
        message_count: messageCount || 0,
        end_reason: 'user_ended',
      })
      .where(
        and(
          eq(voice_sessions.id, sessionId),
          eq(voice_sessions.user_id, session.user.id)
        )
      );

    // Deduct credits
    const [subscription] = await db
      .select({ id: subscriptions.id, credits_balance: subscriptions.credits_balance })
      .from(subscriptions)
      .where(eq(subscriptions.user_id, session.user.id))
      .limit(1);

    if (subscription) {
      const newBalance = Math.max(0, (subscription.credits_balance ?? 0) - creditsUsed);

      await db
        .update(subscriptions)
        .set({ credits_balance: newBalance })
        .where(eq(subscriptions.id, subscription.id));

      // Log the credit transaction
      await db.insert(credit_transactions).values({
        user_id: session.user.id,
        subscription_id: subscription.id,
        amount: -Math.round(creditsUsed),
        balance_after: Math.round(newBalance),
        type: 'usage',
        usage_type: 'voice_session',
        reference_id: sessionId,
        description: `Voice session: ${durationMinutes} min, ${messageCount || 0} messages`,
      });

      // Log usage
      await db.insert(usage_logs).values({
        user_id: session.user.id,
        resource_type: 'voice',
        resource_id: sessionId,
        provider: 'elevenlabs',
        duration_ms: durationMs || 0,
        credits_used: Math.round(creditsUsed),
        metadata: JSON.stringify({ messageCount, toolCallsCount }),
      });
    }

    return NextResponse.json({
      success: true,
      credits_used: creditsUsed,
    });
  } catch (error) {
    console.error('[ElevenLabs] Error ending session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
