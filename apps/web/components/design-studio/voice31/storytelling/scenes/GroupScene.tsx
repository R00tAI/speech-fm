'use client';

import React from 'react';
import type { SceneRendererProps, GroupData } from '../types';
import { easeOutBack, easeOutCubic, stagger } from '@/lib/storytelling/easing';
import { BackgroundRenderer } from '../primitives';

export const GroupScene: React.FC<SceneRendererProps> = ({
  scene,
  progress,
  width,
  height,
  accentColor,
}) => {
  const data = scene.data as GroupData;
  const titleProgress = easeOutCubic(Math.min(progress * 3, 1));
  const avatarSize = Math.max(48, Math.min(72, width / 10));

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
          padding: '8%',
        }}
      >
        {data.title && (
          <div
            style={{
              fontFamily: "'Space Grotesk', system-ui, sans-serif",
              fontSize: Math.max(18, Math.min(28, width / 22)),
              fontWeight: 700,
              color: '#ffffff',
              marginBottom: 24,
              opacity: titleProgress,
            }}
          >
            {data.title}
          </div>
        )}

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 20,
          }}
        >
          {data.people.map((person, i) => {
            const delay = stagger(i, data.people.length, 0.1, 0.45);
            const personProgress = easeOutBack(Math.max(0, Math.min(1, (progress - delay) / 0.4)));

            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                  opacity: personProgress,
                  transform: `translateY(${(1 - personProgress) * 20}px) scale(${0.85 + personProgress * 0.15})`,
                }}
              >
                <div
                  style={{
                    width: avatarSize,
                    height: avatarSize,
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${accentColor}30, ${accentColor}10)`,
                    border: `2px solid ${accentColor}40`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: "'Space Grotesk', system-ui, sans-serif",
                    fontSize: avatarSize * 0.35,
                    fontWeight: 700,
                    color: accentColor,
                  }}
                >
                  {person.name.charAt(0).toUpperCase()}
                </div>
                <div
                  style={{
                    fontFamily: "'Inter', system-ui, sans-serif",
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#ffffff',
                    textAlign: 'center',
                  }}
                >
                  {person.name}
                </div>
                {person.role && (
                  <div
                    style={{
                      fontFamily: "'Inter', system-ui, sans-serif",
                      fontSize: 11,
                      color: 'rgba(255,255,255,0.4)',
                      textAlign: 'center',
                      marginTop: -4,
                    }}
                  >
                    {person.role}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </BackgroundRenderer>
  );
};
