import type {
  PrivateCall,
  PrivateMessage,
  AgentRelationship,
  AgentSecret,
  AgentMood,
} from '@/types/rpg';
import type { AgentConfig } from '@/types/agency';
import { privateCallHandler } from './private-call-handler';
import { getFALService } from '@/lib/fal/fal-service';

/**
 * VoiceCallHandler - Handles voice-based private calls with agents
 * Uses ElevenLabs Scribe v2 Realtime (STT) + Flash v2.5 (TTS)
 *
 * Performance:
 * - Scribe v2 Realtime: ~150ms latency
 * - Flash v2.5: ~75ms latency
 * - Total: ~225ms + Claude processing + network
 *
 * This creates near-realtime conversations without WebSocket/WebRTC
 */

export interface VoiceInteractionParams {
  call_id: string;
  audio_buffer: Buffer;
  agent: AgentConfig;
  conversation_history: PrivateMessage[];
  relationships: AgentRelationship[];
  secrets: AgentSecret[];
}

export interface VoiceInteractionResult {
  transcribed_text: string;
  agent_response_text: string;
  agent_response_audio: Buffer;
  internal_thought: string;
  audio_duration_ms: number;
}

export interface AgentVoiceProfile {
  agent_id: string;
  voice_id: string; // ElevenLabs voice ID
  voice_name: string;
  stability: number; // 0-1
  similarity_boost: number; // 0-1
  style: number; // 0-1
  use_speaker_boost: boolean;
}

/**
 * Default voice assignments for agents
 * Matched to personality traits (MBTI + OCEAN)
 */
export const DEFAULT_AGENT_VOICES: Record<string, AgentVoiceProfile> = {
  // Female voices
  sarah_pm: {
    agent_id: 'sarah_pm',
    voice_id: '21m00Tcm4TlvDq8ikWAM', // Rachel - calm, clear
    voice_name: 'Rachel',
    stability: 0.6,
    similarity_boost: 0.75,
    style: 0.5,
    use_speaker_boost: true,
  },
  emma_designer: {
    agent_id: 'emma_designer',
    voice_id: 'EXAVITQu4vr4xnSDxMaL', // Bella - warm, friendly
    voice_name: 'Bella',
    stability: 0.5,
    similarity_boost: 0.8,
    style: 0.6,
    use_speaker_boost: true,
  },

  // Male voices
  tony_backend: {
    agent_id: 'tony_backend',
    voice_id: 'TxGEqnHWrfWFTfGW9XjX', // Josh - energetic, confident
    voice_name: 'Josh',
    stability: 0.55,
    similarity_boost: 0.75,
    style: 0.4,
    use_speaker_boost: true,
  },
  jake_frontend: {
    agent_id: 'jake_frontend',
    voice_id: 'VR6AewLTigWG4xSOukaG', // Arnold - deep, thoughtful
    voice_name: 'Arnold',
    stability: 0.65,
    similarity_boost: 0.7,
    style: 0.3,
    use_speaker_boost: true,
  },
};

/**
 * Adjust voice settings based on agent mood
 */
function getVoiceSettingsForMood(
  base_profile: AgentVoiceProfile,
  mood: AgentMood
): {
  stability: number;
  similarity_boost: number;
  style: number;
  use_speaker_boost: boolean;
} {
  const settings = {
    stability: base_profile.stability,
    similarity_boost: base_profile.similarity_boost,
    style: base_profile.style,
    use_speaker_boost: base_profile.use_speaker_boost,
  };

  switch (mood) {
    case 'happy':
      settings.stability -= 0.1; // More expressive
      settings.style += 0.2; // More energetic
      break;
    case 'stressed':
      settings.stability -= 0.15; // More variable
      settings.style -= 0.1; // Less controlled
      break;
    case 'annoyed':
      settings.stability += 0.1; // More controlled/tense
      settings.style -= 0.2; // Flatter delivery
      break;
    case 'secretive':
      settings.stability += 0.15; // Very controlled
      settings.style -= 0.15; // Subdued
      break;
    case 'excited':
      settings.stability -= 0.2; // Very expressive
      settings.style += 0.3; // Very energetic
      break;
    case 'conflicted':
      settings.stability -= 0.05; // Slightly uncertain
      break;
  }

  // Clamp values to 0-1
  settings.stability = Math.max(0, Math.min(1, settings.stability));
  settings.style = Math.max(0, Math.min(1, settings.style));

  return settings;
}

