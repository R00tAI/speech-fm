'use client';

import React from 'react';
import type { SceneRendererProps, KineticTitleData } from '../types';
import { easeOutBack, easeOutCubic } from '@/lib/storytelling/easing';
import { BackgroundRenderer } from '../primitives';

export const KineticTitleScene: React.FC<SceneRendererProps> = ({
  scene,
  progress,
  width,
  height,
  accentColor,
}) => {
  const data = scene.data as KineticTitleData;
  const titleProgress = easeOutBack(Math.min(progress * 2, 1));
  const subtitleProgress = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.3) * 2)));
  const lineProgress = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.15) * 2)));

  const fontSize = Math.max(28, Math.min(64, width / 10));
  const subFontSize = Math.max(14, Math.min(24, width / 25));

  return (
    <BackgroundRenderer accent={accentColor} bg={scene.bg} bgGradient={scene.bgGradient} sceneType={scene.type} progress={progress} width={width} height={height}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '10%',
        }}
      >
        {/* Title */}
        <h1
          style={{
            fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
            fontSize,
            fontWeight: 800,
            color: '#ffffff',
            textAlign: 'center',
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            opacity: titleProgress,
            transform: `translateY(${(1 - titleProgress) * 30}px) scale(${0.9 + titleProgress * 0.1})`,
            textShadow: `0 0 60px ${accentColor}40`,
            margin: 0,
          }}
        >
          {data.title}
        </h1>

        {/* Accent line */}
        <div
          style={{
            width: `${lineProgress * 120}px`,
            height: 3,
            background: accentColor,
            borderRadius: 2,
            margin: '16px 0',
            boxShadow: `0 0 20px ${accentColor}80`,
            opacity: lineProgress,
          }}
        />

        {/* Subtitle */}
        {data.subtitle && (
          <p
            style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: subFontSize,
              fontWeight: 400,
              color: `${accentColor}cc`,
              textAlign: 'center',
              opacity: subtitleProgress,
              transform: `translateY(${(1 - subtitleProgress) * 15}px)`,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              margin: 0,
            }}
          >
            {data.subtitle}
          </p>
        )}
      </div>
    </BackgroundRenderer>
  );
};
