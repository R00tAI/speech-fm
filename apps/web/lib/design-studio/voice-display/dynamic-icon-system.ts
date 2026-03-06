/**
 * Dynamic Icon System
 *
 * A semantic-driven icon query and rendering system that:
 * 1. Extracts keywords from conversation
 * 2. Queries Iconify API for matching icons
 * 3. Randomly selects from results for variety
 * 4. Uses semantic analysis to control visual properties
 *
 * This creates truly dynamic, never-hardcoded visual effects.
 */

// =============================================================================
// TYPES
// =============================================================================

export interface IconQueryResult {
  icons: string[]; // Format: "prefix:name" e.g. "mdi:sun"
  total: number;
  limit: number;
  start: number;
}

export interface IconMetadata {
  name: string;
  prefix: string;
  fullName: string;
  categories?: string[];
}

export interface SemanticIconConfig {
  icon: string;
  size: number;
  color: string;
  glowColor: string;
  glowIntensity: number;
  animationStyle: IconAnimationStyle;
  animationSpeed: number;
  position: IconPosition;
  opacity: number;
  rotation: number;
  rotationSpeed: number;
}

export type IconAnimationStyle =
  | 'float'      // Gentle up/down bobbing
  | 'pulse'      // Scale in/out
  | 'spin'       // Continuous rotation
  | 'drift'      // Slow random movement
  | 'twinkle'    // Opacity flicker
  | 'bounce'     // Elastic bounce
  | 'wave'       // Side to side
  | 'breathe'    // Slow scale pulse
  | 'orbit'      // Circular motion
  | 'shake';     // Quick vibration

export interface IconPosition {
  zone: 'corner-tl' | 'corner-tr' | 'corner-bl' | 'corner-br' |
        'edge-top' | 'edge-bottom' | 'edge-left' | 'edge-right' |
        'center' | 'scattered' | 'random';
  x: number; // 0-1 normalized
  y: number;
}

export interface SemanticContext {
  keywords: string[];
  emotionalWeight: number;      // 0-1, higher = more intense visuals
  urgency: number;              // 0-1, affects animation speed
  positivity: number;           // -1 to 1, affects color warmth
  complexity: number;           // 0-1, affects how many icons
  energy: number;               // 0-1, affects animation intensity
}

export interface IconGenerationOptions {
  minIcons?: number;
  maxIcons?: number;
  style?: keyof typeof ICON_SETS;
  prefixes?: string[];
  allowlistPrefixes?: string[];
  blocklistPrefixes?: string[];
  favoriteIcons?: string[];
  blockedIcons?: string[];
  sizeRange?: { min: number; max: number };
  positioning?: {
    avoidCenter?: boolean;
    centerAvoidanceRadius?: number;
    preferEdges?: boolean;
    allowedZones?: IconPosition['zone'][];
  };
  query?: {
    maxKeywords?: number;
    expandSynonyms?: boolean;
  };
  seed?: string;
}

// =============================================================================
// ICONIFY API INTEGRATION
// =============================================================================

const ICONIFY_API = 'https://api.iconify.design';

// Preferred icon sets for different styles (excluding Lucide per user preference)
export const ICON_SETS = {
  // Material Design - clean, modern
  material: ['mdi', 'ic', 'material-symbols'],
  // Playful and expressive
  playful: ['emojione', 'noto', 'twemoji', 'fluent-emoji'],
  // Minimal and elegant
  minimal: ['feather', 'tabler', 'carbon'],
  // Bold and impactful
  bold: ['fa6-solid', 'bi', 'heroicons-solid'],
  // Outlined/light
  outlined: ['heroicons-outline', 'ion', 'clarity'],
  // Phosphor variants (user preferred)
  phosphor: ['ph', 'ph-bold', 'ph-fill', 'ph-duotone'],
  // All sets for maximum variety
  all: [] // Empty means search all
};

