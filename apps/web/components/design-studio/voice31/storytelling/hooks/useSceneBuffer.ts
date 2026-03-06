'use client';

import { useEffect, useRef } from 'react';
import { useStorytellingStore } from '../StorytellingStore';

/**
 * Watches for scenes that become 'ready' and auto-transitions
 * from buffering → playing when the next scene is available.
 *
 * Includes a staleness timeout: if stuck in 'buffering' for 30s
 * with no progress, forces state to 'complete' to prevent infinite hang.
 */
export function useSceneBuffer() {
  const playerState = useStorytellingStore((s) => s.playerState);
  const scenes = useStorytellingStore((s) => s.scenes);
  const currentSceneIndex = useStorytellingStore((s) => s.currentSceneIndex);
  const setPlayerState = useStorytellingStore((s) => s.setPlayerState);
  const setSceneStartTime = useStorytellingStore((s) => s.setSceneStartTime);
  const generationComplete = useStorytellingStore((s) => s.generationComplete);
  const markGenerationComplete = useStorytellingStore((s) => s.markGenerationComplete);

  const bufferTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    // Clear any existing timeout when state changes
    if (bufferTimeoutRef.current) {
      clearTimeout(bufferTimeoutRef.current);
      bufferTimeoutRef.current = undefined;
    }

    // When buffering: check if the target scene is now ready
    if (playerState === 'buffering') {
      const target = scenes[currentSceneIndex];
      if (target && target.status === 'ready') {
        console.log('[SceneBuffer] Scene ready, transitioning to playing:', currentSceneIndex);
        setPlayerState('playing');
        setSceneStartTime(performance.now());
        return;
      }

      // When generating completes and we're past all scenes
      if (generationComplete && currentSceneIndex >= scenes.length) {
        setPlayerState('complete');
        return;
      }

      // Staleness timeout: if stuck in buffering for 30s, force complete
      bufferTimeoutRef.current = setTimeout(() => {
        const state = useStorytellingStore.getState();
        if (state.playerState === 'buffering') {
          console.warn('[SceneBuffer] Stuck in buffering for 30s — forcing complete');
          if (!state.generationComplete) {
            markGenerationComplete();
          }
          setPlayerState('complete');
        }
      }, 30_000);
    }

    // When generating: check if first scene is ready to start playback
    if (playerState === 'generating') {
      if (scenes.length > 0 && scenes[0].status === 'ready') {
        console.log('[SceneBuffer] First scene ready, starting playback');
        setPlayerState('playing');
        setSceneStartTime(performance.now());
      }
    }

    return () => {
      if (bufferTimeoutRef.current) {
        clearTimeout(bufferTimeoutRef.current);
        bufferTimeoutRef.current = undefined;
      }
    };
  }, [playerState, scenes, currentSceneIndex, generationComplete, setPlayerState, setSceneStartTime, markGenerationComplete]);
}
