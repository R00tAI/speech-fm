'use client';

/**
 * Voice31 RPG Tools
 *
 * Client-side tool handlers for RPG mode.
 * Handles execution of RPG-specific tool calls.
 */

import {
  useVoice31RPGStore,
  NPC_VOICE_LIBRARY,
  RPG_SCENE_LIGHTING_PRESETS,
  type GameLocation,
  type NPCharacter,
  type InventoryItem,
  type Quest,
  type QuestObjective,
  type QuestReward,
  type DialogueOption,
  type StoryEventType,
  type NPCPosition,
  type PortraitStyle,
  type ItemType,
  type ItemRarity,
} from './Voice31RPGStore';
import { GameClock } from '@/lib/rpg/game-clock';
import { addMemory, type NPCMemoryState } from '@/lib/rpg/npc-memory';
import { buildDialogContext, buildTimeContext } from '@/lib/rpg/dialog-context-builder';
import { evolveLocation } from '@/lib/rpg/world-evolution-engine';
import { recordVisit, addLocationEvent } from '@/lib/rpg/location-state-manager';

// Theme prompt modifiers — keyed by theme name, provides style/quality/atmosphere tokens
const THEME_PROMPT_MODIFIERS: Record<string, { style: string; quality: string; atmosphere: string; negative: string }> = {
  fantasy: {
    style: 'tolkien inspired, dungeons and dragons aesthetic, detailed fantasy illustration',
    quality: 'highly detailed, masterwork quality, epic composition',
    atmosphere: 'magical particles, ethereal glow, dramatic lighting',
    negative: 'modern technology, sci-fi, neon lights',
  },
  cyberpunk: {
    style: 'blade runner aesthetic, ghost in the shell, neon-lit dystopia',
    quality: 'highly detailed, 8k, cinematic composition',
    atmosphere: 'rain, neon reflections, volumetric fog, high contrast',
    negative: 'natural settings, medieval, fantasy elements',
  },
  noir: {
    style: 'film noir 1940s aesthetic, sin city influence, dramatic shadows',
    quality: 'cinematic, film grain, high contrast',
    atmosphere: 'heavy shadows, cigarette smoke, rain, venetian blind patterns',
    negative: 'bright colors, fantasy elements, daylight',
  },
  fallout: {
    style: 'post-apocalyptic, 1950s retro-futurism, wasteland survival',
    quality: 'highly detailed, cinematic wasteland photography',
    atmosphere: 'dust particles, radioactive haze, golden hour, survival mood',
    negative: 'clean environments, lush vegetation, bright colors',
  },
  medieval: {
    style: 'historically accurate medieval, period authentic, illuminated manuscript',
    quality: 'detailed medieval illustration, museum quality',
    atmosphere: 'torch-lit, stone and timber, feudal grandeur',
    negative: 'modern elements, bright colors, fantasy magic',
  },
  scifi: {
    style: 'hard science fiction, space opera, professional concept art',
    quality: 'highly detailed sci-fi illustration, cinematic',
    atmosphere: 'deep space, technological wonder, alien mystery',
    negative: 'fantasy elements, medieval, primitive technology',
  },
};

// =============================================================================
// TYPES
// =============================================================================

export interface RPGToolCallResult {
  success: boolean;
  message: string;
  context?: Record<string, unknown>;
}

export interface RPGToolCallHandler {
  handleToolCall: (name: string, args: Record<string, unknown>) => Promise<RPGToolCallResult>;
}

// =============================================================================
// AUDIO: NPC TTS + SFX
// =============================================================================

// NPC voice synthesis is handled by the provider (ElevenLabs/FAL), not here.
// This prevents duplicate audio playback.

// SFX library - browser-compatible, no external files needed
const SFX_DEFINITIONS: Record<string, { frequency: number; type: OscillatorType; duration: number; volume: number }> = {
  sword_hit: { frequency: 120, type: 'sawtooth', duration: 0.15, volume: 0.3 },
  sword_swing: { frequency: 200, type: 'triangle', duration: 0.2, volume: 0.2 },
  magic_cast: { frequency: 800, type: 'sine', duration: 0.5, volume: 0.25 },
  heal: { frequency: 600, type: 'sine', duration: 0.6, volume: 0.2 },
  level_up: { frequency: 440, type: 'square', duration: 0.8, volume: 0.25 },
  coin: { frequency: 1200, type: 'sine', duration: 0.15, volume: 0.15 },
  door_open: { frequency: 150, type: 'triangle', duration: 0.4, volume: 0.2 },
  footsteps: { frequency: 100, type: 'triangle', duration: 0.1, volume: 0.1 },
  dice_roll: { frequency: 300, type: 'triangle', duration: 0.3, volume: 0.2 },
  critical_hit: { frequency: 180, type: 'sawtooth', duration: 0.3, volume: 0.35 },
  miss: { frequency: 80, type: 'triangle', duration: 0.2, volume: 0.15 },
  victory: { frequency: 523, type: 'square', duration: 1.0, volume: 0.25 },
  defeat: { frequency: 110, type: 'sawtooth', duration: 1.2, volume: 0.3 },
  quest_complete: { frequency: 660, type: 'sine', duration: 0.7, volume: 0.25 },
  item_pickup: { frequency: 900, type: 'sine', duration: 0.12, volume: 0.15 },
  ambient_wind: { frequency: 200, type: 'sine', duration: 2.0, volume: 0.05 },
};

