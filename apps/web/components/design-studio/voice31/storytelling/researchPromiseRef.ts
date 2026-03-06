/**
 * Module-level ref for sharing the research promise between the tool handler
 * and the StorytellingOrchestrator without putting a non-serializable Promise
 * in the Zustand store.
 */

import type { ResearchContext } from './types';

let _researchPromise: Promise<ResearchContext | null> | null = null;

export function setResearchPromiseRef(p: Promise<ResearchContext | null> | null) {
  _researchPromise = p;
}

export function getResearchPromiseRef(): Promise<ResearchContext | null> | null {
  return _researchPromise;
}

export function clearResearchPromiseRef() {
  _researchPromise = null;
}
