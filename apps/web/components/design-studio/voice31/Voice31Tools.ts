'use client';

/**
 * Voice31 Tools - Client-side Tool Handler
 *
 * Handles execution of tool calls from Hume EVI.
 * Tool definitions are in lib/design-studio/voice31-tools.ts (server-compatible).
 */

import {
  useVoice31Store,
  useVisualSchedulerStore,
  moodToColor,
  type PhosphorColor,
  type EffectType,
  type WireframeSemanticType,
  type VisualizationType,
  type VisualEventTrigger,
  type ScheduledVisualEvent,
  type DiagramNode,
  type DiagramStyle,
  type ReaderContent,
  type SearchResult,
  type AssistantActivity,
} from './Voice31Store';
import { durableFetch, durableStreamFetch } from './Voice31DurableWorkflow';
import { useVoice31RPGStore } from './Voice31RPGStore';
import { buildArtifact, persistArtifact } from '@/lib/design-studio/voice31/artifact-manager';

// Re-export tool definitions
export { VOICE31_TOOLS, VOICE31_SYSTEM_PROMPT } from '@/lib/design-studio/voice31-tools';

// =============================================================================
// TOOL HANDLER
// =============================================================================

export interface ToolCallResult {
  success: boolean;
  message: string;
  context?: Record<string, unknown>;
}

export interface ToolCallHandler {
  handleToolCall: (name: string, args: Record<string, unknown>) => Promise<ToolCallResult>;
}

// Helper to execute scheduled events for a trigger
export async function executeScheduledEvents(trigger: 'on_speech_start' | 'on_speech_end' | 'on_user_speaking' | 'on_silence'): Promise<void> {
  const scheduler = useVisualSchedulerStore.getState();
  const store = useVoice31Store.getState();

  // Record the trigger time
  scheduler.recordTriggerTime(trigger);

  // Get and execute matching events
  const events = scheduler.processTrigger(trigger);

  // Only log when there are actual events to process
  if (events.length > 0) {
    console.log(`[Voice31] Processing ${events.length} events for trigger: ${trigger}`);
  }

  for (const event of events) {
    await executeVisualEvent(event, store);

    // If there's a delay specified, wait before continuing
    if (event.delayMs && event.delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, event.delayMs));
    }
  }

  // Also process any delay-triggered events that are now ready
  const delayEvents = scheduler.processTrigger('delay');
  for (const event of delayEvents) {
    await executeVisualEvent(event, store);
  }
}

// Helper to execute a scheduled visual event
async function executeVisualEvent(
  event: ScheduledVisualEvent,
  store: ReturnType<typeof useVoice31Store.getState>
): Promise<void> {
  console.log('[Voice31] Executing visual event:', event.type, event.data);

  switch (event.type) {
    case 'show_text':
      store.showText(event.data.text as string || '');
      break;
    case 'show_list':
      store.showList(
        event.data.items as string[] || [],
        event.data.title as string | undefined
      );
      break;
    case 'show_wireframe':
      store.showWireframe(
        event.data.type as WireframeSemanticType,
        event.data.labels as string[] | undefined,
        event.data.duration as number | undefined
      );
      break;
    case 'show_visualization':
      store.showVisualization(
        event.data.type as VisualizationType,
        event.data.title as string | undefined
      );
      break;
    case 'trigger_effect':
      store.triggerEffect(
        event.data.type as EffectType,
        event.data.intensity as number | undefined,
        event.data.duration as number | undefined
      );
      break;
    case 'set_mood':
      const mood = event.data.mood as string;
      const color = moodToColor[mood] || 'amber';
      store.setPhosphorColor(color as PhosphorColor);
      break;
    case 'clear':
      store.clearContent();
      store.clearCodeDisplay();
      store.clearWireframe();
      store.clearDiagram();
      store.clearBrowser();
      store.clearEffect();
      store.clearVisualStory();
      break;
  }
}

// Styled console logging for tool calls
const logToolCall = (name: string, args: Record<string, unknown>) => {
  console.log(
    '%c[Voice31 Tool] %c' + name,
    'background: #1a1a2e; color: #ffaa00; padding: 2px 6px; border-radius: 3px; font-weight: bold;',
    'background: #16213e; color: #00ff88; padding: 2px 8px; border-radius: 3px; font-weight: bold;',
    args
  );
};

const logToolResult = (name: string, result: ToolCallResult) => {
  const style = result.success
    ? 'background: #0a3d2e; color: #00ff88; padding: 2px 6px; border-radius: 3px;'
    : 'background: #3d0a0a; color: #ff4444; padding: 2px 6px; border-radius: 3px;';
  console.log(
    `%c[Voice31 Result] %c${name} %c${result.success ? '✓ SUCCESS' : '✗ FAILED'}`,
    'background: #1a1a2e; color: #ffaa00; padding: 2px 6px; border-radius: 3px; font-weight: bold;',
    'color: #aaaaaa; padding: 2px 4px;',
    style,
    result.message,
    result.context || ''
  );
};

// =============================================================================
// ACTIVITY TRACKING
// =============================================================================

// Map tool names to assistant activities
const TOOL_ACTIVITY_MAP: Record<string, AssistantActivity> = {
  search_web: 'searching',
  fetch_article: 'reading',
  read_search_result: 'reading',
  create_note: 'writing',
  update_note: 'writing',
  remember: 'remembering',
  list_memories: 'remembering',
  generate_code_display: 'coding',
  show_image: 'presenting',
  show_progressive_diagram: 'presenting',
  start_visual_story: 'presenting',
  show_visualization: 'presenting',
  browse_web: 'browsing',
  extract_web_data: 'browsing',
};

// Min duration per activity (ms) — prevents flickering on fast tools
const ACTIVITY_MIN_DURATION: Partial<Record<AssistantActivity, number>> = {
  searching: 2000,
  reading: 2000,
  writing: 1500,
  remembering: 1200,
  coding: 1500,
  presenting: 1000,
  browsing: 1500,
};

// Track active timers to avoid overlapping clears
let activityClearTimer: ReturnType<typeof setTimeout> | null = null;

/** Set activity and auto-clear to idle after min duration */
function setToolActivity(store: ReturnType<typeof useVoice31Store.getState>, toolName: string): void {
  const activity = TOOL_ACTIVITY_MAP[toolName];
  if (!activity) return;

  // Cancel any pending clear
  if (activityClearTimer) {
    clearTimeout(activityClearTimer);
    activityClearTimer = null;
  }

  store.setAssistantActivity(activity);
}

/** Clear activity back to idle after tool completes, respecting min duration */
function clearToolActivity(store: ReturnType<typeof useVoice31Store.getState>, toolName: string, startTime: number): void {
  const activity = TOOL_ACTIVITY_MAP[toolName];
  if (!activity) return;

  const minDuration = ACTIVITY_MIN_DURATION[activity] || 1000;
  const elapsed = Date.now() - startTime;
  const remaining = Math.max(0, minDuration - elapsed);

  if (remaining === 0) {
    store.setAssistantActivity('idle');
  } else {
    activityClearTimer = setTimeout(() => {
      // Only clear if we're still on the same activity (another tool might have taken over)
      if (useVoice31Store.getState().assistantActivity === activity) {
        store.setAssistantActivity('idle');
      }
      activityClearTimer = null;
    }, remaining);
  }
}

