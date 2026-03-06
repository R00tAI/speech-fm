/**
 * FAL.ai Model Registry
 * Comprehensive catalog of all available FAL models with their configurations
 * Auto-generated from FAL API documentation - 2025-12-29
 */

export type ModelCategory = 'image' | 'video' | 'audio' | '3d' | 'avatar' | 'utility' | 'training';
export type ModelSpeed = 'fast' | 'medium' | 'slow';

export interface ModelInput {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'enum';
  description?: string;
  default?: any;
  min?: number;
  max?: number;
  enum?: string[];
  required: boolean;
}

export interface ModelConfig {
  id: string;
  name: string;
  category: ModelCategory;
  subcategory: string;
  description: string;
  inputs: Record<string, ModelInput>;
  outputs: string[];
  pricing: number; // USD per generation (approximate)
  speed: ModelSpeed;
  features: string[];
  supportsAudio?: boolean;
  supportsBatch?: boolean;
  maxDuration?: number; // For video/audio models (seconds)
  resolutions?: string[];
}

/**
 * Complete FAL Model Registry
 * Use this for building dynamic model selectors
 */
export const FAL_MODEL_REGISTRY: Record<string, ModelConfig> = {
  // ==================== IMAGE GENERATION ====================

  // FLUX Models
  'fal-ai/flux/schnell': {
    id: 'fal-ai/flux/schnell',
    name: 'FLUX.1 [schnell]',
    category: 'image',
    subcategory: 'text-to-image',
    description: 'Ultra-fast image generation in 1-4 steps. Best for quick iterations and previews.',
    inputs: {
      prompt: { type: 'string', required: true, description: 'Text description of the image to generate' },
      image_size: { type: 'enum', required: false, default: 'landscape_4_3', enum: ['square_hd', 'square', 'portrait_4_3', 'portrait_16_9', 'landscape_4_3', 'landscape_16_9'] },
      num_inference_steps: { type: 'number', required: false, default: 4, min: 1, max: 50 },
      guidance_scale: { type: 'number', required: false, default: 3.5, min: 1, max: 20 },
      num_images: { type: 'number', required: false, default: 1, min: 1, max: 4 },
      seed: { type: 'number', required: false },
      enable_safety_checker: { type: 'boolean', required: false, default: true },
      output_format: { type: 'enum', required: false, default: 'jpeg', enum: ['jpeg', 'png'] },
    },
    outputs: ['images', 'prompt', 'seed', 'has_nsfw_concepts'],
    pricing: 0.003,
    speed: 'fast',
    features: ['ultra-fast', 'batch-generation', 'reproducible'],
    supportsBatch: true,
  },

  'fal-ai/flux/dev': {
    id: 'fal-ai/flux/dev',
    name: 'FLUX.1 [dev]',
    category: 'image',
    subcategory: 'text-to-image',
    description: 'High-quality 12B parameter model with enhanced realism and detail. Production-ready.',
    inputs: {
      prompt: { type: 'string', required: true, description: 'Text description of the image to generate' },
      image_size: { type: 'enum', required: false, default: 'landscape_4_3', enum: ['square_hd', 'square', 'portrait_4_3', 'portrait_16_9', 'landscape_4_3', 'landscape_16_9'] },
      num_inference_steps: { type: 'number', required: false, default: 28, min: 1, max: 50 },
      guidance_scale: { type: 'number', required: false, default: 3.5, min: 1, max: 20 },
      num_images: { type: 'number', required: false, default: 1, min: 1, max: 4 },
      seed: { type: 'number', required: false },
      enable_safety_checker: { type: 'boolean', required: false, default: true },
      output_format: { type: 'enum', required: false, default: 'jpeg', enum: ['jpeg', 'png'] },
      acceleration: { type: 'enum', required: false, default: 'none', enum: ['none', 'regular', 'high'] },
    },
    outputs: ['images', 'prompt', 'seed', 'has_nsfw_concepts', 'timings'],
    pricing: 0.025,
    speed: 'medium',
    features: ['high-quality', 'flexible', 'batch-generation', 'acceleration'],
    supportsBatch: true,
  },

  'fal-ai/flux-pro/v1.1-ultra': {
    id: 'fal-ai/flux-pro/v1.1-ultra',
    name: 'FLUX Pro v1.1 Ultra',
    category: 'image',
    subcategory: 'text-to-image',
    description: 'Professional-grade image generation with up to 2K resolution. Maximum quality.',
    inputs: {
      prompt: { type: 'string', required: true },
      image_size: { type: 'enum', required: false, default: 'landscape_4_3', enum: ['square_hd', 'square', 'portrait_4_3', 'portrait_16_9', 'landscape_4_3', 'landscape_16_9'] },
      num_inference_steps: { type: 'number', required: false, default: 40, min: 20, max: 100 },
      guidance_scale: { type: 'number', required: false, default: 4.0, min: 1, max: 20 },
      num_images: { type: 'number', required: false, default: 1, min: 1, max: 4 },
      seed: { type: 'number', required: false },
      enable_safety_checker: { type: 'boolean', required: false, default: true },
      output_format: { type: 'enum', required: false, default: 'png', enum: ['jpeg', 'png'] },
    },
    outputs: ['images', 'prompt', 'seed', 'has_nsfw_concepts'],
    pricing: 0.05,
    speed: 'slow',
    features: ['professional', 'ultra-high-quality', '2k-resolution'],
    supportsBatch: true,
    resolutions: ['2048x2048', '2048x1536', '1536x2048'],
  },

  'fal-ai/nano-banana-pro': {
    id: 'fal-ai/nano-banana-pro',
    name: 'Nano Banana Pro',
    category: 'image',
    subcategory: 'text-to-image',
    description: "Google's state-of-the-art model optimized for text rendering and high quality.",
    inputs: {
      prompt: { type: 'string', required: true },
      image_size: { type: 'string', required: false, default: '1024x1024' },
      num_inference_steps: { type: 'number', required: false, default: 30 },
      guidance_scale: { type: 'number', required: false, default: 7.5 },
      seed: { type: 'number', required: false },
    },
    outputs: ['images', 'prompt', 'seed'],
    pricing: 0.015,
    speed: 'medium',
    features: ['text-rendering', 'high-quality', 'google-powered'],
  },

  'fal-ai/nano-banana-2': {
    id: 'fal-ai/nano-banana-2',
    name: 'Nano Banana 2',
    category: 'image',
    subcategory: 'text-to-image',
    description: 'Next-gen image model with fast generation and high quality output.',
    inputs: {
      prompt: { type: 'string', required: true },
      aspect_ratio: { type: 'enum', required: false, default: '1:1', enum: ['1:1', '16:9', '9:16', '4:3', '3:4'] },
      resolution: { type: 'enum', required: false, default: '1K', enum: ['512', '1K', '2K'] },
      num_images: { type: 'number', required: false, default: 1, min: 1, max: 4 },
      output_format: { type: 'enum', required: false, default: 'png', enum: ['png', 'jpeg'] },
    },
    outputs: ['images', 'prompt'],
    pricing: 0.08,
    speed: 'fast',
    features: ['fast', 'high-quality', 'versatile'],
    supportsBatch: true,
  },

  'fal-ai/nano-banana-pro/img2img': {
    id: 'fal-ai/nano-banana-pro/img2img',
    name: 'Nano Banana Pro Image-to-Image',
    category: 'image',
    subcategory: 'image-to-image',
    description: 'High-fidelity image transformation and stylization.',
    inputs: {
      prompt: { type: 'string', required: true },
      image_url: { type: 'string', required: true, description: 'Source image URL' },
      strength: { type: 'number', required: false, default: 0.75, min: 0, max: 1 },
      image_size: { type: 'string', required: false, default: '1024x1024' },
      num_inference_steps: { type: 'number', required: false, default: 30 },
      guidance_scale: { type: 'number', required: false, default: 7.5 },
      seed: { type: 'number', required: false },
    },
    outputs: ['images', 'prompt', 'seed'],
    pricing: 0.018,
    speed: 'medium',
    features: ['stylization', 'image-transformation', 'high-fidelity'],
  },

  'fal-ai/flux-2-flex': {
    id: 'fal-ai/flux-2-flex',
    name: 'Flux 2 Flex',
    category: 'image',
    subcategory: 'text-to-image',
    description: 'Flexible Flux 2 variant with multi-reference editing support.',
    inputs: {
      prompt: { type: 'string', required: true },
      image_size: { type: 'enum', required: false, default: 'landscape_4_3', enum: ['square_hd', 'portrait_4_3', 'portrait_16_9', 'landscape_4_3', 'landscape_16_9'] },
      num_images: { type: 'number', required: false, default: 1, min: 1, max: 4 },
      seed: { type: 'number', required: false },
    },
    outputs: ['images', 'prompt', 'seed'],
    pricing: 0.03,
    speed: 'medium',
    features: ['multi-reference', 'editing', 'flexible'],
  },

  'fal-ai/kling-image/v3/text-to-image': {
    id: 'fal-ai/kling-image/v3/text-to-image',
    name: 'Kling V3 Image',
    category: 'image',
    subcategory: 'text-to-image',
    description: 'Latest Kling image generation with improved quality and coherence.',
    inputs: {
      prompt: { type: 'string', required: true },
      aspect_ratio: { type: 'enum', required: false, default: '16:9', enum: ['1:1', '16:9', '9:16', '4:3'] },
    },
    outputs: ['images', 'prompt'],
    pricing: 0.04,
    speed: 'medium',
    features: ['high-quality', 'coherent'],
  },

  'fal-ai/kling-image/o3/text-to-image': {
    id: 'fal-ai/kling-image/o3/text-to-image',
    name: 'Kling Omni 3 Image',
    category: 'image',
    subcategory: 'text-to-image',
    description: 'Kling Omni 3 premium image generation with multi-shot storyboarding.',
    inputs: {
      prompt: { type: 'string', required: true },
      aspect_ratio: { type: 'enum', required: false, default: '16:9', enum: ['1:1', '16:9', '9:16'] },
    },
    outputs: ['images', 'prompt'],
    pricing: 0.05,
    speed: 'medium',
    features: ['premium-quality', 'multi-shot', 'storyboarding'],
  },

  'fal-ai/recraft/v3/text-to-image': {
    id: 'fal-ai/recraft/v3/text-to-image',
    name: 'Recraft V3',
    category: 'image',
    subcategory: 'text-to-image',
    description: 'SOTA for typography, branding, and vector-style art generation.',
    inputs: {
      prompt: { type: 'string', required: true },
      image_size: { type: 'enum', required: false, default: 'landscape_4_3', enum: ['square_hd', 'portrait_4_3', 'landscape_4_3', 'landscape_16_9'] },
    },
    outputs: ['images', 'prompt'],
    pricing: 0.05,
    speed: 'medium',
    features: ['typography', 'brand-style', 'vector-art'],
  },

  'fal-ai/qwen-image': {
    id: 'fal-ai/qwen-image',
    name: 'Qwen Image',
    category: 'image',
    subcategory: 'text-to-image',
    description: 'Complex text rendering and detailed scene composition.',
    inputs: {
      prompt: { type: 'string', required: true },
      image_size: { type: 'enum', required: false, default: 'landscape_4_3', enum: ['square_hd', 'portrait_4_3', 'landscape_4_3', 'landscape_16_9'] },
    },
    outputs: ['images', 'prompt'],
    pricing: 0.03,
    speed: 'medium',
    features: ['text-rendering', 'detailed', 'scene-composition'],
  },

  'fal-ai/ideogram/v3': {
    id: 'fal-ai/ideogram/v3',
    name: 'Ideogram V3',
    category: 'image',
    subcategory: 'text-to-image',
    description: 'Best-in-class typography and text-in-image generation.',
    inputs: {
      prompt: { type: 'string', required: true },
      aspect_ratio: { type: 'enum', required: false, default: '16:9', enum: ['1:1', '16:9', '9:16', '4:3'] },
    },
    outputs: ['images', 'prompt'],
    pricing: 0.05,
    speed: 'medium',
    features: ['typography', 'text-in-image', 'design'],
  },

  'fal-ai/imagen4/preview': {
    id: 'fal-ai/imagen4/preview',
    name: 'Imagen 4',
    category: 'image',
    subcategory: 'text-to-image',
    description: "Google's latest Imagen 4 image generation model.",
    inputs: {
      prompt: { type: 'string', required: true },
      aspect_ratio: { type: 'enum', required: false, default: '16:9', enum: ['1:1', '16:9', '9:16', '4:3'] },
    },
    outputs: ['images', 'prompt'],
    pricing: 0.04,
    speed: 'medium',
    features: ['google-powered', 'high-quality', 'latest'],
  },

  'fal-ai/gpt-image-1-mini': {
    id: 'fal-ai/gpt-image-1-mini',
    name: 'GPT Image 1 Mini',
    category: 'image',
    subcategory: 'text-to-image',
    description: 'Fast, affordable OpenAI image generation.',
    inputs: {
      prompt: { type: 'string', required: true },
      aspect_ratio: { type: 'enum', required: false, default: '16:9', enum: ['1:1', '16:9', '9:16'] },
    },
    outputs: ['images', 'prompt'],
    pricing: 0.02,
    speed: 'fast',
    features: ['fast', 'affordable', 'openai-powered'],
  },

  'fal-ai/flux-kontext-lora': {
    id: 'fal-ai/flux-kontext-lora',
    name: 'Flux Kontext',
    category: 'image',
    subcategory: 'image-to-image',
    description: 'In-context style editing with LoRA support.',
    inputs: {
      prompt: { type: 'string', required: true },
      image_url: { type: 'string', required: true },
    },
    outputs: ['images', 'prompt'],
    pricing: 0.04,
    speed: 'medium',
    features: ['style-editing', 'lora-support', 'in-context'],
  },

  'fal-ai/bytedance/seedream/v4.5/image-to-image': {
    id: 'fal-ai/bytedance/seedream/v4.5/image-to-image',
    name: 'Seedream v4.5 Edit',
    category: 'image',
    subcategory: 'image-to-image',
    description: 'ByteDance Seedream image-to-image editing with text rendering.',
    inputs: {
      prompt: { type: 'string', required: true },
      image_url: { type: 'string', required: true },
    },
    outputs: ['images', 'prompt'],
    pricing: 0.04,
    speed: 'fast',
    features: ['editing', 'text-rendering', 'fast'],
  },

  'fal-ai/face-swap': {
    id: 'fal-ai/face-swap',
    name: 'Face Swap',
    category: 'image',
    subcategory: 'image-to-image',
    description: 'Swap faces between images with high fidelity.',
    inputs: {
      source_image_url: { type: 'string', required: true },
      target_image_url: { type: 'string', required: true },
    },
    outputs: ['image_url'],
    pricing: 0.02,
    speed: 'fast',
    features: ['face-swap', 'high-fidelity'],
  },

  // ==================== VIDEO GENERATION ====================

  'fal-ai/kling/v2.6/pro/text-to-video': {
    id: 'fal-ai/kling/v2.6/pro/text-to-video',
    name: 'Kling 2.6 Pro Text-to-Video',
    category: 'video',
    subcategory: 'text-to-video',
    description: 'Top-tier cinematic video generation with native audio and fluid motion.',
    inputs: {
      prompt: { type: 'string', required: true },
      duration: { type: 'number', required: false, default: 5, min: 1, max: 10 },
      aspect_ratio: { type: 'enum', required: false, default: '16:9', enum: ['16:9', '9:16', '1:1'] },
      num_frames: { type: 'number', required: false },
      num_inference_steps: { type: 'number', required: false, default: 30 },
      guidance_scale: { type: 'number', required: false, default: 7.5 },
      include_audio: { type: 'boolean', required: false, default: false },
      seed: { type: 'number', required: false },
    },
    outputs: ['video_url', 'audio_url', 'prompt', 'duration'],
    pricing: 0.10,
    speed: 'slow',
    features: ['cinematic', 'native-audio', 'high-quality', 'fluid-motion'],
    supportsAudio: true,
    maxDuration: 10,
  },

  'fal-ai/kling/v2.6/pro/image-to-video': {
    id: 'fal-ai/kling/v2.6/pro/image-to-video',
    name: 'Kling 2.6 Pro Image-to-Video',
    category: 'video',
    subcategory: 'image-to-video',
    description: 'Professional cinematic motion from static images with audio support.',
    inputs: {
      prompt: { type: 'string', required: false },
      image_url: { type: 'string', required: true },
      duration: { type: 'number', required: false, default: 5, min: 1, max: 10 },
      num_frames: { type: 'number', required: false },
      num_inference_steps: { type: 'number', required: false, default: 30 },
      guidance_scale: { type: 'number', required: false, default: 7.5 },
      motion_strength: { type: 'number', required: false, default: 0.75, min: 0, max: 1 },
      include_audio: { type: 'boolean', required: false, default: false },
      seed: { type: 'number', required: false },
    },
    outputs: ['video_url', 'audio_url', 'prompt', 'duration'],
    pricing: 0.10,
    speed: 'slow',
    features: ['cinematic', 'native-audio', 'professional-quality', 'motion-control'],
    supportsAudio: true,
    maxDuration: 10,
  },

  'fal-ai/veo3': {
    id: 'fal-ai/veo3',
    name: 'Google Veo 3',
    category: 'video',
    subcategory: 'text-to-video',
    description: "Google's most advanced AI video generation model with sound capabilities.",
    inputs: {
      prompt: { type: 'string', required: true },
      duration: { type: 'number', required: false, default: 5, min: 1, max: 8 },
      aspect_ratio: { type: 'enum', required: false, default: '16:9', enum: ['16:9', '9:16', '1:1'] },
      include_audio: { type: 'boolean', required: false, default: true },
      seed: { type: 'number', required: false },
    },
    outputs: ['video_url', 'audio_url', 'prompt'],
    pricing: 0.12,
    speed: 'slow',
    features: ['state-of-the-art', 'native-audio', 'google-powered'],
    supportsAudio: true,
    maxDuration: 8,
  },

  'fal-ai/sora-2/pro': {
    id: 'fal-ai/sora-2/pro',
    name: 'OpenAI Sora 2 Pro',
    category: 'video',
    subcategory: 'text-to-video',
    description: "OpenAI's groundbreaking video generation model with detailed, dynamic clips.",
    inputs: {
      prompt: { type: 'string', required: true },
      duration: { type: 'number', required: false, default: 5, min: 1, max: 20 },
      aspect_ratio: { type: 'enum', required: false, default: '16:9', enum: ['16:9', '9:16', '1:1', '4:3'] },
      include_audio: { type: 'boolean', required: false, default: false },
      seed: { type: 'number', required: false },
    },
    outputs: ['video_url', 'audio_url', 'prompt', 'duration'],
    pricing: 0.15,
    speed: 'slow',
    features: ['openai-powered', 'long-duration', 'dynamic', 'detailed'],
    supportsAudio: true,
    maxDuration: 20,
  },

  'fal-ai/hunyuan-video-v1.5/text-to-video': {
    id: 'fal-ai/hunyuan-video-v1.5/text-to-video',
    name: 'Hunyuan Video 1.5',
    category: 'video',
    subcategory: 'text-to-video',
    description: 'Tencent Hunyuan Video 1.5 - high quality text-to-video generation.',
    inputs: {
      prompt: { type: 'string', required: true },
      aspect_ratio: { type: 'enum', required: false, default: '16:9', enum: ['16:9', '9:16', '1:1'] },
    },
    outputs: ['video_url', 'prompt'],
    pricing: 0.40,
    speed: 'slow',
    features: ['high-quality', 'tencent-powered'],
    maxDuration: 8,
  },

  'fal-ai/hunyuan-video-image-to-video': {
    id: 'fal-ai/hunyuan-video-image-to-video',
    name: 'Hunyuan Video I2V',
    category: 'video',
    subcategory: 'image-to-video',
    description: 'Tencent Hunyuan image-to-video generation.',
    inputs: {
      prompt: { type: 'string', required: true },
      image_url: { type: 'string', required: true },
    },
    outputs: ['video_url', 'prompt'],
    pricing: 0.40,
    speed: 'slow',
    features: ['image-to-video', 'high-quality'],
    maxDuration: 8,
  },

  'fal-ai/vidu/q2/text-to-video': {
    id: 'fal-ai/vidu/q2/text-to-video',
    name: 'Vidu Q2 Text-to-Video',
    category: 'video',
    subcategory: 'text-to-video',
    description: 'Latest Vidu Q2 model - high quality text-to-video generation.',
    inputs: {
      prompt: { type: 'string', required: true },
      duration: { type: 'number', required: false, default: 5, min: 1, max: 8 },
    },
    outputs: ['video_url', 'prompt'],
    pricing: 0.35,
    speed: 'medium',
    features: ['high-quality', 'fast'],
    maxDuration: 8,
  },

  'fal-ai/vidu/reference-to-video': {
    id: 'fal-ai/vidu/reference-to-video',
    name: 'Vidu Reference-to-Video',
    category: 'video',
    subcategory: 'image-to-video',
    description: 'Vidu reference-based video generation with subject consistency.',
    inputs: {
      prompt: { type: 'string', required: true },
      image_url: { type: 'string', required: true },
    },
    outputs: ['video_url', 'prompt'],
    pricing: 0.35,
    speed: 'medium',
    features: ['reference-based', 'subject-consistency'],
    maxDuration: 8,
  },

  'fal-ai/vidu/start-end-to-video': {
    id: 'fal-ai/vidu/start-end-to-video',
    name: 'Vidu Start-End Video',
    category: 'video',
    subcategory: 'image-to-video',
    description: 'Keyframe interpolation - generate video from start and end frames.',
    inputs: {
      prompt: { type: 'string', required: true },
      start_image_url: { type: 'string', required: true },
      end_image_url: { type: 'string', required: true },
    },
    outputs: ['video_url', 'prompt'],
    pricing: 0.35,
    speed: 'medium',
    features: ['interpolation', 'keyframe', 'creative'],
    maxDuration: 8,
  },

  'fal-ai/cogvideox-5b': {
    id: 'fal-ai/cogvideox-5b',
    name: 'CogVideoX 5B',
    category: 'video',
    subcategory: 'text-to-video',
    description: 'Open-source 5B parameter video model - affordable and high fidelity.',
    inputs: {
      prompt: { type: 'string', required: true },
    },
    outputs: ['video_url', 'prompt'],
    pricing: 0.20,
    speed: 'medium',
    features: ['open-source', 'affordable'],
  },

  'fal-ai/mochi-v1': {
    id: 'fal-ai/mochi-v1',
    name: 'Mochi v1',
    category: 'video',
    subcategory: 'text-to-video',
    description: 'Genmo Mochi - open-source 10B parameter model with high fidelity motion.',
    inputs: {
      prompt: { type: 'string', required: true },
    },
    outputs: ['video_url', 'prompt'],
    pricing: 0.25,
    speed: 'medium',
    features: ['open-source', 'high-fidelity', '10b-params'],
  },

  'fal-ai/wan/v2.2-a14b/text-to-video': {
    id: 'fal-ai/wan/v2.2-a14b/text-to-video',
    name: 'WAN v2.2 Text-to-Video',
    category: 'video',
    subcategory: 'text-to-video',
    description: 'Alibaba WAN 14B parameter text-to-video generation.',
    inputs: {
      prompt: { type: 'string', required: true },
      aspect_ratio: { type: 'enum', required: false, default: '16:9', enum: ['16:9', '9:16', '1:1'] },
    },
    outputs: ['video_url', 'prompt'],
    pricing: 0.30,
    speed: 'medium',
    features: ['high-quality', 'alibaba-powered', '14b-params'],
  },

  // ==================== AUDIO GENERATION ====================

  'fal-ai/chatterbox': {
    id: 'fal-ai/chatterbox',
    name: 'Chatterbox TTS',
    category: 'audio',
    subcategory: 'text-to-speech',
    description: 'Expressive voice generation for media production.',
    inputs: {
      text: { type: 'string', required: true },
      voice: { type: 'string', required: false },
      speed: { type: 'number', required: false, default: 1.0, min: 0.5, max: 2.0 },
      pitch: { type: 'number', required: false, default: 0, min: -12, max: 12 },
      emotion: { type: 'enum', required: false, default: 'neutral', enum: ['neutral', 'happy', 'sad', 'angry', 'excited'] },
      output_format: { type: 'enum', required: false, default: 'mp3', enum: ['mp3', 'wav', 'ogg'] },
    },
    outputs: ['audio_url', 'text', 'duration'],
    pricing: 0.001,
    speed: 'fast',
    features: ['expressive', 'emotion-control', 'multi-format'],
  },

  'fal-ai/chatterbox/speech-to-speech': {
    id: 'fal-ai/chatterbox/speech-to-speech',
    name: 'Chatterbox Speech-to-Speech',
    category: 'audio',
    subcategory: 'speech-to-speech',
    description: 'Transform speech while matching a target voice reference.',
    inputs: {
      source_audio_url: { type: 'string', required: true },
      target_voice_audio_url: { type: 'string', required: false },
    },
    outputs: ['audio'],
    pricing: 0.002,
    speed: 'fast',
    features: ['speech-to-speech', 'voice-transfer', 'reference-audio'],
  },

  'fal-ai/stable-audio-25/text-to-audio': {
    id: 'fal-ai/stable-audio-25/text-to-audio',
    name: 'Stable Audio 2.5',
    category: 'audio',
    subcategory: 'text-to-audio',
    description: 'Convert text descriptions into natural-sounding audio.',
    inputs: {
      prompt: { type: 'string', required: true },
      seconds_total: { type: 'number', required: false, default: 60, min: 1, max: 180 },
      output_format: { type: 'enum', required: false, default: 'wav', enum: ['wav', 'mp3'] },
    },
    outputs: ['audio_url', 'prompt', 'duration'],
    pricing: 0.002,
    speed: 'medium',
    features: ['natural-sounding', 'flexible-duration'],
  },

  'fal-ai/beatoven/music-generation': {
    id: 'fal-ai/beatoven/music-generation',
    name: 'Beatoven Music Generation',
    category: 'audio',
    subcategory: 'music-generation',
    description: 'Royalty-free instrumental music composition.',
    inputs: {
      prompt: { type: 'string', required: true },
      duration: { type: 'number', required: false, default: 60, min: 10, max: 300 },
      genre: { type: 'string', required: false },
      mood: { type: 'string', required: false },
      tempo: { type: 'number', required: false },
      output_format: { type: 'enum', required: false, default: 'mp3', enum: ['mp3', 'wav'] },
    },
    outputs: ['audio_url', 'prompt', 'duration', 'metadata'],
    pricing: 0.005,
    speed: 'medium',
    features: ['royalty-free', 'customizable', 'instrumental'],
  },

  // ==================== 3D GENERATION ====================

  'fal-ai/trellis-2': {
    id: 'fal-ai/trellis-2',
    name: 'Trellis 2',
    category: '3d',
    subcategory: 'image-to-3d',
    description: 'High-quality 3D model generation from images.',
    inputs: {
      image_url: { type: 'string', required: true },
      output_format: { type: 'enum', required: false, default: 'gltf', enum: ['obj', 'fbx', 'gltf', 'usdz'] },
      texture_resolution: { type: 'number', required: false, default: 2048 },
      generate_pbr: { type: 'boolean', required: false, default: true },
    },
    outputs: ['model_url', 'texture_url', 'normal_map_url', 'roughness_map_url', 'metallic_map_url'],
    pricing: 0.08,
    speed: 'slow',
    features: ['high-quality', 'pbr-materials', 'multi-format'],
  },

  'fal-ai/hunyuan3d-v3/image-to-3d': {
    id: 'fal-ai/hunyuan3d-v3/image-to-3d',
    name: 'Hunyuan3D v3 Image-to-3D',
    category: '3d',
    subcategory: 'image-to-3d',
    description: 'Photo-to-3D conversion with PBR textures, Unity/Unreal ready.',
    inputs: {
      image_url: { type: 'string', required: true },
      output_format: { type: 'enum', required: false, default: 'gltf', enum: ['obj', 'fbx', 'gltf', 'usdz'] },
      texture_resolution: { type: 'number', required: false, default: 2048 },
    },
    outputs: ['model_url', 'texture_url', 'format'],
    pricing: 0.07,
    speed: 'medium',
    features: ['pbr-textures', 'game-ready', 'production-quality'],
  },

  // ==================== AVATAR & ANIMATION ====================

  'fal-ai/kling/ai-avatar/v2/pro': {
    id: 'fal-ai/kling/ai-avatar/v2/pro',
    name: 'Kling AI Avatar v2 Pro',
    category: 'avatar',
    subcategory: 'avatar-generation',
    description: 'Realistic character videos with humans, animals, cartoons, or stylized characters.',
    inputs: {
      image_url: { type: 'string', required: true },
      audio_url: { type: 'string', required: false },
      text: { type: 'string', required: false },
      num_frames: { type: 'number', required: false, default: 129 },
      num_inference_steps: { type: 'number', required: false, default: 30 },
      turbo_mode: { type: 'boolean', required: false, default: true },
    },
    outputs: ['video_url', 'audio_url'],
    pricing: 0.06,
    speed: 'medium',
    features: ['realistic', 'multi-character-type', 'turbo-mode'],
    supportsAudio: true,
  },

  'fal-ai/live-avatar': {
    id: 'fal-ai/live-avatar',
    name: 'Live Avatar',
    category: 'avatar',
    subcategory: 'real-time-avatar',
    description: 'Real-time avatar generation for natural face-to-face AI conversations.',
    inputs: {
      image_url: { type: 'string', required: true },
      audio_stream: { type: 'string', required: false, description: 'WebSocket audio stream' },
    },
    outputs: ['video_stream', 'audio_stream'],
    pricing: 0.001, // per second
    speed: 'fast',
    features: ['real-time', 'websocket', 'streaming', 'interactive'],
    supportsAudio: true,
  },

  // ==================== UTILITY & ANALYSIS ====================

  'fal-ai/birefnet': {
    id: 'fal-ai/birefnet',
    name: 'BiRefNet Background Removal',
    category: 'utility',
    subcategory: 'background-removal',
    description: 'Clean background separation from images.',
    inputs: {
      image_url: { type: 'string', required: true },
    },
    outputs: ['image_url'],
    pricing: 0.001,
    speed: 'fast',
    features: ['fast', 'clean-separation', 'transparent-output'],
  },

  'fal-ai/topaz/image-upscale': {
    id: 'fal-ai/topaz/image-upscale',
    name: 'Topaz Image Upscale',
    category: 'utility',
    subcategory: 'image-upscaling',
    description: 'Professional image enhancement and upscaling.',
    inputs: {
      image_url: { type: 'string', required: true },
      scale: { type: 'number', required: false, default: 2, min: 2, max: 4 },
    },
    outputs: ['image_url', 'width', 'height'],
    pricing: 0.002,
    speed: 'medium',
    features: ['professional', 'quality-enhancement', 'up-to-4x'],
  },

  'fal-ai/esrgan': {
    id: 'fal-ai/esrgan',
    name: 'ESRGAN Upscale',
    category: 'utility',
    subcategory: 'image-upscaling',
    description: 'Fast and affordable image upscaling with ESRGAN.',
    inputs: {
      image_url: { type: 'string', required: true },
      scale: { type: 'number', required: false, default: 2, min: 2, max: 4 },
    },
    outputs: ['image_url'],
    pricing: 0.001,
    speed: 'fast',
    features: ['fast', 'affordable', 'standard-upscaling'],
  },

  'fal-ai/image-preprocessors/depth-anything/v2': {
    id: 'fal-ai/image-preprocessors/depth-anything/v2',
    name: 'Depth Anything v2',
    category: 'utility',
    subcategory: 'depth-estimation',
    description: 'Latest depth estimation model with improved accuracy and detail.',
    inputs: {
      image_url: { type: 'string', required: true },
    },
    outputs: ['image_url'],
    pricing: 0.001,
    speed: 'fast',
    features: ['depth-estimation', 'high-accuracy', 'latest'],
  },

  'fal-ai/sync-lipsync/v2/pro': {
    id: 'fal-ai/sync-lipsync/v2/pro',
    name: 'Sync Lipsync v2 Pro',
    category: 'utility',
    subcategory: 'lip-sync',
    description: 'Audio-to-video lip synchronization for dubbing.',
    inputs: {
      video_url: { type: 'string', required: true },
      audio_url: { type: 'string', required: true },
      sync_mode: { type: 'enum', required: false, default: 'sync_1.7.1-beta', enum: ['sync_1.7.1-beta', 'sync_1.6.0'] },
      static: { type: 'boolean', required: false, default: false },
      fps: { type: 'number', required: false, default: 25 },
    },
    outputs: ['video_url'],
    pricing: 0.10,
    speed: 'medium',
    features: ['professional', 'high-quality-sync', 'dubbing'],
  },

  // ==================== TRAINING ====================

  'fal-ai/flux-lora/fast-training': {
    id: 'fal-ai/flux-lora/fast-training',
    name: 'FLUX LoRA Fast Training',
    category: 'training',
    subcategory: 'lora-training',
    description: 'Speed-optimized style training for FLUX models.',
    inputs: {
      training_images: { type: 'array', required: true, description: 'URLs of training images' },
      trigger_word: { type: 'string', required: false },
      num_epochs: { type: 'number', required: false, default: 10 },
      learning_rate: { type: 'number', required: false, default: 0.0001 },
      batch_size: { type: 'number', required: false, default: 1 },
      resolution: { type: 'number', required: false, default: 1024 },
      output_name: { type: 'string', required: false },
    },
    outputs: ['lora_url', 'trigger_word', 'training_metrics'],
    pricing: 0.50, // per training session
    speed: 'medium',
    features: ['fast-training', 'custom-styles', 'lora-generation'],
  },
};

