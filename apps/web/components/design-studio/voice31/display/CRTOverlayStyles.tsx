'use client';

import React from 'react';

/**
 * CRT Overlay Effects
 * CSS-based scanlines and phosphor glow for overlay content.
 */

export const CRTOverlayStyles: React.FC<{ children: React.ReactNode; phosphorColor: string }> = ({
  children,
  phosphorColor,
}) => {
  const colors = {
    green: 'rgba(51, 255, 51, 0.03)',
    amber: 'rgba(255, 170, 0, 0.03)',
    red: 'rgba(255, 68, 68, 0.03)',
    blue: 'rgba(68, 136, 255, 0.03)',
    white: 'rgba(255, 255, 255, 0.03)',
  }[phosphorColor] || 'rgba(255, 170, 0, 0.03)';

  return (
    <div className="relative w-full h-full">
      {children}
      {/* Scanline overlay for content */}
      <div
        className="absolute inset-0 pointer-events-none z-20"
        style={{
          background: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0, 0, 0, 0.15) 2px,
            rgba(0, 0, 0, 0.15) 4px
          )`,
          mixBlendMode: 'multiply',
        }}
      />
      {/* Phosphor glow overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-20 animate-pulse"
        style={{
          background: `radial-gradient(ellipse at center, ${colors} 0%, transparent 70%)`,
          animation: 'crtFlicker 0.1s infinite alternate',
        }}
      />
      <style jsx>{`
        @keyframes crtFlicker {
          0% { opacity: 0.97; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};
