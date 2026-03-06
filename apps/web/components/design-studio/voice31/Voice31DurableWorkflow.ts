'use client';

/**
 * Voice31 Durable Workflow Engine
 *
 * Provides resilient task execution with:
 * - Automatic retry with exponential backoff
 * - Checkpoint/recovery for multi-step workflows
 * - Progress tracking integrated with Voice31Store
 * - Parallel task execution with dependency management
 * - Graceful degradation on repeated failures
 */

import { useVoice31Store, type PendingTaskStatus } from './Voice31Store';

// =============================================================================
// TYPES
// =============================================================================

export interface WorkflowStep {
  id: string;
  label: string;
  execute: (context: WorkflowContext) => Promise<unknown>;
  /** Optional fallback if this step fails after all retries */
  fallback?: (error: Error, context: WorkflowContext) => Promise<unknown>;
  /** Max retries for this step (default: 3) */
  maxRetries?: number;
  /** Whether this step is critical (workflow fails if it fails) */
  critical?: boolean;
}

export interface WorkflowContext {
  /** Accumulated results from previous steps */
  results: Record<string, unknown>;
  /** The original task parameters */
  params: Record<string, unknown>;
  /** Abort signal for cancellation */
  signal: AbortSignal;
  /** Report progress (0-1) for the current step */
  reportProgress: (progress: number) => void;
}

export interface DurableWorkflowConfig {
  id: string;
  label: string;
  steps: WorkflowStep[];
  /** Whether to continue past non-critical step failures */
  continueOnNonCriticalFailure?: boolean;
  /** Global timeout for entire workflow (ms) */
  timeout?: number;
}

export interface WorkflowResult {
  success: boolean;
  results: Record<string, unknown>;
  failedSteps: string[];
  duration: number;
}

// =============================================================================
// RETRY LOGIC
// =============================================================================

const DEFAULT_MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 8000;

function getRetryDelay(attempt: number): number {
  const delay = Math.min(BASE_DELAY_MS * Math.pow(2, attempt), MAX_DELAY_MS);
  // Add jitter: +/- 20%
  const jitter = delay * 0.2 * (Math.random() * 2 - 1);
  return Math.round(delay + jitter);
}

async function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    if (signal) {
      signal.addEventListener('abort', () => {
        clearTimeout(timer);
        reject(new DOMException('Aborted', 'AbortError'));
      }, { once: true });
    }
  });
}

// =============================================================================
// DURABLE FETCH - Fetch with automatic retry
// =============================================================================

export interface DurableFetchOptions extends RequestInit {
  maxRetries?: number;
  /** If true, returns null instead of throwing on failure */
  softFail?: boolean;
  /** Task ID to update progress on */
  taskId?: string;
  /** Timeout in ms per fetch attempt (default 20000). Prevents hanging on slow external APIs. */
  timeout?: number;
}

/**
 * Fetch with automatic retry and exponential backoff.
 * Integrates with Voice31Store for progress tracking.
 */
