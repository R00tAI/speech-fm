'use client';

import React from 'react';
import type { SceneRendererProps, ProfileData } from '../types';
import { easeOutCubic, easeOutBack, stagger } from '@/lib/storytelling/easing';
import { BackgroundRenderer } from '../primitives';

export const ProfileScene: React.FC<SceneRendererProps> = ({
  scene,
  progress,
  width,
  height,
  accentColor,
}) => {
  const data = scene.data as ProfileData;
  const avatarProgress = easeOutBack(Math.min(progress * 2.5, 1));
  const nameProgress = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.15) * 2.5)));
  const statsProgress = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.3) * 2)));

  const avatarSize = Math.max(60, Math.min(100, width / 7));

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
          padding: '10%',
          gap: 16,
        }}
      >
        {/* Avatar circle */}
        <div
          style={{
            width: avatarSize,
            height: avatarSize,
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${accentColor}40, ${accentColor}15)`,
            border: `2px solid ${accentColor}60`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Space Grotesk', system-ui, sans-serif",
            fontSize: avatarSize * 0.4,
            fontWeight: 700,
            color: accentColor,
            opacity: avatarProgress,
            transform: `scale(${avatarProgress})`,
            boxShadow: `0 0 30px ${accentColor}30`,
          }}
        >
          {data.name.charAt(0).toUpperCase()}
        </div>

        {/* Name */}
        <div
          style={{
            fontFamily: "'Space Grotesk', system-ui, sans-serif",
            fontSize: Math.max(24, Math.min(36, width / 16)),
            fontWeight: 700,
            color: '#ffffff',
            opacity: nameProgress,
            transform: `translateY(${(1 - nameProgress) * 10}px)`,
          }}
        >
          {data.name}
        </div>

        {/* Title */}
        {data.title && (
          <div
            style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: 14,
              color: `${accentColor}cc`,
              opacity: nameProgress,
              letterSpacing: '0.06em',
              marginTop: -8,
            }}
          >
            {data.title}
          </div>
        )}

        {/* Stats */}
        {data.stats && data.stats.length > 0 && (
          <div
            style={{
              display: 'flex',
              gap: 24,
              marginTop: 12,
              opacity: statsProgress,
            }}
          >
            {data.stats.map((stat, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div
                  style={{
                    fontFamily: "'Space Grotesk', system-ui, sans-serif",
                    fontSize: 20,
                    fontWeight: 700,
                    color: accentColor,
                  }}
                >
                  {stat.value}
                </div>
                <div
                  style={{
                    fontFamily: "'Inter', system-ui, sans-serif",
                    fontSize: 11,
                    color: 'rgba(255,255,255,0.5)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginTop: 2,
                  }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bio */}
        {data.bio && (
          <div
            style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: 13,
              color: 'rgba(255,255,255,0.5)',
              textAlign: 'center',
              maxWidth: 400,
              lineHeight: 1.5,
              marginTop: 8,
              opacity: statsProgress,
            }}
          >
            {data.bio}
          </div>
        )}
      </div>
    </BackgroundRenderer>
  );
};
