'use client';

import React from 'react';

/**
 * CRT Screen Boundary
 * All visuals MUST be within this boundary.
 * Provides the CRT bezel frame and phosphor corner accents.
 *
 * fullscreen mode: No bezel, warped barrel-distortion corners,
 * scanline + phosphor glow overlays (CSS-only, no canvas).
 */

export interface CRTScreenBoundaryProps {
  children: React.ReactNode;
  width: number;
  height: number;
  phosphorColor: string;
  fullscreen?: boolean;
}

/** Get phosphor color palette for styling. */
export const getPhosphorColors = (color: string) => {
  const palettes: Record<string, { base: string; glow: string; dim: string }> = {
    green: { base: '#88ffaa', glow: '#44dd88', dim: '#224422' },
    amber: { base: '#ffcc88', glow: '#ffaa44', dim: '#442211' },
    red: { base: '#ff8888', glow: '#ff4444', dim: '#441111' },
    blue: { base: '#aaccff', glow: '#6699ff', dim: '#112244' },
    white: { base: '#eeeeff', glow: '#ccccff', dim: '#222233' },
  };
  return palettes[color] || palettes.amber;
};

export const CRTScreenBoundary: React.FC<CRTScreenBoundaryProps> = ({
  children,
  width,
  height,
  phosphorColor,
  fullscreen = false,
}) => {
  const colors = getPhosphorColors(phosphorColor);

  if (fullscreen) {
    return (
      <div
        className="relative overflow-hidden flex-1"
        style={{
          width: '100%',
          height: '100%',
          background: '#000',
          // Barrel-distortion warped corners via large border-radius
          borderRadius: '12px',
        }}
      >
        {/* Inner screen */}
        <div
          className="relative w-full h-full overflow-hidden"
          style={{ borderRadius: '10px' }}
        >
          {children}
        </div>

        {/* CRT scanline overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            borderRadius: '10px',
            backgroundImage: `
              repeating-linear-gradient(
                to bottom,
                transparent 0px,
                transparent 2px,
                rgba(0, 0, 0, 0.15) 2px,
                rgba(0, 0, 0, 0.15) 4px
              )
            `,
            opacity: 0.3,
            mixBlendMode: 'multiply',
          }}
        />

        {/* Phosphor glow edge vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            borderRadius: '10px',
            boxShadow: `
              inset 0 0 60px rgba(0,0,0,0.7),
              inset 0 0 120px rgba(0,0,0,0.3),
              0 0 8px ${colors.glow}15
            `,
          }}
        />

        {/* Corner accent glows */}
        <div className="absolute top-1 left-1 w-8 h-8 rounded-tl-lg border-l border-t opacity-15 pointer-events-none"
          style={{ borderColor: colors.glow }} />
        <div className="absolute top-1 right-1 w-8 h-8 rounded-tr-lg border-r border-t opacity-15 pointer-events-none"
          style={{ borderColor: colors.glow }} />
        <div className="absolute bottom-1 left-1 w-8 h-8 rounded-bl-lg border-l border-b opacity-10 pointer-events-none"
          style={{ borderColor: colors.glow }} />
        <div className="absolute bottom-1 right-1 w-8 h-8 rounded-br-lg border-r border-b opacity-10 pointer-events-none"
          style={{ borderColor: colors.glow }} />
      </div>
    );
  }

  // Standard bezel mode
  return (
    <div
      className="relative overflow-hidden"
      style={{
        width,
        height,
        borderRadius: '16px 16px 0 0',
        background: 'linear-gradient(180deg, #2a2a28 0%, #1a1a18 100%)',
        padding: '8px 8px 0 8px',
        boxShadow: `
          inset 0 2px 4px rgba(255,255,255,0.1),
          inset 0 -2px 4px rgba(0,0,0,0.3),
          0 -4px 20px rgba(0,0,0,0.5)
        `,
      }}
    >
      {/* Inner screen with slight inset */}
      <div
        className="relative w-full h-full overflow-hidden"
        style={{
          borderRadius: '10px 10px 0 0',
          boxShadow: 'inset 0 0 30px rgba(0,0,0,0.8)',
        }}
      >
        {children}
      </div>

      {/* CRT bezel corner accents */}
      <div
        className="absolute top-2 left-2 w-6 h-6 rounded-tl-lg border-l-2 border-t-2 opacity-20"
        style={{ borderColor: colors.glow }}
      />
      <div
        className="absolute top-2 right-2 w-6 h-6 rounded-tr-lg border-r-2 border-t-2 opacity-20"
        style={{ borderColor: colors.glow }}
      />
    </div>
  );
};
