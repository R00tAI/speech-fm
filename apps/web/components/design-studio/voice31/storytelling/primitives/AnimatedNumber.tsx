'use client';

import React, { useMemo } from 'react';
import { easeOutCubic } from '@/lib/storytelling/easing';

interface AnimatedNumberProps {
  value: number;
  progress: number;
  prefix?: string;
  suffix?: string;
  color: string;
  fontSize?: number;
  decimals?: number;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  progress,
  prefix = '',
  suffix = '',
  color,
  fontSize = 72,
  decimals = 0,
}) => {
  const displayValue = useMemo(() => {
    const easedProgress = easeOutCubic(Math.min(progress * 1.5, 1));
    const current = value * easedProgress;
    return current.toFixed(decimals);
  }, [value, progress, decimals]);

  return (
    <span
      style={{
        fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
        fontSize,
        fontWeight: 800,
        color,
        letterSpacing: '-0.03em',
        lineHeight: 1,
        textShadow: `0 0 40px ${color}60, 0 0 80px ${color}30`,
      }}
    >
      {prefix}{displayValue}{suffix}
    </span>
  );
};