/**
 * Get models by category
 */
export function getModelsByCategory(category: ModelCategory): ModelConfig[] {
  return Object.values(FAL_MODEL_REGISTRY).filter(model => model.category === category);
}

/**
 * Get models by subcategory
 */
export function getModelsBySubcategory(subcategory: string): ModelConfig[] {
  return Object.values(FAL_MODEL_REGISTRY).filter(model => model.subcategory === subcategory);
}

/**
 * Get model by ID
 */
export function getModel(id: string): ModelConfig | undefined {
  return FAL_MODEL_REGISTRY[id];
}

/**
 * Search models by features
 */
export function searchModelsByFeature(feature: string): ModelConfig[] {
  return Object.values(FAL_MODEL_REGISTRY).filter(model =>
    model.features.includes(feature)
  );
}

/**
 * Get models by pricing tier
 */
export function getModelsByPricingTier(tier: 'budget' | 'mid' | 'premium'): ModelConfig[] {
  const ranges = {
    budget: { min: 0, max: 0.01 },
    mid: { min: 0.01, max: 0.05 },
    premium: { min: 0.05, max: Infinity },
  };

  const range = ranges[tier];
  return Object.values(FAL_MODEL_REGISTRY).filter(
    model => model.pricing >= range.min && model.pricing < range.max
  );
}

