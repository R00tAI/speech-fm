/**
 * API Pricing Configuration
 * Updated: 2025-01-01
 *
 * Prices are in USD per unit (tokens per 1M, characters per 1K, etc.)
 * These should be periodically updated to match provider pricing
 */

export type Provider = 'anthropic' | 'openai' | 'elevenlabs' | 'fal' | 'hume' | 'replicate' | 'exa';
export type ServiceType = 'chat' | 'tts' | 'image' | 'voice' | 'video' | 'embedding' | 'search';

export interface TokenPricing {
  inputPer1M: number;
  outputPer1M: number;
  cachedInputPer1M?: number;
}

export interface CharacterPricing {
  perCharacter: number;
}

export interface UnitPricing {
  perUnit: number;
  unit: 'image' | 'minute' | 'second' | 'request';
}

export interface ModelPricing {
  type: 'token' | 'character' | 'unit';
  pricing: TokenPricing | CharacterPricing | UnitPricing;
}

// Anthropic pricing (as of Dec 2024)
export const ANTHROPIC_PRICING: Record<string, TokenPricing> = {
  'claude-opus-4-5-20251101': { inputPer1M: 15.00, outputPer1M: 75.00, cachedInputPer1M: 1.50 },
  'claude-sonnet-4-5-20251101': { inputPer1M: 3.00, outputPer1M: 15.00, cachedInputPer1M: 0.30 },
  'claude-sonnet-4-20250514': { inputPer1M: 3.00, outputPer1M: 15.00, cachedInputPer1M: 0.30 },
  'claude-haiku-4-5-20251001': { inputPer1M: 0.80, outputPer1M: 4.00, cachedInputPer1M: 0.08 },
  'claude-3-5-sonnet-20241022': { inputPer1M: 3.00, outputPer1M: 15.00, cachedInputPer1M: 0.30 },
  'claude-3-5-haiku-20241022': { inputPer1M: 0.80, outputPer1M: 4.00, cachedInputPer1M: 0.08 },
  // Default for unknown Claude models
  'claude-default': { inputPer1M: 3.00, outputPer1M: 15.00, cachedInputPer1M: 0.30 },
};

// OpenAI pricing (as of Dec 2024)
export const OPENAI_PRICING: Record<string, TokenPricing> = {
  'gpt-4o': { inputPer1M: 2.50, outputPer1M: 10.00, cachedInputPer1M: 1.25 },
  'gpt-4o-2024-11-20': { inputPer1M: 2.50, outputPer1M: 10.00, cachedInputPer1M: 1.25 },
  'gpt-4o-mini': { inputPer1M: 0.15, outputPer1M: 0.60, cachedInputPer1M: 0.075 },
  'gpt-4o-mini-2024-07-18': { inputPer1M: 0.15, outputPer1M: 0.60, cachedInputPer1M: 0.075 },
  'gpt-4-turbo': { inputPer1M: 10.00, outputPer1M: 30.00 },
  'gpt-4': { inputPer1M: 30.00, outputPer1M: 60.00 },
  'gpt-3.5-turbo': { inputPer1M: 0.50, outputPer1M: 1.50 },
  // Realtime API (voice)
  'gpt-4o-realtime-preview': { inputPer1M: 5.00, outputPer1M: 20.00 },
  'gpt-4o-realtime-preview-2024-10-01': { inputPer1M: 5.00, outputPer1M: 20.00 },
  // Audio tokens for realtime
  'gpt-4o-realtime-audio': { inputPer1M: 100.00, outputPer1M: 200.00 },
  // Default
  'openai-default': { inputPer1M: 2.50, outputPer1M: 10.00 },
};

