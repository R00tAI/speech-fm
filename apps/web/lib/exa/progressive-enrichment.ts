/**
 * Progressive Scene Enrichment
 *
 * After initial scenes stream from the LLM, deep research results arrive.
 * This module uses the deep research data to generate 2-4 additional
 * enrichment scenes with real citations and facts.
 */

import { generateText } from "ai";
import { gateway } from "@/lib/ai/vercel-gateway";
import type { DeepResearchResult } from "./research-pipeline";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EnrichedScene {
  id: string;
  type: string;
  duration: number;
  caption: string;
  transcript: { fullText: string; words: never[] };
  data: Record<string, unknown>;
  accent: string;
  bg?: string;
  bgGradient?: string;
  transition?: string;
}

// ---------------------------------------------------------------------------
// Enrichment
// ---------------------------------------------------------------------------

/**
 * Generate 2-4 enriched follow-up scenes using deep research data.
 *
 * @param initialSceneCount - How many scenes were already streamed (for [[SCENE:N]] numbering)
 * @param deepResearch - Deep research results from Exa
 * @param usedFacts - Facts already incorporated into initial scenes (to avoid duplication)
 */
export async function enrichScenesWithResearch(
  initialSceneCount: number,
  deepResearch: DeepResearchResult,
  usedFacts: Set<string> = new Set(),
): Promise<EnrichedScene[]> {
  // Filter to unused research data
  const unusedFacts = deepResearch.facts.filter((f) => !usedFacts.has(f));
  const unusedStats = deepResearch.stats.filter((s) => !usedFacts.has(s));
  const unusedCitations = deepResearch.citations.filter(
    (c) => !usedFacts.has(c.text),
  );
  const unusedFindings = deepResearch.findings.filter((f) => !usedFacts.has(f));

  // If there's not enough new data, skip enrichment
  if (
    unusedFacts.length +
      unusedStats.length +
      unusedCitations.length +
      unusedFindings.length <
    2
  ) {
    console.log("[Enrichment] Not enough unused research data for enrichment");
    return [];
  }

  const startSceneNum = initialSceneCount + 1; // Next scene number after initial batch

  const prompt = buildEnrichmentPrompt(
    startSceneNum,
    deepResearch.query,
    unusedFacts,
    unusedStats,
    unusedCitations,
    unusedFindings,
    deepResearch.images,
    deepResearch.analysis,
  );

  try {
    const result = await generateText({
      model: gateway("google/gemini-2.5-flash" as any),
      system: ENRICHMENT_SYSTEM_PROMPT,
      prompt,
      temperature: 0.7,
      maxOutputTokens: 4096,
    });

    const scenes = parseEnrichmentResult(result.text);
    console.log(`[Enrichment] Generated ${scenes.length} enriched scenes`);
    return scenes;
  } catch (err) {
    console.error("[Enrichment] Failed to generate enriched scenes:", err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Prompt
// ---------------------------------------------------------------------------

const ENRICHMENT_SYSTEM_PROMPT = `You are a visual storytelling enrichment engine.
Given deep research data that was NOT included in the initial scene sequence,
create 2-4 additional scenes that add depth, citations, and data-driven visuals.

## OUTPUT
Respond with ONLY a JSON array of scene objects. No markdown, no explanation.

## SCENE TYPES TO USE
Focus on data-rich and citation-heavy types:
- big_number: For impressive statistics
- research_highlight: For citable quotes/excerpts
- chart: For data trends
- editorial_callout: For key takeaways
- image_frame: For visual evidence (use imageUrl from research images or "GENERATE:description")

## CINEMATIC SCENE TYPES (at least 1 of your enrichment scenes should be cinematic)
- cinematic_point_cloud: For dramatic 3D visuals with depth (set depthUrl to "AUTO")
- cinematic_depth_mesh: For 3D depth-displaced mesh with camera drift (set depthUrl to "AUTO")
- cinematic_composition: Full cinematic hero — most dramatic scene type (set depthUrl to "AUTO")
- cinematic_flat: For clean image-based scenes with animations
- cinematic_dither: For stylized FM-radio-inspired visuals (lineCount should be 120-160)

## RULES
1. Each scene's transcript.fullText MUST start with [[SCENE:N]] marker
2. Cite sources naturally in narration ("According to...", "Research from... shows...")
3. Use real data from the research — do not fabricate
4. Make these scenes complement the initial sequence, not repeat it
5. Duration: 8-15 seconds per scene
6. Use varied, cohesive accent colors
7. At least 1 of your 2-4 enrichment scenes should be cinematic for visual variety`;

function buildEnrichmentPrompt(
  startSceneNum: number,
  query: string,
  facts: string[],
  stats: string[],
  citations: Array<{ text: string; source: string; url: string }>,
  findings: string[],
  images: Array<{ url: string; title: string }>,
  analysis: string,
): string {
  const sections: string[] = [];

  sections.push(`Topic: "${query}"`);
  sections.push(`Scene numbering starts at [[SCENE:${startSceneNum}]]`);

  if (facts.length > 0) {
    sections.push("## Unused Facts\n" + facts.map((f) => `- ${f}`).join("\n"));
  }
  if (stats.length > 0) {
    sections.push(
      "## Unused Statistics\n" + stats.map((s) => `- ${s}`).join("\n"),
    );
  }
  if (citations.length > 0) {
    sections.push(
      "## Unused Citations\n" +
        citations
          .map((c) => `- "${c.text}" — ${c.source} (${c.url})`)
          .join("\n"),
    );
  }
  if (findings.length > 0) {
    sections.push(
      "## Key Findings\n" + findings.map((f) => `- ${f}`).join("\n"),
    );
  }
  if (images.length > 0) {
    sections.push(
      "## Available Images\n" +
        images
          .slice(0, 4)
          .map((img) => `- ${img.url} — "${img.title}"`)
          .join("\n"),
    );
  }
  if (analysis) {
    sections.push("## Analysis Summary\n" + analysis.slice(0, 500));
  }

  sections.push(
    "\nCreate 2-4 enrichment scenes using this data. Output ONLY the JSON array.",
  );

  return sections.join("\n\n");
}

// ---------------------------------------------------------------------------
// Parse
// ---------------------------------------------------------------------------

function parseEnrichmentResult(text: string): EnrichedScene[] {
  // Strip markdown fences
  const cleaned = text
    .replace(/^```(?:json)?\s*\n?/gm, "")
    .replace(/\n?```\s*$/gm, "")
    .trim();

  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (s: any) => s && typeof s === "object" && s.type && s.id,
      );
    }
  } catch {
    // Try brace-matching extraction
    const scenes: EnrichedScene[] = [];
    let depth = 0;
    let inStr = false;
    let esc = false;
    let start = -1;

    for (let i = 0; i < cleaned.length; i++) {
      const c = cleaned[i];
      if (esc) {
        esc = false;
        continue;
      }
      if (c === "\\" && inStr) {
        esc = true;
        continue;
      }
      if (c === '"') {
        inStr = !inStr;
        continue;
      }
      if (inStr) continue;

      if (c === "{") {
        if (depth === 0) start = i;
        depth++;
      } else if (c === "}") {
        depth--;
        if (depth === 0 && start >= 0) {
          try {
            const obj = JSON.parse(cleaned.substring(start, i + 1));
            if (obj.type && obj.id) scenes.push(obj);
          } catch {
            /* skip */
          }
          start = -1;
        }
      }
    }

    return scenes;
  }

  return [];
}
