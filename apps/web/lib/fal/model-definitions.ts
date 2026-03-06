/**
 * Universal FAL Model Definitions
 *
 * This file contains comprehensive model definitions for all FAL.ai models
 * with their schemas, parameters, pricing, and capabilities.
 */

export type FALModelCategory = 'image' | 'video' | 'audio' | 'utility' | 'avatar' | 'training';

export type InputFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'select'
  | 'boolean'
  | 'image_upload'
  | 'slider'
  | 'color';

export interface InputField {
  name: string;
  label: string;
  type: InputFieldType;
  required?: boolean;
  default?: any;
  min?: number;
  max?: number;
  step?: number;
  options?: Array<{ value: string | number; label: string }>;
  description?: string;
  placeholder?: string;
}

export interface FALModelDefinition {
  id: string;
  endpoint: string;
  name: string;
  category: FALModelCategory;
  description: string;
  pricing: {
    cost: number; // in USD
    unit: string; // e.g., "per image", "per second", "per minute"
  };
  capabilities: string[];
  speed: {
    estimate: string; // e.g., "~3 seconds", "~30 seconds"
    relative: 'fast' | 'medium' | 'slow';
  };
  quality: 'standard' | 'high' | 'premium';
  inputs: InputField[];
  outputs: {
    type: 'image' | 'video' | 'audio' | 'json';
    format?: string;
  };
  recommended?: boolean;
  tags?: string[];
}

/**
 * All available FAL models organized by category
 */
