import {
  FAL_MODELS,
  type InputField,
  type InputFieldType,
} from "@/lib/fal/model-definitions";

export type StudioModelFieldType =
  | "text"
  | "textarea"
  | "number"
  | "select"
  | "boolean"
  | "media"
  | "segmented"
  | "slider"
  | "switch";

export interface StudioModelField {
  name: string;
  type: StudioModelFieldType;
  required?: boolean;
  placeholder?: string;
  label?: string;
  description?: string;
  min?: number;
  max?: number;
  step?: number;
  default?: unknown;
  options?: Array<string | { value: string; label: string; description?: string }>;
  mediaType?: "image" | "video" | "audio";
  unit?: string;
  marks?: Record<string, string>;
  rows?: number;
  disabled?: boolean;
}

export interface StudioModel {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  type: "image" | "video" | "text" | "audio";
  badge?: "NEW" | "BEST" | "FAST" | "PRO";
  disabled?: boolean;
  fields?: StudioModelField[];
}

export type StudioModelGroups = Record<string, StudioModel[]>;

const TEXT_MODEL_FIELDS: StudioModelField[] = [
  { name: "temperature", type: "slider", label: "Temperature", min: 0, max: 1.2, step: 0.05, default: 0.7 },
  { name: "maxTokens", type: "number", label: "Max Tokens", min: 512, max: 16384, step: 128, default: 8192 },
];

const TEXT_MODELS: StudioModel[] = [
  {
    id: "anthropic:claude-sonnet-4-20250514",
    name: "Claude Sonnet 4",
    description: "Balanced planning and writing quality",
    type: "text",
    badge: "BEST",
    fields: TEXT_MODEL_FIELDS,
  },
  {
    id: "anthropic:claude-opus-4-6",
    name: "Claude Opus 4.6",
    description: "Most capable reasoning and creative writing",
    type: "text",
    badge: "PRO",
    fields: TEXT_MODEL_FIELDS,
  },
  {
    id: "anthropic:claude-haiku-4-5",
    name: "Claude Haiku 4.5",
    description: "Fastest and most affordable Anthropic model",
    type: "text",
    badge: "FAST",
    fields: TEXT_MODEL_FIELDS,
  },
  {
    id: "openai:gpt-5.2",
    name: "GPT-5.2",
    description: "Latest OpenAI model with advanced reasoning",
    type: "text",
    badge: "NEW",
    fields: TEXT_MODEL_FIELDS,
  },
  {
    id: "openai:gpt-5-mini",
    name: "GPT-5 Mini",
    description: "Fast and affordable OpenAI model",
    type: "text",
    badge: "FAST",
    fields: TEXT_MODEL_FIELDS,
  },
  {
    id: "openai:gpt-4o",
    name: "GPT-4o",
    description: "High reliability for structured outputs",
    type: "text",
    fields: TEXT_MODEL_FIELDS,
  },
  {
    id: "google:gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    description: "Highest quality Google model for complex tasks",
    type: "text",
    badge: "NEW",
    fields: TEXT_MODEL_FIELDS,
  },
  {
    id: "google:gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    description: "Fast Google model with great long-context support",
    type: "text",
    badge: "FAST",
    fields: TEXT_MODEL_FIELDS,
  },
  {
    id: "google:gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    description: "Long-context storyboarding and planning",
    type: "text",
    fields: TEXT_MODEL_FIELDS,
  },
  {
    id: "xai:grok-4",
    name: "Grok 4",
    description: "Creative reasoning and unconventional perspectives",
    type: "text",
    badge: "NEW",
    fields: TEXT_MODEL_FIELDS,
  },
  {
    id: "deepseek:deepseek-chat",
    name: "DeepSeek Chat",
    description: "Cost-effective model with strong reasoning",
    type: "text",
    fields: TEXT_MODEL_FIELDS,
  },
  {
    id: "mistral:mistral-large-latest",
    name: "Mistral Large",
    description: "European alternative with multilingual strength",
    type: "text",
    fields: TEXT_MODEL_FIELDS,
  },
  {
    id: "groq:llama-3.3-70b-versatile",
    name: "Groq Llama 3.3 70B",
    description: "Ultra-fast inference on open-source Llama",
    type: "text",
    badge: "FAST",
    fields: TEXT_MODEL_FIELDS,
  },
];

function mapInputFieldType(type: InputFieldType): StudioModelFieldType {
  switch (type) {
    case "image_upload":
      return "media";
    case "boolean":
      return "switch";
    default:
      return type;
  }
}

