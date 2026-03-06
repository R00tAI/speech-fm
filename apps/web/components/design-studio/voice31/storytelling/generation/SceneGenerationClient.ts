/**
 * SceneGenerationClient
 *
 * SSE client that calls /api/voice31/generate-scenes and parses
 * streamed scene objects, pushing them to the store.
 */

import { validateScene } from '@/lib/storytelling/scene-schema';
import type { Scene } from '../types';

export interface SceneGenerationCallbacks {
  onScene: (scene: Scene) => void;
  onDone: (total: number) => void;
  onError: (error: string) => void;
}

export class SceneGenerationClient {
  private abortController: AbortController | null = null;

  async generate(
    question: string,
    callbacks: SceneGenerationCallbacks,
    researchContext?: { query: string; results: Array<{ title: string; url: string; highlights: string[]; summary: string; image?: string }> } | null,
  ): Promise<void> {
    this.abort(); // Cancel any previous generation
    this.abortController = new AbortController();

    // Build research context string for the scene gen prompt
    let researchStr: string | undefined;
    if (researchContext?.results?.length) {
      researchStr = researchContext.results
        .map((r, i) => `[${i + 1}] "${r.title}" (${r.url})\n${r.highlights.join(' ... ')}\n${r.summary}`)
        .join('\n\n');
    }

    try {
      const response = await fetch('/api/voice31/generate-scenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, researchContext: researchStr }),
        signal: this.abortController.signal,
      });

      if (!response.ok || !response.body) {
        const error = await response.json().catch(() => ({}));
        callbacks.onError(error.error || 'Scene generation failed');
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let eventType = '';
      let eventData = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Split on double newline (SSE event boundary) to find complete events
        // but keep partial data in buffer
        let eventBoundary: number;
        while ((eventBoundary = buffer.indexOf('\n\n')) !== -1) {
          const eventBlock = buffer.substring(0, eventBoundary);
          buffer = buffer.substring(eventBoundary + 2);

          // Parse the event block
          const lines = eventBlock.split('\n');
          for (const line of lines) {
            if (line.startsWith('event: ')) {
              eventType = line.slice(7).trim();
            } else if (line.startsWith('data: ')) {
              eventData += (eventData ? '\n' : '') + line.slice(6);
            }
          }

          // Dispatch if we have both type and data
          if (eventType && eventData) {
            this.handleEvent(eventType, eventData.trim(), callbacks);
          }
          eventType = '';
          eventData = '';
        }
      }

      // Handle any remaining buffer after stream ends
      if (buffer.trim() && eventType && eventData) {
        this.handleEvent(eventType, eventData.trim(), callbacks);
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') return;
      console.error('[SceneGenClient] Error:', error);
      callbacks.onError('Scene generation failed');
    }
  }

  private handleEvent(type: string, data: string, callbacks: SceneGenerationCallbacks): void {
    try {
      const parsed = JSON.parse(data);

      switch (type) {
        case 'scene': {
          const result = validateScene(parsed);
          if (result.success && result.scene) {
            callbacks.onScene(result.scene as Scene);
          } else {
            console.warn('[SceneGenClient] Invalid scene, using raw:', result.error);
            // Try to use it anyway if it has minimum required fields
            if (parsed.id && parsed.type) {
              callbacks.onScene(parsed as Scene);
            }
          }
          break;
        }
        case 'done':
          callbacks.onDone(parsed.total || 0);
          break;
        case 'error':
          callbacks.onError(parsed.error || 'Unknown error');
          break;
      }
    } catch {
      console.warn('[SceneGenClient] Failed to parse event data:', data);
    }
  }

  abort(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }
}