export class VoiceCallHandler {
  private elevenlabs_api_key: string;
  private api_base_url = 'https://api.elevenlabs.io/v1';

  constructor(api_key?: string) {
    // Don't throw on initialization - check when making actual calls
    // This allows the module to be imported even if the API key isn't set
    this.elevenlabs_api_key = api_key || process.env.ELEVENLABS_API_KEY || '';
  }

  private ensureApiKey(): void {
    if (!this.elevenlabs_api_key) {
      throw new Error('ELEVENLABS_API_KEY is required for voice calls. Set it in your environment variables.');
    }
  }

  /**
   * Transcribe user audio to text using Scribe v2 Realtime
   * Latency: ~150ms
   *
   * @param audioBuffer - Audio file buffer (supports mp3, wav, ogg, etc.)
   * @returns Transcribed text
   */
  async transcribeUserAudio(audioBuffer: Buffer): Promise<string> {
    this.ensureApiKey();
    try {
      const response = await fetch(`${this.api_base_url}/speech-to-text`, {
        method: 'POST',
        headers: {
          'xi-api-key': this.elevenlabs_api_key,
          'Content-Type': 'audio/mpeg', // Adjust based on actual audio format
        },
        body: audioBuffer,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`ElevenLabs STT failed: ${error}`);
      }

      const result = await response.json();
      return result.text || '';
    } catch (error) {
      console.error('Error transcribing audio:', error);
      throw new Error(`Failed to transcribe audio: ${error}`);
    }
  }