export const FAL_MODELS: Record<string, FALModelDefinition> = {
  // ==================== IMAGE GENERATION ====================
  'flux-schnell': {
    id: 'flux-schnell',
    endpoint: 'fal-ai/flux/schnell',
    name: 'Flux Schnell',
    category: 'image',
    description: 'Lightning-fast image generation with good quality',
    pricing: {
      cost: 0.003,
      unit: 'per image',
    },
    capabilities: ['text-to-image', 'fast-generation'],
    speed: {
      estimate: '~3 seconds',
      relative: 'fast',
    },
    quality: 'standard',
    recommended: true,
    tags: ['fast', 'affordable', 'versatile'],
    inputs: [
      {
        name: 'prompt',
        label: 'Prompt',
        type: 'textarea',
        required: true,
        placeholder: 'Describe the image you want to generate...',
        description: 'Detailed description of the image',
      },
      {
        name: 'image_size',
        label: 'Image Size',
        type: 'select',
        default: 'landscape_4_3',
        options: [
          { value: 'square_hd', label: 'Square HD (1024x1024)' },
          { value: 'square', label: 'Square (512x512)' },
          { value: 'portrait_4_3', label: 'Portrait 4:3' },
          { value: 'portrait_16_9', label: 'Portrait 16:9' },
          { value: 'landscape_4_3', label: 'Landscape 4:3' },
          { value: 'landscape_16_9', label: 'Landscape 16:9' },
        ],
      },
      {
        name: 'num_inference_steps',
        label: 'Inference Steps',
        type: 'slider',
        default: 4,
        min: 1,
        max: 8,
        step: 1,
        description: 'More steps = higher quality but slower',
      },
      {
        name: 'num_images',
        label: 'Number of Images',
        type: 'number',
        default: 1,
        min: 1,
        max: 4,
      },
      {
        name: 'enable_safety_checker',
        label: 'Enable Safety Checker',
        type: 'boolean',
        default: true,
      },
    ],
    outputs: {
      type: 'image',
      format: 'url',
    },
  },

  'flux-dev': {
    id: 'flux-dev',
    endpoint: 'fal-ai/flux/dev',
    name: 'Flux Dev',
    category: 'image',
    description: 'High-quality image generation with more detail',
    pricing: {
      cost: 0.025,
      unit: 'per image',
    },
    capabilities: ['text-to-image', 'high-quality'],
    speed: {
      estimate: '~12 seconds',
      relative: 'medium',
    },
    quality: 'high',
    tags: ['quality', 'detailed', 'professional'],
    inputs: [
      {
        name: 'prompt',
        label: 'Prompt',
        type: 'textarea',
        required: true,
        placeholder: 'Describe the image you want to generate...',
      },
      {
        name: 'image_size',
        label: 'Image Size',
        type: 'select',
        default: 'landscape_4_3',
        options: [
          { value: 'square_hd', label: 'Square HD (1024x1024)' },
          { value: 'square', label: 'Square (512x512)' },
          { value: 'portrait_4_3', label: 'Portrait 4:3' },
          { value: 'portrait_16_9', label: 'Portrait 16:9' },
          { value: 'landscape_4_3', label: 'Landscape 4:3' },
          { value: 'landscape_16_9', label: 'Landscape 16:9' },
        ],
      },
      {
        name: 'num_inference_steps',
        label: 'Inference Steps',
        type: 'slider',
        default: 28,
        min: 10,
        max: 50,
        step: 1,
      },
      {
        name: 'guidance_scale',
        label: 'Guidance Scale',
        type: 'slider',
        default: 3.5,
        min: 1,
        max: 20,
        step: 0.5,
        description: 'How closely to follow the prompt',
      },
      {
        name: 'num_images',
        label: 'Number of Images',
        type: 'number',
        default: 1,
        min: 1,
        max: 4,
      },
    ],
    outputs: {
      type: 'image',
      format: 'url',
    },
  },

  'flux-pro': {
    id: 'flux-pro',
    endpoint: 'fal-ai/flux-pro',
    name: 'Flux Pro',
    category: 'image',
    description: 'Professional-grade image generation with maximum quality',
    pricing: {
      cost: 0.05,
      unit: 'per image',
    },
    capabilities: ['text-to-image', 'premium-quality'],
    speed: {
      estimate: '~20 seconds',
      relative: 'medium',
    },
    quality: 'premium',
    tags: ['professional', 'premium', 'best-quality'],
    inputs: [
      {
        name: 'prompt',
        label: 'Prompt',
        type: 'textarea',
        required: true,
        placeholder: 'Describe the image you want to generate...',
      },
      {
        name: 'image_size',
        label: 'Image Size',
        type: 'select',
        default: 'landscape_4_3',
        options: [
          { value: 'square_hd', label: 'Square HD (1024x1024)' },
          { value: 'portrait_4_3', label: 'Portrait 4:3' },
          { value: 'portrait_16_9', label: 'Portrait 16:9' },
          { value: 'landscape_4_3', label: 'Landscape 4:3' },
          { value: 'landscape_16_9', label: 'Landscape 16:9' },
        ],
      },
    ],
    outputs: {
      type: 'image',
      format: 'url',
    },
  },

  'flux-realism': {
    id: 'flux-realism',
    endpoint: 'fal-ai/flux-realism',
    name: 'Flux Realism',
    category: 'image',
    description: 'Photorealistic image generation',
    pricing: {
      cost: 0.03,
      unit: 'per image',
    },
    capabilities: ['text-to-image', 'photorealistic'],
    speed: {
      estimate: '~15 seconds',
      relative: 'medium',
    },
    quality: 'high',
    tags: ['photorealistic', 'realistic', 'photography'],
    inputs: [
      {
        name: 'prompt',
        label: 'Prompt',
        type: 'textarea',
        required: true,
        placeholder: 'Describe the realistic image you want...',
      },
      {
        name: 'image_size',
        label: 'Image Size',
        type: 'select',
        default: 'landscape_4_3',
        options: [
          { value: 'square_hd', label: 'Square HD (1024x1024)' },
          { value: 'portrait_4_3', label: 'Portrait 4:3' },
          { value: 'landscape_4_3', label: 'Landscape 4:3' },
        ],
      },
    ],
    outputs: {
      type: 'image',
      format: 'url',
    },
  },

  'stable-diffusion-xl': {
    id: 'stable-diffusion-xl',
    endpoint: 'fal-ai/fast-sdxl',
    name: 'Stable Diffusion XL',
    category: 'image',
    description: 'Classic stable diffusion with XL quality',
    pricing: {
      cost: 0.01,
      unit: 'per image',
    },
    capabilities: ['text-to-image', 'versatile'],
    speed: {
      estimate: '~8 seconds',
      relative: 'fast',
    },
    quality: 'high',
    tags: ['classic', 'reliable', 'versatile'],
    inputs: [
      {
        name: 'prompt',
        label: 'Prompt',
        type: 'textarea',
        required: true,
        placeholder: 'Describe the image...',
      },
      {
        name: 'negative_prompt',
        label: 'Negative Prompt',
        type: 'textarea',
        placeholder: 'What to avoid in the image...',
      },
      {
        name: 'image_size',
        label: 'Image Size',
        type: 'select',
        default: 'square_hd',
        options: [
          { value: 'square_hd', label: 'Square HD (1024x1024)' },
          { value: 'square', label: 'Square (512x512)' },
          { value: 'landscape_4_3', label: 'Landscape 4:3' },
          { value: 'portrait_4_3', label: 'Portrait 4:3' },
        ],
      },
      {
        name: 'num_inference_steps',
        label: 'Inference Steps',
        type: 'slider',
        default: 25,
        min: 10,
        max: 50,
        step: 1,
      },
    ],
    outputs: {
      type: 'image',
      format: 'url',
    },
  },

  'seedream': {
    id: 'seedream',
    endpoint: 'fal-ai/bytedance/seedream/v4.5/text-to-image',
    name: 'Seedream v4.5',
    category: 'image',
    description: 'ByteDance\'s Seedream with excellent text rendering - up to 4MP',
    pricing: {
      cost: 0.04,
      unit: 'per image',
    },
    capabilities: ['text-to-image', 'text-rendering', '4-megapixel', 'fast'],
    speed: {
      estimate: '~2-3 seconds',
      relative: 'fast',
    },
    quality: 'premium',
    recommended: true,
    tags: ['seedream', 'bytedance', 'text-rendering', '4K', 'fast'],
    inputs: [
      {
        name: 'prompt',
        label: 'Prompt',
        type: 'textarea',
        required: true,
        placeholder: 'Describe the image you want to generate...',
      },
      {
        name: 'image_size',
        label: 'Image Size',
        type: 'select',
        default: 'landscape_16_9',
        options: [
          { value: 'square_hd', label: 'Square HD (2048x2048)' },
          { value: 'portrait_4_3', label: 'Portrait 4:3' },
          { value: 'portrait_16_9', label: 'Portrait 16:9' },
          { value: 'landscape_4_3', label: 'Landscape 4:3' },
          { value: 'landscape_16_9', label: 'Landscape 16:9' },
        ],
      },
      {
        name: 'num_images',
        label: 'Number of Images',
        type: 'number',
        default: 1,
        min: 1,
        max: 6,
      },
    ],
    outputs: {
      type: 'image',
      format: 'url',
    },
  },

  'gpt-image-1.5': {
    id: 'gpt-image-1.5',
    endpoint: 'fal-ai/gpt-image-1.5',
    name: 'GPT Image 1.5',
    category: 'image',
    description: 'OpenAI GPT Image 1.5 - High fidelity image generation',
    pricing: {
      cost: 0.08,
      unit: 'per image',
    },
    capabilities: ['text-to-image', 'high-quality', 'realistic'],
    speed: {
      estimate: '~10 seconds',
      relative: 'medium',
    },
    quality: 'premium',
    recommended: true,
    tags: ['gpt', 'openai', 'realistic', 'premium'],
    inputs: [
      {
        name: 'prompt',
        label: 'Prompt',
        type: 'textarea',
        required: true,
        placeholder: 'Describe the image you want to generate...',
      },
      {
        name: 'aspect_ratio',
        label: 'Aspect Ratio',
        type: 'select',
        default: '16:9',
        options: [
          { value: '1:1', label: '1:1 (Square)' },
          { value: '16:9', label: '16:9 (Landscape)' },
          { value: '9:16', label: '9:16 (Portrait)' },
          { value: '4:3', label: '4:3 (Standard)' },
          { value: '3:4', label: '3:4 (Portrait)' },
        ],
      },
    ],
    outputs: {
      type: 'image',
      format: 'url',
    },
  },

  'flux-2-turbo': {
    id: 'flux-2-turbo',
    endpoint: 'fal-ai/flux-2/turbo',
    name: 'Flux 2 Turbo',
    category: 'image',
    description: 'Fast Flux 2 variant - enhanced speed and quality',
    pricing: {
      cost: 0.02,
      unit: 'per image',
    },
    capabilities: ['text-to-image', 'fast-generation', 'high-quality'],
    speed: {
      estimate: '~5 seconds',
      relative: 'fast',
    },
    quality: 'high',
    recommended: true,
    tags: ['flux-2', 'turbo', 'fast', 'quality'],
    inputs: [
      {
        name: 'prompt',
        label: 'Prompt',
        type: 'textarea',
        required: true,
        placeholder: 'Describe the image you want to generate...',
      },
      {
        name: 'image_size',
        label: 'Image Size',
        type: 'select',
        default: 'landscape_4_3',
        options: [
          { value: 'square_hd', label: 'Square HD (1024x1024)' },
          { value: 'portrait_4_3', label: 'Portrait 4:3' },
          { value: 'portrait_16_9', label: 'Portrait 16:9' },
          { value: 'landscape_4_3', label: 'Landscape 4:3' },
          { value: 'landscape_16_9', label: 'Landscape 16:9' },
        ],
      },
      {
        name: 'num_images',
        label: 'Number of Images',
        type: 'number',
        default: 1,
        min: 1,
        max: 4,
      },
    ],
    outputs: {
      type: 'image',
      format: 'url',
    },
  },

  'nano-banana-pro': {
    id: 'nano-banana-pro',
    endpoint: 'fal-ai/nano-banana-pro',
    name: 'Nano Banana Pro',
    category: 'image',
    description: 'Google SOTA model with excellent text rendering and high quality output',
    pricing: {
      cost: 0.015,
      unit: 'per image',
    },
    capabilities: ['text-to-image', 'text-rendering', 'high-quality'],
    speed: {
      estimate: '~8 seconds',
      relative: 'medium',
    },
    quality: 'premium',
    recommended: true,
    tags: ['google', 'text-rendering', 'premium', 'sota'],
    inputs: [
      {
        name: 'prompt',
        label: 'Prompt',
        type: 'textarea',
        required: true,
        placeholder: 'Describe the image you want to generate...',
      },
      {
        name: 'image_size',
        label: 'Image Size',
        type: 'select',
        default: 'landscape_4_3',
        options: [
          { value: 'square_hd', label: 'Square HD (1024x1024)' },
          { value: 'portrait_4_3', label: 'Portrait 4:3' },
          { value: 'portrait_16_9', label: 'Portrait 16:9' },
          { value: 'landscape_4_3', label: 'Landscape 4:3' },
          { value: 'landscape_16_9', label: 'Landscape 16:9' },
        ],
      },
      {
        name: 'num_images',
        label: 'Number of Images',
        type: 'number',
        default: 1,
        min: 1,
        max: 4,
      },
    ],
    outputs: {
      type: 'image',
      format: 'url',
    },
  },

  'nano-banana-2': {
    id: 'nano-banana-2',
    endpoint: 'fal-ai/nano-banana-2',
    name: 'Nano Banana 2',
    category: 'image',
    description: 'Fast, high-quality image generation with versatile output',
    pricing: {
      cost: 0.08,
      unit: 'per image',
    },
    capabilities: ['text-to-image', 'fast-generation', 'high-quality'],
    speed: {
      estimate: '~3 seconds',
      relative: 'fast',
    },
    quality: 'high',
    recommended: true,
    tags: ['fast', 'high-quality', 'versatile'],
    inputs: [
      {
        name: 'prompt',
        label: 'Prompt',
        type: 'textarea',
        required: true,
        placeholder: 'Describe the image you want to generate...',
      },
      {
        name: 'aspect_ratio',
        label: 'Aspect Ratio',
        type: 'select',
        default: '1:1',
        options: [
          { value: '1:1', label: 'Square (1:1)' },
          { value: '16:9', label: 'Landscape (16:9)' },
          { value: '9:16', label: 'Portrait (9:16)' },
          { value: '4:3', label: 'Classic (4:3)' },
          { value: '3:4', label: 'Portrait Classic (3:4)' },
        ],
      },
      {
        name: 'resolution',
        label: 'Resolution',
        type: 'select',
        default: '1K',
        options: [
          { value: '512', label: '512px' },
          { value: '1K', label: '1K (1024px)' },
          { value: '2K', label: '2K (2048px)' },
        ],
      },
      {
        name: 'num_images',
        label: 'Number of Images',
        type: 'number',
        default: 1,
        min: 1,
        max: 4,
      },
    ],
    outputs: {
      type: 'image',
      format: 'url',
    },
  },

  'flux-2-flex': {
    id: 'flux-2-flex',
    endpoint: 'fal-ai/flux-2-flex',
    name: 'Flux 2 Flex',
    category: 'image',
    description: 'Flexible Flux 2 variant with multi-reference editing support',
    pricing: {
      cost: 0.03,
      unit: 'per image',
    },
    capabilities: ['text-to-image', 'multi-reference', 'editing'],
    speed: {
      estimate: '~8 seconds',
      relative: 'medium',
    },
    quality: 'high',
    tags: ['flux-2', 'flexible', 'editing'],
    inputs: [
      {
        name: 'prompt',
        label: 'Prompt',
        type: 'textarea',
        required: true,
        placeholder: 'Describe the image you want to generate...',
      },
      {
        name: 'image_size',
        label: 'Image Size',
        type: 'select',
        default: 'landscape_4_3',
        options: [
          { value: 'square_hd', label: 'Square HD (1024x1024)' },
          { value: 'portrait_4_3', label: 'Portrait 4:3' },
          { value: 'portrait_16_9', label: 'Portrait 16:9' },
          { value: 'landscape_4_3', label: 'Landscape 4:3' },
          { value: 'landscape_16_9', label: 'Landscape 16:9' },
        ],
      },
      {
        name: 'num_images',
        label: 'Number of Images',
        type: 'number',
        default: 1,
        min: 1,
        max: 4,
      },
    ],
    outputs: {
      type: 'image',
      format: 'url',
    },
  },

  'kling-v3-image': {
    id: 'kling-v3-image',
    endpoint: 'fal-ai/kling-image/v3/text-to-image',
    name: 'Kling V3 Image',
    category: 'image',
    description: 'Latest Kling image generation with improved quality and coherence',
    pricing: {
      cost: 0.04,
      unit: 'per image',
    },
    capabilities: ['text-to-image', 'high-quality'],
    speed: {
      estimate: '~10 seconds',
      relative: 'medium',
    },
    quality: 'high',
    tags: ['kling', 'v3', 'quality'],
    inputs: [
      {
        name: 'prompt',
        label: 'Prompt',
        type: 'textarea',
        required: true,
        placeholder: 'Describe the image...',
      },
      {
        name: 'aspect_ratio',
        label: 'Aspect Ratio',
        type: 'select',
        default: '16:9',
        options: [
          { value: '1:1', label: '1:1 (Square)' },
          { value: '16:9', label: '16:9 (Landscape)' },
          { value: '9:16', label: '9:16 (Portrait)' },
          { value: '4:3', label: '4:3 (Standard)' },
        ],
      },
    ],
    outputs: {
      type: 'image',
      format: 'url',
    },
  },

  'kling-omni3-image': {
    id: 'kling-omni3-image',
    endpoint: 'fal-ai/kling-image/o3/text-to-image',
    name: 'Kling Omni 3 Image',
    category: 'image',
    description: 'Kling Omni 3 with multi-shot storyboarding and native audio support',
    pricing: {
      cost: 0.05,
      unit: 'per image',
    },
    capabilities: ['text-to-image', 'premium-quality', 'multi-shot'],
    speed: {
      estimate: '~12 seconds',
      relative: 'medium',
    },
    quality: 'premium',
    tags: ['kling', 'omni', 'premium'],
    inputs: [
      {
        name: 'prompt',
        label: 'Prompt',
        type: 'textarea',
        required: true,
        placeholder: 'Describe the image...',
      },
      {
        name: 'aspect_ratio',
        label: 'Aspect Ratio',
        type: 'select',
        default: '16:9',
        options: [
          { value: '1:1', label: '1:1 (Square)' },
          { value: '16:9', label: '16:9 (Landscape)' },
          { value: '9:16', label: '9:16 (Portrait)' },
        ],
      },
    ],
    outputs: {
      type: 'image',
      format: 'url',
    },
  },

  'recraft-v3': {
    id: 'recraft-v3',
    endpoint: 'fal-ai/recraft/v3/text-to-image',
    name: 'Recraft V3',
    category: 'image',
    description: 'SOTA for typography, branding, and vector-style art generation',
    pricing: {
      cost: 0.05,
      unit: 'per image',
    },
    capabilities: ['text-to-image', 'typography', 'brand-style', 'vector-art'],
    speed: {
      estimate: '~10 seconds',
      relative: 'medium',
    },
    quality: 'premium',
    recommended: true,
    tags: ['typography', 'branding', 'vector', 'recraft'],
    inputs: [
      {
        name: 'prompt',
        label: 'Prompt',
        type: 'textarea',
        required: true,
        placeholder: 'Describe the image with text/typography...',
      },
      {
        name: 'image_size',
        label: 'Image Size',
        type: 'select',
        default: 'landscape_4_3',
        options: [
          { value: 'square_hd', label: 'Square HD (1024x1024)' },
          { value: 'portrait_4_3', label: 'Portrait 4:3' },
          { value: 'landscape_4_3', label: 'Landscape 4:3' },
          { value: 'landscape_16_9', label: 'Landscape 16:9' },
        ],
      },
    ],
    outputs: {
      type: 'image',
      format: 'url',
    },
  },

  'qwen-image': {
    id: 'qwen-image',
    endpoint: 'fal-ai/qwen-image',
    name: 'Qwen Image',
    category: 'image',
    description: 'Complex text rendering and detailed scene composition',
    pricing: {
      cost: 0.03,
      unit: 'per image',
    },
    capabilities: ['text-to-image', 'text-rendering', 'detailed'],
    speed: {
      estimate: '~10 seconds',
      relative: 'medium',
    },
    quality: 'high',
    tags: ['qwen', 'text-rendering', 'detailed'],
    inputs: [
      {
        name: 'prompt',
        label: 'Prompt',
        type: 'textarea',
        required: true,
        placeholder: 'Describe the image with text elements...',
      },
      {
        name: 'image_size',
        label: 'Image Size',
        type: 'select',
        default: 'landscape_4_3',
        options: [
          { value: 'square_hd', label: 'Square HD (1024x1024)' },
          { value: 'portrait_4_3', label: 'Portrait 4:3' },
          { value: 'landscape_4_3', label: 'Landscape 4:3' },
          { value: 'landscape_16_9', label: 'Landscape 16:9' },
        ],
      },
    ],
    outputs: {
      type: 'image',
      format: 'url',
    },
  },

  'ideogram-v3': {
    id: 'ideogram-v3',
    endpoint: 'fal-ai/ideogram/v3',
    name: 'Ideogram V3',
    category: 'image',
    description: 'Best-in-class typography and text-in-image generation',
    pricing: {
      cost: 0.05,
      unit: 'per image',
    },
    capabilities: ['text-to-image', 'typography', 'text-in-image'],
    speed: {
      estimate: '~10 seconds',
      relative: 'medium',
    },
    quality: 'premium',
    tags: ['ideogram', 'typography', 'text-in-image'],
    inputs: [
      {
        name: 'prompt',
        label: 'Prompt',
        type: 'textarea',
        required: true,
        placeholder: 'Describe the image with any text to render...',
      },
      {
        name: 'aspect_ratio',
        label: 'Aspect Ratio',
        type: 'select',
        default: '16:9',
        options: [
          { value: '1:1', label: '1:1 (Square)' },
          { value: '16:9', label: '16:9 (Landscape)' },
          { value: '9:16', label: '9:16 (Portrait)' },
          { value: '4:3', label: '4:3 (Standard)' },
        ],
      },
    ],
    outputs: {
      type: 'image',
      format: 'url',
    },
  },

  'imagen4': {
    id: 'imagen4',
    endpoint: 'fal-ai/imagen4/preview',
    name: 'Imagen 4',
    category: 'image',
    description: 'Google Imagen 4 - latest Google image generation model',
    pricing: {
      cost: 0.04,
      unit: 'per image',
    },
    capabilities: ['text-to-image', 'high-quality', 'google-powered'],
    speed: {
      estimate: '~10 seconds',
      relative: 'medium',
    },
    quality: 'premium',
    tags: ['google', 'imagen', 'premium'],
    inputs: [
      {
        name: 'prompt',
        label: 'Prompt',
        type: 'textarea',
        required: true,
        placeholder: 'Describe the image...',
      },
      {
        name: 'aspect_ratio',
        label: 'Aspect Ratio',
        type: 'select',
        default: '16:9',
        options: [
          { value: '1:1', label: '1:1 (Square)' },
          { value: '16:9', label: '16:9 (Landscape)' },
          { value: '9:16', label: '9:16 (Portrait)' },
          { value: '4:3', label: '4:3 (Standard)' },
        ],
      },
    ],
    outputs: {
      type: 'image',
      format: 'url',
    },
  },

  'gpt-image-1-mini': {
    id: 'gpt-image-1-mini',
    endpoint: 'fal-ai/gpt-image-1-mini',
    name: 'GPT Image 1 Mini',
    category: 'image',
    description: 'Fast, affordable OpenAI image generation',
    pricing: {
      cost: 0.02,
      unit: 'per image',
    },
    capabilities: ['text-to-image', 'fast-generation'],
    speed: {
      estimate: '~5 seconds',
      relative: 'fast',
    },
    quality: 'high',
    tags: ['openai', 'fast', 'affordable'],
    inputs: [
      {
        name: 'prompt',
        label: 'Prompt',
        type: 'textarea',
        required: true,
        placeholder: 'Describe the image...',
      },
      {
        name: 'aspect_ratio',
        label: 'Aspect Ratio',
        type: 'select',
        default: '16:9',
        options: [
          { value: '1:1', label: '1:1 (Square)' },
          { value: '16:9', label: '16:9 (Landscape)' },
          { value: '9:16', label: '9:16 (Portrait)' },
        ],
      },
    ],
    outputs: {
      type: 'image',
      format: 'url',
    },
  },

  // ==================== IMAGE-TO-IMAGE / EDITING ====================
  'nano-banana-img2img': {
    id: 'nano-banana-img2img',
    endpoint: 'fal-ai/nano-banana-pro/img2img',
    name: 'Nano Banana Pro Img2Img',
    category: 'image',
    description: 'High-fidelity image transformation and stylization',
    pricing: {
      cost: 0.018,
      unit: 'per image',
    },
    capabilities: ['image-to-image', 'stylization', 'high-fidelity'],
    speed: {
      estimate: '~8 seconds',
      relative: 'medium',
    },
    quality: 'high',
    tags: ['img2img', 'stylization', 'google'],
    inputs: [
      {
        name: 'prompt',
        label: 'Prompt',
        type: 'textarea',
        required: true,
        placeholder: 'Describe the transformation...',
      },
      {
        name: 'image_url',
        label: 'Source Image',
        type: 'image_upload',
        required: true,
        description: 'Image to transform',
      },
      {
        name: 'num_images',
        label: 'Number of Images',
        type: 'number',
        default: 1,
        min: 1,
        max: 4,
      },
    ],
    outputs: {
      type: 'image',
      format: 'url',
    },
  },

  'flux-kontext': {
    id: 'flux-kontext',
    endpoint: 'fal-ai/flux-kontext-lora',
    name: 'Flux Kontext',
    category: 'image',
    description: 'In-context style editing with LoRA support - edit images with text prompts',
    pricing: {
      cost: 0.04,
      unit: 'per image',
    },
    capabilities: ['image-to-image', 'editing', 'style-transfer'],
    speed: {
      estimate: '~8 seconds',
      relative: 'medium',
    },
    quality: 'high',
    tags: ['kontext', 'editing', 'style-transfer'],
    inputs: [
      {
        name: 'prompt',
        label: 'Edit Prompt',
        type: 'textarea',
        required: true,
        placeholder: 'Describe how to edit the image...',
      },
      {
        name: 'image_url',
        label: 'Source Image',
        type: 'image_upload',
        required: true,
        description: 'Image to edit',
      },
    ],
    outputs: {
      type: 'image',
      format: 'url',
    },
  },

  'seedream-edit': {
    id: 'seedream-edit',
    endpoint: 'fal-ai/bytedance/seedream/v4.5/image-to-image',
    name: 'Seedream v4.5 Edit',
    category: 'image',
    description: 'ByteDance Seedream image-to-image editing with text rendering',
    pricing: {
      cost: 0.04,
      unit: 'per image',
    },
    capabilities: ['image-to-image', 'editing', 'text-rendering'],
    speed: {
      estimate: '~5 seconds',
      relative: 'fast',
    },
    quality: 'premium',
    tags: ['seedream', 'editing', 'bytedance'],
    inputs: [
      {
        name: 'prompt',
        label: 'Edit Prompt',
        type: 'textarea',
        required: true,
        placeholder: 'Describe the edit...',
      },
      {
        name: 'image_url',
        label: 'Source Image',
        type: 'image_upload',
        required: true,
        description: 'Image to edit',
      },
    ],
    outputs: {
      type: 'image',
      format: 'url',
    },
  },

  'face-swap': {
    id: 'face-swap',
    endpoint: 'fal-ai/face-swap',
    name: 'Face Swap',
    category: 'image',
    description: 'Swap faces between images with high fidelity',
    pricing: {
      cost: 0.02,
      unit: 'per image',
    },
    capabilities: ['image-to-image', 'face-swap'],
    speed: {
      estimate: '~5 seconds',
      relative: 'fast',
    },
    quality: 'high',
    tags: ['face-swap', 'editing'],
    inputs: [
      {
        name: 'source_image_url',
        label: 'Source Face Image',
        type: 'image_upload',
        required: true,
        description: 'Image with the face to use',
      },
      {
        name: 'target_image_url',
        label: 'Target Image',
        type: 'image_upload',
        required: true,
        description: 'Image to swap face into',
      },
    ],
    outputs: {
      type: 'image',
      format: 'url',
    },
  },

  'sora-2': {
    id: 'sora-2',
    endpoint: 'fal-ai/sora-2/text-to-video',
    name: 'Sora 2',
    category: 'video',
    description: 'OpenAI Sora 2 - State-of-the-art text-to-video generation',
    pricing: {
      cost: 1.50,
      unit: 'per video',
    },
    capabilities: ['text-to-video', 'cinematic', 'premium-quality'],
    speed: {
      estimate: '~3-5 minutes',
      relative: 'slow',
    },
    quality: 'premium',
    recommended: true,
    tags: ['sora', 'openai', 'cinematic', 'premium'],
    inputs: [
      {
        name: 'prompt',
        label: 'Prompt',
        type: 'textarea',
        required: true,
        placeholder: 'Describe the video scene with cinematic details...',
      },
      {
        name: 'duration',
        label: 'Duration',
        type: 'select',
        default: '5',
        options: [
          { value: '5', label: '5 seconds' },
          { value: '10', label: '10 seconds' },
          { value: '20', label: '20 seconds' },
        ],
      },
      {
        name: 'aspect_ratio',
        label: 'Aspect Ratio',
        type: 'select',
        default: '16:9',
        options: [
          { value: '16:9', label: '16:9 (Landscape)' },
          { value: '9:16', label: '9:16 (Portrait)' },
          { value: '1:1', label: '1:1 (Square)' },
        ],
      },
    ],
    outputs: {
      type: 'video',
      format: 'mp4',
    },
  },

  'veo3': {
    id: 'veo3',
    endpoint: 'fal-ai/veo3.1',
    name: 'Veo 3.1',
    category: 'video',
    description: 'Google Veo 3.1 - Advanced video generation with realistic motion',
    pricing: {
      cost: 0.80,
      unit: 'per video',
    },
    capabilities: ['text-to-video', 'high-quality', 'realistic-motion'],
    speed: {
      estimate: '~2-3 minutes',
      relative: 'slow',
    },
    quality: 'premium',
    tags: ['veo', 'google', 'realistic', 'motion'],
    inputs: [
      {
        name: 'prompt',
        label: 'Prompt',
        type: 'textarea',
        required: true,
        placeholder: 'Describe the video scene...',
      },
      {
        name: 'duration',
        label: 'Duration',
        type: 'select',
        default: '5',
        options: [
          { value: '5', label: '5 seconds' },
          { value: '8', label: '8 seconds' },
        ],
      },
      {
        name: 'aspect_ratio',
        label: 'Aspect Ratio',
        type: 'select',
        default: '16:9',
        options: [
          { value: '16:9', label: '16:9 (Landscape)' },
          { value: '9:16', label: '9:16 (Portrait)' },
          { value: '1:1', label: '1:1 (Square)' },
        ],
      },
    ],
    outputs: {
      type: 'video',
      format: 'mp4',
    },
  },

  'minimax-tts': {
    id: 'minimax-tts',
    endpoint: 'fal-ai/minimax/speech-02-hd',
    name: 'MiniMax TTS HD',
    category: 'audio',
    description: 'High-quality text-to-speech with 300+ voices and 30+ languages',
    pricing: {
      cost: 0.015,
      unit: 'per minute',
    },
    capabilities: ['text-to-speech', 'multilingual', 'voice-cloning'],
    speed: {
      estimate: '~3 seconds',
      relative: 'fast',
    },
    quality: 'premium',
    recommended: true,
    tags: ['tts', 'minimax', 'multilingual', 'hd'],
    inputs: [
      {
        name: 'text',
        label: 'Text',
        type: 'textarea',
        required: true,
        placeholder: 'Enter the text to convert to speech...',
      },
      {
        name: 'voice_id',
        label: 'Voice',
        type: 'select',
        default: 'male-qn-qingse',
        options: [
          { value: 'male-qn-qingse', label: 'Male - Qingse' },
          { value: 'female-shaonv', label: 'Female - Shaonv' },
          { value: 'male-qn-jingying', label: 'Male - Jingying' },
          { value: 'female-yujie', label: 'Female - Yujie' },
        ],
      },
    ],
    outputs: {
      type: 'audio',
      format: 'mp3',
    },
  },

  'chatterbox-speech-to-speech': {
    id: 'chatterbox-speech-to-speech',
    endpoint: 'fal-ai/chatterbox/speech-to-speech',
    name: 'Chatterbox Speech-to-Speech',
    category: 'audio',
    description: 'Transform speech while matching a target voice reference.',
    pricing: {
      cost: 0.002,
      unit: 'per clip',
    },
    capabilities: ['speech-to-speech', 'voice-transfer', 'reference-audio'],
    speed: {
      estimate: '~2-4 seconds',
      relative: 'fast',
    },
    quality: 'standard',
    tags: ['chatterbox', 'speech-to-speech', 'voice-clone'],
    inputs: [
      {
        name: 'source_audio_url',
        label: 'Source Audio URL',
        type: 'text',
        required: true,
        placeholder: 'https://storage.googleapis.com/.../sample.wav',
        description: 'URL to the source audio to transform',
      },
      {
        name: 'target_voice_audio_url',
        label: 'Target Voice Audio URL',
        type: 'text',
        required: false,
        placeholder: 'https://v3.fal.media/.../reference.wav',
        description: 'Optional reference voice for style matching',
      },
    ],
    outputs: {
      type: 'audio',
      format: 'wav',
    },
  },

  'kling-image-to-video': {
    id: 'kling-image-to-video',
    endpoint: 'fal-ai/kling-video/v2.6/pro/image-to-video',
    name: 'Kling 2.6 Pro Image-to-Video',
    category: 'video',
    description: 'Convert images to video with Kling 2.6 Pro - latest and best quality',
    pricing: {
      cost: 0.70,
      unit: 'per 5s video with audio',
    },
    capabilities: ['image-to-video', 'high-quality', 'cinematic', 'native-audio', '1080p'],
    speed: {
      estimate: '~2-3 minutes',
      relative: 'slow',
    },
    quality: 'premium',
    recommended: true,
    tags: ['video', 'image-to-video', 'kling', '2.6', 'latest'],
    inputs: [
      {
        name: 'prompt',
        label: 'Motion Prompt',
        type: 'textarea',
        required: true,
        placeholder: 'Describe how the image should animate...',
      },
      {
        name: 'image_url',
        label: 'Image URL',
        type: 'image_upload',
        required: true,
        description: 'URL of the image to animate',
      },
      {
        name: 'duration',
        label: 'Duration',
        type: 'select',
        default: '5',
        options: [
          { value: '5', label: '5 seconds' },
          { value: '10', label: '10 seconds' },
        ],
      },
      {
        name: 'negative_prompt',
        label: 'Negative Prompt',
        type: 'textarea',
        default: 'blur, distort, and low quality',
        placeholder: 'What to avoid in the video...',
      },
      {
        name: 'generate_audio',
        label: 'Generate Audio',
        type: 'boolean',
        default: true,
        description: 'Generate native audio for the video',
      },
    ],
    outputs: {
      type: 'video',
      format: 'mp4',
    },
  },

  'ltx-2-19b-distilled-i2v': {
    id: 'ltx-2-19b-distilled-i2v',
    endpoint: 'fal-ai/ltx-2-19b/distilled/image-to-video/lora',
    name: 'LTX-2 19B Distilled (Image-to-Video)',
    category: 'video',
    description: 'Generate video with audio from images using LTX-2 Distilled and custom LoRA.',
    pricing: {
      cost: 0.12,
      unit: 'per video',
    },
    capabilities: ['image-to-video', 'lora', 'native-audio', 'cinematic'],
    speed: {
      estimate: '~2-4 minutes',
      relative: 'slow',
    },
    quality: 'premium',
    tags: ['video', 'image-to-video', 'ltx-2', 'lora'],
    inputs: [
      {
        name: 'prompt',
        label: 'Prompt',
        type: 'textarea',
        required: true,
        placeholder: 'Describe the motion and camera movement...',
      },
      {
        name: 'image_url',
        label: 'Image URL',
        type: 'image_upload',
        required: true,
        description: 'Source image to animate',
      },
      {
        name: 'loras',
        label: 'LoRAs (JSON)',
        type: 'textarea',
        default: '[{\"path\":\"\",\"scale\":1}]',
        description: 'JSON array of LoRA configs',
      },
      {
        name: 'num_frames',
        label: 'Frames',
        type: 'number',
        default: 121,
        min: 9,
        max: 481,
      },
      {
        name: 'fps',
        label: 'FPS',
        type: 'slider',
        default: 25,
        min: 1,
        max: 60,
        step: 1,
      },
      {
        name: 'generate_audio',
        label: 'Generate Audio',
        type: 'boolean',
        default: true,
        description: 'Add native audio to the video',
      },
      {
        name: 'camera_lora',
        label: 'Camera LoRA',
        type: 'select',
        default: 'none',
        options: [
          { value: 'none', label: 'None' },
          { value: 'static', label: 'Static' },
          { value: 'dolly_in', label: 'Dolly In' },
          { value: 'dolly_out', label: 'Dolly Out' },
          { value: 'dolly_left', label: 'Dolly Left' },
          { value: 'dolly_right', label: 'Dolly Right' },
          { value: 'jib_up', label: 'Jib Up' },
          { value: 'jib_down', label: 'Jib Down' },
        ],
      },
      {
        name: 'camera_lora_scale',
        label: 'Camera LoRA Scale',
        type: 'slider',
        default: 1,
        min: 0,
        max: 1,
        step: 0.05,
      },
      {
        name: 'negative_prompt',
        label: 'Negative Prompt',
        type: 'textarea',
        default: 'blurry, low quality, artifacts, distorted, flicker',
        placeholder: 'What to avoid...',
      },
      {
        name: 'video_output_type',
        label: 'Output Format',
        type: 'select',
        default: 'X264 (.mp4)',
        options: [
          { value: 'X264 (.mp4)', label: 'MP4 (H264)' },
          { value: 'VP9 (.webm)', label: 'WebM (VP9)' },
          { value: 'PRORES4444 (.mov)', label: 'ProRes 4444' },
          { value: 'GIF (.gif)', label: 'GIF' },
        ],
      },
      {
        name: 'video_quality',
        label: 'Quality',
        type: 'select',
        default: 'high',
        options: [
          { value: 'low', label: 'Low' },
          { value: 'medium', label: 'Medium' },
          { value: 'high', label: 'High' },
          { value: 'maximum', label: 'Maximum' },
        ],
      },
      {
        name: 'video_write_mode',
        label: 'Write Mode',
        type: 'select',
        default: 'balanced',
        options: [
          { value: 'fast', label: 'Fast' },
          { value: 'balanced', label: 'Balanced' },
          { value: 'small', label: 'Small' },
        ],
      },
      {
        name: 'enable_safety_checker',
        label: 'Safety Checker',
        type: 'boolean',
        default: true,
      },
    ],
    outputs: {
      type: 'video',
      format: 'mp4',
    },
  },

  // ==================== VIDEO GENERATION ====================
  'kling-video': {
    id: 'kling-video',
    endpoint: 'fal-ai/kling-video/v2.6/pro/text-to-video',
    name: 'Kling 2.6 Pro',
    category: 'video',
    description: 'Latest Kling with 1080p output, native audio, and superior quality',
    pricing: {
      cost: 0.70,
      unit: 'per 5s video with audio',
    },
    capabilities: ['text-to-video', 'high-quality', 'cinematic', 'native-audio', '1080p'],
    speed: {
      estimate: '~2-3 minutes',
      relative: 'slow',
    },
    quality: 'premium',
    recommended: true,
    tags: ['video', 'cinematic', 'high-quality', 'kling', '2.6', 'latest'],
    inputs: [
      {
        name: 'prompt',
        label: 'Prompt',
        type: 'textarea',
        required: true,
        placeholder: 'Describe the video scene with cinematic details...',
      },
      {
        name: 'duration',
        label: 'Duration',
        type: 'select',
        default: '5',
        options: [
          { value: '5', label: '5 seconds' },
          { value: '10', label: '10 seconds' },
        ],
      },
      {
        name: 'aspect_ratio',
        label: 'Aspect Ratio',
        type: 'select',
        default: '16:9',
        options: [
          { value: '16:9', label: '16:9 (Landscape)' },
          { value: '9:16', label: '9:16 (Portrait)' },
          { value: '1:1', label: '1:1 (Square)' },
        ],
      },
      {
        name: 'negative_prompt',
        label: 'Negative Prompt',
        type: 'textarea',
        default: 'blur, distort, and low quality',
        placeholder: 'What to avoid in the video...',
      },
      {
        name: 'cfg_scale',
        label: 'CFG Scale',
        type: 'slider',
        default: 0.5,
        min: 0,
        max: 1,
        step: 0.1,
        description: 'How closely to follow prompt (0.5 recommended)',
      },
      {
        name: 'generate_audio',
        label: 'Generate Audio',
        type: 'boolean',
        default: true,
        description: 'Generate native audio for the video',
      },
    ],
    outputs: {
      type: 'video',
      format: 'mp4',
    },
  },

  'minimax-video': {
    id: 'minimax-video',
    endpoint: 'fal-ai/minimax-video',
    name: 'MiniMax Video',
    category: 'video',
    description: 'Fast video generation with good quality',
    pricing: {
      cost: 0.30,
      unit: 'per video',
    },
    capabilities: ['text-to-video', 'fast'],
    speed: {
      estimate: '~1-2 minutes',
      relative: 'medium',
    },
    quality: 'high',
    tags: ['video', 'fast', 'affordable'],
    inputs: [
      {
        name: 'prompt',
        label: 'Prompt',
        type: 'textarea',
        required: true,
        placeholder: 'Describe the video...',
      },
    ],
    outputs: {
      type: 'video',
      format: 'mp4',
    },
  },

  'runway-gen3': {
    id: 'runway-gen3',
    endpoint: 'fal-ai/runway-gen3/turbo/image-to-video',
    name: 'Runway Gen-3 Turbo',
    category: 'video',
    description: 'Advanced image-to-video generation with Runway Gen-3 Alpha Turbo',
    pricing: {
      cost: 0.35,
      unit: 'per video',
    },
    capabilities: ['image-to-video', 'advanced'],
    speed: {
      estimate: '~2 minutes',
      relative: 'medium',
    },
    quality: 'premium',
    tags: ['video', 'professional', 'runway', 'image-to-video'],
    inputs: [
      {
        name: 'prompt',
        label: 'Motion Prompt',
        type: 'textarea',
        required: true,
        placeholder: 'Describe how the image should animate...',
      },
      {
        name: 'image_url',
        label: 'Image URL',
        type: 'image_upload',
        required: true,
        description: 'URL of the image to animate',
      },
      {
        name: 'duration',
        label: 'Duration (seconds)',
        type: 'select',
        default: '5',
        options: [
          { value: '5', label: '5 seconds' },
          { value: '10', label: '10 seconds' },
        ],
      },
    ],
    outputs: {
      type: 'video',
      format: 'mp4',
    },
  },

  'luma-dream-machine': {
    id: 'luma-dream-machine',
    endpoint: 'fal-ai/luma-dream-machine',
    name: 'Luma Dream Machine',
    category: 'video',
    description: 'Creative video generation with Luma AI',
    pricing: {
      cost: 0.40,
      unit: 'per video',
    },
    capabilities: ['text-to-video', 'creative'],
    speed: {
      estimate: '~2 minutes',
      relative: 'medium',
    },
    quality: 'high',
    tags: ['video', 'creative', 'luma'],
    inputs: [
      {
        name: 'prompt',
        label: 'Prompt',
        type: 'textarea',
        required: true,
        placeholder: 'Describe your dream video...',
      },
    ],
    outputs: {
      type: 'video',
      format: 'mp4',
    },
  },

  'hunyuan-video-1.5': {
    id: 'hunyuan-video-1.5',
    endpoint: 'fal-ai/hunyuan-video-v1.5/text-to-video',
    name: 'Hunyuan Video 1.5',
    category: 'video',
    description: 'Tencent Hunyuan Video 1.5 - high quality text-to-video generation',
    pricing: {
      cost: 0.40,
      unit: 'per video',
    },
    capabilities: ['text-to-video', 'high-quality'],
    speed: {
      estimate: '~2-3 minutes',
      relative: 'slow',
    },
    quality: 'high',
    tags: ['hunyuan', 'tencent', 'quality'],
    inputs: [
      {
        name: 'prompt',
        label: 'Prompt',
        type: 'textarea',
        required: true,
        placeholder: 'Describe the video scene...',
      },
      {
        name: 'aspect_ratio',
        label: 'Aspect Ratio',
        type: 'select',
        default: '16:9',
        options: [
          { value: '16:9', label: '16:9 (Landscape)' },
          { value: '9:16', label: '9:16 (Portrait)' },
          { value: '1:1', label: '1:1 (Square)' },
        ],
      },
    ],
    outputs: {
      type: 'video',
      format: 'mp4',
    },
  },

  'hunyuan-video-i2v': {
    id: 'hunyuan-video-i2v',
    endpoint: 'fal-ai/hunyuan-video-image-to-video',
    name: 'Hunyuan Video I2V',
    category: 'video',
    description: 'Tencent Hunyuan image-to-video generation',
    pricing: {
      cost: 0.40,
      unit: 'per video',
    },
    capabilities: ['image-to-video', 'high-quality'],
    speed: {
      estimate: '~2-3 minutes',
      relative: 'slow',
    },
    quality: 'high',
    tags: ['hunyuan', 'image-to-video', 'tencent'],
    inputs: [
      {
        name: 'prompt',
        label: 'Motion Prompt',
        type: 'textarea',
        required: true,
        placeholder: 'Describe how the image should animate...',
      },
      {
        name: 'image_url',
        label: 'Image URL',
        type: 'image_upload',
        required: true,
        description: 'Image to animate',
      },
    ],
    outputs: {
      type: 'video',
      format: 'mp4',
    },
  },

  'vidu-q2-t2v': {
    id: 'vidu-q2-t2v',
    endpoint: 'fal-ai/vidu/q2/text-to-video',
    name: 'Vidu Q2 Text-to-Video',
    category: 'video',
    description: 'Latest Vidu Q2 model - high quality text-to-video generation',
    pricing: {
      cost: 0.35,
      unit: 'per video',
    },
    capabilities: ['text-to-video', 'high-quality'],
    speed: {
      estimate: '~1-2 minutes',
      relative: 'medium',
    },
    quality: 'high',
    tags: ['vidu', 'quality'],
    inputs: [
      {
        name: 'prompt',
        label: 'Prompt',
        type: 'textarea',
        required: true,
        placeholder: 'Describe the video scene...',
      },
      {
        name: 'duration',
        label: 'Duration',
        type: 'select',
        default: '5',
        options: [
          { value: '5', label: '5 seconds' },
          { value: '8', label: '8 seconds' },
        ],
      },
    ],
    outputs: {
      type: 'video',
      format: 'mp4',
    },
  },

  'vidu-q2-i2v': {
    id: 'vidu-q2-i2v',
    endpoint: 'fal-ai/vidu/reference-to-video',
    name: 'Vidu Reference-to-Video',
    category: 'video',
    description: 'Vidu reference-based video generation with subject consistency',
    pricing: {
      cost: 0.35,
      unit: 'per video',
    },
    capabilities: ['image-to-video', 'reference-based'],
    speed: {
      estimate: '~1-2 minutes',
      relative: 'medium',
    },
    quality: 'high',
    tags: ['vidu', 'reference', 'consistency'],
    inputs: [
      {
        name: 'prompt',
        label: 'Prompt',
        type: 'textarea',
        required: true,
        placeholder: 'Describe the video scene...',
      },
      {
        name: 'image_url',
        label: 'Reference Image',
        type: 'image_upload',
        required: true,
        description: 'Reference image for the video',
      },
    ],
    outputs: {
      type: 'video',
      format: 'mp4',
    },
  },

  'vidu-start-end': {
    id: 'vidu-start-end',
    endpoint: 'fal-ai/vidu/start-end-to-video',
    name: 'Vidu Start-End Video',
    category: 'video',
    description: 'Keyframe interpolation - generate video from start and end frames',
    pricing: {
      cost: 0.35,
      unit: 'per video',
    },
    capabilities: ['image-to-video', 'interpolation'],
    speed: {
      estimate: '~1-2 minutes',
      relative: 'medium',
    },
    quality: 'high',
    tags: ['vidu', 'interpolation', 'keyframe'],
    inputs: [
      {
        name: 'prompt',
        label: 'Prompt',
        type: 'textarea',
        required: true,
        placeholder: 'Describe the transition...',
      },
      {
        name: 'start_image_url',
        label: 'Start Frame',
        type: 'image_upload',
        required: true,
        description: 'Starting frame image',
      },
      {
        name: 'end_image_url',
        label: 'End Frame',
        type: 'image_upload',
        required: true,
        description: 'Ending frame image',
      },
    ],
    outputs: {
      type: 'video',
      format: 'mp4',
    },
  },

  'cogvideox-5b': {
    id: 'cogvideox-5b',
    endpoint: 'fal-ai/cogvideox-5b',
    name: 'CogVideoX 5B',
    category: 'video',
    description: 'Open-source 5B parameter video model - affordable and high fidelity',
    pricing: {
      cost: 0.20,
      unit: 'per video',
    },
    capabilities: ['text-to-video', 'open-source'],
    speed: {
      estimate: '~1-2 minutes',
      relative: 'medium',
    },
    quality: 'standard',
    tags: ['open-source', 'affordable', 'cogvideo'],
    inputs: [
      {
        name: 'prompt',
        label: 'Prompt',
        type: 'textarea',
        required: true,
        placeholder: 'Describe the video scene...',
      },
    ],
    outputs: {
      type: 'video',
      format: 'mp4',
    },
  },

  'mochi-v1': {
    id: 'mochi-v1',
    endpoint: 'fal-ai/mochi-v1',
    name: 'Mochi v1',
    category: 'video',
    description: 'Genmo Mochi - open-source 10B parameter model with high fidelity motion',
    pricing: {
      cost: 0.25,
      unit: 'per video',
    },
    capabilities: ['text-to-video', 'high-fidelity', 'open-source'],
    speed: {
      estimate: '~2 minutes',
      relative: 'medium',
    },
    quality: 'high',
    tags: ['mochi', 'open-source', 'fidelity'],
    inputs: [
      {
        name: 'prompt',
        label: 'Prompt',
        type: 'textarea',
        required: true,
        placeholder: 'Describe the video scene...',
      },
    ],
    outputs: {
      type: 'video',
      format: 'mp4',
    },
  },

  'wan-v2-t2v': {
    id: 'wan-v2-t2v',
    endpoint: 'fal-ai/wan/v2.2-a14b/text-to-video',
    name: 'WAN v2.2 Text-to-Video',
    category: 'video',
    description: 'Alibaba WAN 14B parameter text-to-video generation',
    pricing: {
      cost: 0.30,
      unit: 'per video',
    },
    capabilities: ['text-to-video', 'high-quality'],
    speed: {
      estimate: '~2 minutes',
      relative: 'medium',
    },
    quality: 'high',
    tags: ['wan', 'alibaba', 'quality'],
    inputs: [
      {
        name: 'prompt',
        label: 'Prompt',
        type: 'textarea',
        required: true,
        placeholder: 'Describe the video scene...',
      },
      {
        name: 'aspect_ratio',
        label: 'Aspect Ratio',
        type: 'select',
        default: '16:9',
        options: [
          { value: '16:9', label: '16:9 (Landscape)' },
          { value: '9:16', label: '9:16 (Portrait)' },
          { value: '1:1', label: '1:1 (Square)' },
        ],
      },
    ],
    outputs: {
      type: 'video',
      format: 'mp4',
    },
  },

  // ==================== AUDIO GENERATION ====================
  'f5-tts': {
    id: 'f5-tts',
    endpoint: 'fal-ai/f5-tts',
    name: 'F5 TTS',
    category: 'audio',
    description: 'High-quality text-to-speech generation',
    pricing: {
      cost: 0.01,
      unit: 'per minute',
    },
    capabilities: ['text-to-speech', 'natural-voice'],
    speed: {
      estimate: '~5 seconds',
      relative: 'fast',
    },
    quality: 'high',
    recommended: true,
    tags: ['tts', 'voice', 'natural'],
    inputs: [
      {
        name: 'text',
        label: 'Text',
        type: 'textarea',
        required: true,
        placeholder: 'Enter the text to convert to speech...',
      },
    ],
    outputs: {
      type: 'audio',
      format: 'mp3',
    },
  },

  'stable-audio': {
    id: 'stable-audio',
    endpoint: 'fal-ai/stable-audio',
    name: 'Stable Audio',
    category: 'audio',
    description: 'Generate music and sound effects from text',
    pricing: {
      cost: 0.05,
      unit: 'per generation',
    },
    capabilities: ['text-to-audio', 'music', 'sound-effects'],
    speed: {
      estimate: '~10 seconds',
      relative: 'fast',
    },
    quality: 'high',
    tags: ['music', 'sound-effects', 'audio'],
    inputs: [
      {
        name: 'prompt',
        label: 'Prompt',
        type: 'textarea',
        required: true,
        placeholder: 'Describe the audio/music you want...',
      },
      {
        name: 'duration',
        label: 'Duration (seconds)',
        type: 'slider',
        default: 10,
        min: 5,
        max: 30,
        step: 5,
      },
    ],
    outputs: {
      type: 'audio',
      format: 'mp3',
    },
  },

  'stable-audio-25': {
    id: 'stable-audio-25',
    endpoint: 'fal-ai/stable-audio-25/text-to-audio',
    name: 'Stable Audio 2.5',
    category: 'audio',
    description: 'Latest Stable Audio - natural-sounding audio and music from text descriptions',
    pricing: {
      cost: 0.002,
      unit: 'per generation',
    },
    capabilities: ['text-to-audio', 'music', 'sound-effects'],
    speed: {
      estimate: '~10 seconds',
      relative: 'fast',
    },
    quality: 'high',
    recommended: true,
    tags: ['stable-audio', 'music', 'sound-effects', '2.5'],
    inputs: [
      {
        name: 'prompt',
        label: 'Prompt',
        type: 'textarea',
        required: true,
        placeholder: 'Describe the audio/music you want...',
      },
      {
        name: 'seconds_total',
        label: 'Duration (seconds)',
        type: 'slider',
        default: 30,
        min: 1,
        max: 180,
        step: 1,
        description: 'Duration of the audio in seconds',
      },
    ],
    outputs: {
      type: 'audio',
      format: 'wav',
    },
  },

  'beatoven-music': {
    id: 'beatoven-music',
    endpoint: 'fal-ai/beatoven/music-generation',
    name: 'Beatoven Music Gen',
    category: 'audio',
    description: 'Royalty-free instrumental music composition with genre and mood control',
    pricing: {
      cost: 0.005,
      unit: 'per generation',
    },
    capabilities: ['text-to-audio', 'music-generation', 'royalty-free'],
    speed: {
      estimate: '~15 seconds',
      relative: 'medium',
    },
    quality: 'high',
    tags: ['beatoven', 'music', 'royalty-free', 'instrumental'],
    inputs: [
      {
        name: 'prompt',
        label: 'Prompt',
        type: 'textarea',
        required: true,
        placeholder: 'Describe the music you want (genre, mood, tempo)...',
      },
      {
        name: 'duration',
        label: 'Duration (seconds)',
        type: 'slider',
        default: 60,
        min: 10,
        max: 300,
        step: 10,
        description: 'Duration of the music in seconds',
      },
    ],
    outputs: {
      type: 'audio',
      format: 'mp3',
    },
  },

  // ==================== AVATAR & ANIMATION ====================
  'kling-avatar': {
    id: 'kling-avatar',
    endpoint: 'fal-ai/kling-video/ai-avatar/v2/pro',
    name: 'Kling AI Avatar',
    category: 'avatar',
    description: 'Generate talking head videos from an image and audio - realistic character animation',
    pricing: {
      cost: 0.06,
      unit: 'per generation',
    },
    capabilities: ['avatar-generation', 'talking-head', 'audio-driven'],
    speed: {
      estimate: '~30 seconds',
      relative: 'medium',
    },
    quality: 'premium',
    recommended: true,
    tags: ['kling', 'avatar', 'talking-head', 'animation'],
    inputs: [
      {
        name: 'image_url',
        label: 'Character Image',
        type: 'image_upload',
        required: true,
        description: 'Image of the character to animate',
      },
      {
        name: 'audio_url',
        label: 'Audio URL',
        type: 'text',
        required: false,
        placeholder: 'URL to driving audio',
        description: 'Audio to drive the avatar lip sync',
      },
      {
        name: 'text',
        label: 'Text to Speak',
        type: 'textarea',
        required: false,
        placeholder: 'Text for the avatar to speak...',
        description: 'Text that will be synthesized to speech',
      },
    ],
    outputs: {
      type: 'video',
      format: 'mp4',
    },
  },

  'live-avatar': {
    id: 'live-avatar',
    endpoint: 'fal-ai/live-avatar',
    name: 'Live Avatar',
    category: 'avatar',
    description: 'Real-time avatar generation with WebSocket streaming for interactive conversations',
    pricing: {
      cost: 0.001,
      unit: 'per second',
    },
    capabilities: ['real-time-avatar', 'streaming', 'interactive'],
    speed: {
      estimate: 'real-time',
      relative: 'fast',
    },
    quality: 'high',
    tags: ['live', 'avatar', 'real-time', 'streaming'],
    inputs: [
      {
        name: 'image_url',
        label: 'Character Image',
        type: 'image_upload',
        required: true,
        description: 'Image of the character to animate',
      },
    ],
    outputs: {
      type: 'video',
      format: 'mp4',
    },
  },

  'sync-lipsync': {
    id: 'sync-lipsync',
    endpoint: 'fal-ai/sync-lipsync/v2/pro',
    name: 'Sync Lipsync v2',
    category: 'avatar',
    description: 'Professional audio-to-video lip synchronization for dubbing and animation',
    pricing: {
      cost: 0.10,
      unit: 'per video',
    },
    capabilities: ['lip-sync', 'dubbing', 'audio-to-video'],
    speed: {
      estimate: '~30 seconds',
      relative: 'medium',
    },
    quality: 'premium',
    tags: ['lipsync', 'dubbing', 'sync'],
    inputs: [
      {
        name: 'video_url',
        label: 'Video',
        type: 'text',
        required: true,
        placeholder: 'URL of the video to sync',
        description: 'Video to apply lip sync to',
      },
      {
        name: 'audio_url',
        label: 'Audio',
        type: 'text',
        required: true,
        placeholder: 'URL of the audio to sync with',
        description: 'Audio track to drive lip movements',
      },
    ],
    outputs: {
      type: 'video',
      format: 'mp4',
    },
  },

  // ==================== UTILITY ====================
  'image-to-video': {
    id: 'image-to-video',
    endpoint: 'fal-ai/fast-svd',
    name: 'Image to Video',
    category: 'utility',
    description: 'Animate still images into videos',
    pricing: {
      cost: 0.10,
      unit: 'per video',
    },
    capabilities: ['image-to-video', 'animation'],
    speed: {
      estimate: '~30 seconds',
      relative: 'medium',
    },
    quality: 'standard',
    tags: ['animation', 'image-to-video', 'utility'],
    inputs: [
      {
        name: 'image_url',
        label: 'Image URL',
        type: 'image_upload',
        required: true,
        description: 'Upload or paste image URL',
      },
      {
        name: 'motion_bucket_id',
        label: 'Motion Intensity',
        type: 'slider',
        default: 127,
        min: 1,
        max: 255,
        step: 1,
        description: 'Higher values = more motion',
      },
    ],
    outputs: {
      type: 'video',
      format: 'mp4',
    },
  },

  'upscaler': {
    id: 'upscaler',
    endpoint: 'fal-ai/clarity-upscaler',
    name: 'Image Upscaler',
    category: 'utility',
    description: 'Upscale images with AI enhancement',
    pricing: {
      cost: 0.02,
      unit: 'per image',
    },
    capabilities: ['upscale', 'enhance'],
    speed: {
      estimate: '~10 seconds',
      relative: 'fast',
    },
    quality: 'high',
    tags: ['upscale', 'enhance', 'utility'],
    inputs: [
      {
        name: 'image_url',
        label: 'Image URL',
        type: 'image_upload',
        required: true,
      },
      {
        name: 'scale',
        label: 'Scale Factor',
        type: 'select',
        default: 2,
        options: [
          { value: 2, label: '2x' },
          { value: 4, label: '4x' },
        ],
      },
    ],
    outputs: {
      type: 'image',
      format: 'url',
    },
  },

  'remove-background': {
    id: 'remove-background',
    endpoint: 'fal-ai/imageutils/rembg',
    name: 'Remove Background',
    category: 'utility',
    description: 'Remove background from images',
    pricing: {
      cost: 0.005,
      unit: 'per image',
    },
    capabilities: ['background-removal'],
    speed: {
      estimate: '~3 seconds',
      relative: 'fast',
    },
    quality: 'high',
    tags: ['background-removal', 'utility', 'editing'],
    inputs: [
      {
        name: 'image_url',
        label: 'Image URL',
        type: 'image_upload',
        required: true,
      },
    ],
    outputs: {
      type: 'image',
      format: 'url',
    },
  },

  // ==================== DEPTH ESTIMATION ====================
  'midas-depth': {
    id: 'midas-depth',
    endpoint: 'fal-ai/imageutils/depth',
    name: 'MiDaS Depth',
    category: 'utility',
    description: 'FREE depth map extraction using MiDaS - great for parallax effects',
    pricing: {
      cost: 0,
      unit: 'free',
    },
    capabilities: ['depth-estimation', 'parallax', '3d-effect'],
    speed: {
      estimate: '~3 seconds',
      relative: 'fast',
    },
    quality: 'standard',
    recommended: true,
    tags: ['depth', 'midas', 'free', 'parallax', '3d'],
    inputs: [
      {
        name: 'image_url',
        label: 'Image URL',
        type: 'image_upload',
        required: true,
        description: 'Image to extract depth from',
      },
      {
        name: 'a',
        label: 'Depth Scale',
        type: 'slider',
        default: 6.28,
        min: 1,
        max: 10,
        step: 0.1,
        description: 'Controls depth map scaling',
      },
      {
        name: 'bg_th',
        label: 'Background Threshold',
        type: 'slider',
        default: 0.1,
        min: 0,
        max: 1,
        step: 0.05,
        description: 'Threshold for background detection',
      },
    ],
    outputs: {
      type: 'image',
      format: 'url',
    },
  },

  'marigold-depth': {
    id: 'marigold-depth',
    endpoint: 'fal-ai/imageutils/marigold-depth',
    name: 'Marigold Depth',
    category: 'utility',
    description: 'High-quality depth estimation using Marigold diffusion model',
    pricing: {
      cost: 0.01,
      unit: 'per image',
    },
    capabilities: ['depth-estimation', 'high-quality', 'parallax', '3d-effect'],
    speed: {
      estimate: '~5 seconds',
      relative: 'fast',
    },
    quality: 'high',
    recommended: true,
    tags: ['depth', 'marigold', 'high-quality', 'parallax', '3d'],
    inputs: [
      {
        name: 'image_url',
        label: 'Image URL',
        type: 'image_upload',
        required: true,
        description: 'Image to extract depth from',
      },
      {
        name: 'num_inference_steps',
        label: 'Inference Steps',
        type: 'slider',
        default: 10,
        min: 2,
        max: 50,
        step: 1,
        description: 'Higher = more accurate but slower',
      },
      {
        name: 'ensemble_size',
        label: 'Ensemble Size',
        type: 'slider',
        default: 10,
        min: 2,
        max: 50,
        step: 1,
        description: 'Number of predictions to average',
      },
      {
        name: 'processing_res',
        label: 'Processing Resolution',
        type: 'number',
        default: 0,
        min: 0,
        max: 2048,
        description: '0 = use input size, or specify max resolution',
      },
    ],
    outputs: {
      type: 'image',
      format: 'url',
    },
  },

  'birefnet-bg': {
    id: 'birefnet-bg',
    endpoint: 'fal-ai/birefnet',
    name: 'BiRefNet BG Removal',
    category: 'utility',
    description: 'Advanced background removal with clean separation and transparent output',
    pricing: {
      cost: 0.001,
      unit: 'per image',
    },
    capabilities: ['background-removal', 'transparency'],
    speed: {
      estimate: '~3 seconds',
      relative: 'fast',
    },
    quality: 'high',
    tags: ['background-removal', 'birefnet', 'transparency'],
    inputs: [
      {
        name: 'image_url',
        label: 'Image URL',
        type: 'image_upload',
        required: true,
      },
    ],
    outputs: {
      type: 'image',
      format: 'url',
    },
  },

  'topaz-upscale': {
    id: 'topaz-upscale',
    endpoint: 'fal-ai/topaz/image-upscale',
    name: 'Topaz Image Upscale',
    category: 'utility',
    description: 'Professional image enhancement and upscaling up to 4x',
    pricing: {
      cost: 0.002,
      unit: 'per image',
    },
    capabilities: ['upscale', 'enhance', 'professional'],
    speed: {
      estimate: '~10 seconds',
      relative: 'medium',
    },
    quality: 'premium',
    tags: ['topaz', 'upscale', 'professional'],
    inputs: [
      {
        name: 'image_url',
        label: 'Image URL',
        type: 'image_upload',
        required: true,
      },
      {
        name: 'scale',
        label: 'Scale Factor',
        type: 'select',
        default: 2,
        options: [
          { value: 2, label: '2x' },
          { value: 4, label: '4x' },
        ],
      },
    ],
    outputs: {
      type: 'image',
      format: 'url',
    },
  },

  'esrgan-upscale': {
    id: 'esrgan-upscale',
    endpoint: 'fal-ai/esrgan',
    name: 'ESRGAN Upscale',
    category: 'utility',
    description: 'Fast and affordable image upscaling with ESRGAN',
    pricing: {
      cost: 0.001,
      unit: 'per image',
    },
    capabilities: ['upscale'],
    speed: {
      estimate: '~5 seconds',
      relative: 'fast',
    },
    quality: 'standard',
    tags: ['esrgan', 'upscale', 'affordable'],
    inputs: [
      {
        name: 'image_url',
        label: 'Image URL',
        type: 'image_upload',
        required: true,
      },
      {
        name: 'scale',
        label: 'Scale Factor',
        type: 'select',
        default: 2,
        options: [
          { value: 2, label: '2x' },
          { value: 4, label: '4x' },
        ],
      },
    ],
    outputs: {
      type: 'image',
      format: 'url',
    },
  },

  'depth-anything-v2': {
    id: 'depth-anything-v2',
    endpoint: 'fal-ai/image-preprocessors/depth-anything/v2',
    name: 'Depth Anything v2',
    category: 'utility',
    description: 'Latest depth estimation model with improved accuracy and detail',
    pricing: {
      cost: 0.001,
      unit: 'per image',
    },
    capabilities: ['depth-estimation', 'parallax', '3d-effect'],
    speed: {
      estimate: '~3 seconds',
      relative: 'fast',
    },
    quality: 'high',
    tags: ['depth', 'depth-anything', 'parallax', '3d'],
    inputs: [
      {
        name: 'image_url',
        label: 'Image URL',
        type: 'image_upload',
        required: true,
        description: 'Image to extract depth from',
      },
    ],
    outputs: {
      type: 'image',
      format: 'url',
    },
  },

  // ==================== TRAINING ====================
  'flux-lora-training': {
    id: 'flux-lora-training',
    endpoint: 'fal-ai/flux-lora/fast-training',
    name: 'FLUX LoRA Training',
    category: 'training',
    description: 'Train custom LoRA styles for FLUX models - speed-optimized training',
    pricing: {
      cost: 0.50,
      unit: 'per training session',
    },
    capabilities: ['lora-training', 'custom-style'],
    speed: {
      estimate: '~5-10 minutes',
      relative: 'slow',
    },
    quality: 'high',
    tags: ['training', 'lora', 'custom-style'],
    inputs: [
      {
        name: 'training_images',
        label: 'Training Images',
        type: 'text',
        required: true,
        placeholder: 'URLs of training images (comma-separated)',
        description: 'URLs of training images',
      },
      {
        name: 'trigger_word',
        label: 'Trigger Word',
        type: 'text',
        required: false,
        placeholder: 'e.g., "mystyle"',
        description: 'Word to trigger the trained style',
      },
    ],
    outputs: {
      type: 'json',
      format: 'lora',
    },
  },

  // ==================== IMAGE TO 3D ====================
  'triposr': {
    id: 'triposr',
    endpoint: 'fal-ai/triposr',
    name: 'TripoSR',
    category: 'utility',
    description: 'Ultra-fast image to 3D mesh - under 0.5s per generation',
    pricing: {
      cost: 0.07,
      unit: 'per 3D model',
    },
    capabilities: ['image-to-3d', '3d-mesh', 'glb', 'obj', 'fast'],
    speed: {
      estimate: '~0.5 seconds',
      relative: 'fast',
    },
    quality: 'high',
    recommended: true,
    tags: ['3d', 'mesh', 'triposr', 'fast', 'glb', 'obj'],
    inputs: [
      {
        name: 'image_url',
        label: 'Image URL',
        type: 'image_upload',
        required: true,
        description: 'Image to convert to 3D model',
      },
      {
        name: 'output_format',
        label: 'Output Format',
        type: 'select',
        default: 'glb',
        options: [
          { value: 'glb', label: 'GLB (recommended)' },
          { value: 'obj', label: 'OBJ' },
        ],
      },
      {
        name: 'mc_resolution',
        label: 'Mesh Resolution',
        type: 'slider',
        default: 256,
        min: 32,
        max: 1024,
        step: 32,
        description: 'Marching cubes resolution - higher = more detail',
      },
      {
        name: 'foreground_ratio',
        label: 'Foreground Ratio',
        type: 'slider',
        default: 0.85,
        min: 0.5,
        max: 1.0,
        step: 0.05,
        description: 'Ratio of foreground in image',
      },
      {
        name: 'remove_background',
        label: 'Remove Background',
        type: 'boolean',
        default: true,
        description: 'Automatically remove background before processing',
      },
    ],
    outputs: {
      type: 'json',
      format: 'glb/obj',
    },
  },

  'trellis-2': {
    id: 'trellis-2',
    endpoint: 'fal-ai/trellis-2',
    name: 'Trellis 2',
    category: 'utility',
    description: 'High-quality image to 3D with textures - Microsoft native 3D generator',
    pricing: {
      cost: 0.30,
      unit: 'per 3D model (1024p)',
    },
    capabilities: ['image-to-3d', '3d-mesh', 'pbr-textures', 'high-quality'],
    speed: {
      estimate: '~30 seconds',
      relative: 'medium',
    },
    quality: 'premium',
    tags: ['3d', 'trellis', 'textures', 'high-quality', 'pbr'],
    inputs: [
      {
        name: 'image_url',
        label: 'Image URL',
        type: 'image_upload',
        required: true,
        description: 'Image to convert to 3D model',
      },
      {
        name: 'ss_guidance_strength',
        label: 'Structure Guidance',
        type: 'slider',
        default: 7.5,
        min: 1,
        max: 15,
        step: 0.5,
        description: 'How closely to follow input geometry (7-9 for clear shapes)',
      },
      {
        name: 'slat_guidance_strength',
        label: 'Refinement Strength',
        type: 'slider',
        default: 3.0,
        min: 1,
        max: 10,
        step: 0.5,
        description: 'Second stage refinement (3-5 for fine detail)',
      },
      {
        name: 'resolution',
        label: 'Resolution',
        type: 'select',
        default: '1024',
        options: [
          { value: '512', label: '512p ($0.25)' },
          { value: '1024', label: '1024p ($0.30)' },
          { value: '1536', label: '1536p ($0.35)' },
        ],
      },
    ],
    outputs: {
      type: 'json',
      format: 'glb',
    },
  },

  'hunyuan3d-v3': {
    id: 'hunyuan3d-v3',
    endpoint: 'fal-ai/hunyuan3d-v3/image-to-3d',
    name: 'Hunyuan3D v3',
    category: 'utility',
    description: 'Ultra-high-res 3D with PBR textures - film-quality output',
    pricing: {
      cost: 0.375,
      unit: 'per 3D model',
    },
    capabilities: ['image-to-3d', 'pbr-textures', 'film-quality', 'premium'],
    speed: {
      estimate: '~60 seconds',
      relative: 'slow',
    },
    quality: 'premium',
    tags: ['3d', 'hunyuan', 'pbr', 'premium', 'film-quality'],
    inputs: [
      {
        name: 'image_url',
        label: 'Image URL',
        type: 'image_upload',
        required: true,
        description: 'Image to convert to 3D model',
      },
      {
        name: 'generation_mode',
        label: 'Generation Mode',
        type: 'select',
        default: 'Normal',
        options: [
          { value: 'Normal', label: 'Normal ($0.375)' },
          { value: 'LowPoly', label: 'Low Poly ($0.45)' },
          { value: 'Geometry', label: 'Geometry Only ($0.225)' },
        ],
      },
    ],
    outputs: {
      type: 'json',
      format: 'glb',
    },
  },
};

/**
 * Get models by category
 */
export function getModelsByCategory(category: FALModelCategory): FALModelDefinition[] {
  return Object.values(FAL_MODELS).filter((model) => model.category === category);
}

/**
 * Get model by ID
 */
export function getModelById(id: string): FALModelDefinition | undefined {
  return FAL_MODELS[id];
}

/**
 * Get all model categories
 */
export function getAllCategories(): FALModelCategory[] {
  return ['image', 'video', 'audio', 'utility', 'avatar', 'training'];
}

/**
 * Search models by tags
 */
export function searchModelsByTag(tag: string): FALModelDefinition[] {
  return Object.values(FAL_MODELS).filter((model) => model.tags?.includes(tag.toLowerCase()));
}

/**
 * Get recommended models
 */
export function getRecommendedModels(): FALModelDefinition[] {
  return Object.values(FAL_MODELS).filter((model) => model.recommended);
}
