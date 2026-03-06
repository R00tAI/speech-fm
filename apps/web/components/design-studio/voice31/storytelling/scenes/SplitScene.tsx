'use client';

import React from 'react';
import type { SceneRendererProps, SplitData } from '../types';
import { easeOutCubic } from '@/lib/storytelling/easing';
import { BackgroundRenderer } from '../primitives';

export const SplitScene: React.FC<SceneRendererProps> = ({
  scene,
  progress,
  width,
  height,
  accentColor,
}) => {
  const data = scene.data as SplitData;
  const leftProgress = easeOutCubic(Math.min(progress * 2.5, 1));
  const rightProgress = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.2) * 2.5)));
  const dividerProgress = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.1) * 3)));

  const fontSize = Math.max(28, Math.min(48, width / 14));
  const labelSize = Math.max(12, Math.min(16, width / 40));

  const PanelContent: React.FC<{ side: typeof data.left; prog: number; fromLeft: boolean }> = ({
    side,
    prog,
    fromLeft,
  }) => (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8%',
        opacity: prog,
        transform: `translateX(${(1 - prog) * (fromLeft ? -30 : 30)}px)`,
      }}
    >
      <div
        style={{
          fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: labelSize,
          fontWeight: 500,
          color: 'rgba(255,255,255,0.5)',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          marginBottom: 12,
        }}
      >
        {side.label}
      </div>
      <div
        style={{
          fontFamily: "'Space Grotesk', system-ui, sans-serif",
          fontSize,
          fontWeight: 700,
          color: '#ffffff',
          textAlign: 'center',
          lineHeight: 1.2,
        }}
      >
        {side.value}
      </div>
    </div>
  );

  return (
    <BackgroundRenderer accent={accentColor} bg={scene.bg} bgGradient={scene.bgGradient} sceneType={scene.type} progress={progress} width={width} height={height}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <PanelContent side={data.left} prog={leftProgress} fromLeft={true} />

        {/* Divider */}
        <div
          style={{
            width: 2,
            height: `${dividerProgress * 60}%`,
            background: `linear-gradient(180deg, transparent, ${accentColor}, transparent)`,
            flexShrink: 0,
            position: 'relative',
          }}
        >
          {data.versus && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: '#0a0a0a',
                padding: '4px 12px',
                borderRadius: 20,
                border: `1px solid ${accentColor}60`,
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: 12,
                fontWeight: 700,
                color: accentColor,
                letterSpacing: '0.1em',
                opacity: dividerProgress,
              }}
            >
              VS
            </div>
          )}
        </div>

        <PanelContent side={data.right} prog={rightProgress} fromLeft={false} />
      </div>
    </BackgroundRenderer>
  );
};
