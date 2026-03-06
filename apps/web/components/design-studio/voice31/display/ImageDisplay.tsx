'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle } from '@phosphor-icons/react';
import { FMDitherLoading } from './FMDitherLoading';

/**
 * Image Display with organic CRT transitions.
 * Features scanline reveal, glitch effects, and fullscreen background.
 */

interface ImageDisplayProps {
  imageUrl?: string;
  prompt?: string;
  isGenerating?: boolean;
  phosphorColor: string;
}

export const ImageDisplay: React.FC<ImageDisplayProps> = ({
  imageUrl,
  prompt,
  isGenerating,
  phosphorColor,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [revealProgress, setRevealProgress] = useState(0);
  const [glitchActive, setGlitchActive] = useState(false);

  const colors = {
    green: { text: '#33ff33', glow: 'rgba(51, 255, 51, 0.6)', filter: 'sepia(100%) hue-rotate(60deg) saturate(2)' },
    amber: { text: '#ffaa00', glow: 'rgba(255, 170, 0, 0.6)', filter: 'sepia(50%) saturate(1.5)' },
    red: { text: '#ff4444', glow: 'rgba(255, 68, 68, 0.6)', filter: 'sepia(100%) hue-rotate(-30deg) saturate(2)' },
    blue: { text: '#4488ff', glow: 'rgba(68, 136, 255, 0.6)', filter: 'sepia(100%) hue-rotate(180deg) saturate(1.5)' },
    white: { text: '#ffffff', glow: 'rgba(255, 255, 255, 0.6)', filter: 'none' },
  }[phosphorColor] || { text: '#ffaa00', glow: 'rgba(255, 170, 0, 0.6)', filter: 'sepia(50%) saturate(1.5)' };

  // Organic reveal animation
  useEffect(() => {
    if (isLoaded && imageUrl) {
      setGlitchActive(true);
      let progress = 0;
      const revealInterval = setInterval(() => {
        progress += 0.02 + Math.random() * 0.03;
        setRevealProgress(Math.min(progress, 1));
        if (progress >= 1) {
          clearInterval(revealInterval);
          setTimeout(() => setGlitchActive(false), 200);
        }
      }, 30);
      return () => clearInterval(revealInterval);
    }
  }, [isLoaded, imageUrl]);

  // Reset on new image
  useEffect(() => {
    setIsLoaded(false);
    setRevealProgress(0);
  }, [imageUrl]);

  // Show FM dither loading effect instead of spinner
  if (isGenerating) {
    return (
      <div className="flex items-center justify-center w-full h-full overflow-hidden rounded-[10px]">
        <FMDitherLoading phosphorColor={phosphorColor} prompt={prompt} />
      </div>
    );
  }

  if (imageUrl) {
    return (
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
        {/* Background image - fullscreen cover with blur and overlay */}
        <div
          className="absolute inset-0 transition-opacity duration-1000"
          style={{
            backgroundImage: `url(${imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: `blur(20px) brightness(0.4) ${colors.filter}`,
            opacity: isLoaded ? Math.min(revealProgress * 1.6, 0.8) : 0,
            transform: 'scale(1.1)',
          }}
        />

        {/* Dark gradient overlay for text readability */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at center, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 100%)',
            opacity: isLoaded ? revealProgress : 0,
          }}
        />

        {/* Framed image in center */}
        <div
          className="relative z-10 max-w-[60%] max-h-[50vh]"
          style={{
            opacity: isLoaded ? Math.max(0, (revealProgress - 0.2) / 0.8) : 0,
            transform: isLoaded ? 'scale(1)' : 'scale(0.95)',
            transition: 'opacity 0.5s ease-out, transform 0.5s ease-out',
          }}
        >
          <div
            className="relative rounded-lg overflow-hidden"
            style={{
              boxShadow: `0 0 60px ${colors.glow}, 0 0 30px ${colors.glow}, inset 0 0 20px ${colors.text}20`,
              border: 'none',
            }}
          >
            {/* Scanline reveal mask */}
            <div
              className="absolute inset-0 z-10 pointer-events-none"
              style={{
                background: `linear-gradient(
                  to bottom,
                  transparent ${revealProgress * 100}%,
                  rgba(0, 0, 0, 0.95) ${revealProgress * 100}%
                )`,
              }}
            />

            {/* Glitch effect during reveal */}
            {glitchActive && (
              <div
                className="absolute inset-0 z-20 pointer-events-none"
                style={{
                  background: `repeating-linear-gradient(
                    0deg,
                    ${colors.text}08 0px,
                    transparent 2px,
                    transparent 4px
                  )`,
                  animation: 'glitchScan 0.1s linear infinite',
                }}
              />
            )}

            <img
              src={imageUrl}
              alt={prompt || 'Generated image'}
              className="w-full h-auto object-contain transition-all duration-500"
              style={{
                maxHeight: '50vh',
                filter: glitchActive ? 'brightness(1.2)' : 'brightness(1.05)',
                transform: glitchActive
                  ? `translateX(${Math.random() * 4 - 2}px)`
                  : 'translateX(0)',
              }}
              onLoad={() => setIsLoaded(true)}
            />

            {/* Inner frame glow */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                boxShadow: `inset 0 0 40px ${colors.glow}`,
                opacity: 0.5,
              }}
            />
          </div>

          {/* Caption below frame */}
          {prompt && (
            <div
              className="mt-4 text-center text-sm font-mono transition-all duration-500 px-4"
              style={{
                color: colors.text,
                opacity: revealProgress * 0.8,
                textShadow: `0 0 10px ${colors.glow}`,
              }}
            >
              <CheckCircle weight="bold" className="inline-block w-4 h-4 mr-2 align-middle" />
              <span className="align-middle">{prompt}</span>
            </div>
          )}
        </div>

        <style jsx>{`
          @keyframes glitchScan {
            0% { transform: translateY(-100%); }
            100% { transform: translateY(100%); }
          }
        `}</style>
      </div>
    );
  }

  return null;
};
