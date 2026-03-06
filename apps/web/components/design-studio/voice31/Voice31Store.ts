"use client";

/**
 * Voice31 Store
 *
 * Minimal Zustand store for voice31 state management.
 * Clean and focused - no legacy complexity.
 */

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { AssistantActivity } from "@/lib/speech-fm/action-library/types";
import { useStorytellingStore } from "./storytelling/StorytellingStore";

export type { AssistantActivity } from "@/lib/speech-fm/action-library/types";

// =============================================================================
// TYPES
// =============================================================================

export type PhosphorColor = "green" | "red" | "blue" | "amber" | "white";

// =============================================================================
// VISUAL INTELLIGENCE TYPES
// =============================================================================

export type VisualDisplayLevel = "off" | "minimal" | "standard" | "cinematic";
export type BackgroundSource = "auto" | "unsplash" | "flux";
export type AmbientTransitionType = "dissolve" | "crt_static" | "scanline_wipe";

export interface VisualIntelligenceState {
  displayLevel: VisualDisplayLevel;
  backgroundSource: BackgroundSource;
  backgroundOpacity: number; // 0-1 (default 0.35)
  transitionInterval: number; // seconds (default 30)
  topicDetectionEnabled: boolean;
  // Runtime state
  currentBackgroundUrl: string | null;
  incomingBackgroundUrl: string | null;
  transitionType: AmbientTransitionType;
  isTransitioning: boolean;
  topicSignature: string | null;
  lastBackgroundChangeTime: number;
  // Budget tracking
  fluxGenerationsUsed: number;
  unsplashRequestsUsed: number;
  sessionStartTime: number;
}

export type DisplayContentType =
  | "text"
  | "list"
  | "image"
  | "generating"
  | "visualization"
  | null;

export type VisualizationType =
  | "isometric_lattice"
  | "waveform"
  | "graph"
  | "particles"
  | "matrix"
  | "neural_net"
  | "dna_helix"
  | null;

export type EffectType =
  | "rain"
  | "snow"
  | "confetti"
  | "sparkles"
  | "fire"
  | "hearts"
  | "stars"
  | null;

// =============================================================================
// INTELLIGENT DISPLAY SYSTEM TYPES
// =============================================================================

export type DisplayMode = "normal" | "fullscreen" | "split" | "assistant-mini";

export interface CodeDisplayState {
  active: boolean;
  code: string;
  language: "tsx" | "jsx" | "svg" | "html" | "css";
  componentHtml?: string; // Rendered HTML for iframe display
  isLoading: boolean;
  isStreaming: boolean;
  streamingCode: string;
  error: string | null;
  prompt?: string;
  // Layout
  fullscreen: boolean;
  aspectRatio?: number;
}

export interface IntelligentDisplayState {
  mode: DisplayMode;
  assistantPosition: "center" | "bottom-left" | "bottom-right" | "hidden";
  contentScale: number; // 0-1 scale factor for content
  transitionActive: boolean;
  autoLayoutEnabled: boolean;
}

export type WireframeSemanticType =
  | "idea"
  | "question"
  | "data"
  | "connection"
  | "time"
  | "growth"
  | "warning"
  | "success"
  | "error"
  | "process"
  | "music"
  | "abstract"
  | null;

export interface WireframeState {
  active: boolean;
  semanticType: WireframeSemanticType;
  labels?: string[];
  duration: number;
  startTime: number;
}

export interface DisplayContent {
  type: DisplayContentType;
  text?: string;
  list?: string[];
  listTitle?: string;
  imageUrl?: string;
  imagePrompt?: string;
  // Visualization fields
  visualizationType?: VisualizationType;
  visualizationTitle?: string;
}

// Persistent image layer - survives text content changes
export interface PersistentImageLayer {
  url: string;
  prompt?: string;
  position: "background" | "left" | "right" | "center";
  opacity: number;
  timestamp: number;
}

export interface ActiveEffect {
  type: EffectType;
  intensity: number;
  startTime: number;
  duration: number;
}

// Audio FX settings for real-time voice processing
export interface AudioFXSettings {
  pitch: number; // -12 to +12 semitones
  bitcrush: number; // 0 to 1 (0 = no crush, 1 = full crush)
  reverb: number; // 0 to 1 (0 = dry, 1 = full wet)
  filter: number; // 0 to 1 (0 = lowpass closed, 1 = fully open)
}

// =============================================================================
// MEMORY & NOTES TYPES
// =============================================================================

export interface MemoryEntry {
  id: string;
  content: string;
  category: "fact" | "preference" | "context" | "instruction";
  createdAt: number;
  updatedAt: number;
}

export interface NoteDocument {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  tags?: string[];
}

export interface MemoryState {
  memories: MemoryEntry[];
  notes: NoteDocument[];
  activeNoteId: string | null;
  editorVisible: boolean;
  isStreaming: boolean;
  streamingContent: string;
}

// =============================================================================
// BROWSER/READER TYPES
// =============================================================================

export type BrowserMode = "off" | "reader" | "results" | "loading";

export interface ReaderContent {
  title: string;
  source: string;
  url: string;
  content: string;
  textContent: string;
  excerpt?: string;
  byline?: string;
  siteName?: string;
  publishedDate?: string;
  images: string[];
  wordCount: number;
}

export interface SearchResult {
  id: string;
  title: string;
  url: string;
  snippet: string;
  highlights?: string[];
  publishedDate?: string;
  author?: string;
  score?: number;
  imageUrl?: string;
}

export interface BrowserState {
  mode: BrowserMode;
  readerContent: ReaderContent | null;
  searchResults: SearchResult[];
  searchQuery: string;
  isLoading: boolean;
  error: string | null;
}

// =============================================================================
// PROGRESSIVE DIAGRAM TYPES
// =============================================================================

export type DiagramStyle =
  | "flowchart"
  | "network"
  | "hierarchy"
  | "timeline"
  | "cycle";

export interface DiagramNode {
  id: string;
  label: string;
  level: number;
  connectsTo?: string[];
  position?: { x: number; y: number };
}

export interface DiagramState {
  active: boolean;
  title: string;
  style: DiagramStyle;
  nodes: DiagramNode[];
  revealedLevel: number;
  highlightedNode: string | null;
  autoAdvance: boolean;
}

// =============================================================================
// ARTIFACT SYSTEM TYPES
// =============================================================================

export type ArtifactType =
  | "note"
  | "document"
  | "code_generation"
  | "image_generation"
  | "search_result"
  | "article"
  | "weather_snapshot"
  | "rpg_scene"
  | "rpg_character"
  | "story_session"
  | "browser_result"
  | "file";

export interface Artifact {
  id: string;
  type: ArtifactType;
  title: string;
  preview?: string;
  content: any;
  tags: string[];
  source: string;
  createdAt: number;
  updatedAt: number;
  pinned: boolean;
}

// =============================================================================
// WEATHER DISPLAY TYPES
// =============================================================================

export type WeatherCondition =
  | "clear"
  | "clouds"
  | "rain"
  | "drizzle"
  | "thunderstorm"
  | "snow"
  | "mist"
  | "fog"
  | "wind";

export interface WeatherData {
  location: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  pressure: number;
  condition: WeatherCondition;
  description: string;
  icon: string;
  sunrise: number;
  sunset: number;
  forecast: WeatherForecastDay[];
}

export interface WeatherForecastDay {
  date: string;
  tempHigh: number;
  tempLow: number;
  condition: WeatherCondition;
  description: string;
  icon: string;
}

export interface WeatherDisplayState {
  active: boolean;
  data: WeatherData | null;
  isLoading: boolean;
  error: string | null;
}

// =============================================================================
// BROWSER AUTOMATION TYPES
// =============================================================================

export interface BrowserAutomationAction {
  id: string;
  type:
    | "complete"
    | "thought"
    | "click"
    | "process"
    | "observe"
    | "input"
    | "wait"
    | "navigate"
    | "other";
  label: string;
  headline: string;
  detail?: string;
  timestamp: number;
}

export interface BrowserAutomationState {
  active: boolean;
  sessionId: string | null;
  debuggerUrl: string | null;
  actionFeed: BrowserAutomationAction[];
  extractedData: any;
  status: "idle" | "connecting" | "executing" | "complete" | "error";
}

// =============================================================================
// PROGRESSIVE RENDERING & BUFFERING STATE
// =============================================================================

export type BufferingPhase =
  | "idle"
  | "receiving"
  | "processing"
  | "rendering"
  | "streaming";

export type PendingTaskStatus =
  | "queued"
  | "running"
  | "retrying"
  | "completed"
  | "failed";

export interface PendingTask {
  id: string;
  type: string;
  label: string;
  status: PendingTaskStatus;
  progress: number; // 0-1
  startedAt: number;
  retryCount: number;
  error?: string;
}

