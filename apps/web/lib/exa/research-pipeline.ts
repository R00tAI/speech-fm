/**
 * Research Pipeline for Cinematic Scenes
 *
 * Wraps the existing ExaResearchEngine with instant/deep research modes
 * specifically for the storytelling scene generation pipeline.
 *
 * - researchInstant: Fast (~200ms), basic search for facts/stats/images
 * - researchDeep: Comprehensive (~3-15s), returns deep analysis/citations
 */

import {
  ExaResearchEngine,
  type ExaResearchOptions,
  type ResearchSource,
} from '@/lib/research/exa-research-engine';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface InstantResearchResult {
  facts: string[];        // Key factual statements
  stats: string[];        // Numerical data points
  images: ResearchImage[];
  sources: ResearchSourceBrief[];
  query: string;
}

export interface DeepResearchResult extends InstantResearchResult {
  analysis: string;       // Synthesized multi-paragraph analysis
  findings: string[];     // Key findings from deep research
  citations: ResearchCitation[];
}

export interface ResearchImage {
  url: string;
  title: string;
  sourceUrl: string;
  relevanceScore: number; // 0-1
}

export interface ResearchSourceBrief {
  title: string;
  url: string;
  summary: string;
  credibility: number;
}

export interface ResearchCitation {
  text: string;
  source: string;
  url: string;
}

// ---------------------------------------------------------------------------
// Research Pipeline
// ---------------------------------------------------------------------------

/**
 * Instant research: fast basic search for immediate scene context.
 * Returns facts, stats, and images within ~200-500ms.
 */
export async function researchInstant(query: string): Promise<InstantResearchResult> {
  const apiKey = process.env.EXA_API_KEY;
  if (!apiKey) {
    console.warn('[ResearchPipeline] No EXA_API_KEY, returning empty research');
    return { facts: [], stats: [], images: [], sources: [], query };
  }

  const engine = new ExaResearchEngine(apiKey);

  try {
    const sources = await engine.search({
      query,
      searchDepth: 'basic',
      maxSources: 8,
      format: 'blog',
      includeImages: true,
    });

    return extractResearchData(sources, query);
  } catch (err) {
    console.error('[ResearchPipeline] Instant research failed:', err);
    return { facts: [], stats: [], images: [], sources: [], query };
  }
}

/**
 * Deep research: comprehensive search with cross-referencing.
 * Returns detailed analysis, more citations, and verified facts.
 * Typically takes 3-15 seconds.
 */
export async function researchDeep(query: string): Promise<DeepResearchResult> {
  const apiKey = process.env.EXA_API_KEY;
  if (!apiKey) {
    console.warn('[ResearchPipeline] No EXA_API_KEY, returning empty deep research');
    return { facts: [], stats: [], images: [], sources: [], query, analysis: '', findings: [], citations: [] };
  }

  const engine = new ExaResearchEngine(apiKey);

  try {
    const sources = await engine.search({
      query,
      searchDepth: 'deep',
      maxSources: 15,
      format: 'technical-report',
      includeImages: true,
    });

    const base = extractResearchData(sources, query);

    // Extract deeper data
    const citations = extractCitations(sources);
    const findings = extractFindings(sources);
    const analysis = buildAnalysis(sources, query);

    return {
      ...base,
      analysis,
      findings,
      citations,
    };
  } catch (err) {
    console.error('[ResearchPipeline] Deep research failed:', err);
    return { facts: [], stats: [], images: [], sources: [], query, analysis: '', findings: [], citations: [] };
  }
}

// ---------------------------------------------------------------------------
// Format research data for scene generation prompt
// ---------------------------------------------------------------------------

/**
 * Format research result into a string suitable for the scene gen LLM prompt.
 */
