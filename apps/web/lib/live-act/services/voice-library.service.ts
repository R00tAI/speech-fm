/**
 * Voice Library Service
 *
 * Queries ElevenLabs Voice Library API to find voices that match character descriptions.
 * Replaces hardcoded voice pools with dynamic, AI-matched voice selection.
 *
 * API Reference: https://elevenlabs.io/docs/api-reference/voice-library/get-shared
 */

export interface VoiceSearchCriteria {
  gender?: 'male' | 'female';
  age?: 'young' | 'middle_aged' | 'old';
  accent?: string;
  language?: string;
  use_cases?: string[]; // 'audiobook', 'conversational', 'characters_animation', 'gaming', 'meditation'
  descriptives?: string[]; // 'gruff', 'warm', 'intense', 'deep', 'playful', 'authoritative', 'menacing'
  search?: string; // Free-text search
}

export interface VoiceLibraryVoice {
  voice_id: string;
  name: string;
  description?: string;
  preview_url?: string;
  category?: string;
  labels: Record<string, string>;
  // Parsed metadata
  gender?: string;
  age?: string;
  accent?: string;
  use_case?: string;
  descriptive?: string;
}

export interface VoiceSearchResult {
  voices: VoiceLibraryVoice[];
  total: number;
  has_more: boolean;
}

// ElevenLabs Voice Library valid filter values
export const ELEVENLABS_FILTER_VALUES = {
  gender: ['male', 'female'],
  age: ['young', 'middle_aged', 'old'],
  accent: [
    'american', 'british', 'australian', 'irish', 'indian', 'african',
    'latino', 'asian', 'middle_eastern', 'european', 'scandinavian'
  ],
  use_cases: [
    'audiobook', 'podcast', 'conversational', 'news', 'narration',
    'characters_animation', 'gaming', 'meditation', 'video_games',
    'social_media', 'asmr', 'training', 'children'
  ],
  descriptives: [
    'authoritative', 'confident', 'warm', 'friendly', 'professional',
    'casual', 'calm', 'energetic', 'deep', 'high', 'raspy', 'smooth',
    'gruff', 'gentle', 'intense', 'menacing', 'playful', 'serious',
    'sarcastic', 'dramatic', 'mysterious', 'wise', 'youthful'
  ],
} as const;

// Cache for voice library queries (5 minute TTL)
const voiceCache = new Map<string, { data: VoiceSearchResult; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

function getCacheKey(criteria: VoiceSearchCriteria): string {
  return JSON.stringify(criteria);
}

/**
 * Query the ElevenLabs Voice Library for matching voices
 */
export async function searchVoiceLibrary(
  criteria: VoiceSearchCriteria,
  options?: {
    limit?: number;
    page?: number;
    skipCache?: boolean;
  }
): Promise<VoiceSearchResult> {
  const { limit = 50, page = 0, skipCache = false } = options || {};
  const cacheKey = getCacheKey(criteria) + `_${limit}_${page}`;

  // Check cache
  if (!skipCache) {
    const cached = voiceCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY not configured');
  }

  // Build query parameters
  const params = new URLSearchParams();
  params.set('page_size', String(limit));
  if (page > 0) params.set('page', String(page));

  // Apply filters
  if (criteria.gender) params.set('gender', criteria.gender);
  if (criteria.age) params.set('age', criteria.age);
  if (criteria.accent) params.set('accent', criteria.accent);
  if (criteria.language) params.set('language', criteria.language);
  if (criteria.search) params.set('search', criteria.search);

  // Use_cases and descriptives are comma-separated
  if (criteria.use_cases?.length) {
    params.set('use_cases', criteria.use_cases.join(','));
  }
  if (criteria.descriptives?.length) {
    params.set('descriptives', criteria.descriptives.join(','));
  }

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/shared-voices?${params.toString()}`,
      {
        headers: {
          'xi-api-key': apiKey,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error('[VoiceLibrary] API error:', response.status, errorText);
      throw new Error(`Voice Library API error: ${response.status}`);
    }

    const data = await response.json();

    // Parse and normalize voice data
    const voices: VoiceLibraryVoice[] = (data.voices || []).map((v: any) => ({
      voice_id: v.voice_id,
      name: v.name,
      description: v.description,
      preview_url: v.preview_url,
      category: v.category,
      labels: v.labels || {},
      // Extract commonly used labels
      gender: v.labels?.gender,
      age: v.labels?.age,
      accent: v.labels?.accent,
      use_case: v.labels?.use_case,
      descriptive: v.labels?.descriptive,
    }));

    const result: VoiceSearchResult = {
      voices,
      total: data.total || voices.length,
      has_more: data.has_more ?? voices.length === limit,
    };

    // Cache result
    voiceCache.set(cacheKey, { data: result, timestamp: Date.now() });

    return result;
  } catch (error) {
    console.error('[VoiceLibrary] Search failed:', error);
    throw error;
  }
}

/**
 * Get user's own voices (added to account)
 */
export async function getUserVoices(): Promise<VoiceLibraryVoice[]> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY not configured');
  }

  try {
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': apiKey,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user voices: ${response.status}`);
    }

    const data = await response.json();

    return (data.voices || []).map((v: any) => ({
      voice_id: v.voice_id,
      name: v.name,
      description: v.description,
      preview_url: v.preview_url,
      category: v.category,
      labels: v.labels || {},
      gender: v.labels?.gender,
      age: v.labels?.age,
      accent: v.labels?.accent,
      use_case: v.labels?.use_case,
      descriptive: v.labels?.descriptive,
    }));
  } catch (error) {
    console.error('[VoiceLibrary] Failed to fetch user voices:', error);
    return [];
  }
}