export async function durableFetch(
  url: string,
  options: DurableFetchOptions = {},
): Promise<Response> {
  const { maxRetries = DEFAULT_MAX_RETRIES, softFail = false, taskId, timeout = 20000, ...fetchOptions } = options;
  const store = useVoice31Store.getState();

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (taskId && attempt > 0) {
        store.updatePendingTask(taskId, {
          status: 'retrying' as PendingTaskStatus,
          retryCount: attempt,
        });
      }

      // AbortController with timeout to prevent hanging on slow external APIs
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      // If caller passed a signal, forward its abort to our controller
      if (fetchOptions.signal) {
        fetchOptions.signal.addEventListener('abort', () => controller.abort(), { once: true });
      }

      const response = await fetch(url, { ...fetchOptions, signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok && response.status >= 500 && attempt < maxRetries) {
        // Server error - retry
        console.warn(`[DurableWorkflow] ${url} returned ${response.status}, retrying (${attempt + 1}/${maxRetries})`);
        const delay = getRetryDelay(attempt);
        await sleep(delay);
        continue;
      }

      if (taskId) {
        store.updatePendingTask(taskId, {
          status: response.ok ? 'running' : 'failed',
        });
      }

      return response;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw error;
      }

      if (attempt < maxRetries) {
        console.warn(`[DurableWorkflow] ${url} failed, retrying (${attempt + 1}/${maxRetries}):`, error);
        const delay = getRetryDelay(attempt);
        await sleep(delay);
        continue;
      }

      if (softFail) {
        console.warn(`[DurableWorkflow] ${url} failed after ${maxRetries} retries, returning error response`);
        if (taskId) {
          store.updatePendingTask(taskId, {
            status: 'failed',
            error: error instanceof Error ? error.message : 'Network error',
          });
        }
        // Return a synthetic error response
        return new Response(JSON.stringify({ error: 'Request failed after retries' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      throw error;
    }
  }

  // Should never reach here
  throw new Error(`[DurableWorkflow] ${url} failed after ${maxRetries} retries`);
}

// =============================================================================
// DURABLE STREAMING FETCH - Stream with recovery
// =============================================================================

export interface DurableStreamOptions extends DurableFetchOptions {
  /** Callback for each chunk received */
  onChunk?: (chunk: string) => void;
  /** Callback when stream completes */
  onComplete?: (fullText: string) => void;
  /** Callback for progress updates */
  onProgress?: (received: number) => void;
}

/**
 * Streaming fetch with automatic retry.
 * Tracks bytes received for progress reporting.
 */
export async function durableStreamFetch(
  url: string,
  options: DurableStreamOptions = {},
): Promise<string> {
  const { onChunk, onComplete, onProgress, taskId, ...fetchOptions } = options;
  const store = useVoice31Store.getState();

  const response = await durableFetch(url, { ...fetchOptions, taskId });

  if (!response.ok || !response.body) {
    const error = await response.json().catch(() => ({ error: 'Stream failed' }));
    throw new Error(error.error || `Stream failed: ${response.status}`);
  }

  if (taskId) {
    store.updatePendingTask(taskId, { status: 'running', progress: 0.1 });
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';
  let bytesReceived = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      fullText += chunk;
      bytesReceived += value.byteLength;

      onChunk?.(chunk);
      onProgress?.(bytesReceived);

      if (taskId) {
        // Estimate progress based on typical response size
        const estimatedProgress = Math.min(0.9, 0.1 + (bytesReceived / 10000) * 0.8);
        store.updatePendingTask(taskId, { progress: estimatedProgress });
      }
    }
  } finally {
    reader.releaseLock();
  }

  if (taskId) {
    store.updatePendingTask(taskId, { status: 'completed', progress: 1 });
  }

  onComplete?.(fullText);
  return fullText;
}

// =============================================================================
// WORKFLOW EXECUTOR
// =============================================================================

/**
 * Execute a durable workflow with retry, checkpoint, and progress tracking.
 */
export async function executeDurableWorkflow(
  config: DurableWorkflowConfig,
  params: Record<string, unknown> = {},
): Promise<WorkflowResult> {
  const store = useVoice31Store.getState();
  const startTime = Date.now();
  const abortController = new AbortController();

  // Set up timeout
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  if (config.timeout) {
    timeoutId = setTimeout(() => {
      abortController.abort();
    }, config.timeout);
  }

  // Register workflow as a pending task
  const workflowTaskId = store.addPendingTask({
    type: 'workflow',
    label: config.label,
  });
  store.updatePendingTask(workflowTaskId, { status: 'running' });

  const results: Record<string, unknown> = {};
  const failedSteps: string[] = [];

  try {
    for (let stepIndex = 0; stepIndex < config.steps.length; stepIndex++) {
      const step = config.steps[stepIndex];
      const maxRetries = step.maxRetries ?? DEFAULT_MAX_RETRIES;

      // Update overall workflow progress
      const overallProgress = stepIndex / config.steps.length;
      store.updatePendingTask(workflowTaskId, {
        progress: overallProgress,
      });

      let stepSuccess = false;
      let lastError: Error | null = null;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const context: WorkflowContext = {
            results,
            params,
            signal: abortController.signal,
            reportProgress: (progress) => {
              const stepProgress = (stepIndex + progress) / config.steps.length;
              store.updatePendingTask(workflowTaskId, { progress: stepProgress });
            },
          };

          const result = await step.execute(context);
          results[step.id] = result;
          stepSuccess = true;
          break;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));

          if (error instanceof DOMException && error.name === 'AbortError') {
            throw error; // Don't retry aborts
          }

          if (attempt < maxRetries) {
            console.warn(`[DurableWorkflow] Step "${step.id}" failed (attempt ${attempt + 1}/${maxRetries}):`, error);
            await sleep(getRetryDelay(attempt), abortController.signal);
          }
        }
      }

      if (!stepSuccess) {
        failedSteps.push(step.id);

        // Try fallback
        if (step.fallback && lastError) {
          try {
            const fallbackResult = await step.fallback(lastError, {
              results,
              params,
              signal: abortController.signal,
              reportProgress: () => {},
            });
            results[step.id] = fallbackResult;
            console.log(`[DurableWorkflow] Step "${step.id}" recovered via fallback`);
          } catch (fallbackError) {
            console.error(`[DurableWorkflow] Step "${step.id}" fallback also failed:`, fallbackError);
          }
        }

        if (step.critical !== false && !config.continueOnNonCriticalFailure) {
          throw lastError || new Error(`Critical step "${step.id}" failed`);
        }
      }
    }

    store.updatePendingTask(workflowTaskId, { status: 'completed', progress: 1 });

    return {
      success: failedSteps.length === 0,
      results,
      failedSteps,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    store.updatePendingTask(workflowTaskId, {
      status: 'failed',
      error: error instanceof Error ? error.message : 'Workflow failed',
    });

    return {
      success: false,
      results,
      failedSteps,
      duration: Date.now() - startTime,
    };
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
    // Clean up completed task after a delay
    setTimeout(() => {
      store.removePendingTask(workflowTaskId);
    }, 3000);
  }
}

