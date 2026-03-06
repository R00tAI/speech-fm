/**
 * Vercel AI Gateway
 *
 * Single gateway instance for all AI providers. One API key, all models.
 * Uses @ai-sdk/gateway — no individual provider SDKs or API keys needed.
 *
 * Usage:
 *   import { gateway } from '@/lib/ai/vercel-gateway';
 *   const result = await generateText({ model: gateway('anthropic/claude-sonnet-4.5'), ... });
 *
 * Model format: 'provider/model-name'
 *   anthropic/claude-sonnet-4.5, anthropic/claude-haiku-4.5
 *   openai/gpt-4o, openai/gpt-4o-mini
 *   google/gemini-2.5-flash, google/gemini-2.5-pro
 *   groq/llama-3.3-70b-versatile
 *   xai/grok-4
 *
 * Env: AI_GATEWAY_API_KEY (or VERCEL_AI_GATEWAY_TOKEN as fallback)
 */

import { createGateway } from '@ai-sdk/gateway';

export const gateway = createGateway({
  apiKey: process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_AI_GATEWAY_TOKEN,
});

// =============================================================================
// LEGACY WRAPPERS — backward compat for existing callers
// These prefix the provider name and route through the gateway.
// New code should import `gateway` directly.
// =============================================================================

export function gatewayAnthropic(model?: string) {
  if (!model) return gateway('anthropic/claude-sonnet-4.5');
  return gateway(`anthropic/${model}` as any);
}

export function gatewayOpenAI(model?: string) {
  if (!model) return gateway('openai/gpt-5-mini');
  return gateway(`openai/${model}` as any);
}

export function gatewayGoogle(model?: string) {
  if (!model) return gateway('google/gemini-2.5-flash');
  return gateway(`google/${model}` as any);
}

export function gatewayGroq(model?: string) {
  if (!model) return gateway('groq/llama-3.3-70b-versatile');
  return gateway(`groq/${model}` as any);
}

export function getGatewayProvider(providerName: string, model?: string) {
  return gateway(`${providerName}/${model || 'default'}` as any);
}