export interface BufferingState {
  phase: BufferingPhase;
  /** Contextual hint about what the assistant is doing (e.g. "Thinking about your question...") */
  contextHint: string | null;
  /** Timestamp when current phase started */
  phaseStartedAt: number;
  /** Active pending tasks (image gen, code gen, web search, etc.) */
  pendingTasks: PendingTask[];
  /** Last user query for context-aware buffering visuals */
  lastUserQuery: string | null;
  /** Whether audio output is currently buffering */
  audioBuffering: boolean;
  /** Time-to-first-byte for audio (ms) - for latency tracking */
  audioTTFB: number | null;
}

// =============================================================================
// ASSISTANT SETTINGS & CONFIGURATION
// =============================================================================

export type AssistantLocation =
  | "crt"
  | "led"
  | "migrating-to-led"
  | "migrating-to-crt";

export type ScreenType = "crt" | "modern" | "hologram" | "minimal" | "terminal";
export type AssistantVisual = "binary" | "avatar" | "waveform" | "orb" | "none";
export type VoiceBackendType = "elevenlabs" | "hume";

export interface VoiceConfig {
  backend: VoiceBackendType;
  voiceId?: string;
  voiceName?: string;
  agentId?: string; // For ElevenLabs
  configId?: string; // For Hume
}

export interface PersonalityConfig {
  name: string;
  systemPrompt: string;
  greeting?: string;
  personality:
    | "professional"
    | "friendly"
    | "creative"
    | "technical"
    | "custom";
  traits?: string[];
}

export type CodeGenModel =
  | "groq-llama-3.3-70b"
  | "groq-llama-3.1-8b"
  | "gemini-2.0-flash";

export type AspectRatioMode = "none" | "16:9" | "4:3";

export interface AssistantConfig {
  id: string;
  name: string;
  description?: string;

  // Appearance
  screenType: ScreenType;
  phosphorColor: PhosphorColor;
  assistantVisual: AssistantVisual;

  // Display aspect ratio ('none' = fill available space, '16:9' = widescreen, '4:3' = classic CRT)
  aspectRatio: AspectRatioMode;

  // Voice
  voice: VoiceConfig;

  // Personality
  personality: PersonalityConfig;

  // Tools disabled (blocklist — empty means all tools enabled)
  disabledTools: string[];

  // Code generation model (fast+cheap model for real-time visualization)
  codeGenModel: CodeGenModel;

  // Metadata
  createdAt: number;
  updatedAt: number;
  isDefault?: boolean;
}

export interface AssistantSettingsState {
  // UI state
  settingsPanelVisible: boolean;
  activeTab:
    | "appearance"
    | "voice"
    | "personality"
    | "tools"
    | "embed"
    | "rpg"
    | "visuals";

  // Current configuration
  currentConfig: AssistantConfig;

  // Saved assistants
  savedAssistants: AssistantConfig[];

  // Embed settings
  embedWidth: number;
  embedHeight: number;
  embedTheme: "dark" | "light" | "auto";
}

// =============================================================================
// STORE STATE
// =============================================================================

interface Voice31State {
  // Connection state
  isConnected: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  isThinking: boolean;

  // Transcript
  userTranscript: string;
  assistantText: string;

  // Display configuration
  phosphorColor: PhosphorColor;

  // Content display (from tool calls)
  displayContent: DisplayContent;

  // Active effects
  activeEffect: ActiveEffect | null;

  // 3D Wireframe state
  wireframeState: WireframeState;

  // Visualizer data (audio levels)
  visualizerData: number[];

  // Audio FX settings
  audioFX: AudioFXSettings;

  // FM spectrum data for visualization
  fmSpectrumData: number[];

  // Audio FX panel visibility
  audioFXVisible: boolean;

  // Browser/Reader state
  browserState: BrowserState;

  // Progressive diagram state
  diagramState: DiagramState;

  // Intelligent display system
  intelligentDisplay: IntelligentDisplayState;
  codeDisplayState: CodeDisplayState;

  // Persistent image layer - survives text content changes
  persistentImage: PersistentImageLayer | null;

  // Overlay text - shown on top of active visual content (image, diagram, etc.)
  overlayText: string | null;

  // Memory & Notes system
  memoryState: MemoryState;

  // Assistant Settings & Configuration
  assistantSettings: AssistantSettingsState;

  // Visual Storytelling
  activeStoryQuestion: string | null;

  // Turn management for RPG mode
  turnState:
    | "idle"
    | "npc_speaking"
    | "assistant_speaking"
    | "user_speaking"
    | "processing";
  currentSpeakerName: string | null;
  npcAudioPlaying: boolean;

  // Assistant CRT-to-LED migration
  assistantLocation: AssistantLocation;
  migrationPhrase: string | null;

  // Progressive rendering & buffering
  bufferingState: BufferingState;

  // Voice mode (voice31 vs classic)
  voiceMode: "voice31" | "classic";

  // Visual Intelligence
  visualIntelligence: VisualIntelligenceState;

  // Artifact system
  artifacts: Artifact[];
  artifactFilter: ArtifactType | "all";
  artifactSearch: string;

  // Weather display
  weatherDisplay: WeatherDisplayState;

  // Browser automation (Stagehand/Browserbase)
  browserAutomation: BrowserAutomationState;

  // Action library — contextual activity for BinaryAssistant animations
  assistantActivity: AssistantActivity;
}

interface Voice31Actions {
  // Connection
  setConnected: (connected: boolean) => void;
  setListening: (listening: boolean) => void;
  setSpeaking: (speaking: boolean) => void;
  setThinking: (thinking: boolean) => void;

  // Transcript
  setUserTranscript: (text: string) => void;
  setAssistantText: (text: string) => void;

  // Display
  setPhosphorColor: (color: PhosphorColor) => void;

  // Content (tool call handlers)
  showText: (text: string) => void;
  showList: (items: string[], title?: string) => void;
  showGenerating: (prompt: string) => void;
  showImage: (url: string, prompt?: string, persist?: boolean) => void;
  showVisualization: (type: VisualizationType, title?: string) => void;
  clearContent: () => void;

  // Persistent image layer
  setPersistentImage: (
    url: string,
    prompt?: string,
    position?: PersistentImageLayer["position"],
  ) => void;
  clearPersistentImage: () => void;

  // Overlay text
  setOverlayText: (text: string | null) => void;

  // Effects
  triggerEffect: (
    type: EffectType,
    intensity?: number,
    duration?: number,
  ) => void;
  clearEffect: () => void;

  // Wireframe 3D
  showWireframe: (
    semanticType: WireframeSemanticType,
    labels?: string[],
    duration?: number,
  ) => void;
  clearWireframe: () => void;

  // Visualizer
  setVisualizerData: (data: number[]) => void;

  // Audio FX
  setAudioFX: (fx: Partial<AudioFXSettings>) => void;
  setFMSpectrumData: (data: number[]) => void;
  toggleAudioFXVisible: () => void;
  setAudioFXVisible: (visible: boolean) => void;

  // Browser/Reader
  setBrowserLoading: (loading: boolean) => void;
  showSearchResults: (query: string, results: SearchResult[]) => void;
  showReaderContent: (content: ReaderContent) => void;
  clearBrowser: () => void;
  setBrowserError: (error: string | null) => void;

  // Progressive Diagram
  showProgressiveDiagram: (
    title: string,
    nodes: DiagramNode[],
    style?: DiagramStyle,
    autoAdvance?: boolean,
  ) => void;
  advanceDiagram: (highlightNode?: string) => void;
  highlightDiagramNode: (nodeId: string | null) => void;
  clearDiagram: () => void;

  // Intelligent Display System
  setDisplayMode: (mode: DisplayMode) => void;
  setAssistantPosition: (
    position: IntelligentDisplayState["assistantPosition"],
  ) => void;
  showCodeDisplay: (
    code: string,
    language: CodeDisplayState["language"],
    prompt?: string,
  ) => void;
  setCodeDisplayLoading: (loading: boolean) => void;
  setCodeDisplayError: (error: string | null) => void;
  setCodeDisplayFullscreen: (fullscreen: boolean) => void;
  startCodeStreaming: (prompt?: string) => void;
  appendCodeChunk: (chunk: string) => void;
  finalizeCodeStream: () => void;
  clearCodeDisplay: () => void;
  transitionToLayout: (
    mode: DisplayMode,
    assistantPosition: IntelligentDisplayState["assistantPosition"],
  ) => void;

  // Memory & Notes
  addMemory: (content: string, category: MemoryEntry["category"]) => string;
  updateMemory: (id: string, content: string) => void;
  deleteMemory: (id: string) => void;
  createNote: (title: string, content?: string) => string;
  updateNote: (
    id: string,
    updates: Partial<Omit<NoteDocument, "id" | "createdAt">>,
  ) => void;
  deleteNote: (id: string) => void;
  setActiveNote: (id: string | null) => void;
  toggleEditor: () => void;
  setEditorVisible: (visible: boolean) => void;
  startStreaming: (noteId: string) => void;
  appendStreamContent: (content: string) => void;
  finishStreaming: () => void;
  clearMemoryState: () => void;
  hydrateNotesFromDB: () => void;

