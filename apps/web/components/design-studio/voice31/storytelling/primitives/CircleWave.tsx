'use client';

import React from 'react';

interface CircleWaveProps {
  color: string;
  progress: number;
  cx: number;
  cy: number;
  maxRadius?: number;
  rings?: number;
}

export const CircleWave: React.FC<CircleWaveProps> = ({
  color,
  progress,
  cx,
  cy,
  maxRadius = 120,
  rings = 3,
}) => {
  return (
    <svg
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      width="100%"
      height="100%"
    >
      {Array.from({ length: rings }, (_, i) => {
        const phase = (progress * 2 + i * 0.3) % 1;
        const radius = phase * maxRadius;
        const opacity = (1 - phase) * 0.15;

        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={1.5}
            opacity={opacity}
          />
        );
      })}
    </svg>
  );
};