// ElevenLabs pricing (per character)
export const ELEVENLABS_PRICING: Record<string, CharacterPricing> = {
  'eleven_multilingual_v2': { perCharacter: 0.00030 }, // ~$0.30 per 1K chars (Creator tier)
  'eleven_turbo_v2_5': { perCharacter: 0.00018 }, // ~$0.18 per 1K chars
  'eleven_turbo_v2': { perCharacter: 0.00018 },
  'eleven_monolingual_v1': { perCharacter: 0.00024 },
  'eleven_english_sts_v2': { perCharacter: 0.00024 },
  'eleven_v3': { perCharacter: 0.00030 }, // v3 expressive — same tier as multilingual_v2
  'eleven_flash_v2_5': { perCharacter: 0.00015 },
  // Default
  'elevenlabs-default': { perCharacter: 0.00024 },
};

// FAL.AI pricing (per image/request)
export const FAL_PRICING: Record<string, UnitPricing> = {
  'fal-ai/flux/schnell': { perUnit: 0.003, unit: 'image' },
  'fal-ai/flux/dev': { perUnit: 0.025, unit: 'image' },
  'fal-ai/flux-pro': { perUnit: 0.05, unit: 'image' },
  'fal-ai/flux-pro/v1.1': { perUnit: 0.04, unit: 'image' },
  'fal-ai/flux-realism': { perUnit: 0.025, unit: 'image' },
  'fal-ai/stable-diffusion-v3-medium': { perUnit: 0.035, unit: 'image' },
  'fal-ai/recraft-v3': { perUnit: 0.04, unit: 'image' },
  // Video models (per second)
  'fal-ai/kling-video/v1/standard/text-to-video': { perUnit: 0.10, unit: 'second' },
  'fal-ai/minimax/video-01': { perUnit: 0.15, unit: 'second' },
  'fal-ai/luma-dream-machine': { perUnit: 0.08, unit: 'second' },
  // Audio processing
  'fal-ai/whisper': { perUnit: 0.0001, unit: 'second' }, // Transcription
  'fal-ai/imageutils/depth': { perUnit: 0.002, unit: 'image' }, // Depth estimation
  'fal-ai/birefnet': { perUnit: 0.002, unit: 'image' }, // Background removal
  // Default
  'fal-default': { perUnit: 0.025, unit: 'image' },
};

// Hume AI pricing (per minute of voice interaction)
export const HUME_PRICING: Record<string, UnitPricing> = {
  'empathic-voice-2': { perUnit: 0.07, unit: 'minute' },
  'evi-2': { perUnit: 0.07, unit: 'minute' },
  // Default
  'hume-default': { perUnit: 0.07, unit: 'minute' },
};

// Replicate pricing (variable by model)
export const REPLICATE_PRICING: Record<string, UnitPricing> = {
  'stability-ai/sdxl': { perUnit: 0.004, unit: 'image' },
  'lucataco/sdxl-lightning-4step': { perUnit: 0.002, unit: 'image' },
  // Default
  'replicate-default': { perUnit: 0.01, unit: 'request' },
};

// Exa pricing (per search request)
export const EXA_PRICING: Record<string, UnitPricing> = {
  'exa-search': { perUnit: 0.001, unit: 'request' }, // ~$1 per 1K searches
  'exa-contents': { perUnit: 0.002, unit: 'request' }, // searchAndContents
  // Default
  'exa-default': { perUnit: 0.002, unit: 'request' },
};

/**
 * Get pricing for a specific model
 */
export function getModelPricing(provider: Provider, model: string): ModelPricing | null {
  switch (provider) {
    case 'anthropic': {
      const pricing = ANTHROPIC_PRICING[model] || ANTHROPIC_PRICING['claude-default'];
      return { type: 'token', pricing };
    }
    case 'openai': {
      const pricing = OPENAI_PRICING[model] || OPENAI_PRICING['openai-default'];
      return { type: 'token', pricing };
    }
    case 'elevenlabs': {
      const pricing = ELEVENLABS_PRICING[model] || ELEVENLABS_PRICING['elevenlabs-default'];
      return { type: 'character', pricing };
    }
    case 'fal': {
      const pricing = FAL_PRICING[model] || FAL_PRICING['fal-default'];
      return { type: 'unit', pricing };
    }
    case 'hume': {
      const pricing = HUME_PRICING[model] || HUME_PRICING['hume-default'];
      return { type: 'unit', pricing };
    }
    case 'replicate': {
      const pricing = REPLICATE_PRICING[model] || REPLICATE_PRICING['replicate-default'];
      return { type: 'unit', pricing };
    }
    case 'exa': {
      const pricing = EXA_PRICING[model] || EXA_PRICING['exa-default'];
      return { type: 'unit', pricing };
    }
    default:
      return null;
  }
}

