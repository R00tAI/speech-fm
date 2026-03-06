/**
 * Subscription Tier Configuration
 *
 * Defines pricing, limits, and features for each subscription tier.
 * All costs calculated based on January 2025 API pricing research.
 */

export type SubscriptionTier = "free" | "starter" | "pro" | "enterprise";

export interface TierConfig {
  name: string;
  tier: SubscriptionTier;
  priceMonthly: number;
  priceAnnual: number;
  stripePriceIdMonthly?: string; // Set via env
  stripePriceIdAnnual?: string;
  credits: {
    monthly: number;
    rolloverLimit: number;
  };
  limits: {
    messagesPerMonth: number;
    opusMessagesPerMonth: number;
    browserSessionsPerMonth: number;
    mediaGenerationsPerMonth: number;
    maxMessagesPerDay: number;
  };
  features: string[];
  creditCosts: {
    messageSonnet: number; // Credits per message
    messageOpus: number;
    browserSession: number;
    mediaGeneration: number;
  };
  overagePrice?: number; // USD per credit if they exceed limits
}

export const SUBSCRIPTION_TIERS: Record<SubscriptionTier, TierConfig> = {
  free: {
    name: "Free",
    tier: "free",
    priceMonthly: 0,
    priceAnnual: 0,
    credits: {
      monthly: 10,
      rolloverLimit: 0, // No rollover for free tier
    },
    limits: {
      messagesPerMonth: 10,
      opusMessagesPerMonth: 0,
      browserSessionsPerMonth: 0,
      mediaGenerationsPerMonth: 0,
      maxMessagesPerDay: 5,
    },
    features: [
      "10 messages per month",
      "Sonnet 4.5 access",
      "Community support",
    ],
    creditCosts: {
      messageSonnet: 1,
      messageOpus: 5,
      browserSession: 0.3,
      mediaGeneration: 1.5,
    },
  },

  starter: {
    name: "Starter",
    tier: "starter",
    priceMonthly: 9.99,
    priceAnnual: 99.99, // ~17% discount
    stripePriceIdMonthly: process.env.STRIPE_PRICE_STARTER_MONTHLY,
    stripePriceIdAnnual: process.env.STRIPE_PRICE_STARTER_ANNUAL,
    credits: {
      monthly: 100,
      rolloverLimit: 100, // Can roll over up to 1x monthly allocation
    },
    limits: {
      messagesPerMonth: 100,
      opusMessagesPerMonth: 0,
      browserSessionsPerMonth: 0,
      mediaGenerationsPerMonth: 3,
      maxMessagesPerDay: 20,
    },
    features: [
      "100 messages per month",
      "Sonnet 4.5 access",
      "3 media generations",
      "Email support",
      "Credit rollover",
    ],
    creditCosts: {
      messageSonnet: 1,
      messageOpus: 5,
      browserSession: 0.3,
      mediaGeneration: 1.5,
    },
    overagePrice: 0.15, // $0.15 per credit
  },

  pro: {
    name: "Pro",
    tier: "pro",
    priceMonthly: 39.99,
    priceAnnual: 399.99, // ~17% discount
    stripePriceIdMonthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
    stripePriceIdAnnual: process.env.STRIPE_PRICE_PRO_ANNUAL,
    credits: {
      monthly: 600,
      rolloverLimit: 600,
    },
    limits: {
      messagesPerMonth: 500,
      opusMessagesPerMonth: 50,
      browserSessionsPerMonth: 10,
      mediaGenerationsPerMonth: 20,
      maxMessagesPerDay: 50,
    },
    features: [
      "500 messages per month",
      "Sonnet 4.5 + 50 Opus messages",
      "10 browser automation sessions",
      "20 media generations",
      "Priority email support",
      "Credit rollover",
      "Advanced analytics",
    ],
    creditCosts: {
      messageSonnet: 1,
      messageOpus: 5,
      browserSession: 0.3,
      mediaGeneration: 1.5,
    },
    overagePrice: 0.10, // $0.10 per credit
  },

  enterprise: {
    name: "Enterprise",
    tier: "enterprise",
    priceMonthly: 199.99,
    priceAnnual: 1999.99, // ~17% discount
    stripePriceIdMonthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY,
    stripePriceIdAnnual: process.env.STRIPE_PRICE_ENTERPRISE_ANNUAL,
    credits: {
      monthly: 4000,
      rolloverLimit: 4000,
    },
    limits: {
      messagesPerMonth: 2000,
      opusMessagesPerMonth: 500,
      browserSessionsPerMonth: 50,
      mediaGenerationsPerMonth: 100,
      maxMessagesPerDay: 200,
    },
    features: [
      "2,000 messages per month",
      "Unlimited Opus access",
      "50 browser automation sessions",
      "100 media generations",
      "Priority support + Slack channel",
      "Credit rollover",
      "Advanced analytics",
      "Custom integrations",
      "API access",
    ],
    creditCosts: {
      messageSonnet: 1,
      messageOpus: 5,
      browserSession: 0.3,
      mediaGeneration: 1.5,
    },
    overagePrice: 0.08, // $0.08 per credit
  },
};

