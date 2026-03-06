'use client';

import React from 'react';
import type { SceneRendererProps, ResearchHighlightData } from '../types';
import { easeOutCubic } from '@/lib/storytelling/easing';
import { BackgroundRenderer } from '../primitives';

export const ResearchHighlightScene: React.FC<SceneRendererProps> = ({
  scene,
  progress,
  width,
  height,
  accentColor,
}) => {
  const data = scene.data as ResearchHighlightData;
  const containerProgress = easeOutCubic(Math.min(progress * 2.5, 1));
  const textProgress = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.1) * 2)));
  const sourceProgress = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.5) * 2.5)));

  const fontSize = Math.max(18, Math.min(32, width / 20));
  const words = data.excerpt.split(/\s+/);
  const highlightSet = new Set((data.highlightWords || []).map(w => w.toLowerCase()));

  // Staggered word reveal
  const renderWords = () => {
    return words.map((word, i) => {
      const wordProgress = easeOutCubic(
        Math.max(0, Math.min(1, (textProgress - (i / words.length) * 0.4) * 2.5))
      );
      const isHighlighted = highlightSet.has(word.toLowerCase().replace(/[^a-z0-9]/g, ''));

      return (
        <span
          key={i}
          style={{
            opacity: wordProgress,
            transform: `translateY(${(1 - wordProgress) * 8}px)`,
            display: 'inline-block',
            color: isHighlighted ? accentColor : '#ffffff',
            fontWeight: isHighlighted ? 700 : 400,
            textShadow: isHighlighted ? `0 0 20px ${accentColor}60` : 'none',
            transition: 'color 0.3s',
            marginRight: '0.25em',
          }}
        >
          {word}
        </span>
      );
    });
  };

  const isCard = data.style === 'card';
  const isNewspaper = data.style === 'newspaper';
  const isSidebar = data.style === 'sidebar';

  return (
    <BackgroundRenderer accent={accentColor} bg={scene.bg} bgGradient={scene.bgGradient} sceneType={scene.type} progress={progress} width={width} height={height}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '10% 12%',
        }}
      >
        <div
          style={{
            maxWidth: 600,
            opacity: containerProgress,
            transform: `scale(${0.95 + containerProgress * 0.05})`,
            ...(isCard ? {
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12,
              padding: '32px 28px',
              backdropFilter: 'blur(8px)',
            } : {}),
            ...(isSidebar ? {
              borderLeft: `3px solid ${accentColor}`,
              paddingLeft: 24,
            } : {}),
          }}
        >
          {/* Research label */}
          <div
            style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: accentColor,
              marginBottom: 16,
              opacity: containerProgress,
            }}
          >
            Research Highlight
          </div>

          {/* Excerpt with word-level animation */}
          <div
            style={{
              fontFamily: isNewspaper
                ? "'Georgia', 'Times New Roman', serif"
                : "'Inter', system-ui, sans-serif",
              fontSize,
              lineHeight: 1.6,
              fontStyle: data.style === 'pullquote' ? 'italic' : 'normal',
            }}
          >
            {data.style === 'pullquote' && (
              <span
                style={{
                  fontSize: fontSize * 2.5,
                  color: `${accentColor}30`,
                  lineHeight: 0.5,
                  verticalAlign: 'text-top',
                  marginRight: 4,
                }}
              >
                &ldquo;
              </span>
            )}
            {renderWords()}
          </div>

          {/* Source attribution */}
          <div
            style={{
              marginTop: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              opacity: sourceProgress,
              transform: `translateY(${(1 - sourceProgress) * 6}px)`,
            }}
          >
            {/* Source favicon placeholder */}
            {data.sourceUrl && (
              <img
                src={`https://www.google.com/s2/favicons?domain=${new URL(data.sourceUrl).hostname}&sz=16`}
                alt=""
                width={14}
                height={14}
                style={{ opacity: 0.6, borderRadius: 2 }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            )}
            <div
              style={{
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: 13,
                fontWeight: 500,
                color: 'rgba(255,255,255,0.5)',
              }}
            >
              {data.source}
            </div>
          </div>
        </div>
      </div>
    </BackgroundRenderer>
  );
};