// Shared AudioContext to avoid resource leak (Chrome limits ~6 per page)
let sharedAudioCtx: AudioContext | null = null;
function getAudioContext(): AudioContext {
  if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
    sharedAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume();
  }
  return sharedAudioCtx;
}

function playSFX(sfxName: string): void {
  const sfx = SFX_DEFINITIONS[sfxName];
  if (!sfx || typeof window === 'undefined') return;

  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = sfx.type;
    osc.frequency.setValueAtTime(sfx.frequency, ctx.currentTime);
    gain.gain.setValueAtTime(sfx.volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + sfx.duration);

    // Add pitch variation for some effects
    if (['sword_hit', 'coin', 'dice_roll'].includes(sfxName)) {
      osc.frequency.linearRampToValueAtTime(
        sfx.frequency * (0.5 + Math.random()),
        ctx.currentTime + sfx.duration
      );
    }

    // Level up / victory: play ascending notes
    if (sfxName === 'level_up' || sfxName === 'victory') {
      osc.frequency.setValueAtTime(sfx.frequency, ctx.currentTime);
      osc.frequency.setValueAtTime(sfx.frequency * 1.25, ctx.currentTime + 0.2);
      osc.frequency.setValueAtTime(sfx.frequency * 1.5, ctx.currentTime + 0.4);
    }

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + sfx.duration);
  } catch {
    // Silently fail if AudioContext not available
  }
}

// =============================================================================
// STYLED LOGGING
// =============================================================================

const logRPGToolCall = (name: string, args: Record<string, unknown>) => {
  console.log(
    '%c[RPG Tool] %c' + name,
    'background: #2d1b4e; color: #aa88ff; padding: 2px 6px; border-radius: 3px; font-weight: bold;',
    'background: #1b2d4e; color: #88aaff; padding: 2px 8px; border-radius: 3px; font-weight: bold;',
    args
  );
};

