/**
 * Voice Tools
 * Ported from Voice31Tools.ts - removed DOM refs, canvas tools, web fetch tools
 * Mobile version focuses on display tools and essential RPG tools
 */

import { useVoiceStore } from '@/stores/voice-store';
import type { VisualizationType, EffectType, PhosphorColor } from '@/stores/voice-store';

// =============================================================================
// TYPES
// =============================================================================

export interface ToolCallResult {
  success: boolean;
  message: string;
  context?: Record<string, unknown>;
}

export interface ToolCallHandler {
  handleToolCall: (name: string, args: Record<string, any>) => Promise<ToolCallResult>;
}

// =============================================================================
// MOOD → COLOR MAPPING
// =============================================================================

const moodToColor: Record<string, PhosphorColor> = {
  calm: 'amber',
  excited: 'green',
  thinking: 'blue',
  alert: 'red',
  neutral: 'amber',
};

// =============================================================================
// TOOL HANDLER
// =============================================================================

export function createVoiceToolHandler(): ToolCallHandler {
  return {
    handleToolCall: async (name: string, args: Record<string, any>): Promise<ToolCallResult> => {
      const store = useVoiceStore.getState();
      let result: ToolCallResult;

      try {
        switch (name) {
          case 'show_text': {
            const text = args.text as string;
            store.showText(text);
            result = { success: true, message: `Displayed text: "${text.slice(0, 50)}..."` };
            break;
          }

          case 'show_list': {
            const items = args.items as string[];
            const title = args.title as string | undefined;
            store.showList(items, title);
            result = { success: true, message: `Displayed list with ${items.length} items` };
            break;
          }

          case 'show_image': {
            const prompt = args.prompt as string;
            // For mobile, we use the API to generate images
            store.showGenerating(prompt);
            result = {
              success: true,
              message: `Image generation requested: "${prompt}"`,
              context: { prompt },
            };
            break;
          }

          case 'trigger_effect': {
            const type = args.type as EffectType;
            const intensity = args.intensity as number || 0.5;
            const duration = args.duration as number || 5000;
            store.triggerEffect(type, intensity, duration);
            result = { success: true, message: `Effect triggered: ${type}` };
            break;
          }

          case 'set_mood': {
            const mood = args.mood as string;
            const color = moodToColor[mood] || 'amber';
            store.setPhosphorColor(color);
            result = { success: true, message: `Mood set to ${mood} (color: ${color})` };
            break;
          }

          case 'set_color': {
            const color = args.color as PhosphorColor;
            if (['green', 'red', 'blue', 'amber', 'white'].includes(color)) {
              store.setPhosphorColor(color);
              result = { success: true, message: `Color set to ${color}` };
            } else {
              result = { success: false, message: `Invalid color: ${color}` };
            }
            break;
          }

          case 'clear_display': {
            store.clearContent();
            result = { success: true, message: 'Display cleared' };
            break;
          }

          case 'show_visualization': {
            const type = args.type as VisualizationType;
            const title = args.title as string | undefined;
            store.showVisualization(type, title);
            result = { success: true, message: `Visualization shown: ${type}` };
            break;
          }

          default:
            result = { success: false, message: `Unknown tool: ${name}` };
        }
      } catch (error) {
        result = {
          success: false,
          message: error instanceof Error ? error.message : 'Tool execution failed',
        };
      }

      return result;
    },
  };
}

// =============================================================================
// VISUAL SCHEDULING (simplified for mobile)
// =============================================================================

export function executeScheduledEvents(trigger: string) {
  // Simplified - no visual scheduling queue on mobile yet
  console.log(`[VoiceTools] Trigger: ${trigger}`);
}
