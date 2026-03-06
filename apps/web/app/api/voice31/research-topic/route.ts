import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { trackUnitUsage } from '@/lib/services/cost-tracking.service';

export const runtime = 'nodejs';
export const maxDuration = 15;

// Dynamic import to avoid Next.js route compilation issues with exa-js
let exaClient: any = null;

async function getExaClient() {
  if (!exaClient && process.env.EXA_API_KEY) {
    const { default: Exa } = await import('exa-js');
    exaClient = new Exa(process.env.EXA_API_KEY);
  }
  return exaClient;
}

export interface ResearchResult {
  title: string;
  url: string;
  highlights: string[];
  summary: string;
  image?: string;
}

export interface ResearchResponse {
  success: boolean;
  query: string;
  results: ResearchResult[];
  costDollars: number;
}

/**
 * Exa instant search for research-enriched visual stories.
 *
 * Uses Exa's "auto" type for fast results with highlights and text snippets.
 * Designed for sub-500ms responses to feed into scene generation.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    const { question, maxResults = 5 } = await request.json();

    if (!question) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      );
    }

    const client = await getExaClient();
    if (!client) {
      return NextResponse.json(
        { error: 'Research service not configured (EXA_API_KEY missing)' },
        { status: 503 }
      );
    }

    console.log('[Research Topic] Searching:', question);

    const response = await client.searchAndContents(
      question,
      {
        numResults: Math.min(Math.max(maxResults, 1), 10),
        type: 'auto',
        text: {
          maxCharacters: 500,
        },
        highlights: {
          query: question,
          numSentences: 3,
        },
      }
    );

    const results: ResearchResult[] = response.results.map((result: any) => ({
      title: result.title || 'Untitled',
      url: result.url,
      highlights: result.highlights?.slice(0, 5) || [],
      summary: result.text?.slice(0, 500) || '',
      image: result.image || undefined,
    }));

    console.log('[Research Topic] Found', results.length, 'results for:', question);

    // Track Exa cost (non-blocking)
    if (userId) {
      trackUnitUsage({
        userId,
        provider: 'exa',
        model: 'exa-contents',
        service: 'search',
        endpoint: '/api/voice31/research-topic',
        units: 1,
        metadata: { question, numResults: results.length },
      }).catch((err) => console.error('[Research Topic] Cost tracking failed:', err));
    }

    return NextResponse.json({
      success: true,
      query: question,
      results,
      costDollars: 0,
    } as ResearchResponse);
  } catch (error) {
    console.error('[Research Topic] Error:', error);
    return NextResponse.json(
      { error: 'Research failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
