'use client';

/**
 * Voice26 Store
 *
 * Minimal Zustand store for voice26 state management.
 * Clean and focused - no legacy complexity.
 */

import { create } from 'zustand';

// =============================================================================
// TYPES
// =============================================================================

export type PhosphorColor = 'green' | 'red' | 'blue' | 'amber' | 'white';

export type DisplayContentType =
  | 'text'
  | 'list'
  | 'image'
  | 'generating'
  | 'visualization'
  | null;

export type VisualizationType =
  | 'isometric_lattice'
  | 'waveform'
  | 'graph'
  | 'particles'
  | 'matrix'
  | 'neural_net'
  | 'dna_helix'
  | null;

export type EffectType = 'rain' | 'snow' | 'confetti' | 'sparkles' | 'fire' | 'hearts' | 'stars' | null;

export type WireframeSemanticType =
  | 'idea'
  | 'question'
  | 'data'
  | 'connection'
  | 'time'
  | 'growth'
  | 'warning'
  | 'success'
  | 'error'
  | 'process'
  | 'music'
  | 'abstract'
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

// Persistent image layer - survives text changes
export interface PersistentImageLayer {
  url: string;
  prompt?: string;
  position: 'background' | 'left' | 'right' | 'center';
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
  pitch: number;      // -12 to +12 semitones
  bitcrush: number;   // 0 to 1 (0 = no crush, 1 = full crush)
  reverb: number;     // 0 to 1 (0 = dry, 1 = full wet)
  filter: number;     // 0 to 1 (0 = lowpass closed, 1 = fully open)
}

// =============================================================================
// BROWSER/READER TYPES
// =============================================================================

export type BrowserMode = 'off' | 'reader' | 'results' | 'loading';

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

export type DiagramStyle = 'flowchart' | 'network' | 'hierarchy' | 'timeline' | 'cycle';

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
// STORE STATE
// =============================================================================

interface Voice26State {
  // Connection state
  isConnected: boolean;
  isListening: boolean;
  isSpeaking: boolean;

  // Transcript
  userTranscript: string;
  assistantText: string;

  // Display configuration
  phosphorColor: PhosphorColor;

  // Content display (from tool calls)
  displayContent: DisplayContent;

  // Persistent image layer - survives text changes, shown behind text
  persistentImage: PersistentImageLayer | null;

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
}

interface Voice26Actions {
  // Connection
  setConnected: (connected: boolean) => void;
  setListening: (listening: boolean) => void;
  setSpeaking: (speaking: boolean) => void;

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

  // Persistent image layer (survives text/content changes)
  setPersistentImage: (url: string, prompt?: string, position?: PersistentImageLayer['position']) => void;
  clearPersistentImage: () => void;

  // Effects
  triggerEffect: (type: EffectType, intensity?: number, duration?: number) => void;
  clearEffect: () => void;

  // Wireframe 3D
  showWireframe: (semanticType: WireframeSemanticType, labels?: string[], duration?: number) => void;
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
  showProgressiveDiagram: (title: string, nodes: DiagramNode[], style?: DiagramStyle, autoAdvance?: boolean) => void;
  advanceDiagram: (highlightNode?: string) => void;
  highlightDiagramNode: (nodeId: string | null) => void;
  clearDiagram: () => void;

  // Reset
  reset: () => void;
}

export type Voice26Store = Voice26State & Voice26Actions;

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
  mode: 'off',
  readerContent: null,
  searchResults: [],
  searchQuery: '',
  isLoading: false,
  error: null,
};

const DEFAULT_DIAGRAM_STATE: DiagramState = {
  active: false,
  title: '',
  style: 'flowchart',
  nodes: [],
  revealedLevel: -1,
  highlightedNode: null,
  autoAdvance: false,
};

const DEFAULT_STATE: Voice26State = {
  isConnected: false,
  isListening: false,
  isSpeaking: false,
  userTranscript: '',
  assistantText: 'VOICE26',
  phosphorColor: 'amber',
  displayContent: { type: null },
  persistentImage: null,
  activeEffect: null,
  wireframeState: DEFAULT_WIREFRAME_STATE,
  visualizerData: Array(16).fill(0.1),
  audioFX: DEFAULT_AUDIO_FX,
  fmSpectrumData: Array(32).fill(0),
  audioFXVisible: false,
  browserState: DEFAULT_BROWSER_STATE,
  diagramState: DEFAULT_DIAGRAM_STATE,
};

