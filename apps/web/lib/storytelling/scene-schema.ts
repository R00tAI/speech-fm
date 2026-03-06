/**
 * Zod schema for scene validation.
 * Used to validate LLM-generated scene objects.
 */

import { z } from "zod";

export const sceneTypeSchema = z.enum([
  "kinetic_title",
  "big_number",
  "split",
  "h_bars",
  "donut",
  "editorial_callout",
  "ticker_facts",
  "card_stack",
  "chart",
  "profile",
  "group",
  "infographic_map",
  "svg_visual",
  "quote",
  "image_frame",
  "research_highlight",
  "kinetic_text",
  // Cinematic scene types
  "cinematic_point_cloud",
  "cinematic_depth_mesh",
  "cinematic_layered",
  "cinematic_composition",
  "cinematic_dither",
  "cinematic_flat",
]);

export const transitionSchema = z
  .enum([
    "fade",
    "wipe_left",
    "wipe_right",
    "iris",
    "dissolve",
    "cut",
    "crt_static",
    "scanline_wipe",
    "ink_bleed",
    "zoom_blur",
    "glitch",
  ])
  .optional();

// Scene data schemas per type
const kineticTitleDataSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  style: z.enum(["bold", "elegant", "impact", "editorial"]).optional(),
});

const bigNumberDataSchema = z.object({
  value: z.number(),
  suffix: z.string().optional(),
  prefix: z.string().optional(),
  label: z.string(),
  sublabel: z.string().optional(),
  trend: z.enum(["up", "down", "neutral"]).optional(),
});

const splitDataSchema = z.object({
  left: z.object({
    label: z.string(),
    value: z.string(),
    icon: z.string().optional(),
  }),
  right: z.object({
    label: z.string(),
    value: z.string(),
    icon: z.string().optional(),
  }),
  versus: z.boolean().optional(),
});

const barItemSchema = z.object({
  label: z.string(),
  value: z.number(),
  maxValue: z.number().optional(),
  color: z.string().optional(),
});

const hBarsDataSchema = z.object({
  title: z.string().optional(),
  bars: z.array(barItemSchema).min(1),
});

const donutSegmentSchema = z.object({
  label: z.string(),
  value: z.number(),
  color: z.string().optional(),
});

const donutDataSchema = z.object({
  title: z.string().optional(),
  segments: z.array(donutSegmentSchema).min(1),
  centerLabel: z.string().optional(),
  centerValue: z.string().optional(),
});

const editorialCalloutDataSchema = z.object({
  text: z.string(),
  attribution: z.string().optional(),
  style: z.enum(["pull", "highlight", "sidebar"]).optional(),
});

const tickerFactsDataSchema = z.object({
  facts: z.array(z.object({ label: z.string(), value: z.string() })).min(1),
  speed: z.enum(["slow", "normal", "fast"]).optional(),
});

const cardStackDataSchema = z.object({
  cards: z
    .array(
      z.object({
        title: z.string(),
        body: z.string(),
        icon: z.string().optional(),
      }),
    )
    .min(1),
});

const chartDataSchema = z.object({
  type: z.enum(["line", "area", "bar"]),
  title: z.string().optional(),
  labels: z.array(z.string()),
  datasets: z
    .array(
      z.object({
        label: z.string(),
        data: z.array(z.number()),
        color: z.string().optional(),
      }),
    )
    .min(1),
});

const profileDataSchema = z.object({
  name: z.string(),
  title: z.string().optional(),
  avatar: z.string().optional(),
  stats: z.array(z.object({ label: z.string(), value: z.string() })).optional(),
  bio: z.string().optional(),
});

const groupDataSchema = z.object({
  title: z.string().optional(),
  people: z
    .array(
      z.object({
        name: z.string(),
        role: z.string().optional(),
        avatar: z.string().optional(),
      }),
    )
    .min(1),
});

const infographicMapDataSchema = z.object({
  title: z.string().optional(),
  regions: z
    .array(
      z.object({
        name: z.string(),
        value: z.union([z.string(), z.number()]),
        highlighted: z.boolean().optional(),
      }),
    )
    .min(1),
  type: z.enum(["world", "us", "abstract"]).optional(),
});

const svgVisualDataSchema = z.object({
  description: z.string(),
  elements: z.array(
    z.object({
      type: z.enum(["circle", "rect", "path", "text", "line"]),
      props: z.record(z.union([z.string(), z.number()])),
      animate: z.record(z.union([z.string(), z.number()])).optional(),
    }),
  ),
});

const quoteDataSchema = z.object({
  text: z.string(),
  author: z.string().optional(),
  source: z.string().optional(),
  style: z.enum(["minimal", "decorative", "editorial"]).optional(),
});

const imageFrameDataSchema = z.object({
  imageUrl: z.string(),
  caption: z.string().optional(),
  source: z.string().optional(),
  frameStyle: z.enum(["editorial", "polaroid", "cinema", "minimal", "float"]),
  enableParallax: z.boolean().optional(),
  enableDepthMap: z.boolean().optional(),
});

const researchHighlightDataSchema = z.object({
  excerpt: z.string(),
  source: z.string(),
  sourceUrl: z.string().optional(),
  highlightWords: z.array(z.string()).optional(),
  style: z.enum(["pullquote", "card", "sidebar", "newspaper"]),
});

