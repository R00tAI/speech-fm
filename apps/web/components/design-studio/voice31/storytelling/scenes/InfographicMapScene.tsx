'use client';

import React from 'react';
import type { SceneRendererProps, InfographicMapData } from '../types';
import { easeOutCubic, stagger } from '@/lib/storytelling/easing';
import { BackgroundRenderer, GridLines } from '../primitives';

export const InfographicMapScene: React.FC<SceneRendererProps> = ({
  scene,
  progress,
  width,
  height,
  accentColor,
}) => {
  const data = scene.data as InfographicMapData;
  const titleProgress = easeOutCubic(Math.min(progress * 3, 1));

  // Abstract map visualization — regions as positioned nodes
  const regionSize = Math.max(60, Math.min(100, width / 8));

  return (
    <BackgroundRenderer accent={accentColor} bg={scene.bg} bgGradient={scene.bgGradient} sceneType={scene.type} progress={progress} width={width} height={height}>
      <GridLines color={accentColor} opacity={0.03} spacing={30} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8%',
        }}
      >
        {data.title && (
          <div
            style={{
              fontFamily: "'Space Grotesk', system-ui, sans-serif",
              fontSize: Math.max(18, Math.min(26, width / 22)),
              fontWeight: 700,
              color: '#ffffff',
              marginBottom: 24,
              opacity: titleProgress,
            }}
          >
            {data.title}
          </div>
        )}

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 12,
            maxWidth: width * 0.75,
          }}
        >
          {data.regions.map((region, i) => {
            const delay = stagger(i, data.regions.length, 0.08, 0.4);
            const regionProgress = easeOutCubic(Math.max(0, Math.min(1, (progress - delay) / 0.4)));

            return (
              <div
                key={i}
                style={{
                  width: regionSize,
                  padding: '12px 8px',
                  textAlign: 'center',
                  background: region.highlighted
                    ? `${accentColor}20`
                    : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${region.highlighted ? accentColor : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 8,
                  opacity: regionProgress,
                  transform: `scale(${0.8 + regionProgress * 0.2})`,
                  boxShadow: region.highlighted
                    ? `0 0 20px ${accentColor}30`
                    : 'none',
                }}
              >
                <div
                  style={{
                    fontFamily: "'Space Grotesk', system-ui, sans-serif",
                    fontSize: 18,
                    fontWeight: 700,
                    color: region.highlighted ? accentColor : '#ffffff',
                  }}
                >
                  {region.value}
                </div>
                <div
                  style={{
                    fontFamily: "'Inter', system-ui, sans-serif",
                    fontSize: 10,
                    color: 'rgba(255,255,255,0.5)',
                    marginTop: 4,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {region.name}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </BackgroundRenderer>
  );
};