function mapInputField(field: InputField): StudioModelField {
  return {
    name: field.name,
    type: mapInputFieldType(field.type),
    required: field.required,
    placeholder: field.placeholder,
    label: field.label,
    description: field.description,
    min: field.min,
    max: field.max,
    step: field.step,
    default: field.default,
    options: field.options?.map((option) => ({
      value: String(option.value),
      label: option.label,
    })),
    mediaType: field.type === "image_upload" ? "image" : undefined,
  };
}

function inferBadge(recommended: boolean | undefined, speed: "fast" | "medium" | "slow"): StudioModel["badge"] {
  if (recommended) return "BEST";
  if (speed === "fast") return "FAST";
  return undefined;
}

function toStudioModel(modelId: string): StudioModel {
  const definition = FAL_MODELS[modelId];
  const categoryToType: Record<string, StudioModel["type"]> = {
    utility: "image",
    avatar: "video",
    training: "image",
  };
  const type = categoryToType[definition.category] ?? definition.category as StudioModel["type"];
  return {
    id: modelId,
    name: definition.name,
    description: definition.description,
    type,
    badge: inferBadge(definition.recommended, definition.speed.relative),
    fields: definition.inputs.map(mapInputField),
  };
}

function includesAny(value: string, patterns: string[]): boolean {
  const v = value.toLowerCase();
  return patterns.some((pattern) => v.includes(pattern));
}

function getGroupName(modelId: string): string {
  const definition = FAL_MODELS[modelId];
  const endpoint = definition.endpoint.toLowerCase();
  const capabilities = definition.capabilities.map((capability) => capability.toLowerCase());
  const hasCapability = (needle: string) =>
    capabilities.some((capability) => capability.includes(needle));

  if (definition.category === "training") return "Training";

  if (definition.category === "avatar") return "Avatar & Animation";

  if (definition.category === "audio") return "Audio Generation";

  if (definition.category === "video") {
    if (hasCapability("image-to-video") || includesAny(endpoint, ["image-to-video", "/i2v"])) {
      return "Image to Video";
    }
    return "Text to Video";
  }

  if (definition.category === "utility") return "Image Enhancement";

  if (definition.category === "image") {
    if (hasCapability("face-swap") || hasCapability("style-transfer")) {
      return "Face & Style Transfer";
    }
    if (hasCapability("image-to-image") || hasCapability("inpainting") || hasCapability("editing")) {
      return "Image to Image";
    }
    if (includesAny(endpoint, ["upscale", "remove-background", "depth", "seg", "inpaint", "outpaint"])) {
      return "Image Enhancement";
    }
    return "Text to Image";
  }

  return "Text to Image";
}

const GROUP_ORDER = [
  "Text Generation",
  "Text to Image",
  "Image to Image",
  "Face & Style Transfer",
  "Text to Video",
  "Image to Video",
  "Avatar & Animation",
  "Image Enhancement",
  "Audio Generation",
  "Training",
] as const;

export function getStudioModelsGrouped(): StudioModelGroups {
  const grouped: StudioModelGroups = {
    "Text Generation": [...TEXT_MODELS],
  };

  for (const key of Object.keys(FAL_MODELS)) {
    const definition = FAL_MODELS[key];
    if (definition.category === "utility" && definition.outputs.type !== "image") {
      continue;
    }
    if (definition.category === "training" && definition.outputs.type === "json") {
      // Training models output JSON (LoRA weights), still show them
    }

    const groupName = getGroupName(key);
    if (!grouped[groupName]) {
      grouped[groupName] = [];
    }
    grouped[groupName].push(toStudioModel(key));
  }

  for (const groupName of Object.keys(grouped)) {
    grouped[groupName].sort((a, b) => {
      if (a.badge === "BEST" && b.badge !== "BEST") return -1;
      if (b.badge === "BEST" && a.badge !== "BEST") return 1;
      if (a.badge === "FAST" && b.badge !== "FAST") return -1;
      if (b.badge === "FAST" && a.badge !== "FAST") return 1;
      return a.name.localeCompare(b.name);
    });
  }

  const ordered: StudioModelGroups = {};
  for (const groupName of GROUP_ORDER) {
    if (grouped[groupName]?.length) {
      ordered[groupName] = grouped[groupName];
    }
  }
  for (const groupName of Object.keys(grouped)) {
    if (!ordered[groupName] && grouped[groupName]?.length) {
      ordered[groupName] = grouped[groupName];
    }
  }

  return ordered;
}
