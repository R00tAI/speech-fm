'use client';

import { useMemo } from 'react';
import type { WordTimestamp } from '../types';

/**
 * Maps current playback time to the active word index for highlight.
 */
export function useWordSync(words: WordTimestamp[], currentTime: number): number {
  return useMemo(() => {
    if (!words || words.length === 0) return -1;

    for (let i = words.length - 1; i >= 0; i--) {
      if (currentTime >= words[i].start) {
        return i;
      }
    }

    return -1;
  }, [words, currentTime]);
}
