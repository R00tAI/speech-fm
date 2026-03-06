/**
 * NarrationSynthesizer
 *
 * Client-side ElevenLabs TTS with word-level timestamps.
 * Uses the with_timestamps endpoint to get word-level alignment data
 * that drives the caption highlight system.
 */

import type { WordTimestamp } from '../types';

export interface NarrationResult {
  audioUrl: string;
  audioDuration: number;
  words: WordTimestamp[];
}

// Default voice for narration (Rachel — clear, professional female voice)
const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM';

export class NarrationSynthesizer {
  private apiKey: string | null;

  constructor() {
    this.apiKey = typeof window !== 'undefined'
      ? (process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || null)
      : null;
  }

  /**
   * Synthesize narration with word timestamps.
   * Returns null if no API key is available (scenes play without audio).
   */
  async synthesize(text: string, sceneId: string): Promise<NarrationResult | null> {
    if (!this.apiKey || !text.trim()) return null;

    try {
      // Use the with_timestamps endpoint for word-level alignment
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${DEFAULT_VOICE_ID}/with-timestamps`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': this.apiKey,
          },
          body: JSON.stringify({
            text: text.trim(),
            model_id: 'eleven_v3',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
              style: 0.0,
              use_speaker_boost: true,
            },
          }),
        }
      );

      if (!response.ok) {
        console.warn(`[NarrationSynth] TTS failed for scene ${sceneId}:`, response.status);
        // Fallback to standard TTS without timestamps
        return this.synthesizeFallback(text, sceneId);
      }

      const data = await response.json();

      // Parse the response — ElevenLabs returns audio_base64 and alignment
      if (data.audio_base64) {
        const audioBlob = this.base64ToBlob(data.audio_base64, 'audio/mpeg');
        const audioUrl = URL.createObjectURL(audioBlob);

        // Parse word timestamps from alignment data
        const words: WordTimestamp[] = [];
        if (data.alignment) {
          const { characters, character_start_times_seconds, character_end_times_seconds } = data.alignment;

          if (characters && character_start_times_seconds && character_end_times_seconds) {
            // Reconstruct words from character-level timing
            let currentWord = '';
            let wordStart = 0;
            let wordEnd = 0;

            for (let i = 0; i < characters.length; i++) {
              const char = characters[i];

              if (char === ' ' || char === '\n' || char === '\t') {
                if (currentWord.trim()) {
                  words.push({
                    word: currentWord.trim(),
                    start: wordStart,
                    end: wordEnd,
                  });
                }
                currentWord = '';
              } else {
                if (currentWord === '') {
                  wordStart = character_start_times_seconds[i];
                }
                currentWord += char;
                wordEnd = character_end_times_seconds[i];
              }
            }

            // Push last word
            if (currentWord.trim()) {
              words.push({
                word: currentWord.trim(),
                start: wordStart,
                end: wordEnd,
              });
            }
          }
        }

        // Calculate duration from audio or last word
        const audioDuration = words.length > 0
          ? words[words.length - 1].end
          : 0;

        console.log(`[NarrationSynth] Scene ${sceneId}: ${words.length} words, ${audioDuration.toFixed(1)}s`);

        return { audioUrl, audioDuration, words };
      }

      return null;
    } catch (error) {
      console.warn(`[NarrationSynth] Error for scene ${sceneId}:`, error);
      return null;
    }
  }

  /**
   * Fallback: standard TTS without word timestamps.
   */
  private async synthesizeFallback(text: string, sceneId: string): Promise<NarrationResult | null> {
    if (!this.apiKey) return null;

    try {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${DEFAULT_VOICE_ID}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': this.apiKey,
            Accept: 'audio/mpeg',
          },
          body: JSON.stringify({
            text: text.trim(),
            model_id: 'eleven_v3',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
              style: 0.0,
              use_speaker_boost: true,
            },
          }),
        }
      );

      if (!response.ok) return null;

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // Estimate duration from text length (rough: ~150 wpm)
      const wordCount = text.split(/\s+/).length;
      const audioDuration = (wordCount / 150) * 60;

      // Generate approximate word timestamps
      const textWords = text.split(/\s+/).filter(Boolean);
      const avgWordDuration = audioDuration / textWords.length;
      const words: WordTimestamp[] = textWords.map((word, i) => ({
        word,
        start: i * avgWordDuration,
        end: (i + 1) * avgWordDuration,
      }));

      return { audioUrl, audioDuration, words };
    } catch {
      return null;
    }
  }

  private base64ToBlob(base64: string, mimeType: string): Blob {
    const byteChars = atob(base64);
    const byteNums = new Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) {
      byteNums[i] = byteChars.charCodeAt(i);
    }
    return new Blob([new Uint8Array(byteNums)], { type: mimeType });
  }
}
