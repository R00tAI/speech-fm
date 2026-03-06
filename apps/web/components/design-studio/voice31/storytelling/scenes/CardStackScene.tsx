'use client';

import React from 'react';
import type { SceneRendererProps, CardStackData } from '../types';
import { easeOutCubic, easeOutBack, stagger } from '@/lib/storytelling/easing';
import { BackgroundRenderer } from '../primitives';

export const CardStackScene: React.FC<SceneRendererProps> = ({
  scene,
  progress,
  width,
  height,
  accentColor,
}) => {
  const data = scene.data as CardStackData;
  const cardWidth = Math.min(280, width * 0.35);

  return (
    <BackgroundRenderer accent={accentColor} bg={scene.bg} bgGradient={scene.bgGradient} sceneType={scene.type} progress={progress} width={width} height={height}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          padding: '8%',
          flexWrap: 'wrap',
        }}
      >
        {data.cards.map((card, i) => {
          const delay = stagger(i, data.cards.length, 0.05, 0.4);
          const cardProgress = easeOutBack(Math.max(0, Math.min(1, (progress - delay) / 0.5)));

          return (
            <div
              key={i}
              style={{
                width: cardWidth,
                padding: '20px 18px',
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${accentColor}25`,
                borderRadius: 12,
                opacity: cardProgress,
                transform: `translateY(${(1 - cardProgress) * 30}px) scale(${0.9 + cardProgress * 0.1})`,
                boxShadow: `0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px ${accentColor}10`,
              }}
            >
              <div
                style={{
                  fontFamily: "'Space Grotesk', system-ui, sans-serif",
                  fontSize: 16,
                  fontWeight: 700,
                  color: accentColor,
                  marginBottom: 8,
                }}
              >
                {card.title}
              </div>
              <div
                style={{
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontSize: 13,
                  fontWeight: 400,
                  color: 'rgba(255,255,255,0.6)',
                  lineHeight: 1.5,
                }}
              >
                {card.body}
              </div>
            </div>
          );
        })}
      </div>
    </BackgroundRenderer>
  );
};
