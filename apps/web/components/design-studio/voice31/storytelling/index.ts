// Barrel exports for storytelling engine

export { StorytellingOrchestrator } from './StorytellingOrchestrator';
export { StorytellingPlayer } from './StorytellingPlayer';
export { StorytellingCanvas } from './StorytellingCanvas';
export { useStorytellingStore } from './StorytellingStore';
export { SCENE_REGISTRY, getSceneComponent } from './scenes';

export type {
  Scene,
  SceneType,
  SceneData,
  SceneRendererProps,
  PlayerState,
  StorytellingState,
  StorytellingStore,
  TransitionType,
  WordTimestamp,
  SceneTranscript,
  SceneEntry,
  SceneStatus,
  NarrationMode,
  NarrationScript,
  RenderPriority,
  ResearchContext,
  ResearchResult,
  ImageFrameData,
  ResearchHighlightData,
  KineticTextData,
} from './types';
