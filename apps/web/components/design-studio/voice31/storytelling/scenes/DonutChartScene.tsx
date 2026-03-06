'use client';

import React from 'react';
import type { SceneRendererProps, DonutData } from '../types';
import { easeOutCubic, stagger } from '@/lib/storytelling/easing';
import { BackgroundRenderer, PieSlice } from '../primitives';

export const DonutChartScene: React.FC<SceneRendererProps> = ({
  scene,
  progress,
  width,
  height,
  accentColor,
}) => {
  const data = scene.data as DonutData;
  const titleProgress = easeOutCubic(Math.min(progress * 3, 1));
  const centerProgress = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.4) * 2)));

  const total = data.segments.reduce((sum, s) => sum + s.value, 0);
  const radius = Math.min(width, height) * 0.28;
  const innerRadius = radius * 0.6;
  const cx = width / 2;
  const cy = height / 2;

  // Default colors if not specified
  const defaultColors = ['#34d399', '#60a5fa', '#fbbf24', '#f87171', '#a78bfa', '#fb923c'];

  let currentAngle = 0;
  const slices = data.segments.map((seg, i) => {
    const angle = (seg.value / total) * 360;
    const startAngle = currentAngle;
    currentAngle += angle;
    return {
      ...seg,
      startAngle,
      endAngle: currentAngle,
      color: seg.color || defaultColors[i % defaultColors.length],
      delay: stagger(i, data.segments.length, 0.05, 0.35),
    };
  });

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
        }}
      >
        {data.title && (
          <div
            style={{
              fontFamily: "'Space Grotesk', system-ui, sans-serif",
              fontSize: Math.max(16, Math.min(24, width / 25)),
              fontWeight: 700,
              color: '#ffffff',
              marginBottom: 16,
              opacity: titleProgress,
            }}
          >
            {data.title}
          </div>
        )}

        <svg width={radius * 2.4} height={radius * 2.4} viewBox={`${cx - radius * 1.2} ${cy - radius * 1.2} ${radius * 2.4} ${radius * 2.4}`}>
          {slices.map((s, i) => (
            <PieSlice
              key={i}
              startAngle={s.startAngle}
              endAngle={s.endAngle}
              radius={radius}
              innerRadius={innerRadius}
              cx={cx}
              cy={cy}
              color={s.color}
              progress={progress}
              delay={s.delay}
            />
          ))}

          {/* Center text */}
          {(data.centerValue || data.centerLabel) && (
            <g opacity={centerProgress}>
              {data.centerValue && (
                <text
                  x={cx}
                  y={cy - 4}
                  textAnchor="middle"
                  dominantBaseline="auto"
                  fill="#ffffff"
                  fontSize={radius * 0.3}
                  fontWeight={700}
                  fontFamily="'Space Grotesk', system-ui, sans-serif"
                >
                  {data.centerValue}
                </text>
              )}
              {data.centerLabel && (
                <text
                  x={cx}
                  y={cy + radius * 0.15}
                  textAnchor="middle"
                  dominantBaseline="auto"
                  fill="rgba(255,255,255,0.5)"
                  fontSize={radius * 0.12}
                  fontFamily="'Inter', system-ui, sans-serif"
                >
                  {data.centerLabel}
                </text>
              )}
            </g>
          )}
        </svg>

        {/* Legend */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '8px 16px',
            marginTop: 16,
            opacity: easeOutCubic(Math.max(0, (progress - 0.5) * 2)),
          }}
        >
          {slices.map((s, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: 11,
                color: 'rgba(255,255,255,0.6)',
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: s.color,
                }}
              />
              {s.label}
            </div>
          ))}
        </div>
      </div>
    </BackgroundRenderer>
  );
};
