/**
 * Tracked ElevenLabs Client
 *
 * Wraps ElevenLabs TTS API with automatic cost tracking.
 */

import { getUserIdOptional, getRequestId } from './request-context';

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1/text-to-speech';

export interface TTSOptions {
  text: string;
  voiceId: string;
  model?: string;
  voiceSettings?: {
    stability?: number;
    similarity_boost?: number;
    style?: number;
    use_speaker_boost?: boolean;
  };
}

export interface TTSResult {
  audio: ArrayBuffer;
  characterCount: number;
}

/**
 * Track TTS usage after successful generation
 */
async function trackTTSUsage(
  model: string,
  characters: number,
  endpoint: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const userId = getUserIdOptional();
  if (!userId) {
    console.debug('[ElevenLabs] Skipping tracking - no user context');
    return;
  }

  try {
    const { trackCharacterUsage } = await import('@/lib/services/cost-tracking.service');
    await trackCharacterUsage({
      userId,
      provider: 'elevenlabs',
      model,
      service: 'tts',
      endpoint,
      characters,
      requestId: getRequestId() ?? undefined,
      metadata,
    });
  } catch (error) {
    console.debug('[ElevenLabs] Failed to track usage (non-fatal):', error);
  }
}

/**
 * Generate TTS audio with automatic tracking
 */
export async function generateSpeech(options: TTSOptions): Promise<TTSResult> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY not configured');
  }

  const model = options.model ?? 'eleven_v3';
  const characterCount = options.text.length;

  const response = await fetch(`${ELEVENLABS_API_URL}/${options.voiceId}`, {
    method: 'POST',
    headers: {
      Accept: 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': apiKey,
    },
    body: JSON.stringify({
      text: options.text,
      model_id: model,
      voice_settings: options.voiceSettings ?? {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.0,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ElevenLabs API error (${response.status}): ${error}`);
  }

  const audio = await response.arrayBuffer();

  // Track usage asynchronously
  trackTTSUsage(model, characterCount, '/elevenlabs/tts', {
    voiceId: options.voiceId,
  }).catch(() => {});

  return { audio, characterCount };
}

/**
 * ElevenLabs client with tracking
 */
export const elevenlabs = {
  generateSpeech,
};
