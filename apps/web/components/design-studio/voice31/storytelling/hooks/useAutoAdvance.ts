'use client';

import { useEffect, useRef } from 'react';
import { useStorytellingStore } from '../StorytellingStore';

/**
 * Auto-advances to the next scene when:
 * 1. In 'separate_voice' mode: the current scene's audio finishes playing
 * 2. In 'assistant' mode: generous timer-based fallback (primary sync is useNarrationSync)
 * 3. In 'text_only' mode: scene duration elapses
 * 4. Fallback: scene duration timer for any mode without audio
 *
 * Enforces a minimum scene display time of 8 seconds to prevent rapid jumping.
 */

const MIN_SCENE_DISPLAY_MS = 8000;

export function useAutoAdvance() {
  const playerState = useStorytellingStore((s) => s.playerState);
  const scenes = useStorytellingStore((s) => s.scenes);
  const currentSceneIndex = useStorytellingStore((s) => s.currentSceneIndex);
  const advanceScene = useStorytellingStore((s) => s.advanceScene);
  const sceneStartTime = useStorytellingStore((s) => s.sceneStartTime);
  const narrationMode = useStorytellingStore((s) => s.narrationMode);

  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const sceneStartRef = useRef<number>(Date.now());

  // Track scene start time
  useEffect(() => {
    if (playerState === 'playing') {
      sceneStartRef.current = Date.now();
    }
  }, [playerState, currentSceneIndex]);

  // Guarded advance that enforces minimum scene display time
  const guardedAdvance = () => {
    const elapsed = Date.now() - sceneStartRef.current;
    if (elapsed < MIN_SCENE_DISPLAY_MS) {
      // Schedule advancement after remaining minimum time
      const remaining = MIN_SCENE_DISPLAY_MS - elapsed;
      console.log(`[AutoAdvance] Delaying advance by ${remaining}ms to meet minimum display time`);
      timerRef.current = setTimeout(() => {
        advanceScene();
      }, remaining);
      return;
    }
    advanceScene();
  };

  useEffect(() => {
    if (playerState !== 'playing') {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    const currentEntry = scenes[currentSceneIndex];
    if (!currentEntry) return;

    const { scene, audioElement } = currentEntry;

    // In assistant-narrated mode, useNarrationSync drives scene advancement.
    // We set a generous fallback timer to prevent scenes from hanging
    // if the narration sync misses a marker.
    if (narrationMode === 'assistant') {
      // Safety-net fallback: duration * 1.5 (primary sync is useNarrationSync duration-based)
      const fallbackMs = scene.duration * 1.5 * 1000;
      timerRef.current = setTimeout(() => {
        console.log('[AutoAdvance] Fallback timer hit for scene', currentSceneIndex, '(assistant mode)');
        guardedAdvance();
      }, fallbackMs);

      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }

    // In separate_voice mode: audio drives advancement
    if (narrationMode === 'separate_voice' && audioElement) {
      const handleEnded = () => {
        console.log('[AutoAdvance] Audio ended for scene', currentSceneIndex);
        guardedAdvance();
      };

      audioElement.addEventListener('ended', handleEnded);
      audioElement.currentTime = 0;
      audioElement.play().catch((err) => {
        console.warn('[AutoAdvance] Audio play failed:', err);
        timerRef.current = setTimeout(guardedAdvance, scene.duration * 1000);
      });

      return () => {
        audioElement.removeEventListener('ended', handleEnded);
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }

    // text_only mode or no audio — use scene duration
    timerRef.current = setTimeout(() => {
      console.log('[AutoAdvance] Duration elapsed for scene', currentSceneIndex);
      guardedAdvance();
    }, scene.duration * 1000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [playerState, currentSceneIndex, scenes, advanceScene, sceneStartTime, narrationMode]);
}
