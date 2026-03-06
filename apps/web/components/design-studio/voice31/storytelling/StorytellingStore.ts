'use client';

/**
 * Storytelling Zustand Store
 *
 * Manages: player state machine, scene buffer, scene statuses,
 * current index, audio references, and error state.
 *
 * 60fps animation state (progress, word highlight) lives in hooks/refs
 * to prevent global re-renders.
 */

import { create } from 'zustand';
import type {
  StorytellingStore,
  PlayerState,
  Scene,
  SceneStatus,
  SceneEntry,
  NarrationMode,
  NarrationScript,
  RenderPriority,
  ResearchContext,
  SceneType,
  SceneVisualOverrides,
  SettingsChangeLogEntry,
} from './types';

const INITIAL_STATE = {
  playerState: 'idle' as PlayerState,
  question: '',
  scenes: [] as SceneEntry[],
  currentSceneIndex: 0,
  generationComplete: false,
  sceneStartTime: 0,
  playbackStartTime: 0,
  pauseAccumulator: 0,
  lastPauseTime: 0,
  narrationMode: 'assistant' as NarrationMode,
  narrationScript: null as NarrationScript | null,
  lastDetectedSceneMarker: 0,
  researchContext: null as ResearchContext | null,
  sceneOverrides: {} as Record<string, SceneVisualOverrides>,
  settingsChangeLog: [] as SettingsChangeLogEntry[],
  adminPanelVisible: false,
  error: null as string | null,
};