// =============================================================================
// PRE-BUILT WORKFLOW FACTORIES
// =============================================================================

/**
 * Create a durable image generation workflow with retry and fallback.
 */
export function createImageGenWorkflow(prompt: string, style: string = 'illustration'): DurableWorkflowConfig {
  return {
    id: `img_gen_${Date.now()}`,
    label: 'Generating image',
    timeout: 30000,
    steps: [
      {
        id: 'generate',
        label: 'Image generation',
        maxRetries: 2,
        execute: async (ctx) => {
          ctx.reportProgress(0.1);
          const response = await durableFetch('/api/voice-canvas/generate-media', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'image',
              prompt: `${prompt}, ${style} style`,
              style,
              saveToAccount: true,
              forceSchnell: true,
              context: {
                source: 'voice31',
                sessionId: `voice31_${Date.now()}`,
              },
            }),
            maxRetries: 2,
          });

          ctx.reportProgress(0.8);

          if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error || 'Image generation failed');
          }

          const data = await response.json();
          const imageUrl = data.media?.[0]?.url;
          if (!imageUrl) throw new Error('No image URL in response');

          ctx.reportProgress(1);
          return imageUrl;
        },
        fallback: async () => {
          // Return a placeholder on failure
          return null;
        },
      },
    ],
  };
}

/**
 * Create a durable web search workflow with retry.
 */
export function createWebSearchWorkflow(query: string, numResults: number = 5): DurableWorkflowConfig {
  return {
    id: `web_search_${Date.now()}`,
    label: `Searching: ${query}`,
    timeout: 15000,
    steps: [
      {
        id: 'search',
        label: 'Web search',
        maxRetries: 2,
        execute: async (ctx) => {
          ctx.reportProgress(0.2);
          const response = await durableFetch('/api/voice31/web-search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, numResults }),
            maxRetries: 2,
          });

          ctx.reportProgress(0.8);

          if (!response.ok) {
            throw new Error('Search failed');
          }

          const data = await response.json();
          ctx.reportProgress(1);
          return data.results || [];
        },
      },
    ],
  };
}

/**
 * Create a durable code generation workflow with fast model first, then quality upgrade.
 */
export function createCodeGenWorkflow(
  prompt: string,
  options: {
    fullscreen?: boolean;
    model?: string;
    sessionId?: string;
    useDualModel?: boolean;
  } = {},
): DurableWorkflowConfig {
  const { fullscreen = false, model, sessionId, useDualModel = true } = options;

  const steps: WorkflowStep[] = [
    {
      id: 'fast_gen',
      label: 'Quick code generation',
      maxRetries: 2,
      execute: async (ctx) => {
        ctx.reportProgress(0.1);

        const response = await durableFetch('/api/voice31/generate-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            model: model || 'fast',
            stream: true,
            sessionId: sessionId || `voice31_${Date.now()}`,
            sourceType: 'voice31',
            tier: 'fast',
          }),
          maxRetries: 1,
        });

        if (!response.ok || !response.body) {
          throw new Error('Fast code gen failed');
        }

        ctx.reportProgress(0.3);
        return response;
      },
    },
  ];

  if (useDualModel) {
    steps.push({
      id: 'quality_upgrade',
      label: 'Quality refinement',
      maxRetries: 1,
      critical: false, // Non-critical - fast result is enough
      execute: async (ctx) => {
        ctx.reportProgress(0.1);

        const response = await durableFetch('/api/voice31/generate-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            stream: true,
            sessionId: sessionId || `voice31_${Date.now()}`,
            sourceType: 'voice31',
            tier: 'quality',
          }),
          maxRetries: 1,
          softFail: true,
        });

        if (!response.ok || !response.body) {
          return null; // Quality upgrade is optional
        }

        ctx.reportProgress(0.5);
        return response;
      },
    });
  }

  return {
    id: `code_gen_${Date.now()}`,
    label: 'Generating visualization',
    timeout: 45000,
    continueOnNonCriticalFailure: true,
    steps,
  };
}
