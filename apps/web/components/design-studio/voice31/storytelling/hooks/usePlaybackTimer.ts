'use client';

import { useRef, useCallback, useEffect, useState } from 'react';

/**
 * rAF loop providing progress 0→1 for the current scene.
 * Runs at 60fps via requestAnimationFrame — state is ref-based
 * to avoid re-rendering the global store.
 *
 * Uses a ref for onComplete to prevent RAF loop restarts when
 * the callback reference changes (e.g. inline arrow functions).
 */

export interface PlaybackTimerState {
  progress: number;
  time: number; // seconds since scene start
}

export function usePlaybackTimer(
  duration: number,
  isPlaying: boolean,
  onComplete: () => void
): PlaybackTimerState {
  const [state, setState] = useState<PlaybackTimerState>({ progress: 0, time: 0 });
  const startTimeRef = useRef<number>(0);
  const rafRef = useRef<number>(0);
  const onCompleteRef = useRef(onComplete);

  // Keep ref in sync without triggering effect re-runs
  onCompleteRef.current = onComplete;

  const tick = useCallback(() => {
    const elapsed = (performance.now() - startTimeRef.current) / 1000;
    const progress = Math.min(elapsed / duration, 1);
    setState({ progress, time: elapsed });

    if (progress >= 1) {
      onCompleteRef.current();
      return;
    }

    rafRef.current = requestAnimationFrame(tick);
  }, [duration]);

  useEffect(() => {
    if (isPlaying && duration > 0) {
      startTimeRef.current = performance.now();
      setState({ progress: 0, time: 0 });
      rafRef.current = requestAnimationFrame(tick);
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying, duration, tick]);

  // Reset when not playing
  useEffect(() => {
    if (!isPlaying) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    }
  }, [isPlaying]);

  return state;
}
