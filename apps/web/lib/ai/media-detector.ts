import type { MediaRequest, MediaType } from "@/types/media";

interface ParsedImageRequest {
  imagePrompt: string;
  appActions: string[];
  confidence: number;
}

const IMAGE_KEYWORDS = [
  "generate image",
  "create image",
  "make image",
  "make a picture",
  "show me an image",
  "show me a picture",
  "show me a photo",
  "illustration",
  "artwork",
  "drawing",
  "render an image",
  "graphic design image",
  "logo design image",
  "icon image",
  "banner image",
  "thumbnail image",
];

// UI/UX Design keywords that should NOT trigger image generation
const UI_DESIGN_KEYWORDS = [
  "ui design",
  "ux design",
  "web design",
  "app design",
  "interface design",
  "user interface",
  "user experience",
  "component design",
  "page design",
  "layout design",
  "responsive design",
  "mobile design",
  "desktop design",
  "dashboard design",
];

const VIDEO_KEYWORDS = [
  "video",
  "animation",
  "animated",
  "moving",
  "clip",
  "footage",
  "generate video",
  "create video",
  "make video",
  "movie",
  "motion",
];

const AUDIO_KEYWORDS = [
  "audio",
  "voice",
  "speak",
  "say",
  "read",
  "narrate",
  "speech",
  "sound",
  "voiceover",
  "voice over",
  "tts",
  "text to speech",
  "say this",
  "read this",
];

const EXPLICIT_PATTERNS = [
  /generate (an? )?(image|picture|photo|video|audio)/i,
  /create (an? )?(image|picture|photo|video|audio)/i,
  /make (an? )?(image|picture|photo|video|audio)/i,
  /show me (an? )?(image|picture|photo)/i,
  /(image|picture|photo|video|audio) of/i,
];

const STYLE_KEYWORDS = {
  photorealistic: ["photorealistic", "realistic", "photo", "photograph"],
  cartoon: ["cartoon", "animated", "anime", "comic"],
  artistic: ["artistic", "painting", "watercolor", "oil painting", "sketch"],
  modern: ["modern", "minimalist", "clean", "contemporary"],
  vintage: ["vintage", "retro", "old", "classic"],
};

/**
 * Detects if a message is requesting media generation
 */
export function detectMediaRequest(message: string): MediaRequest {
  const lowerMessage = message.toLowerCase().trim();

  if (!message || message.length < 3) {
    return {
      type: null,
      confidence: 0,
      keywords: [],
      originalMessage: message,
    };
  }

  // FIRST: Check if this is a UI/UX design request (NOT media generation)
  const isUIDesignRequest = UI_DESIGN_KEYWORDS.some(keyword => lowerMessage.includes(keyword));
  if (isUIDesignRequest) {
    // Return null - this is NOT a media generation request
    return {
      type: null,
      confidence: 0,
      keywords: [],
      originalMessage: message,
    };
  }

  // Check for explicit patterns first
  const isExplicit = EXPLICIT_PATTERNS.some(pattern => pattern.test(message));

  // Count keyword matches for each type
  const imageMatches = IMAGE_KEYWORDS.filter(k => lowerMessage.includes(k)).length;
  const videoMatches = VIDEO_KEYWORDS.filter(k => lowerMessage.includes(k)).length;
  const audioMatches = AUDIO_KEYWORDS.filter(k => lowerMessage.includes(k)).length;

  // Determine type based on matches
  let type: MediaType | null = null;
  let maxMatches = 0;
  const allKeywords: string[] = [];

  if (imageMatches > maxMatches) {
    type = "image";
    maxMatches = imageMatches;
    allKeywords.push(...IMAGE_KEYWORDS.filter(k => lowerMessage.includes(k)));
  }

  if (videoMatches > maxMatches) {
    type = "video";
    maxMatches = videoMatches;
    allKeywords.length = 0;
    allKeywords.push(...VIDEO_KEYWORDS.filter(k => lowerMessage.includes(k)));
  }

  if (audioMatches > maxMatches) {
    type = "audio";
    maxMatches = audioMatches;
    allKeywords.length = 0;
    allKeywords.push(...AUDIO_KEYWORDS.filter(k => lowerMessage.includes(k)));
  }

  // If no type detected, return null
  if (!type) {
    return {
      type: null,
      confidence: 0,
      keywords: [],
      originalMessage: message,
    };
  }

  // Calculate confidence
  let confidence = 0;

  if (isExplicit) {
    confidence = 0.95; // Very high confidence for explicit requests
  } else if (maxMatches >= 2) {
    confidence = 0.85; // Multiple keywords
  } else if (maxMatches === 1) {
    // Single keyword - check context
    const hasDescriptiveWords = /\b(of|with|showing|featuring|depicting)\b/i.test(message);
    confidence = hasDescriptiveWords ? 0.75 : 0.6;
  }

  // Boost confidence if message is short and focused
  if (message.split(" ").length <= 10 && maxMatches >= 1) {
    confidence = Math.min(0.95, confidence + 0.1);
  }

  // Extract subject (words after "of", "with", "showing", etc.)
  let subject: string | undefined;
  const subjectMatch = message.match(/(?:of|with|showing|featuring|depicting)\s+(.+?)(?:\.|$|,)/i);
  if (subjectMatch) {
    subject = subjectMatch[1].trim();
  } else {
    // Try to extract after the media keyword
    const afterKeyword = allKeywords[0] ? lowerMessage.split(allKeywords[0])[1] : null;
    if (afterKeyword) {
      subject = afterKeyword.trim().replace(/^(of|with|a|an|the)\s+/i, "").trim();
    }
  }

  // Detect style
  let style: string | undefined;
  for (const [styleName, keywords] of Object.entries(STYLE_KEYWORDS)) {
    if (keywords.some(k => lowerMessage.includes(k))) {
      style = styleName;
      break;
    }
  }

  // Extract details (everything that's not the media keyword)
  const details = subject || message
    .replace(new RegExp(allKeywords.join("|"), "gi"), "")
    .replace(/generate|create|make|show me/gi, "")
    .trim();

  return {
    type,
    confidence,
    subject,
    style,
    details: details || subject,
    keywords: allKeywords,
    originalMessage: message,
  };
}

/**
 * Generates a refined prompt for media generation
 */
export function refineMediaPrompt(request: MediaRequest): string {
  if (!request.details) {
    return request.originalMessage;
  }

  let prompt = request.details;

  // Add style if detected
  if (request.style && !prompt.toLowerCase().includes(request.style)) {
    prompt = `${prompt}, ${request.style} style`;
  }

  // Add quality enhancers for images
  if (request.type === "image") {
    if (!prompt.toLowerCase().includes("quality") && !prompt.toLowerCase().includes("detailed")) {
      prompt = `${prompt}, high quality, detailed`;
    }
  }

  return prompt.trim();
}

/**
 * Uses fal's cheap LLM to intelligently parse image generation requests
 * Separates image description from app actions
 */
export async function parseImageRequestWithLLM(message: string): Promise<ParsedImageRequest> {
  try {
    const response = await fetch("/api/media/parse-prompt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      throw new Error("Failed to parse prompt with LLM");
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error parsing image request with LLM:", error);

    // Fallback to basic parsing
    return {
      imagePrompt: message,
      appActions: [],
      confidence: 0.5,
    };
  }
}