  // Assistant Settings
  toggleSettingsPanel: () => void;
  setSettingsPanelVisible: (visible: boolean) => void;
  setSettingsTab: (tab: AssistantSettingsState["activeTab"]) => void;
  updateAssistantConfig: (updates: Partial<AssistantConfig>) => void;
  updateVoiceConfig: (updates: Partial<VoiceConfig>) => void;
  updatePersonalityConfig: (updates: Partial<PersonalityConfig>) => void;
  saveCurrentAssistant: () => void;
  loadAssistant: (id: string) => void;
  deleteAssistant: (id: string) => void;
  setEmbedSettings: (
    settings: Partial<
      Pick<AssistantSettingsState, "embedWidth" | "embedHeight" | "embedTheme">
    >,
  ) => void;
  generateEmbedCode: () => string;

  // Visual Storytelling
  startVisualStory: (question: string) => void;
  clearVisualStory: () => void;

  // Turn management
  setTurnState: (
    state: Voice31State["turnState"],
    speakerName?: string | null,
  ) => void;
  setNpcAudioPlaying: (playing: boolean) => void;

  // Assistant migration
  setAssistantLocation: (location: AssistantLocation) => void;
  setMigrationPhrase: (phrase: string | null) => void;
  startMigration: (direction: "to-led" | "to-crt") => void;

  // Progressive rendering & buffering
  setBufferingPhase: (
    phase: BufferingPhase,
    contextHint?: string | null,
  ) => void;
  setAudioBuffering: (buffering: boolean) => void;
  setAudioTTFB: (ttfb: number | null) => void;
  setLastUserQuery: (query: string | null) => void;
  addPendingTask: (
    task: Omit<
      PendingTask,
      "id" | "startedAt" | "retryCount" | "progress" | "status"
    >,
  ) => string;
  updatePendingTask: (id: string, updates: Partial<PendingTask>) => void;
  removePendingTask: (id: string) => void;
  clearPendingTasks: () => void;

  // Voice mode
  setVoiceMode: (mode: "voice31" | "classic") => void;

  // Visual Intelligence
  setDisplayLevel: (level: VisualDisplayLevel) => void;
  setBackgroundSource: (source: BackgroundSource) => void;
  setAmbientBackground: (
    url: string,
    transitionType?: AmbientTransitionType,
  ) => void;
  clearAmbientBackground: () => void;
  setTransitioning: (transitioning: boolean) => void;
  updateTopicSignature: (signature: string | null) => void;
  incrementFluxGeneration: () => void;
  incrementUnsplashRequest: () => void;
  updateVisualIntelligenceSettings: (
    updates: Partial<
      Pick<
        VisualIntelligenceState,
        "backgroundOpacity" | "transitionInterval" | "topicDetectionEnabled"
      >
    >,
  ) => void;

  // Artifacts
  saveArtifact: (
    artifact: Omit<Artifact, "id" | "createdAt" | "updatedAt">,
  ) => string;
  deleteArtifact: (id: string) => void;
  pinArtifact: (id: string) => void;
  setArtifactFilter: (filter: ArtifactType | "all") => void;
  setArtifactSearch: (search: string) => void;

  // Weather
  setWeatherLoading: (loading: boolean) => void;
  setWeatherData: (data: WeatherData) => void;
  setWeatherError: (error: string | null) => void;
  clearWeather: () => void;

  // Browser automation
  startBrowserAutomation: (instruction: string, url?: string) => void;
  appendBrowserAction: (action: BrowserAutomationAction) => void;
  setBrowserAutomationStatus: (
    status: BrowserAutomationState["status"],
  ) => void;
  setBrowserAutomationSession: (
    sessionId: string,
    debuggerUrl?: string,
  ) => void;
  setBrowserExtractedData: (data: any) => void;
  clearBrowserAutomation: () => void;

  // Action library
  setAssistantActivity: (activity: AssistantActivity) => void;

  // Reset
  reset: () => void;
}

export type Voice31Store = Voice31State & Voice31Actions;

// =============================================================================
// DEFAULT STATE
// =============================================================================

const DEFAULT_AUDIO_FX: AudioFXSettings = {
  pitch: 0,
  bitcrush: 0,
  reverb: 0.2,
  filter: 0.8,
};

const DEFAULT_WIREFRAME_STATE: WireframeState = {
  active: false,
  semanticType: null,
  labels: undefined,
  duration: 0,
  startTime: 0,
};

const DEFAULT_BROWSER_STATE: BrowserState = {
  mode: "off",
  readerContent: null,
  searchResults: [],
  searchQuery: "",
  isLoading: false,
  error: null,
};

const DEFAULT_DIAGRAM_STATE: DiagramState = {
  active: false,
  title: "",
  style: "flowchart",
  nodes: [],
  revealedLevel: -1,
  highlightedNode: null,
  autoAdvance: false,
};

const DEFAULT_INTELLIGENT_DISPLAY: IntelligentDisplayState = {
  mode: "normal",
  assistantPosition: "center",
  contentScale: 1,
  transitionActive: false,
  autoLayoutEnabled: true,
};

const DEFAULT_CODE_DISPLAY: CodeDisplayState = {
  active: false,
  code: "",
  language: "tsx",
  componentHtml: undefined,
  isLoading: false,
  isStreaming: false,
  streamingCode: "",
  error: null,
  prompt: undefined,
  fullscreen: false,
  aspectRatio: undefined,
};

const DEFAULT_MEMORY_STATE: MemoryState = {
  memories: [],
  notes: [],
  activeNoteId: null,
  editorVisible: false,
  isStreaming: false,
  streamingContent: "",
};

const DEFAULT_ASSISTANT_CONFIG: AssistantConfig = {
  id: "default",
  name: "Voice31 Assistant",
  description: "Default voice assistant configuration",
  screenType: "crt",
  phosphorColor: "amber",
  assistantVisual: "binary",
  aspectRatio: "16:9",
  voice: {
    backend: "elevenlabs",
    voiceName: "Default Voice",
  },
  personality: {
    name: "Assistant",
    systemPrompt:
      "You are a helpful voice assistant with access to visual tools.",
    greeting: "Hello! How can I help you today?",
    personality: "friendly",
    traits: ["helpful", "clear", "engaging"],
  },
  disabledTools: [],
  codeGenModel: "groq-llama-3.3-70b",
  createdAt: Date.now(),
  updatedAt: Date.now(),
  isDefault: true,
};

const DEFAULT_ASSISTANT_SETTINGS: AssistantSettingsState = {
  settingsPanelVisible: false,
  activeTab: "appearance",
  currentConfig: DEFAULT_ASSISTANT_CONFIG,
  savedAssistants: [DEFAULT_ASSISTANT_CONFIG],
  embedWidth: 800,
  embedHeight: 600,
  embedTheme: "dark",
};

const DEFAULT_VISUAL_INTELLIGENCE: VisualIntelligenceState = {
  displayLevel: "minimal",
  backgroundSource: "auto",
  backgroundOpacity: 0.35,
  transitionInterval: 30,
  topicDetectionEnabled: true,
  currentBackgroundUrl: null,
  incomingBackgroundUrl: null,
  transitionType: "dissolve",
  isTransitioning: false,
  topicSignature: null,
  lastBackgroundChangeTime: 0,
  fluxGenerationsUsed: 0,
  unsplashRequestsUsed: 0,
  sessionStartTime: Date.now(),
};

const DEFAULT_WEATHER_DISPLAY: WeatherDisplayState = {
  active: false,
  data: null,
  isLoading: false,
  error: null,
};

const DEFAULT_BROWSER_AUTOMATION: BrowserAutomationState = {
  active: false,
  sessionId: null,
  debuggerUrl: null,
  actionFeed: [],
  extractedData: null,
  status: "idle",
};

const DEFAULT_BUFFERING_STATE: BufferingState = {
  phase: "idle",
  contextHint: null,
  phaseStartedAt: 0,
  pendingTasks: [],
  lastUserQuery: null,
  audioBuffering: false,
  audioTTFB: null,
};

const DEFAULT_STATE: Voice31State = {
  isConnected: false,
  isListening: false,
  isSpeaking: false,
  isThinking: false,
  userTranscript: "",
  assistantText: "VOICE31",
  phosphorColor: "amber",
  displayContent: { type: null },
  activeEffect: null,
  wireframeState: DEFAULT_WIREFRAME_STATE,
  visualizerData: Array(16).fill(0.1),
  audioFX: DEFAULT_AUDIO_FX,
  fmSpectrumData: Array(32).fill(0),
  audioFXVisible: false,
  browserState: DEFAULT_BROWSER_STATE,
  diagramState: DEFAULT_DIAGRAM_STATE,
  intelligentDisplay: DEFAULT_INTELLIGENT_DISPLAY,
  codeDisplayState: DEFAULT_CODE_DISPLAY,
  persistentImage: null,
  overlayText: null,
  memoryState: DEFAULT_MEMORY_STATE,
  assistantSettings: DEFAULT_ASSISTANT_SETTINGS,
  activeStoryQuestion: null,
  turnState: "idle",
  currentSpeakerName: null,
  npcAudioPlaying: false,
  assistantLocation: "crt",
  migrationPhrase: null,
  bufferingState: DEFAULT_BUFFERING_STATE,
  voiceMode: "voice31",
  visualIntelligence: DEFAULT_VISUAL_INTELLIGENCE,
  artifacts: [],
  artifactFilter: "all",
  artifactSearch: "",
  weatherDisplay: DEFAULT_WEATHER_DISPLAY,
  browserAutomation: DEFAULT_BROWSER_AUTOMATION,
  assistantActivity: "idle" as AssistantActivity,
};

