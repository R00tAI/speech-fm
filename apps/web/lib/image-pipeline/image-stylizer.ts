/**
 * Image Stylizer
 *
 * Applies visual treatments to images for cinematic scenes.
 * Fast path: CSS filters (instant). Quality path: FAL img2img (3-5s).
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ImageStyle =
  | 'illustrated'    // Warm, illustrated grading
  | 'editorial'      // High contrast, desaturated
  | 'photographic'   // Minimal adjustments
  | 'dithered';      // FM dither effect (applied in renderer, not here)

export interface StylizeOptions {
  imageUrl: string;
  style: ImageStyle;
  quality?: 'css' | 'ai';  // css = instant, ai = FAL img2img
}

export interface StylizedResult {
  url: string;
  style: ImageStyle;
  method: 'css' | 'ai';
  cssFilter?: string;  // CSS filter string for css method
}

// ---------------------------------------------------------------------------
// CSS filter presets
// ---------------------------------------------------------------------------

const CSS_FILTERS: Record<ImageStyle, string> = {
  illustrated:
    'brightness(1.05) contrast(1.1) saturate(1.2) sepia(0.15) hue-rotate(-5deg)',
  editorial:
    'brightness(1.0) contrast(1.35) saturate(0.7) grayscale(0.15)',
  photographic:
    'brightness(1.02) contrast(1.05)',
  dithered:
    'brightness(1.0) contrast(1.2) grayscale(0.6)',
};

// ---------------------------------------------------------------------------
// Stylize
// ---------------------------------------------------------------------------

/**
 * Apply style treatment to an image.
 *
 * CSS mode returns the original URL + a CSS filter string.
 * AI mode would use FAL img2img (not yet wired — returns CSS fallback).
 */
export async function stylizeForStorybook(
  options: StylizeOptions,
): Promise<StylizedResult> {
  const { imageUrl, style, quality = 'css' } = options;

  // CSS-based instant stylization
  const cssFilter = CSS_FILTERS[style] || CSS_FILTERS.photographic;

  return {
    url: imageUrl,
    style,
    method: 'css',
    cssFilter,
  };
}

/**
 * Get CSS filter string for a given style.
 */
export function getStyleFilter(style: ImageStyle): string {
  return CSS_FILTERS[style] || CSS_FILTERS.photographic;
}

/**
 * Build a style object for inline React use.
 */
export function buildStyleFilterCSS(style: ImageStyle): React.CSSProperties {
  return {
    filter: CSS_FILTERS[style] || CSS_FILTERS.photographic,
  };
}