export function formatResearchForPrompt(
  instant?: InstantResearchResult,
  deep?: DeepResearchResult,
): string {
  const sections: string[] = [];

  const data = deep || instant;
  if (!data) return '';

  if (data.facts.length > 0) {
    sections.push('### Key Facts\n' + data.facts.map((f) => `- ${f}`).join('\n'));
  }

  if (data.stats.length > 0) {
    sections.push('### Statistics\n' + data.stats.map((s) => `- ${s}`).join('\n'));
  }

  if (data.sources.length > 0) {
    sections.push(
      '### Sources\n' +
        data.sources
          .slice(0, 6)
          .map((s) => `- [${s.title}](${s.url}) — ${s.summary}`)
          .join('\n')
    );
  }

  if (data.images.length > 0) {
    sections.push(
      '### Available Images\n' +
        data.images
          .slice(0, 4)
          .map((img) => `- ${img.url} — "${img.title}" (relevance: ${(img.relevanceScore * 100).toFixed(0)}%)`)
          .join('\n')
    );
  }

  if (deep?.analysis) {
    sections.push('### Analysis\n' + deep.analysis);
  }

  if (deep?.findings && deep.findings.length > 0) {
    sections.push('### Key Findings\n' + deep.findings.map((f) => `- ${f}`).join('\n'));
  }

  if (deep?.citations && deep.citations.length > 0) {
    sections.push(
      '### Citable Quotes\n' +
        deep.citations
          .slice(0, 5)
          .map((c) => `- "${c.text}" — ${c.source} (${c.url})`)
          .join('\n')
    );
  }

  return sections.join('\n\n');
}

// ---------------------------------------------------------------------------
// Internal extraction helpers
// ---------------------------------------------------------------------------

function extractResearchData(
  sources: ResearchSource[],
  query: string,
): InstantResearchResult {
  const facts: string[] = [];
  const stats: string[] = [];
  const images: ResearchImage[] = [];
  const briefs: ResearchSourceBrief[] = [];

  // Regex for statistical statements
  const statPattern = /\d[\d,.]*\s*(%|percent|million|billion|trillion|thousand|per\s|increase|decrease|growth)/i;

  for (const source of sources) {
    // Extract facts from highlights
    for (const highlight of source.highlights || []) {
      const trimmed = highlight.trim();
      if (trimmed.length < 20 || trimmed.length > 300) continue;

      if (statPattern.test(trimmed)) {
        if (stats.length < 10) stats.push(trimmed);
      } else {
        if (facts.length < 10) facts.push(trimmed);
      }
    }

    // Extract images
    if (source.image && source.image.startsWith('http')) {
      images.push({
        url: source.image,
        title: source.title,
        sourceUrl: source.url,
        relevanceScore: source.score,
      });
    }

    // Build brief
    briefs.push({
      title: source.title,
      url: source.url,
      summary: source.summary || (source.highlights?.[0] ?? '').slice(0, 200),
      credibility: source.credibilityScore ?? 50,
    });
  }

  // Sort images by relevance
  images.sort((a, b) => b.relevanceScore - a.relevanceScore);

  return { facts, stats, images, sources: briefs, query };
}

function extractCitations(sources: ResearchSource[]): ResearchCitation[] {
  const citations: ResearchCitation[] = [];

  for (const source of sources) {
    for (const highlight of source.highlights || []) {
      const trimmed = highlight.trim();
      if (trimmed.length >= 30 && trimmed.length <= 250) {
        citations.push({
          text: trimmed,
          source: source.title,
          url: source.url,
        });
      }
    }
  }

  return citations.slice(0, 10);
}

function extractFindings(sources: ResearchSource[]): string[] {
  const findings: string[] = [];
  const seen = new Set<string>();

  for (const source of sources) {
    const text = source.summary || source.text;
    if (!text) continue;

    // Extract first substantive sentence
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 30);
    for (const sentence of sentences.slice(0, 2)) {
      const trimmed = sentence.trim();
      const key = trimmed.toLowerCase().slice(0, 50);
      if (!seen.has(key)) {
        seen.add(key);
        findings.push(trimmed + '.');
      }
      if (findings.length >= 8) break;
    }
    if (findings.length >= 8) break;
  }

  return findings;
}

function buildAnalysis(sources: ResearchSource[], query: string): string {
  // Build a quick summary from source summaries
  const summaries = sources
    .filter((s) => s.summary && s.summary.length > 50)
    .slice(0, 5)
    .map((s) => s.summary!);

  if (summaries.length === 0) return '';

  return `Research on "${query}" found ${sources.length} relevant sources. ` +
    summaries.join(' ').slice(0, 800);
}