// =============================================================================
// STORE
// =============================================================================

export const useVoice31Store = create<Voice31Store>((set, get) => ({
  ...DEFAULT_STATE,

  // Connection
  setConnected: (connected) => set({ isConnected: connected }),
  setListening: (listening) => set({ isListening: listening }),
  setSpeaking: (speaking) => set({ isSpeaking: speaking }),
  setThinking: (thinking) => set({ isThinking: thinking }),

  // Transcript
  setUserTranscript: (text) => set({ userTranscript: text }),
  setAssistantText: (text) => set({ assistantText: text }),

  // Display
  setPhosphorColor: (color) => set({ phosphorColor: color }),

  // Content handlers
  // IMPORTANT: showText does NOT clear diagrams, lists, images, or browser content
  // Voice text is a semantic personality display that coexists with rich content
  // Only explicit agent tool calls (showList, showImage, etc.) replace other content
  // If visual content (image, visualization, diagram) is active, text goes to overlayText instead
  showText: (text) =>
    set((state) => {
      const activeType = state.displayContent.type;
      const hasVisualContent =
        activeType === "image" ||
        activeType === "visualization" ||
        activeType === "generating";
      const hasDiagram = state.diagramState.active;
      const hasBrowser =
        state.browserState.mode === "reader" ||
        state.browserState.mode === "results";
      const hasCode = state.codeDisplayState.active;

      // If rich visual content is active, use overlay instead of replacing it
      if (hasVisualContent || hasDiagram || hasBrowser || hasCode) {
        return {
          overlayText: text,
          assistantText: text.slice(0, 20).toUpperCase() || "TEXT",
        };
      }

      return {
        displayContent: { type: "text", text },
        overlayText: null,
        assistantText: text.slice(0, 20).toUpperCase() || "TEXT",
      };
    }),

  showList: (items, title) =>
    set({
      displayContent: { type: "list", list: items, listTitle: title },
      assistantText: title?.toUpperCase() || "LIST",
      // Lists replace diagrams and browser but not images
      diagramState: DEFAULT_DIAGRAM_STATE,
      browserState: DEFAULT_BROWSER_STATE,
    }),

  showGenerating: (prompt) =>
    set({
      displayContent: { type: "generating", imagePrompt: prompt },
      assistantText: "GENERATING",
      // Generation replaces other content
      diagramState: DEFAULT_DIAGRAM_STATE,
      browserState: DEFAULT_BROWSER_STATE,
    }),

  showImage: (url, prompt, persist = true) =>
    set((state) => ({
      displayContent: { type: "image", imageUrl: url, imagePrompt: prompt },
      assistantText: "IMAGE",
      // Images replace diagrams and browser
      diagramState: DEFAULT_DIAGRAM_STATE,
      browserState: DEFAULT_BROWSER_STATE,
      // Persist the image so it survives text content changes
      persistentImage: persist
        ? {
            url,
            prompt,
            position: "background" as const,
            opacity: 1,
            timestamp: Date.now(),
          }
        : state.persistentImage,
    })),

  showVisualization: (visualizationType, title) =>
    set({
      displayContent: {
        type: "visualization",
        visualizationType,
        visualizationTitle: title,
      },
      assistantText:
        title?.toUpperCase() ||
        visualizationType?.toUpperCase().replace("_", " ") ||
        "VISUAL",
      // Visualizations replace diagrams and browser
      diagramState: DEFAULT_DIAGRAM_STATE,
      browserState: DEFAULT_BROWSER_STATE,
    }),

  // clearContent clears ALL content - use this when agent explicitly wants to clear
  clearContent: () =>
    set({
      displayContent: { type: null },
      codeDisplayState: DEFAULT_CODE_DISPLAY,
      diagramState: DEFAULT_DIAGRAM_STATE,
      browserState: DEFAULT_BROWSER_STATE,
      persistentImage: null,
      overlayText: null,
    }),

  // Persistent image layer
  setPersistentImage: (url, prompt, position = "background") =>
    set({
      persistentImage: {
        url,
        prompt,
        position,
        opacity: 1,
        timestamp: Date.now(),
      },
    }),

  clearPersistentImage: () => set({ persistentImage: null }),

  // Overlay text
  setOverlayText: (text) => set({ overlayText: text }),

  // Effects
  triggerEffect: (type, intensity = 0.5, duration = 5000) =>
    set({
      activeEffect: {
        type,
        intensity,
        startTime: Date.now(),
        duration,
      },
    }),

  clearEffect: () => set({ activeEffect: null }),

  // Wireframe 3D
  showWireframe: (semanticType, labels, duration = 10000) =>
    set({
      wireframeState: {
        active: true,
        semanticType,
        labels,
        duration,
        startTime: Date.now(),
      },
    }),

  clearWireframe: () => set({ wireframeState: DEFAULT_WIREFRAME_STATE }),

  // Visualizer
  setVisualizerData: (data) => set({ visualizerData: data }),

  // Audio FX
  setAudioFX: (fx) =>
    set((state) => ({
      audioFX: { ...state.audioFX, ...fx },
    })),
  setFMSpectrumData: (data) => set({ fmSpectrumData: data }),
  toggleAudioFXVisible: () =>
    set((state) => ({ audioFXVisible: !state.audioFXVisible })),
  setAudioFXVisible: (visible) => set({ audioFXVisible: visible }),

  // Browser/Reader
  setBrowserLoading: (loading) =>
    set((state) => ({
      browserState: {
        ...state.browserState,
        isLoading: loading,
        mode: loading ? "loading" : state.browserState.mode,
      },
    })),

  showSearchResults: (query, results) => {
    console.log("[Voice31Store] showSearchResults called:", {
      query,
      resultCount: results.length,
      results,
    });
    return set((state) => ({
      browserState: {
        ...state.browserState,
        mode: "results",
        searchQuery: query,
        searchResults: results,
        isLoading: false,
        error: null,
      },
      displayContent: { type: null },
      diagramState: DEFAULT_DIAGRAM_STATE,
      assistantText: "SEARCH",
    }));
  },

  showReaderContent: (content) => {
    console.log("[Voice31Store] showReaderContent called:", {
      title: content.title,
      url: content.url,
    });
    return set((state) => ({
      browserState: {
        ...state.browserState,
        mode: "reader",
        readerContent: content,
        isLoading: false,
        error: null,
      },
      displayContent: { type: null },
      diagramState: DEFAULT_DIAGRAM_STATE,
      assistantText: "READING",
    }));
  },

  clearBrowser: () => set({ browserState: DEFAULT_BROWSER_STATE }),

  setBrowserError: (error) =>
    set((state) => ({
      browserState: {
        ...state.browserState,
        error,
        isLoading: false,
      },
    })),

  // Progressive Diagram
  showProgressiveDiagram: (
    title,
    nodes,
    style = "flowchart",
    autoAdvance = false,
  ) =>
    set({
      diagramState: {
        active: true,
        title,
        style,
        nodes,
        revealedLevel: 0, // Start with level 0 revealed
        highlightedNode: null,
        autoAdvance,
      },
      displayContent: { type: null },
      browserState: DEFAULT_BROWSER_STATE,
      assistantText: "DIAGRAM",
    }),

  advanceDiagram: (highlightNode) =>
    set((state) => {
      if (!state.diagramState.active || state.diagramState.nodes.length === 0)
        return state;
      const maxLevel = Math.max(
        ...state.diagramState.nodes.map((n) => n.level),
        0,
      );
      const nextLevel = Math.min(
        state.diagramState.revealedLevel + 1,
        maxLevel,
      );
      return {
        diagramState: {
          ...state.diagramState,
          revealedLevel: nextLevel,
          highlightedNode: highlightNode || null,
        },
      };
    }),

  highlightDiagramNode: (nodeId) =>
    set((state) => ({
      diagramState: {
        ...state.diagramState,
        highlightedNode: nodeId,
      },
    })),

  clearDiagram: () => set({ diagramState: DEFAULT_DIAGRAM_STATE }),

  // Intelligent Display System
  setDisplayMode: (mode) =>
    set((state) => ({
      intelligentDisplay: { ...state.intelligentDisplay, mode },
    })),

  setAssistantPosition: (position) =>
    set((state) => ({
      intelligentDisplay: {
        ...state.intelligentDisplay,
        assistantPosition: position,
      },
    })),

  showCodeDisplay: (code, language, prompt) =>
    set((state) => ({
      codeDisplayState: {
        ...state.codeDisplayState,
        active: true,
        code,
        language,
        prompt,
        isLoading: false,
        error: null,
      },
      displayContent: { type: null },
      diagramState: DEFAULT_DIAGRAM_STATE,
      browserState: DEFAULT_BROWSER_STATE,
      assistantText: "CODE",
    })),

  setCodeDisplayLoading: (loading) =>
    set((state) => ({
      codeDisplayState: {
        ...state.codeDisplayState,
        isLoading: loading,
      },
    })),

  setCodeDisplayError: (error) =>
    set((state) => ({
      codeDisplayState: {
        ...state.codeDisplayState,
        error,
        isLoading: false,
      },
    })),

  setCodeDisplayFullscreen: (fullscreen) =>
    set((state) => ({
      codeDisplayState: {
        ...state.codeDisplayState,
        fullscreen,
      },
    })),

  startCodeStreaming: (prompt) =>
    set((state) => ({
      codeDisplayState: {
        ...state.codeDisplayState,
        active: true,
        isStreaming: true,
        streamingCode: "",
        code: "",
        isLoading: false,
        error: null,
        prompt: prompt || state.codeDisplayState.prompt,
      },
      displayContent: { type: null },
      diagramState: DEFAULT_DIAGRAM_STATE,
      browserState: DEFAULT_BROWSER_STATE,
      assistantText: "COMPOSING",
    })),

  appendCodeChunk: (chunk) =>
    set((state) => ({
      codeDisplayState: {
        ...state.codeDisplayState,
        streamingCode: state.codeDisplayState.streamingCode + chunk,
      },
    })),

  finalizeCodeStream: () =>
    set((state) => {
      let code = state.codeDisplayState.streamingCode;
      // Strip markdown fences if present
      const codeBlockMatch = code.match(
        /```(?:tsx?|jsx?|typescript|javascript)?\n([\s\S]*?)```/,
      );
      if (codeBlockMatch) {
        code = codeBlockMatch[1];
      }
      // Strip import statements (sandbox provides React globals)
      code = code.replace(/^import\s+.*?;\s*$/gm, "").trim();
      return {
        codeDisplayState: {
          ...state.codeDisplayState,
          isStreaming: false,
          streamingCode: "",
          code,
        },
        assistantText: "CODE",
      };
    }),

  clearCodeDisplay: () =>
    set({
      codeDisplayState: DEFAULT_CODE_DISPLAY,
    }),

  transitionToLayout: (mode, assistantPosition) =>
    set((state) => ({
      intelligentDisplay: {
        ...state.intelligentDisplay,
        mode,
        assistantPosition,
        transitionActive: true,
      },
    })),

  // Memory & Notes
  addMemory: (content, category) => {
    const id = `mem_${Date.now()}`;
    const now = Date.now();
    set((state) => ({
      memoryState: {
        ...state.memoryState,
        memories: [
          ...state.memoryState.memories,
          { id, content, category, createdAt: now, updatedAt: now },
        ],
      },
    }));
    // Persist to localStorage
    const state = useVoice31Store.getState();
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "voice31_memories",
        JSON.stringify(state.memoryState.memories),
      );
    }
    return id;
  },

  updateMemory: (id, content) =>
    set((state) => ({
      memoryState: {
        ...state.memoryState,
        memories: state.memoryState.memories.map((m) =>
          m.id === id ? { ...m, content, updatedAt: Date.now() } : m,
        ),
      },
    })),

  deleteMemory: (id) =>
    set((state) => ({
      memoryState: {
        ...state.memoryState,
        memories: state.memoryState.memories.filter((m) => m.id !== id),
      },
    })),

  createNote: (title, content = "") => {
    const tempId = `note_${Date.now()}`;
    const now = Date.now();
    set((state) => ({
      memoryState: {
        ...state.memoryState,
        notes: [
          ...state.memoryState.notes,
          { id: tempId, title, content, createdAt: now, updatedAt: now },
        ],
        activeNoteId: tempId,
        editorVisible: true,
      },
    }));
    // Persist to DB
    if (typeof window !== "undefined") {
      fetch("/api/voice31/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.note?.id) {
            // Replace temp ID with real DB ID
            set((state) => ({
              memoryState: {
                ...state.memoryState,
                notes: state.memoryState.notes.map((n) =>
                  n.id === tempId ? { ...n, id: data.note.id } : n,
                ),
                activeNoteId:
                  state.memoryState.activeNoteId === tempId
                    ? data.note.id
                    : state.memoryState.activeNoteId,
              },
            }));
          }
        })
        .catch((e) =>
          console.warn("[Voice31Store] Failed to persist note:", e),
        );
    }
    return tempId;
  },

  updateNote: (id, updates) => {
    set((state) => ({
      memoryState: {
        ...state.memoryState,
        notes: state.memoryState.notes.map((n) =>
          n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n,
        ),
      },
    }));
    // Debounced persist to DB (avoid excessive API calls while typing)
    if (typeof window !== "undefined" && !id.startsWith("note_")) {
      clearTimeout((window as any).__v31_noteTimer);
      (window as any).__v31_noteTimer = setTimeout(() => {
        fetch(`/api/voice31/notes/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        }).catch((e) =>
          console.warn("[Voice31Store] Failed to update note:", e),
        );
      }, 800);
    }
  },

  deleteNote: (id) => {
    set((state) => ({
      memoryState: {
        ...state.memoryState,
        notes: state.memoryState.notes.filter((n) => n.id !== id),
        activeNoteId:
          state.memoryState.activeNoteId === id
            ? null
            : state.memoryState.activeNoteId,
      },
    }));
    // Persist to DB
    if (typeof window !== "undefined" && !id.startsWith("note_")) {
      fetch(`/api/voice31/notes/${id}`, { method: "DELETE" }).catch((e) =>
        console.warn("[Voice31Store] Failed to delete note:", e),
      );
    }
  },

  setActiveNote: (id) =>
    set((state) => ({
      memoryState: { ...state.memoryState, activeNoteId: id },
    })),

  toggleEditor: () =>
    set((state) => ({
      memoryState: {
        ...state.memoryState,
        editorVisible: !state.memoryState.editorVisible,
      },
    })),

  setEditorVisible: (visible) =>
    set((state) => ({
      memoryState: { ...state.memoryState, editorVisible: visible },
    })),

  startStreaming: (noteId) =>
    set((state) => ({
      memoryState: {
        ...state.memoryState,
        isStreaming: true,
        streamingContent: "",
        activeNoteId: noteId,
        editorVisible: true,
      },
    })),

  appendStreamContent: (content) =>
    set((state) => {
      const newContent = state.memoryState.streamingContent + content;
      // Also update the active note's content
      const activeNoteId = state.memoryState.activeNoteId;
      return {
        memoryState: {
          ...state.memoryState,
          streamingContent: newContent,
          notes: activeNoteId
            ? state.memoryState.notes.map((n) =>
                n.id === activeNoteId
                  ? { ...n, content: newContent, updatedAt: Date.now() }
                  : n,
              )
            : state.memoryState.notes,
        },
      };
    }),

  finishStreaming: () => {
    const state = useVoice31Store.getState();
    const activeId = state.memoryState.activeNoteId;
    const activeNote = activeId
      ? state.memoryState.notes.find((n) => n.id === activeId)
      : null;
    set((s) => ({
      memoryState: { ...s.memoryState, isStreaming: false },
    }));
    // Persist final streamed content to DB
    if (
      activeNote &&
      typeof window !== "undefined" &&
      !activeNote.id.startsWith("note_")
    ) {
      fetch(`/api/voice31/notes/${activeNote.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: activeNote.content }),
      }).catch((e) =>
        console.warn("[Voice31Store] Failed to persist streamed note:", e),
      );
    }
  },

  clearMemoryState: () => set({ memoryState: DEFAULT_MEMORY_STATE }),

  hydrateNotesFromDB: () => {
    fetch("/api/voice31/notes")
      .then((r) => {
        if (r.status === 401) {
          // Auth not ready — retry once after 2s
          setTimeout(() => {
            fetch("/api/voice31/notes")
              .then((r2) => (r2.ok ? r2.json() : null))
              .then((data) => {
                if (data?.notes?.length > 0) {
                  const notes = data.notes.map((n: any) => ({
                    id: n.id,
                    title: n.title,
                    content: n.content,
                    tags: n.tags ? JSON.parse(n.tags) : undefined,
                    createdAt: new Date(n.created_at).getTime(),
                    updatedAt: new Date(n.updated_at).getTime(),
                  }));
                  useVoice31Store.setState((state) => ({
                    memoryState: { ...state.memoryState, notes },
                  }));
                  console.log(
                    `[Voice31Store] Loaded ${notes.length} notes from DB (retry)`,
                  );
                }
              })
              .catch(() => {});
          }, 2000);
          return null;
        }
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (data?.notes?.length > 0) {
          const notes = data.notes.map((n: any) => ({
            id: n.id,
            title: n.title,
            content: n.content,
            tags: n.tags ? JSON.parse(n.tags) : undefined,
            createdAt: new Date(n.created_at).getTime(),
            updatedAt: new Date(n.updated_at).getTime(),
          }));
          useVoice31Store.setState((state) => ({
            memoryState: { ...state.memoryState, notes },
          }));
          console.log(`[Voice31Store] Loaded ${notes.length} notes from DB`);
        }
      })
      .catch((e) => {
        console.warn("[Voice31Store] Failed to load notes:", e.message);
      });
  },

  // Assistant Settings
  toggleSettingsPanel: () =>
    set((state) => ({
      assistantSettings: {
        ...state.assistantSettings,
        settingsPanelVisible: !state.assistantSettings.settingsPanelVisible,
      },
    })),

  setSettingsPanelVisible: (visible) =>
    set((state) => ({
      assistantSettings: {
        ...state.assistantSettings,
        settingsPanelVisible: visible,
      },
    })),

  setSettingsTab: (tab) =>
    set((state) => ({
      assistantSettings: { ...state.assistantSettings, activeTab: tab },
    })),

  updateAssistantConfig: (updates) => {
    set((state) => {
      const newConfig = {
        ...state.assistantSettings.currentConfig,
        ...updates,
        updatedAt: Date.now(),
      };
      // Also update phosphorColor in main state if changed
      const newState: Partial<Voice31State> = {
        assistantSettings: {
          ...state.assistantSettings,
          currentConfig: newConfig,
        },
      };
      if (updates.phosphorColor) {
        newState.phosphorColor = updates.phosphorColor;
      }
      return newState;
    });
    // Persist to localStorage
    if (typeof window !== "undefined") {
      const state = useVoice31Store.getState();
      localStorage.setItem(
        "voice31_assistant_config",
        JSON.stringify(state.assistantSettings.currentConfig),
      );
    }
  },

  updateVoiceConfig: (updates) => {
    set((state) => ({
      assistantSettings: {
        ...state.assistantSettings,
        currentConfig: {
          ...state.assistantSettings.currentConfig,
          voice: { ...state.assistantSettings.currentConfig.voice, ...updates },
          updatedAt: Date.now(),
        },
      },
    }));
    // Persist to localStorage
    if (typeof window !== "undefined") {
      const state = useVoice31Store.getState();
      localStorage.setItem(
        "voice31_assistant_config",
        JSON.stringify(state.assistantSettings.currentConfig),
      );
    }
  },

  updatePersonalityConfig: (updates) => {
    set((state) => ({
      assistantSettings: {
        ...state.assistantSettings,
        currentConfig: {
          ...state.assistantSettings.currentConfig,
          personality: {
            ...state.assistantSettings.currentConfig.personality,
            ...updates,
          },
          updatedAt: Date.now(),
        },
      },
    }));
    // Persist to localStorage
    if (typeof window !== "undefined") {
      const state = useVoice31Store.getState();
      localStorage.setItem(
        "voice31_assistant_config",
        JSON.stringify(state.assistantSettings.currentConfig),
      );
    }
  },

  saveCurrentAssistant: () => {
    set((state) => {
      const config = state.assistantSettings.currentConfig;
      const existingIndex = state.assistantSettings.savedAssistants.findIndex(
        (a) => a.id === config.id,
      );
      const savedAssistants =
        existingIndex >= 0
          ? state.assistantSettings.savedAssistants.map((a, i) =>
              i === existingIndex ? config : a,
            )
          : [
              ...state.assistantSettings.savedAssistants,
              { ...config, id: `assistant_${Date.now()}` },
            ];
      return {
        assistantSettings: { ...state.assistantSettings, savedAssistants },
      };
    });
    // Persist to localStorage
    if (typeof window !== "undefined") {
      const state = useVoice31Store.getState();
      localStorage.setItem(
        "voice31_assistant_config",
        JSON.stringify(state.assistantSettings.currentConfig),
      );
      localStorage.setItem(
        "voice31_saved_assistants",
        JSON.stringify(state.assistantSettings.savedAssistants),
      );
      // Settings are applied per-session via ElevenLabs session overrides
      // (see Voice31ElevenLabsProvider.tsx startConversation).
      // No need to sync to agent baseline on every save — that's for one-time setup.
    }
  },

  loadAssistant: (id) => {
    set((state) => {
      const assistant = state.assistantSettings.savedAssistants.find(
        (a) => a.id === id,
      );
      if (!assistant) return {};
      return {
        assistantSettings: {
          ...state.assistantSettings,
          currentConfig: assistant,
        },
        phosphorColor: assistant.phosphorColor,
      };
    });
    // Persist loaded config
    if (typeof window !== "undefined") {
      const state = useVoice31Store.getState();
      localStorage.setItem(
        "voice31_assistant_config",
        JSON.stringify(state.assistantSettings.currentConfig),
      );
    }
  },

  deleteAssistant: (id) => {
    set((state) => ({
      assistantSettings: {
        ...state.assistantSettings,
        savedAssistants: state.assistantSettings.savedAssistants.filter(
          (a) => a.id !== id && !a.isDefault,
        ),
      },
    }));
    // Persist updated list
    if (typeof window !== "undefined") {
      const state = useVoice31Store.getState();
      localStorage.setItem(
        "voice31_saved_assistants",
        JSON.stringify(state.assistantSettings.savedAssistants),
      );
    }
  },

  setEmbedSettings: (settings) =>
    set((state) => ({
      assistantSettings: { ...state.assistantSettings, ...settings },
    })),

  generateEmbedCode: () => {
    const state = useVoice31Store.getState();
    const config = state.assistantSettings.currentConfig;
    const { embedWidth, embedHeight, embedTheme } = state.assistantSettings;

    // Generate embed code (this would typically point to an embed endpoint)
    const embedUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/embed/voice31?config=${encodeURIComponent(
      JSON.stringify({
        assistantId: config.id,
        screenType: config.screenType,
        phosphorColor: config.phosphorColor,
        theme: embedTheme,
      }),
    )}`;

    return `<iframe
  src="${embedUrl}"
  width="${embedWidth}"
  height="${embedHeight}"
  frameborder="0"
  allow="microphone"
  style="border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);"
></iframe>`;
  },

  // Visual Storytelling
  startVisualStory: (question) => set({ activeStoryQuestion: question }),
  clearVisualStory: () => {
    set({ activeStoryQuestion: null });
    // Also reset storytelling store to prevent stale buffering/playing state
    useStorytellingStore.getState().reset();
  },

  // Turn management
  setTurnState: (turnState, speakerName = null) =>
    set({ turnState, currentSpeakerName: speakerName }),
  setNpcAudioPlaying: (npcAudioPlaying) =>
    set({
      npcAudioPlaying,
      turnState: npcAudioPlaying ? "npc_speaking" : "idle",
      currentSpeakerName: npcAudioPlaying ? get().currentSpeakerName : null,
    }),

  // Assistant migration
  setAssistantLocation: (location) => set({ assistantLocation: location }),
  setMigrationPhrase: (phrase) => set({ migrationPhrase: phrase }),
  startMigration: (direction) => {
    const toLedPhrases = [
      "Heading to LED land~",
      "Time for the sub-screen...",
      "Teleporting below!",
      "See you on the flip side",
      "Going miniature mode",
      "Into the LED matrix...",
    ];
    const toCrtPhrases = [
      "Back to my CRT home!",
      "Ah, phosphors... I missed you",
      "Full size feels good",
      "CRT sweet CRT",
      "Portal hop complete",
      "Re-entering the big screen",
    ];
    const phrases = direction === "to-led" ? toLedPhrases : toCrtPhrases;
    const phrase = phrases[Math.floor(Math.random() * phrases.length)];
    set({
      assistantLocation:
        direction === "to-led" ? "migrating-to-led" : "migrating-to-crt",
      migrationPhrase: phrase,
    });
  },

  // Progressive rendering & buffering
  setBufferingPhase: (phase, contextHint = null) =>
    set((state) => ({
      bufferingState: {
        ...state.bufferingState,
        phase,
        contextHint: contextHint ?? state.bufferingState.contextHint,
        phaseStartedAt: Date.now(),
      },
    })),

  setAudioBuffering: (audioBuffering) =>
    set((state) => ({
      bufferingState: { ...state.bufferingState, audioBuffering },
    })),

  setAudioTTFB: (audioTTFB) =>
    set((state) => ({
      bufferingState: { ...state.bufferingState, audioTTFB },
    })),

  setLastUserQuery: (lastUserQuery) =>
    set((state) => ({
      bufferingState: { ...state.bufferingState, lastUserQuery },
    })),

  addPendingTask: (task) => {
    const id = `task_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    set((state) => ({
      bufferingState: {
        ...state.bufferingState,
        pendingTasks: [
          ...state.bufferingState.pendingTasks,
          {
            ...task,
            id,
            status: "queued" as PendingTaskStatus,
            progress: 0,
            startedAt: Date.now(),
            retryCount: 0,
          },
        ],
      },
    }));
    return id;
  },

  updatePendingTask: (id, updates) =>
    set((state) => ({
      bufferingState: {
        ...state.bufferingState,
        pendingTasks: state.bufferingState.pendingTasks.map((t) =>
          t.id === id ? { ...t, ...updates } : t,
        ),
      },
    })),

  removePendingTask: (id) =>
    set((state) => ({
      bufferingState: {
        ...state.bufferingState,
        pendingTasks: state.bufferingState.pendingTasks.filter(
          (t) => t.id !== id,
        ),
      },
    })),

  clearPendingTasks: () =>
    set((state) => ({
      bufferingState: { ...state.bufferingState, pendingTasks: [] },
    })),

  // Voice mode
  setVoiceMode: (mode) => {
    set({ voiceMode: mode });
    if (typeof window !== "undefined") {
      localStorage.setItem("voice31_voice_mode", mode);
    }
  },

  // Visual Intelligence
  setDisplayLevel: (level) => {
    set((state) => ({
      visualIntelligence: { ...state.visualIntelligence, displayLevel: level },
    }));
    if (typeof window !== "undefined") {
      const vi = useVoice31Store.getState().visualIntelligence;
      localStorage.setItem(
        "voice31_visual_intelligence",
        JSON.stringify({
          displayLevel: vi.displayLevel,
          backgroundSource: vi.backgroundSource,
          backgroundOpacity: vi.backgroundOpacity,
          transitionInterval: vi.transitionInterval,
          topicDetectionEnabled: vi.topicDetectionEnabled,
        }),
      );
    }
  },

  setBackgroundSource: (source) => {
    set((state) => ({
      visualIntelligence: {
        ...state.visualIntelligence,
        backgroundSource: source,
      },
    }));
    if (typeof window !== "undefined") {
      const vi = useVoice31Store.getState().visualIntelligence;
      localStorage.setItem(
        "voice31_visual_intelligence",
        JSON.stringify({
          displayLevel: vi.displayLevel,
          backgroundSource: vi.backgroundSource,
          backgroundOpacity: vi.backgroundOpacity,
          transitionInterval: vi.transitionInterval,
          topicDetectionEnabled: vi.topicDetectionEnabled,
        }),
      );
    }
  },

  setAmbientBackground: (url, transitionType = "dissolve") =>
    set((state) => ({
      visualIntelligence: {
        ...state.visualIntelligence,
        incomingBackgroundUrl: url,
        transitionType,
        isTransitioning: true,
        lastBackgroundChangeTime: Date.now(),
      },
    })),

  clearAmbientBackground: () =>
    set((state) => ({
      visualIntelligence: {
        ...state.visualIntelligence,
        currentBackgroundUrl: null,
        incomingBackgroundUrl: null,
        isTransitioning: false,
      },
    })),

  setTransitioning: (transitioning) =>
    set((state) => {
      if (!transitioning && state.visualIntelligence.incomingBackgroundUrl) {
        // Transition complete: promote incoming to current
        return {
          visualIntelligence: {
            ...state.visualIntelligence,
            currentBackgroundUrl:
              state.visualIntelligence.incomingBackgroundUrl,
            incomingBackgroundUrl: null,
            isTransitioning: false,
          },
        };
      }
      return {
        visualIntelligence: {
          ...state.visualIntelligence,
          isTransitioning: transitioning,
        },
      };
    }),

  updateTopicSignature: (signature) =>
    set((state) => ({
      visualIntelligence: {
        ...state.visualIntelligence,
        topicSignature: signature,
      },
    })),

  incrementFluxGeneration: () =>
    set((state) => ({
      visualIntelligence: {
        ...state.visualIntelligence,
        fluxGenerationsUsed: state.visualIntelligence.fluxGenerationsUsed + 1,
      },
    })),

  incrementUnsplashRequest: () =>
    set((state) => ({
      visualIntelligence: {
        ...state.visualIntelligence,
        unsplashRequestsUsed: state.visualIntelligence.unsplashRequestsUsed + 1,
      },
    })),

  updateVisualIntelligenceSettings: (updates) => {
    set((state) => ({
      visualIntelligence: { ...state.visualIntelligence, ...updates },
    }));
    if (typeof window !== "undefined") {
      const vi = useVoice31Store.getState().visualIntelligence;
      localStorage.setItem(
        "voice31_visual_intelligence",
        JSON.stringify({
          displayLevel: vi.displayLevel,
          backgroundSource: vi.backgroundSource,
          backgroundOpacity: vi.backgroundOpacity,
          transitionInterval: vi.transitionInterval,
          topicDetectionEnabled: vi.topicDetectionEnabled,
        }),
      );
    }
  },

  // Artifacts — persist to DB via /api/voice31/artifacts
  saveArtifact: (artifact) => {
    const tempId = `artifact_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const now = Date.now();
    const full: Artifact = {
      ...artifact,
      id: tempId,
      createdAt: now,
      updatedAt: now,
    };
    set((state) => ({ artifacts: [full, ...state.artifacts] }));

    // Fire-and-forget persist to DB, update ID when server responds
    fetch("/api/voice31/artifacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: artifact.type,
        title: artifact.title,
        preview: artifact.preview,
        content: artifact.content,
        tags: artifact.tags,
        source: artifact.source || "voice31",
        pinned: artifact.pinned,
      }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.id) {
          // Replace temp ID with server-assigned ID
          set((state) => ({
            artifacts: state.artifacts.map((a) =>
              a.id === tempId ? { ...a, id: data.id } : a,
            ),
          }));
        }
      })
      .catch((e) =>
        console.warn("[Voice31Store] Failed to persist artifact:", e.message),
      );

    return tempId;
  },
  deleteArtifact: (id) => {
    set((state) => ({
      artifacts: state.artifacts.filter((a) => a.id !== id),
    }));

    // Fire-and-forget delete from DB
    fetch(`/api/voice31/artifacts?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    }).catch((e) =>
      console.warn(
        "[Voice31Store] Failed to delete artifact from DB:",
        e.message,
      ),
    );
  },
  pinArtifact: (id) => {
    const current = get().artifacts.find((a) => a.id === id);
    const newPinned = current ? !current.pinned : true;

    set((state) => ({
      artifacts: state.artifacts.map((a) =>
        a.id === id ? { ...a, pinned: newPinned, updatedAt: Date.now() } : a,
      ),
    }));

    // Fire-and-forget update in DB
    fetch("/api/voice31/artifacts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, pinned: newPinned }),
    }).catch((e) =>
      console.warn(
        "[Voice31Store] Failed to update artifact pin in DB:",
        e.message,
      ),
    );
  },
  setArtifactFilter: (filter) => set({ artifactFilter: filter }),
  setArtifactSearch: (search) => set({ artifactSearch: search }),

  // Weather
  setWeatherLoading: (loading) =>
    set((state) => ({
      weatherDisplay: {
        ...state.weatherDisplay,
        isLoading: loading,
        active: true,
        error: null,
      },
    })),
  setWeatherData: (data) =>
    set({
      weatherDisplay: { active: true, data, isLoading: false, error: null },
    }),
  setWeatherError: (error) =>
    set((state) => ({
      weatherDisplay: { ...state.weatherDisplay, isLoading: false, error },
    })),
  clearWeather: () => set({ weatherDisplay: DEFAULT_WEATHER_DISPLAY }),

  // Browser automation
  startBrowserAutomation: (_instruction, _url) =>
    set({
      browserAutomation: {
        active: true,
        sessionId: null,
        debuggerUrl: null,
        actionFeed: [],
        extractedData: null,
        status: "connecting",
      },
    }),
  appendBrowserAction: (action) =>
    set((state) => ({
      browserAutomation: {
        ...state.browserAutomation,
        actionFeed: [...state.browserAutomation.actionFeed, action],
      },
    })),
  setBrowserAutomationStatus: (status) =>
    set((state) => ({
      browserAutomation: { ...state.browserAutomation, status },
    })),
  setBrowserAutomationSession: (sessionId, debuggerUrl) =>
    set((state) => ({
      browserAutomation: {
        ...state.browserAutomation,
        sessionId,
        debuggerUrl: debuggerUrl || null,
        status: "executing",
      },
    })),
  setBrowserExtractedData: (data) =>
    set((state) => ({
      browserAutomation: { ...state.browserAutomation, extractedData: data },
    })),
  clearBrowserAutomation: () =>
    set({ browserAutomation: DEFAULT_BROWSER_AUTOMATION }),

  // Action library
  setAssistantActivity: (activity) => set({ assistantActivity: activity }),

  // Reset
  reset: () => set(DEFAULT_STATE),
}));

