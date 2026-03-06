'use client';

import React from 'react';
import type { SceneRendererProps, ChartData } from '../types';
import { easeOutCubic, mapRange } from '@/lib/storytelling/easing';
import { BackgroundRenderer, GridLines } from '../primitives';

export const ChartScene: React.FC<SceneRendererProps> = ({
  scene,
  progress,
  width,
  height,
  accentColor,
}) => {
  const data = scene.data as ChartData;
  const titleProgress = easeOutCubic(Math.min(progress * 3, 1));
  const chartProgress = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.1) * 1.5)));

  const defaultColors = ['#34d399', '#60a5fa', '#fbbf24', '#f87171', '#a78bfa'];

  // Chart dimensions
  const padding = { top: 60, right: 30, bottom: 40, left: 50 };
  const chartW = width * 0.7;
  const chartH = height * 0.55;
  const plotW = chartW - padding.left - padding.right;
  const plotH = chartH - padding.top - padding.bottom;

  // Data ranges
  const allValues = data.datasets.flatMap((d) => d.data);
  const minVal = 0;
  const maxVal = Math.max(...allValues) * 1.1;

  const xStep = plotW / Math.max(1, data.labels.length - 1);

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
              marginBottom: 12,
              opacity: titleProgress,
            }}
          >
            {data.title}
          </div>
        )}

        <svg width={chartW} height={chartH}>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => {
            const y = padding.top + plotH * (1 - frac);
            return (
              <line
                key={i}
                x1={padding.left}
                y1={y}
                x2={padding.left + plotW}
                y2={y}
                stroke="rgba(255,255,255,0.06)"
                strokeWidth={1}
              />
            );
          })}

          {/* X-axis labels */}
          {data.labels.map((label, i) => {
            const x = padding.left + i * xStep;
            return (
              <text
                key={i}
                x={x}
                y={chartH - 10}
                textAnchor="middle"
                fill="rgba(255,255,255,0.4)"
                fontSize={10}
                fontFamily="'Inter', system-ui, sans-serif"
                opacity={chartProgress}
              >
                {label}
              </text>
            );
          })}

          {/* Datasets */}
          {data.datasets.map((dataset, di) => {
            const color = dataset.color || defaultColors[di % defaultColors.length];
            const visibleCount = Math.floor(dataset.data.length * chartProgress);

            if (data.type === 'bar') {
              const barWidth = xStep * 0.6 / data.datasets.length;
              const offset = di * barWidth - (data.datasets.length * barWidth) / 2 + barWidth / 2;

              return dataset.data.slice(0, visibleCount).map((val, i) => {
                const x = padding.left + i * xStep + offset;
                const barH = mapRange(val, minVal, maxVal, 0, plotH) * chartProgress;
                const y = padding.top + plotH - barH;

                return (
                  <rect
                    key={`${di}-${i}`}
                    x={x - barWidth / 2}
                    y={y}
                    width={barWidth}
                    height={barH}
                    fill={color}
                    rx={2}
                    opacity={0.85}
                  />
                );
              });
            }

            // Line / Area
            const points = dataset.data.slice(0, Math.max(2, visibleCount)).map((val, i) => ({
              x: padding.left + i * xStep,
              y: padding.top + plotH - mapRange(val, minVal, maxVal, 0, plotH),
            }));

            const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

            return (
              <g key={di}>
                {data.type === 'area' && points.length >= 2 && (
                  <path
                    d={`${pathD} L ${points[points.length - 1].x} ${padding.top + plotH} L ${points[0].x} ${padding.top + plotH} Z`}
                    fill={`${color}20`}
                  />
                )}
                <path
                  d={pathD}
                  fill="none"
                  stroke={color}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  style={{ filter: `drop-shadow(0 0 4px ${color}60)` }}
                />
                {points.map((p, i) => (
                  <circle
                    key={i}
                    cx={p.x}
                    cy={p.y}
                    r={3}
                    fill={color}
                    opacity={chartProgress}
                  />
                ))}
              </g>
            );
          })}
        </svg>

        {/* Legend */}
        {data.datasets.length > 1 && (
          <div
            style={{
              display: 'flex',
              gap: 16,
              marginTop: 8,
              opacity: easeOutCubic(Math.max(0, (progress - 0.5) * 2)),
            }}
          >
            {data.datasets.map((ds, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.5)',
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 3,
                    borderRadius: 1,
                    background: ds.color || defaultColors[i % defaultColors.length],
                  }}
                />
                {ds.label}
              </div>
            ))}
          </div>
        )}
      </div>
    </BackgroundRenderer>
  );
};