export const useStorytellingStore = create<StorytellingStore>((set, get) => ({
  ...INITIAL_STATE,

  // ─── Lifecycle ─────────────────────────────────────────────────────────

  startStory: (question: string) => {
    set({
      ...INITIAL_STATE,
      playerState: 'generating',
      question,
    });
  },

  reset: () => {
    // Cleanup audio elements
    const { scenes } = get();
    for (const entry of scenes) {
      if (entry.audioElement) {
        entry.audioElement.pause();
        if (entry.audioUrl) URL.revokeObjectURL(entry.audioUrl);
      }
    }
    set(INITIAL_STATE);
  },

  // ─── Scene management ─────────────────────────────────────────────────

  addScene: (scene: Scene, priority?: RenderPriority) => {
    set((state) => {
      const sceneCount = state.scenes.length;
      const currentIdx = state.currentSceneIndex;
      const autoP = priority || (sceneCount - currentIdx >= 2 ? 'background' : 'immediate');
      return {
        scenes: [
          ...state.scenes,
          { scene, status: 'pending', renderPriority: autoP },
        ],
      };
    });
  },

  updateSceneStatus: (sceneId: string, status: SceneStatus, audioUrl?: string) => {
    set((state) => ({
      scenes: state.scenes.map((entry) =>
        entry.scene.id === sceneId
          ? { ...entry, status, ...(audioUrl ? { audioUrl } : {}) }
          : entry
      ),
    }));
  },

  setSceneAudioElement: (sceneId: string, audio: HTMLAudioElement) => {
    set((state) => ({
      scenes: state.scenes.map((entry) =>
        entry.scene.id === sceneId
          ? { ...entry, audioElement: audio }
          : entry
      ),
    }));
  },

  markGenerationComplete: () => {
    set({ generationComplete: true });
  },

  // ─── Playback ─────────────────────────────────────────────────────────

  play: () => {
    const { playerState, lastPauseTime, pauseAccumulator } = get();
    if (playerState === 'paused') {
      // Accumulate pause duration when resuming
      const pauseDuration = lastPauseTime > 0 ? performance.now() - lastPauseTime : 0;
      set({
        playerState: 'playing',
        pauseAccumulator: pauseAccumulator + pauseDuration,
        lastPauseTime: 0,
      });
    } else if (playerState === 'buffering') {
      // Allow resuming from buffering (e.g. after interruption during scene transition)
      const currentEntry = get().scenes[get().currentSceneIndex];
      if (currentEntry && (currentEntry.status === 'ready' || currentEntry.status === 'complete')) {
        set({
          playerState: 'playing',
          sceneStartTime: performance.now(),
        });
      }
    }
  },

  pause: () => {
    const { playerState } = get();
    if (playerState === 'playing') {
      set({ playerState: 'paused', lastPauseTime: performance.now() });
    }
  },

  goToScene: (index: number) => {
    const { scenes } = get();
    if (index >= 0 && index < scenes.length) {
      // Pause current audio
      const current = scenes[get().currentSceneIndex];
      if (current?.audioElement) {
        current.audioElement.pause();
        current.audioElement.currentTime = 0;
      }

      const target = scenes[index];
      if (target.status === 'ready' || target.status === 'complete') {
        set({
          currentSceneIndex: index,
          playerState: 'playing',
          sceneStartTime: performance.now(),
        });
      } else {
        set({
          currentSceneIndex: index,
          playerState: 'buffering',
        });
      }
    }
  },

  advanceScene: () => {
    const { currentSceneIndex, scenes, generationComplete } = get();
    const nextIndex = currentSceneIndex + 1;

    // Pause current audio
    const current = scenes[currentSceneIndex];
    if (current?.audioElement) {
      current.audioElement.pause();
    }

    // Mark current as complete
    if (current) {
      set((state) => ({
        scenes: state.scenes.map((entry, i) =>
          i === currentSceneIndex ? { ...entry, status: 'complete' } : entry
        ),
      }));
    }

    if (nextIndex >= scenes.length) {
      // No more scenes
      if (generationComplete) {
        set({ playerState: 'complete' });
      } else {
        set({ playerState: 'buffering', currentSceneIndex: nextIndex });
      }
      return;
    }

    const next = scenes[nextIndex];
    if (next.status === 'ready') {
      set({
        currentSceneIndex: nextIndex,
        playerState: 'playing',
        sceneStartTime: performance.now(),
      });
    } else {
      set({
        currentSceneIndex: nextIndex,
        playerState: 'buffering',
      });
    }
  },

  setPlayerState: (state: PlayerState) => {
    set({ playerState: state });
  },

  setSceneStartTime: (time: number) => {
    set({ sceneStartTime: time });
  },

  // ─── Duration-based timing ────────────────────────────────────────

  setPlaybackStartTime: (time: number) => {
    set({ playbackStartTime: time, pauseAccumulator: 0, lastPauseTime: 0 });
  },

  // ─── Narration ──────────────────────────────────────────────────────

  setNarrationMode: (narrationMode: NarrationMode) => {
    set({ narrationMode });
  },

  setNarrationScript: (narrationScript: NarrationScript | null) => {
    set({ narrationScript });
  },

  setLastDetectedSceneMarker: (lastDetectedSceneMarker: number) => {
    set({ lastDetectedSceneMarker });
  },

  // ─── Research ──────────────────────────────────────────────────────

  setResearchContext: (researchContext: ResearchContext | null) => {
    set({ researchContext });
  },

  // ─── Pre-render ────────────────────────────────────────────────────

  updateScenePrerenderData: (sceneId: string, data: Partial<NonNullable<SceneEntry['prerenderData']>>) => {
    set((state) => ({
      scenes: state.scenes.map((entry) =>
        entry.scene.id === sceneId
          ? { ...entry, prerenderData: { ...entry.prerenderData, ...data } }
          : entry
      ),
    }));
  },

  // ─── Admin overrides ─────────────────────────────────────────────────

  setAdminPanelVisible: (visible: boolean) => {
    set({ adminPanelVisible: visible });
  },

  setSceneOverride: (sceneId: string, sceneType: SceneType, param: string, value: unknown) => {
    const { sceneOverrides, settingsChangeLog } = get();
    const current = sceneOverrides[sceneId] || {};
    const oldValue = (current as Record<string, unknown>)[param];

    const entry: SettingsChangeLogEntry = {
      timestamp: Date.now(),
      sceneId,
      sceneType,
      parameter: param,
      oldValue,
      newValue: value,
    };

    set({
      sceneOverrides: {
        ...sceneOverrides,
        [sceneId]: { ...current, [param]: value } as SceneVisualOverrides,
      },
      settingsChangeLog: [...settingsChangeLog, entry],
    });
  },

  clearSceneOverrides: (sceneId: string) => {
    const { sceneOverrides } = get();
    const { [sceneId]: _, ...rest } = sceneOverrides;
    set({ sceneOverrides: rest });
  },

  // ─── Error ────────────────────────────────────────────────────────────

  setError: (error: string | null) => {
    set({ error, playerState: error ? 'idle' : get().playerState });
  },
}));