// Cache for icon queries
const iconCache = new Map<string, { icons: string[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function clampInt(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function hashString(input: string) {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createRng(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function normalizeIconName(icon: string) {
  const name = icon.includes(':') ? icon.split(':')[1] : icon;
  return name.replace(/[-_]/g, ' ').toLowerCase();
}

function scoreIconAgainstKeywords(
  icon: string,
  keywords: string[],
  favorites: string[] = []
) {
  const name = normalizeIconName(icon);
  let score = 0;

  if (favorites.includes(icon) || favorites.includes(name)) {
    score += 3;
  }

  keywords.forEach((keyword) => {
    if (!keyword) return;
    if (name === keyword) score += 3;
    else if (name.startsWith(keyword)) score += 2;
    else if (name.includes(keyword)) score += 1.2;
  });

  return score;
}

/**
 * Query Iconify API for icons matching a keyword
 */
export async function queryIcons(
  keyword: string,
  options: {
    limit?: number;
    prefixes?: string[];
    style?: keyof typeof ICON_SETS;
  } = {}
): Promise<string[]> {
  const { limit = 20, prefixes, style } = options;

  // Build cache key
  const cacheKey = `${keyword}-${limit}-${prefixes?.join(',') || style || 'all'}`;

  // Check cache
  const cached = iconCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.icons;
  }

  // Determine prefixes to search
  let searchPrefixes = prefixes;
  if (!searchPrefixes && style) {
    searchPrefixes = ICON_SETS[style];
  }

  // Build query URL
  const params = new URLSearchParams({
    query: keyword,
    limit: String(limit),
  });

  if (searchPrefixes && searchPrefixes.length > 0) {
    params.set('prefixes', searchPrefixes.join(','));
  }

  try {
    const response = await fetch(`${ICONIFY_API}/search?${params}`);
    if (!response.ok) {
      console.warn(`Iconify query failed for "${keyword}": ${response.status}`);
      return [];
    }

    const data: IconQueryResult = await response.json();

    // Cache results
    iconCache.set(cacheKey, { icons: data.icons, timestamp: Date.now() });

    return data.icons;
  } catch (error) {
    console.warn(`Iconify query error for "${keyword}":`, error);
    return [];
  }
}

/**
 * Query multiple keywords and combine results
 */
export async function queryMultipleKeywords(
  keywords: string[],
  options: {
    limitPerKeyword?: number;
    style?: keyof typeof ICON_SETS;
    prefixes?: string[];
    blocklistPrefixes?: string[];
  } = {}
): Promise<Map<string, string[]>> {
  const { limitPerKeyword = 10, style, prefixes, blocklistPrefixes } = options;

  const results = new Map<string, string[]>();

  // Query in parallel for speed
  await Promise.all(
    keywords.map(async (keyword) => {
      const icons = await queryIcons(keyword, {
        limit: limitPerKeyword,
        style,
        prefixes,
      });
      const filtered = blocklistPrefixes?.length
        ? icons.filter((icon) => {
            const prefix = icon.split(':')[0] || '';
            return !blocklistPrefixes.includes(prefix);
          })
        : icons;
      results.set(keyword, filtered);
    })
  );

  return results;
}

// =============================================================================
// KEYWORD EXTRACTION
// =============================================================================

// Common words to ignore when extracting keywords
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
  'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those',
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us',
  'them', 'my', 'your', 'his', 'its', 'our', 'their', 'what', 'which',
  'who', 'whom', 'when', 'where', 'why', 'how', 'all', 'each', 'every',
  'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'not',
  'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'also',
  'now', 'here', 'there', 'then', 'once', 'if', 'because', 'until',
  'while', 'about', 'into', 'through', 'during', 'before', 'after',
  'above', 'below', 'between', 'under', 'again', 'further', 'then',
  'really', 'actually', 'basically', 'literally', 'um', 'uh', 'like',
]);

// Semantic keyword categories for better icon matching
const KEYWORD_SYNONYMS: Record<string, string[]> = {
  // Time of day
  morning: ['sun', 'sunrise', 'dawn', 'coffee'],
  evening: ['sunset', 'dusk', 'moon'],
  night: ['moon', 'star', 'sleep', 'dark'],

  // Weather
  rain: ['water', 'cloud', 'umbrella', 'drop'],
  snow: ['snowflake', 'cold', 'winter', 'ice'],
  sunny: ['sun', 'bright', 'warm', 'summer'],
  storm: ['lightning', 'thunder', 'cloud', 'wind'],

  // Emotions
  happy: ['smile', 'joy', 'heart', 'celebration'],
  sad: ['tear', 'rain', 'cloud', 'broken'],
  angry: ['fire', 'lightning', 'explosion'],
  excited: ['star', 'sparkle', 'celebration', 'party'],
  scared: ['ghost', 'skull', 'warning', 'alert'],

  // Activities
  work: ['briefcase', 'computer', 'office', 'document'],
  travel: ['plane', 'car', 'map', 'compass', 'luggage'],
  eat: ['food', 'restaurant', 'utensils', 'plate'],
  sleep: ['bed', 'moon', 'pillow', 'zzz'],
  exercise: ['dumbbell', 'running', 'heart', 'fitness'],

  // Technology
  code: ['terminal', 'code', 'brackets', 'developer'],
  ai: ['brain', 'robot', 'sparkle', 'magic'],
  data: ['chart', 'graph', 'database', 'analytics'],

  // Nature
  forest: ['tree', 'leaf', 'nature', 'plant'],
  ocean: ['wave', 'water', 'fish', 'anchor'],
  mountain: ['peak', 'hiking', 'landscape'],
  garden: ['flower', 'plant', 'leaf', 'butterfly'],

  // Objects
  money: ['dollar', 'coin', 'wallet', 'bank'],
  music: ['note', 'headphones', 'speaker', 'microphone'],
  book: ['book', 'library', 'reading', 'education'],
  game: ['gamepad', 'controller', 'trophy', 'puzzle'],
};

/**
 * Extract meaningful keywords from text for icon queries
 */
export function extractKeywords(
  text: string,
  options: { maxKeywords?: number; expandSynonyms?: boolean } = {}
): string[] {
  const { maxKeywords = 8, expandSynonyms = true } = options;
  // Normalize and tokenize
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));

  // Deduplicate
  const unique = [...new Set(words)];

  // Expand with synonyms for better icon matching
  const expanded: string[] = [];
  for (const word of unique) {
    expanded.push(word);

    // Add synonyms if available
    if (expandSynonyms && KEYWORD_SYNONYMS[word]) {
      expanded.push(...KEYWORD_SYNONYMS[word].slice(0, 2)); // Add up to 2 synonyms
    }
  }

  // Return top keywords (prioritize original words)
  return [...new Set(expanded)].slice(0, maxKeywords);
}

