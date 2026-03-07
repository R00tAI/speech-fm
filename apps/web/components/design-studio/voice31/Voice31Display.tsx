"use client";

/**
 * Voice31 Display - Orchestrator
 *
 * Composes sub-components from ./display/ into the CRT display system.
 * Handles: size/resize, CRT occlusion detection, assistant migration,
 * storytelling auto-close, RPG keyboard shortcuts, and component composition.
 *
 * RPG Mode: Fullscreen CRT (flex-1) + always-visible right sidebar (280px).
 * No 4:3 aspect ratio constraint, no AudioFX panel. CRT has warped corners.
 */

import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { VoiceDisplayPro } from "@/components/design-studio/voice-display/CRTMonitorPro";
import { WireframeObjectLayer } from "@/components/design-studio/voice-display/WireframeObjectLayer";
import { CelestialCanvas } from "@/components/design-studio/voice26/Voice26AudioFX";
import { AssistantMigrationEffect } from "./AssistantMigrationEffect";
import { BinaryAssistant } from "./BinaryAssistant";
// Decomposed display sub-components
import {
  AmbientBackgroundLayer,
  ContentRenderer,
  ControlBar,
  CRTScreenBoundary,
  FallbackAlert,
  getPhosphorColors,
  RPGVisualLayers,
  TextChatInput,
} from "./display";
// Visual Intelligence
import { useVisualIntelligence } from "./hooks/useVisualIntelligence";
import { useStorytellingStore } from "./storytelling";
import { Voice31AudioFX } from "./Voice31AudioFX";
import { Voice31Effects } from "./Voice31Effects";
import { Voice31NoteEditor } from "./Voice31NoteEditor";
import { Voice31ProgressiveRenderer } from "./Voice31ProgressiveRenderer";
import { Voice31RPGCharacterCreator } from "./Voice31RPGCharacterCreator";

// RPG Mode Components
import { useVoice31RPG, Voice31RPGProvider } from "./Voice31RPGProvider";
import { Voice31RPGSaveFile } from "./Voice31RPGSaveFile";
import { Voice31RPGSidebar } from "./Voice31RPGSidebar";
import { useVoice31RPGStore } from "./Voice31RPGStore";
import { Voice31SceneInspector } from "./Voice31SceneInspector";
import { Voice31Settings } from "./Voice31Settings";
import { Voice31SidePanel } from "./Voice31SidePanel";
import { useVoice31Store } from "./Voice31Store";
import { useVoice31Text } from "./Voice31TextProvider";
import { useVoice31Backend } from "./Voice31UnifiedProvider";

type ContentPosition = "left" | "right" | "center" | "top" | "bottom" | null;

const FX_PANEL_HEIGHT = 100;
const SIDEBAR_WIDTH = 280;

// Processing indicator — visible when assistant is thinking/working
const ThinkingIndicator: React.FC<{ phosphorColor: string }> = ({ phosphorColor }) => {
  const pendingTasks = useVoice31Store((s) => s.bufferingState.pendingTasks);
  const hex = getPhosphorColors(phosphorColor).primary;
  const activeTasks = pendingTasks.filter((t) => t.status === 'running' || t.status === 'retrying');

  return (
    <div className="absolute bottom-3 left-3 z-50 pointer-events-none">
      <div
        className="flex items-center gap-2 px-3 py-1.5 rounded font-mono text-[11px] tracking-wide"
        style={{
          color: hex,
          backgroundColor: 'rgba(0,0,0,0.7)',
          border: `1px solid ${hex}30`,
          textShadow: `0 0 8px ${hex}60`,
        }}
      >
        <span className="inline-flex gap-[3px]">
          <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: hex, animationDelay: '0ms', animationDuration: '1s' }} />
          <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: hex, animationDelay: '150ms', animationDuration: '1s' }} />
          <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: hex, animationDelay: '300ms', animationDuration: '1s' }} />
        </span>
        <span>
          {activeTasks.length > 0
            ? activeTasks[0].label
            : 'PROCESSING'}
        </span>
      </div>
    </div>
  );
};

