'use client';

/**
 * useRPGAutoScene
 *
 * Watches the assistant's narration text for location-change keywords
 * and auto-generates background images when a scene shift is detected.
 *
 * Trigger phrases: "you enter", "you arrive at", "the scene shifts to",
 * "you find yourself in", "walking into", "stepping through",
 * "the path leads to", "you step into", "before you lies".
 *
 * Has a 30-second cooldown to prevent rapid re-generation.
 * Only active when rpgModeActive === true.
 */

import { useEffect, useRef } from 'react';
import { useVoice31Store } from './Voice31Store';
import { useVoice31RPGStore } from './Voice31RPGStore';

const LOCATION_TRIGGERS = [
  'you enter',
  'you arrive at',
  'you arrive in',
  'the scene shifts to',
  'you find yourself in',
  'walking into',
  'stepping through',
  'the path leads to',
  'you step into',
  'before you lies',
  'you emerge into',
  'you walk into',
  'you come upon',
  'stretching before you',
  'you venture into',
];

const COOLDOWN_MS = 30_000;

export function useRPGAutoScene() {
  const rpgModeActive = useVoice31RPGStore((s) => s.rpgModeActive);
  const lastTextRef = useRef('');
  const lastTriggerTimeRef = useRef(0);
  const isGeneratingRef = useRef(false);

  useEffect(() => {
    if (!rpgModeActive) return;

    const unsubscribe = useVoice31Store.subscribe((state) => {
      const currentText = (state.displayContent.text || state.overlayText || '').toLowerCase();

      if (currentText === lastTextRef.current) return;
      const newText = currentText.slice(lastTextRef.current.length);
      lastTextRef.current = currentText;

      // Check cooldown
      const now = Date.now();
      if (now - lastTriggerTimeRef.current < COOLDOWN_MS) return;
      if (isGeneratingRef.current) return;

      // Check for location-change triggers in the new text chunk
      for (const trigger of LOCATION_TRIGGERS) {
        const triggerIdx = newText.indexOf(trigger);
        if (triggerIdx === -1) continue;

        // Extract location description: next 15-25 words after the trigger
        const afterTrigger = newText.slice(triggerIdx + trigger.length).trim();
        const words = afterTrigger.split(/\s+/).slice(0, 20);
        if (words.length < 3) continue;

        // Build location description, clean up punctuation at end
        let locationDesc = words.join(' ').replace(/[.!?,;:]+$/, '').trim();
        if (!locationDesc) continue;

        console.log('[RPGAutoScene] Detected location change:', trigger, '→', locationDesc);

        lastTriggerTimeRef.current = now;
        isGeneratingRef.current = true;

        // Generate background asynchronously
        generateBackground(locationDesc).finally(() => {
          isGeneratingRef.current = false;
        });

        break; // Only trigger once per text update
      }
    });

    return () => unsubscribe();
  }, [rpgModeActive]);
}

async function generateBackground(description: string): Promise<void> {
  const store = useVoice31RPGStore.getState();
  const theme = store.currentSaveFile?.settings?.theme || 'fantasy';

  store.setBackgroundLoading(true);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const response = await fetch('/api/voice31/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        category: 'scene',
        prompt: `${description}, RPG scene, atmospheric, cinematic lighting, detailed background, wide angle`,
        style: theme,
        forceSchnell: true,
      }),
    });

    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      const url = data.image?.url || data.media?.[0]?.url;
      if (url) {
        console.log('[RPGAutoScene] Background generated:', url.substring(0, 80));
        store.updateSceneBackground(url);
      }
    }
  } catch (error) {
    console.warn('[RPGAutoScene] Background generation failed:', error);
  } finally {
    store.setBackgroundLoading(false);
  }
}
