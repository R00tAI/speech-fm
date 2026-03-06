'use client';

import React, { useMemo } from 'react';
import type { SceneRendererProps, KineticTextData } from '../types';
import { easeOutCubic } from '@/lib/storytelling/easing';
import { BackgroundRenderer } from '../primitives';

// Animation implementations for each kinetic text style
function getWordStyle(
  animation: KineticTextData['animation'],
  wordIndex: number,
  totalWords: number,
  progress: number,
  isEmphasis: boolean,
  accentColor: string,
): React.CSSProperties {
  const stagger = wordIndex / totalWords;
  const wordProgress = easeOutCubic(Math.max(0, Math.min(1, (progress - stagger * 0.3) * 2.5)));

  const base: React.CSSProperties = {
    display: 'inline-block',
    marginRight: '0.3em',
    color: isEmphasis ? accentColor : '#ffffff',
    fontWeight: isEmphasis ? 800 : 400,
    textShadow: isEmphasis ? `0 0 30px ${accentColor}50` : 'none',
  };

  switch (animation) {
    case 'typewriter':
      return {
        ...base,
        opacity: wordProgress > 0.1 ? 1 : 0,
        borderRight: wordIndex === Math.floor(progress * totalWords)
          ? '2px solid rgba(255,255,255,0.7)'
          : 'none',
      };

    case 'wordPop':
      return {
        ...base,
        opacity: wordProgress,
        transform: `scale(${0.3 + wordProgress * 0.7}) translateY(${(1 - wordProgress) * 20}px)`,
      };

    case 'waveText': {
      const wave = Math.sin((progress * Math.PI * 4) - (wordIndex * 0.5)) * 8;
      return {
        ...base,
        opacity: wordProgress,
        transform: `translateY(${wordProgress > 0.5 ? wave : (1 - wordProgress) * 30}px)`,
      };
    }

    case 'splitReveal': {
      const isTop = wordIndex < totalWords / 2;
      return {
        ...base,
        opacity: wordProgress,
        transform: isTop
          ? `translateY(${(1 - wordProgress) * -40}px)`
          : `translateY(${(1 - wordProgress) * 40}px)`,
        clipPath: wordProgress < 1 ? 'inset(0)' : 'none',
      };
    }

    case 'glitchText': {
      const glitchOffset = wordProgress < 0.8
        ? (Math.random() - 0.5) * (1 - wordProgress) * 10
        : 0;
      const glitchColor = wordProgress < 0.7 && Math.random() > 0.7;
      return {
        ...base,
        opacity: wordProgress > 0.05 ? 1 : 0,
        transform: `translate(${glitchOffset}px, ${glitchOffset * 0.5}px)`,
        color: glitchColor
          ? ['#ff0040', '#00ff40', '#4040ff'][Math.floor(Math.random() * 3)]
          : (isEmphasis ? accentColor : '#ffffff'),
      };
    }

    default:
      return { ...base, opacity: wordProgress };
  }
}

const SIZE_MAP: Record<KineticTextData['size'], number> = {
  hero: 56,
  heading: 36,
  body: 22,
};

export const KineticTextScene: React.FC<SceneRendererProps> = ({
  scene,
  progress,
  width,
  height,
  accentColor,
}) => {
  const data = scene.data as KineticTextData;
  const words = useMemo(() => data.text.split(/\s+/), [data.text]);
  const emphasisSet = useMemo(
    () => new Set((data.emphasis || []).map(w => w.toLowerCase())),
    [data.emphasis]
  );

  const baseFontSize = SIZE_MAP[data.size] || SIZE_MAP.heading;
  const fontSize = Math.max(baseFontSize * 0.6, Math.min(baseFontSize, width / 12));

  return (
    <BackgroundRenderer accent={accentColor} bg={scene.bg} bgGradient={scene.bgGradient} sceneType={scene.type} progress={progress} width={width} height={height}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '10% 14%',
        }}
      >
        <div
          style={{
            maxWidth: 700,
            textAlign: data.size === 'hero' ? 'center' : 'left',
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize,
            lineHeight: 1.4,
            letterSpacing: data.size === 'hero' ? '-0.02em' : '0',
          }}
        >
          {words.map((word, i) => {
            const isEmphasis = emphasisSet.has(word.toLowerCase().replace(/[^a-z0-9]/g, ''));
            const style = getWordStyle(
              data.animation,
              i,
              words.length,
              progress,
              isEmphasis,
              accentColor,
            );
            return (
              <span key={i} style={style}>
                {word}
              </span>
            );
          })}
        </div>
      </div>
    </BackgroundRenderer>
  );
};
