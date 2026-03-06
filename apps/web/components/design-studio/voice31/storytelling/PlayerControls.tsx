'use client';

import React from 'react';
import { Play, Pause, SkipForward, SkipBack, X } from '@phosphor-icons/react';
import type { PlayerState } from './types';

interface PlayerControlsProps {
  playerState: PlayerState;
  onPlay: () => void;
  onPause: () => void;
  onSkipForward: () => void;
  onSkipBack: () => void;
  onClose: () => void;
  accentColor: string;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  playerState,
  onPlay,
  onPause,
  onSkipForward,
  onSkipBack,
  onClose,
  accentColor,
}) => {
  const isPlaying = playerState === 'playing';
  const canInteract = playerState === 'playing' || playerState === 'paused';

  const buttonStyle = (active?: boolean): React.CSSProperties => ({
    background: active ? `${accentColor}25` : 'rgba(255,255,255,0.06)',
    border: `1px solid ${active ? accentColor : 'rgba(255,255,255,0.1)'}`,
    borderRadius: 8,
    padding: 8,
    cursor: 'pointer',
    color: active ? accentColor : 'rgba(255,255,255,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  });

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      {/* Skip back */}
      <button
        onClick={onSkipBack}
        disabled={!canInteract}
        style={buttonStyle()}
        title="Previous scene"
      >
        <SkipBack size={16} weight="fill" />
      </button>

      {/* Play/Pause */}
      <button
        onClick={isPlaying ? onPause : onPlay}
        disabled={!canInteract && playerState !== 'paused'}
        style={buttonStyle(true)}
        title={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? (
          <Pause size={20} weight="fill" />
        ) : (
          <Play size={20} weight="fill" />
        )}
      </button>

      {/* Skip forward */}
      <button
        onClick={onSkipForward}
        disabled={!canInteract}
        style={buttonStyle()}
        title="Next scene"
      >
        <SkipForward size={16} weight="fill" />
      </button>

      {/* Close */}
      <button
        onClick={onClose}
        style={{
          ...buttonStyle(),
          marginLeft: 8,
        }}
        title="Close"
      >
        <X size={16} weight="bold" />
      </button>
    </div>
  );
};