// =============================================================================
// DEV/TEST BRIDGE — expose store on window for Playwright tests
// =============================================================================

if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  (window as any).__VOICE31_STORE__ = useVoice31Store;
}

// =============================================================================
// HYDRATION - Load persisted settings from localStorage
// =============================================================================

if (typeof window !== "undefined") {
  // Hydrate voice mode from localStorage
  try {
    const savedVoiceMode = localStorage.getItem("voice31_voice_mode");
    if (savedVoiceMode === "voice31" || savedVoiceMode === "classic") {
      useVoice31Store.setState({ voiceMode: savedVoiceMode });
    }
  } catch (e) {
    console.warn("[Voice31Store] Failed to load voice mode:", e);
  }

  // Hydrate assistant config from localStorage
  try {
    const savedConfig = localStorage.getItem("voice31_assistant_config");
    if (savedConfig) {
      const config = JSON.parse(savedConfig);
      // Migrate old enabledTools (allowlist) → disabledTools (blocklist)
      if ("enabledTools" in config) {
        config.disabledTools = [];
        delete config.enabledTools;
        localStorage.setItem("voice31_assistant_config", JSON.stringify(config));
        console.log("[Voice31Store] Migrated enabledTools → disabledTools");
      }
      useVoice31Store.setState((state) => ({
        assistantSettings: {
          ...state.assistantSettings,
          currentConfig: {
            ...state.assistantSettings.currentConfig,
            ...config,
          },
        },
        phosphorColor: config.phosphorColor || state.phosphorColor,
      }));
      console.log("[Voice31Store] Loaded assistant config from localStorage");
    }
  } catch (e) {
    console.warn("[Voice31Store] Failed to load assistant config:", e);
  }

  // Hydrate saved assistants list from localStorage
  try {
    const savedAssistantsList = localStorage.getItem(
      "voice31_saved_assistants",
    );
    if (savedAssistantsList) {
      const assistants = JSON.parse(savedAssistantsList);
      useVoice31Store.setState((state) => ({
        assistantSettings: {
          ...state.assistantSettings,
          savedAssistants: assistants,
        },
      }));
      console.log("[Voice31Store] Loaded saved assistants from localStorage");
    }
  } catch (e) {
    console.warn("[Voice31Store] Failed to load saved assistants:", e);
  }

  // Hydrate memories from localStorage
  try {
    const savedMemories = localStorage.getItem("voice31_memories");
    if (savedMemories) {
      const memories = JSON.parse(savedMemories);
      useVoice31Store.setState((state) => ({
        memoryState: { ...state.memoryState, memories },
      }));
      console.log("[Voice31Store] Loaded memories from localStorage");
    }
  } catch (e) {
    console.warn("[Voice31Store] Failed to load memories:", e);
  }

  // Hydrate visual intelligence settings from localStorage
  try {
    const savedVI = localStorage.getItem("voice31_visual_intelligence");
    if (savedVI) {
      const viSettings = JSON.parse(savedVI);
      useVoice31Store.setState((state) => ({
        visualIntelligence: {
          ...state.visualIntelligence,
          ...viSettings,
          sessionStartTime: Date.now(),
        },
      }));
      console.log(
        "[Voice31Store] Loaded visual intelligence settings from localStorage",
      );
    }
  } catch (e) {
    console.warn(
      "[Voice31Store] Failed to load visual intelligence settings:",
      e,
    );
  }

  // Hydrate notes from DB API — short delay for auth cookies, with retry on 401
  setTimeout(() => {
    useVoice31Store.getState().hydrateNotesFromDB();
  }, 800);

  // Hydrate artifacts from DB API — same delay pattern as notes
  setTimeout(() => {
    fetch("/api/voice31/artifacts")
      .then((r) => {
        if (r.status === 401) return null; // Not signed in, skip silently
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (
          data?.artifacts &&
          Array.isArray(data.artifacts) &&
          data.artifacts.length > 0
        ) {
          useVoice31Store.setState({ artifacts: data.artifacts });
          console.log(
            `[Voice31Store] Loaded ${data.artifacts.length} artifacts from DB`,
          );
        }
      })
      .catch((e) => {
        console.warn(
          "[Voice31Store] Failed to load artifacts from DB (user may not be signed in):",
          e.message,
        );
      });
  }, 1500);
}

