'use client';

import React from 'react';
import type { SceneRendererProps, TickerFactsData } from '../types';
import { easeOutCubic, stagger } from '@/lib/storytelling/easing';
import { BackgroundRenderer, GridLines } from '../primitives';

export const TickerFactsScene: React.FC<SceneRendererProps> = ({
  scene,
  progress,
  width,
  height,
  accentColor,
}) => {
  const data = scene.data as TickerFactsData;

  return (
    <BackgroundRenderer accent={accentColor} bg={scene.bg} bgGradient={scene.bgGradient} sceneType={scene.type} progress={progress} width={width} height={height}>
      <GridLines color={accentColor} opacity={0.04} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '8% 10%',
          gap: 16,
        }}
      >
        {data.facts.map((fact, i) => {
          const delay = stagger(i, data.facts.length, 0.05, 0.4);
          const factProgress = easeOutCubic(Math.max(0, Math.min(1, (progress - delay) / 0.4)));

          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 20px',
                background: `linear-gradient(90deg, ${accentColor}10, transparent)`,
                borderLeft: `3px solid ${accentColor}`,
                borderRadius: '0 6px 6px 0',
                opacity: factProgress,
                transform: `translateX(${(1 - factProgress) * -20}px)`,
              }}
            >
              <span
                style={{
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontSize: Math.max(13, Math.min(16, width / 40)),
                  fontWeight: 500,
                  color: 'rgba(255,255,255,0.7)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                {fact.label}
              </span>
              <span
                style={{
                  fontFamily: "'Space Grotesk', system-ui, sans-serif",
                  fontSize: Math.max(18, Math.min(28, width / 22)),
                  fontWeight: 700,
                  color: accentColor,
                  textShadow: `0 0 12px ${accentColor}40`,
                }}
              >
                {fact.value}
              </span>
            </div>
          );
        })}
      </div>
    </BackgroundRenderer>
  );
};
