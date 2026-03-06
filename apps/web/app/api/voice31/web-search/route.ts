import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { trackUnitUsage } from '@/lib/services/cost-tracking.service';

export const runtime = 'nodejs';
export const maxDuration = 30;

// Dynamic import to avoid Next.js route compilation issues with exa-js
let exaClient: any = null;

async function getExaClient() {
  if (!exaClient && process.env.EXA_API_KEY) {
    const { default: Exa } = await import('exa-js');
    exaClient = new Exa(process.env.EXA_API_KEY);
  }
  return exaClient;
}

export interface SearchResult {
  id: string;
  title: string;
  url: string;
  snippet: string;
  highlights?: string[];
  publishedDate?: string;
  author?: string;
  score?: number;
  imageUrl?: string;
}

export interface SearchResponse {
  success: boolean;
  query: string;
  results: SearchResult[];
  totalResults: number;
}

/**
 * Search the web using Exa API.
 * Returns structured results suitable for CRT display.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    const { query, numResults = 5, category } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    const client = await getExaClient();
    if (!client) {
      return NextResponse.json(
        { error: 'Search service not configured (EXA_API_KEY missing)' },
        { status: 503 }
      );
    }

    console.log('[Voice31 Web Search] Searching:', query);

    // Execute search with Exa (v2 API: query as first param, options as second)
    const response = await client.searchAndContents(
      query,
      {
        numResults: Math.min(Math.max(numResults, 1), 10), // Clamp to 1-10
        type: 'auto',
        category: category || 'news', // Default to news for "latest" queries
        text: true,
        highlights: true,
      }
    );

    const results: SearchResult[] = response.results.map((result: any, index: number) => ({
      id: `result_${index}`,
      title: result.title || 'Untitled',
      url: result.url,
      snippet: result.text?.slice(0, 300) || result.highlights?.[0] || 'No preview available',
      highlights: result.highlights?.slice(0, 3),
      publishedDate: result.publishedDate,
      author: result.author,
      score: result.score,
      imageUrl: result.image || undefined,
    }));

    console.log('[Voice31 Web Search] Found', results.length, 'results');

    // Track Exa cost (non-blocking)
    if (userId) {
      trackUnitUsage({
        userId,
        provider: 'exa',
        model: 'exa-contents',
        service: 'search',
        endpoint: '/api/voice31/web-search',
        units: 1,
        metadata: { query, numResults: results.length, category },
      }).catch((err) => console.error('[Voice31 Web Search] Cost tracking failed:', err));
    }

    return NextResponse.json({
      success: true,
      query,
      results,
      totalResults: results.length,
    } as SearchResponse);
  } catch (error) {
    console.error('[Voice31 Web Search] Error:', error);
    return NextResponse.json(
      { error: 'Search failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for simple searches via query parameter
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');
  const numResults = parseInt(searchParams.get('n') || '5', 10);

  if (!query) {
    return NextResponse.json(
      { error: 'Query parameter "q" is required' },
      { status: 400 }
    );
  }

  // Reuse POST logic
  const fakeRequest = {
    json: async () => ({ query, numResults }),
  } as NextRequest;

  return POST(fakeRequest);
}
