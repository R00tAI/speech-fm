/**
 * Tracked AI SDK Wrappers
 *
 * Wraps Vercel AI SDK 5's streamText/generateText with automatic cost tracking.
 * Uses the built-in onFinish callback for usage data.
 *
 * Usage:
 *   import { trackedStreamText, trackedGenerateText } from '@/lib/ai/tracked-ai';
 *   import { anthropic } from '@ai-sdk/anthropic';
 *
 *   // Streaming with auto-tracking
 *   const result = await trackedStreamText({
 *     model: anthropic('claude-sonnet-4-5-20251101'),
 *     messages,
 *   });
 *
 *   // Non-streaming with auto-tracking
 *   const result = await trackedGenerateText({
 *     model: openai('gpt-4o'),
 *     messages,
 *   });
 */

import { streamText, generateText } from 'ai';
import { getUserIdOptional, getRequestId } from './request-context';
import { trackTokenUsage } from '../services/cost-tracking.service';

// Types
type StreamTextParams = Parameters<typeof streamText>[0];
type GenerateTextParams = Parameters<typeof generateText>[0];

interface UsageData {
  inputTokens?: number;
  outputTokens?: number;
}

// Extended params with optional explicit userId for edge runtime
interface TrackedStreamTextParams extends StreamTextParams {
  _userId?: string; // Optional explicit userId (for edge runtime where AsyncLocalStorage doesn't work)
}

interface TrackedGenerateTextParams extends GenerateTextParams {
  _userId?: string;
}

/**
 * Extract provider and model ID from the model object
 * AI SDK models expose these on the model instance
 */
function extractModelInfo(model: StreamTextParams['model']): { provider: string; modelId: string } {
  // Try to get modelId - it's usually available
  const modelId = (model as any).modelId || (model as any).id || 'unknown';

  // Provider can be inferred from modelId or specificationVersion
  let provider = 'unknown';
  const modelIdStr = String(modelId).toLowerCase();

  if (modelIdStr.includes('claude') || modelIdStr.includes('anthropic')) {
    provider = 'anthropic';
  } else if (modelIdStr.includes('gpt') || modelIdStr.includes('openai')) {
    provider = 'openai';
  }

  // Also check provider property if available
  const modelProvider = (model as any).provider;
  if (typeof modelProvider === 'string') {
    if (modelProvider.includes('anthropic')) provider = 'anthropic';
    if (modelProvider.includes('openai')) provider = 'openai';
  }

  return { provider, modelId };
}

/**
 * Track usage from AI SDK result
 */
async function trackUsage(
  provider: string,
  model: string,
  usage: UsageData,
  endpoint: string,
  explicitUserId?: string
): Promise<void> {
  // Use explicit userId if provided (edge runtime), otherwise get from AsyncLocalStorage
  const userId = explicitUserId || getUserIdOptional();
  if (!userId) {
    console.debug('[TrackedAI] Skipping tracking - no user context');
    return;
  }

  // Only track anthropic and openai for now
  if (provider !== 'anthropic' && provider !== 'openai') {
    console.debug(`[TrackedAI] Skipping tracking - unsupported provider: ${provider}`);
    return;
  }

  const inputTokens = usage.inputTokens ?? 0;
  const outputTokens = usage.outputTokens ?? 0;

  if (inputTokens === 0 && outputTokens === 0) {
    console.debug('[TrackedAI] Skipping tracking - no tokens used');
    return;
  }

  try {
    await trackTokenUsage({
      userId,
      provider: provider as 'anthropic' | 'openai',
      model,
      service: 'chat',
      endpoint,
      inputTokens,
      outputTokens,
      cachedTokens: 0,
      requestId: getRequestId() ?? undefined,
    });
  } catch (error) {
    console.error('[TrackedAI] Failed to track usage:', error);
  }
}

/**
 * Wrapped streamText with automatic cost tracking
 *
 * Injects onFinish callback to track usage when stream completes.
 * Your own onFinish callback will still be called.
 *
 * For edge runtime, pass _userId explicitly since AsyncLocalStorage doesn't work.
 */
export async function trackedStreamText(
  params: TrackedStreamTextParams
): ReturnType<typeof streamText> {
  const { _userId, ...streamParams } = params;
  const { provider, modelId } = extractModelInfo(params.model);
  const userOnFinish = params.onFinish;

  return streamText({
    ...streamParams,
    onFinish: async (event) => {
      // Track usage - AI SDK provides inputTokens/outputTokens
      if (event.usage) {
        trackUsage(provider, modelId, event.usage, '/ai/stream', _userId).catch(() => {});
      }

      // Call user's onFinish if provided
      if (userOnFinish) {
        await userOnFinish(event);
      }
    },
  });
}

/**
 * Wrapped generateText with automatic cost tracking
 *
 * Tracks usage from the result after generation completes.
 *
 * For edge runtime, pass _userId explicitly since AsyncLocalStorage doesn't work.
 */
export async function trackedGenerateText(
  params: TrackedGenerateTextParams
): ReturnType<typeof generateText> {
  const { _userId, ...generateParams } = params;
  const { provider, modelId } = extractModelInfo(params.model);

  const result = await generateText(generateParams);

  // Track usage from result
  if (result.usage) {
    trackUsage(provider, modelId, result.usage, '/ai/generate', _userId).catch(() => {});
  }

  return result;
}

/**
 * Create an onFinish handler that tracks usage
 * Use this if you need more control or want to add to existing handlers
 *
 * Example:
 *   const result = await streamText({
 *     model,
 *     messages,
 *     onFinish: createTrackingOnFinish(model, myOtherHandler),
 *   });
 */
export function createTrackingOnFinish(
  model: StreamTextParams['model'],
  userOnFinish?: StreamTextParams['onFinish']
): StreamTextParams['onFinish'] {
  const { provider, modelId } = extractModelInfo(model);

  return async (event) => {
    if (event.usage) {
      trackUsage(provider, modelId, event.usage, '/ai/stream').catch(() => {});
    }
    if (userOnFinish) {
      await userOnFinish(event);
    }
  };
}
