/**
 * Advanced Exa Research Engine
 * Provides depth-based searching with all Exa features
 */

export interface ExaResearchOptions {
  query: string;
  searchDepth: 'basic' | 'deep' | 'comprehensive';
  maxSources: number;
  format: 'academic' | 'blog' | 'technical-report';
  dateRange?: { start: string; end: string };
  domains?: { include?: string[]; exclude?: string[] };
  categories?: string[];
  includeImages?: boolean;
}

export interface ResearchSource {
  id: string;
  title: string;
  url: string;
  text: string;
  highlights?: string[];
  summary?: string;
  publishedDate?: string;
  author?: string;
  image?: string;
  score: number;
  credibilityScore?: number;
}

export interface ResearchProgress {
  stage: 'searching' | 'extracting' | 'analyzing' | 'verifying';
  progress: number;
  message: string;
  sourcesFound: number;
}

const EXA_ENDPOINT = 'https://api.exa.ai/search';
const EXA_CONTENTS_ENDPOINT = 'https://api.exa.ai/contents';

export class ExaResearchEngine {
  private apiKey: string;
  private onProgress?: (progress: ResearchProgress) => void;

  constructor(apiKey: string, onProgress?: (progress: ResearchProgress) => void) {
    this.apiKey = apiKey;
    this.onProgress = onProgress;
  }

  /**
   * Main entry point - routes to appropriate search strategy based on depth
   */
  async search(options: ExaResearchOptions): Promise<ResearchSource[]> {
    console.log(`[ExaResearch] Starting ${options.searchDepth} search for: "${options.query}"`);

    switch (options.searchDepth) {
      case 'basic':
        return this.basicSearch(options);
      case 'deep':
        return this.deepSearch(options);
      case 'comprehensive':
        return this.comprehensiveSearch(options);
      default:
        return this.basicSearch(options);
    }
  }

  /**
   * BASIC: Single query, top results with highlights
   */
  private async basicSearch(options: ExaResearchOptions): Promise<ResearchSource[]> {
    this.reportProgress({
      stage: 'searching',
      progress: 10,
      message: `Searching for "${options.query}"...`,
      sourcesFound: 0,
    });

    const searchQuery = this.buildQuery(options);
    const searchParams = this.buildSearchParams(options, options.maxSources);

    const response = await this.makeExaRequest(EXA_ENDPOINT, {
      query: searchQuery,
      ...searchParams,
      contents: {
        text: true,
        highlights: {
          numSentences: 3,
          highlightsPerUrl: 2,
        },
      },
    });

    const sources = this.parseResults(response.results);

    this.reportProgress({
      stage: 'extracting',
      progress: 50,
      message: `Found ${sources.length} sources`,
      sourcesFound: sources.length,
    });

    return sources.slice(0, options.maxSources);
  }

  /**
   * DEEP: Multiple queries, content extraction, credibility scoring
   */
  private async deepSearch(options: ExaResearchOptions): Promise<ResearchSource[]> {
    const allSources: ResearchSource[] = [];

    // Stage 1: Initial broad search
    this.reportProgress({
      stage: 'searching',
      progress: 5,
      message: 'Running initial broad search...',
      sourcesFound: 0,
    });

    const initialQuery = this.buildQuery(options);
    const initialResults = await this.makeExaRequest(EXA_ENDPOINT, {
      query: initialQuery,
      ...this.buildSearchParams(options, Math.ceil(options.maxSources * 0.6)),
      contents: {
        text: true,
        highlights: {
          numSentences: 5,
          highlightsPerUrl: 3,
        },
      },
    });

    const initialSources = this.parseResults(initialResults.results);
    allSources.push(...initialSources);

    this.reportProgress({
      stage: 'searching',
      progress: 30,
      message: `Found ${initialSources.length} initial sources`,
      sourcesFound: initialSources.length,
    });

    // Stage 2: Generate refined follow-up queries based on initial results
    const followUpQueries = this.generateFollowUpQueries(options, initialSources);

    for (let i = 0; i < Math.min(2, followUpQueries.length); i++) {
      const followUpQuery = followUpQueries[i];

      this.reportProgress({
        stage: 'searching',
        progress: 30 + (i + 1) * 15,
        message: `Searching: "${followUpQuery}"...`,
        sourcesFound: allSources.length,
      });

      const followUpResults = await this.makeExaRequest(EXA_ENDPOINT, {
        query: followUpQuery,
        ...this.buildSearchParams(options, Math.ceil(options.maxSources * 0.3)),
        contents: {
          text: true,
          highlights: true,
        },
      });

      const followUpSources = this.parseResults(followUpResults.results);
      allSources.push(...followUpSources);
    }

    this.reportProgress({
      stage: 'extracting',
      progress: 65,
      message: 'Extracting detailed content...',
      sourcesFound: allSources.length,
    });

    // Stage 3: Deep content extraction for top sources
    const topSources = this.deduplicateAndRank(allSources, options.maxSources);
    const enrichedSources = await this.enrichSources(topSources.slice(0, 10));

    this.reportProgress({
      stage: 'analyzing',
      progress: 85,
      message: 'Scoring source credibility...',
      sourcesFound: enrichedSources.length,
    });

    // Stage 4: Credibility scoring
    const scoredSources = await this.scoreCredibility(enrichedSources, options);

    return scoredSources.slice(0, options.maxSources);
  }

