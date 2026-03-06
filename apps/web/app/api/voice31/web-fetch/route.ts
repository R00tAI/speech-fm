import { NextRequest, NextResponse } from 'next/server';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';

export const runtime = 'nodejs';
export const maxDuration = 30;

export interface ReaderContent {
  title: string;
  source: string;
  url: string;
  content: string;
  textContent: string;
  excerpt?: string;
  byline?: string;
  siteName?: string;
  publishedDate?: string;
  images: string[];
  wordCount: number;
}

const DIRECT_FETCH_TIMEOUT_MS = 15000;
const FALLBACK_FETCH_TIMEOUT_MS = 18000;

const BROWSER_HEADERS: HeadersInit = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cache-Control': 'no-cache',
};

const JINA_HEADERS: HeadersInit = {
  'User-Agent': 'Mozilla/5.0 (compatible; SpeechFMReader/1.0; +https://a2m.ai)',
  'Accept': 'text/plain, text/markdown;q=0.9, */*;q=0.8',
};

function withTimeout(timeoutMs: number): { signal: AbortSignal; cleanup: () => void } {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  return {
    signal: controller.signal,
    cleanup: () => clearTimeout(timeout),
  };
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeText(input: string): string {
  return input
    .replace(/\r/g, '')
    .replace(/\u0000/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function markdownToText(markdown: string): string {
  return normalizeText(
    markdown
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/!\[[^\]]*\]\([^\)]*\)/g, ' ')
      .replace(/\[([^\]]+)\]\([^\)]*\)/g, '$1')
      .replace(/^>{1,}\s?/gm, '')
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/[\*_~]+/g, '')
      .replace(/^[-*+]\s+/gm, '')
      .replace(/^\d+\.\s+/gm, '')
  );
}

function textToHtmlParagraphs(text: string): string {
  const paragraphs = text
    .split(/\n\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 120);

  if (paragraphs.length === 0) {
    return '<p>No readable text extracted.</p>';
  }

  return paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('\n');
}

function looksLikeBlockedPage(title: string, text: string): boolean {
  const probe = `${title}\n${text.slice(0, 1800)}`.toLowerCase();
  return [
    'captcha',
    'access denied',
    'verify you are human',
    'cloudflare',
    'enable javascript',
    'automated queries',
    'bot detection',
  ].some((token) => probe.includes(token));
}

function extractImages(articleHtml: string, baseUrl: string): string[] {
  const contentDom = new JSDOM(articleHtml);
  const images: string[] = [];

  contentDom.window.document.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('src');
    if (!src) return;

    try {
      const absolute = new URL(src, baseUrl).href;
      if (!images.includes(absolute)) {
        images.push(absolute);
      }
    } catch {
      // Ignore invalid image URLs.
    }
  });

  return images;
}

function buildReaderContentFromText(params: {
  title: string;
  source: string;
  url: string;
  textContent: string;
  byline?: string;
  siteName?: string;
}): ReaderContent {
  const textContent = normalizeText(params.textContent).slice(0, 45000);
  const safeTitle = params.title.trim() || params.source;
  const wordCount = textContent ? textContent.split(/\s+/).filter(Boolean).length : 0;

  return {
    title: safeTitle,
    source: params.source,
    url: params.url,
    content: textToHtmlParagraphs(textContent),
    textContent,
    excerpt: textContent.slice(0, 240),
    byline: params.byline,
    siteName: params.siteName,
    publishedDate: undefined,
    images: [],
    wordCount,
  };
}

function extractFromHtml(html: string, url: string, parsedUrl: URL): ReaderContent {
  const dom = new JSDOM(html, { url });
  const document = dom.window.document;
  const pageTitle = document.querySelector('title')?.textContent?.trim() || parsedUrl.hostname;

  const reader = new Readability(document, {
    charThreshold: 80,
  });

  const article = reader.parse();

  if (!article) {
    const bodyText = normalizeText(document.body?.textContent || '');
    return buildReaderContentFromText({
      title: pageTitle,
      source: parsedUrl.hostname,
      url,
      textContent: bodyText,
    });
  }

  const cleanHtml = article.content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  const textContent = normalizeText(article.textContent || '');

  return {
    title: (article.title || pageTitle).trim() || parsedUrl.hostname,
    source: (article.siteName || parsedUrl.hostname).trim(),
    url,
    content: cleanHtml,
    textContent,
    excerpt: article.excerpt || textContent.slice(0, 240),
    byline: article.byline || undefined,
    siteName: article.siteName || undefined,
    publishedDate: undefined,
    images: extractImages(article.content, url).slice(0, 5),
    wordCount: textContent ? textContent.split(/\s+/).filter(Boolean).length : 0,
  };
}

