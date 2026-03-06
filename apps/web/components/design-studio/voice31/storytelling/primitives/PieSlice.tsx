'use client';

import React from 'react';
import { easeOutCubic } from '@/lib/storytelling/easing';

interface PieSliceProps {
  startAngle: number;
  endAngle: number;
  radius: number;
  innerRadius: number;
  cx: number;
  cy: number;
  color: string;
  progress: number;
  delay: number;
}

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, ir: number, start: number, end: number): string {
  const s1 = polarToCartesian(cx, cy, r, start);
  const e1 = polarToCartesian(cx, cy, r, end);
  const s2 = polarToCartesian(cx, cy, ir, end);
  const e2 = polarToCartesian(cx, cy, ir, start);
  const large = end - start > 180 ? 1 : 0;
  return [
    `M ${s1.x} ${s1.y}`,
    `A ${r} ${r} 0 ${large} 1 ${e1.x} ${e1.y}`,
    `L ${s2.x} ${s2.y}`,
    `A ${ir} ${ir} 0 ${large} 0 ${e2.x} ${e2.y}`,
    'Z',
  ].join(' ');
}

export const PieSlice: React.FC<PieSliceProps> = ({
  startAngle,
  endAngle,
  radius,
  innerRadius,
  cx,
  cy,
  color,
  progress,
  delay,
}) => {
  const localProgress = Math.max(0, Math.min(1, (progress - delay) / 0.6));
  const eased = easeOutCubic(localProgress);
  const currentEnd = startAngle + (endAngle - startAngle) * eased;

  if (localProgress <= 0) return null;

  return (
    <path
      d={arcPath(cx, cy, radius, innerRadius, startAngle, currentEnd)}
      fill={color}
      opacity={0.85}
      style={{
        filter: `drop-shadow(0 0 6px ${color}80)`,
      }}
    />
  );
};