// =============================================================================
// SEMANTIC VISUAL PROPERTY GENERATION
// =============================================================================

/**
 * Analyze text to extract semantic context for visual styling
 */
export function analyzeSemanticContext(
  text: string,
  options: { maxKeywords?: number; expandSynonyms?: boolean } = {}
): SemanticContext {
  const lowerText = text.toLowerCase();

  // Emotional weight - exclamations, caps, emphasis
  const exclamations = (text.match(/!/g) || []).length;
  const allCaps = (text.match(/\b[A-Z]{2,}\b/g) || []).length;
  const emotionalWeight = Math.min((exclamations * 0.2 + allCaps * 0.1), 1);

  // Urgency - time words, speed words
  const urgentWords = /\b(now|immediately|urgent|quick|fast|hurry|asap|important)\b/i;
  const urgency = urgentWords.test(text) ? 0.8 : 0.3;

  // Positivity - sentiment analysis (simple)
  const positiveWords = /\b(love|great|amazing|wonderful|happy|good|awesome|beautiful|fantastic|excellent)\b/gi;
  const negativeWords = /\b(hate|terrible|awful|bad|sad|angry|horrible|worst|ugly|disgusting)\b/gi;
  const posCount = (text.match(positiveWords) || []).length;
  const negCount = (text.match(negativeWords) || []).length;
  const positivity = posCount > negCount ? 0.5 + Math.min(posCount * 0.2, 0.5) :
                     negCount > posCount ? -0.5 - Math.min(negCount * 0.2, 0.5) : 0;

  // Complexity - word count, sentence structure
  const wordCount = text.split(/\s+/).length;
  const complexity = Math.min(wordCount / 50, 1);

  // Energy - action words, movement
  const energyWords = /\b(run|jump|dance|fly|move|spin|bounce|shake|explode|burst|zoom)\b/gi;
  const energy = Math.min((text.match(energyWords) || []).length * 0.3 + 0.2, 1);

  return {
    keywords: extractKeywords(text, options),
    emotionalWeight,
    urgency,
    positivity,
    complexity,
    energy,
  };
}

/**
 * Generate color based on semantic context
 */
export function generateSemanticColor(context: SemanticContext): { main: string; glow: string } {
  // Base hue from positivity (-1 to 1)
  // Negative = cool blues/purples, Positive = warm yellows/oranges
  let hue: number;
  if (context.positivity > 0.3) {
    hue = 30 + context.positivity * 30; // Warm: 30-60 (orange to yellow)
  } else if (context.positivity < -0.3) {
    hue = 220 + Math.abs(context.positivity) * 40; // Cool: 220-260 (blue to purple)
  } else {
    hue = 180 + context.positivity * 50; // Neutral: cyan range
  }

  // Saturation from energy
  const saturation = 50 + context.energy * 40;

  // Lightness from emotional weight
  const lightness = 50 + context.emotionalWeight * 20;

  const main = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  const glow = `hsl(${hue}, ${saturation + 10}%, ${lightness + 10}%)`;

  return { main, glow };
}

/**
 * Select animation style based on semantic context
 */