/**
 * Get tier configuration by tier name
 */
export function getTierConfig(tier: SubscriptionTier): TierConfig {
  return SUBSCRIPTION_TIERS[tier];
}

/**
 * Calculate credits needed for a specific action
 */
export function calculateCreditsNeeded(
  tier: SubscriptionTier,
  action: "message_sonnet" | "message_opus" | "browser_session" | "media_generation"
): number {
  const config = getTierConfig(tier);

  switch (action) {
    case "message_sonnet":
      return config.creditCosts.messageSonnet;
    case "message_opus":
      return config.creditCosts.messageOpus;
    case "browser_session":
      return config.creditCosts.browserSession;
    case "media_generation":
      return config.creditCosts.mediaGeneration;
    default:
      return 0;
  }
}

/**
 * Check if a tier allows a specific feature
 */
export function canUsFeature(
  tier: SubscriptionTier,
  feature: "opus" | "browser" | "media" | "api"
): boolean {
  const config = getTierConfig(tier);

  switch (feature) {
    case "opus":
      return config.limits.opusMessagesPerMonth > 0;
    case "browser":
      return config.limits.browserSessionsPerMonth > 0;
    case "media":
      return config.limits.mediaGenerationsPerMonth > 0;
    case "api":
      return tier === "enterprise";
    default:
      return false;
  }
}

/**
 * Get usage percentage for display
 */
export function getUsagePercentage(used: number, limit: number): number {
  if (limit === 0) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
}

/**
 * Determine usage alert level
 */
export function getUsageAlertLevel(
  percentage: number
): "normal" | "warning" | "critical" | "exceeded" {
  if (percentage >= 100) return "exceeded";
  if (percentage >= 80) return "critical";
  if (percentage >= 50) return "warning";
  return "normal";
}

/**
 * Calculate actual API cost in USD
 * Based on January 2025 pricing:
 * - Sonnet 4.5: $3/1M input, $15/1M output
 * - Opus 4.5: $5/1M input, $25/1M output (New flagship pricing)
 * - Haiku 4.5: $1/1M input, $4/1M output
 */
export function calculateActualCost(params: {
  model: "sonnet-4.5" | "opus-4.5" | "haiku-4.5";
  inputTokens: number;
  outputTokens: number;
  cachedTokens?: number;
}): number {
  const { model, inputTokens, outputTokens, cachedTokens = 0 } = params;

  // Pricing per 1M tokens
  const pricing = {
    "sonnet-4.5": { input: 3, output: 15 },
    "opus-4.5": { input: 5, output: 25 },
    "haiku-4.5": { input: 1, output: 4 },
  };

  const rates = pricing[model] || pricing["sonnet-4.5"]; // Fallback

  // Cached tokens cost 0.1x (90% savings)
  const effectiveInputTokens = inputTokens - cachedTokens;
  const cachedCost = (cachedTokens / 1_000_000) * rates.input * 0.1;

  const inputCost = (effectiveInputTokens / 1_000_000) * rates.input;
  const outputCost = (outputTokens / 1_000_000) * rates.output;

  return inputCost + outputCost + cachedCost;
}

/**
 * Calculate overage charge
 */
export function calculateOverageCharge(
  tier: SubscriptionTier,
  creditsUsed: number
): number {
  const config = getTierConfig(tier);

  if (tier === "free" || !config.overagePrice) {
    return 0; // No overage for free tier
  }

  const overageCredits = Math.max(0, creditsUsed - config.credits.monthly);
  return overageCredits * config.overagePrice;
}