  /**
   * Generate agent voice response using Flash v2.5 (fastest model)
   * Latency: ~75ms
   *
   * @param params - Text and voice configuration
   * @returns Audio buffer
   */
  async generateAgentVoice(params: {
    text: string;
    voice_id: string;
    voice_settings?: {
      stability: number;
      similarity_boost: number;
      style?: number;
      use_speaker_boost?: boolean;
    };
  }): Promise<Buffer> {
    this.ensureApiKey();
    const { text, voice_id, voice_settings } = params;

    try {
      const response = await fetch(
        `${this.api_base_url}/text-to-speech/${voice_id}`,
        {
          method: 'POST',
          headers: {
            'xi-api-key': this.elevenlabs_api_key,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text,
            model_id: 'eleven_flash_v2_5', // FASTEST MODEL - 32 languages
            voice_settings: voice_settings || {
              stability: 0.5,
              similarity_boost: 0.75,
              style: 0.5,
              use_speaker_boost: true,
            },
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`ElevenLabs TTS failed: ${error}`);
      }

      const audioBuffer = await response.arrayBuffer();
      return Buffer.from(audioBuffer);
    } catch (error) {
      console.error('Error generating voice:', error);
      throw new Error(`Failed to generate voice: ${error}`);
    }
  }

  /**
   * Generate agent voice with streaming for lower perceived latency
   * Use this for longer responses
   */
  async generateAgentVoiceStream(params: {
    text: string;
    voice_id: string;
    voice_settings?: {
      stability: number;
      similarity_boost: number;
      style?: number;
      use_speaker_boost?: boolean;
    };
  }): Promise<ReadableStream<Uint8Array>> {
    this.ensureApiKey();
    const { text, voice_id, voice_settings } = params;

    const response = await fetch(
      `${this.api_base_url}/text-to-speech/${voice_id}/stream`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': this.elevenlabs_api_key,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_flash_v2_5',
          voice_settings: voice_settings || {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.5,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`ElevenLabs TTS stream failed: ${error}`);
    }

    return response.body as ReadableStream<Uint8Array>;
  }

  /**
   * Complete voice interaction cycle
   * Handles: User audio → Transcription → AI Response → Voice generation
   *
   * Total latency: ~225ms + Claude processing (~500ms) = ~725ms
   */
  async handleVoiceInteraction(
    params: VoiceInteractionParams
  ): Promise<VoiceInteractionResult> {
    const start_time = Date.now();

    // 1. Transcribe user audio (~150ms)
    const user_text = await this.transcribeUserAudio(params.audio_buffer);

    if (!user_text || user_text.trim() === '') {
      throw new Error('Failed to transcribe audio - no speech detected');
    }

    // 2. Get AI response from agent (~500ms Claude)
    const ai_response = await privateCallHandler.getAgentResponse({
      call_id: params.call_id,
      agent: params.agent,
      user_message: user_text,
      conversation_history: params.conversation_history,
      current_relationships: params.relationships,
      known_secrets: params.secrets,
    });

    // 3. Determine agent mood for voice settings
    const mood = this.determineAgentMood(
      params.agent,
      params.relationships,
      params.secrets
    );

    // 4. Get voice profile and adjust for mood
    const voice_profile =
      DEFAULT_AGENT_VOICES[params.agent.id] ||
      DEFAULT_AGENT_VOICES['sarah_pm']; // Fallback

    const voice_settings = getVoiceSettingsForMood(voice_profile, mood);

    // 5. Generate voice audio (~75ms)
    const audio = await this.generateAgentVoice({
      text: ai_response.response.content,
      voice_id: voice_profile.voice_id,
      voice_settings,
    });

    // 6. Generate Lip Sync Video (if avatar video is available)
    let lip_sync_video_url: string | undefined;
    const avatarVideoUrl = (params.agent as any).avatarVideoUrl || (params.agent as any).metadata?.avatarVideoUrl;

    if (avatarVideoUrl) {
      try {
        const falService = getFALService();
        const audioUrl = await falService.uploadAudio(audio);
        const lipSyncResult = await falService.generateLipSync({
          audioUrl,
          videoUrl: avatarVideoUrl,
          chatId: 'voice-call', // Using generic ID for now
          agentId: params.agent.id,
        });
        lip_sync_video_url = lipSyncResult.url;
      } catch (error) {
        console.error('Lip sync generation failed:', error);
        // Continue without video
      }
    }

    const total_time = Date.now() - start_time;

    return {
      transcribed_text: user_text,
      agent_response_text: ai_response.response.content,
      agent_response_audio: audio,
      lip_sync_video_url,
      internal_thought: ai_response.internal_thought,
      audio_duration_ms: total_time,
    };
  }

  /**
   * Determine agent mood based on relationships and secrets
   */
  private determineAgentMood(
    agent: AgentConfig,
    relationships: AgentRelationship[],
    secrets: AgentSecret[]
  ): AgentMood {
    // Find relationship with user
    const user_relationship = relationships.find(
      (r) => r.agent_a_id === agent.id || r.agent_b_id === agent.id
    );

    const trust = user_relationship?.metrics.trust || 50;
    const friendship = user_relationship?.metrics.friendship || 50;
    const rivalry = user_relationship?.metrics.rivalry || 0;

    // Check for exposed secrets
    const exposed_secrets = secrets.filter(
      (s) => s.owner_agent_id === agent.id && s.is_exposed
    );

    // Mood logic
    if (exposed_secrets.length > 0) {
      return 'stressed';
    }

    if (rivalry > 60) {
      return 'annoyed';
    }

    if (trust < 30) {
      return 'secretive';
    }

    if (friendship > 70 && trust > 70) {
      return 'happy';
    }

    if (friendship > 50) {
      return 'happy';
    }

    return 'neutral';
  }

  /**
   * Get available voices from ElevenLabs
   * Useful for dynamic voice assignment
   */
  async getAvailableVoices(): Promise<
    Array<{
      voice_id: string;
      name: string;
      category: string;
      labels: Record<string, string>;
    }>
  > {
    this.ensureApiKey();
    const response = await fetch(`${this.api_base_url}/voices`, {
      headers: {
        'xi-api-key': this.elevenlabs_api_key,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch available voices');
    }

    const data = await response.json();
    return data.voices || [];
  }

  /**
   * Create custom voice profile for agent
   * Allows customization beyond defaults
   */
  createVoiceProfile(params: {
    agent_id: string;
    voice_id: string;
    voice_name: string;
    personality_traits?: {
      openness: number;
      conscientiousness: number;
      extraversion: number;
      agreeableness: number;
      neuroticism: number;
    };
  }): AgentVoiceProfile {
    const { agent_id, voice_id, voice_name, personality_traits } = params;

    // Default settings
    let stability = 0.5;
    let similarity_boost = 0.75;
    let style = 0.5;

    // Adjust based on personality
    if (personality_traits) {
      // High neuroticism = less stable voice
      stability = 1 - personality_traits.neuroticism * 0.4;

      // High extraversion = more expressive style
      style = 0.3 + personality_traits.extraversion * 0.5;

      // High conscientiousness = higher similarity boost (more controlled)
      similarity_boost = 0.6 + personality_traits.conscientiousness * 0.3;
    }

    return {
      agent_id,
      voice_id,
      voice_name,
      stability,
      similarity_boost,
      style,
      use_speaker_boost: true,
    };
  }
}

// Export singleton instance
export const voiceCallHandler = new VoiceCallHandler();
