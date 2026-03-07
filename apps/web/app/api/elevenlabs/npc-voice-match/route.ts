import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import {
  findMatchingVoice,
  getSuggestedDescriptives,
  type VoiceSearchCriteria,
} from '@/lib/live-act/services/voice-library.service';
import { NPC_VOICE_LIBRARY } from '@/components/design-studio/voice31/Voice31RPGStore';

export const runtime = 'nodejs';
export const maxDuration = 15;

/**
 * POST /api/elevenlabs/npc-voice-match
 *
 * Find a matching ElevenLabs voice for an NPC based on character traits.
 * Uses the voice library service's multi-strategy search with fallback
 * to the static NPC_VOICE_LIBRARY.
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const {
      npcName,
      gender,
      age,
      accent,
      personality,
      archetype,
      description,
      usedVoiceIds = [],
    } = body;

    if (!npcName) {
      return NextResponse.json({ error: 'npcName is required' }, { status: 400 });
    }

    // Build search criteria from NPC traits
    const descriptives = archetype
      ? getSuggestedDescriptives(archetype)
      : [];

    // Add personality traits as descriptives if they match known values
    if (personality && Array.isArray(personality)) {
      const validDescriptives = new Set([
        'authoritative', 'confident', 'warm', 'friendly', 'professional',
        'casual', 'calm', 'energetic', 'deep', 'raspy', 'smooth',
        'gruff', 'gentle', 'intense', 'menacing', 'playful', 'serious',
        'sarcastic', 'dramatic', 'mysterious', 'wise', 'youthful',
      ]);
      for (const trait of personality) {
        if (validDescriptives.has(trait.toLowerCase()) && !descriptives.includes(trait.toLowerCase())) {
          descriptives.push(trait.toLowerCase());
        }
      }
    }

    const criteria: VoiceSearchCriteria = {
      gender: gender === 'male' || gender === 'female' ? gender : undefined,
      age: age === 'young' || age === 'middle_aged' || age === 'old' ? age : undefined,
      accent: accent || undefined,
      use_cases: ['gaming', 'characters_animation'],
      descriptives: descriptives.length > 0 ? descriptives.slice(0, 4) : undefined,
      search: description ? `${npcName} ${description}`.slice(0, 100) : npcName,
    };

    const usedSet = new Set<string>(usedVoiceIds);

    console.log('[NPC Voice Match] Searching for:', npcName, criteria);

    const matchedVoice = await findMatchingVoice(criteria, usedSet);

    if (matchedVoice) {
      console.log('[NPC Voice Match] Found:', matchedVoice.name, matchedVoice.voice_id);
      return NextResponse.json({
        voiceId: matchedVoice.voice_id,
        voiceName: matchedVoice.name,
        source: 'library',
      });
    }

    // Fallback: pick from static NPC_VOICE_LIBRARY avoiding used voices
    const fallbackGender = gender === 'female' ? 'female' : gender === 'neutral' ? 'neutral' : 'male';
    const genderPool = NPC_VOICE_LIBRARY.filter(
      (v) => v.gender === fallbackGender && !usedSet.has(v.voiceId)
    );
    const fallback = genderPool.length > 0
      ? genderPool[Math.floor(Math.random() * genderPool.length)]
      : NPC_VOICE_LIBRARY[0];

    console.log('[NPC Voice Match] Fallback:', fallback.name, fallback.voiceId);
    return NextResponse.json({
      voiceId: fallback.voiceId,
      voiceName: fallback.name,
      source: 'fallback',
    });
  } catch (error) {
    console.error('[NPC Voice Match] Error:', error);

    // Hard fallback to first library entry
    return NextResponse.json({
      voiceId: NPC_VOICE_LIBRARY[0].voiceId,
      voiceName: NPC_VOICE_LIBRARY[0].name,
      source: 'error-fallback',
    });
  }
}
