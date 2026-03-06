/**
 * Centralized AI Provider Clients
 *
 * All AI API calls should go through these tracked functions.
 * Usage tracking happens automatically via onFinish callbacks.
 *
 * Usage with AI SDK 5:
 *   import { trackedStreamText, trackedGenerateText } from '@/lib/ai';
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
 *
 * Vercel AI Gateway Integration:
 *   import { gatewayOpenAI, gatewayAnthropic } from '@/lib/ai';
 *
 *   // Use gateway-routed providers (when enabled)
 *   const model = gatewayOpenAI('gpt-4o');
 *   const result = await trackedGenerateText({ model, messages });
 *
 * Other providers:
 *   import { elevenlabs, fal } from '@/lib/ai';
 *
 *   // ElevenLabs TTS
 *   const { audio } = await elevenlabs.generateSpeech({...});
 *
 *   // FAL Image Generation
 *   const { images } = await fal.generateImage({...});
 *
 * Request Context:
 *   For tracking to work, the request must have a user context set.
 *   Use withTracking() wrapper in route handlers.
 */

// AI SDK 5 tracked wrappers (primary API)
export {
  trackedStreamText,
  trackedGenerateText,
  createTrackingOnFinish,
} from './tracked-ai';

// Vercel AI Gateway integration
export {
  gatewayOpenAI,
  withGatewayLogging,
  isGatewayEnabled,
  getGatewayStatus,
} from './vercel-gateway';

// Legacy wrapped clients for non-AI-SDK usage
export { anthropic, type Anthropic } from './anthropic';
export { elevenlabs, generateSpeech, type TTSOptions, type TTSResult } from './elevenlabs';
export { fal, generateImage, generateVideo } from './fal';

// Re-export context utilities for route handlers that need manual setup
export {
  runWithContext,
  getRequestContext,
  getUserId,
  getUserIdOptional,
  getRequestId,
  type RequestContext,
} from './request-context';

// Re-export route handler wrapper
export { withTracking, type WithTrackingOptions } from './with-tracking';
