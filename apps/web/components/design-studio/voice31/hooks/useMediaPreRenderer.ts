'use client';

/**
 * useMediaPreRenderer
 *
 * Subscribes to storytelling store scene additions. When a new scene
 * with GENERATE: or AUTO placeholder URLs is added, immediately dispatches
 * image generation request (FAL/Flux) and depth map request.
 * Stores results in the Voice31Store preRenderCache.
 */

import { useEffect, useRef } from 'react';
import { useStorytellingStore } from '../storytelling/StorytellingStore';
import { useVoice31Store } from '../Voice31Store';

const GENERATE_PREFIX = 'GENERATE:';
const AUTO_PLACEHOLDER = 'AUTO';

export function useMediaPreRenderer() {
  const requestPreRender = useVoice31Store((s) => s.requestPreRender);
  const updatePreRender = useVoice31Store((s) => s.updatePreRender);
  const getPreRenderedMedia = useVoice31Store((s) => s.getPreRenderedMedia);
  const processedScenes = useRef<Set<string>>(new Set());

  useEffect(() => {
    const unsubscribe = useStorytellingStore.subscribe((state) => {
      const { scenes } = state;
      if (!scenes || scenes.length === 0) return;

      for (const entry of scenes) {
        const sceneId = entry.scene.id;

        // Skip scenes we've already processed
        if (processedScenes.current.has(sceneId)) continue;

        // Check prerenderData for placeholder URLs
        const imageUrl = entry.prerenderData?.imageUrl || '';
        let prompt: string | null = null;

        if (imageUrl.startsWith(GENERATE_PREFIX)) {
          prompt = imageUrl.slice(GENERATE_PREFIX.length).trim();
        } else if (imageUrl === AUTO_PLACEHOLDER) {
          // Use scene caption as prompt
          prompt = entry.scene.caption?.slice(0, 200) || sceneId;
        }

        if (!prompt) continue;

        // Mark as processed
        processedScenes.current.add(sceneId);

        // Check if already cached
        const existing = getPreRenderedMedia(prompt);
        if (existing) continue;

        // Request pre-render for image
        const imageId = requestPreRender(prompt, 'image');
        updatePreRender(imageId, { status: 'generating' });

        // Fire off image generation
        generateImage(prompt)
          .then((url) => {
            updatePreRender(imageId, {
              status: 'ready',
              url,
              completedAt: Date.now(),
            });

            // On image ready, request depth map
            if (url) {
              const depthId = requestPreRender(prompt!, 'depth_map');
              updatePreRender(depthId, { status: 'generating' });

              generateDepthMap(url)
                .then((depthUrl) => {
                  updatePreRender(depthId, {
                    status: 'ready',
                    url: depthUrl,
                    completedAt: Date.now(),
                  });
                })
                .catch(() => {
                  updatePreRender(depthId, { status: 'failed' });
                });
            }
          })
          .catch(() => {
            updatePreRender(imageId, { status: 'failed' });
          });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [requestPreRender, updatePreRender, getPreRenderedMedia]);
}

/**
 * Generate an image using the smart pipeline API
 */
async function generateImage(prompt: string): Promise<string | null> {
  try {
    const response = await fetch('/api/voice31/smart-pipeline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'generate_image',
        prompt,
        model: 'flux-schnell',
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data.url || data.imageUrl || null;
  } catch {
    return null;
  }
}

/**
 * Generate a depth map from an image URL
 */
async function generateDepthMap(imageUrl: string): Promise<string | null> {
  try {
    const response = await fetch('/api/voice31/smart-pipeline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'depth_map',
        imageUrl,
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data.url || data.depthMapUrl || null;
  } catch {
    return null;
  }
}