export function createVoice31ToolHandler(): ToolCallHandler {
  const store = useVoice31Store.getState();
  const scheduler = useVisualSchedulerStore.getState();

  return {
    handleToolCall: async (name: string, args: Record<string, unknown>): Promise<ToolCallResult> => {
      logToolCall(name, args);

      // Set contextual activity animation
      const activityStartTime = Date.now();
      setToolActivity(store, name);

      let result: ToolCallResult;

      try {
        switch (name) {
          case 'show_text': {
            const text = args.text as string;
            store.showText(text);
            result = { success: true, message: 'Text displayed', context: { text } };
            break;
          }

        case 'show_list': {
          const items = args.items as string[];
          const title = args.title as string | undefined;
          store.showList(items, title);
          // Include full items in context so assistant knows exactly what was shown
          const itemsList = items.map((item, i) => `${i + 1}. ${item}`).join('\n');
          result = {
            success: true,
            message: `List displayed with ${items.length} items:\n${itemsList}`,
            context: {
              title,
              items,
              displayed_content: `${title ? `**${title}**\n` : ''}${itemsList}`,
            },
          };
          break;
        }

        case 'show_image': {
          const prompt = args.prompt as string;
          const style = (args.style as string) || 'illustration';

          // Validate prompt - if undefined, log error and return
          if (!prompt || prompt === 'undefined') {
            console.error('[Voice31] Invalid prompt for show_image:', args);
            store.showText('MISSING IMAGE PROMPT');
            result = { success: false, message: 'No prompt provided for image generation' };
            break;
          }

          // Clear any active overlays — image takes priority
          if (store.activeStoryQuestion) {
            console.log('[Voice31] Clearing storytelling overlay for show_image');
            store.clearVisualStory();
          }
          // Clear code display so image can actually show (code has higher render priority)
          if (useVoice31Store.getState().codeDisplayState.active) {
            console.log('[Voice31] Clearing code display for show_image');
            store.clearCodeDisplay();
          }

          // Show generating state immediately
          store.showGenerating(prompt);

          // Map voice31 styles to fal-media-generator styles
          const styleMap: Record<string, string> = {
            photo: 'illustration',
            pixel: 'pixel',
            sketch: 'sketch',
            retro: 'retro',
            illustration: 'illustration',
          };

          // Track as pending task for progressive rendering
          const imageTaskId = store.addPendingTask({
            type: 'image_gen',
            label: `Generating: ${prompt.slice(0, 30)}...`,
          });
          store.updatePendingTask(imageTaskId, { status: 'running' as any, progress: 0.1 });

          // Fire-and-forget with durable retry
          (async () => {
            try {
              const response = await durableFetch('/api/voice-canvas/generate-media', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  type: 'image',
                  prompt: `${prompt}, ${styleMap[style] || 'illustration'} style`,
                  style: styleMap[style] || 'illustration',
                  saveToAccount: true,
                  forceSchnell: true,
                  context: {
                    source: 'voice31',
                    sessionId: `voice31_${Date.now()}`,
                  },
                }),
                maxRetries: 2,
                taskId: imageTaskId,
              });

              store.updatePendingTask(imageTaskId, { progress: 0.8 });

              if (response.ok) {
                const data = await response.json();
                const imageUrl = data.media?.[0]?.url;
                if (imageUrl) {
                  console.log('[Voice31] Image generated:', imageUrl);
                  store.showImage(imageUrl, prompt);
                  store.updatePendingTask(imageTaskId, { status: 'completed' as any, progress: 1 });
                } else {
                  console.error('[Voice31] No image URL in response:', data);
                  store.showText('NO IMAGE RETURNED');
                  store.updatePendingTask(imageTaskId, { status: 'failed' as any, error: 'No URL' });
                }
              } else {
                const errorData = await response.json().catch(() => ({}));
                console.error('[Voice31] Image generation failed:', errorData);
                store.showText('IMAGE GENERATION FAILED');
                store.updatePendingTask(imageTaskId, { status: 'failed' as any, error: 'Generation failed' });
              }
            } catch (error) {
              console.error('[Voice31] Image generation error:', error);
              store.showText('IMAGE ERROR');
              store.updatePendingTask(imageTaskId, { status: 'failed' as any, error: String(error) });
            } finally {
              // Clean up task after delay
              setTimeout(() => store.removePendingTask(imageTaskId), 2000);
            }
          })();

          // Return immediately — don't block the WebSocket handler
          result = {
            success: true,
            message: 'Image generation started, will appear on screen shortly',
            context: { prompt, style },
          };
          break;
        }

        case 'trigger_effect': {
          const type = args.type as EffectType;
          const intensity = (args.intensity as number) ?? 0.5;
          const duration = (args.duration as number) ?? 5000;
          store.triggerEffect(type, intensity, duration);
          result = { success: true, message: `Effect ${type} triggered`, context: { type, intensity, duration } };
          break;
        }

        case 'set_mood': {
          const mood = args.mood as string;
          const color = moodToColor[mood] || 'amber';
          store.setPhosphorColor(color as PhosphorColor);
          result = { success: true, message: `Mood set to ${mood}`, context: { mood, color } };
          break;
        }

        case 'set_color': {
          const color = (args.color as string) || (args.phosphor_color as string);
          if (!color) {
            result = { success: false, message: 'No color provided' };
            break;
          }
          const normalized = color.toLowerCase();
          const allowed: PhosphorColor[] = ['green', 'red', 'blue', 'amber', 'white'];
          const resolved = (allowed.includes(normalized as PhosphorColor) ? normalized : 'amber') as PhosphorColor;
          store.setPhosphorColor(resolved);
          result = { success: true, message: `Color set to ${resolved}`, context: { color: resolved } };
          break;
        }

        case 'clear_display': {
          store.clearContent();
          store.clearCodeDisplay();
          store.clearWireframe();
          store.clearDiagram();
          store.clearBrowser();
          store.clearEffect();
          store.clearVisualStory();
          result = { success: true, message: 'Display cleared', context: { cleared: ['content', 'code', 'wireframe', 'diagram', 'browser', 'effect', 'storytelling'] } };
          break;
        }

        case 'show_wireframe': {
          const type = args.type as WireframeSemanticType;
          const labels = args.labels as string[] | undefined;
          const duration = (args.duration as number) ?? 10000;

          console.log('[Voice31] Showing wireframe:', type, labels, duration);
          store.showWireframe(type, labels, duration);
          result = { success: true, message: `Wireframe ${type} displayed`, context: { type, labels, duration } };
          break;
        }

        case 'show_visualization': {
          const type = args.type as VisualizationType;
          const title = args.title as string | undefined;

          // Clear storytelling overlay if active
          if (store.activeStoryQuestion) {
            store.clearVisualStory();
          }

          console.log('[Voice31] Showing visualization:', type, title);
          store.showVisualization(type, title);
          result = { success: true, message: `Visualization ${type} displayed`, context: { type, title } };
          break;
        }

        case 'show_smart_diagram': {
          const topic = (args.topic as string || '').toLowerCase();
          const context = args.context as string || 'technical';
          const complexity = args.complexity as string || 'moderate';
          const labels = args.labels as string[] | undefined;

          console.log('[Voice31] Smart diagram for topic:', topic, 'context:', context);

          // Intelligent mapping from topic keywords to visualization types
          const topicMappings: Record<string, { wireframe: WireframeSemanticType; visualization: VisualizationType; mood: string }> = {
            // AI/ML topics
            'ai': { wireframe: 'process', visualization: 'neural_net', mood: 'thinking' },
            'machine learning': { wireframe: 'process', visualization: 'neural_net', mood: 'thinking' },
            'neural': { wireframe: 'connection', visualization: 'neural_net', mood: 'thinking' },
            'deep learning': { wireframe: 'abstract', visualization: 'neural_net', mood: 'thinking' },
            'training': { wireframe: 'process', visualization: 'graph', mood: 'thinking' },

            // Data topics
            'data': { wireframe: 'data', visualization: 'graph', mood: 'calm' },
            'database': { wireframe: 'data', visualization: 'isometric_lattice', mood: 'calm' },
            'analytics': { wireframe: 'data', visualization: 'graph', mood: 'calm' },
            'statistics': { wireframe: 'data', visualization: 'graph', mood: 'calm' },
            'trend': { wireframe: 'growth', visualization: 'graph', mood: 'excited' },

            // Science topics
            'biology': { wireframe: 'growth', visualization: 'dna_helix', mood: 'thinking' },
            'dna': { wireframe: 'connection', visualization: 'dna_helix', mood: 'thinking' },
            'genetics': { wireframe: 'connection', visualization: 'dna_helix', mood: 'thinking' },
            'chemistry': { wireframe: 'abstract', visualization: 'isometric_lattice', mood: 'thinking' },
            'physics': { wireframe: 'abstract', visualization: 'particles', mood: 'thinking' },
            'atoms': { wireframe: 'abstract', visualization: 'isometric_lattice', mood: 'calm' },
            'molecules': { wireframe: 'connection', visualization: 'isometric_lattice', mood: 'calm' },
            'quantum': { wireframe: 'abstract', visualization: 'particles', mood: 'thinking' },

            // Technology topics
            'code': { wireframe: 'data', visualization: 'matrix', mood: 'calm' },
            'programming': { wireframe: 'process', visualization: 'matrix', mood: 'calm' },
            'software': { wireframe: 'process', visualization: 'matrix', mood: 'calm' },
            'algorithm': { wireframe: 'process', visualization: 'graph', mood: 'thinking' },
            'network': { wireframe: 'connection', visualization: 'neural_net', mood: 'calm' },

            // Audio/Music topics
            'audio': { wireframe: 'music', visualization: 'waveform', mood: 'calm' },
            'music': { wireframe: 'music', visualization: 'waveform', mood: 'excited' },
            'sound': { wireframe: 'music', visualization: 'waveform', mood: 'calm' },
            'frequency': { wireframe: 'abstract', visualization: 'waveform', mood: 'calm' },

            // Process/Flow topics
            'flow': { wireframe: 'process', visualization: 'particles', mood: 'calm' },
            'process': { wireframe: 'process', visualization: 'graph', mood: 'calm' },
            'workflow': { wireframe: 'process', visualization: 'graph', mood: 'calm' },
            'pipeline': { wireframe: 'process', visualization: 'particles', mood: 'calm' },

            // Idea/Creative topics
            'idea': { wireframe: 'idea', visualization: 'particles', mood: 'excited' },
            'creative': { wireframe: 'idea', visualization: 'particles', mood: 'excited' },
            'innovation': { wireframe: 'idea', visualization: 'particles', mood: 'excited' },
            'brainstorm': { wireframe: 'idea', visualization: 'particles', mood: 'excited' },

            // Question/Problem topics
            'question': { wireframe: 'question', visualization: 'graph', mood: 'thinking' },
            'problem': { wireframe: 'question', visualization: 'graph', mood: 'thinking' },
            'challenge': { wireframe: 'question', visualization: 'graph', mood: 'alert' },

            // Success/Growth topics
            'success': { wireframe: 'success', visualization: 'graph', mood: 'excited' },
            'growth': { wireframe: 'growth', visualization: 'graph', mood: 'excited' },
            'achievement': { wireframe: 'success', visualization: 'particles', mood: 'excited' },

            // Warning/Error topics
            'warning': { wireframe: 'warning', visualization: 'waveform', mood: 'alert' },
            'error': { wireframe: 'error', visualization: 'waveform', mood: 'alert' },
            'danger': { wireframe: 'warning', visualization: 'particles', mood: 'alert' },
          };

          // Find the best match for the topic
          let match = { wireframe: 'abstract' as WireframeSemanticType, visualization: 'particles' as VisualizationType, mood: 'calm' };

          for (const [keyword, mapping] of Object.entries(topicMappings)) {
            if (topic.includes(keyword)) {
              match = mapping;
              break;
            }
          }

          // Adjust based on context
          if (context === 'scientific') {
            match.mood = 'thinking';
          } else if (context === 'creative') {
            match.mood = 'excited';
          } else if (context === 'business') {
            match.mood = 'calm';
          }

          // Set mood first
          const moodColor = moodToColor[match.mood] || 'amber';
          store.setPhosphorColor(moodColor as PhosphorColor);

          // Show wireframe with labels
          const diagramLabels = labels || topic.split(' ').slice(0, 3).map(w => w.toUpperCase());
          store.showWireframe(match.wireframe, diagramLabels, 15000);

          // Also show the visualization
          setTimeout(() => {
            store.showVisualization(match.visualization, topic.toUpperCase());
          }, 500);

          // Add a sparkle effect for complex topics
          if (complexity === 'complex') {
            setTimeout(() => {
              store.triggerEffect('sparkles' as EffectType, 0.5, 3000);
            }, 1000);
          }

          console.log('[Voice31] Smart diagram rendered:', match);
          result = {
            success: true,
            message: `Smart diagram for "${topic}" displayed (${match.wireframe} + ${match.visualization})`,
            context: {
              topic,
              context,
              complexity,
              match,
              labels: diagramLabels,
            },
          };
          break;
        }

        case 'schedule_visual_sequence': {
          const name = args.name as string;
          const events = args.events as Array<{
            visual_type: string;
            trigger: string;
            delay_ms?: number;
            data: Record<string, unknown>;
          }>;
          const autoPlay = (args.auto_play as boolean) ?? true;

          console.log('[Voice31] Scheduling visual sequence:', name, events);

          // Map visual_type to VisualEventType
          const typeMap: Record<string, string> = {
            text: 'show_text',
            list: 'show_list',
            wireframe: 'show_wireframe',
            visualization: 'show_visualization',
            effect: 'trigger_effect',
            mood: 'set_mood',
            clear: 'clear',
          };

          // Convert events to ScheduledVisualEvent format
          const scheduledEvents = events.map((e, index) => ({
            type: (typeMap[e.visual_type] || 'show_text') as any,
            trigger: (e.trigger || 'immediate') as VisualEventTrigger,
            delayMs: e.delay_ms,
            data: e.data,
            priority: events.length - index, // First events have higher priority
          }));

          const sequenceId = scheduler.createSequence(name, scheduledEvents);

          if (autoPlay) {
            scheduler.playSequence(sequenceId);
            // Execute immediate events right away
            const immediateEvents = scheduler.processTrigger('immediate');
            for (const event of immediateEvents) {
              await executeVisualEvent(event, store);
            }
          }

          result = {
            success: true,
            message: `Sequence '${name}' scheduled with ${events.length} events`,
            context: { name, events, autoPlay },
          };
          break;
        }

        // =============================================================================
        // WEB BROWSING TOOLS
        // =============================================================================

        case 'search_web': {
          const query = args.query as string;
          const numResults = (args.num_results as number) ?? 5;

          if (!query) {
            result = { success: false, message: 'No search query provided' };
            break;
          }

          console.log('[Voice31] Searching web:', query);
          store.setBrowserLoading(true);

          // Track as pending task
          const searchTaskId = store.addPendingTask({
            type: 'web_search',
            label: `Searching: ${query.slice(0, 25)}...`,
          });
          store.updatePendingTask(searchTaskId, { status: 'running' as any, progress: 0.2 });

          // Await results so the model receives URLs and can reference them later
          try {
            const response = await durableFetch('/api/voice31/web-search', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ query, numResults }),
              maxRetries: 2,
              taskId: searchTaskId,
            });

            store.updatePendingTask(searchTaskId, { progress: 0.8 });

            if (response.ok) {
              const data = await response.json();
              console.log('[Voice31] Search API response:', data);

              if (data.results && Array.isArray(data.results)) {
                const searchResults = data.results as SearchResult[];
                store.showSearchResults(query, searchResults);
                store.updatePendingTask(searchTaskId, { status: 'completed' as any, progress: 1 });

                // Build numbered result list so the model knows URLs for follow-up
                const numberedResults = searchResults.map((r: SearchResult, i: number) =>
                  `[${i + 1}] "${r.title}" — ${r.url}${r.snippet ? `\n    ${r.snippet.slice(0, 120)}` : ''}`
                ).join('\n');

                result = {
                  success: true,
                  message: `Found ${searchResults.length} results for "${query}":\n${numberedResults}\n\nResults are displayed on screen. Use read_search_result with the URL to open any article.`,
                  context: {
                    query,
                    results: searchResults.map((r: SearchResult, i: number) => ({
                      number: i + 1,
                      title: r.title,
                      url: r.url,
                      snippet: r.snippet,
                    })),
                  },
                };
              } else {
                console.error('[Voice31] Invalid search response format:', data);
                store.setBrowserError('Invalid search response format');
                store.updatePendingTask(searchTaskId, { status: 'failed' as any });
                result = { success: false, message: 'Search returned invalid format' };
              }
            } else {
              const error = await response.json().catch(() => ({}));
              console.error('[Voice31] Search API error:', error);
              store.setBrowserError(error.error || 'Search failed');
              store.updatePendingTask(searchTaskId, { status: 'failed' as any });
              result = { success: false, message: error.error || 'Search failed' };
            }
          } catch (error) {
            console.error('[Voice31] Search error:', error);
            store.setBrowserError('Search failed');
            store.updatePendingTask(searchTaskId, { status: 'failed' as any });
            result = { success: false, message: 'Search failed — network error' };
          } finally {
            setTimeout(() => store.removePendingTask(searchTaskId), 2000);
          }
          break;
        }

        case 'fetch_article': {
          const url = args.url as string;

          if (!url) {
            result = { success: false, message: 'No URL provided' };
            break;
          }

          console.log('[Voice31] Fetching article:', url);
          store.setBrowserLoading(true);

          // Await so model gets article content to read/summarize
          try {
            const response = await durableFetch('/api/voice31/web-fetch', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url }),
              maxRetries: 2,
            });

            if (response.ok) {
              const data = await response.json();
              console.log('[Voice31] Fetch API response:', data);

              if (data.content) {
                const content = data.content as ReaderContent;
                store.showReaderContent(content);

                // Truncate for model context (keep first ~2000 chars)
                const textPreview = (content.textContent || content.content || '').slice(0, 2000);
                result = {
                  success: true,
                  message: `Article loaded: "${content.title || 'Untitled'}"\nSource: ${content.source || url}\n${content.byline ? `By: ${content.byline}\n` : ''}Word count: ${content.wordCount || 'unknown'}\n\nContent preview:\n${textPreview}${textPreview.length >= 2000 ? '...' : ''}`,
                  context: { url, title: content.title, wordCount: content.wordCount },
                };
              } else {
                console.error('[Voice31] Invalid fetch response format:', data);
                store.setBrowserError('Invalid article response format');
                result = { success: false, message: 'Failed to parse article content' };
              }
            } else {
              const error = await response.json().catch(() => ({}));
              console.error('[Voice31] Fetch API error:', error);
              store.setBrowserError(error.error || 'Failed to fetch article');
              result = { success: false, message: error.error || 'Failed to fetch article' };
            }
          } catch (error) {
            console.error('[Voice31] Fetch error:', error);
            store.setBrowserError('Failed to fetch article');
            result = { success: false, message: 'Failed to fetch article — network error' };
          }
          break;
        }

        case 'read_search_result': {
          const url = args.url as string;
          const title = args.title as string | undefined;

          if (!url) {
            result = { success: false, message: 'No URL provided' };
            break;
          }

          console.log('[Voice31] Reading search result:', url);
          store.setBrowserLoading(true);

          // Await so model gets article content to read/summarize
          try {
            const response = await durableFetch('/api/voice31/web-fetch', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url }),
              maxRetries: 2,
            });

            if (response.ok) {
              const data = await response.json();
              console.log('[Voice31] Read API response:', data);

              if (data.content) {
                const content = data.content as ReaderContent;
                store.showReaderContent(content);

                // Truncate for model context (keep first ~2000 chars)
                const textPreview = (content.textContent || content.content || '').slice(0, 2000);
                result = {
                  success: true,
                  message: `Article loaded: "${content.title || title || 'Untitled'}"\nSource: ${content.source || url}\n${content.byline ? `By: ${content.byline}\n` : ''}Word count: ${content.wordCount || 'unknown'}\n\nContent preview:\n${textPreview}${textPreview.length >= 2000 ? '...' : ''}`,
                  context: { url, title: content.title || title, wordCount: content.wordCount },
                };
              } else {
                console.error('[Voice31] Invalid read response format:', data);
                store.setBrowserError('Invalid article response format');
                result = { success: false, message: 'Failed to parse article content' };
              }
            } else {
              const error = await response.json().catch(() => ({}));
              console.error('[Voice31] Read API error:', error);
              store.setBrowserError(error.error || 'Failed to read article');
              result = { success: false, message: error.error || 'Failed to read article' };
            }
          } catch (error) {
            console.error('[Voice31] Read error:', error);
            store.setBrowserError('Failed to read article');
            result = { success: false, message: 'Failed to read article — network error' };
          }
          break;
        }

        // =============================================================================
        // PROGRESSIVE DIAGRAM TOOLS
        // =============================================================================

        case 'show_progressive_diagram': {
          const title = args.title as string;
          const style = (args.style as DiagramStyle) || 'flowchart';
          const rawNodes = args.nodes as Array<{
            id: string;
            label: string;
            level: number;
            connects_to?: string[];
          }>;
          const autoAdvance = (args.auto_advance as boolean) ?? false;

          if (!rawNodes || rawNodes.length === 0) {
            result = { success: false, message: 'No nodes provided for diagram' };
            break;
          }

          // Clear storytelling overlay if active
          if (store.activeStoryQuestion) {
            store.clearVisualStory();
          }

          // Validate and convert nodes
          const validatedNodes = rawNodes.filter(node => {
            if (!node.id || !node.label) {
              console.warn('[Voice31] Skipping invalid node (missing id or label):', node);
              return false;
            }
            if (typeof node.level !== 'number' || node.level < 0) {
              console.warn('[Voice31] Skipping invalid node (invalid level):', node);
              return false;
            }
            return true;
          });

          if (validatedNodes.length === 0) {
            result = { success: false, message: 'No valid nodes provided for diagram' };
            break;
          }

          // Convert snake_case connects_to to camelCase connectsTo for store
          const nodes: DiagramNode[] = validatedNodes.map((node) => ({
            id: node.id,
            label: node.label,
            level: Math.max(0, Math.floor(node.level)), // Ensure non-negative integer
            connectsTo: Array.isArray(node.connects_to) ? node.connects_to.filter(id => typeof id === 'string' && id.length > 0) : undefined,
          }));

          console.log('[Voice31] Creating progressive diagram:', title, nodes.length, 'nodes');
          store.showProgressiveDiagram(title, nodes, style, autoAdvance);

          // Build a readable summary of the diagram content
          const maxLevel = nodes.length > 0 ? Math.max(...nodes.map((n) => n.level), 0) : 0;
          const levelSummary = [];
          for (let level = 0; level <= maxLevel; level++) {
            const nodesAtLevel = nodes.filter((n) => n.level === level);
            if (nodesAtLevel.length > 0) {
              levelSummary.push(`Level ${level}: ${nodesAtLevel.map((n) => n.label).join(', ')}`);
            }
          }

          result = {
            success: true,
            message: `Progressive diagram "${title}" displayed with ${nodes.length} nodes across ${maxLevel + 1} levels. Level 0 is now visible. Call advance_diagram to reveal each subsequent level.\n\nDiagram structure:\n${levelSummary.join('\n')}`,
            context: {
              title,
              style,
              nodes: nodes.map((n) => ({ id: n.id, label: n.label, level: n.level })),
              displayed_content: `**${title}**\n${levelSummary.join('\n')}`,
              autoAdvance,
              currentLevel: 0,
              maxLevel,
            },
          };
          break;
        }

        case 'advance_diagram': {
          const highlightNode = args.highlight_node as string | undefined;
          const currentState = store.diagramState;

          console.log('[Voice31] Advancing diagram', highlightNode ? `highlighting ${highlightNode}` : '');

          if (highlightNode) {
            store.highlightDiagramNode(highlightNode);
          }
          store.advanceDiagram();

          // Get the new level after advancing
          const newState = useVoice31Store.getState().diagramState;
          const maxLevel = newState.nodes.length > 0 ? Math.max(...newState.nodes.map((n) => n.level), 0) : 0;
          const newlyVisibleNodes = newState.nodes.filter((n) => n.level === newState.revealedLevel);

          result = {
            success: true,
            message: `Diagram advanced to level ${newState.revealedLevel}/${maxLevel}. Now showing: ${newlyVisibleNodes.map((n) => n.label).join(', ')}`,
            context: {
              highlightNode,
              currentLevel: newState.revealedLevel,
              maxLevel,
              newlyVisibleNodes: newlyVisibleNodes.map((n) => n.label),
            },
          };
          break;
        }

        case 'clear_diagram': {
          console.log('[Voice31] Clearing diagram');
          store.clearDiagram();
          result = { success: true, message: 'Diagram cleared', context: { cleared: true } };
          break;
        }

        // =============================================================================
        // DESIGN STUDIO CANVAS TOOLS
        // =============================================================================

        case 'add_character_rig': {
          const characterDescription = args.character_description as string;
          const style = (args.style as string) || 'cartoon';
          const elementName = (args.name as string) || 'Character';

          if (!characterDescription) {
            result = { success: false, message: 'No character description provided' };
            break;
          }

          console.log('[Voice31] Generating character rig:', characterDescription);

          const tPosePrompt = `${characterDescription}, character design sheet, T-pose, arms extended horizontally, neutral expression, full body, front view, clear silhouette, transparent or solid color background, ${style} style, suitable for 2D animation rigging`;

          store.showGenerating(tPosePrompt);

          // Fire-and-forget: generate without blocking WebSocket
          (async () => {
            try {
              const response = await fetch('/api/voice-canvas/generate-media', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  type: 'image',
                  prompt: tPosePrompt,
                  style: style === 'cartoon' || style === 'anime' ? 'illustration' : style,
                  saveToAccount: true,
                  forceSchnell: true,
                  context: {
                    source: 'voice31-character-rig',
                    sessionId: `voice31_rig_${Date.now()}`,
                  },
                }),
              });

              if (response.ok) {
                const data = await response.json();
                const imageUrl = data.media?.[0]?.url;

                if (imageUrl) {
                  console.log('[Voice31] Character rig generated:', imageUrl);

                  try {
                    const { useDesignStudioV2Store } = await import('@/lib/design-studio-v2-store');
                    const designStore = useDesignStudioV2Store.getState();
                    designStore.addElement('character');
                    const elements = designStore.project.elements;
                    const newElement = elements[elements.length - 1];
                    if (newElement) {
                      designStore.updateElement(newElement.id, {
                        name: elementName,
                        properties: {
                          ...newElement.properties,
                          imageUrl: imageUrl,
                          characterDescription,
                          rigStyle: style,
                          isPoseReady: true,
                        },
                      });
                    }
                  } catch (e) {
                    console.warn('[Voice31] Could not add to canvas store:', e);
                  }

                  store.showImage(imageUrl, `Character: ${elementName}`);
                  return;
                }
              }

              store.showText('CHARACTER GENERATION FAILED');
            } catch (error) {
              console.error('[Voice31] Character rig error:', error);
              store.showText('CHARACTER ERROR');
            }
          })();

          // Return immediately — don't block the WebSocket handler
          result = {
            success: true,
            message: `Generating character "${elementName}" in T-pose, will appear shortly`,
            context: { characterDescription, style, elementName },
          };
          break;
        }

        case 'add_to_canvas': {
          const elementType = args.element_type as string;
          const content = args.content as string | undefined;
          const elementName = args.name as string | undefined;
          const position = args.position as { x?: number; y?: number } | undefined;
          const size = args.size as { width?: number; height?: number } | undefined;

          if (!elementType) {
            result = { success: false, message: 'No element type provided' };
            break;
          }

          console.log('[Voice31] Adding to canvas:', elementType, content);

          try {
            const { useDesignStudioV2Store } = await import('@/lib/design-studio-v2-store');
            const designStore = useDesignStudioV2Store.getState();

            // Map element types
            const typeMap: Record<string, string> = {
              image: 'image',
              text: 'text',
              shape: 'shape',
              parallax: 'parallax',
              character: 'character',
            };

            const storeType = typeMap[elementType] || 'image';
            designStore.addElement(storeType as any);

            const elements = designStore.project.elements;
            const newElement = elements[elements.length - 1];

            if (newElement) {
              const updates: Record<string, any> = {};

              if (elementName) updates.name = elementName;
              if (position?.x !== undefined) updates.x = position.x;
              if (position?.y !== undefined) updates.y = position.y;
              if (size?.width !== undefined) updates.width = size.width;
              if (size?.height !== undefined) updates.height = size.height;

              if (content) {
                if (elementType === 'text') {
                  updates.properties = { ...newElement.properties, text: content };
                } else if (elementType === 'image' && content.startsWith('http')) {
                  updates.properties = { ...newElement.properties, imageUrl: content };
                }
              }

              if (Object.keys(updates).length > 0) {
                designStore.updateElement(newElement.id, updates);
              }
            }

            store.showText(`ADDED: ${elementName || elementType.toUpperCase()}`);
            result = {
              success: true,
              message: `Added ${elementType} element to canvas`,
              context: { elementType, content, name: elementName, position, size },
            };
          } catch (error) {
            console.error('[Voice31] Add to canvas error:', error);
            result = { success: false, message: 'Failed to add element to canvas' };
          }
          break;
        }

        case 'generate_image_for_canvas': {
          const prompt = args.prompt as string;
          const style = (args.style as string) || 'illustration';
          const elementName = (args.name as string) || 'Generated Image';

          if (!prompt) {
            result = { success: false, message: 'No prompt provided' };
            break;
          }

          console.log('[Voice31] Generating image for canvas:', prompt);
          store.showGenerating(prompt);

          // Fire-and-forget: generate without blocking WebSocket
          (async () => {
            try {
              const response = await fetch('/api/voice-canvas/generate-media', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  type: 'image',
                  prompt: `${prompt}, ${style} style`,
                  style,
                  saveToAccount: true,
                  forceSchnell: true,
                  context: {
                    source: 'voice31-canvas',
                    sessionId: `voice31_canvas_${Date.now()}`,
                  },
                }),
              });

              if (response.ok) {
                const data = await response.json();
                const imageUrl = data.media?.[0]?.url;

                if (imageUrl) {
                  console.log('[Voice31] Image generated for canvas:', imageUrl);

                  try {
                    const { useDesignStudioV2Store } = await import('@/lib/design-studio-v2-store');
                    const designStore = useDesignStudioV2Store.getState();
                    designStore.addElement('image');
                    const elements = designStore.project.elements;
                    const newElement = elements[elements.length - 1];
                    if (newElement) {
                      designStore.updateElement(newElement.id, {
                        name: elementName,
                        properties: {
                          ...newElement.properties,
                          imageUrl,
                          prompt,
                        },
                      });
                    }
                  } catch (e) {
                    console.warn('[Voice31] Could not add to canvas store:', e);
                  }

                  store.showImage(imageUrl, elementName);
                  return;
                }
              }

              store.showText('IMAGE GENERATION FAILED');
            } catch (error) {
              console.error('[Voice31] Generate image error:', error);
              store.showText('IMAGE ERROR');
            }
          })();

          // Return immediately — don't block the WebSocket handler
          result = {
            success: true,
            message: `Generating image "${elementName}", will appear on canvas shortly`,
            context: { prompt, style, elementName },
          };
          break;
        }

        case 'generate_code_display': {
          // Block in RPG mode — agent should use RPG tools instead
          if (useVoice31RPGStore.getState().rpgModeActive) {
            result = {
              success: false,
              message: 'generate_code_display is not available in RPG mode. Use RPG tools (set_scene, show_npc, npc_speak, etc.) for visual storytelling. Describe scenes narratively and the system will generate backgrounds automatically.',
            };
            break;
          }

          const prompt = args.prompt as string;
          const fullscreen = (args.fullscreen as boolean) ?? false;

          if (!prompt) {
            result = { success: false, message: 'No prompt provided for code generation' };
            break;
          }

          // Clear storytelling overlay if active
          if (store.activeStoryQuestion) {
            store.clearVisualStory();
          }

          // Build session ID for metadata grouping
          const sessionId = `voice31_${Date.now()}`;

          console.log('[Voice31] Generating code (streaming):', prompt);
          store.setCodeDisplayFullscreen(fullscreen);
          store.startCodeStreaming(prompt);

          // Track as pending task
          const codeTaskId = store.addPendingTask({
            type: 'code_gen',
            label: 'Generating visualization',
          });
          store.updatePendingTask(codeTaskId, { status: 'running' as any, progress: 0.05 });

          // Parse streaming chunks across formats:
          // - Vercel data stream protocol lines (`0:"..."`)
          // - SSE (`data: ...`)
          // - raw/plain text streams
          let streamLineBuffer = '';
          let detectedProtocolFormat = false;
          let appendedAnyChunk = false;

          const appendChunk = (text: string) => {
            if (!text) return;
            appendedAnyChunk = true;
            store.appendCodeChunk(text);
          };

          const parseProtocolPayload = (payload: string) => {
            const trimmedPayload = payload.trim();
            if (!trimmedPayload || trimmedPayload === '[DONE]') return;

            try {
              const parsed = JSON.parse(trimmedPayload);
              if (typeof parsed === 'string') {
                appendChunk(parsed);
                return;
              }
              if (parsed && typeof parsed === 'object') {
                const maybeText = (parsed as { text?: unknown }).text;
                if (typeof maybeText === 'string') {
                  appendChunk(maybeText);
                }
              }
            } catch {
              appendChunk(trimmedPayload);
            }
          };

          const parseStreamChunks = (chunk: string, flush: boolean = false) => {
            if (!chunk && !flush) return;

            streamLineBuffer += chunk;
            const lines = streamLineBuffer.split('\n');

            if (!flush) {
              streamLineBuffer = lines.pop() ?? '';
            } else {
              streamLineBuffer = '';
            }

            let sawProtocolLine = false;
            const plainLines: string[] = [];

            for (const line of lines) {
              if (line.startsWith('0:')) {
                detectedProtocolFormat = true;
                sawProtocolLine = true;
                parseProtocolPayload(line.slice(2));
                continue;
              }

              if (line.startsWith('data:')) {
                detectedProtocolFormat = true;
                sawProtocolLine = true;
                parseProtocolPayload(line.slice(5));
                continue;
              }

              if (line.startsWith('event:') || line.startsWith(':')) {
                continue;
              }

              plainLines.push(line);
            }

            if (!detectedProtocolFormat && !sawProtocolLine && plainLines.length > 0) {
              appendChunk(plainLines.join('\n') + (flush ? '' : '\n'));
            }
          };

          // Dual-tier streaming: fast model first for immediate visual, then quality upgrade
          (async () => {
            try {
              // TIER 1: Fast model — show something immediately
              const fastResponse = await durableFetch('/api/voice31/generate-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  prompt,
                  model: 'google/gemini-2.5-flash',
                  stream: true,
                  sessionId,
                  sourceType: 'voice31',
                  tier: 'fast',
                }),
                maxRetries: 1,
                taskId: codeTaskId,
                timeout: 60000,
              });

              if (!fastResponse.ok || !fastResponse.body) {
                const error = await fastResponse.json().catch(() => ({}));
                store.setCodeDisplayError(error.error || 'Code generation failed');
                store.updatePendingTask(codeTaskId, { status: 'failed' as any });
                return;
              }

              store.updatePendingTask(codeTaskId, { progress: 0.2 });

              const reader = fastResponse.body.getReader();
              const decoder = new TextDecoder();

              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                parseStreamChunks(chunk);
              }
              parseStreamChunks('', true);

              // Finalize the stream — show result
              store.finalizeCodeStream();
              store.updatePendingTask(codeTaskId, { status: 'completed' as any, progress: 1 });
              console.log('[Voice31] Code stream finalized');

              // If streaming returned empty, fall back to non-streaming
              if (!appendedAnyChunk || !useVoice31Store.getState().codeDisplayState.code.trim()) {
                console.warn('[Voice31] Stream returned empty code, falling back to non-stream generation');
                const fallbackResponse = await durableFetch('/api/voice31/generate-code', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    prompt,
                    stream: false,
                    sessionId,
                    sourceType: 'voice31',
                  }),
                  maxRetries: 1,
                  softFail: true,
                  taskId: codeTaskId,
                  timeout: 60000,
                });

                if (fallbackResponse.ok) {
                  const fallbackData = await fallbackResponse.json();
                  if (fallbackData.code && typeof fallbackData.code === 'string') {
                    store.showCodeDisplay(fallbackData.code, 'tsx', prompt);
                  } else {
                    store.setCodeDisplayError('Generated code was empty');
                  }
                } else {
                  store.setCodeDisplayError('Code generation returned no renderable output');
                }
              }
            } catch (error) {
              console.error('[Voice31] Code streaming error:', error);
              store.setCodeDisplayError('Code generation failed');
              store.updatePendingTask(codeTaskId, { status: 'failed' as any });
            } finally {
              setTimeout(() => store.removePendingTask(codeTaskId), 2000);
            }
          })();

          // Return immediately — voice agent continues speaking
          result = {
            success: true,
            message: 'Code generation started. The visualization will appear on screen momentarily while I continue speaking.',
            context: {
              prompt,
              fullscreen,
              streaming: true,
              sessionId,
              source: 'speech.fm',
              sourceType: 'voice31',
            },
          };
          break;
        }

        case 'generate_visual_with_image': {
          const imagePrompt = args.image_prompt as string;
          const layoutPrompt = args.layout_prompt as string;
          const fullscreen = (args.fullscreen as boolean) ?? false;

          if (!imagePrompt || !layoutPrompt) {
            result = { success: false, message: 'Both image_prompt and layout_prompt are required' };
            break;
          }

          console.log('[Voice31] Generating visual with image:', imagePrompt, layoutPrompt);
          store.setCodeDisplayLoading(true);
          store.setCodeDisplayFullscreen(fullscreen);

          // Fire-and-forget: dual generation without blocking WebSocket
          (async () => {
            try {
              const imageResponse = await fetch('/api/voice-canvas/generate-media', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  type: 'image',
                  prompt: imagePrompt,
                  style: 'illustration',
                  saveToAccount: true,
                  forceSchnell: true,
                  context: { source: 'voice31-visual', sessionId: `voice31_visual_${Date.now()}` },
                }),
              });

              let imageUrl = '';
              if (imageResponse.ok) {
                const imageData = await imageResponse.json();
                imageUrl = imageData.media?.[0]?.url || '';
              }

              const codePrompt = `Create a styled visual layout with this specification: ${layoutPrompt}

${imageUrl ? `IMPORTANT: Include this image in your design: ${imageUrl}
Use it as an <img> tag with appropriate styling.` : 'Create a placeholder for where an image would go.'}

Make it visually stunning with the CRT/retro aesthetic. Include animations, glow effects, and professional typography.`;

              const codeResponse = await durableFetch('/api/voice31/generate-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  prompt: codePrompt,
                  sourceType: 'voice31',
                }),
                maxRetries: 1,
                softFail: true,
              });

              if (codeResponse.ok) {
                const codeData = await codeResponse.json();

                if (codeData.code) {
                  console.log('[Voice31] Visual with image generated');
                  store.showCodeDisplay(codeData.code, 'tsx', `${imagePrompt} - ${layoutPrompt}`);
                  return;
                }
              }

              store.setCodeDisplayError('Failed to generate visual');
            } catch (error) {
              console.error('[Voice31] Generate visual with image error:', error);
              store.setCodeDisplayError('Visual generation failed');
            }
          })();

          // Return immediately — don't block the WebSocket handler
          result = {
            success: true,
            message: 'Generating styled visual with image, will appear shortly',
            context: { imagePrompt, layoutPrompt, fullscreen },
          };
          break;
        }

        // =============================================================================
        // MEMORY & NOTES TOOLS
        // =============================================================================

        case 'remember': {
          const content = args.content as string;
          const category = (args.category as 'fact' | 'preference' | 'context' | 'instruction') || 'context';

          const id = store.addMemory(content, category);
          console.log('[Voice31] Memory stored:', { id, content, category });

          result = {
            success: true,
            message: `Memory stored: ${content.slice(0, 50)}...`,
            context: { memoryId: id, category },
          };
          break;
        }

        case 'create_note': {
          const title = args.title as string;
          const content = (args.content as string) || '';

          const noteId = store.createNote(title, content);
          console.log('[Voice31] Note created:', { noteId, title });

          // If content provided, simulate streaming
          if (content) {
            store.startStreaming(noteId);
            // Stream content character by character for effect
            const chars = content.split('');
            let index = 0;
            const streamInterval = setInterval(() => {
              if (index < chars.length) {
                // Batch 3 chars at a time for performance
                const batch = chars.slice(index, index + 3).join('');
                store.appendStreamContent(batch);
                index += 3;
              } else {
                store.finishStreaming();
                clearInterval(streamInterval);
              }
            }, 20);
          }

          result = {
            success: true,
            message: `Note "${title}" created`,
            context: { noteId },
          };
          break;
        }

        case 'update_note': {
          const content = args.content as string;
          const activeNote = store.memoryState.activeNoteId;

          if (!activeNote) {
            // Create a new note if none active
            const noteId = store.createNote('Quick Note', '');
            store.startStreaming(noteId);
          } else {
            store.startStreaming(activeNote);
          }

          // Stream the content
          const chars = content.split('');
          let index = 0;
          const streamInterval = setInterval(() => {
            if (index < chars.length) {
              const batch = chars.slice(index, index + 3).join('');
              store.appendStreamContent(batch);
              index += 3;
            } else {
              store.finishStreaming();
              clearInterval(streamInterval);
            }
          }, 20);

          result = {
            success: true,
            message: 'Note updated',
          };
          break;
        }

        case 'show_notes': {
          store.setEditorVisible(true);
          result = {
            success: true,
            message: 'Notes panel opened',
          };
          break;
        }

        case 'list_memories': {
          const memories = store.memoryState.memories;
          if (memories.length === 0) {
            result = {
              success: true,
              message: "I don't have any memories stored yet.",
              context: { memories: [] },
            };
            break;
          }

          const memoryList = memories.map((m) => `- [${m.category}] ${m.content}`).join('\n');
          store.showText(`Here's what I remember:\n\n${memoryList}`);

          result = {
            success: true,
            message: `Found ${memories.length} memories`,
            context: { memories },
          };
          break;
        }

        // =============================================================================
        // VISUAL STORYTELLING TOOL
        // =============================================================================

        case 'start_visual_story': {
          // Block in RPG mode — not applicable
          if (useVoice31RPGStore.getState().rpgModeActive) {
            result = {
              success: false,
              message: 'start_visual_story is not available in RPG mode. Use set_scene for location changes, show_npc for characters, and narrate naturally — backgrounds generate automatically.',
            };
            break;
          }

          const question = args.question as string;

          if (!question) {
            result = { success: false, message: 'No question provided for visual story' };
            break;
          }

          console.log('[Voice31] Starting visual story (assistant-narrated):', question);

          // Clean up any existing visual story before starting a new one
          if (store.activeStoryQuestion) {
            console.log('[Voice31] Clearing previous story for new start_visual_story');
            store.clearVisualStory();
          }

          // Step 1: Fire research as NON-BLOCKING background promise
          const researchPromise = (async () => {
            try {
              const researchRes = await fetch('/api/voice31/research-topic', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question, maxResults: 5 }),
              });
              if (researchRes.ok) {
                const data = await researchRes.json();
                if (data.results?.length > 0) {
                  const ctx = {
                    query: question,
                    results: data.results,
                    fetchedAt: Date.now(),
                  };
                  console.log('[Voice31] Research found:', data.results.length, 'results');
                  return ctx;
                }
              }
            } catch (e) {
              console.warn('[Voice31] Research fetch failed (continuing without):', e);
            }
            return null;
          })();

          // Step 2: Mount visuals IMMEDIATELY — no waiting for research or scene generation
          // The Orchestrator handles scene generation independently using the research promise.
          store.startVisualStory(question);

          // Store the research promise in module ref so the Orchestrator can await it
          const { setResearchPromiseRef } = await import('./storytelling/researchPromiseRef');
          setResearchPromiseRef(researchPromise);

          // Return immediately — the agent speaks naturally
          // while the Orchestrator generates scenes in the background.
          result = {
            success: true,
            message: 'Visual story started. Narrate the topic — your voice drives the visuals.',
            context: {
              instruction: `IMPORTANT: You are the narrator. Speak about "${question}" in an engaging, informative way. The visuals on screen will match your narration — they show the same topic you are speaking about. Do NOT talk about unrelated things while the story plays. Do NOT mention scene numbers, transitions, or visual markers. If the user corrects you, call start_visual_story again with the corrected topic — it auto-replaces. Keep your narration focused on the topic — the visuals reinforce what you say.`,
              question,
            },
          };
          break;
        }

        // =============================================================================
        // WEATHER TOOL
        // =============================================================================

        case 'show_weather': {
          const location = args.location as string;

          if (!location) {
            result = { success: false, message: 'No location provided for weather' };
            break;
          }

          console.log('[Voice31] Fetching weather for:', location);
          store.setWeatherLoading(true);

          // Await so model can narrate the weather
          try {
            const response = await durableFetch(`/api/voice31/weather?location=${encodeURIComponent(location)}`, {
              method: 'GET',
              maxRetries: 2,
            });

            if (response.ok) {
              const weatherData = await response.json();
              store.setWeatherData(weatherData);

              result = {
                success: true,
                message: `Weather for ${weatherData.location}: ${weatherData.temperature}°F, ${weatherData.description}. Feels like ${weatherData.feelsLike}°F. Humidity: ${weatherData.humidity}%, Wind: ${weatherData.windSpeed} mph. The animated weather display is now showing on screen.`,
                context: {
                  location: weatherData.location,
                  temperature: weatherData.temperature,
                  feelsLike: weatherData.feelsLike,
                  condition: weatherData.condition,
                  description: weatherData.description,
                  humidity: weatherData.humidity,
                  windSpeed: weatherData.windSpeed,
                  forecast: weatherData.forecast,
                },
              };
            } else {
              const error = await response.json().catch(() => ({}));
              store.setWeatherError(error.error || 'Failed to fetch weather');
              result = { success: false, message: error.error || 'Failed to fetch weather data' };
            }
          } catch (error) {
            console.error('[Voice31] Weather error:', error);
            store.setWeatherError('Failed to fetch weather');
            result = { success: false, message: 'Weather fetch failed — network error' };
          }
          break;
        }

        // =============================================================================
        // BROWSER AUTOMATION TOOLS
        // =============================================================================

        case 'browse_web': {
          const instruction = args.instruction as string;
          const startUrl = args.url as string | undefined;

          if (!instruction) {
            result = { success: false, message: 'No instruction provided' };
            break;
          }

          console.log('[Voice31] Starting browser automation:', instruction, startUrl);
          store.startBrowserAutomation(instruction, startUrl);

          // Generate chatId for browser automation session
          const chatId = `voice31_browser_${Date.now()}`;

          // Fire-and-forget: orchestrate browser session
          (async () => {
            try {
              // Step 1: Create session
              store.appendBrowserAction({
                id: `action_${Date.now()}_1`,
                type: 'process',
                label: 'CONNECTING',
                headline: 'Starting browser session...',
                timestamp: Date.now(),
              });

              const sessionController = new AbortController();
              const sessionTimeout = setTimeout(() => sessionController.abort(), 25000);
              const sessionRes = await fetch(`/api/browser-automation/${chatId}/session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: startUrl }),
                signal: sessionController.signal,
              });
              clearTimeout(sessionTimeout);

              if (!sessionRes.ok) {
                store.setBrowserAutomationStatus('error');
                store.appendBrowserAction({
                  id: `action_${Date.now()}_err`,
                  type: 'other',
                  label: 'ERROR',
                  headline: 'Failed to start browser session',
                  timestamp: Date.now(),
                });
                return;
              }

              const sessionData = await sessionRes.json();
              store.setBrowserAutomationSession(
                sessionData.sessionId || chatId,
                sessionData.debuggerUrl
              );

              // Step 2: Generate + execute script
              store.appendBrowserAction({
                id: `action_${Date.now()}_2`,
                type: 'thought',
                label: 'PLANNING',
                headline: instruction,
                timestamp: Date.now(),
              });

              const execController = new AbortController();
              const execTimeout = setTimeout(() => execController.abort(), 25000);
              const execRes = await fetch(`/api/browser-automation/${chatId}/execute`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ instruction, url: startUrl }),
                signal: execController.signal,
              });
              clearTimeout(execTimeout);

              if (execRes.ok) {
                const execData = await execRes.json();
                store.setBrowserExtractedData(execData.result || execData);
                store.setBrowserAutomationStatus('complete');
                store.appendBrowserAction({
                  id: `action_${Date.now()}_done`,
                  type: 'complete',
                  label: 'COMPLETE',
                  headline: 'Browser automation finished',
                  detail: typeof execData.result === 'string'
                    ? execData.result.slice(0, 200)
                    : JSON.stringify(execData.result || {}).slice(0, 200),
                  timestamp: Date.now(),
                });
              } else {
                store.setBrowserAutomationStatus('error');
                store.appendBrowserAction({
                  id: `action_${Date.now()}_fail`,
                  type: 'other',
                  label: 'FAILED',
                  headline: 'Execution failed',
                  timestamp: Date.now(),
                });
              }
            } catch (error) {
              console.error('[Voice31] Browser automation error:', error);
              store.setBrowserAutomationStatus('error');
            }
          })();

          result = {
            success: true,
            message: 'Browser automation started. The browser is now navigating and performing the requested actions. Results will appear in the sidebar Browser tab.',
            context: { instruction, url: startUrl, chatId },
          };
          break;
        }

        case 'extract_web_data': {
          const url = args.url as string;
          const what = args.what as string;

          if (!url || !what) {
            result = { success: false, message: 'Both url and what parameters are required' };
            break;
          }

          console.log('[Voice31] Extracting web data:', url, what);
          store.startBrowserAutomation(`Extract: ${what}`, url);

          const extractChatId = `voice31_extract_${Date.now()}`;

          // Await to return extracted data to the model
          try {
            store.appendBrowserAction({
              id: `action_${Date.now()}_1`,
              type: 'navigate',
              label: 'NAVIGATING',
              headline: `Opening ${new URL(url).hostname}...`,
              timestamp: Date.now(),
            });

            const res = await fetch(`/api/browser-automation/${extractChatId}/execute`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                instruction: `Go to ${url} and extract: ${what}. Return the data as structured JSON.`,
                url,
              }),
            });

            if (res.ok) {
              const data = await res.json();
              store.setBrowserExtractedData(data.result || data);
              store.setBrowserAutomationStatus('complete');

              const extracted = typeof data.result === 'string'
                ? data.result
                : JSON.stringify(data.result || data, null, 2);

              store.appendBrowserAction({
                id: `action_${Date.now()}_done`,
                type: 'complete',
                label: 'EXTRACTED',
                headline: `Data extracted from ${new URL(url).hostname}`,
                detail: extracted.slice(0, 200),
                timestamp: Date.now(),
              });

              result = {
                success: true,
                message: `Data extracted from ${url}:\n${extracted.slice(0, 2000)}`,
                context: { url, what, result: data.result || data },
              };
            } else {
              store.setBrowserAutomationStatus('error');
              result = { success: false, message: 'Failed to extract data from the website' };
            }
          } catch (error) {
            console.error('[Voice31] Extract error:', error);
            store.setBrowserAutomationStatus('error');
            result = { success: false, message: 'Data extraction failed — network error' };
          }
          break;
        }

        // =====================================================================
        // UPLOAD + 3D CANVAS TOOLS
        // =====================================================================

        case 'get_upload_context': {
          const uploads = store.uploads;
          if (uploads.length === 0) {
            result = {
              success: true,
              message: 'No files have been uploaded yet. The user can upload images or PDFs via the Uploads tab in the sidebar.',
              context: { uploads: [] },
            };
          } else {
            const summary = uploads.map((u: any) => ({
              id: u.id,
              filename: u.filename,
              contentType: u.contentType,
              analysis: u.analysis,
              keywords: u.keywords,
              hasProcessed: !!u.processed,
            }));
            result = {
              success: true,
              message: `${uploads.length} file(s) uploaded:\n${summary.map((s: any) => `- ${s.filename} [${s.contentType || 'unknown'}]: ${s.analysis || 'No analysis'}`).join('\n')}`,
              context: { uploads: summary },
            };
          }
          break;
        }

        case 'process_upload': {
          const fileId = args.file_id as string;
          const pipeline = (args.pipeline as string) || 'auto';

          if (!fileId) {
            result = { success: false, message: 'file_id is required' };
            break;
          }

          const upload = store.uploads.find((u: any) => u.id === fileId);
          if (!upload) {
            result = { success: false, message: `Upload not found: ${fileId}` };
            break;
          }

          console.log('[Voice31] Processing upload:', fileId, 'pipeline:', pipeline);

          try {
            const res = await durableFetch('/api/voice31/smart-pipeline', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                imageUrl: upload.blobUrl,
                contentType: upload.contentType || '',
                pipeline,
              }),
            });

            if (res.ok) {
              const data = await res.json();
              // Update upload in store with processed results
              store.updateUpload(fileId, {
                processed: {
                  highResUrl: data.highResUrl,
                  depthMapUrl: data.depthMapUrl,
                  meshUrl: data.meshUrl,
                  pipeline: data.pipeline,
                },
              });

              const parts = [];
              if (data.highResUrl) parts.push('upscaled image');
              if (data.depthMapUrl) parts.push('depth map');
              if (data.meshUrl) parts.push('3D mesh');

              result = {
                success: true,
                message: `Pipeline "${data.pipeline}" complete for ${upload.filename}. Generated: ${parts.join(', ')}.`,
                context: {
                  pipeline: data.pipeline,
                  highResUrl: data.highResUrl,
                  depthMapUrl: data.depthMapUrl,
                  meshUrl: data.meshUrl,
                },
              };
            } else {
              const err = await res.json().catch(() => ({ error: 'Pipeline failed' }));
              result = { success: false, message: `Pipeline failed: ${err.error || 'unknown error'}` };
            }
          } catch (error) {
            console.error('[Voice31] Pipeline error:', error);
            result = { success: false, message: 'Smart pipeline failed — network error' };
          }
          break;
        }

        case 'build_3d_canvas': {
          const sceneName = args.scene_name as string;
          const layersJson = args.layers as string;
          const cameraPreset = (args.camera_preset as string) || 'orbit';

          if (!sceneName || !layersJson) {
            result = { success: false, message: 'scene_name and layers are required' };
            break;
          }

          let layerDefs: Array<{ file_id: string; role: string; depth: number }>;
          try {
            layerDefs = typeof layersJson === 'string' ? JSON.parse(layersJson) : layersJson;
          } catch {
            result = { success: false, message: 'Invalid layers JSON' };
            break;
          }

          // Build canvas layers from processed uploads
          const canvasLayers: any[] = [];
          const layerDescriptions: string[] = [];

          for (const layerDef of layerDefs) {
            const upload = store.uploads.find((u: any) => u.id === layerDef.file_id);
            if (!upload) continue;

            const processed = upload.processed;
            const imageUrl = processed?.highResUrl || upload.blobUrl;
            const depthUrl = processed?.depthMapUrl;

            canvasLayers.push({
              id: `layer_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              type: depthUrl ? 'depth' : 'image',
              sourceUrl: upload.blobUrl,
              processedUrl: imageUrl,
              depthMapUrl: depthUrl,
              meshUrl: processed?.meshUrl,
              position: {
                x: 0,
                y: 0,
                z: layerDef.depth ?? 0.5,
              },
              scale: 1,
              opacity: 1,
              label: `${layerDef.role}: ${upload.filename}`,
            });

            layerDescriptions.push(
              `${layerDef.role} "${upload.filename}" at depth ${layerDef.depth}${depthUrl ? ' (has depth map)' : ''}${processed?.meshUrl ? ' (has 3D mesh)' : ''}, url: ${imageUrl}${depthUrl ? `, depthMap: ${depthUrl}` : ''}`
            );
          }

          // Create/update canvas scene
          const canvasScene = {
            id: `canvas_${Date.now()}`,
            name: sceneName,
            layers: canvasLayers,
            camera: { fov: 60, position: [0, 0, 5] as [number, number, number] },
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          store.setActiveCanvas(canvasScene);

          // Save as artifact
          store.saveArtifact({
            type: 'canvas_3d' as any,
            title: sceneName,
            content: canvasScene,
            preview: `3D canvas with ${canvasLayers.length} layers`,
            tags: ['3d', 'canvas', ...canvasLayers.flatMap((l: any) => l.label ? [l.label.split(':')[0].trim()] : [])],
            source: 'voice31',
            pinned: false,
          });

          // Generate Three.js visualization via code gen
          const cameraAnimations: Record<string, string> = {
            orbit: 'camera.position.x = Math.sin(time * 0.3) * 3; camera.position.z = Math.cos(time * 0.3) * 5; camera.lookAt(0, 0, 0);',
            push_in: 'camera.position.z = 8 - time * 0.3; if (camera.position.z < 2) camera.position.z = 2;',
            static: '// Static camera',
            drift: 'camera.position.x = Math.sin(time * 0.15) * 1.5; camera.position.y = Math.cos(time * 0.2) * 0.5;',
          };

          const codeGenPrompt = `Create a 3D scene viewer called "${sceneName}" with these layers:\n${layerDescriptions.join('\n')}\n\nUse Three.js (available as window.THREE). Create depth-displaced planes for each layer using PlaneGeometry + ShaderMaterial. Load textures with THREE.TextureLoader. Camera animation: ${cameraAnimations[cameraPreset] || cameraAnimations.orbit}. Dark background (#0a0a0a), add subtle atmospheric fog. Phosphor accent colors for any UI elements.`;

          // Trigger code gen (fire-and-forget — tool handler doesn't need to wait)
          try {
            const toolRef = createVoice31ToolHandler();
            toolRef.handleToolCall('generate_code_display', {
              prompt: codeGenPrompt,
              fullscreen: false,
            });
          } catch (e) {
            console.warn('[Voice31] Canvas code gen failed (non-fatal):', e);
          }

          result = {
            success: true,
            message: `3D canvas "${sceneName}" created with ${canvasLayers.length} layers. Generating Three.js visualization.`,
            context: {
              sceneId: canvasScene.id,
              sceneName,
              layerCount: canvasLayers.length,
              cameraPreset,
            },
          };
          break;
        }

        default:
          console.warn('[Voice31] Unknown tool:', name);
          result = { success: false, message: `Unknown tool: ${name}` };
      }
      } catch (error) {
        console.error('[Voice31] Tool execution error:', name, error);
        result = {
          success: false,
          message: error instanceof Error ? error.message : 'Tool execution failed',
          context: { error: String(error) },
        };
      }

      // Log the result with styled output
      logToolResult(name, result);

      // =====================================================================
      // AUTO-SAVE ARTIFACT (fire-and-forget after successful tool execution)
      // =====================================================================
      if (result.success) {
        try {
          const artifactMapping: Record<string, { type: string; titleFn: (args: any, ctx: any) => string }> = {
            show_image: { type: 'image_generation', titleFn: (a) => a.prompt?.slice(0, 80) || 'Generated Image' },
            generate_code_display: { type: 'code_generation', titleFn: (a) => a.prompt?.slice(0, 80) || 'Code Generation' },
            generate_visual_with_image: { type: 'code_generation', titleFn: (a) => `Visual: ${(a.image_prompt || '').slice(0, 60)}` },
            search_web: { type: 'search_result', titleFn: (a) => `Search: ${a.query || ''}` },
            fetch_article: { type: 'article', titleFn: (_a, ctx) => ctx?.title || 'Article' },
            read_search_result: { type: 'article', titleFn: (_a, ctx) => ctx?.title || 'Article' },
            show_weather: { type: 'weather_snapshot', titleFn: (_a, ctx) => `Weather: ${ctx?.location || ''}` },
            browse_web: { type: 'browser_result', titleFn: (a) => `Browse: ${(a.instruction || '').slice(0, 60)}` },
            extract_web_data: { type: 'browser_result', titleFn: (a) => `Extract: ${(a.what || '').slice(0, 60)}` },
            create_note: { type: 'note', titleFn: (a) => a.title || 'Note' },
            start_visual_story: { type: 'story_session', titleFn: (a) => `Story: ${(a.question || '').slice(0, 60)}` },
            build_3d_canvas: { type: 'canvas_3d', titleFn: (a) => `Canvas: ${(a.scene_name || '').slice(0, 60)}` },
          };

          const mapping = artifactMapping[name];
          if (mapping) {
            const artifact = buildArtifact({
              type: mapping.type as any,
              title: mapping.titleFn(args, result.context),
              content: result.context || args,
              preview: result.message?.slice(0, 100),
              source: 'voice31',
              meta: { ...args, ...result.context },
            });
            const artifactId = store.saveArtifact(artifact);
            // Persist to DB in background (non-blocking)
            const fullArtifact = store.artifacts.find((a: any) => a.id === artifactId);
            if (fullArtifact) {
              persistArtifact(fullArtifact).catch(() => {});
            }
          }
        } catch (e) {
          // Artifact saving should never break tool execution
          console.warn('[Voice31] Artifact save error (non-fatal):', e);
        }
      }

      // Clear activity with min-duration guarantee
      clearToolActivity(store, name, activityStartTime);

      return result;
    },
  };
}
