import * as fal from '@fal-ai/serverless-client';

// Cost per generation (approximate in USD)
const GENERATION_COSTS = {
  'fal-ai/flux/schnell': 0.003, // Fast, cheap
  'fal-ai/flux/dev': 0.025, // High quality
  'fal-ai/stable-diffusion-v3': 0.01,
  'fal-ai/stable-video-diffusion': 0.05, // Video is more expensive
  'fal-ai/luma-dream-machine': 0.10, // Video
  'fal-ai/sync-lipsync/v2/pro': 0.10, // Lip Sync Video
  // Nano Banana Pro 2 - Google Gemini 3 Pro Image model
  'fal-ai/nano-banana-pro': 0.15, // High quality image generation
  'fal-ai/nano-banana-pro/img2img': 0.18, // Image-to-image stylization
  'fal-ai/nano-banana-2': 0.08, // Fast high-quality generation
};

// Model aliases for convenience
const MODEL_ALIASES: Record<string, keyof typeof GENERATION_COSTS> = {
  'nano-banana-pro-2': 'fal-ai/nano-banana-pro',
  'nano-banana': 'fal-ai/nano-banana-pro',
  'gemini-image': 'fal-ai/nano-banana-pro',
  'nano-banana-2': 'fal-ai/nano-banana-2',
  'gemini-flash-image': 'fal-ai/nano-banana-2',
};

interface CostLimits {
  perSession: number; // Max cost per orchestration session
  perAgent: number; // Max cost per agent
  perHour: number; // Rate limiting
  dailyLimit: number; // Daily budget
}

interface GenerationRequest {
  prompt: string;
  model: keyof typeof GENERATION_COSTS;
  agentId: string;
  chatId: string;
  width?: number;
  height?: number;
  num_inference_steps?: number;
}

interface ImageToImageRequest {
  prompt: string;
  imageUrl: string; // Source image URL
  model?: 'fal-ai/nano-banana-pro/img2img';
  agentId: string;
  chatId: string;
  strength?: number; // 0.0 - 1.0, how much to transform
  width?: number;
  height?: number;
  style?: 'anime' | 'cartoon' | 'painterly' | 'cinematic' | 'photorealistic' | 'sketch' | 'watercolor';
}

interface GenerationResult {
  url: string;
  cost: number;
  model: string;
  prompt: string;
  timestamp: Date;
}

class FALService {
  private sessionCosts: Map<string, number> = new Map(); // chatId -> total cost
  private agentCosts: Map<string, Map<string, number>> = new Map(); // chatId -> agentId -> cost
  private hourlyGenerations: Map<string, number[]> = new Map(); // chatId -> timestamps
  private dailyCost: number = 0;
  private dailyResetTime: Date = new Date();

  constructor(private apiKey: string, private limits: CostLimits) {
    fal.config({
      credentials: apiKey,
    });

    // Reset daily cost at midnight
    this.scheduleDailyReset();
  }

  private scheduleDailyReset() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const msUntilMidnight = tomorrow.getTime() - now.getTime();