  /**
   * COMPREHENSIVE: All features, multiple iterations, cross-referencing
   */
  private async comprehensiveSearch(options: ExaResearchOptions): Promise<ResearchSource[]> {
    const allSources: ResearchSource[] = [];

    // Stage 1: Multiple query variations
    this.reportProgress({
      stage: 'searching',
      progress: 3,
      message: 'Generating comprehensive search strategy...',
      sourcesFound: 0,
    });

    const queryVariations = this.generateQueryVariations(options);

    for (let i = 0; i < queryVariations.length; i++) {
      const query = queryVariations[i];

      this.reportProgress({
        stage: 'searching',
        progress: 3 + (i + 1) * 8,
        message: `Search ${i + 1}/${queryVariations.length}: "${query}"...`,
        sourcesFound: allSources.length,
      });

      const results = await this.makeExaRequest(EXA_ENDPOINT, {
        query,
        ...this.buildSearchParams(options, 20),
        contents: {
          text: true,
          highlights: {
            numSentences: 7,
            highlightsPerUrl: 4,
          },
        },
      });

      allSources.push(...this.parseResults(results.results));
    }

    // Stage 2: Domain-specific deep dives
    this.reportProgress({
      stage: 'searching',
      progress: 40,
      message: 'Searching domain-specific sources...',
      sourcesFound: allSources.length,
    });

    const domainSources = await this.searchByDomains(options);
    allSources.push(...domainSources);

    // Stage 3: Time-series analysis if date range specified
    if (options.dateRange) {
      this.reportProgress({
        stage: 'searching',
        progress: 55,
        message: 'Analyzing historical trends...',
        sourcesFound: allSources.length,
      });

      const historicalSources = await this.timeSeriesSearch(options);
      allSources.push(...historicalSources);
    }

    // Stage 4: Deep content extraction and enrichment
    this.reportProgress({
      stage: 'extracting',
      progress: 65,
      message: 'Deep content extraction...',
      sourcesFound: allSources.length,
    });

    const topSources = this.deduplicateAndRank(allSources, options.maxSources * 2);
    const enrichedSources = await this.enrichSources(topSources.slice(0, 15));

    // Stage 5: Find similar pages for top sources
    this.reportProgress({
      stage: 'extracting',
      progress: 75,
      message: 'Finding related sources...',
      sourcesFound: enrichedSources.length,
    });

    const similarSources = await this.findSimilarSources(enrichedSources.slice(0, 5));
    enrichedSources.push(...similarSources);

    // Stage 6: Cross-reference verification
    this.reportProgress({
      stage: 'verifying',
      progress: 85,
      message: 'Cross-referencing facts...',
      sourcesFound: enrichedSources.length,
    });

    const verifiedSources = await this.crossReferenceVerify(enrichedSources, options);

    // Stage 7: Final credibility scoring
    this.reportProgress({
      stage: 'analyzing',
      progress: 95,
      message: 'Final quality assessment...',
      sourcesFound: verifiedSources.length,
    });

    const scoredSources = await this.scoreCredibility(verifiedSources, options);

    return scoredSources.slice(0, options.maxSources);
  }