// =============================================================================
// MOOD TO COLOR MAPPING
// =============================================================================

export const moodToColor: Record<string, PhosphorColor> = {
  calm: "amber",
  excited: "green",
  thinking: "blue",
  alert: "red",
  neutral: "amber",
};

// =============================================================================
// VISUAL SCHEDULING SYSTEM
// =============================================================================

export type VisualEventTrigger =
  | "immediate"
  | "on_speech_start"
  | "on_speech_end"
  | "on_user_speaking"
  | "on_silence"
  | "delay";

export type VisualEventType =
  | "show_text"
  | "show_list"
  | "show_image"
  | "show_wireframe"
  | "show_visualization"
  | "trigger_effect"
  | "set_mood"
  | "clear";

export interface ScheduledVisualEvent {
  id: string;
  type: VisualEventType;
  trigger: VisualEventTrigger;
  delayMs?: number;
  data: Record<string, unknown>;
  priority: number;
  expiresAt?: number;
}

export interface VisualSequence {
  id: string;
  name: string;
  events: ScheduledVisualEvent[];
  currentIndex: number;
  isPlaying: boolean;
  loop: boolean;
}

// Helper to create unique IDs
let eventIdCounter = 0;
export const createEventId = () => `ve_${Date.now()}_${++eventIdCounter}`;

