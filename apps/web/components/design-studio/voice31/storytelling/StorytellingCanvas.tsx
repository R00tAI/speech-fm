'use client';

import React, { Suspense, useState, useEffect, useRef } from 'react';
import { useStorytellingStore } from './StorytellingStore';
import { getSceneComponent } from './scenes';
import { SceneTransition, TRANSITION_DURATIONS } from './SceneTransition';
import { CaptionOverlay } from './CaptionOverlay';
import type { SceneEntry, TransitionType } from './types';

interface StorytellingCanvasProps {
  width: number;
  height: number;
  /** Progress 0→1 within current scene (driven by parent timer) */
  progress: number;
  /** Seconds since current scene started (driven by parent timer) */
  time: number;
}

// Easing for Ken Burns
function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

export const StorytellingCanvas: React.FC<StorytellingCanvasProps> = ({
  width,
  height,
  progress,
  time,
}) => {
  const playerState = useStorytellingStore((s) => s.playerState);
  const scenes = useStorytellingStore((s) => s.scenes);
  const currentSceneIndex = useStorytellingStore((s) => s.currentSceneIndex);

  const currentEntry: SceneEntry | undefined = scenes[currentSceneIndex];
  const scene = currentEntry?.scene;

  const isPlaying = playerState === 'playing';

  // Double-buffer: track previous scene for transitions
  const [isTransitioning, setIsTransitioning] = useState(false);
  const prevIndexRef = useRef(currentSceneIndex);
  const prevEntryRef = useRef<SceneEntry | undefined>(undefined);
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (currentSceneIndex !== prevIndexRef.current) {
      // Capture previous scene for double-buffer
      const prevScene = scenes[prevIndexRef.current];
      if (prevScene) {
        prevEntryRef.current = prevScene;
      }

      setIsTransitioning(true);

      // Use actual transition duration
      const transType: TransitionType = scene?.transition || 'fade';
      const transDuration = TRANSITION_DURATIONS[transType] || 800;

      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = setTimeout(() => {
        setIsTransitioning(false);
        prevEntryRef.current = undefined;
      }, transDuration + 50);

      prevIndexRef.current = currentSceneIndex;
      return () => {
        if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
      };
    }
  }, [currentSceneIndex, scene, scenes]);

  if (!scene) {
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: '#0a0a0a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {(playerState === 'generating' || playerState === 'buffering') && (
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.3)',
              animation: 'storyPulse 1.5s ease-in-out infinite',
            }}
          />
        )}
        <style>{`@keyframes storyPulse { 0%, 100% { opacity: 0.2; transform: scale(0.8); } 50% { opacity: 0.6; transform: scale(1.2); } }`}</style>
      </div>
    );
  }

  const SceneComponent = getSceneComponent(scene.type);
  if (!SceneComponent) {
    console.warn('[StorytellingCanvas] No component for scene type:', scene.type);
    return null;
  }

  const accentColor = scene.accent || '#ffaa00';

  // Ken Burns camera motion
  const kbProgress = easeInOutSine(progress);
  const panDirection = currentSceneIndex % 2 === 0 ? 1 : -1;
  const kenBurnsTransform = `scale(${1 + kbProgress * 0.03}) translate(${-kbProgress * 5 * panDirection}px, ${-kbProgress * 3}px)`;

  // Scene entrance animation (first 10% of progress)
  const entranceProgress = Math.min(progress / 0.1, 1);
  const entranceOpacity = entranceProgress;
  const entranceTranslateY = (1 - entranceProgress) * 20;
  const entranceScale = 0.98 + entranceProgress * 0.02;

  // Render outgoing scene for double-buffer
  const prevEntry = prevEntryRef.current;
  let outgoingNode: React.ReactNode | null = null;
  if (isTransitioning && prevEntry) {
    const PrevComponent = getSceneComponent(prevEntry.scene.type);
    if (PrevComponent) {
      outgoingNode = (
        <div style={{ position: 'absolute', inset: 0, transform: kenBurnsTransform }}>
          <PrevComponent
            scene={prevEntry.scene}
            progress={1}
            time={prevEntry.scene.duration}
            isActive={false}
            width={width}
            height={height}
            accentColor={prevEntry.scene.accent || '#ffaa00'}
          />
        </div>
      );
    }
  }

  // Suppress captions for scenes where text IS the visual or where the scene
  // renders its own headline/caption overlay at the bottom (avoids double text)
  const suppressCaption =
    scene.type === 'kinetic_title' ||
    scene.type === 'quote' ||
    scene.type.startsWith('cinematic_');

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <SceneTransition
        type={scene.transition || 'fade'}
        isTransitioning={isTransitioning}
        outgoing={outgoingNode}
      >
        {/* Ken Burns wrapper */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transform: kenBurnsTransform,
            willChange: 'transform',
          }}
        >
          {/* Entrance animation wrapper */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              opacity: entranceOpacity,
              transform: `translateY(${entranceTranslateY}px) scale(${entranceScale})`,
              willChange: 'opacity, transform',
            }}
          >
            <Suspense fallback={<div style={{ position: 'absolute', inset: 0, background: scene.bg || '#000' }} />}>
              <SceneComponent
                scene={scene}
                progress={progress}
                time={time}
                isActive={isPlaying}
                width={width}
                height={height}
                accentColor={accentColor}
              />
            </Suspense>
          </div>
        </div>
      </SceneTransition>

      {/* Caption overlay — suppressed for kinetic_title and quote scenes */}
      {!suppressCaption && (
        <CaptionOverlay
          words={scene.transcript.words}
          fullText={scene.transcript.fullText}
          currentTime={time}
          accentColor={accentColor}
          visible={isPlaying || playerState === 'paused'}
        />
      )}
    </div>
  );
};