    setTimeout(() => {
      this.dailyCost = 0;
      this.dailyResetTime = new Date();
      this.scheduleDailyReset(); // Schedule next reset
    }, msUntilMidnight);
  }

  private checkLimits(chatId: string, agentId: string, estimatedCost: number): {
    allowed: boolean;
    reason?: string;
  } {
    // Check daily limit
    if (this.dailyCost + estimatedCost > this.limits.dailyLimit) {
      return {
        allowed: false,
        reason: `Daily limit reached ($${this.limits.dailyLimit}). Current: $${this.dailyCost.toFixed(3)}`,
      };
    }

    // Check session limit
    const sessionCost = this.sessionCosts.get(chatId) || 0;
    if (sessionCost + estimatedCost > this.limits.perSession) {
      return {
        allowed: false,
        reason: `Session limit reached ($${this.limits.perSession}). Current: $${sessionCost.toFixed(3)}`,
      };
    }

    // Check per-agent limit
    const agentCostsMap = this.agentCosts.get(chatId) || new Map();
    const agentCost = agentCostsMap.get(agentId) || 0;
    if (agentCost + estimatedCost > this.limits.perAgent) {
      return {
        allowed: false,
        reason: `Agent limit reached ($${this.limits.perAgent}). Current: $${agentCost.toFixed(3)}`,
      };
    }

    // Check rate limiting (per hour)
    const hourlyGens = this.hourlyGenerations.get(chatId) || [];
    const oneHourAgo = Date.now() - 3600000;
    const recentGens = hourlyGens.filter((t) => t > oneHourAgo);

    const maxPerHour = Math.floor(this.limits.perHour / estimatedCost);
    if (recentGens.length >= maxPerHour) {
      return {
        allowed: false,
        reason: `Rate limit: Max ${maxPerHour} generations per hour for this model`,
      };
    }

    return { allowed: true };
  }

  private recordCost(chatId: string, agentId: string, cost: number) {
    // Update session cost
    const sessionCost = this.sessionCosts.get(chatId) || 0;
    this.sessionCosts.set(chatId, sessionCost + cost);

    // Update agent cost
    if (!this.agentCosts.has(chatId)) {
      this.agentCosts.set(chatId, new Map());
    }
    const agentCostsMap = this.agentCosts.get(chatId)!;
    const agentCost = agentCostsMap.get(agentId) || 0;
    agentCostsMap.set(agentId, agentCost + cost);

    // Update daily cost
    this.dailyCost += cost;

    // Update hourly generations
    const hourlyGens = this.hourlyGenerations.get(chatId) || [];
    hourlyGens.push(Date.now());
    this.hourlyGenerations.set(chatId, hourlyGens);
  }

  async generateImage(request: GenerationRequest): Promise<GenerationResult> {
    const estimatedCost = GENERATION_COSTS[request.model] || 0.01;

    // Check limits
    const limitCheck = this.checkLimits(request.chatId, request.agentId, estimatedCost);
    if (!limitCheck.allowed) {
      throw new Error(`Generation blocked: ${limitCheck.reason}`);
    }

    try {
      const result = await fal.subscribe(request.model, {
        input: {
          prompt: request.prompt,
          image_size: `${request.width || 1024}x${request.height || 1024}`,
          num_inference_steps: request.num_inference_steps || 4, // Fast by default
        },
        logs: true,
        onQueueUpdate: (update) => {
          console.log(`[FAL] Queue update:`, update.status);
        },
      });

      // Record actual cost
      this.recordCost(request.chatId, request.agentId, estimatedCost);

      const imageUrl = (result as any).images?.[0]?.url;
      if (!imageUrl) {
        throw new Error('No image URL in response');
      }

      return {
        url: imageUrl,
        cost: estimatedCost,
        model: request.model,
        prompt: request.prompt,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('[FAL] Generation error:', error);
      throw error;
    }
  }

  async generateVideo(request: Omit<GenerationRequest, 'model'> & { model: 'fal-ai/stable-video-diffusion' | 'fal-ai/luma-dream-machine' }): Promise<GenerationResult> {
    const estimatedCost = GENERATION_COSTS[request.model];

    // Check limits
    const limitCheck = this.checkLimits(request.chatId, request.agentId, estimatedCost);
    if (!limitCheck.allowed) {
      throw new Error(`Generation blocked: ${limitCheck.reason}`);
    }

    try {
      const result = await fal.subscribe(request.model, {
        input: {
          prompt: request.prompt,
        },
        logs: true,
        onQueueUpdate: (update) => {
          console.log(`[FAL] Video queue update:`, update.status);
        },
      });

      // Record actual cost
      this.recordCost(request.chatId, request.agentId, estimatedCost);

      const videoUrl = (result as any).video?.url;
      if (!videoUrl) {
        throw new Error('No video URL in response');
      }

      return {
        url: videoUrl,
        cost: estimatedCost,
        model: request.model,
        prompt: request.prompt,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('[FAL] Video generation error:', error);
      throw error;
    }
  }

  async uploadAudio(audioBuffer: Buffer): Promise<string> {
    const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
    const url = await fal.storage.upload(blob);
    return url;
  }

  async generateLipSync(request: {
    audioUrl: string;
    videoUrl: string;
    chatId: string;
    agentId: string;
    sycnMode?: 'sync_1.7.1-beta' | 'sync_1.6.0';
  }): Promise<GenerationResult> {
    const model = 'fal-ai/sync-lipsync/v2/pro';
    const estimatedCost = GENERATION_COSTS[model];

    // Check limits
    const limitCheck = this.checkLimits(request.chatId, request.agentId, estimatedCost);
    if (!limitCheck.allowed) {
      throw new Error(`Generation blocked: ${limitCheck.reason}`);
    }

    try {
      const result = await fal.subscribe(model, {
        input: {
          audio_url: request.audioUrl,
          video_url: request.videoUrl,
          sync_mode: request.sycnMode || 'sync_1.7.1-beta',
        },
        logs: true,
        onQueueUpdate: (update) => {
          console.log(`[FAL] LipSync queue update:`, update.status);
        },
      });

      // Record actual cost
      this.recordCost(request.chatId, request.agentId, estimatedCost);

      const videoUrl = (result as any).video?.url;
      if (!videoUrl) {
        throw new Error('No video URL in response');
      }

      return {
        url: videoUrl,
        cost: estimatedCost,
        model: model,
        prompt: 'Lip Sync Generation',
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('[FAL] LipSync generation error:', error);
      throw error;
    }
  }

  /**
   * Generate stylized image from source image using Nano Banana Pro 2
   * Perfect for creating stylized versions of scraped images
   */
  async generateStylizedImage(request: ImageToImageRequest): Promise<GenerationResult> {
    const model = request.model || 'fal-ai/nano-banana-pro/img2img';
    const estimatedCost = GENERATION_COSTS[model] || 0.18;

    // Check limits
    const limitCheck = this.checkLimits(request.chatId, request.agentId, estimatedCost);
    if (!limitCheck.allowed) {
      throw new Error(`Generation blocked: ${limitCheck.reason}`);
    }

    // Build style-enhanced prompt
    const styleModifiers: Record<string, string> = {
      anime: 'anime style, vibrant colors, clean lines, studio quality',
      cartoon: 'cartoon style, bold outlines, flat colors, fun and expressive',
      painterly: 'oil painting style, rich textures, artistic brushstrokes',
      cinematic: 'cinematic, dramatic lighting, film grain, movie quality',
      photorealistic: 'ultra realistic, 8k, detailed, professional photography',
      sketch: 'pencil sketch, hand drawn, artistic lines, grayscale',
      watercolor: 'watercolor painting, soft edges, flowing colors, artistic',
    };

    const stylePrompt = request.style
      ? `${request.prompt}, ${styleModifiers[request.style]}`
      : request.prompt;

    try {
      const result = await fal.subscribe('fal-ai/nano-banana-pro', {
        input: {
          prompt: stylePrompt,
          image_url: request.imageUrl,
          strength: request.strength || 0.75,
          image_size: request.width && request.height
            ? `${request.width}x${request.height}`
            : '1024x1024',
          num_inference_steps: 30,
        },
        logs: true,
        onQueueUpdate: (update) => {
          console.log(`[FAL] Nano Banana Pro queue update:`, update.status);
        },
      });

      // Record actual cost
      this.recordCost(request.chatId, request.agentId, estimatedCost);

      const imageUrl = (result as any).images?.[0]?.url;
      if (!imageUrl) {
        throw new Error('No image URL in response');
      }

      return {
        url: imageUrl,
        cost: estimatedCost,
        model: model,
        prompt: stylePrompt,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('[FAL] Nano Banana Pro generation error:', error);
      throw error;
    }
  }

  /**
   * Generate image using Nano Banana Pro 2 (text-to-image)
   */
  async generateWithNanoBanana(request: Omit<GenerationRequest, 'model'> & {
    style?: 'anime' | 'cartoon' | 'painterly' | 'cinematic' | 'photorealistic' | 'sketch' | 'watercolor';
  }): Promise<GenerationResult> {
    const model = 'fal-ai/nano-banana-pro' as const;
    const estimatedCost = GENERATION_COSTS[model];

    // Check limits
    const limitCheck = this.checkLimits(request.chatId, request.agentId, estimatedCost);
    if (!limitCheck.allowed) {
      throw new Error(`Generation blocked: ${limitCheck.reason}`);
    }

    // Build style-enhanced prompt
    const styleModifiers: Record<string, string> = {
      anime: 'anime style, vibrant colors, clean lines, studio quality',
      cartoon: 'cartoon style, bold outlines, flat colors, fun and expressive',
      painterly: 'oil painting style, rich textures, artistic brushstrokes',
      cinematic: 'cinematic, dramatic lighting, film grain, movie quality',
      photorealistic: 'ultra realistic, 8k, detailed, professional photography',
      sketch: 'pencil sketch, hand drawn, artistic lines, grayscale',
      watercolor: 'watercolor painting, soft edges, flowing colors, artistic',
    };

    const stylePrompt = request.style
      ? `${request.prompt}, ${styleModifiers[request.style]}`
      : request.prompt;

    try {
      const result = await fal.subscribe(model, {
        input: {
          prompt: stylePrompt,
          image_size: `${request.width || 1024}x${request.height || 1024}`,
          num_inference_steps: request.num_inference_steps || 30,
        },
        logs: true,
        onQueueUpdate: (update) => {
          console.log(`[FAL] Nano Banana Pro queue update:`, update.status);
        },
      });

      // Record actual cost
      this.recordCost(request.chatId, request.agentId, estimatedCost);

      const imageUrl = (result as any).images?.[0]?.url;
      if (!imageUrl) {
        throw new Error('No image URL in response');
      }

      return {
        url: imageUrl,
        cost: estimatedCost,
        model: model,
        prompt: stylePrompt,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('[FAL] Nano Banana Pro generation error:', error);
      throw error;
    }
  }

  /**
   * Resolve model alias to actual model name
   */
  static resolveModelAlias(alias: string): keyof typeof GENERATION_COSTS {
    return MODEL_ALIASES[alias.toLowerCase()] || (alias as keyof typeof GENERATION_COSTS);
  }

  getCosts(chatId: string): {
    session: number;
    agents: Map<string, number>;
    daily: number;
    limits: CostLimits;
  } {
    return {
      session: this.sessionCosts.get(chatId) || 0,
      agents: this.agentCosts.get(chatId) || new Map(),
      daily: this.dailyCost,
      limits: this.limits,
    };
  }

  resetSessionCosts(chatId: string) {
    this.sessionCosts.delete(chatId);
    this.agentCosts.delete(chatId);
    this.hourlyGenerations.delete(chatId);
  }
}

// Default limits - very conservative
const DEFAULT_LIMITS: CostLimits = {
  perSession: 1.0, // $1 per session
  perAgent: 0.25, // $0.25 per agent
  perHour: 0.50, // $0.50 per hour
  dailyLimit: 5.0, // $5 per day
};

// Singleton instance
let falService: FALService | null = null;

export function getFALService(): FALService {
  if (!falService) {
    const apiKey = process.env.FAL_KEY;
    if (!apiKey) {
      throw new Error('FAL_KEY environment variable is required');
    }

    // Allow custom limits from env
    const limits: CostLimits = {
      perSession: parseFloat(process.env.FAL_SESSION_LIMIT || String(DEFAULT_LIMITS.perSession)),
      perAgent: parseFloat(process.env.FAL_AGENT_LIMIT || String(DEFAULT_LIMITS.perAgent)),
      perHour: parseFloat(process.env.FAL_HOUR_LIMIT || String(DEFAULT_LIMITS.perHour)),
      dailyLimit: parseFloat(process.env.FAL_DAILY_LIMIT || String(DEFAULT_LIMITS.dailyLimit)),
    };

    falService = new FALService(apiKey, limits);
  }

  return falService;
}

export { GENERATION_COSTS, MODEL_ALIASES };
export type { GenerationRequest, GenerationResult, CostLimits, ImageToImageRequest };
