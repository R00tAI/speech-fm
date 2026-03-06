'use client';

import React from 'react';

interface GridLinesProps {
  color: string;
  spacing?: number;
  opacity?: number;
  animated?: boolean;
}

export const GridLines: React.FC<GridLinesProps> = ({
  color,
  spacing = 40,
  opacity = 0.06,
  animated = false,
}) => {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity,
        backgroundImage: `
          linear-gradient(${color} 1px, transparent 1px),
          linear-gradient(90deg, ${color} 1px, transparent 1px)
        `,
        backgroundSize: `${spacing}px ${spacing}px`,
        ...(animated
          ? {
              animation: 'gridShift 20s linear infinite',
            }
          : {}),
      }}
    />
  );
};
