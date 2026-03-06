/**
 * ElevenLabs API
 */

import { apiClient, apiRawFetch } from './client';

export interface SignedUrlResponse {
  signedUrl: string;
}

export async function getSignedUrl(): Promise<SignedUrlResponse> {
  return apiClient<SignedUrlResponse>('/api/elevenlabs/signed-url');
}

export async function synthesizeNpcTts(
  voiceId: string,
  text: string,
  emotion?: string
): Promise<ArrayBuffer> {
  const response = await apiRawFetch('/api/elevenlabs/npc-tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ voiceId, text, emotion }),
  });

  if (!response.ok) {
    throw new Error(`NPC TTS failed: ${response.status}`);
  }

  return response.arrayBuffer();
}
