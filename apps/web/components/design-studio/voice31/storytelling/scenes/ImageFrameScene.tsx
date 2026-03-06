'use client';

import React, { useState } from 'react';
import type { SceneRendererProps, ImageFrameData } from '../types';
import { easeOutCubic } from '@/lib/storytelling/easing';
import { BackgroundRenderer } from '../primitives';
import { useStorytellingStore } from '../StorytellingStore';

const FRAME_STYLES: Record<ImageFrameData['frameStyle'], React.CSSProperties> = {
  editorial: {
    borderRadius: 0,
    border: '2px solid rgba(255,255,255,0.15)',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
  },
  polaroid: {
    borderRadius: 4,
    background: '#fafafa',
    padding: '12px 12px 40px 12px',
    boxShadow: '0 8px 30px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.2)',
  },
  cinema: {
    borderRadius: 0,
    boxShadow: '0 0 0 4px #1a1a1a, 0 0 0 5px rgba(255,255,255,0.1), 0 20px 60px rgba(0,0,0,0.6)',
    aspectRatio: '2.39/1',
  },
  minimal: {
    borderRadius: 8,
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
  },
  float: {
    borderRadius: 12,
    boxShadow: '0 24px 48px rgba(0,0,0,0.4), 0 8px 16px rgba(0,0,0,0.2)',
    transform: 'perspective(800px) rotateY(-2deg) rotateX(1deg)',
  },
};

export const ImageFrameScene: React.FC<SceneRendererProps> = ({
  scene,
  progress,
  width,
  height,
  accentColor,
}) => {
  const data = scene.data as ImageFrameData;
  const [imageLoaded, setImageLoaded] = useState(false);

  const frameProgress = easeOutCubic(Math.min(progress * 2, 1));
  const captionProgress = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.3) * 2.5)));

  // Ken Burns pan effect
  const kenBurnsX = data.enableParallax ? Math.sin(progress * Math.PI * 0.5) * 5 : 0;
  const kenBurnsY = data.enableParallax ? Math.cos(progress * Math.PI * 0.3) * 3 : 0;
  const kenBurnsScale = data.enableParallax ? 1 + progress * 0.08 : 1;

  const frameStyle = FRAME_STYLES[data.frameStyle] || FRAME_STYLES.minimal;
  const maxImgWidth = Math.min(width * 0.7, 600);
  const maxImgHeight = Math.min(height * 0.6, 400);

  // Check for pre-rendered image from the progressive pipeline
  const scenes = useStorytellingStore((s) => s.scenes);
  const sceneEntry = scenes.find((e) => e.scene.id === scene.id);
  const prerenderedUrl = sceneEntry?.prerenderData?.imageUrl;

  // Resolve image URL: pre-rendered > direct URL > generating placeholder
  const resolvedUrl = prerenderedUrl
    || (data.imageUrl.startsWith('GENERATE:') ? undefined : data.imageUrl);

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
          padding: '8% 10%',
          gap: 16,
        }}
      >
        {/* Frame container */}
        <div
          style={{
            ...frameStyle,
            overflow: 'hidden',
            opacity: frameProgress,
            transform: `scale(${0.9 + frameProgress * 0.1}) ${frameStyle.transform || ''}`,
            transition: 'transform 0.3s ease',
            maxWidth: maxImgWidth,
            maxHeight: maxImgHeight,
          }}
        >
          {resolvedUrl ? (
            <div style={{ overflow: 'hidden', position: 'relative' }}>
              <img
                src={resolvedUrl}
                alt={data.caption || ''}
                onLoad={() => setImageLoaded(true)}
                style={{
                  display: 'block',
                  width: '100%',
                  height: 'auto',
                  maxHeight: maxImgHeight,
                  objectFit: 'cover',
                  transform: `translate(${kenBurnsX}%, ${kenBurnsY}%) scale(${kenBurnsScale})`,
                  transition: 'transform 0.1s linear',
                  opacity: imageLoaded ? 1 : 0,
                }}
              />
              {!imageLoaded && (
                <div
                  style={{
                    width: maxImgWidth,
                    height: maxImgHeight * 0.6,
                    background: `linear-gradient(135deg, ${accentColor}20, ${accentColor}08)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
                    Loading...
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div
              style={{
                width: maxImgWidth,
                height: maxImgHeight * 0.6,
                background: `linear-gradient(135deg, ${accentColor}30, ${accentColor}10)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
                Generating...
              </div>
            </div>
          )}
        </div>

        {/* Caption */}
        {data.caption && (
          <div
            style={{
              opacity: captionProgress,
              transform: `translateY(${(1 - captionProgress) * 10}px)`,
              textAlign: 'center',
              maxWidth: maxImgWidth,
            }}
          >
            <div
              style={{
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: 14,
                color: 'rgba(255,255,255,0.7)',
                lineHeight: 1.5,
              }}
            >
              {data.caption}
            </div>
            {data.source && (
              <div
                style={{
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.35)',
                  marginTop: 4,
                }}
              >
                Source: {data.source}
              </div>
            )}
          </div>
        )}
      </div>
    </BackgroundRenderer>
  );
};
