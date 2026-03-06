'use client';

import React from 'react';
import type { SceneEntry } from './types';

interface SceneIndicatorBarProps {
  scenes: SceneEntry[];
  currentIndex: number;
  progress: number;
  accentColor: string;
  onSceneClick: (index: number) => void;
}

export const SceneIndicatorBar: React.FC<SceneIndicatorBarProps> = ({
  scenes,
  currentIndex,
  progress,
  accentColor,
  onSceneClick,
}) => {
  if (scenes.length === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        gap: 4,
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 16px',
      }}
    >
      {scenes.map((entry, i) => {
        const isCurrent = i === currentIndex;
        const isComplete = entry.status === 'complete';
        const isReady = entry.status === 'ready';
        const isPending = entry.status === 'pending' || entry.status === 'narrating';

        return (
          <button
            key={entry.scene.id}
            onClick={() => (isReady || isComplete) && onSceneClick(i)}
            style={{
              width: isCurrent ? 24 : 8,
              height: 8,
              borderRadius: 4,
              border: 'none',
              cursor: isReady || isComplete ? 'pointer' : 'default',
              background: isCurrent
                ? accentColor
                : isComplete
                  ? `${accentColor}80`
                  : isReady
                    ? `${accentColor}40`
                    : 'rgba(255,255,255,0.15)',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden',
              padding: 0,
            }}
          >
            {/* Progress fill for current scene */}
            {isCurrent && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  bottom: 0,
                  width: `${progress * 100}%`,
                  background: '#ffffff',
                  borderRadius: 4,
                  opacity: 0.4,
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};
