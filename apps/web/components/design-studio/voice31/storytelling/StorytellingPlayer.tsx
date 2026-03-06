'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { SlidersHorizontal } from '@phosphor-icons/react';
import { AdminPanel } from './AdminPanel';
import { useStorytellingStore } from './StorytellingStore';
import { StorytellingCanvas } from './StorytellingCanvas';
import { SceneIndicatorBar } from './SceneIndicatorBar';
import { PlayerControls } from './PlayerControls';
import { usePlaybackTimer } from './hooks/usePlaybackTimer';

interface StorytellingPlayerProps {
  width: number;
  height: number;
  onClose: () => void;
}

export const StorytellingPlayer: React.FC<StorytellingPlayerProps> = ({
  width,
  height,
  onClose,
}) => {
  const playerState = useStorytellingStore((s) => s.playerState);
  const scenes = useStorytellingStore((s) => s.scenes);
  const currentSceneIndex = useStorytellingStore((s) => s.currentSceneIndex);
  const play = useStorytellingStore((s) => s.play);
  const pause = useStorytellingStore((s) => s.pause);
  const advanceScene = useStorytellingStore((s) => s.advanceScene);
  const goToScene = useStorytellingStore((s) => s.goToScene);
  const question = useStorytellingStore((s) => s.question);
  const error = useStorytellingStore((s) => s.error);
  const adminPanelVisible = useStorytellingStore((s) => s.adminPanelVisible);
  const setAdminPanelVisible = useStorytellingStore((s) => s.setAdminPanelVisible);

  const currentScene = scenes[currentSceneIndex]?.scene;
  const accentColor = currentScene?.accent || '#ffaa00';
  const isPlaying = playerState === 'playing';

  // Immersive chrome: hover state for controls visibility
  const [isHovering, setIsHovering] = useState(false);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const handleMouseMove = () => {
    setIsHovering(true);
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => setIsHovering(false), 3000);
  };

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    };
  }, []);

  // Chrome opacity: full on hover/pause, dimmed during playback
  const chromeOpacity = !isPlaying || isHovering ? 1.0 : 0.3;

  // Fade out when story completes or errors
  const [fadeOut, setFadeOut] = useState(false);
  useEffect(() => {
    if (playerState === 'complete') {
      const timer = setTimeout(() => setFadeOut(true), 3000);
      return () => clearTimeout(timer);
    } else {
      setFadeOut(false);
    }
  }, [playerState]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setFadeOut(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Single timer source of truth — drives both indicator bar and canvas
  const duration = currentScene?.duration || 5;
  const noop = React.useCallback(() => {}, []);
  const { progress, time } = usePlaybackTimer(duration, isPlaying, noop);

  const handleSkipBack = () => {
    if (currentSceneIndex > 0) {
      goToScene(currentSceneIndex - 1);
    }
  };

  const handleSkipForward = () => {
    advanceScene();
  };

  // Status text
  const statusText = useMemo(() => {
    switch (playerState) {
      case 'generating': return 'Generating scenes...';
      case 'buffering': return 'Buffering...';
      case 'playing': return `Scene ${currentSceneIndex + 1} of ${scenes.length}`;
      case 'paused': return 'Paused';
      case 'complete': return 'Story complete';
      default: return '';
    }
  }, [playerState, currentSceneIndex, scenes.length]);

  if (error) {
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: '#0a0a0a',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          opacity: fadeOut ? 0 : 1,
          transition: 'opacity 1s ease-out',
        }}
      >
        <div
          style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: 16,
            color: '#f87171',
          }}
        >
          {error}
        </div>
        <button
          onClick={onClose}
          style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: 14,
            color: 'rgba(255,255,255,0.6)',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8,
            padding: '8px 20px',
            cursor: 'pointer',
          }}
        >
          Close
        </button>
      </div>
    );
  }

  // Compute layout heights for non-overlapping zones
  const topBarHeight = 40;
  const controlsHeight = 48;
  const canvasHeight = height - topBarHeight - controlsHeight;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: '#0a0a0a',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        borderRadius: 12,
        opacity: fadeOut ? 0 : 1,
        transition: 'opacity 1.5s ease-out',
        pointerEvents: fadeOut ? 'none' : 'auto',
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
    >
      {/* Top bar - immersive fade */}
      <div
        style={{
          flexShrink: 0,
          height: topBarHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          background: 'rgba(0,0,0,0.6)',
          zIndex: 10,
          opacity: chromeOpacity,
          transition: 'opacity 400ms ease',
        }}
      >
        <div
          style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: 12,
            color: 'rgba(255,255,255,0.5)',
            letterSpacing: '0.06em',
          }}
        >
          {statusText}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <SceneIndicatorBar
            scenes={scenes}
            currentIndex={currentSceneIndex}
            progress={progress}
            accentColor={accentColor}
            onSceneClick={goToScene}
          />
          <button
            onClick={() => setAdminPanelVisible(!adminPanelVisible)}
            title="Admin Panel"
            style={{
              background: adminPanelVisible ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 4,
              padding: '3px 6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              color: adminPanelVisible ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.35)',
              transition: 'all 200ms ease',
            }}
          >
            <SlidersHorizontal size={14} />
          </button>
        </div>
      </div>

      {/* Canvas - fills remaining space */}
      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        <StorytellingCanvas
          width={width}
          height={Math.max(200, canvasHeight)}
          progress={progress}
          time={time}
        />
        {adminPanelVisible && <AdminPanel accentColor={accentColor} />}
      </div>

      {/* Bottom controls - immersive fade */}
      <div
        style={{
          flexShrink: 0,
          height: controlsHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.6)',
          zIndex: 10,
          opacity: chromeOpacity,
          transition: 'opacity 400ms ease',
        }}
      >
        <PlayerControls
          playerState={playerState}
          onPlay={play}
          onPause={pause}
          onSkipForward={handleSkipForward}
          onSkipBack={handleSkipBack}
          onClose={onClose}
          accentColor={accentColor}
        />
      </div>
    </div>
  );
};
