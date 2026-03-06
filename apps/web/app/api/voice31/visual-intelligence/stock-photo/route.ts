import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// =============================================================================
// IN-MEMORY CACHE (10 min TTL)
// =============================================================================

interface CacheEntry {
  url: string;
  photographer: string;
  photographerUrl: string;
  timestamp: number;
}

const photoCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function getCacheKey(keywords: string[]): string {
  return keywords.slice().sort().join(',').toLowerCase();
}

function getFromCache(key: string): CacheEntry | null {
  const entry = photoCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    photoCache.delete(key);
    return null;
  }
  return entry;
}

// Prune old entries periodically
function pruneCache() {
  const now = Date.now();
  for (const [key, entry] of photoCache) {
    if (now - entry.timestamp > CACHE_TTL_MS) {
      photoCache.delete(key);
    }
  }
}

// =============================================================================
// POST /api/voice31/visual-intelligence/stock-photo
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const { keywords } = await request.json();

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json({ error: 'keywords array is required' }, { status: 400 });
    }

    const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
    if (!UNSPLASH_ACCESS_KEY) {
      return NextResponse.json({ error: 'UNSPLASH_ACCESS_KEY not configured' }, { status: 500 });
    }

    // Check cache first
    const cacheKey = getCacheKey(keywords);
    const cached = getFromCache(cacheKey);
    if (cached) {
      return NextResponse.json({
        url: cached.url,
        photographer: cached.photographer,
        photographerUrl: cached.photographerUrl,
        cached: true,
      });
    }

    // Build query from keywords
    const query = keywords.slice(0, 4).join(' ');

    const unsplashUrl = new URL('https://api.unsplash.com/search/photos');
    unsplashUrl.searchParams.set('query', query);
    unsplashUrl.searchParams.set('orientation', 'landscape');
    unsplashUrl.searchParams.set('per_page', '5');

    const res = await fetch(unsplashUrl.toString(), {
      headers: {
        Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('[Stock Photo] Unsplash API error:', res.status, errorText);
      return NextResponse.json({ error: 'Unsplash API error' }, { status: res.status });
    }

    const data = await res.json();

    if (!data.results || data.results.length === 0) {
      return NextResponse.json({ error: 'No photos found' }, { status: 404 });
    }

    // Pick a random result from the top results for variety
    const idx = Math.floor(Math.random() * Math.min(data.results.length, 5));
    const photo = data.results[idx];

    // Use regular-sized URL (1080px wide) — good quality, not too heavy
    const photoUrl = photo.urls?.regular || photo.urls?.small || photo.urls?.full;
    const photographer = photo.user?.name || 'Unknown';
    const photographerUrl = photo.user?.links?.html || '';

    // Cache result
    const entry: CacheEntry = {
      url: photoUrl,
      photographer,
      photographerUrl,
      timestamp: Date.now(),
    };
    photoCache.set(cacheKey, entry);

    // Prune old cache entries occasionally
    if (photoCache.size > 50) {
      pruneCache();
    }

    // Trigger Unsplash download tracking (required by API guidelines)
    if (photo.links?.download_location) {
      fetch(`${photo.links.download_location}?client_id=${UNSPLASH_ACCESS_KEY}`)
        .catch(() => {/* background, non-critical */});
    }

    return NextResponse.json({
      url: photoUrl,
      photographer,
      photographerUrl,
      cached: false,
    });
  } catch (error) {
    console.error('[Stock Photo] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
