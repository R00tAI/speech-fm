'use client';

import React from 'react';
import type { SceneRendererProps, QuoteData } from '../types';
import { easeOutCubic } from '@/lib/storytelling/easing';
import { BackgroundRenderer } from '../primitives';

export const QuoteScene: React.FC<SceneRendererProps> = ({
  scene,
  progress,
  width,
  height,
  accentColor,
}) => {
  const data = scene.data as QuoteData;
  const quoteMarkProgress = easeOutCubic(Math.min(progress * 3, 1));
  const textProgress = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.1) * 2)));
  const authorProgress = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.4) * 2)));

  const fontSize = Math.max(20, Math.min(36, width / 18));

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
        <div style={{ maxWidth: 560, textAlign: 'center' }}>
          {/* Opening quote mark */}
          <div
            style={{
              fontFamily: "'Georgia', serif",
              fontSize: fontSize * 3,
              lineHeight: 0.6,
              color: `${accentColor}40`,
              opacity: quoteMarkProgress,
              transform: `scale(${0.5 + quoteMarkProgress * 0.5})`,
              marginBottom: 8,
            }}
          >
            &ldquo;
          </div>

          {/* Quote text */}
          <div
            style={{
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontSize,
              fontWeight: 400,
              fontStyle: 'italic',
              color: '#ffffff',
              lineHeight: 1.6,
              opacity: textProgress,
              transform: `translateY(${(1 - textProgress) * 12}px)`,
            }}
          >
            {data.text}
          </div>

          {/* Author */}
          {data.author && (
            <div
              style={{
                marginTop: 20,
                opacity: authorProgress,
                transform: `translateY(${(1 - authorProgress) * 8}px)`,
              }}
            >
              <div
                style={{
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontSize: 14,
                  fontWeight: 600,
                  color: accentColor,
                }}
              >
                {data.author}
              </div>
              {data.source && (
                <div
                  style={{
                    fontFamily: "'Inter', system-ui, sans-serif",
                    fontSize: 12,
                    color: 'rgba(255,255,255,0.4)',
                    marginTop: 4,
                  }}
                >
                  {data.source}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </BackgroundRenderer>
  );
};
