'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useStorytellingStore } from '../StorytellingStore';
import { useVoice31Store } from '../../Voice31Store';

/**
 * useNarrationSync
 *
 * Duration-based scene advancement for assistant-narrated mode.
 *
 * PRIMARY: Computes cumulative durations from the scenes array and uses
 * a 500ms interval to determine the correct scene index based on elapsed
 * playback time (accounting for pauses).
 *
 * SECONDARY: Still watches for [[SCENE:N]] markers in assistant text as a
 * bonus (costs nothing, works if the model cooperates).
 *
 * TERTIARY: Fuzzy content matching using a 3-keyword window instead of
 * exact 6-word prefix.
 *
 * Auto-pauses when user interrupts (starts speaking), auto-resumes when
 * assistant resumes narration.
 */

const TICK_INTERVAL_MS = 500;

export function useNarrationSync() {
  const narrationMode = useStorytellingStore((s) => s.narrationMode);
  const playerState = useStorytellingStore((s) => s.playerState);
  const scenes = useStorytellingStore((s) => s.scenes);
  const currentSceneIndex = useStorytellingStore((s) => s.currentSceneIndex);
  const lastDetectedSceneMarker = useStorytellingStore((s) => s.lastDetectedSceneMarker);
  const goToScene = useStorytellingStore((s) => s.goToScene);
  const pause = useStorytellingStore((s) => s.pause);
  const play = useStorytellingStore((s) => s.play);
  const setLastDetectedSceneMarker = useStorytellingStore((s) => s.setLastDetectedSceneMarker);
  const setPlayerState = useStorytellingStore((s) => s.setPlayerState);
  const setSceneStartTime = useStorytellingStore((s) => s.setSceneStartTime);
  const setPlaybackStartTime = useStorytellingStore((s) => s.setPlaybackStartTime);

  // Voice31 state
  const isSpeaking = useVoice31Store((s) => s.isSpeaking);
  const isListening = useVoice31Store((s) => s.isListening);

  const isPausedByUserRef = useRef(false);
  const lastTextRef = useRef('');

  // Helper: advance to a scene index if valid and different from current
  const safeGoToScene = useCallback((targetIndex: number) => {
    const state = useStorytellingStore.getState();
    const allScenes = state.scenes;
    const currentIdx = state.currentSceneIndex;

    if (targetIndex < 0 || targetIndex >= allScenes.length || targetIndex === currentIdx) return;

    const target = allScenes[targetIndex];
    if (target && (target.status === 'ready' || target.status === 'complete' || target.status === 'pending')) {
      if (target.status === 'pending') {
        useStorytellingStore.getState().updateSceneStatus(target.scene.id, 'ready');
      }
      console.log(`[NarrationSync] Advancing to scene ${targetIndex + 1}`);
      goToScene(targetIndex);
    }
  }, [goToScene]);

  // ── PRIMARY: Duration-based tick ──────────────────────────────────
  useEffect(() => {
    if (narrationMode !== 'assistant') return;
    if (playerState !== 'playing') return;

    const interval = setInterval(() => {
      const state = useStorytellingStore.getState();
      if (state.playerState !== 'playing') return;
      if (state.playbackStartTime === 0) return;

      const allScenes = state.scenes;
      if (allScenes.length === 0) return;

      // Compute elapsed playback time (excluding pauses) — use performance.now() consistently
      const now = performance.now();
      const elapsed = (now - state.playbackStartTime - state.pauseAccumulator) / 1000;

      // Build cumulative durations
      let cumulative = 0;
      let targetIndex = allScenes.length - 1; // default: last scene
      for (let i = 0; i < allScenes.length; i++) {
        cumulative += allScenes[i].scene.duration;
        if (cumulative > elapsed) {
          targetIndex = i;
          break;
        }
      }

      // Only advance forward, never backward via timer
      if (targetIndex > state.currentSceneIndex) {
        console.log(
          `[NarrationSync] Duration tick: elapsed=${elapsed.toFixed(1)}s → scene ${targetIndex + 1}`
        );
        safeGoToScene(targetIndex);
      }

      // Check if we've exceeded total duration → complete
      const totalDuration = allScenes.reduce((sum, e) => sum + e.scene.duration, 0);
      if (elapsed >= totalDuration && state.generationComplete) {
        console.log('[NarrationSync] All scenes elapsed, completing story');
        useStorytellingStore.getState().setPlayerState('complete');
      }
    }, TICK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [narrationMode, playerState, safeGoToScene]);

  // ── SECONDARY: [[SCENE:N]] marker detection (bonus) ──────────────
  useEffect(() => {
    if (narrationMode !== 'assistant') return;

    const unsubscribe = useVoice31Store.subscribe((state) => {
      const currentText = state.displayContent.text || state.overlayText || '';
      if (currentText === lastTextRef.current) return;
      lastTextRef.current = currentText;

      const storeState = useStorytellingStore.getState();

      // Scan for [[SCENE:N]] markers
      const markerRegex = /\[\[SCENE:(\d+)\]\]/g;
      let maxMarker = storeState.lastDetectedSceneMarker;
      let match;

      while ((match = markerRegex.exec(currentText)) !== null) {
        const sceneNum = parseInt(match[1], 10);
        if (sceneNum > maxMarker) maxMarker = sceneNum;
      }

      if (maxMarker > storeState.lastDetectedSceneMarker) {
        setLastDetectedSceneMarker(maxMarker);
        const targetIndex = maxMarker - 1; // 1-indexed → 0-indexed
        if (targetIndex > storeState.currentSceneIndex) {
          console.log(`[NarrationSync] Marker [[SCENE:${maxMarker}]] detected, advancing`);
          safeGoToScene(targetIndex);
        }
      }

      // TERTIARY: Fuzzy content match — extract 3 keywords from next scene
      const nextIdx = storeState.currentSceneIndex + 1;
      if (nextIdx < storeState.scenes.length) {
        const nextScene = storeState.scenes[nextIdx];
        const transcript = nextScene.scene.transcript.fullText
          .replace(/\[\[SCENE:\d+\]\]/g, '')
          .trim();

        // Extract significant keywords (>4 chars, skip common words)
        const skipWords = new Set(['about', 'their', 'there', 'these', 'those', 'which', 'would', 'could', 'should', 'being', 'after', 'before']);
        const keywords = transcript
          .split(/\s+/)
          .filter((w) => w.length > 4 && !skipWords.has(w.toLowerCase()))
          .slice(0, 5)
          .map((w) => w.toLowerCase().replace(/[^a-z]/g, ''));

        if (keywords.length >= 3) {
          const spoken = currentText.toLowerCase();
          const matchCount = keywords.filter((kw) => spoken.includes(kw)).length;
          if (matchCount >= 3) {
            console.log(`[NarrationSync] Fuzzy content match (${matchCount}/${keywords.length} keywords) → scene ${nextIdx + 1}`);
            safeGoToScene(nextIdx);
          }
        }
      }
    });

    return () => unsubscribe();
  }, [narrationMode, setLastDetectedSceneMarker, safeGoToScene]);

  // ── Auto-pause when user starts speaking (interruption) ──────────
  useEffect(() => {
    if (narrationMode !== 'assistant') return;

    if (isListening && !isPausedByUserRef.current && playerState === 'playing') {
      console.log('[NarrationSync] User speaking — pausing story');
      isPausedByUserRef.current = true;
      pause();
    }
  }, [isListening, narrationMode, playerState, pause]);

  // ── Auto-resume when assistant speaks again ───────────────────────
  useEffect(() => {
    if (narrationMode !== 'assistant') return;

    if (isSpeaking && isPausedByUserRef.current && playerState === 'paused') {
      console.log('[NarrationSync] Assistant resumed speaking — resuming story');
      isPausedByUserRef.current = false;
      play();
    }
  }, [isSpeaking, narrationMode, playerState, play]);

  // ── Start playback when first scene is ready ─────────────────────
  useEffect(() => {
    if (narrationMode !== 'assistant') return;

    if (playerState === 'generating' && scenes.length > 0 && scenes[0].status === 'ready') {
      console.log('[NarrationSync] First scene ready, starting playback');
      setPlayerState('playing');
      setSceneStartTime(performance.now());
      setPlaybackStartTime(performance.now());
    }
  }, [narrationMode, playerState, scenes, setPlayerState, setSceneStartTime, setPlaybackStartTime]);
}