const logRPGToolResult = (name: string, result: RPGToolCallResult) => {
  const style = result.success
    ? 'background: #0a3d2e; color: #00ff88; padding: 2px 6px; border-radius: 3px;'
    : 'background: #3d0a0a; color: #ff4444; padding: 2px 6px; border-radius: 3px;';
  console.log(
    `%c[RPG Result] %c${name} %c${result.success ? '✓ SUCCESS' : '✗ FAILED'}`,
    'background: #2d1b4e; color: #aa88ff; padding: 2px 6px; border-radius: 3px; font-weight: bold;',
    'color: #aaaaaa; padding: 2px 4px;',
    style,
    result.message
  );
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

const parseCommaSeparated = (str?: string): string[] => {
  if (!str) return [];
  return str.split(',').map((s) => s.trim()).filter(Boolean);
};

// Build a theme-enhanced prompt for scene generation
function buildEnhancedScenePrompt(basePrompt: string, theme?: string): string {
  const mods = theme ? THEME_PROMPT_MODIFIERS[theme] : null;
  if (!mods) {
    return `${basePrompt}, RPG scene, atmospheric, cinematic lighting, detailed background, wide angle`;
  }
  return `${basePrompt}, ${mods.style}, ${mods.atmosphere}, ${mods.quality}, detailed background, wide angle`;
}

// Generate background image for a scene
async function generateSceneBackground(prompt: string, theme?: string): Promise<string | null> {
  const enhancedPrompt = buildEnhancedScenePrompt(prompt, theme);

  // Primary: use the RPG-specific generate-image endpoint
  try {
    const response = await fetch('/api/pipelines/agency-orchestration/rpg/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: 'scene',
        prompt: enhancedPrompt,
        style: theme && THEME_PROMPT_MODIFIERS[theme] ? theme as any : 'fantasy',
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const url = data.image?.url || null;
      if (url) {
        console.log('[RPG] Scene background generated (rpg endpoint):', url.substring(0, 80));
        return url;
      } else {
        console.error('[RPG] No image URL in RPG scene response:', data);
      }
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.error('[RPG] RPG scene generation failed:', response.status, errorData);
    }
  } catch (error) {
    console.error('[RPG] RPG scene generation error, trying fallback:', error);
  }

  // Fallback: use the voice-canvas generate-media endpoint
  try {
    const response = await fetch('/api/voice-canvas/generate-media', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'image',
        prompt: enhancedPrompt,
        style: 'illustration',
        saveToAccount: true,
        forceSchnell: true,
        context: {
          source: 'voice31-rpg-scene',
          sessionId: `rpg_scene_${Date.now()}`,
        },
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const url = data.media?.[0]?.url || null;
      if (url) {
        console.log('[RPG] Scene background generated (fallback):', url.substring(0, 80));
      } else {
        console.error('[RPG] No image URL in fallback scene response:', data);
      }
      return url;
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.error('[RPG] Fallback scene generation failed:', response.status, errorData);
    }
  } catch (error) {
    console.error('[RPG] Failed to generate scene background:', error);
  }
  return null;
}

// Generate NPC portrait
async function generateNPCPortrait(prompt: string): Promise<string | null> {
  const portraitPrompt = `${prompt}, RPG character portrait, fantasy art style, head and shoulders, on white background, isolated, detailed face, expressive`;

  // Primary: use the RPG-specific generate-image endpoint
  try {
    const response = await fetch('/api/pipelines/agency-orchestration/rpg/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: 'character',
        prompt: portraitPrompt,
        style: 'fantasy',
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const url = data.image?.url || null;
      if (url) {
        console.log('[RPG] NPC portrait generated (rpg endpoint):', url.substring(0, 80));
        return url;
      } else {
        console.error('[RPG] No image URL in RPG portrait response:', data);
      }
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.error('[RPG] RPG portrait generation failed:', response.status, errorData);
    }
  } catch (error) {
    console.error('[RPG] RPG portrait generation error, trying fallback:', error);
  }

  // Fallback: use the voice-canvas generate-media endpoint
  try {
    const response = await fetch('/api/voice-canvas/generate-media', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'image',
        prompt: portraitPrompt,
        style: 'illustration',
        saveToAccount: true,
        forceSchnell: true,
        context: {
          source: 'voice31-rpg-npc',
          sessionId: `rpg_npc_${Date.now()}`,
        },
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const url = data.media?.[0]?.url || null;
      if (url) {
        console.log('[RPG] NPC portrait generated (fallback):', url.substring(0, 80));
      } else {
        console.error('[RPG] No image URL in fallback portrait response:', data);
      }
      return url;
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.error('[RPG] Fallback portrait generation failed:', response.status, errorData);
    }
  } catch (error) {
    console.error('[RPG] Failed to generate NPC portrait:', error);
  }
  return null;
}

// Chain depth estimation for a generated image
async function chainDepthEstimation(imageUrl: string): Promise<string | null> {
  try {
    console.log('[RPG] Chaining depth estimation for:', imageUrl.substring(0, 60));
    const response = await fetch('/api/design-studio/depth-estimation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageUrl,
        model: 'midas', // Fast, free depth estimation
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const depthUrl = data.depthMap?.url || null;
      if (depthUrl) {
        console.log('[RPG] Depth map generated:', depthUrl.substring(0, 60));
      }
      return depthUrl;
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.error('[RPG] Depth estimation failed:', response.status, errorData);
    }
  } catch (error) {
    console.error('[RPG] Failed to chain depth estimation:', error);
  }
  return null;
}

// Filigree is now SVG-based and procedural — no API calls needed.
// The Voice31RPGFiligree component renders themed SVG filigree instantly.
// This function just sets the theme for the SVG system.
function updateFiligreeTheme(theme: string): void {
  const store = useVoice31RPGStore.getState();
  if (store.activeScene.filigreeTheme === theme) return;
  store.setFiligreeTheme(theme);
}

// Chain background removal for NPC portraits
async function chainBgRemoval(imageUrl: string): Promise<string | null> {
  try {
    console.log('[RPG] Chaining bg removal for:', imageUrl.substring(0, 60));
    const response = await fetch('/api/design-studio/remove-background', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url: imageUrl,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const resultUrl = data.image_url || data.result?.url || null;
      if (resultUrl) {
        console.log('[RPG] Background removed:', resultUrl.substring(0, 60));
      }
      return resultUrl;
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.error('[RPG] Background removal failed:', response.status, errorData);
    }
  } catch (error) {
    console.error('[RPG] Failed to chain bg removal:', error);
  }
  return null;
}

// =============================================================================
// MEDIA PERSISTENCE — copy FAL temp URLs to Vercel Blob
// =============================================================================

async function persistMediaUrl(
  tempUrl: string,
  type: 'scene' | 'portrait' | 'depth' | 'filigree',
  onPersisted?: (permanentUrl: string) => void,
): Promise<void> {
  try {
    const response = await fetch('/api/rpg/persist-media', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: tempUrl, type }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.permanentUrl) {
        console.log(`[RPG Media] Persisted ${type}: ${data.permanentUrl.substring(0, 60)}`);
        onPersisted?.(data.permanentUrl);
      }
    } else {
      console.warn(`[RPG Media] Persist failed for ${type}:`, response.status);
    }
  } catch (err) {
    console.warn(`[RPG Media] Persist error for ${type}:`, err);
  }
}

// =============================================================================
// AUTO-SAVE
// =============================================================================

const AUTO_SAVE_THROTTLE_MS = 30_000; // Min 30s between auto-saves
let lastAutoSaveTime = 0;

function triggerAutoSave(reason: string): void {
  const now = Date.now();
  if (now - lastAutoSaveTime < AUTO_SAVE_THROTTLE_MS) {
    console.log(`[RPG AutoSave] Throttled (${reason}) — last save ${Math.round((now - lastAutoSaveTime) / 1000)}s ago`);
    return;
  }
  lastAutoSaveTime = now;
  const store = useVoice31RPGStore.getState();
  if (!store.currentSaveFile) return;
  console.log(`[RPG AutoSave] Saving (${reason})`);
  store.saveGame();
}

// =============================================================================
// RPG TOOL HANDLER
// =============================================================================

