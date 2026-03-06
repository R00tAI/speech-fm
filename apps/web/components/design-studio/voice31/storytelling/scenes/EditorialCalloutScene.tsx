'use client';

import React from 'react';
import type { SceneRendererProps, EditorialCalloutData } from '../types';
import { easeOutCubic } from '@/lib/storytelling/easing';
import { BackgroundRenderer } from '../primitives';

export const EditorialCalloutScene: React.FC<SceneRendererProps> = ({
  scene,
  progress,
  width,
  height,
  accentColor,
}) => {
  const data = scene.data as EditorialCalloutData;
  const textProgress = easeOutCubic(Math.min(progress * 2, 1));
  const lineProgress = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.05) * 2.5)));
  const attrProgress = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.4) * 2)));

  const fontSize = Math.max(22, Math.min(40, width / 16));

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
        <div style={{ maxWidth: 600 }}>
          <div style={{ display: 'flex', gap: 20 }}>
            {/* Accent bar */}
            <div
              style={{
                width: 4,
                borderRadius: 2,
                background: accentColor,
                flexShrink: 0,
                opacity: lineProgress,
                height: `${lineProgress * 100}%`,
                minHeight: 40,
                boxShadow: `0 0 15px ${accentColor}60`,
                alignSelf: 'stretch',
              }}
            />

            <div>
              {/* Quote text */}
              <blockquote
                style={{
                  fontFamily: "'Georgia', 'Times New Roman', serif",
                  fontSize,
                  fontWeight: 400,
                  fontStyle: 'italic',
                  color: '#ffffff',
                  lineHeight: 1.5,
                  margin: 0,
                  opacity: textProgress,
                  transform: `translateY(${(1 - textProgress) * 15}px)`,
                }}
              >
                {data.text}
              </blockquote>

              {/* Attribution */}
              {data.attribution && (
                <div
                  style={{
                    fontFamily: "'Inter', system-ui, sans-serif",
                    fontSize: 14,
                    fontWeight: 500,
                    color: accentColor,
                    marginTop: 16,
                    opacity: attrProgress,
                    letterSpacing: '0.05em',
                  }}
                >
                  — {data.attribution}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </BackgroundRenderer>
  );
};
