/**
 * Tracked FAL.AI Client
 *
 * Wraps FAL.AI image/video generation with automatic cost tracking.
 */

import * as falClient from '@fal-ai/serverless-client';
import { getUserIdOptional, getRequestId } from './request-context';
import { trackUnitUsage } from '@/lib/services/cost-tracking.service';

// Configure FAL client
falClient.config({
  credentials: process.env.FAL_KEY,
});

/**
 * Track FAL usage after successful generation
 */
async function trackFALUsage(
  model: string,
  units: number,
  service: 'image' | 'video',
  endpoint: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const userId = getUserIdOptional();
  if (!userId) {
    console.debug('[FAL] Skipping tracking - no user context');
    return;
  }

  try {
    await trackUnitUsage({
      userId,
      provider: 'fal',
      model,
      service,
      endpoint,
      units,
      requestId: getRequestId() ?? undefined,
      metadata,
    });
  } catch (error) {
    console.error('[FAL] Failed to track usage:', error);
  }
}

export interface ImageGenerationOptions {
  prompt: string;
  model?: string;
  imageSize?: { width: number; height: number };
  numImages?: number;
  numInferenceSteps?: number;
  enableSafetyChecker?: boolean;
}

export interface ImageGenerationResult {
  images: Array<{ url: string }>;
  model: string;
}

/**
 * Generate images with automatic tracking
 */
export async function generateImage(
  options: ImageGenerationOptions
): Promise<ImageGenerationResult> {
  const model = options.model ?? 'fal-ai/flux/schnell';
  const numImages = options.numImages ?? 1;

  const result = await falClient.subscribe(model, {
    input: {
      prompt: options.prompt,
      image_size: options.imageSize ?? { width: 1024, height: 1024 },
      num_inference_steps: options.numInferenceSteps ?? 4,
      num_images: numImages,
      enable_safety_checker: options.enableSafetyChecker ?? true,
    },
    logs: false,
  });

  const images = (result as { images?: Array<{ url: string }> })?.images ?? [];

  // Track usage - count is number of images generated
  trackFALUsage(model, images.length, 'image', '/fal/generate', {
    prompt: options.prompt.slice(0, 100),
  }).catch(() => {});

  return { images, model };
}

export interface VideoGenerationOptions {
  prompt: string;
  model?: string;
  duration?: number;
  aspectRatio?: string;
}

export interface VideoGenerationResult {
  videoUrl: string;
  model: string;
  durationSeconds: number;
}

/**
 * Generate video with automatic tracking
 */
export async function generateVideo(
  options: VideoGenerationOptions
): Promise<VideoGenerationResult> {
  const model = options.model ?? 'fal-ai/runway-gen3/turbo/image-to-video';
  const duration = options.duration ?? 5;

  const result = await falClient.subscribe(model, {
    input: {
      prompt: options.prompt,
      duration,
      aspect_ratio: options.aspectRatio ?? '16:9',
    },
    logs: false,
  });

  const videoUrl = (result as { video?: { url: string } })?.video?.url ?? '';

  // Track usage - unit is seconds of video
  trackFALUsage(model, duration, 'video', '/fal/video', {
    prompt: options.prompt.slice(0, 100),
  }).catch(() => {});

  return { videoUrl, model, durationSeconds: duration };
}

/**
 * FAL client with tracking
 */
export const fal = {
  generateImage,
  generateVideo,
  // Expose raw client for advanced use cases
  raw: falClient,
};
