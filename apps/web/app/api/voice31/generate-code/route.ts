import { NextRequest, NextResponse } from 'next/server';
import { streamText, generateText } from 'ai';
import { gateway } from '@/lib/ai/vercel-gateway';

export const runtime = 'nodejs';
export const maxDuration = 120;

// =============================================================================
// TYPES
// =============================================================================

export interface CodeGenerationMeta {
  source: 'speech.fm';
  sourceType: 'voice31' | 'demo' | 'api';
  sessionId?: string;
  model: string;
  modelUsed: string; // Actual model after fallback
  prompt: string;
  componentName: string;
  codeLength: number;
  language: 'tsx';
  stream: boolean;
  durationMs: number;
  timestamp: string;
  tags: string[];
}

export interface CodeGenerationResponse {
  success: boolean;
  code: string;
  componentName: string;
  description?: string;
  meta?: CodeGenerationMeta;
  error?: string;
}

// Model list: fastest first, fallback to fast alternatives.
// Code generation is time-critical (ElevenLabs tool timeout ~30s) — speed is everything.
const MODELS = [
  'google/gemini-2.5-flash',     // Primary — fastest, good quality code gen
  'openai/gpt-4o-mini',          // Fallback — also fast
];

const CODE_GEN_SYSTEM_PROMPT = `You are a LEGENDARY visual code generator. You create STUNNING, DYNAMIC React components that push creative boundaries.

## YOUR CREATIVE POWERS ARE UNLIMITED
You can generate ANY visual:
- SVG animations (logos, icons, abstract art, data viz, anything)
- Canvas-based graphics (particles, fractals, games, simulations)
- 3D wireframes and isometric views (using Canvas 2D with math)
- Animated patterns (geometric, organic, trippy, minimal)
- Typography art (kinetic text, word clouds, ASCII art)
- Data visualizations (charts, graphs, network diagrams)
- Image layouts (photo grids, collages, galleries with CSS)
- UI mockups (app screens, dashboards, landing pages)
- Flyers/posters (event announcements, promotional material)
- Interactive experiences (mouse-reactive, scroll-based)
- Generative art (noise, flow fields, L-systems)
- Retro effects (CRT, glitch, VHS, pixel art)

## THEME AWARENESS
- Default background is DARK (#000 or near-black)
- Use phosphor-style accent colors: amber (#ffaa00), green (#00ff88), red (#ff4444), blue (#4488ff)
- Glow effects work great: text-shadow, box-shadow with color glow
- CRT/retro aesthetic is preferred — scanlines, vignette, pixel fonts
- High contrast is key — bright elements on dark backgrounds

## CRITICAL RULES
1. Output ONLY the component code - no markdown, no explanations
2. Component MUST be named "GeneratedComponent" and exported as default
3. Use ONLY React hooks: useState, useEffect, useRef, useCallback, useMemo
4. NO external imports except React (already provided in sandbox)
5. Use inline styles or CSS-in-JS (no external CSS files)
6. Make it VISUALLY STUNNING - push the boundaries
7. Add smooth animations with requestAnimationFrame for canvas
8. Use CSS animations/transitions for DOM elements
9. Make colors vibrant, animations smooth, design impressive

## CANVAS PATTERN (for complex graphics):
\`\`\`tsx
const GeneratedComponent: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const animate = () => {
      time += 0.016;
      ctx.fillStyle = 'rgba(0,0,0,0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // YOUR AMAZING ANIMATION HERE
      animationId = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animationId);
  }, []);

  return <canvas ref={canvasRef} width={800} height={600} style={{width:'100%',height:'100%'}} />;
};
\`\`\`

## SVG PATTERN (for vector graphics):
\`\`\`tsx
const GeneratedComponent: React.FC = () => {
  const [time, setTime] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTime(t => t + 0.05), 16);
    return () => clearInterval(interval);
  }, []);

  return (
    <svg viewBox="0 0 400 400" style={{width:'100%',height:'100%',background:'#000'}}>
      {/* YOUR AMAZING SVG HERE */}
    </svg>
  );
};
\`\`\`

## LAYOUT PATTERN (for UI/compositions):
\`\`\`tsx
const GeneratedComponent: React.FC = () => {
  return (
    <div style={{width:'100%',height:'100%',background:'linear-gradient(...)',display:'flex',...}}>
      {/* YOUR AMAZING LAYOUT HERE */}
    </div>
  );
};
\`\`\`

BE CREATIVE. BE BOLD. MAKE IT AMAZING.`;

/** Extract clean code from LLM response — strips markdown fences and import statements */
function extractCode(raw: string): string {
  let code = raw;
  const codeBlockMatch = code.match(/```(?:tsx?|jsx?|typescript|javascript)?\n([\s\S]*?)```/);
  if (codeBlockMatch) {
    code = codeBlockMatch[1];
  }
  // Strip import statements (sandbox provides React globals)
  code = code.replace(/^import\s+.*?;\s*$/gm, '');
  return code.trim();
}

