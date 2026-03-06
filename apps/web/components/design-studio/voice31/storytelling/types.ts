/**
 * Storytelling Engine Types
 *
 * All interfaces for the visual storytelling system:
 * scenes, player state, generation, narration.
 */

// =============================================================================
// SCENE TYPES
// =============================================================================

export type SceneType =
  | 'kinetic_title'
  | 'big_number'
  | 'split'
  | 'h_bars'
  | 'donut'
  | 'editorial_callout'
  | 'ticker_facts'
  | 'card_stack'
  | 'chart'
  | 'profile'
  | 'group'
  | 'infographic_map'
  | 'svg_visual'
  | 'quote'
  | 'image_frame'
  | 'research_highlight'
  | 'kinetic_text'
  | 'cinematic_point_cloud'
  | 'cinematic_depth_mesh'
  | 'cinematic_layered'
  | 'cinematic_composition'
  | 'cinematic_dither'
  | 'cinematic_flat';

export type TransitionType =
  | 'fade'
  | 'wipe_left'
  | 'wipe_right'
  | 'iris'
  | 'dissolve'
  | 'cut'
  | 'crt_static'
  | 'scanline_wipe'
  | 'ink_bleed'
  | 'zoom_blur'
  | 'glitch';

// =============================================================================
// SCENE DATA — discriminated union per scene type
// =============================================================================

export interface KineticTitleData {
  title: string;
  subtitle?: string;
  style?: 'bold' | 'elegant' | 'impact' | 'editorial';
}

export interface BigNumberData {
  value: number;
  suffix?: string;
  prefix?: string;
  label: string;
  sublabel?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export interface SplitData {
  left: { label: string; value: string; icon?: string };
  right: { label: string; value: string; icon?: string };
  versus?: boolean;
}

export interface HorizontalBarsData {
  title?: string;
  bars: Array<{
    label: string;
    value: number;
    maxValue?: number;
    color?: string;
  }>;
}

export interface DonutData {
  title?: string;
  segments: Array<{
    label: string;
    value: number;
    color?: string;
  }>;
  centerLabel?: string;
  centerValue?: string;
}

export interface EditorialCalloutData {
  text: string;
  attribution?: string;
  style?: 'pull' | 'highlight' | 'sidebar';
}

export interface TickerFactsData {
  facts: Array<{
    label: string;
    value: string;
  }>;
  speed?: 'slow' | 'normal' | 'fast';
}

export interface CardStackData {
  cards: Array<{
    title: string;
    body: string;
    icon?: string;
  }>;
}

export interface ChartData {
  type: 'line' | 'area' | 'bar';
  title?: string;
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    color?: string;
  }>;
}

export interface ProfileData {
  name: string;
  title?: string;
  avatar?: string;
  stats?: Array<{ label: string; value: string }>;
  bio?: string;
}

export interface GroupData {
  title?: string;
  people: Array<{
    name: string;
    role?: string;
    avatar?: string;
  }>;
}

export interface InfographicMapData {
  title?: string;
  regions: Array<{
    name: string;
    value: string | number;
    highlighted?: boolean;
  }>;
  type?: 'world' | 'us' | 'abstract';
}

export interface SvgVisualData {
  description: string;
  elements: Array<{
    type: 'circle' | 'rect' | 'path' | 'text' | 'line';
    props: Record<string, string | number>;
    animate?: Record<string, string | number>;
  }>;
}

export interface QuoteData {
  text: string;
  author?: string;
  source?: string;
  style?: 'minimal' | 'decorative' | 'editorial';
}

export interface ImageFrameData {
  imageUrl: string;
  caption?: string;
  source?: string;
  frameStyle: 'editorial' | 'polaroid' | 'cinema' | 'minimal' | 'float';
  enableParallax?: boolean;
  enableDepthMap?: boolean;
}

export interface ResearchHighlightData {
  excerpt: string;
  source: string;
  sourceUrl?: string;
  highlightWords?: string[];
  style: 'pullquote' | 'card' | 'sidebar' | 'newspaper';
}

export interface KineticTextData {
  text: string;
  animation: 'typewriter' | 'wordPop' | 'waveText' | 'splitReveal' | 'glitchText';
  emphasis?: string[];
  size: 'hero' | 'heading' | 'body';
}

// =============================================================================
// CINEMATIC SCENE DATA
// =============================================================================

