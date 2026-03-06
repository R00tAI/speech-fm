'use client';

import React from 'react';
import type { WordTimestamp } from './types';
import { useWordSync } from './hooks/useWordSync';

interface CaptionOverlayProps {
  words: WordTimestamp[];
  fullText: string;
  currentTime: number;
  accentColor: string;
  visible: boolean;
}

export const CaptionOverlay: React.FC<CaptionOverlayProps> = ({
  words,
  fullText,
  currentTime,
  accentColor,
  visible,
}) => {
  const activeWordIndex = useWordSync(words, currentTime);

  if (!visible || !fullText) return null;

  // Clean display text — strip [[SCENE:N]] markers
  const cleanText = fullText.replace(/\[\[SCENE:\d+\]\]/g, '').trim();

  // Shared container styles — constrained bottom-center caption bar
  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: 12,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '90%',
    maxWidth: 560,
    zIndex: 30,
    background: 'rgba(0,0,0,0.55)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderRadius: 8,
    padding: '10px 16px',
    maxHeight: '20%',
    overflow: 'hidden',
    pointerEvents: 'none',
  };

  const textStyle: React.CSSProperties = {
    fontFamily: "'Inter', system-ui, sans-serif",
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 1.5,
    maxWidth: 540,
    margin: '0 auto',
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical' as const,
    overflow: 'hidden',
  };

  // If no word timestamps, show full text
  if (!words || words.length === 0) {
    return (
      <div style={containerStyle}>
        <div style={{ ...textStyle, color: 'rgba(255,255,255,0.85)' }}>
          {cleanText}
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={textStyle}>
        {words.map((w, i) => {
          const isActive = i === activeWordIndex;
          const isCompleted = i < activeWordIndex;

          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                color: isActive
                  ? '#ffffff'
                  : isCompleted
                    ? 'rgba(255,255,255,0.55)'
                    : 'rgba(255,255,255,0.3)',
                fontWeight: isActive ? 600 : 400,
                transform: isActive ? 'scale(1.05)' : 'scale(1)',
                transition: 'color 0.15s ease, font-weight 0.15s ease, transform 0.2s ease',
                textShadow: isActive ? `0 0 12px ${accentColor}80, 0 0 4px ${accentColor}40` : 'none',
                marginRight: '0.25em',
              }}
            >
              {w.word}
            </span>
          );
        })}
      </div>
    </div>
  );
};