/** Auto-tag prompts by category for grouping/filtering */
function autoTagPrompt(prompt: string): string[] {
  const tags: string[] = ['speech.fm', 'code-gen'];
  const lower = prompt.toLowerCase();

  const categories: [string, RegExp][] = [
    ['canvas', /canvas|particle|fractal|simulation|physics|flow.?field/],
    ['svg', /svg|vector|icon|logo|shape|morph/],
    ['3d', /3d|isometric|wireframe|rotat|cube|sphere|landscape/],
    ['chart', /chart|graph|viz|data|stat|diagram|bar|pie|line.?chart/],
    ['ui', /dashboard|mockup|landing|app.?screen|widget|form|card|layout/],
    ['poster', /flyer|poster|announce|promo|album|cover|banner/],
    ['pattern', /pattern|geometric|organic|trippy|minimal|tile|tessellat/],
    ['typography', /text|word.?cloud|ascii|kinetic|font|typo/],
    ['generative', /generative|noise|perlin|cellular|automata|l.?system/],
    ['retro', /retro|crt|glitch|vhs|pixel|scanline|synthwave|cyberpunk/],
    ['interactive', /interactive|mouse|click|hover|drag|game/],
    ['animation', /animat|motion|transition|morph|pulse|wave/],
  ];

  for (const [tag, regex] of categories) {
    if (regex.test(lower)) tags.push(tag);
  }

  return tags;
}

/**
 * Generate React/TSX code using fast inference via Vercel AI Gateway.
 * Supports both streaming (SSE) and non-streaming (JSON) responses.
 *
 * All generations are tagged with speech.fm metadata for grouping and filtering.
 */
export async function POST(request: NextRequest) {
  try {
    const {
      prompt,
      stream = false,
      sessionId,
      sourceType = 'api',
      tier,
    } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const tags = autoTagPrompt(prompt);

    // Single fast model list — tier param accepted but no longer changes model selection
    const modelList = MODELS;
    const tierLabel = tier || 'default';

    console.log(`[Voice31 Code Gen] Generating code [${tierLabel}] for:`, prompt, '| stream:', stream, '| tags:', tags);

    if (stream) {
      const response = await generateStreaming(prompt, modelList);

      const headers = new Headers(response.headers);
      headers.set('X-SpeechFM-Source', 'speech.fm');
      headers.set('X-SpeechFM-Tags', JSON.stringify(tags));
      headers.set('X-SpeechFM-Session', sessionId || '');
      headers.set('X-SpeechFM-SourceType', sourceType);
      headers.set('X-SpeechFM-Timestamp', new Date().toISOString());
      headers.set('X-SpeechFM-Tier', tierLabel);

      return new Response(response.body, {
        status: response.status,
        headers,
      });
    } else {
      return await generateNonStreaming(prompt, { sessionId, sourceType, tags, tier: tierLabel });
    }
  } catch (error) {
    console.error('[Voice31 Code Gen] Error:', error);
    return NextResponse.json(
      {
        error: 'Code generation failed',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

async function generateStreaming(prompt: string, modelList: string[] = MODELS): Promise<Response> {
  for (const modelId of modelList) {
    try {
      const result = streamText({
        model: gateway(modelId as any),
        system: CODE_GEN_SYSTEM_PROMPT,
        prompt,
        temperature: 0.7,
        maxTokens: 4096,
      });

      return (await result).toTextStreamResponse();
    } catch (error) {
      console.warn(`[Voice31 Code Gen] ${modelId} failed, trying fallback:`, error);
      continue;
    }
  }

  return NextResponse.json({ error: 'All models failed' }, { status: 503 });
}

async function generateNonStreaming(
  prompt: string,
  context: { sessionId?: string; sourceType?: string; tags: string[]; tier?: string } = { tags: [] },
): Promise<NextResponse> {
  const startTime = Date.now();
  const modelList = MODELS;

  for (const modelId of modelList) {
    try {
      const result = await generateText({
        model: gateway(modelId as any),
        system: CODE_GEN_SYSTEM_PROMPT,
        prompt,
        temperature: 0.7,
        maxTokens: 4096,
      });

      let code = result.text || '';
      code = extractCode(code);

      if (!code) continue;

      const componentNameMatch = code.match(/(?:const|function)\s+(\w+)(?:\s*:|:\s*React\.FC|\s*=)/);
      const componentName = componentNameMatch?.[1] || 'GeneratedComponent';

      // Ensure the iframe can always find GeneratedComponent regardless of what the LLM named it
      if (componentName !== 'GeneratedComponent') {
        code += `\nconst GeneratedComponent = ${componentName};`;
      }

      const durationMs = Date.now() - startTime;

      console.log(`[Voice31 Code Gen] Generated component [${context.tier || 'default'}]:`, componentName, `(${code.length} chars) via ${modelId} in ${durationMs}ms`);

      const meta: CodeGenerationMeta = {
        source: 'speech.fm',
        sourceType: (context.sourceType || 'api') as CodeGenerationMeta['sourceType'],
        sessionId: context.sessionId,
        model: modelId,
        modelUsed: modelId,
        prompt,
        componentName,
        codeLength: code.length,
        language: 'tsx',
        stream: false,
        durationMs,
        timestamp: new Date().toISOString(),
        tags: [...context.tags, context.tier ? `tier:${context.tier}` : 'tier:default'],
      };

      return NextResponse.json({
        success: true,
        code,
        componentName,
        description: prompt,
        meta,
      } as CodeGenerationResponse);
    } catch (error) {
      console.warn(`[Voice31 Code Gen] ${modelId} failed, trying fallback:`, error);
      continue;
    }
  }

  return NextResponse.json(
    { error: 'All models failed', success: false },
    { status: 503 }
  );
}