const kineticTextDataSchema = z.object({
  text: z.string(),
  animation: z.enum([
    "typewriter",
    "wordPop",
    "waveText",
    "splitReveal",
    "glitchText",
  ]),
  emphasis: z.array(z.string()).optional(),
  size: z.enum(["hero", "heading", "body"]),
});

// Cinematic scene data schemas
const cinematicPointCloudDataSchema = z.object({
  imageUrl: z.string(),
  depthUrl: z.string(),
  headline: z.string().optional(),
  caption: z.string().optional(),
  preset: z.string().optional(),
  shader: z
    .enum(["default", "softGlow", "breathing", "toon", "painterly", "adaptive"])
    .optional(),
  stat: z.string().optional(),
  source: z.string().optional(),
});

const cinematicDepthMeshDataSchema = z.object({
  imageUrl: z.string(),
  depthUrl: z.string(),
  headline: z.string().optional(),
  caption: z.string().optional(),
  stat: z.string().optional(),
  source: z.string().optional(),
});

const cinematicLayeredDataSchema = z.object({
  imageUrl: z.string(),
  layers: z
    .array(z.object({ url: z.string(), depth: z.number().optional() }))
    .optional(),
  headline: z.string().optional(),
  caption: z.string().optional(),
});

const cinematicCompositionDataSchema = z.object({
  imageUrl: z.string(),
  depthUrl: z.string(),
  layers: z
    .array(z.object({ url: z.string(), depth: z.number().optional() }))
    .optional(),
  preset: z.string(),
  shader: z
    .enum(["default", "softGlow", "breathing", "toon", "painterly", "adaptive"])
    .optional(),
  headline: z.string(),
  stat: z.string().optional(),
  source: z.string().optional(),
});

const cinematicDitherDataSchema = z.object({
  imageUrl: z.string(),
  mode: z.enum(["verticalFM", "horizontalFM", "scatter", "noise"]).optional(),
  lineCount: z.number().optional(),
  amplitude: z.number().optional(),
  frequency: z.number().optional(),
  glow: z.number().optional(),
  color: z.string().optional(),
  headline: z.string().optional(),
  caption: z.string().optional(),
});

const cinematicFlatDataSchema = z.object({
  imageUrl: z.string(),
  animation: z
    .enum(["fade-in", "zoom-in", "slide-up", "ken-burns", "parallax-drift"])
    .optional(),
  fit: z.enum(["cover", "contain", "fill"]).optional(),
  headline: z.string().optional(),
  caption: z.string().optional(),
  source: z.string().optional(),
});

// Discriminated union for scene data based on type
const sceneDataSchemaMap: Record<string, z.ZodTypeAny> = {
  kinetic_title: kineticTitleDataSchema,
  big_number: bigNumberDataSchema,
  split: splitDataSchema,
  h_bars: hBarsDataSchema,
  donut: donutDataSchema,
  editorial_callout: editorialCalloutDataSchema,
  ticker_facts: tickerFactsDataSchema,
  card_stack: cardStackDataSchema,
  chart: chartDataSchema,
  profile: profileDataSchema,
  group: groupDataSchema,
  infographic_map: infographicMapDataSchema,
  svg_visual: svgVisualDataSchema,
  quote: quoteDataSchema,
  image_frame: imageFrameDataSchema,
  research_highlight: researchHighlightDataSchema,
  kinetic_text: kineticTextDataSchema,
  // Cinematic scenes
  cinematic_point_cloud: cinematicPointCloudDataSchema,
  cinematic_depth_mesh: cinematicDepthMeshDataSchema,
  cinematic_layered: cinematicLayeredDataSchema,
  cinematic_composition: cinematicCompositionDataSchema,
  cinematic_dither: cinematicDitherDataSchema,
  cinematic_flat: cinematicFlatDataSchema,
};

export const sceneSchema = z.object({
  id: z.string(),
  type: sceneTypeSchema,
  duration: z.number().min(2).max(30),
  caption: z.string(),
  transcript: z.object({
    fullText: z.string(),
    words: z
      .array(
        z.object({
          word: z.string(),
          start: z.number(),
          end: z.number(),
        }),
      )
      .default([]),
  }),
  data: z.any(), // Validated per-type below
  accent: z.string(),
  bg: z.string().optional(),
  bgGradient: z.string().optional(),
  transition: transitionSchema,
});

/** Validate a scene object, with per-type data validation */
export function validateScene(raw: unknown): {
  success: boolean;
  scene?: z.infer<typeof sceneSchema>;
  error?: string;
} {
  const baseResult = sceneSchema.safeParse(raw);
  if (!baseResult.success) {
    return { success: false, error: baseResult.error.message };
  }

  const scene = baseResult.data;
  const dataSchema = sceneDataSchemaMap[scene.type];
  if (dataSchema) {
    const dataResult = dataSchema.safeParse(scene.data);
    if (!dataResult.success) {
      return {
        success: false,
        error: `Invalid data for scene type ${scene.type}: ${dataResult.error.message}`,
      };
    }
    scene.data = dataResult.data;
  }

  return { success: true, scene };
}
