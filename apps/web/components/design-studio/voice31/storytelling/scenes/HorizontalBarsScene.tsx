'use client';

import React from 'react';
import type { SceneRendererProps, HorizontalBarsData } from '../types';
import { easeOutCubic } from '@/lib/storytelling/easing';
import { BackgroundRenderer, BarSegment } from '../primitives';

export const HorizontalBarsScene: React.FC<SceneRendererProps> = ({
  scene,
  progress,
  width,
  height,
  accentColor,
}) => {
  const data = scene.data as HorizontalBarsData;
  const titleProgress = easeOutCubic(Math.min(progress * 3, 1));
  const maxValue = Math.max(...data.bars.map((b) => b.maxValue || b.value));

  return (
    <BackgroundRenderer accent={accentColor} bg={scene.bg} bgGradient={scene.bgGradient} sceneType={scene.type} progress={progress} width={width} height={height}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '8% 12%',
        }}
      >
        {data.title && (
          <div
            style={{
              fontFamily: "'Space Grotesk', system-ui, sans-serif",
              fontSize: Math.max(18, Math.min(28, width / 22)),
              fontWeight: 700,
              color: '#ffffff',
              marginBottom: 24,
              opacity: titleProgress,
              transform: `translateY(${(1 - titleProgress) * 10}px)`,
            }}
          >
            {data.title}
          </div>
        )}

        <div style={{ maxWidth: Math.min(500, width * 0.7) }}>
          {data.bars.map((bar, i) => (
            <BarSegment
              key={i}
              label={bar.label}
              value={bar.value}
              maxValue={maxValue}
              index={i}
              total={data.bars.length}
              progress={progress}
              color={bar.color || accentColor}
              accentColor={accentColor}
            />
          ))}
        </div>
      </div>
    </BackgroundRenderer>
  );
};