async function fetchHtmlDirect(url: string): Promise<{ html: string; contentType: string }> {
  const { signal, cleanup } = withTimeout(DIRECT_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal,
      redirect: 'follow',
      headers: BROWSER_HEADERS,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    const contentType = response.headers.get('content-type') || '';

    if (!html || html.length < 80) {
      throw new Error('Empty or too-short HTML response');
    }

    return { html, contentType };
  } finally {
    cleanup();
  }
}

async function fetchReadableFallback(url: string): Promise<string> {
  const fallbackUrl = `https://r.jina.ai/${url}`;
  const { signal, cleanup } = withTimeout(FALLBACK_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(fallbackUrl, {
      signal,
      redirect: 'follow',
      headers: JINA_HEADERS,
    });

    if (!response.ok) {
      throw new Error(`Fallback HTTP ${response.status}`);
    }

    const text = await response.text();
    if (!text || text.length < 120) {
      throw new Error('Fallback returned empty text');
    }

    return text;
  } finally {
    cleanup();
  }
}

function extractFallbackContent(markdownPayload: string, url: string, parsedUrl: URL): ReaderContent {
  const lines = markdownPayload.split('\n');
  const titleLine = lines.find((line) => line.startsWith('Title:'));
  const titleFromHeader = titleLine?.replace(/^Title:\s*/, '').trim();

  const markerIndex = lines.findIndex((line) => line.trim().toLowerCase() === 'markdown content:');
  const markdownBody = markerIndex >= 0 ? lines.slice(markerIndex + 1).join('\n') : markdownPayload;
  const cleanedText = markdownToText(markdownBody);

  return buildReaderContentFromText({
    title: titleFromHeader || parsedUrl.hostname,
    source: parsedUrl.hostname,
    url,
    textContent: cleanedText,
  });
}

/**
 * GET is not supported — return 405 with clear message instead of bare 405.
 */
export async function GET() {
  return NextResponse.json(
    { error: 'Use POST with { url: "..." } to fetch articles' },
    { status: 405, headers: { Allow: 'POST' } },
  );
}

/**
 * Fetch a URL and extract readable content for Speech FM reader mode.
 * Uses direct fetch + Readability first, with a reader-proxy text fallback.
 */
export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL provided' },
        { status: 400 }
      );
    }

    console.log('[Voice31 Web Fetch] Fetching:', url);

    let directError: string | null = null;

    try {
      const { html, contentType } = await fetchHtmlDirect(url);
      console.log('[Voice31 Web Fetch] Direct fetch bytes:', html.length, '| content-type:', contentType || 'unknown');

      const directContent = extractFromHtml(html, url, parsedUrl);

      if (!looksLikeBlockedPage(directContent.title, directContent.textContent) && directContent.wordCount > 20) {
        console.log('[Voice31 Web Fetch] Direct extraction succeeded:', {
          title: directContent.title,
          words: directContent.wordCount,
          images: directContent.images.length,
        });

        return NextResponse.json({ success: true, content: directContent });
      }

      directError = 'Direct content looked blocked or too short';
      console.warn('[Voice31 Web Fetch] Direct extraction looked blocked/short; trying fallback');
    } catch (error) {
      directError = error instanceof Error ? error.message : String(error);
      console.warn('[Voice31 Web Fetch] Direct fetch failed:', directError);
    }

    try {
      const fallbackPayload = await fetchReadableFallback(url);
      const fallbackContent = extractFallbackContent(fallbackPayload, url, parsedUrl);

      if (fallbackContent.wordCount > 20) {
        console.log('[Voice31 Web Fetch] Fallback extraction succeeded:', {
          title: fallbackContent.title,
          words: fallbackContent.wordCount,
        });

        return NextResponse.json({ success: true, content: fallbackContent });
      }

      return NextResponse.json(
        {
          error: 'Unable to extract readable article text',
          details: {
            direct: directError,
            fallback: 'Fallback content was too short',
          },
        },
        { status: 502 }
      );
    } catch (fallbackError) {
      const fallbackDetails = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
      console.error('[Voice31 Web Fetch] Fallback fetch failed:', fallbackDetails);

      return NextResponse.json(
        {
          error: 'Failed to fetch article',
          details: {
            direct: directError,
            fallback: fallbackDetails,
          },
        },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error('[Voice31 Web Fetch] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process URL', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