export function selectAnimationStyle(
  context: SemanticContext,
  rand: () => number = Math.random
): IconAnimationStyle {
  const styles: { style: IconAnimationStyle; weight: number }[] = [
    { style: 'float', weight: context.energy < 0.3 ? 3 : 1 },
    { style: 'pulse', weight: context.emotionalWeight > 0.5 ? 3 : 1 },
    { style: 'spin', weight: context.energy > 0.6 ? 3 : 0.5 },
    { style: 'drift', weight: context.complexity > 0.5 ? 2 : 1 },
    { style: 'twinkle', weight: context.positivity > 0 ? 2 : 1 },
    { style: 'bounce', weight: context.positivity > 0.5 ? 3 : 0.5 },
    { style: 'wave', weight: 1 },
    { style: 'breathe', weight: context.urgency < 0.5 ? 2 : 0.5 },
    { style: 'orbit', weight: context.complexity > 0.7 ? 2 : 0.5 },
    { style: 'shake', weight: context.urgency > 0.7 ? 3 : 0.2 },
  ];

  // Weighted random selection
  const totalWeight = styles.reduce((sum, s) => sum + s.weight, 0);
  let random = rand() * totalWeight;

  for (const { style, weight } of styles) {
    random -= weight;
    if (random <= 0) return style;
  }

  return 'float';
}

/**
 * Generate position for icon based on context
 */
export function generateIconPosition(
  context: SemanticContext,
  index: number,
  total: number,
  positioning: IconGenerationOptions['positioning'] = {},
  rand: () => number = Math.random
): IconPosition {
  const {
    avoidCenter = true,
    centerAvoidanceRadius = 0.25,
    preferEdges = false,
    allowedZones,
  } = positioning || {};

  const defaultZones: IconPosition['zone'][] = [
    'corner-tl', 'corner-tr', 'corner-bl', 'corner-br',
    'edge-top', 'edge-bottom', 'edge-left', 'edge-right',
    'scattered', 'random',
  ];
  const zones = (allowedZones && allowedZones.length > 0 ? allowedZones : defaultZones);

  // More complex contexts use more scattered positions
  const zone = context.complexity > 0.5
    ? 'scattered'
    : zones[Math.floor(rand() * zones.length)];

  // Calculate position based on zone
  let x: number, y: number;

  switch (zone) {
    case 'corner-tl': x = 0.1 + rand() * 0.1; y = 0.1 + rand() * 0.1; break;
    case 'corner-tr': x = 0.8 + rand() * 0.1; y = 0.1 + rand() * 0.1; break;
    case 'corner-bl': x = 0.1 + rand() * 0.1; y = 0.8 + rand() * 0.1; break;
    case 'corner-br': x = 0.8 + rand() * 0.1; y = 0.8 + rand() * 0.1; break;
    case 'edge-top': x = 0.2 + rand() * 0.6; y = 0.05 + rand() * 0.1; break;
    case 'edge-bottom': x = 0.2 + rand() * 0.6; y = 0.85 + rand() * 0.1; break;
    case 'edge-left': x = 0.05 + rand() * 0.1; y = 0.2 + rand() * 0.6; break;
    case 'edge-right': x = 0.85 + rand() * 0.1; y = 0.2 + rand() * 0.6; break;
    case 'center': x = 0.4 + rand() * 0.2; y = 0.4 + rand() * 0.2; break;
    case 'scattered':
    case 'random':
    default: {
      const angle = (index / total) * Math.PI * 2 + rand() * 0.5;
      const minRadius = avoidCenter ? centerAvoidanceRadius : 0.15;
      const radius = minRadius + rand() * (0.45 - minRadius);
      x = 0.5 + Math.cos(angle) * radius;
      y = 0.5 + Math.sin(angle) * radius;
      break;
    }
  }

  if (preferEdges && zone !== 'edge-top' && zone !== 'edge-bottom' && zone !== 'edge-left' && zone !== 'edge-right') {
    x = clamp(x, 0.08, 0.92);
    y = clamp(y, 0.08, 0.92);
  }

  return { zone, x, y };
}

// =============================================================================
// MAIN ICON GENERATION FUNCTION
// =============================================================================

/**
 * Generate semantic icon configurations from text
 * This is the main entry point for the dynamic icon system
 */