// =============================================================================
// STORE
// =============================================================================

export const useVoice26Store = create<Voice26Store>((set) => ({
  ...DEFAULT_STATE,

  // Connection
  setConnected: (connected) => set({ isConnected: connected }),
  setListening: (listening) => set({ isListening: listening }),
  setSpeaking: (speaking) => set({ isSpeaking: speaking }),

  // Transcript
  setUserTranscript: (text) => set({ userTranscript: text }),
  setAssistantText: (text) => set({ assistantText: text }),

  // Display
  setPhosphorColor: (color) => set({ phosphorColor: color }),

  // Content handlers
  showText: (text) => set({
    displayContent: { type: 'text', text },
    assistantText: text.slice(0, 20).toUpperCase() || 'TEXT',
    diagramState: DEFAULT_DIAGRAM_STATE,
    browserState: DEFAULT_BROWSER_STATE,
  }),

  showList: (items, title) => set({
    displayContent: { type: 'list', list: items, listTitle: title },
    assistantText: title?.toUpperCase() || 'LIST',
    diagramState: DEFAULT_DIAGRAM_STATE,
    browserState: DEFAULT_BROWSER_STATE,
  }),

  showGenerating: (prompt) => set({
    displayContent: { type: 'generating', imagePrompt: prompt },
    assistantText: 'GENERATING',
    diagramState: DEFAULT_DIAGRAM_STATE,
    browserState: DEFAULT_BROWSER_STATE,
  }),

  showImage: (url, prompt, persist = true) => set((state) => ({
    displayContent: { type: 'image', imageUrl: url, imagePrompt: prompt },
    // When persist is true, also set as persistent image so it survives text changes
    persistentImage: persist ? {
      url,
      prompt,
      position: 'background',
      opacity: 1,
      timestamp: Date.now(),
    } : state.persistentImage,
    assistantText: 'IMAGE',
    diagramState: DEFAULT_DIAGRAM_STATE,
    browserState: DEFAULT_BROWSER_STATE,
  })),

  showVisualization: (visualizationType, title) => set({
    displayContent: {
      type: 'visualization',
      visualizationType,
      visualizationTitle: title,
    },
    assistantText: title?.toUpperCase() || visualizationType?.toUpperCase().replace('_', ' ') || 'VISUAL',
    diagramState: DEFAULT_DIAGRAM_STATE,
    browserState: DEFAULT_BROWSER_STATE,
  }),

  clearContent: () => set({
    displayContent: { type: null },
    // Note: persistentImage is NOT cleared - it survives content changes
  }),

  // Persistent image layer
  setPersistentImage: (url, prompt, position = 'background') => set({
    persistentImage: {
      url,
      prompt,
      position,
      opacity: 1,
      timestamp: Date.now(),
    },
  }),

  clearPersistentImage: () => set({
    persistentImage: null,
  }),

  // Effects
  triggerEffect: (type, intensity = 0.5, duration = 5000) => set({
    activeEffect: {
      type,
      intensity,
      startTime: Date.now(),
      duration,
    },
  }),

  clearEffect: () => set({ activeEffect: null }),

  // Wireframe 3D
  showWireframe: (semanticType, labels, duration = 10000) => set({
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
  setAudioFX: (fx) => set((state) => ({
    audioFX: { ...state.audioFX, ...fx },
  })),
  setFMSpectrumData: (data) => set({ fmSpectrumData: data }),
  toggleAudioFXVisible: () => set((state) => ({ audioFXVisible: !state.audioFXVisible })),
  setAudioFXVisible: (visible) => set({ audioFXVisible: visible }),

  // Browser/Reader
  setBrowserLoading: (loading) => set((state) => ({
    browserState: {
      ...state.browserState,
      isLoading: loading,
      mode: loading ? 'loading' : state.browserState.mode,
    },
  })),

  showSearchResults: (query, results) => set((state) => ({
    browserState: {
      ...state.browserState,
      mode: 'results',
      searchQuery: query,
      searchResults: results,
      isLoading: false,
      error: null,
    },
    displayContent: { type: null },
    diagramState: DEFAULT_DIAGRAM_STATE,
    assistantText: 'SEARCH',
  })),

  showReaderContent: (content) => set((state) => ({
    browserState: {
      ...state.browserState,
      mode: 'reader',
      readerContent: content,
      isLoading: false,
      error: null,
    },
    displayContent: { type: null },
    diagramState: DEFAULT_DIAGRAM_STATE,
    assistantText: 'READING',
  })),

  clearBrowser: () => set({ browserState: DEFAULT_BROWSER_STATE }),

  setBrowserError: (error) => set((state) => ({
    browserState: {
      ...state.browserState,
      error,
      isLoading: false,
    },
  })),

  // Progressive Diagram
  showProgressiveDiagram: (title, nodes, style = 'flowchart', autoAdvance = false) => set({
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
    assistantText: 'DIAGRAM',
  }),

  advanceDiagram: (highlightNode) => set((state) => {
    if (!state.diagramState.active) return state;
    const maxLevel = Math.max(...state.diagramState.nodes.map((n) => n.level));
    const nextLevel = Math.min(state.diagramState.revealedLevel + 1, maxLevel);
    return {
      diagramState: {
        ...state.diagramState,
        revealedLevel: nextLevel,
        highlightedNode: highlightNode || null,
      },
    };
  }),

  highlightDiagramNode: (nodeId) => set((state) => ({
    diagramState: {
      ...state.diagramState,
      highlightedNode: nodeId,
    },
  })),

  clearDiagram: () => set({ diagramState: DEFAULT_DIAGRAM_STATE }),

  // Reset
  reset: () => set(DEFAULT_STATE),
}));

// =============================================================================
// MOOD TO COLOR MAPPING
// =============================================================================

export const moodToColor: Record<string, PhosphorColor> = {
  calm: 'amber',
  excited: 'green',
  thinking: 'blue',
  alert: 'red',
  neutral: 'amber',
};

// =============================================================================
// VISUAL SCHEDULING SYSTEM
// =============================================================================

export type VisualEventTrigger =
  | 'immediate'
  | 'on_speech_start'
  | 'on_speech_end'
  | 'on_user_speaking'
  | 'on_silence'
  | 'delay';

export type VisualEventType =
  | 'show_text'
  | 'show_list'
  | 'show_image'
  | 'show_wireframe'
  | 'show_visualization'
  | 'trigger_effect'
  | 'set_mood'
  | 'clear';

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
  scheduleEvent: (event: Omit<ScheduledVisualEvent, 'id'>) => string;
  cancelEvent: (eventId: string) => void;
  clearQueue: () => void;

  // Sequence management
  createSequence: (name: string, events: Omit<ScheduledVisualEvent, 'id'>[], loop?: boolean) => string;
  playSequence: (sequenceId: string) => void;
  stopSequence: (sequenceId: string) => void;
  advanceSequence: (sequenceId: string) => void;

  // Trigger processing
  processTrigger: (trigger: VisualEventTrigger) => ScheduledVisualEvent[];
  recordTriggerTime: (trigger: VisualEventTrigger) => void;
}

export type VisualSchedulerStore = VisualSchedulerState & VisualSchedulerActions;

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

export const useVisualSchedulerStore = create<VisualSchedulerStore>((set, get) => ({
  ...DEFAULT_SCHEDULER_STATE,

  scheduleEvent: (event) => {
    const id = createEventId();
    const fullEvent: ScheduledVisualEvent = { ...event, id };
    set((state) => ({
      eventQueue: [...state.eventQueue, fullEvent].sort((a, b) => b.priority - a.priority),
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
        seq.id === sequenceId ? { ...seq, isPlaying: true, currentIndex: 0 } : seq
      ),
    }));
  },

  stopSequence: (sequenceId) => {
    set((state) => ({
      activeSequences: state.activeSequences.map((seq) =>
        seq.id === sequenceId ? { ...seq, isPlaying: false } : seq
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
      if (trigger === 'delay' && e.delayMs) {
        const lastTrigger = state.lastTriggerTime.delay;
        if (now - lastTrigger < e.delayMs) return false;
      }

      return true;
    });

    // Remove processed events from queue
    if (matching.length > 0) {
      set((state) => ({
        eventQueue: state.eventQueue.filter((e) => !matching.find((m) => m.id === e.id)),
      }));
    }

    return matching;
  },

  recordTriggerTime: (trigger) => {
    set((state) => ({
      lastTriggerTime: { ...state.lastTriggerTime, [trigger]: Date.now() },
    }));
  },
}));