export function createRPGToolHandler(): RPGToolCallHandler {
  return {
    handleToolCall: async (name: string, args: Record<string, unknown>): Promise<RPGToolCallResult> => {
      logRPGToolCall(name, args);

      const store = useVoice31RPGStore.getState();
      let result: RPGToolCallResult;

      try {
        switch (name) {
          // =============================================================================
          // SCENE MANAGEMENT
          // =============================================================================

          case 'set_scene': {
            const locationName = args.location_name as string;
            const backgroundPrompt = args.background_prompt as string;
            const ambientEffect = args.ambient_effect as string | undefined;
            const transition = (args.transition as 'fade' | 'dissolve' | 'slide') || 'fade';
            const theme = (args.theme as string) || 'default';

            if (!locationName || !backgroundPrompt) {
              result = { success: false, message: 'Location name and background prompt required' };
              break;
            }

            // Create location object
            const location: Omit<GameLocation, 'id' | 'discovered' | 'visitCount'> = {
              name: locationName,
              description: backgroundPrompt,
              backgroundPrompt,
              ambientEffect: ambientEffect as any,
              connectedLocations: [],
              npcsPresent: [],
              itemsPresent: [],
            };

            // Set scene (will show loading state)
            await store.setScene(location, transition);

            // Auto-select lighting preset from theme
            const lightingPreset = RPG_SCENE_LIGHTING_PRESETS[theme] || RPG_SCENE_LIGHTING_PRESETS['default'];
            store.setSceneLighting(lightingPreset);
            console.log(`[RPG] Scene lighting set to theme: ${theme}`);

            // Tick game clock on scene change
            store.tickGameClock();

            // World evolution: check if returning to a previously visited location
            const locationId = store.activeScene.location?.id;
            if (locationId) {
              const locState = store.getLocationState(locationId);
              const gameTime = store.getGameTime();
              if (locState && locState.lastVisitedAt && gameTime) {
                const timePassed = GameClock.timeDelta(locState.lastVisitedAt, gameTime);
                if (timePassed.totalMinutes > 60) { // Only evolve if >1 game hour passed
                  const evolution = evolveLocation(
                    locState,
                    timePassed,
                    gameTime,
                    store.currentSaveFile?.globalFlags || {},
                  );
                  if (evolution.changeSummary) {
                    console.log(`[RPG World] Location evolved: ${evolution.changeSummary}`);
                    store.logStoryEvent({
                      type: 'narrative',
                      summary: `Returning to ${locationName}: ${evolution.changeSummary}`,
                      fullText: evolution.updatedDescription,
                      locationId,
                      locationName,
                      participants: [],
                      important: false,
                    });
                  }
                  // If visual changes warrant regeneration, invalidate cache
                  if (evolution.shouldRegenerateScene) {
                    store.cacheLocationImage(locationName, '', undefined); // Invalidate cache — getCachedLocationImage treats empty URL as miss
                  }
                }
              }
              // Record this visit
              if (gameTime) {
                store.updateLocationState(locationId, (ls) => recordVisit(ls, gameTime));
              }
            }

            // Check location image cache first
            const cached = store.getCachedLocationImage(locationName);
            let backgroundUrl: string | null = null;

            if (cached) {
              console.log(`[RPG] Cache hit for "${locationName}" — using cached images`);
              backgroundUrl = cached.backgroundUrl;
              store.updateSceneBackground(backgroundUrl);
              if (cached.depthMapUrl) {
                store.updateSceneDepthMap(cached.depthMapUrl);
              }
            } else {
              // Generate background image with theme-enhanced prompt
              // Wrap in try/catch + timeout to prevent stuck "awaiting scene" state
              try {
                const bgTimeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 30000));
                backgroundUrl = await Promise.race([
                  generateSceneBackground(backgroundPrompt, theme),
                  bgTimeout,
                ]);
              } catch (bgError) {
                console.warn(`[RPG] Scene image generation threw for "${locationName}":`, bgError);
                backgroundUrl = null;
              }

              if (backgroundUrl) {
                store.updateSceneBackground(backgroundUrl);

                // Persist scene image to permanent storage (fire and forget)
                persistMediaUrl(backgroundUrl, 'scene', (permanentUrl) => {
                  store.updateSceneBackground(permanentUrl);
                });

                // Chain depth estimation for parallax (non-blocking)
                const depthSettings = store.currentSaveFile?.settings;
                if (depthSettings?.enableDepthParallax !== false) {
                  store.setDepthMapLoading(true);
                  chainDepthEstimation(backgroundUrl).then((depthUrl) => {
                    if (depthUrl) {
                      store.updateSceneDepthMap(depthUrl);
                      store.cacheLocationImage(locationName, backgroundUrl!, depthUrl);
                      persistMediaUrl(depthUrl, 'depth');
                    } else {
                      store.setDepthMapLoading(false);
                      store.cacheLocationImage(locationName, backgroundUrl!);
                    }
                  }).catch(() => {
                    store.setDepthMapLoading(false);
                    store.cacheLocationImage(locationName, backgroundUrl!);
                  });
                } else {
                  store.cacheLocationImage(locationName, backgroundUrl);
                }
              } else {
                // Image generation failed or timed out — clear loading state
                console.warn(`[RPG] Scene image generation failed for "${locationName}", using fallback`);
                store.setBackgroundLoading(false);
              }
            }

            // Update SVG filigree theme (instant, no API call)
            updateFiligreeTheme(theme || locationName);

            // Log story event
            store.logStoryEvent({
              type: 'discovery',
              summary: `Arrived at ${locationName}`,
              fullText: backgroundPrompt,
              locationId: store.activeScene.location?.id || 'unknown',
              locationName,
              participants: [],
              important: false,
            });

            result = {
              success: true,
              message: `Scene set to "${locationName}"`,
              context: { locationName, backgroundPrompt, backgroundUrl, ambientEffect, theme, cached: !!cached },
            };
            triggerAutoSave(`location change: ${locationName}`);
            break;
          }

          // =============================================================================
          // NPC MANAGEMENT
          // =============================================================================

          case 'show_npc': {
            const npcName = args.name as string;
            const title = args.title as string | undefined;
            const portraitPrompt = args.portrait_prompt as string;
            const voiceId = args.voice_id as string;
            const voiceType = args.voice_type as string | undefined;
            const position = (args.position as NPCPosition) || 'left';
            const relationship = (args.relationship as number) || 0;
            const race = (args.race as string) || 'human';
            const description = (args.description as string) || portraitPrompt;
            const personality = parseCommaSeparated(args.personality as string);
            const gender = args.gender as string | undefined;
            const age = args.age as string | undefined;
            const accent = args.accent as string | undefined;
            const archetype = args.archetype as string | undefined;

            if (!npcName) {
              result = { success: false, message: 'NPC name required' };
              break;
            }

            // Resolve voice: prefer explicit voiceId, then voice_type, then dynamic match
            let resolvedVoiceId = voiceId;
            if (!resolvedVoiceId && voiceType) {
              const voiceProfile = NPC_VOICE_LIBRARY.find((v) => v.id === voiceType);
              resolvedVoiceId = voiceProfile?.voiceId || NPC_VOICE_LIBRARY[0].voiceId;
            }

            // Dynamic voice matching via API when no explicit voice provided
            if (!resolvedVoiceId) {
              try {
                const usedVoiceIds = store.activeScene.activeNPCs.map((n) => n.voiceId).filter(Boolean);
                const matchRes = await fetch('/api/elevenlabs/npc-voice-match', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    npcName,
                    gender,
                    age,
                    accent,
                    personality,
                    archetype,
                    description,
                    usedVoiceIds,
                  }),
                });
                if (matchRes.ok) {
                  const matchData = await matchRes.json();
                  resolvedVoiceId = matchData.voiceId;
                  console.log(`[RPG] Voice matched for ${npcName}: ${matchData.voiceName} (${matchData.source})`);
                }
              } catch (err) {
                console.error('[RPG] Voice match failed, using fallback:', err);
              }
            }

            // Final fallback
            if (!resolvedVoiceId) {
              resolvedVoiceId = NPC_VOICE_LIBRARY[0].voiceId;
            }

            // Create NPC
            const npcData: Omit<NPCharacter, 'id' | 'isVisible' | 'isSpeaking' | 'dialogueHistory'> = {
              name: npcName,
              title,
              race,
              description,
              personality,
              portraitPrompt,
              portraitStyle: 'transparent',
              voiceId: resolvedVoiceId || NPC_VOICE_LIBRARY[0].voiceId,
              relationship,
              position,
            };

            const npcId = store.showNPC(npcData);

            // Generate portrait in background, then parallelize bg removal + depth
            if (portraitPrompt) {
              generateNPCPortrait(portraitPrompt).then(async (url) => {
                if (!url) return;
                store.updateNPCPortrait(npcId, url);

                // Persist portrait to permanent storage (fire and forget)
                persistMediaUrl(url, 'portrait', (permanentUrl) => {
                  store.updateNPCPortrait(npcId, permanentUrl);
                });

                const settings = useVoice31RPGStore.getState().currentSaveFile?.settings;

                // Run bg removal and depth estimation IN PARALLEL
                const bgRemovalPromise = (settings?.enableBgRemoval !== false)
                  ? chainBgRemoval(url).then((bgRemovedUrl) => {
                      if (bgRemovedUrl) {
                        store.updateNPCBgRemoved(npcId, bgRemovedUrl);
                        persistMediaUrl(bgRemovedUrl, 'portrait');
                      }
                    }).catch((e) => console.warn('[RPGTools] BG removal failed for NPC:', npcId, e))
                  : Promise.resolve();

                const depthPromise = (settings?.enableDepthParallax !== false)
                  ? chainDepthEstimation(url).then((depthUrl) => {
                      if (depthUrl) store.updateNPCDepthMap(npcId, depthUrl);
                    }).catch((e) => console.warn('[RPGTools] Depth estimation failed for NPC:', npcId, e))
                  : Promise.resolve();

                await Promise.allSettled([bgRemovalPromise, depthPromise]);

                // Auto-size based on NPC significance
                const sizeLookup: Record<string, 'large' | 'medium' | 'small'> = {
                  boss: 'large', king: 'large', queen: 'large', dragon: 'large', lord: 'large',
                  merchant: 'small', guard: 'small', villager: 'small', peasant: 'small',
                };
                const nameLC = npcName.toLowerCase();
                const detectedSize = Object.entries(sizeLookup).find(([key]) =>
                  nameLC.includes(key) || (description && description.toLowerCase().includes(key))
                )?.[1] || 'medium';
                store.updateNPCDisplaySize(npcId, detectedSize);
              });
            }

            // Build memory context for this NPC so AI knows their history
            let npcMemoryContext = '';
            const showNpcGameTime = store.getGameTime();
            if (showNpcGameTime) {
              const npcMemory = store.getNPCMemory(npcId);
              if (npcMemory && npcMemory.memories.length > 0) {
                const dialogCtx = buildDialogContext({
                  npcMemory,
                  currentTime: showNpcGameTime,
                  playerName: store.currentSaveFile?.player.name || 'Player',
                  playerLevel: store.currentSaveFile?.player.stats.level || 1,
                  locationName: store.activeScene.location?.name || 'unknown',
                });
                npcMemoryContext = dialogCtx.shortContext;
              }
            }

            result = {
              success: true,
              message: `${npcName} has appeared`,
              context: { npcId, npcName, position, voiceId: resolvedVoiceId, memoryContext: npcMemoryContext || undefined },
            };
            break;
          }

          case 'npc_speak': {
            const npcId = args.npc_id as string;
            const dialogue = args.dialogue as string;
            const emotion = args.emotion as string | undefined;

            // Find NPC by ID or name
            const npc = store.activeScene.activeNPCs.find(
              (n) => n.id === npcId || n.name.toLowerCase() === (npcId || '').toLowerCase()
            );

            if (!npc) {
              result = { success: false, message: `NPC "${npcId}" not found in scene` };
              break;
            }

            store.npcSpeak(npc.id, dialogue, emotion);

            // Record NPC interaction memory
            const gameTime = store.getGameTime();
            if (gameTime) {
              store.updateNPCMemory(npc.id, (mem) => addMemory(mem, {
                type: 'interaction',
                description: `Spoke with the player: "${dialogue.substring(0, 80)}${dialogue.length > 80 ? '...' : ''}"`,
                importance: 30,
                emotionalImpact: emotion === 'angry' ? -20 : emotion === 'happy' ? 15 : 0,
                timestamp: gameTime,
                locationId: store.activeScene.location?.id,
                locationName: store.activeScene.location?.name,
                involvedCharacters: [npc.id],
                tags: ['dialogue', emotion || 'neutral'],
              }));
            }

            // NPC voice synthesis is handled by the provider (ElevenLabs/FAL)
            // after the tool call returns - not here, to avoid duplicate audio.

            result = {
              success: true,
              message: `${npc.name} speaks`,
              context: { npcId: npc.id, npcName: npc.name, dialogue, voiceId: npc.voiceId },
            };
            break;
          }

          case 'dismiss_npc': {
            const npcId = args.npc_id as string;

            const npc = store.activeScene.activeNPCs.find(
              (n) => n.id === npcId || n.name.toLowerCase() === (npcId || '').toLowerCase()
            );

            if (!npc) {
              result = { success: false, message: `NPC "${npcId}" not found` };
              break;
            }

            store.dismissNPC(npc.id);

            result = {
              success: true,
              message: `${npc.name} has left the scene`,
              context: { npcId: npc.id, npcName: npc.name },
            };
            break;
          }

          case 'dismiss_all_npcs': {
            store.dismissAllNPCs();
            result = { success: true, message: 'All NPCs dismissed' };
            break;
          }

          // =============================================================================
          // PLAYER MANAGEMENT
          // =============================================================================

          case 'update_player_stats': {
            const healthChange = args.health_change as number | undefined;
            const manaChange = args.mana_change as number | undefined;
            const expGain = args.exp_gain as number | undefined;

            if (healthChange !== undefined) {
              if (healthChange > 0) {
                store.applyHealing(healthChange);
              } else if (healthChange < 0) {
                store.applyDamage(Math.abs(healthChange));
              }
            }

            if (manaChange !== undefined) {
              const currentMana = store.currentSaveFile?.player.stats.mana || 0;
              const maxMana = store.currentSaveFile?.player.stats.maxMana || 50;
              const newMana = Math.max(0, Math.min(maxMana, currentMana + manaChange));
              store.updatePlayerStats({ mana: newMana });
            }

            if (expGain !== undefined && expGain > 0) {
              store.addExperience(expGain);
            }

            result = {
              success: true,
              message: 'Player stats updated',
              context: { healthChange, manaChange, expGain },
            };
            if (expGain && expGain > 0) {
              triggerAutoSave(`exp gain: ${expGain}`);
            }
            break;
          }

          case 'give_item': {
            const itemName = args.item_name as string;
            const itemType = (args.item_type as ItemType) || 'misc';
            const description = (args.description as string) || '';
            const rarity = (args.rarity as ItemRarity) || 'common';
            const quantity = (args.quantity as number) || 1;
            const value = (args.value as number) || 0;

            if (!itemName) {
              result = { success: false, message: 'Item name required' };
              break;
            }

            const itemData: Omit<InventoryItem, 'id'> = {
              name: itemName,
              description,
              type: itemType,
              rarity,
              quantity,
              equipped: false,
              value,
            };

            const itemId = store.addItem(itemData);

            store.logStoryEvent({
              type: 'item',
              summary: `Obtained ${itemName}`,
              fullText: `Received: ${itemName} - ${description}`,
              locationId: store.activeScene.location?.id || 'unknown',
              locationName: store.activeScene.location?.name || 'Unknown',
              participants: [],
              important: rarity === 'epic' || rarity === 'legendary',
            });

            result = {
              success: true,
              message: `Received ${itemName}`,
              context: { itemId, itemName, itemType, rarity, quantity },
            };
            break;
          }

          case 'give_gold': {
            const amount = args.amount as number;
            if (!amount || amount <= 0) {
              result = { success: false, message: 'Valid gold amount required' };
              break;
            }

            store.addGold(amount);
            result = {
              success: true,
              message: `Received ${amount} gold`,
              context: { amount },
            };
            break;
          }

          // =============================================================================
          // QUESTS
          // =============================================================================

          case 'add_quest': {
            const questName = args.name as string;
            const questDescription = args.description as string;
            const objectives = args.objectives as QuestObjective[] | undefined;
            const rewards = args.rewards as QuestReward[] | undefined;
            const giverId = args.giver_id as string | undefined;
            const giverName = args.giver_name as string | undefined;

            if (!questName || !questDescription) {
              result = { success: false, message: 'Quest name and description required' };
              break;
            }

            const questData: Omit<Quest, 'id' | 'status' | 'startedAt'> = {
              name: questName,
              description: questDescription,
              objectives: objectives || [],
              rewards: rewards || [],
              giverId,
              giverName,
            };

            const questId = store.addQuest(questData);

            result = {
              success: true,
              message: `Quest "${questName}" added`,
              context: { questId, questName },
            };
            break;
          }

          case 'update_quest': {
            const questId = args.quest_id as string;
            const status = args.status as 'active' | 'completed' | 'failed' | undefined;
            const objectiveId = args.objective_id as string | undefined;
            const progress = args.progress as number | undefined;

            if (status) {
              if (status === 'completed') {
                store.completeQuest(questId);
              } else if (status === 'failed') {
                store.failQuest(questId);
              } else {
                store.updateQuestStatus(questId, status);
              }
            }

            if (objectiveId && progress !== undefined) {
              store.updateQuestObjective(questId, objectiveId, progress);
            }

            result = {
              success: true,
              message: 'Quest updated',
              context: { questId, status, objectiveId, progress },
            };
            if (status === 'completed' || status === 'failed') {
              triggerAutoSave(`quest ${status}: ${questId}`);
            }
            break;
          }

          // =============================================================================
          // DIALOGUE
          // =============================================================================

          case 'show_choices': {
            const prompt = args.prompt as string;
            const choices = args.choices as Array<{
              id: string;
              text: string;
              consequence?: string;
            }>;

            if (!choices || choices.length === 0) {
              result = { success: false, message: 'Choices array required' };
              break;
            }

            const dialogueOptions: DialogueOption[] = choices.map((c, index) => ({
              id: c.id || `choice_${index}`,
              text: c.text,
              consequence: c.consequence,
            }));

            store.showDialogueOptions(dialogueOptions);

            result = {
              success: true,
              message: `Showing ${choices.length} choices`,
              context: { prompt, choiceCount: choices.length },
            };
            break;
          }

          // =============================================================================
          // STORY & NARRATION
          // =============================================================================

          case 'log_story_event': {
            const eventType = (args.type as StoryEventType) || 'narrative';
            const summary = args.summary as string;
            const fullText = args.full_text as string;
            const important = args.important as boolean | undefined;

            if (!summary || !fullText) {
              result = { success: false, message: 'Summary and full_text required' };
              break;
            }

            const eventId = store.logStoryEvent({
              type: eventType,
              summary,
              fullText,
              locationId: store.activeScene.location?.id || 'unknown',
              locationName: store.activeScene.location?.name || 'Unknown',
              participants: [],
              important: important || false,
            });

            result = {
              success: true,
              message: 'Story event logged',
              context: { eventId, eventType, summary },
            };
            break;
          }

          case 'update_scene_background': {
            const backgroundPrompt = args.background_prompt as string;
            const reason = args.reason as string | undefined;
            const bgTheme = args.theme as string | undefined;

            if (!backgroundPrompt) {
              result = { success: false, message: 'background_prompt required' };
              break;
            }

            // Show loading state
            store.setBackgroundLoading(true);

            // Generate new background with theme-enhanced prompt
            const newBgUrl = await generateSceneBackground(backgroundPrompt, bgTheme);
            if (newBgUrl) {
              store.updateSceneBackground(newBgUrl);

              // Chain depth estimation (non-blocking)
              const settings = store.currentSaveFile?.settings;
              if (settings?.enableDepthParallax !== false) {
                store.setDepthMapLoading(true);
                chainDepthEstimation(newBgUrl).then((depthUrl) => {
                  if (depthUrl) {
                    store.updateSceneDepthMap(depthUrl);
                  } else {
                    store.setDepthMapLoading(false);
                  }
                });
              }
            } else {
              store.setBackgroundLoading(false);
            }

            result = {
              success: !!newBgUrl,
              message: newBgUrl ? 'Scene background updated' : 'Failed to generate background',
              context: { backgroundPrompt, reason },
            };
            break;
          }

          case 'set_narration': {
            const text = args.text as string;
            if (!text) {
              result = { success: false, message: 'Narration text required' };
              break;
            }

            useVoice31RPGStore.setState((state) => ({
              activeScene: { ...state.activeScene, lastNarration: text },
            }));

            result = {
              success: true,
              message: 'Narration set',
              context: { text: text.slice(0, 50) + '...' },
            };
            break;
          }

          // =============================================================================
          // DICE ROLLS
          // =============================================================================

          case 'roll_dice': {
            const dice = args.dice as string;
            const purpose = args.purpose as string;
            const dc = args.dc as number | undefined;

            if (!dice || !purpose) {
              result = { success: false, message: 'Dice notation and purpose required' };
              break;
            }

            playSFX('dice_roll');
            const rollResult = await store.rollDice(dice, purpose, dc);

            result = {
              success: true,
              message: `Rolled ${dice}: ${rollResult.result}${dc ? ` vs DC ${dc} - ${rollResult.success ? 'SUCCESS' : 'FAILURE'}` : ''}`,
              context: { dice, purpose, ...rollResult, dc },
            };
            break;
          }

          // =============================================================================
          // COMBAT
          // =============================================================================

          case 'play_sfx': {
            const sfxName = args.sfx as string || args.name as string;
            if (sfxName) {
              playSFX(sfxName);
              result = { success: true, message: `SFX played: ${sfxName}` };
            } else {
              result = { success: false, message: 'SFX name required' };
            }
            break;
          }

          case 'start_combat': {
            const enemies = args.enemies as Array<{
              name: string;
              health: number;
              maxHealth?: number;
              initiative?: number;
              portraitUrl?: string;
            }>;

            if (!enemies || enemies.length === 0) {
              result = { success: false, message: 'Enemies array required' };
              break;
            }

            playSFX('sword_swing');

            const combatParticipants = enemies.map((e, i) => ({
              id: `enemy_${Date.now()}_${i}`,
              name: e.name,
              isPlayer: false,
              isNPC: true,
              health: e.health,
              maxHealth: e.maxHealth || e.health,
              initiative: e.initiative || Math.floor(Math.random() * 20) + 1,
              statusEffects: [],
              portraitUrl: e.portraitUrl,
            }));

            store.startCombat(combatParticipants);

            result = {
              success: true,
              message: `Combat started with ${enemies.length} enemies`,
              context: { enemyCount: enemies.length, enemies: enemies.map((e) => e.name) },
            };
            break;
          }

          case 'end_combat': {
            const victory = args.victory as boolean;
            store.endCombat(victory);

            result = {
              success: true,
              message: victory ? 'Victory!' : 'Defeat...',
              context: { victory },
            };
            triggerAutoSave(`combat end: ${victory ? 'victory' : 'defeat'}`);
            break;
          }

          // =============================================================================
          // SAVE/LOAD
          // =============================================================================

          case 'save_game': {
            const slotName = args.slot_name as string | undefined;
            store.saveGame(slotName);

            result = {
              success: true,
              message: 'Game saved',
              context: { slotName },
            };
            break;
          }

          // =============================================================================
          // GLOBAL FLAGS
          // =============================================================================

          case 'set_flag': {
            const key = args.key as string;
            const value = args.value as boolean | number | string;

            if (!key) {
              result = { success: false, message: 'Flag key required' };
              break;
            }

            store.setFlag(key, value);

            result = {
              success: true,
              message: `Flag "${key}" set`,
              context: { key, value },
            };
            break;
          }

          case 'check_flag': {
            const key = args.key as string;
            const flagValue = store.getFlag(key);

            result = {
              success: true,
              message: `Flag "${key}" = ${flagValue}`,
              context: { key, value: flagValue },
            };
            break;
          }

          // =============================================================================
          // NPC RELATIONSHIP
          // =============================================================================

          case 'update_relationship': {
            const npcId = args.npc_id as string;
            const change = args.change as number;

            const npc = store.activeScene.activeNPCs.find(
              (n) => n.id === npcId || n.name.toLowerCase() === (npcId || '').toLowerCase()
            );

            if (!npc) {
              result = { success: false, message: `NPC "${npcId}" not found` };
              break;
            }

            store.updateNPCRelationship(npc.id, change);

            const newRelationship = Math.max(-100, Math.min(100, npc.relationship + change));
            result = {
              success: true,
              message: `${npc.name}'s relationship ${change > 0 ? 'improved' : 'worsened'}`,
              context: { npcId: npc.id, npcName: npc.name, change, newRelationship },
            };
            break;
          }

          default:
            result = { success: false, message: `Unknown RPG tool: ${name}` };
        }
      } catch (error) {
        console.error('[RPG Tool Error]', name, error);
        result = {
          success: false,
          message: error instanceof Error ? error.message : 'Tool execution failed',
          context: { error: String(error) },
        };
      }

      logRPGToolResult(name, result);
      return result;
    },
  };
}

// =============================================================================
// SINGLETON HANDLER
// =============================================================================

let rpgToolHandler: RPGToolCallHandler | null = null;

export function getRPGToolHandler(): RPGToolCallHandler {
  if (!rpgToolHandler) {
    rpgToolHandler = createRPGToolHandler();
  }
  return rpgToolHandler;
}

export default createRPGToolHandler;