/**
 * Get required inputs for a model
 */
export function getRequiredInputs(modelId: string): string[] {
  const model = getModel(modelId);
  if (!model) return [];

  return Object.entries(model.inputs)
    .filter(([_, config]) => config.required)
    .map(([name, _]) => name);
}

/**
 * Get optional inputs for a model
 */
export function getOptionalInputs(modelId: string): Record<string, ModelInput> {
  const model = getModel(modelId);
  if (!model) return {};

  return Object.fromEntries(
    Object.entries(model.inputs).filter(([_, config]) => !config.required)
  );
}

/**
 * Validate inputs for a model
 */
export function validateInputs(
  modelId: string,
  inputs: Record<string, any>
): { valid: boolean; errors: string[] } {
  const model = getModel(modelId);
  if (!model) {
    return { valid: false, errors: [`Model ${modelId} not found`] };
  }

  const errors: string[] = [];
  const requiredInputs = getRequiredInputs(modelId);

  // Check required inputs
  for (const required of requiredInputs) {
    if (!(required in inputs)) {
      errors.push(`Missing required input: ${required}`);
    }
  }

  // Validate input types and ranges
  for (const [name, value] of Object.entries(inputs)) {
    const inputConfig = model.inputs[name];
    if (!inputConfig) {
      errors.push(`Unknown input: ${name}`);
      continue;
    }

    // Type validation
    const actualType = Array.isArray(value) ? 'array' : typeof value;
    if (inputConfig.type === 'enum') {
      if (!inputConfig.enum?.includes(value)) {
        errors.push(`Invalid value for ${name}. Must be one of: ${inputConfig.enum?.join(', ')}`);
      }
    } else if (actualType !== inputConfig.type && value !== null) {
      errors.push(`Invalid type for ${name}. Expected ${inputConfig.type}, got ${actualType}`);
    }

    // Range validation for numbers
    if (inputConfig.type === 'number' && typeof value === 'number') {
      if (inputConfig.min !== undefined && value < inputConfig.min) {
        errors.push(`${name} must be >= ${inputConfig.min}`);
      }
      if (inputConfig.max !== undefined && value > inputConfig.max) {
        errors.push(`${name} must be <= ${inputConfig.max}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get all available categories
 */
export function getAllCategories(): ModelCategory[] {
  return Array.from(new Set(Object.values(FAL_MODEL_REGISTRY).map(m => m.category)));
}

/**
 * Get all available subcategories for a category
 */
export function getSubcategoriesForCategory(category: ModelCategory): string[] {
  return Array.from(
    new Set(
      Object.values(FAL_MODEL_REGISTRY)
        .filter(m => m.category === category)
        .map(m => m.subcategory)
    )
  );
}

/**
 * Get model recommendations based on use case
 */
export function getRecommendedModels(useCase: {
  category: ModelCategory;
  speed?: ModelSpeed;
  maxPricing?: number;
  features?: string[];
}): ModelConfig[] {
  let models = getModelsByCategory(useCase.category);

  if (useCase.speed) {
    models = models.filter(m => m.speed === useCase.speed);
  }

  if (useCase.maxPricing !== undefined) {
    models = models.filter(m => m.pricing <= useCase.maxPricing);
  }

  if (useCase.features && useCase.features.length > 0) {
    models = models.filter(m =>
      useCase.features!.some(feature => m.features.includes(feature))
    );
  }

  // Sort by pricing (cheaper first) and speed (faster first)
  return models.sort((a, b) => {
    const speedPriority = { fast: 0, medium: 1, slow: 2 };
    return a.pricing - b.pricing || speedPriority[a.speed] - speedPriority[b.speed];
  });
}
