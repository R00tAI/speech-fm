'use client';

import React from 'react';
import type { SceneRendererProps, SvgVisualData } from '../types';
import { easeOutCubic } from '@/lib/storytelling/easing';
import { BackgroundRenderer } from '../primitives';

export const SvgVisualScene: React.FC<SceneRendererProps> = ({
  scene,
  progress,
  width,
  height,
  accentColor,
}) => {
  const data = scene.data as SvgVisualData;
  const svgSize = Math.min(width * 0.6, height * 0.6);

  return (
    <BackgroundRenderer accent={accentColor} bg={scene.bg} bgGradient={scene.bgGradient} sceneType={scene.type} progress={progress} width={width} height={height}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg
          width={svgSize}
          height={svgSize}
          viewBox="0 0 400 400"
          style={{ overflow: 'visible' }}
        >
          {data.elements.map((el, i) => {
            const elProgress = easeOutCubic(Math.max(0, Math.min(1, (progress - i * 0.08) * 2)));
            const Tag = el.type as keyof JSX.IntrinsicElements;

            // Convert animate to CSS animation values
            const style: React.CSSProperties = {
              opacity: elProgress,
              transition: 'opacity 0.3s ease',
            };

            if (el.animate) {
              if (el.animate.rotate) {
                style.transform = `rotate(${Number(el.animate.rotate) * progress}deg)`;
                style.transformOrigin = 'center';
              }
              if (el.animate.scale) {
                const s = 1 + (Number(el.animate.scale) - 1) * easeOutCubic(progress);
                style.transform = `${style.transform || ''} scale(${s})`;
              }
            }

            // Ensure valid SVG props (strings/numbers only)
            const svgProps: Record<string, string | number> = {};
            for (const [key, val] of Object.entries(el.props)) {
              svgProps[key] = val;
            }

            // Default fill/stroke to accent if not specified
            if (!svgProps.fill && !svgProps.stroke) {
              svgProps.fill = accentColor;
            }

            return (
              <Tag
                key={i}
                {...(svgProps as any)}
                style={style}
              />
            );
          })}
        </svg>
      </div>
    </BackgroundRenderer>
  );
};
