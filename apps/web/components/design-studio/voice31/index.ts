/**
 * Voice31 Module Exports
 *
 * Fresh voice assistant implementation with CRT display.
 * Supports Hume and ElevenLabs backends.
 */

export { Voice31Tab } from './Voice31Tab';
export { Voice31Display } from './Voice31Display';
export { Voice31Provider, useVoice31Context, VOICE26_CONFIG_ID } from './Voice31Provider';
export { Voice31ElevenLabsProvider, useVoice31ElevenLabs, ELEVENLABS_AGENT_ID } from './Voice31ElevenLabsProvider';
export { Voice31UnifiedProvider, Voice31BackendSwitcher, useVoice31Backend } from './Voice31UnifiedProvider';
export { Voice31Effects } from './Voice31Effects';
export { Voice31Controls } from './Voice31Controls';
export { Voice31UnifiedControls } from './Voice31UnifiedControls';
export { Voice31NoteEditor } from './Voice31NoteEditor';
export { Voice31Settings } from './Voice31Settings';
export { useVoice31Store } from './Voice31Store';
export { VOICE31_TOOLS, VOICE31_SYSTEM_PROMPT, createVoice31ToolHandler } from './Voice31Tools';
export { KineticText } from './KineticText';

export type {
  PhosphorColor,
  DisplayContentType,
  EffectType,
  DisplayContent,
  ActiveEffect,
  Voice31Store,
  ScreenType,
  AssistantVisual,
  VoiceBackendType,
  VoiceConfig,
  PersonalityConfig,
  AssistantConfig,
  AssistantSettingsState,
} from './Voice31Store';

export { Voice31SidePanel } from './Voice31SidePanel';

export type { VoiceBackend } from './Voice31UnifiedProvider';