/**
 * Find the best matching voice for a character description
 * Uses multiple search strategies with fallback
 */
export async function findMatchingVoice(
  criteria: VoiceSearchCriteria,
  usedVoiceIds: Set<string> = new Set(),
  options?: {
    preferUserVoices?: boolean;
    minResults?: number;
  }
): Promise<VoiceLibraryVoice | null> {
  const { preferUserVoices = false, minResults = 1 } = options || {};

  // Optionally check user's voices first
  if (preferUserVoices) {
    try {
      const userVoices = await getUserVoices();
      const matchingUserVoice = userVoices.find(v => {
        if (usedVoiceIds.has(v.voice_id)) return false;
        if (criteria.gender && v.gender !== criteria.gender) return false;
        if (criteria.age && v.age !== criteria.age) return false;
        return true;
      });
      if (matchingUserVoice) return matchingUserVoice;
    } catch {
      // Continue to library search
    }
  }

  // Strategy 1: Full criteria match
  try {
    const fullMatch = await searchVoiceLibrary(criteria, { limit: 20 });
    const available = fullMatch.voices.filter(v => !usedVoiceIds.has(v.voice_id));
    if (available.length >= minResults) {
      return available[0];
    }
  } catch {
    // Continue to fallback
  }

  // Strategy 2: Relaxed criteria (drop descriptives)
  if (criteria.descriptives?.length) {
    try {
      const relaxed = await searchVoiceLibrary({
        ...criteria,
        descriptives: undefined,
      }, { limit: 20 });
      const available = relaxed.voices.filter(v => !usedVoiceIds.has(v.voice_id));
      if (available.length >= minResults) {
        return available[0];
      }
    } catch {
      // Continue
    }
  }

  // Strategy 3: Gender only
  if (criteria.gender) {
    try {
      const genderOnly = await searchVoiceLibrary({
        gender: criteria.gender,
      }, { limit: 20 });
      const available = genderOnly.voices.filter(v => !usedVoiceIds.has(v.voice_id));
      if (available.length >= minResults) {
        return available[0];
      }
    } catch {
      // Continue
    }
  }

  // Strategy 4: Free text search with character description
  if (criteria.search) {
    try {
      const textSearch = await searchVoiceLibrary({
        search: criteria.search,
      }, { limit: 20 });
      const available = textSearch.voices.filter(v => !usedVoiceIds.has(v.voice_id));
      if (available.length >= minResults) {
        return available[0];
      }
    } catch {
      // Continue
    }
  }

  return null;
}

/**
 * Clear the voice library cache
 */
export function clearVoiceCache(): void {
  voiceCache.clear();
}

/**
 * Get suggested descriptives based on character archetype
 */
export function getSuggestedDescriptives(archetype: string): string[] {
  const archetypeMap: Record<string, string[]> = {
    // Heroes and protagonists
    hero: ['confident', 'warm', 'authoritative', 'energetic'],
    protagonist: ['confident', 'friendly', 'warm'],
    leader: ['authoritative', 'confident', 'professional'],

    // Villains and antagonists
    villain: ['deep', 'menacing', 'intense', 'dramatic'],
    antagonist: ['gruff', 'intense', 'serious'],
    dark: ['deep', 'mysterious', 'raspy'],

    // Supporting characters
    mentor: ['wise', 'calm', 'warm', 'authoritative'],
    guide: ['calm', 'friendly', 'professional'],
    sidekick: ['playful', 'energetic', 'friendly'],

    // Comedic
    comedic: ['playful', 'energetic', 'sarcastic'],
    funny: ['playful', 'casual', 'energetic'],
    trickster: ['playful', 'sarcastic', 'energetic'],

    // Dramatic
    dramatic: ['intense', 'dramatic', 'deep'],
    serious: ['authoritative', 'serious', 'professional'],
    emotional: ['warm', 'intense', 'dramatic'],

    // Age-based
    child: ['youthful', 'energetic', 'high'],
    elderly: ['wise', 'calm', 'gentle'],
    teenager: ['youthful', 'casual', 'energetic'],

    // Style-based
    anime: ['energetic', 'dramatic', 'youthful'],
    cartoon: ['playful', 'energetic', 'high'],
    realistic: ['professional', 'warm', 'smooth'],
    noir: ['deep', 'raspy', 'mysterious'],

    // Narration
    narrator: ['professional', 'calm', 'smooth'],
    storyteller: ['warm', 'engaging', 'smooth'],
    host: ['friendly', 'energetic', 'professional'],
  };

  const key = archetype.toLowerCase();
  return archetypeMap[key] || ['warm', 'professional'];
}

/**
 * Get suggested use cases based on content type
 */
export function getSuggestedUseCases(contentType: string): string[] {
  const contentMap: Record<string, string[]> = {
    story: ['audiobook', 'narration', 'characters_animation'],
    game: ['gaming', 'characters_animation', 'video_games'],
    educational: ['training', 'narration', 'podcast'],
    trivia: ['gaming', 'social_media', 'podcast'],
    meditation: ['meditation', 'asmr', 'calm'],
    news: ['news', 'podcast', 'professional'],
    children: ['children', 'characters_animation', 'audiobook'],
    comedy: ['social_media', 'conversational', 'podcast'],
    drama: ['audiobook', 'narration', 'characters_animation'],
    anime: ['characters_animation', 'gaming', 'video_games'],
  };

  const key = contentType.toLowerCase();
  return contentMap[key] || ['conversational', 'narration'];
}
