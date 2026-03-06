/**
 * Image Resolver
 *
 * Resolves image URLs for cinematic scenes via priority chain:
 * 1. Exa-scraped images (scored by relevance)
 * 2. FAL Schnell fallback (~3s generation)
 *
 * Also handles depth map generation via existing API.
 */

import { generateImage } from '@/lib/ai/fal';
import type { ResearchImage } from '@/lib/exa/research-pipeline';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ImageAsset {
  imageUrl: string;
  depthUrl?: string;
  source: 'exa' | 'fal' | 'provided';
  attribution?: string;
}

export interface ResolveImageOptions {
  prompt: string;                      // Description or GENERATE: prompt
  exaImages?: ResearchImage[];         // Images from Exa research
  generateDepth?: boolean;             // Whether to also generate depth map
  baseUrl?: string;                    // API base URL for depth estimation
  imageSize?: { width: number; height: number };
}

// ---------------------------------------------------------------------------
// Resolution
// ---------------------------------------------------------------------------

/**
 * Resolve an image URL from the best available source.
 *
 * If prompt starts with "GENERATE:", strips the prefix and generates via FAL.
 * Otherwise, tries to match from Exa images first.
 */
export async function resolveImage(options: ResolveImageOptions): Promise<ImageAsset> {
  const { prompt, exaImages = [], generateDepth = false, baseUrl = '' } = options;

  // Check if this is a direct URL (not a generation request)
  if (prompt.startsWith('http://') || prompt.startsWith('https://')) {
    const asset: ImageAsset = {
      imageUrl: prompt,
      source: 'provided',
    };
    if (generateDepth) {
      asset.depthUrl = await estimateDepth(prompt, baseUrl);
    }
    return asset;
  }

  // Extract generation prompt (strip GENERATE: prefix if present)
  const genPrompt = prompt.startsWith('GENERATE:')
    ? prompt.slice('GENERATE:'.length).trim()
    : prompt;

  // Priority 1: Exa-scraped images (match by relevance)
  const bestExaImage = findBestExaImage(genPrompt, exaImages);
  if (bestExaImage) {
    console.log(`[ImageResolver] Using Exa image: ${bestExaImage.url} (relevance: ${bestExaImage.relevanceScore})`);
    const asset: ImageAsset = {
      imageUrl: bestExaImage.url,
      source: 'exa',
      attribution: bestExaImage.title,
    };
    if (generateDepth) {
      asset.depthUrl = await estimateDepth(bestExaImage.url, baseUrl);
    }
    return asset;
  }

  // Priority 2: FAL Schnell generation
  console.log(`[ImageResolver] Generating image via FAL: "${genPrompt.slice(0, 80)}..."`);
  try {
    const result = await generateImage({
      prompt: `Cinematic, high quality photograph: ${genPrompt}`,
      model: 'fal-ai/flux/schnell',
      imageSize: options.imageSize ?? { width: 1280, height: 720 },
      numImages: 1,
      numInferenceSteps: 4,
    });

    const imageUrl = result.images[0]?.url;
    if (!imageUrl) {
      throw new Error('No image returned from FAL');
    }

    const asset: ImageAsset = {
      imageUrl,
      source: 'fal',
    };
    if (generateDepth) {
      asset.depthUrl = await estimateDepth(imageUrl, baseUrl);
    }
    return asset;
  } catch (err) {
    console.error('[ImageResolver] FAL generation failed:', err);
    // Return empty — scene renderer should handle missing image gracefully
    return { imageUrl: '', source: 'fal' };
  }
}

/**
 * Batch resolve multiple images in parallel.
 */
export async function resolveImages(
  requests: ResolveImageOptions[],
): Promise<ImageAsset[]> {
  return Promise.all(requests.map((req) => resolveImage(req)));
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Find the best matching Exa image for a given description.
 * Uses simple keyword overlap scoring.
 */
function findBestExaImage(
  description: string,
  images: ResearchImage[],
): ResearchImage | null {
  if (images.length === 0) return null;

  const descWords = new Set(
    description.toLowerCase().split(/\W+/).filter((w) => w.length > 3)
  );

  let bestImage: ResearchImage | null = null;
  let bestScore = 0;

  for (const img of images) {
    // Base relevance from Exa score
    let score = img.relevanceScore;

    // Boost if title words overlap with description
    const titleWords = img.title.toLowerCase().split(/\W+/);
    const overlap = titleWords.filter((w) => descWords.has(w)).length;
    score += overlap * 0.1;

    if (score > bestScore && score > 0.3) {
      bestScore = score;
      bestImage = img;
    }
  }

  return bestImage;
}

/**
 * Request depth estimation from existing API endpoint.
 * Returns depth map URL or undefined on failure.
 */
async function estimateDepth(
  imageUrl: string,
  baseUrl: string,
): Promise<string | undefined> {
  try {
    const res = await fetch(`${baseUrl}/api/design-studio/depth-estimation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl }),
    });

    if (!res.ok) {
      console.warn('[ImageResolver] Depth estimation failed:', res.status);
      return undefined;
    }

    const data = await res.json();
    return data.depthMapUrl || data.url || undefined;
  } catch (err) {
    console.warn('[ImageResolver] Depth estimation error:', err);
    return undefined;
  }
}
