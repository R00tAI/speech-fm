export type MediaType = "image" | "video" | "audio";

export interface MediaRequest {
  type: MediaType | null;
  confidence: number; // 0-1
  subject?: string;
  style?: string;
  details?: string;
  keywords: string[];
  originalMessage: string;
}

export interface ImageGenerationOptions {
  prompt: string;
  model: "flux/schnell" | "flux/dev";
  size?: "square_hd" | "square" | "portrait_4_3" | "portrait_16_9" | "landscape_4_3" | "landscape_16_9";
  steps?: number;
}

export interface VideoGenerationOptions {
  prompt: string;
}

export interface AudioGenerationOptions {
  text: string;
  voice: "rachel" | "drew" | "clyde" | "paul" | "antoni" | "josh" | "arnold" | "adam" | "sam";
}

export type MediaGenerationOptions =
  | ImageGenerationOptions
  | VideoGenerationOptions
  | AudioGenerationOptions;

export interface GenerationStatus {
  status: "idle" | "queued" | "generating" | "complete" | "error";
  progress?: number; // 0-100
  estimatedTime?: number; // seconds
  message?: string;
  result?: {
    type: MediaType;
    url: string;
    prompt?: string;
  };
  error?: string;
}

export interface ModelInfo {
  id: string;
  name: string;
  description: string;
  speed: string;
  quality: string;
  recommended?: boolean;
}
