'use client';

import React from 'react';
import { easeOutCubic, stagger } from '@/lib/storytelling/easing';

interface BarSegmentProps {
  label: string;
  value: number;
  maxValue: number;
  index: number;
  total: number;
  progress: number;
  color: string;
  accentColor: string;
}

export const BarSegment: React.FC<BarSegmentProps> = ({
  label,
  value,
  maxValue,
  index,
  total,
  progress,
  color,
  accentColor,
}) => {
  const staggeredStart = stagger(index, total, 0.1, 0.5);
  const localProgress = Math.max(0, Math.min(1, (progress - staggeredStart) / 0.5));
  const barWidth = easeOutCubic(localProgress) * (value / maxValue) * 100;

  return (
    <div style={{ marginBottom: 12, opacity: localProgress > 0 ? 1 : 0, transition: 'opacity 0.3s' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: 4,
        fontFamily: "'Inter', system-ui, sans-serif",
        fontSize: 13,
        fontWeight: 500,
      }}>
        <span style={{ color: '#e0e0e0' }}>{label}</span>
        <span style={{ color: accentColor, fontWeight: 700 }}>{value}</span>
      </div>
      <div style={{
        height: 8,
        borderRadius: 4,
        background: 'rgba(255,255,255,0.08)',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${barWidth}%`,
          borderRadius: 4,
          background: `linear-gradient(90deg, ${color}, ${accentColor})`,
          boxShadow: `0 0 12px ${accentColor}40`,
          transition: 'width 0.05s linear',
        }} />
      </div>
    </div>
  );
};