// Visual Scheduler Store (separate for modularity)
interface VisualSchedulerState {
  eventQueue: ScheduledVisualEvent[];
  activeSequences: VisualSequence[];
  lastTriggerTime: Record<VisualEventTrigger, number>;
}

interface VisualSchedulerActions {
  // Event queue management
  scheduleEvent: (event: Omit<ScheduledVisualEvent, "id">) => string;
  cancelEvent: (eventId: string) => void;
  clearQueue: () => void;

  // Sequence management
  createSequence: (
    name: string,
    events: Omit<ScheduledVisualEvent, "id">[],
    loop?: boolean,
  ) => string;
  playSequence: (sequenceId: string) => void;
  stopSequence: (sequenceId: string) => void;
  advanceSequence: (sequenceId: string) => void;

  // Trigger processing
  processTrigger: (trigger: VisualEventTrigger) => ScheduledVisualEvent[];
  recordTriggerTime: (trigger: VisualEventTrigger) => void;
}

export type VisualSchedulerStore = VisualSchedulerState &
  VisualSchedulerActions;

const DEFAULT_SCHEDULER_STATE: VisualSchedulerState = {
  eventQueue: [],
  activeSequences: [],
  lastTriggerTime: {
    immediate: 0,
    on_speech_start: 0,
    on_speech_end: 0,
    on_user_speaking: 0,
    on_silence: 0,
    delay: 0,
  },
};