/**
 * Calculate cost for token-based API calls (LLM)
 */
export function calculateTokenCost(
  provider: Provider,
  model: string,
  inputTokens: number,
  outputTokens: number,
  cachedTokens: number = 0
): { inputCost: number; outputCost: number; cacheSavings: number; totalCost: number } {
  const modelPricing = getModelPricing(provider, model);

  if (!modelPricing || modelPricing.type !== 'token') {
    return { inputCost: 0, outputCost: 0, cacheSavings: 0, totalCost: 0 };
  }

  const pricing = modelPricing.pricing as TokenPricing;

  // Calculate costs (tokens are in actual count, pricing is per 1M)
  const regularInputTokens = inputTokens - cachedTokens;
  const inputCost = (regularInputTokens / 1_000_000) * pricing.inputPer1M;
  const cachedCost = pricing.cachedInputPer1M
    ? (cachedTokens / 1_000_000) * pricing.cachedInputPer1M
    : 0;
  const outputCost = (outputTokens / 1_000_000) * pricing.outputPer1M;

  // Cache savings = what we would have paid for cached tokens at full price
  const cacheSavings = pricing.cachedInputPer1M
    ? (cachedTokens / 1_000_000) * (pricing.inputPer1M - pricing.cachedInputPer1M)
    : 0;

  const totalCost = inputCost + cachedCost + outputCost;

  return {
    inputCost: inputCost + cachedCost,
    outputCost,
    cacheSavings,
    totalCost,
  };
}

/**
 * Calculate cost for character-based API calls (TTS)
 */
export function calculateCharacterCost(
  provider: Provider,
  model: string,
  characters: number
): number {
  const modelPricing = getModelPricing(provider, model);

  if (!modelPricing || modelPricing.type !== 'character') {
    return 0;
  }

  const pricing = modelPricing.pricing as CharacterPricing;
  return characters * pricing.perCharacter;
}

/**
 * Calculate cost for unit-based API calls (images, video, voice minutes)
 */
export function calculateUnitCost(
  provider: Provider,
  model: string,
  units: number
): number {
  const modelPricing = getModelPricing(provider, model);

  if (!modelPricing || modelPricing.type !== 'unit') {
    return 0;
  }

  const pricing = modelPricing.pricing as UnitPricing;
  return units * pricing.perUnit;
}

/**
 * Subscription tier limits
 */
export const SUBSCRIPTION_TIERS = {
  free: {
    monthlyBudgetUsd: 0,
    monthlyTokens: 0,
    monthlyImages: 0,
    monthlyAudioMinutes: 0,
    monthlyTtsCharacters: 0,
    features: ['basic_dashboard'],
  },
  pro: {
    monthlyBudgetUsd: 25.00,
    monthlyTokens: 2_000_000,
    monthlyImages: 200,
    monthlyAudioMinutes: 120,
    monthlyTtsCharacters: 100_000,
    features: ['all_features', 'voice_access', 'api_access', 'live_act'],
  },
  premium: {
    monthlyBudgetUsd: 100.00,
    monthlyTokens: 10_000_000,
    monthlyImages: 1000,
    monthlyAudioMinutes: 500,
    monthlyTtsCharacters: 500_000,
    features: ['all_features', 'priority_support', 'custom_models', 'advanced_analytics'],
  },
  enterprise: {
    monthlyBudgetUsd: null, // Unlimited (custom pricing)
    monthlyTokens: null,
    monthlyImages: null,
    monthlyAudioMinutes: null,
    monthlyTtsCharacters: null,
    features: ['all_features', 'dedicated_support', 'sla', 'custom_integrations'],
  },
} as const;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS;
