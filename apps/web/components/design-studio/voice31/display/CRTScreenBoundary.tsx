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
  const palettes: Record<string, { base: string; glow: string; dim: string; primary: string }> = {
    green: { base: '#88ffaa', glow: '#44dd88', dim: '#224422', primary: '#33ff33' },
    amber: { base: '#ffcc88', glow: '#ffaa44', dim: '#442211', primary: '#ffaa00' },
    red: { base: '#ff8888', glow: '#ff4444', dim: '#441111', primary: '#ff4444' },
    blue: { base: '#aaccff', glow: '#6699ff', dim: '#112244', primary: '#4488ff' },
    white: { base: '#eeeeff', glow: '#ccccff', dim: '#222233', primary: '#ffffff' },
  };
  return palettes[color] || palettes.amber;
};

/** Art Deco filigree corner accent — SVG inline */
const CRTFiligreeCorner: React.FC<{
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  color: string;
  size?: number;
}> = ({ position, color, size = 32 }) => {
  // Rotation/flip based on corner position
  const transforms: Record<string, string> = {
    'top-left': '',
    'top-right': 'scale(-1, 1)',
    'bottom-left': 'scale(1, -1)',
    'bottom-right': 'scale(-1, -1)',
  };
  const posClasses: Record<string, string> = {
    'top-left': 'top-1.5 left-1.5',
    'top-right': 'top-1.5 right-1.5',
    'bottom-left': 'bottom-1.5 left-1.5',
    'bottom-right': 'bottom-1.5 right-1.5',
  };

  return (
    <svg
      className={`absolute ${posClasses[position]} pointer-events-none`}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      style={{ opacity: 0.2 }}
    >
      <g transform={transforms[position]} style={{ transformOrigin: '16px 16px' }}>
        {/* Art Deco geometric angle lines */}
        <path
          d="M2 2 L2 14 L4 14 L4 4 L14 4 L14 2 Z"
          fill={color}
          opacity="0.6"
        />
        {/* Inner decorative step */}
        <path
          d="M6 6 L6 10 L7.5 10 L7.5 7.5 L10 7.5 L10 6 Z"
          fill={color}
          opacity="0.4"
        />
        {/* Diagonal accent */}
        <line
          x1="4" y1="14" x2="14" y2="4"
          stroke={color}
          strokeWidth="0.75"
          opacity="0.3"
        />
      </g>
    </svg>
  );
};

/** Decorative rivet (screw-head circle) */
const BezelRivet: React.FC<{
  position: string;
  color: string;
}> = ({ position, color }) => (
  <div
    className={`absolute ${position} pointer-events-none`}
    style={{
      width: 6,
      height: 6,
      borderRadius: '50%',
      background: `radial-gradient(circle at 35% 35%, ${color}30, ${color}08)`,
      boxShadow: `inset 0 1px 1px ${color}20, inset 0 -0.5px 0.5px rgba(0,0,0,0.5)`,
      opacity: 0.3,
    }}
  />
);

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

        {/* Filigree corners — all 4 */}
        <CRTFiligreeCorner position="top-left" color={colors.glow} size={40} />
        <CRTFiligreeCorner position="top-right" color={colors.glow} size={40} />
        <CRTFiligreeCorner position="bottom-left" color={colors.glow} size={40} />
        <CRTFiligreeCorner position="bottom-right" color={colors.glow} size={40} />

        {/* Corner accent glows — enhanced */}
        <div className="absolute top-1 left-1 w-10 h-10 rounded-tl-lg border-l border-t opacity-20 pointer-events-none"
          style={{ borderColor: colors.glow }} />
        <div className="absolute top-1 right-1 w-10 h-10 rounded-tr-lg border-r border-t opacity-20 pointer-events-none"
          style={{ borderColor: colors.glow }} />
        <div className="absolute bottom-1 left-1 w-10 h-10 rounded-bl-lg border-l border-b opacity-15 pointer-events-none"
          style={{ borderColor: colors.glow }} />
        <div className="absolute bottom-1 right-1 w-10 h-10 rounded-br-lg border-r border-b opacity-15 pointer-events-none"
          style={{ borderColor: colors.glow }} />
      </div>
    );
  }

  // Standard bezel mode — dimensional brushed-metal frame
  return (
    <div
      className="relative overflow-hidden"
      style={{
        width,
        height,
        borderRadius: '16px 16px 0 0',
        background: 'linear-gradient(145deg, #2e2e2c 0%, #1e1e1b 30%, #141412 70%, #0e0e0c 100%)',
        padding: '8px 8px 0 8px',
        boxShadow: `
          inset 0 2px 6px rgba(255,255,255,0.08),
          inset 0 -2px 6px rgba(0,0,0,0.4),
          inset 1px 0 3px rgba(255,255,255,0.04),
          inset -1px 0 3px rgba(0,0,0,0.3),
          0 -4px 20px rgba(0,0,0,0.5),
          0 2px 30px rgba(0,0,0,0.4)
        `,
      }}
    >
      {/* Inner screen with recessed lip effect */}
      <div
        className="relative w-full h-full overflow-hidden"
        style={{
          borderRadius: '10px 10px 0 0',
          boxShadow: `
            inset 0 0 30px rgba(0,0,0,0.8),
            inset 0 2px 4px rgba(0,0,0,0.6),
            inset 0 -1px 2px rgba(0,0,0,0.4)
          `,
        }}
      >
        {children}
      </div>

      {/* Filigree corner accents — all 4 corners */}
      <CRTFiligreeCorner position="top-left" color={colors.glow} />
      <CRTFiligreeCorner position="top-right" color={colors.glow} />
      <CRTFiligreeCorner position="bottom-left" color={colors.glow} />
      <CRTFiligreeCorner position="bottom-right" color={colors.glow} />

      {/* Top-center recessed brand badge */}
      <div
        className="absolute top-1 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{
          padding: '1px 12px',
          borderRadius: '0 0 6px 6px',
          background: 'linear-gradient(180deg, #0a0a09 0%, #111110 100%)',
          boxShadow: `
            inset 0 1px 2px rgba(0,0,0,0.6),
            inset 0 -1px 1px rgba(255,255,255,0.03),
            0 1px 3px rgba(0,0,0,0.4)
          `,
          border: `1px solid rgba(255,255,255,0.04)`,
          borderTop: 'none',
        }}
      >
        <span
          className="font-mono text-[7px] uppercase tracking-[0.2em] font-bold"
          style={{
            color: `${colors.glow}40`,
            textShadow: `0 0 6px ${colors.glow}15`,
          }}
        >
          SPEECH FM
        </span>
      </div>

      {/* Bottom corner decorative rivets */}
      <BezelRivet position="bottom-2 left-2" color={colors.glow} />
      <BezelRivet position="bottom-2 right-2" color={colors.glow} />
      {/* Top rivets (flanking the brand badge) */}
      <BezelRivet position="top-2 left-2" color={colors.glow} />
      <BezelRivet position="top-2 right-2" color={colors.glow} />
    </div>
  );
};
