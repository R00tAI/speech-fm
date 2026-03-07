import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { trackCharacterUsage } from '@/lib/services/cost-tracking.service';

export const runtime = 'nodejs';

// Map emotion presets (+ RPG-specific) to v3 audio tags
const EMOTION_AUDIO_TAGS: Record<string, string> = {
  neutral: '',
  happy: '[cheerfully]',
  sad: '[sad]',
  angry: '[angry]',
  surprised: '[gasps]',
  confused: '[hesitates]',
  excited: '[excited]',
  worried: '[nervous]',
  proud: '[confidently]',
  shy: '[whispering]',
  serious: '[flatly]',
  playful: '[playfully]',
  curious: '[curiously]',
  fearful: '[trembling]',
  disgusted: '[disgusted]',
  // RPG-specific emotions
  menacing: '[menacing]',
  commanding: '[authoritatively]',
  mysterious: '[whispering]',
  dramatic: '[dramatic reveal]',
  sarcastic: '[sarcastic]',
  whispered: '[whispering]',
  shouting: '[shouting]',
  laughing: '[laughs]',
  crying: '[crying]',
  pleading: '[pleading]',
  resigned: '[resigned tone]',
};

function embedAudioTags(text: string, emotion?: string): string {
  if (!emotion) return text;
  const tag = EMOTION_AUDIO_TAGS[emotion.toLowerCase()];
  if (!tag) return text;
  return `${tag} ${text}`;
}

/**
 * POST /api/elevenlabs/npc-tts
 *
 * Server-side proxy for NPC voice synthesis.
 * Keeps the ElevenLabs API key on the server — never exposed to the browser.
 */
export async function POST(request: Request) {
  try {
    // Auth check
    const session = await auth();
    const userId = session?.user?.id;

    const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json(
        { error: 'ELEVENLABS_API_KEY not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { voiceId, text, emotion } = body;

    if (!voiceId || !text) {
      return NextResponse.json(
        { error: 'voiceId and text are required' },
        { status: 400 }
      );
    }

    // ElevenLabs v3 requires discrete stability: 0.0, 0.5, or 1.0
    const emotionSettings: Record<string, { stability: number; similarity_boost: number; style: number }> = {
      neutral:   { stability: 0.5, similarity_boost: 0.75, style: 0.0 },
      happy:     { stability: 0.0, similarity_boost: 0.8,  style: 0.4 },
      sad:       { stability: 1.0, similarity_boost: 0.7,  style: 0.15 },
      angry:     { stability: 0.0, similarity_boost: 0.85, style: 0.6 },
      surprised: { stability: 0.0, similarity_boost: 0.8,  style: 0.5 },
      confused:  { stability: 0.5, similarity_boost: 0.75, style: 0.1 },
      excited:   { stability: 0.0, similarity_boost: 0.85, style: 0.7 },
      worried:   { stability: 1.0, similarity_boost: 0.7,  style: 0.1 },
      proud:     { stability: 0.5, similarity_boost: 0.8,  style: 0.5 },
      shy:       { stability: 1.0, similarity_boost: 0.65, style: 0.05 },
      serious:   { stability: 1.0, similarity_boost: 0.8,  style: 0.0 },
      playful:   { stability: 0.0, similarity_boost: 0.75, style: 0.5 },
      curious:   { stability: 0.5, similarity_boost: 0.75, style: 0.3 },
      fearful:   { stability: 1.0, similarity_boost: 0.7,  style: 0.1 },
      disgusted: { stability: 0.5, similarity_boost: 0.7,  style: 0.2 },
    };

    const settings = emotionSettings[emotion || 'neutral'] || emotionSettings.neutral;
    const taggedText = embedAudioTags(text, emotion);

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text: taggedText,
        model_id: 'eleven_v3',
        voice_settings: {
          stability: settings.stability,
          similarity_boost: settings.similarity_boost,
          style: settings.style,
          // use_speaker_boost NOT supported in v3 — omitted
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[NPC-TTS] ElevenLabs error:', response.status, errorText);
      return NextResponse.json(
        { error: `TTS failed: ${response.status}` },
        { status: response.status }
      );
    }

    // Stream the audio back as binary
    const audioBuffer = await response.arrayBuffer();

    // Track cost (non-blocking)
    if (userId) {
      trackCharacterUsage({
        userId,
        provider: 'elevenlabs',
        model: 'eleven_v3',
        service: 'tts',
        endpoint: '/api/elevenlabs/npc-tts',
        characters: text.length,
        metadata: { voiceId, emotion: emotion || 'neutral', source: 'rpg-npc' },
      }).catch((err) => console.error('[NPC-TTS] Cost tracking failed:', err));
    }

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'private, max-age=300',
      },
    });
  } catch (error) {
    console.error('[NPC-TTS] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