export interface CinematicPointCloudData {
  imageUrl: string;
  depthUrl: string;
  headline?: string;
  caption?: string;
  preset?: string;
  shader?: 'default' | 'softGlow' | 'breathing' | 'toon' | 'painterly' | 'adaptive';
  stat?: string;
  source?: string;
}

export interface CinematicDepthMeshData {
  imageUrl: string;
  depthUrl: string;
  headline?: string;
  caption?: string;
  stat?: string;
  source?: string;
}

export interface CinematicLayeredData {
  imageUrl: string;
  layers: Array<{ url: string; depth?: number }>;
  headline?: string;
  caption?: string;
}

export interface CinematicCompositionData {
  imageUrl: string;
  depthUrl: string;
  layers?: Array<{ url: string; depth?: number }>;
  preset: string;
  shader?: 'default' | 'softGlow' | 'breathing' | 'toon' | 'painterly' | 'adaptive';
  headline: string;
  stat?: string;
  source?: string;
}

export interface CinematicDitherData {
  imageUrl: string;
  mode?: 'verticalFM' | 'horizontalFM' | 'scatter' | 'noise';
  lineCount?: number;
  amplitude?: number;
  frequency?: number;
  glow?: number;
  color?: string;
  headline?: string;
  caption?: string;
}

export interface CinematicFlatData {
  imageUrl: string;
  animation?: 'fade-in' | 'zoom-in' | 'slide-up' | 'ken-burns' | 'parallax-drift';
  fit?: 'cover' | 'contain' | 'fill';
  headline?: string;
  caption?: string;
  source?: string;
}

export type SceneData =
  | KineticTitleData
  | BigNumberData
  | SplitData
  | HorizontalBarsData
  | DonutData
  | EditorialCalloutData
  | TickerFactsData
  | CardStackData
  | ChartData
  | ProfileData
  | GroupData
  | InfographicMapData
  | SvgVisualData
  | QuoteData
  | ImageFrameData
  | ResearchHighlightData
  | KineticTextData
  | CinematicPointCloudData
  | CinematicDepthMeshData
  | CinematicLayeredData
  | CinematicCompositionData
  | CinematicDitherData
  | CinematicFlatData;

// =============================================================================
// SCENE TRANSCRIPT
// =============================================================================

export interface WordTimestamp {
  word: string;
  start: number; // seconds from scene start
  end: number;
}

export interface SceneTranscript {
  fullText: string;
  words: WordTimestamp[];
}

// =============================================================================
// SCENE
// =============================================================================

export interface Scene {
  id: string;
  type: SceneType;
  duration: number; // seconds
  caption: string;
  transcript: SceneTranscript;
  data: SceneData;
  accent: string; // hex color
  bg?: string;
  bgGradient?: string;
  transition?: TransitionType;
}

// =============================================================================
// ADMIN OVERRIDES
// =============================================================================

export interface SceneVisualOverrides {
  // Dither
  ditherMode?: 'verticalFM' | 'horizontalFM' | 'scatter' | 'noise';
  ditherLineCount?: number;     // 40-200
  ditherAmplitude?: number;
  ditherFrequency?: number;
  ditherGlow?: number;
  ditherColor?: string;
  // Image stylization
  imageStylization?: 'none' | 'illustrated' | 'editorial' | 'photographic' | 'dithered';
  // Depth renderer
  depthRendererType?: 'point_cloud' | 'depth_mesh';
  // Shader
  shaderVariant?: 'default' | 'softGlow' | 'breathing' | 'toon' | 'painterly' | 'adaptive';
  // Camera
  cameraPreset?: string;
  cameraSpeed?: number;
  cameraAmplitude?: number;
  cameraFov?: number;
  // Cinematic preset
  cinematicPreset?: string;
  // Atmosphere
  atmosphereType?: 'none' | 'fog' | 'haze' | 'mist';
  atmosphereDensity?: number;
  vignetteIntensity?: number;
  // Particles
  particleType?: 'dust' | 'fireflies' | 'rain' | 'snow' | 'ember' | 'none';
  particleCount?: number;
  particleSpeed?: number;
  particleOpacity?: number;
  // Point cloud specifics
  pointSize?: number;
  depthScale?: number;
  dissolveSpeed?: number;
}