// Inner display component - extracted for RPG provider wrapping
const Voice31DisplayInner: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 800, height: 600 });
  const [contentPosition, setContentPosition] = useState<ContentPosition>(null);

  // Get state from store
  const {
    isListening,
    isSpeaking,
    isThinking,
    phosphorColor,
    visualizerData,
    displayContent,
    activeEffect,
    wireframeState,
    browserState,
    diagramState,
    codeDisplayState,
    persistentImage,
    overlayText,
    memoryState,
    activeStoryQuestion,
    clearVisualStory,
    assistantLocation,
    migrationPhrase,
    startMigration,
    setAssistantLocation,
    setMigrationPhrase,
  } = useVoice31Store();

  // Read assistantVisual from settings
  const assistantVisual = useVoice31Store(
    (s) => s.assistantSettings.currentConfig.assistantVisual,
  );
  // Read screenType from settings
  const screenType = useVoice31Store(
    (s) => s.assistantSettings.currentConfig.screenType,
  );
  // Read aspect ratio from settings
  const aspectRatioMode = useVoice31Store(
    (s) => s.assistantSettings.currentConfig.aspectRatio ?? "16:9",
  );

  // Text chat / fallback mode
  const interactionMode = useVoice31Store((s) => s.interactionMode);
  const fallbackAlertVisible = useVoice31Store((s) => s.fallbackAlertVisible);
  const { backend } = useVoice31Backend();
  const isTextMode = backend === "text";
  const textCtx = useVoice31Text(); // null when not inside TextProvider

  // Visual Intelligence hook — monitors conversation and triggers ambient backgrounds
  useVisualIntelligence();

  // RPG Mode state
  const rpgModeActive = useVoice31RPGStore((s) => s.rpgModeActive);
  const currentSaveFile = useVoice31RPGStore((s) => s.currentSaveFile);
  const characterCreatorOpen = useVoice31RPGStore(
    (s) => s.characterCreatorOpen,
  );
  const setShowCharacterCreator = useVoice31RPGStore(
    (s) => s.setShowCharacterCreator,
  );
  const saveFileViewerOpen = useVoice31RPGStore((s) => s.saveFileViewerOpen);
  const sceneInspectorOpen = useVoice31RPGStore((s) => s.sceneInspectorOpen);
  const toggleSaveFileViewer = useVoice31RPGStore(
    (s) => s.toggleSaveFileViewer,
  );
  const toggleSceneInspector = useVoice31RPGStore(
    (s) => s.toggleSceneInspector,
  );
  const toggleInventory = useVoice31RPGStore((s) => s.toggleInventory);
  const toggleQuestLog = useVoice31RPGStore((s) => s.toggleQuestLog);
  const toggleCharacterSheet = useVoice31RPGStore(
    (s) => s.toggleCharacterSheet,
  );
  const closeAllPanels = useVoice31RPGStore((s) => s.closeAllPanels);

  // RPG Keyboard shortcuts (I=inventory, Q=quests, C=character, J=journal, Esc=close)
  useEffect(() => {
    if (!(rpgModeActive && currentSaveFile)) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        (e.target as HTMLElement)?.isContentEditable
      )
        return;
      switch (e.key.toLowerCase()) {
        case "i":
          e.preventDefault();
          toggleInventory();
          break;
        case "q":
          e.preventDefault();
          toggleQuestLog();
          break;
        case "c":
          e.preventDefault();
          toggleCharacterSheet();
          break;
        case "j":
          e.preventDefault();
          toggleSaveFileViewer();
          break;
        case "s":
          e.preventDefault();
          toggleSceneInspector();
          break;
        case "escape":
          closeAllPanels();
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    rpgModeActive,
    currentSaveFile,
    toggleInventory,
    toggleQuestLog,
    toggleCharacterSheet,
    toggleSaveFileViewer,
    toggleSceneInspector,
    closeAllPanels,
  ]);

  // CRT occlusion detection
  const isCRTOccluded =
    rpgModeActive ||
    !!activeStoryQuestion ||
    (codeDisplayState.active && codeDisplayState.fullscreen);

  // Auto-clear storytelling overlay
  const STORY_COMPLETE_CLEAR_MS = 6000;
  const STORY_ERROR_CLEAR_MS = 3000;
  const STORY_STUCK_CLEAR_MS = 10000;
  const storyAutoCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  useEffect(() => {
    if (!activeStoryQuestion) return;
    let prevPlayerState: string | null = null;
    let prevError: string | null = null;
    const unsubscribe = useStorytellingStore.subscribe((state) => {
      const { playerState, error } = state;
      const stateChanged =
        playerState !== prevPlayerState || error !== prevError;
      prevPlayerState = playerState;
      prevError = error;
      if (!stateChanged) return;
      if (storyAutoCloseTimerRef.current) {
        clearTimeout(storyAutoCloseTimerRef.current);
        storyAutoCloseTimerRef.current = null;
      }
      if (error) {
        storyAutoCloseTimerRef.current = setTimeout(
          () => clearVisualStory(),
          STORY_ERROR_CLEAR_MS,
        );
        return;
      }
      if (playerState === "complete") {
        storyAutoCloseTimerRef.current = setTimeout(
          () => clearVisualStory(),
          STORY_COMPLETE_CLEAR_MS,
        );
        return;
      }
      if (
        playerState === "idle" &&
        state.scenes.length === 0 &&
        state.question
      ) {
        storyAutoCloseTimerRef.current = setTimeout(
          () => clearVisualStory(),
          STORY_STUCK_CLEAR_MS,
        );
      }
    });
    return () => {
      unsubscribe();
      if (storyAutoCloseTimerRef.current)
        clearTimeout(storyAutoCloseTimerRef.current);
    };
  }, [activeStoryQuestion, clearVisualStory]);

  // Assistant migration effect
  const migrationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (migrationTimerRef.current) {
      clearTimeout(migrationTimerRef.current);
      migrationTimerRef.current = null;
    }
    if (
      isCRTOccluded &&
      (assistantLocation === "crt" || assistantLocation === "migrating-to-crt")
    ) {
      startMigration("to-led");
      migrationTimerRef.current = setTimeout(() => {
        setAssistantLocation("led");
        setTimeout(() => setMigrationPhrase(null), 1500);
      }, 800);
    } else if (
      !isCRTOccluded &&
      (assistantLocation === "led" || assistantLocation === "migrating-to-led")
    ) {
      startMigration("to-crt");
      migrationTimerRef.current = setTimeout(() => {
        setAssistantLocation("crt");
        setTimeout(() => setMigrationPhrase(null), 1500);
      }, 800);
    }
    return () => {
      if (migrationTimerRef.current) clearTimeout(migrationTimerRef.current);
    };
  }, [isCRTOccluded]); // eslint-disable-line react-hooks/exhaustive-deps

  const showAssistantInCRT =
    assistantLocation === "crt" || assistantLocation === "migrating-to-led";
  const showAssistantInLED =
    assistantLocation === "led" || assistantLocation === "migrating-to-crt";
  const isMigrating =
    assistantLocation === "migrating-to-led" ||
    assistantLocation === "migrating-to-crt";
  const handleMigrationComplete = useCallback(() => {}, []);

  // Content position based on display state
  useEffect(() => {
    if (activeStoryQuestion) {
      setContentPosition(null);
      return;
    }
    if (codeDisplayState.active) {
      setContentPosition(codeDisplayState.fullscreen ? null : "left");
    } else if (
      browserState.mode === "reader" ||
      browserState.mode === "results"
    ) {
      setContentPosition("left");
    } else if (diagramState.active) {
      setContentPosition("left");
    } else if (
      displayContent.type === "image" ||
      displayContent.type === "generating"
    ) {
      setContentPosition("left");
    } else if (displayContent.type === "list") {
      setContentPosition("left");
    } else if (displayContent.type === "visualization") {
      setContentPosition("left");
    } else if (displayContent.type === "text") {
      setContentPosition(null);
    } else {
      setContentPosition(null);
    }
  }, [
    displayContent.type,
    browserState.mode,
    browserState.readerContent,
    browserState.searchResults,
    diagramState.active,
    codeDisplayState.active,
    codeDisplayState.fullscreen,
    activeStoryQuestion,
  ]);

  // Wireframe
  const wireframeColor =
    {
      green: "#33ff33",
      amber: "#ffaa00",
      red: "#ff4444",
      blue: "#4488ff",
      white: "#ffffff",
    }[phosphorColor] || "#ffaa00";
  const clearWireframe = useVoice31Store((s) => s.clearWireframe);
  useEffect(() => {
    if (wireframeState.active && wireframeState.duration > 0) {
      const remaining = Math.max(
        0,
        wireframeState.duration - (Date.now() - wireframeState.startTime),
      );
      const timer = setTimeout(() => clearWireframe(), remaining);
      return () => clearTimeout(timer);
    }
  }, [
    wireframeState.active,
    wireframeState.startTime,
    wireframeState.duration,
    clearWireframe,
  ]);

  // Resize observer
  useEffect(() => {
    if (!containerRef.current) return;
    const calculateOptimalSize = (
      containerWidth: number,
      containerHeight: number,
    ) => {
      // In RPG mode, CRT fills all space — no constraint, no FX panel
      if (rpgModeActive) {
        return {
          width: Math.floor(containerWidth / 2) * 2,
          height: Math.floor(containerHeight / 2) * 2,
        };
      }

      const availableHeight = containerHeight - FX_PANEL_HEIGHT - 16;
      const notesPanelWidth = memoryState.editorVisible ? 356 : 0;
      const availableWidth =
        containerWidth - 16 - notesPanelWidth - SIDEBAR_WIDTH;

      // 'none' mode: fill available space (no aspect ratio constraint)
      if (aspectRatioMode === "none") {
        return {
          width: Math.floor(Math.max(360, availableWidth) / 2) * 2,
          height: Math.floor(Math.max(203, availableHeight) / 2) * 2,
        };
      }

      const aspectRatio = aspectRatioMode === "4:3" ? 4 / 3 : 16 / 9;
      let displayHeight = availableHeight;
      let displayWidth = displayHeight * aspectRatio;
      if (displayWidth > availableWidth) {
        displayWidth = availableWidth;
        displayHeight = displayWidth / aspectRatio;
      }
      displayWidth = Math.max(360, Math.min(1920, displayWidth));
      displayHeight = Math.max(203, Math.min(1080, displayHeight));
      return {
        width: Math.floor(displayWidth / 2) * 2,
        height: Math.floor(displayHeight / 2) * 2,
      };
    };
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const { width, height } = entry.contentRect;
        setSize(calculateOptimalSize(width, height));
      }
    });
    observer.observe(containerRef.current);
    const handleFullscreenChange = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setSize(calculateOptimalSize(rect.width, rect.height));
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    window.addEventListener("resize", handleFullscreenChange);
    return () => {
      observer.disconnect();
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      window.removeEventListener("resize", handleFullscreenChange);
    };
  }, [memoryState.editorVisible, rpgModeActive, aspectRatioMode]);

  const styledColors = getPhosphorColors(phosphorColor);

  // =========================================================================
  // RPG MODE: Fullscreen CRT + Always-visible Sidebar
  // =========================================================================
  if (rpgModeActive) {
    return (
      <div
        ref={containerRef}
        className="relative w-full h-full flex bg-black overflow-hidden"
      >
        {/* CRT Screen — fills remaining space */}
        <div className="flex-1 relative flex flex-col min-w-0">
          <CRTScreenBoundary
            width={size.width}
            height={size.height}
            phosphorColor={phosphorColor}
            fullscreen
          >
            {/* RPG Visual Layers */}
            <RPGVisualLayers
              width={size.width}
              height={size.height}
              phosphorColor={phosphorColor}
            />

            {/* Ambient Background Layer (Visual Intelligence) */}
            <AmbientBackgroundLayer />

            {/* Dynamic Content Overlay */}
            <ContentRenderer
              size={size}
              phosphorColor={phosphorColor}
              rpgModeActive={true}
              activeStoryQuestion={activeStoryQuestion}
              clearVisualStory={clearVisualStory}
            />

            {/* Effects Layer */}
            {activeEffect && activeEffect.type && (
              <Voice31Effects
                effect={activeEffect}
                width={size.width}
                height={size.height}
              />
            )}

            {/* Processing indicator — visible feedback when assistant is thinking */}
            {isThinking && <ThinkingIndicator phosphorColor={phosphorColor} />}

            {/* Text chat input (text/fallback mode) */}
            {isTextMode && textCtx && (
              <TextChatInput onSend={textCtx.sendMessage} phosphorColor={phosphorColor} />
            )}

            {/* Fallback alert overlay */}
            {fallbackAlertVisible && <FallbackAlert />}
          </CRTScreenBoundary>
        </div>

        {/* Always-visible RPG Sidebar */}
        {currentSaveFile && <Voice31RPGSidebar phosphorColor={phosphorColor} />}

        {/* ControlBar - only RPG toggle + settings when in RPG mode */}
        <ControlBar />

        {/* Settings Panel Overlay */}
        <Voice31Settings />

        {/* RPG Character Creator Modal */}
        {characterCreatorOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
            <Voice31RPGCharacterCreator
              phosphorColor={phosphorColor}
              onClose={() => setShowCharacterCreator(false)}
              onComplete={(saveId) => {
                console.log("[RPG] Character created, save ID:", saveId);
                setShowCharacterCreator(false);
              }}
            />
          </div>
        )}

        {/* RPG Save File / Journal Modal */}
        {saveFileViewerOpen && currentSaveFile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
            <div className="relative w-full max-w-4xl max-h-[90vh]">
              <Voice31RPGSaveFile onClose={() => toggleSaveFileViewer()} />
            </div>
          </div>
        )}

        {/* Scene Inspector side panel */}
        {sceneInspectorOpen && <Voice31SceneInspector height={size.height} />}

      </div>
    );
  }

  // Screen type visual parameters — affects CRT shader intensity
  const screenParams = {
    crt: {
      barrelPower: 0.12,
      scanlineIntensity: 0.3,
      pixelSize: 2.0,
      brandText: "VOICE26 SYSTEM",
    },
    modern: {
      barrelPower: 0,
      scanlineIntensity: 0,
      pixelSize: 1.0,
      brandText: "VOICE31",
    },
    terminal: {
      barrelPower: 0.05,
      scanlineIntensity: 0.45,
      pixelSize: 2.5,
      brandText: "TERM://VOICE31",
    },
    hologram: {
      barrelPower: 0.08,
      scanlineIntensity: 0.12,
      pixelSize: 1.5,
      brandText: "HOLO-V31",
    },
    minimal: {
      barrelPower: 0,
      scanlineIntensity: 0,
      pixelSize: 1.0,
      brandText: "",
    },
  }[screenType] || {
    barrelPower: 0.12,
    scanlineIntensity: 0.3,
    pixelSize: 2.0,
    brandText: "VOICE26 SYSTEM",
  };

  // =========================================================================
  // STANDARD MODE: 4:3 CRT + AudioFX panel + Sidebar
  // =========================================================================
  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex bg-black overflow-hidden"
    >
      {/* Main area: CRT centered */}
      <div className="flex-1 relative flex flex-col items-center justify-end overflow-hidden">
        {/* Main CRT + Panel Assembly + optional Notes side panel */}
        <div
          className="relative flex items-end"
          style={{ filter: `drop-shadow(0 0 40px ${styledColors.glow}15)` }}
        >
          {/* CRT + AudioFX vertical stack */}
          <div className="relative flex flex-col items-center">
            <CRTScreenBoundary
              width={size.width}
              height={size.height}
              phosphorColor={phosphorColor}
            >
              {/* CRT Display Base — parameters vary by screenType */}
              <VoiceDisplayPro
                phosphorColor={phosphorColor}
                width={size.width}
                height={size.height}
                barrelPower={screenParams.barrelPower}
                scanlineIntensity={screenParams.scanlineIntensity}
                pixelSize={screenParams.pixelSize}
                text=""
                isListening={isListening}
                isSpeaking={isSpeaking}
                isThinking={isThinking}
                transcript=""
                visualizerData={visualizerData}
                showStatusBar={screenType !== "minimal"}
                showVisualizerBars={screenType !== "minimal"}
                brandText={screenParams.brandText}
                bezel={false}
              />

              {/* Ambient Background Layer (Visual Intelligence) */}
              <AmbientBackgroundLayer />

              {/* Assistant Visual (INSIDE CRT) — switches based on assistantVisual setting */}
              {showAssistantInCRT && assistantVisual !== "none" && (
                <div
                  style={{
                    opacity: assistantLocation === "migrating-to-led" ? 0 : 1,
                    transition: "opacity 400ms ease-in-out",
                  }}
                >
                  {assistantVisual === "binary" && (
                    <BinaryAssistant
                      phosphorColor={phosphorColor}
                      width={size.width}
                      height={size.height}
                      contentPosition={contentPosition}
                      isThinking={isThinking}
                    />
                  )}
                  {assistantVisual === "waveform" && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                      <div
                        className="flex items-center gap-[3px]"
                        style={{ height: "40%", width: "30%" }}
                      >
                        {Array.from({ length: 24 }, (_, i) => {
                          const base = isSpeaking
                            ? 0.6
                            : isListening
                              ? 0.4
                              : isThinking
                                ? 0.3
                                : 0.15;
                          const color =
                            {
                              green: "#33ff33",
                              amber: "#ffaa00",
                              red: "#ff4444",
                              blue: "#4488ff",
                              white: "#ffffff",
                            }[phosphorColor] || "#ffaa00";
                          return (
                            <div
                              key={i}
                              className="flex-1 rounded-sm"
                              style={{
                                background: color,
                                height: `${(base + Math.sin(Date.now() * 0.005 + i * 0.5) * 0.2) * 100}%`,
                                opacity: 0.7,
                                boxShadow: `0 0 6px ${color}60`,
                                animation: `waveBar ${0.4 + i * 0.05}s ease-in-out infinite alternate`,
                              }}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {assistantVisual === "orb" && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                      <div
                        style={{
                          width: isSpeaking
                            ? "120px"
                            : isListening
                              ? "100px"
                              : "80px",
                          height: isSpeaking
                            ? "120px"
                            : isListening
                              ? "100px"
                              : "80px",
                          borderRadius: "50%",
                          background: `radial-gradient(circle at 35% 35%, ${{ green: "#33ff33", amber: "#ffaa00", red: "#ff4444", blue: "#4488ff", white: "#ffffff" }[phosphorColor] || "#ffaa00"}40, ${{ green: "#33ff33", amber: "#ffaa00", red: "#ff4444", blue: "#4488ff", white: "#ffffff" }[phosphorColor] || "#ffaa00"}10)`,
                          boxShadow: `0 0 ${isSpeaking ? 60 : isListening ? 40 : 20}px ${{ green: "#33ff33", amber: "#ffaa00", red: "#ff4444", blue: "#4488ff", white: "#ffffff" }[phosphorColor] || "#ffaa00"}50, inset 0 0 ${isSpeaking ? 30 : 15}px ${{ green: "#33ff33", amber: "#ffaa00", red: "#ff4444", blue: "#4488ff", white: "#ffffff" }[phosphorColor] || "#ffaa00"}30`,
                          transition: "all 0.6s ease-in-out",
                          animation: isThinking
                            ? "orbPulse 1.5s ease-in-out infinite"
                            : "orbFloat 4s ease-in-out infinite",
                        }}
                      />
                    </div>
                  )}
                  {assistantVisual === "avatar" && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                      <div
                        className="text-center"
                        style={{
                          color:
                            {
                              green: "#33ff33",
                              amber: "#ffaa00",
                              red: "#ff4444",
                              blue: "#4488ff",
                              white: "#ffffff",
                            }[phosphorColor] || "#ffaa00",
                          textShadow: `0 0 10px ${{ green: "rgba(51, 255, 51, 0.5)", amber: "rgba(255, 170, 0, 0.5)", red: "rgba(255, 68, 68, 0.5)", blue: "rgba(68, 136, 255, 0.5)", white: "rgba(255, 255, 255, 0.5)" }[phosphorColor] || "rgba(255, 170, 0, 0.5)"}`,
                        }}
                      >
                        <div
                          className="font-mono text-6xl mb-2"
                          style={{ opacity: isSpeaking ? 1 : 0.7 }}
                        >
                          {isSpeaking
                            ? "(o_o)"
                            : isListening
                              ? "(^_^)"
                              : isThinking
                                ? "(._.)"
                                : "(-_-)"}
                        </div>
                        <div className="font-mono text-xs opacity-50">
                          VOICE31
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Persistent Image Layer */}
              {persistentImage && (
                <div
                  className="absolute inset-0 z-8 flex items-center justify-center pointer-events-none"
                  style={{ opacity: persistentImage.opacity * 0.7 }}
                >
                  <div
                    className={`relative ${persistentImage.position === "left" ? "mr-auto ml-8" : persistentImage.position === "right" ? "ml-auto mr-8" : ""}`}
                    style={{
                      maxWidth:
                        persistentImage.position === "background"
                          ? "60%"
                          : "45%",
                      maxHeight: "70%",
                    }}
                  >
                    <img
                      src={persistentImage.url}
                      alt={persistentImage.prompt || "Persistent image"}
                      className="max-w-full max-h-full object-contain rounded-lg"
                      style={{
                        filter: "brightness(0.8) contrast(1.1)",
                        boxShadow: `0 0 30px rgba(${phosphorColor === "green" ? "51, 255, 51" : phosphorColor === "amber" ? "255, 170, 0" : phosphorColor === "red" ? "255, 68, 68" : phosphorColor === "blue" ? "68, 136, 255" : "255, 255, 255"}, 0.4)`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Dynamic Content Overlay (INSIDE CRT) */}
              <ContentRenderer
                size={size}
                phosphorColor={phosphorColor}
                rpgModeActive={false}
                activeStoryQuestion={activeStoryQuestion}
                clearVisualStory={clearVisualStory}
              />

              {/* Progressive Renderer */}
              {!(activeStoryQuestion || codeDisplayState.active) &&
                browserState.mode === "off" &&
                !diagramState.active &&
                displayContent.type !== "image" &&
                displayContent.type !== "generating" &&
                displayContent.type !== "visualization" && (
                  <Voice31ProgressiveRenderer
                    width={size.width}
                    height={size.height}
                  />
                )}

              {/* Overlay Text */}
              {overlayText && displayContent.type !== "text" && (
                <div
                  className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 60%, transparent 100%)",
                    padding: "40px 32px 24px",
                  }}
                >
                  <div
                    className="font-mono text-center leading-relaxed"
                    style={{
                      color:
                        {
                          green: "#33ff33",
                          amber: "#ffaa00",
                          red: "#ff4444",
                          blue: "#4488ff",
                          white: "#ffffff",
                        }[phosphorColor] || "#ffaa00",
                      fontSize: `${Math.max(16, Math.min(24, size.width / 35))}px`,
                      textShadow: `0 0 10px ${{ green: "rgba(51, 255, 51, 0.5)", amber: "rgba(255, 170, 0, 0.5)", red: "rgba(255, 68, 68, 0.5)", blue: "rgba(68, 136, 255, 0.5)", white: "rgba(255, 255, 255, 0.5)" }[phosphorColor] || "rgba(255, 170, 0, 0.5)"}`,
                      maxHeight: "30%",
                      overflow: "hidden",
                    }}
                  >
                    {overlayText}
                  </div>
                </div>
              )}

              {/* Effects Layer */}
              {activeEffect && activeEffect.type && (
                <Voice31Effects
                  effect={activeEffect}
                  width={size.width}
                  height={size.height}
                />
              )}

              {/* 3D Wireframe Layer */}
              <div
                className="absolute inset-0 z-5 pointer-events-none"
                style={{
                  opacity: wireframeState.active ? 1 : 0,
                  transition: "opacity 0.3s ease-out",
                  pointerEvents: "none",
                }}
              >
                <WireframeObjectLayer
                  enabled={wireframeState.active}
                  mode="manual-only"
                  toolTriggered={wireframeState.active}
                  semanticType={
                    (wireframeState.semanticType || "abstract") as any
                  }
                  seed={`voice31-${wireframeState.semanticType || "abstract"}-${wireframeState.startTime}`}
                  labels={wireframeState.labels}
                  color={wireframeColor}
                  glowColor={wireframeColor}
                  opacity={0.35}
                  speed={0.5}
                  density={0.7}
                  glow={true}
                  animateEntrance={true}
                />
              </div>

              {/* Processing indicator — visible feedback when assistant is thinking */}
              {isThinking && <ThinkingIndicator phosphorColor={phosphorColor} />}

              {/* Text chat input (text/fallback mode) */}
              {isTextMode && textCtx && (
                <TextChatInput onSend={textCtx.sendMessage} phosphorColor={phosphorColor} />
              )}

              {/* Fallback alert overlay */}
              {fallbackAlertVisible && <FallbackAlert />}
            </CRTScreenBoundary>

            {/* Migration effect */}
            {isMigrating && (
              <AssistantMigrationEffect
                direction={
                  assistantLocation === "migrating-to-led" ? "to-led" : "to-crt"
                }
                width={size.width}
                junctionY={size.height + 8}
                phosphorColor={phosphorColor}
                onComplete={handleMigrationComplete}
                phrase={migrationPhrase}
              />
            )}

            {/* Audio FX Panel */}
            <div
              className="relative"
              style={{
                width: size.width,
                height: FX_PANEL_HEIGHT,
                background: "linear-gradient(180deg, #1a1a18 0%, #141412 100%)",
                borderRadius: "0 0 16px 16px",
                padding: "0 8px 8px 8px",
                boxShadow:
                  "inset 0 -2px 4px rgba(0,0,0,0.3), 0 4px 20px rgba(0,0,0,0.5)",
              }}
            >
              <div
                className="absolute top-0 left-8 right-8 h-1 rounded-full transition-all duration-300"
                style={{
                  background: isMigrating
                    ? `linear-gradient(90deg, transparent 0%, ${styledColors.glow}60 15%, ${styledColors.glow}90 50%, ${styledColors.glow}60 85%, transparent 100%)`
                    : `linear-gradient(90deg, transparent 0%, ${styledColors.glow}30 20%, ${styledColors.glow}50 50%, ${styledColors.glow}30 80%, transparent 100%)`,
                  boxShadow: isMigrating
                    ? `0 0 20px ${styledColors.glow}80, 0 0 40px ${styledColors.glow}40`
                    : `0 0 8px ${styledColors.glow}40`,
                  height: isMigrating ? "3px" : "4px",
                }}
              />
              <div
                className="absolute top-2 left-3 w-2 h-2 rounded-full opacity-40"
                style={{
                  background:
                    "radial-gradient(circle at 30% 30%, #555 0%, #222 100%)",
                  boxShadow:
                    "inset 0 1px 1px rgba(255,255,255,0.2), inset 0 -1px 1px rgba(0,0,0,0.5)",
                }}
              />
              <div
                className="absolute top-2 right-3 w-2 h-2 rounded-full opacity-40"
                style={{
                  background:
                    "radial-gradient(circle at 30% 30%, #555 0%, #222 100%)",
                  boxShadow:
                    "inset 0 1px 1px rgba(255,255,255,0.2), inset 0 -1px 1px rgba(0,0,0,0.5)",
                }}
              />
              <CelestialCanvas
                width={size.width - 16}
                height={FX_PANEL_HEIGHT - 8}
                color="#8ab4ff"
                intensity={0.6}
              />
              <Voice31AudioFX
                embedded={true}
                width={size.width - 16}
                height={FX_PANEL_HEIGHT - 8}
                showAssistant={showAssistantInLED}
              />
            </div>
          </div>
          {/* end CRT+AudioFX vertical stack */}

          {/* Note Editor side panel */}
          {memoryState.editorVisible && (
            <Voice31NoteEditor height={size.height + FX_PANEL_HEIGHT} />
          )}
        </div>

        {/* Control bar (absolute positioned, not fixed) */}
        <ControlBar />

        {/* Settings Panel Overlay */}
        <Voice31Settings />
      </div>
      {/* end main CRT area */}

      {/* Always-visible Sidebar */}
      <div
        className="h-full border-l flex-shrink-0"
        style={{
          width: SIDEBAR_WIDTH,
          borderColor: `${styledColors.glow}15`,
          background: "linear-gradient(180deg, #0a0a0a 0%, #060606 100%)",
        }}
      >
        <Voice31SidePanel />
      </div>

      <style jsx>{`
        @keyframes waveBar {
          0% { transform: scaleY(0.3); }
          100% { transform: scaleY(1); }
        }
        @keyframes orbPulse {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.15); opacity: 1; }
        }
        @keyframes orbFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
};

// Main export wrapped in RPG Provider
export const Voice31Display: React.FC = () => {
  return (
    <Voice31RPGProvider>
      <Voice31DisplayInner />
    </Voice31RPGProvider>
  );
};

export type { CRTScreenBoundaryProps } from "./display";
// Re-export sub-components for external use
export { CRTScreenBoundary, getPhosphorColors } from "./display";

export default Voice31Display;
