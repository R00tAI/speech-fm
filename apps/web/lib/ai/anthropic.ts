/**
 * Tracked Anthropic Client
 *
 * Wraps the Anthropic SDK with automatic cost tracking.
 * Usage is identical to the raw SDK - tracking happens transparently.
 */

import Anthropic from '@anthropic-ai/sdk';
import { getUserIdOptional, getRequestId } from './request-context';
import { trackTokenUsage } from '@/lib/services/cost-tracking.service';

// Raw client instance
const rawClient = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Track usage after a successful API call
 * Fire-and-forget - don't block the response
 */
async function trackAnthropicUsage(
  model: string,
  inputTokens: number,
  outputTokens: number,
  cachedTokens: number,
  endpoint: string
): Promise<void> {
  const userId = getUserIdOptional();
  if (!userId) {
    // No user context - skip tracking (e.g., system calls)
    console.debug('[Anthropic] Skipping tracking - no user context');
    return;
  }

  try {
    await trackTokenUsage({
      userId,
      provider: 'anthropic',
      model,
      service: 'chat',
      endpoint,
      inputTokens,
      outputTokens,
      cachedTokens,
      requestId: getRequestId() ?? undefined,
    });
  } catch (error) {
    // Log but don't fail the request
    console.error('[Anthropic] Failed to track usage:', error);
  }
}

/**
 * Wrapped messages.create that auto-tracks usage
 */
async function createMessage(
  params: Anthropic.MessageCreateParamsNonStreaming
): Promise<Anthropic.Message> {
  const response = await rawClient.messages.create(params);

  // Track usage asynchronously (fire-and-forget)
  trackAnthropicUsage(
    params.model,
    response.usage.input_tokens,
    response.usage.output_tokens,
    response.usage.cache_read_input_tokens ?? 0,
    '/anthropic/messages'
  ).catch(() => {}); // Swallow errors

  return response;
}

/**
 * Wrapped streaming messages.create that auto-tracks usage
 * Uses a generator to intercept events and extract usage data
 */
async function* createMessageStreamTracked(
  params: Anthropic.MessageCreateParamsStreaming
): AsyncGenerator<Anthropic.MessageStreamEvent, void, unknown> {
  const stream = await rawClient.messages.create(params);

  let inputTokens = 0;
  let outputTokens = 0;
  let cacheReadTokens = 0;

  for await (const event of stream) {
    // Extract usage from message_start event
    if (event.type === 'message_start' && event.message?.usage) {
      inputTokens = event.message.usage.input_tokens;
      cacheReadTokens = event.message.usage.cache_read_input_tokens ?? 0;
    }

    // Extract output tokens from message_delta event (final event has usage)
    if (event.type === 'message_delta' && event.usage) {
      outputTokens = event.usage.output_tokens;
    }

    // Yield the event to the caller
    yield event;
  }

  // Track usage after stream completes (fire-and-forget)
  trackAnthropicUsage(
    params.model,
    inputTokens,
    outputTokens,
    cacheReadTokens,
    '/anthropic/messages/stream'
  ).catch(() => {});
}

/**
 * Wrapper to return AsyncIterable from generator
 */
async function createMessageStream(
  params: Anthropic.MessageCreateParamsStreaming
): Promise<AsyncIterable<Anthropic.MessageStreamEvent>> {
  // Return the generator as an AsyncIterable
  return createMessageStreamTracked(params);
}

/**
 * Wrapped messages API with tracking
 */
const trackedMessages = {
  create: async (
    params: Anthropic.MessageCreateParams
  ): Promise<Anthropic.Message | AsyncIterable<Anthropic.MessageStreamEvent>> => {
    if (params.stream) {
      return createMessageStream(params as Anthropic.MessageCreateParamsStreaming);
    }
    return createMessage(params as Anthropic.MessageCreateParamsNonStreaming);
  },
};

/**
 * Tracked Anthropic client
 * Drop-in replacement for the raw SDK
 */
export const anthropic = {
  messages: trackedMessages,
  // Expose raw client for advanced use cases
  raw: rawClient,
};

// Also export types for convenience
export type { Anthropic };
