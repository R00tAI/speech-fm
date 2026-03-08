'use client';

/**
 * useVisualIntelligence Hook
 *
 * The brain of the ambient background system. Monitors conversation text,
 * extracts keywords, detects topic changes, and triggers background fetches
 * from Unsplash (standard) or Flux Schnell (cinematic).
 *
 * Debounce: 8s after topic change before fetching
 * Cooldown: 20s minimum between background changes
 * Budget:  max 30 Flux/session, max 40 Unsplash/hour
 */

import { useEffect, useRef, useCallback } from 'react';
import { useVoice31Store } from '../Voice31Store';
import { extractKeywords } from '@/lib/design-studio/voice-display/dynamic-icon-system';

// =============================================================================
// CONSTANTS
// =============================================================================

const DEBOUNCE_MS = 8000;
const COOLDOWN_MS = 20000;
const MAX_FLUX_PER_SESSION = 30;
const MAX_UNSPLASH_PER_HOUR = 40;

// =============================================================================
// FLUX PROMPT TEMPLATE
// =============================================================================

function buildFluxPrompt(keywords: string[]): string {
  return `Atmospheric wide-angle background: ${keywords.join(', ')}. Cinematic lighting, moody, soft focus, 16:9 aspect ratio, no text, no people in foreground.`;
}

// =============================================================================
// TOPIC SIGNATURE
// =============================================================================

function computeTopicSignature(keywords: string[]): string {
  return [...new Set(keywords)]
    .sort()
    .slice(0, 3)
    .join(',');
}

// =============================================================================
// HOOK
// =============================================================================

export function useVisualIntelligence() {
  const assistantText = useVoice31Store((s) => s.assistantText);
  const overlayText = useVoice31Store((s) => s.overlayText);
  const vi = useVoice31Store((s) => s.visualIntelligence);

  const setAmbientBackground = useVoice31Store((s) => s.setAmbientBackground);
  const updateTopicSignature = useVoice31Store((s) => s.updateTopicSignature);
  const incrementFluxGeneration = useVoice31Store((s) => s.incrementFluxGeneration);
  const incrementUnsplashRequest = useVoice31Store((s) => s.incrementUnsplashRequest);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSignatureRef = useRef<string | null>(null);
  const isFetchingRef = useRef(false);

  // Check if budget allows a request
  const canFetchUnsplash = useCallback(() => {
    const hourElapsed = Date.now() - vi.sessionStartTime;
    // Reset hourly counter if over an hour
    if (hourElapsed > 3600000) return true;
    return vi.unsplashRequestsUsed < MAX_UNSPLASH_PER_HOUR;
  }, [vi.unsplashRequestsUsed, vi.sessionStartTime]);

  const canFetchFlux = useCallback(() => {
    return vi.fluxGenerationsUsed < MAX_FLUX_PER_SESSION;
  }, [vi.fluxGenerationsUsed]);

  // Fetch background from Unsplash
  const fetchUnsplash = useCallback(async (keywords: string[]) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      const res = await fetch('/api/voice31/visual-intelligence/stock-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords }),
      });
      if (!res.ok) throw new Error(`Unsplash API ${res.status}`);
      const data = await res.json();
      if (data.url) {
        incrementUnsplashRequest();
        setAmbientBackground(data.url, 'dissolve');
      }
    } catch (err) {
      console.warn('[VisualIntelligence] Unsplash fetch failed:', err);
    } finally {
      isFetchingRef.current = false;
    }
  }, [setAmbientBackground, incrementUnsplashRequest]);

  // Fetch background from Flux Schnell
  const fetchFlux = useCallback(async (keywords: string[]) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      const prompt = buildFluxPrompt(keywords);
      const res = await fetch('/api/voice31/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'background',
          prompt,
          dimensions: { width: 1344, height: 768 },
          forceSchnell: true,
          saveToAccount: false,
          numImages: 1,
        }),
      });
      if (!res.ok) throw new Error(`Flux API ${res.status}`);
      const data = await res.json();
      const imageUrl = data.images?.[0]?.url || data.url;
      if (imageUrl) {
        incrementFluxGeneration();
        setAmbientBackground(imageUrl, 'crt_static');
      }
    } catch (err) {
      console.warn('[VisualIntelligence] Flux fetch failed:', err);
    } finally {
      isFetchingRef.current = false;
    }
  }, [setAmbientBackground, incrementFluxGeneration]);

  // Main effect: monitor text changes
  useEffect(() => {
    // Only active for standard and cinematic levels
    if (vi.displayLevel !== 'standard' && vi.displayLevel !== 'cinematic') return;
    if (!vi.topicDetectionEnabled) return;

    // Combine text sources
    const text = (overlayText || '') + ' ' + (assistantText || '');
    if (text.trim().length < 10) return;

    // Extract keywords
    const keywords = extractKeywords(text, { maxKeywords: 6, expandSynonyms: false });
    if (keywords.length === 0) return;

    // Compute topic signature
    const signature = computeTopicSignature(keywords);

    // Skip if same topic
    if (signature === vi.topicSignature) return;

    // Store the pending signature
    pendingSignatureRef.current = signature;

    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce: wait 8s to see if topic stabilizes
    debounceRef.current = setTimeout(() => {
      // Verify topic hasn't changed during debounce
      if (pendingSignatureRef.current !== signature) return;

      // Check cooldown
      const timeSinceLastChange = Date.now() - vi.lastBackgroundChangeTime;
      if (vi.lastBackgroundChangeTime > 0 && timeSinceLastChange < COOLDOWN_MS) return;

      // Update topic signature
      updateTopicSignature(signature);

      // Determine source
      const { displayLevel, backgroundSource } = vi;

      const useFlux = displayLevel === 'cinematic' &&
        (backgroundSource === 'auto' || backgroundSource === 'flux') &&
        canFetchFlux();

      const useUnsplash = !useFlux &&
        (backgroundSource === 'auto' || backgroundSource === 'unsplash') &&
        canFetchUnsplash();

      if (useFlux) {
        fetchFlux(keywords);
      } else if (useUnsplash) {
        fetchUnsplash(keywords);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [
    assistantText,
    overlayText,
    vi.displayLevel,
    vi.topicDetectionEnabled,
    vi.topicSignature,
    vi.lastBackgroundChangeTime,
    vi.backgroundSource,
    updateTopicSignature,
    canFetchFlux,
    canFetchUnsplash,
    fetchFlux,
    fetchUnsplash,
  ]);
}