export async function generateSemanticIcons(
  text: string,
  options: IconGenerationOptions = {}
): Promise<SemanticIconConfig[]> {
  const {
    minIcons = 2,
    maxIcons = 5,
    style = 'phosphor',
    prefixes,
    allowlistPrefixes,
    blocklistPrefixes,
    favoriteIcons = [],
    blockedIcons = [],
    sizeRange,
    positioning,
    query,
    seed,
  } = options;

  const rng = createRng(hashString(`${seed || text || 'seed'}:${style}`));
  const context = analyzeSemanticContext(text, {
    maxKeywords: query?.maxKeywords,
    expandSynonyms: query?.expandSynonyms,
  });

  if (context.keywords.length === 0) {
    return [];
  }

  const keywordLimit = query?.maxKeywords ?? 6;
  const keywords = context.keywords.slice(0, keywordLimit);
  const searchPrefixes = allowlistPrefixes?.length ? allowlistPrefixes : prefixes;

  const iconsByKeyword = await queryMultipleKeywords(keywords, {
    limitPerKeyword: 12,
    style,
    prefixes: searchPrefixes,
    blocklistPrefixes,
  });

  const blockedSet = new Set(blockedIcons.map((icon) => icon.toLowerCase()));
  const isBlocked = (icon: string) => {
    const name = normalizeIconName(icon);
    return blockedSet.has(icon.toLowerCase()) || blockedSet.has(name);
  };

  const targetCount = clampInt(
    minIcons + (maxIcons - minIcons) * (context.complexity * 0.7 + context.energy * 0.3),
    minIcons,
    maxIcons
  );

  const selectedIcons: string[] = [];
  const used = new Set<string>();

  const addIcon = (icon: string) => {
    if (!icon || used.has(icon) || isBlocked(icon)) return false;
    used.add(icon);
    selectedIcons.push(icon);
    return true;
  };

  favoriteIcons.forEach((icon) => {
    if (selectedIcons.length < targetCount && icon.includes(':')) {
      addIcon(icon);
    }
  });

  keywords.forEach((keyword) => {
    if (selectedIcons.length >= targetCount) return;
    const icons = iconsByKeyword.get(keyword) || [];
    const filtered = icons.filter((icon) => !isBlocked(icon));
    const scored = filtered
      .map((icon) => ({
        icon,
        score: scoreIconAgainstKeywords(icon, [keyword, ...context.keywords], favoriteIcons),
      }))
      .sort((a, b) => b.score - a.score);

    const top = scored.slice(0, Math.min(8, scored.length));
    while (top.length > 0 && selectedIcons.length < targetCount) {
      const index = Math.floor(rng() * top.length);
      const candidate = top.splice(index, 1)[0];
      if (addIcon(candidate.icon)) {
        break;
      }
    }
  });

  if (selectedIcons.length < targetCount) {
    const allIcons: string[] = [];
    iconsByKeyword.forEach((icons) => allIcons.push(...icons));
    const filtered = [...new Set(allIcons)].filter((icon) => !isBlocked(icon));
    const scored = filtered
      .map((icon) => ({
        icon,
        score: scoreIconAgainstKeywords(icon, context.keywords, favoriteIcons),
      }))
      .sort((a, b) => b.score - a.score);

    const pool = scored.slice(0, Math.min(20, scored.length));
    while (pool.length > 0 && selectedIcons.length < targetCount) {
      const index = Math.floor(rng() * pool.length);
      const candidate = pool.splice(index, 1)[0];
      addIcon(candidate.icon);
    }
  }

  if (selectedIcons.length === 0) {
    return [];
  }

  const colors = generateSemanticColor(context);
  const baseSize = sizeRange
    ? (sizeRange.min + sizeRange.max) / 2
    : 32 + context.emotionalWeight * 24;
  const sizeVariance = sizeRange
    ? (sizeRange.max - sizeRange.min) * 0.5
    : baseSize * 0.4;

  return selectedIcons.map((icon, index) => {
    const position = generateIconPosition(context, index, selectedIcons.length, positioning, rng);
    const animStyle = selectAnimationStyle(context, rng);

    const size = clampInt(
      baseSize + (rng() - 0.5) * sizeVariance,
      sizeRange?.min ?? 18,
      sizeRange?.max ?? 96
    );

    const animationSpeed = clamp(0.5 + context.urgency * 0.6 + context.energy * 0.6, 0.4, 2.2);

    return {
      icon,
      size,
      color: colors.main,
      glowColor: colors.glow,
      glowIntensity: clamp(0.25 + context.emotionalWeight * 0.6, 0.2, 0.9),
      animationStyle: animStyle,
      animationSpeed,
      position,
      opacity: clamp(0.6 + rng() * 0.35, 0.55, 0.95),
      rotation: animStyle === 'spin' ? 0 : rng() * 360,
      rotationSpeed: animStyle === 'spin' ? (1 + rng()) * (rng() > 0.5 ? 1 : -1) : 0,
    };
  });
}

// All functions are already exported inline via 'export async function' / 'export function'