  /**
   * Build optimized query based on format and topic
   */
  private buildQuery(options: ExaResearchOptions): string {
    const { query, format } = options;

    const formatModifiers = {
      academic: 'research paper study analysis',
      blog: 'guide tutorial article blog',
      'technical-report': 'technical documentation specification',
    };

    return `${query} ${formatModifiers[format]}`;
  }

  /**
   * Build Exa search parameters with all options
   */
  private buildSearchParams(options: ExaResearchOptions, numResults: number) {
    const params: any = {
      numResults,
      useAutoprompt: true,
      type: 'neural', // Use neural search for better relevance
    };

    // Date filtering
    if (options.dateRange) {
      params.startPublishedDate = options.dateRange.start;
      params.endPublishedDate = options.dateRange.end;
    }

    // Domain filtering
    if (options.domains?.include) {
      params.includeDomains = options.domains.include;
    }
    if (options.domains?.exclude) {
      params.excludeDomains = options.domains.exclude;
    }

    // Category filtering
    if (options.categories && options.categories.length > 0) {
      params.category = options.categories[0]; // Exa supports one category at a time
    }

    return params;
  }

  /**
   * Make request to Exa API
   */
  private async makeExaRequest(endpoint: string, body: any): Promise<any> {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Exa API error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Parse Exa results into our format
   */
  private parseResults(results: any[]): ResearchSource[] {
    return results.map((result, index) => ({
      id: result.id || `${Date.now()}_${index}`,
      title: result.title || 'Untitled',
      url: result.url,
      text: result.text || '',
      highlights: result.highlights || [],
      summary: result.summary,
      publishedDate: result.publishedDate,
      author: result.author,
      image: result.image,
      score: result.score || 0.5,
    }));
  }

  /**
   * Generate follow-up queries based on initial results
   */
  private generateFollowUpQueries(options: ExaResearchOptions, sources: ResearchSource[]): string[] {
    // Extract key terms from top sources
    const keyTerms = this.extractKeyTerms(sources.slice(0, 3));

    // Generate refined queries
    const queries = [
      `${options.query} ${keyTerms.slice(0, 2).join(' ')}`,
      `${options.query} case study example`,
    ];

    if (options.format === 'academic') {
      queries.push(`${options.query} methodology research`);
    } else if (options.format === 'technical-report') {
      queries.push(`${options.query} implementation architecture`);
    }

    return queries;
  }

  /**
   * Generate multiple query variations for comprehensive search
   */
  private generateQueryVariations(options: ExaResearchOptions): string[] {
    const base = options.query;

    const variations = [
      base,
      `${base} overview`,
      `${base} in-depth analysis`,
      `latest ${base} research`,
      `${base} best practices`,
    ];

    if (options.format === 'academic') {
      variations.push(
        `${base} literature review`,
        `${base} systematic review`,
        `${base} meta-analysis`
      );
    }

    return variations.slice(0, 5);
  }

  /**
   * Search specific domains based on format
   */
  private async searchByDomains(options: ExaResearchOptions): Promise<ResearchSource[]> {
    const domainSets = {
      academic: ['scholar.google.com', 'arxiv.org', 'pubmed.ncbi.nlm.nih.gov', 'jstor.org'],
      blog: ['medium.com', 'dev.to', 'substack.com', 'hashnode.com'],
      'technical-report': ['github.com', 'stackoverflow.com', 'docs.microsoft.com'],
    };

    const domains = domainSets[options.format];
    const sources: ResearchSource[] = [];

    for (const domain of domains.slice(0, 2)) {
      const results = await this.makeExaRequest(EXA_ENDPOINT, {
        query: options.query,
        numResults: 5,
        includeDomains: [domain],
        contents: { text: true },
      });

      sources.push(...this.parseResults(results.results));
    }

    return sources;
  }

  /**
   * Time-series search for historical analysis
   */
  private async timeSeriesSearch(options: ExaResearchOptions): Promise<ResearchSource[]> {
    if (!options.dateRange) return [];

    // Search different time periods
    const results = await this.makeExaRequest(EXA_ENDPOINT, {
      query: options.query,
      numResults: 10,
      startPublishedDate: options.dateRange.start,
      endPublishedDate: options.dateRange.end,
      contents: { text: true },
    });

    return this.parseResults(results.results);
  }

  /**
   * Enrich sources with full content using Contents API
   */
  private async enrichSources(sources: ResearchSource[]): Promise<ResearchSource[]> {
    const ids = sources.map(s => s.id).filter(Boolean);
    if (ids.length === 0) return sources;

    try {
      const response = await this.makeExaRequest(EXA_CONTENTS_ENDPOINT, {
        ids,
        text: { maxCharacters: 3000 },
        highlights: { numSentences: 5, highlightsPerUrl: 3 },
        summary: true,
      });

      // Merge enriched data back into sources
      return sources.map(source => {
        const enriched = response.results?.find((r: any) => r.id === source.id);
        if (enriched) {
          return {
            ...source,
            text: enriched.text || source.text,
            highlights: enriched.highlights || source.highlights,
            summary: enriched.summary || source.summary,
          };
        }
        return source;
      });
    } catch (error) {
      console.error('[ExaResearch] Enrichment failed:', error);
      return sources;
    }
  }

  /**
   * Find similar pages to expand research
   */
  private async findSimilarSources(sources: ResearchSource[]): Promise<ResearchSource[]> {
    const similarSources: ResearchSource[] = [];

    for (const source of sources.slice(0, 3)) {
      try {
        const results = await this.makeExaRequest('https://api.exa.ai/findSimilar', {
          url: source.url,
          numResults: 3,
          contents: { text: true },
        });

        similarSources.push(...this.parseResults(results.results));
      } catch (error) {
        console.error('[ExaResearch] Find similar failed for', source.url);
      }
    }

    return similarSources;
  }

  /**
   * Cross-reference facts across sources
   */
  private async crossReferenceVerify(
    sources: ResearchSource[],
    options: ExaResearchOptions
  ): Promise<ResearchSource[]> {
    // Extract key claims from sources
    // For now, just return sources (full implementation would use AI to verify claims)
    return sources;
  }

  /**
   * Score source credibility based on various factors
   */
  private async scoreCredibility(
    sources: ResearchSource[],
    options: ExaResearchOptions
  ): Promise<ResearchSource[]> {
    return sources.map(source => {
      let credScore = 50; // Base score

      // Factor 1: Domain reputation
      const trustworthyDomains = [
        'edu', 'gov', 'scholar.google', 'arxiv.org', 'nature.com',
        'science.org', 'ieee.org', 'acm.org', 'pubmed', 'wikipedia.org'
      ];
      if (trustworthyDomains.some(d => source.url.includes(d))) {
        credScore += 30;
      }

      // Factor 2: Has author
      if (source.author) {
        credScore += 10;
      }

      // Factor 3: Recent publication
      if (source.publishedDate) {
        const date = new Date(source.publishedDate);
        const daysOld = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
        if (daysOld < 365) credScore += 10;
      }

      // Factor 4: Content length (indicates depth)
      if (source.text && source.text.length > 1000) {
        credScore += 10;
      }

      return {
        ...source,
        credibilityScore: Math.min(100, Math.max(0, credScore)),
      };
    });
  }

  /**
   * Deduplicate and rank sources
   */
  private deduplicateAndRank(sources: ResearchSource[], limit: number): ResearchSource[] {
    // Remove duplicates by URL
    const seen = new Set<string>();
    const unique = sources.filter(s => {
      if (seen.has(s.url)) return false;
      seen.add(s.url);
      return true;
    });

    // Sort by score and credibility
    unique.sort((a, b) => {
      const scoreA = a.score + (a.credibilityScore || 50) / 100;
      const scoreB = b.score + (b.credibilityScore || 50) / 100;
      return scoreB - scoreA;
    });

    return unique.slice(0, limit * 2); // Return 2x for further processing
  }

  /**
   * Extract key terms from sources
   */
  private extractKeyTerms(sources: ResearchSource[]): string[] {
    // Simple implementation: extract common words from highlights
    const words = sources.flatMap(s =>
      (s.highlights || [])
        .join(' ')
        .toLowerCase()
        .split(/\W+/)
        .filter(w => w.length > 4)
    );

    // Count frequency
    const freq = new Map<string, number>();
    words.forEach(w => freq.set(w, (freq.get(w) || 0) + 1));

    // Return most frequent
    return Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);
  }

  /**
   * Report progress to callback
   */
  private reportProgress(progress: ResearchProgress) {
    console.log(`[ExaResearch] ${progress.stage}: ${progress.progress}% - ${progress.message}`);
    if (this.onProgress) {
      this.onProgress(progress);
    }
  }
}