export interface SettingsChangeLogEntry {
  timestamp: number;
  sceneId: string;
  sceneType: SceneType;
  parameter: string;
  oldValue: unknown;
  newValue: unknown;
}

// =============================================================================
// SCENE STATUS (internal tracking)
// =============================================================================

export type SceneStatus =
  | 'pending'      // received from LLM, not yet narrated
  | 'narrating'    // TTS in progress
  | 'ready'        // audio + timestamps ready, can play
  | 'playing'      // currently displayed
  | 'complete';    // finished playing

export type RenderPriority = 'immediate' | 'background' | 'prerender';

export interface SceneEntry {
  scene: Scene;
  status: SceneStatus;
  audioUrl?: string;
  audioElement?: HTMLAudioElement;
  renderPriority: RenderPriority;
  prerenderData?: {
    imageUrl?: string;
    depthMapUrl?: string;
    researchData?: Record<string, unknown>;
  };
}

// =============================================================================
// PLAYER STATE
// =============================================================================

export type PlayerState =
  | 'idle'
  | 'generating'
  | 'buffering'
  | 'playing'
  | 'paused'
  | 'complete';

// =============================================================================
// SCENE RENDERER PROPS
// =============================================================================

export interface SceneRendererProps {
  scene: Scene;
  progress: number;   // 0→1 within current scene
  time: number;       // seconds since scene start
  isActive: boolean;
  width: number;
  height: number;
  accentColor: string;
}

// =============================================================================
// NARRATION MODES
// =============================================================================

export type NarrationMode = 'assistant' | 'separate_voice' | 'text_only';

export interface NarrationScript {
  fullScript: string;
  sceneCount: number;
  instruction: string;
}

// =============================================================================
// STORYTELLING STORE STATE
// =============================================================================

export interface StorytellingState {
  // Player
  playerState: PlayerState;
  question: string;

  // Scene buffer
  scenes: SceneEntry[];
  currentSceneIndex: number;
  generationComplete: boolean;

  // Playback
  sceneStartTime: number; // timestamp when current scene started

  // Duration-based playback timing
  playbackStartTime: number;       // set once when first scene starts (performance.now ms)
  pauseAccumulator: number;         // total ms spent paused
  lastPauseTime: number;            // when current pause started (0 if not paused)

  // Narration
  narrationMode: NarrationMode;
  narrationScript: NarrationScript | null;
  lastDetectedSceneMarker: number;

  // Research
  researchContext: ResearchContext | null;

  // Admin overrides
  sceneOverrides: Record<string, SceneVisualOverrides>;
  settingsChangeLog: SettingsChangeLogEntry[];
  adminPanelVisible: boolean;

  // Error
  error: string | null;
}

export interface ResearchResult {
  title: string;
  url: string;
  highlights: string[];
  summary: string;
  image?: string;
}

export interface ResearchContext {
  query: string;
  results: ResearchResult[];
  fetchedAt: number;
}

export interface StorytellingActions {
  // Lifecycle
  startStory: (question: string) => void;
  reset: () => void;

  // Scene management
  addScene: (scene: Scene, priority?: RenderPriority) => void;
  updateSceneStatus: (sceneId: string, status: SceneStatus, audioUrl?: string) => void;
  setSceneAudioElement: (sceneId: string, audio: HTMLAudioElement) => void;
  markGenerationComplete: () => void;
  updateScenePrerenderData: (sceneId: string, data: Partial<NonNullable<SceneEntry['prerenderData']>>) => void;

  // Playback
  play: () => void;
  pause: () => void;
  goToScene: (index: number) => void;
  advanceScene: () => void;
  setPlayerState: (state: PlayerState) => void;
  setSceneStartTime: (time: number) => void;

  // Duration-based timing
  setPlaybackStartTime: (time: number) => void;

  // Narration
  setNarrationMode: (mode: NarrationMode) => void;
  setNarrationScript: (script: NarrationScript | null) => void;
  setLastDetectedSceneMarker: (marker: number) => void;

  // Research
  setResearchContext: (context: ResearchContext | null) => void;

  // Admin overrides
  setAdminPanelVisible: (visible: boolean) => void;
  setSceneOverride: (sceneId: string, sceneType: SceneType, param: string, value: unknown) => void;
  clearSceneOverrides: (sceneId: string) => void;

  // Error
  setError: (error: string | null) => void;
}

export type StorytellingStore = StorytellingState & StorytellingActions;