export const useVisualSchedulerStore = create<VisualSchedulerStore>(
  (set, get) => ({
    ...DEFAULT_SCHEDULER_STATE,

    scheduleEvent: (event) => {
      const id = createEventId();
      const fullEvent: ScheduledVisualEvent = { ...event, id };
      set((state) => ({
        eventQueue: [...state.eventQueue, fullEvent].sort(
          (a, b) => b.priority - a.priority,
        ),
      }));
      return id;
    },

    cancelEvent: (eventId) => {
      set((state) => ({
        eventQueue: state.eventQueue.filter((e) => e.id !== eventId),
      }));
    },

    clearQueue: () => {
      set({ eventQueue: [] });
    },

    createSequence: (name, events, loop = false) => {
      const id = `seq_${Date.now()}`;
      const fullEvents: ScheduledVisualEvent[] = events.map((e) => ({
        ...e,
        id: createEventId(),
      }));
      const sequence: VisualSequence = {
        id,
        name,
        events: fullEvents,
        currentIndex: 0,
        isPlaying: false,
        loop,
      };
      set((state) => ({
        activeSequences: [...state.activeSequences, sequence],
      }));
      return id;
    },

    playSequence: (sequenceId) => {
      set((state) => ({
        activeSequences: state.activeSequences.map((seq) =>
          seq.id === sequenceId
            ? { ...seq, isPlaying: true, currentIndex: 0 }
            : seq,
        ),
      }));
    },

    stopSequence: (sequenceId) => {
      set((state) => ({
        activeSequences: state.activeSequences.map((seq) =>
          seq.id === sequenceId ? { ...seq, isPlaying: false } : seq,
        ),
      }));
    },

    advanceSequence: (sequenceId) => {
      set((state) => ({
        activeSequences: state.activeSequences.map((seq) => {
          if (seq.id !== sequenceId) return seq;

          const nextIndex = seq.currentIndex + 1;
          if (nextIndex >= seq.events.length) {
            if (seq.loop) {
              return { ...seq, currentIndex: 0 };
            }
            return { ...seq, isPlaying: false };
          }
          return { ...seq, currentIndex: nextIndex };
        }),
      }));
    },

    processTrigger: (trigger) => {
      const state = get();
      const now = Date.now();

      // Find matching events
      const matching = state.eventQueue.filter((e) => {
        if (e.trigger !== trigger) return false;
        if (e.expiresAt && e.expiresAt < now) return false;

        // For delay triggers, check if enough time has passed
        if (trigger === "delay" && e.delayMs) {
          const lastTrigger = state.lastTriggerTime.delay;
          if (now - lastTrigger < e.delayMs) return false;
        }

        return true;
      });

      // Remove processed events from queue
      if (matching.length > 0) {
        set((state) => ({
          eventQueue: state.eventQueue.filter(
            (e) => !matching.find((m) => m.id === e.id),
          ),
        }));
      }

      return matching;
    },

    recordTriggerTime: (trigger) => {
      set((state) => ({
        lastTriggerTime: { ...state.lastTriggerTime, [trigger]: Date.now() },
      }));
    },
  }),
);
