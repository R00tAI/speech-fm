'use client';

import React from 'react';
import type { SceneRendererProps, BigNumberData } from '../types';
import { easeOutCubic } from '@/lib/storytelling/easing';
import { AnimatedNumber, BackgroundRenderer } from '../primitives';

export const BigNumberScene: React.FC<SceneRendererProps> = ({
  scene,
  progress,
  width,
  height,
  accentColor,
}) => {
  const data = scene.data as BigNumberData;
  const labelProgress = easeOutCubic(Math.min(progress * 3, 1));
  const numberProgress = Math.max(0, Math.min(1, (progress - 0.1) * 1.5));
  const subProgress = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.5) * 2)));

  const numberSize = Math.max(48, Math.min(96, width / 6));
  const labelSize = Math.max(14, Math.min(20, width / 30));

  const trendArrow = data.trend === 'up' ? '↑' : data.trend === 'down' ? '↓' : '';
  const trendColor = data.trend === 'up' ? '#34d399' : data.trend === 'down' ? '#f87171' : accentColor;

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
        {/* Label */}
        <div
          style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: labelSize,
            fontWeight: 500,
            color: 'rgba(255,255,255,0.6)',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            opacity: labelProgress,
            transform: `translateY(${(1 - labelProgress) * 10}px)`,
            marginBottom: 12,
          }}
        >
          {data.label}
        </div>

        {/* Big Number */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 8,
            opacity: numberProgress > 0 ? 1 : 0,
          }}
        >
          <AnimatedNumber
            value={data.value}
            progress={numberProgress}
            prefix={data.prefix}
            suffix={data.suffix}
            color={accentColor}
            fontSize={numberSize}
          />
          {trendArrow && (
            <span
              style={{
                fontSize: numberSize * 0.5,
                color: trendColor,
                fontWeight: 700,
                opacity: subProgress,
              }}
            >
              {trendArrow}
            </span>
          )}
        </div>

        {/* Sublabel */}
        {data.sublabel && (
          <div
            style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: labelSize - 2,
              fontWeight: 400,
              color: 'rgba(255,255,255,0.45)',
              marginTop: 16,
              opacity: subProgress,
              transform: `translateY(${(1 - subProgress) * 8}px)`,
            }}
          >
            {data.sublabel}
          </div>
        )}
      </div>
    </BackgroundRenderer>
  );
};
