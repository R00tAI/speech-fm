'use client';

/**
 * Voice31 RPG Filigree
 *
 * SVG-based procedural filigree that renders INSTANTLY.
 * No API calls needed. Themed per game setting.
 * A single corner SVG is mirrored to all 4 corners via CSS transforms.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useVoice31RPGStore } from './Voice31RPGStore';

// =============================================================================
// SVG FILIGREE PRESETS
// =============================================================================

const FILIGREE_PRESETS: Record<string, (color: string) => string> = {
  // Fantasy scrollwork — ornate curls and flourishes
  fantasy: (color: string) => `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none">
      <defs>
        <linearGradient id="fg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${color}" stop-opacity="0.8"/>
          <stop offset="100%" stop-color="${color}" stop-opacity="0.2"/>
        </linearGradient>
      </defs>
      <path d="M10 10 C10 10 10 80 40 120 C55 145 80 155 100 160 C70 140 50 110 45 80 C40 50 42 25 60 15 C75 8 95 12 105 25 C85 15 72 20 65 35 C58 50 60 75 70 95 C80 115 95 130 115 140 C90 125 75 100 68 75 C62 55 65 35 80 25 C90 18 105 22 110 35"
        stroke="url(#fg)" stroke-width="1.5" stroke-linecap="round" opacity="0.7"/>
      <path d="M15 5 C15 5 8 30 12 55 C16 80 30 100 50 115 C35 95 25 70 22 50 C19 30 24 12 40 8"
        stroke="${color}" stroke-width="1" stroke-linecap="round" opacity="0.4"/>
      <circle cx="40" cy="120" r="2" fill="${color}" opacity="0.5"/>
      <circle cx="60" cy="15" r="1.5" fill="${color}" opacity="0.4"/>
      <circle cx="105" cy="25" r="1.5" fill="${color}" opacity="0.35"/>
      <path d="M5 15 L5 5 L15 5" stroke="${color}" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
    </svg>`,

  // Cyberpunk circuits — angular tech lines
  cyberpunk: (color: string) => `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none">
      <path d="M5 5 L5 60 L25 80 L25 120 L40 135" stroke="${color}" stroke-width="1.5" opacity="0.6"/>
      <path d="M5 5 L60 5 L80 25 L120 25 L135 40" stroke="${color}" stroke-width="1.5" opacity="0.6"/>
      <path d="M25 80 L50 80 L65 95" stroke="${color}" stroke-width="1" opacity="0.4"/>
      <path d="M80 25 L80 50 L95 65" stroke="${color}" stroke-width="1" opacity="0.4"/>
      <rect x="2" y="2" width="6" height="6" fill="${color}" opacity="0.7"/>
      <rect x="22" y="77" width="4" height="4" fill="${color}" opacity="0.5"/>
      <rect x="77" y="22" width="4" height="4" fill="${color}" opacity="0.5"/>
      <circle cx="40" cy="135" r="2" fill="${color}" opacity="0.5"/>
      <circle cx="135" cy="40" r="2" fill="${color}" opacity="0.5"/>
      <circle cx="65" cy="95" r="1.5" fill="${color}" opacity="0.4"/>
      <circle cx="95" cy="65" r="1.5" fill="${color}" opacity="0.4"/>
      <path d="M10 15 L15 15 L15 10" stroke="${color}" stroke-width="0.5" opacity="0.3"/>
      <path d="M30 5 L30 12" stroke="${color}" stroke-width="0.5" opacity="0.25"/>
      <path d="M5 30 L12 30" stroke="${color}" stroke-width="0.5" opacity="0.25"/>
    </svg>`,

  // Noir art deco — geometric elegance
  noir: (color: string) => `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none">
      <path d="M5 5 L5 100 M5 5 L100 5" stroke="${color}" stroke-width="2" opacity="0.5"/>
      <path d="M5 5 L55 55" stroke="${color}" stroke-width="1.5" opacity="0.4"/>
      <path d="M15 5 L15 35 L35 55 L35 85" stroke="${color}" stroke-width="1" opacity="0.35"/>
      <path d="M5 15 L35 15 L55 35 L85 35" stroke="${color}" stroke-width="1" opacity="0.35"/>
      <path d="M25 5 L25 20" stroke="${color}" stroke-width="0.8" opacity="0.25"/>
      <path d="M5 25 L20 25" stroke="${color}" stroke-width="0.8" opacity="0.25"/>
      <polygon points="5,5 15,5 5,15" fill="${color}" opacity="0.3"/>
      <polygon points="25,25 35,25 30,35" fill="${color}" opacity="0.15"/>
    </svg>`,

  // Medieval heraldic — shield and cross motifs
  medieval: (color: string) => `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none">
      <path d="M5 5 L5 80 C5 110 25 130 55 130 L130 130 C130 100 130 80 130 55 L130 5"
        stroke="${color}" stroke-width="1" opacity="0.25" stroke-dasharray="4 4"/>
      <path d="M10 10 L10 70 Q10 90 30 100 L70 120"
        stroke="${color}" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
      <path d="M10 10 L70 10 Q90 10 100 30 L120 70"
        stroke="${color}" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
      <path d="M10 10 L30 30" stroke="${color}" stroke-width="1" opacity="0.4"/>
      <circle cx="10" cy="10" r="3" fill="${color}" opacity="0.5"/>
      <path d="M15 40 L15 50 M10 45 L20 45" stroke="${color}" stroke-width="1.5" opacity="0.35"/>
      <path d="M40 15 L50 15 M45 10 L45 20" stroke="${color}" stroke-width="1.5" opacity="0.35"/>
    </svg>`,

  // Sci-fi geometric — clean angular geometry
  scifi: (color: string) => `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none">
      <path d="M5 5 L5 80 L30 105" stroke="${color}" stroke-width="1.5" opacity="0.5"/>
      <path d="M5 5 L80 5 L105 30" stroke="${color}" stroke-width="1.5" opacity="0.5"/>
      <path d="M20 20 L20 55 L45 80" stroke="${color}" stroke-width="1" opacity="0.3" stroke-dasharray="3 3"/>
      <path d="M20 20 L55 20 L80 45" stroke="${color}" stroke-width="1" opacity="0.3" stroke-dasharray="3 3"/>
      <polygon points="5,5 12,5 5,12" fill="${color}" opacity="0.5"/>
      <polygon points="20,20 25,20 20,25" fill="${color}" opacity="0.3"/>
      <circle cx="30" cy="105" r="2.5" fill="none" stroke="${color}" stroke-width="1" opacity="0.4"/>
      <circle cx="105" cy="30" r="2.5" fill="none" stroke="${color}" stroke-width="1" opacity="0.4"/>
      <circle cx="45" cy="80" r="1.5" fill="${color}" opacity="0.25"/>
      <circle cx="80" cy="45" r="1.5" fill="${color}" opacity="0.25"/>
    </svg>`,

  // Fallout retro — worn, atomic-age deco
  fallout: (color: string) => `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none">
      <path d="M5 5 L5 90" stroke="${color}" stroke-width="2" opacity="0.4" stroke-dasharray="8 4"/>
      <path d="M5 5 L90 5" stroke="${color}" stroke-width="2" opacity="0.4" stroke-dasharray="8 4"/>
      <circle cx="5" cy="5" r="8" fill="none" stroke="${color}" stroke-width="1.5" opacity="0.3"/>
      <circle cx="5" cy="5" r="3" fill="${color}" opacity="0.25"/>
      <path d="M15 5 L15 25 L35 25 L35 45" stroke="${color}" stroke-width="1" opacity="0.3"/>
      <path d="M5 15 L25 15 L25 35 L45 35" stroke="${color}" stroke-width="1" opacity="0.3"/>
      <circle cx="35" cy="45" r="2" fill="${color}" opacity="0.2"/>
      <circle cx="45" cy="35" r="2" fill="${color}" opacity="0.2"/>
    </svg>`,
};

// Default fallback
const DEFAULT_PRESET = 'fantasy';

// =============================================================================
// CORNER TRANSFORMS
// =============================================================================

const CORNER_POSITIONS: Record<string, React.CSSProperties> = {
  'top-left': { top: 0, left: 0, transform: 'none' },
  'top-right': { top: 0, right: 0, transform: 'scaleX(-1)' },
  'bottom-left': { bottom: 0, left: 0, transform: 'scaleY(-1)' },
  'bottom-right': { bottom: 0, right: 0, transform: 'scale(-1, -1)' },
};

// =============================================================================
// LOCATION NAME OVERLAY
// =============================================================================

const LocationNameOverlay: React.FC<{
  locationName: string;
  phosphorColor: string;
}> = ({ locationName, phosphorColor }) => {
  const [visible, setVisible] = useState(false);
  const [prevName, setPrevName] = useState(locationName);

  const hex = useMemo(() => ({
    green: '#33ff33',
    amber: '#ffaa00',
    red: '#ff4444',
    blue: '#4488ff',
    white: '#ffffff',
  }[phosphorColor] || '#ffaa00'), [phosphorColor]);

  useEffect(() => {
    if (locationName !== prevName) {
      setVisible(false);
      setPrevName(locationName);
      const timer = setTimeout(() => setVisible(true), 100);
      return () => clearTimeout(timer);
    } else if (!visible) {
      const timer = setTimeout(() => setVisible(true), 300);
      return () => clearTimeout(timer);
    }
  }, [locationName, prevName, visible]);

  if (!locationName) return null;

  return (
    <div
      className="absolute top-3 left-1/2 -translate-x-1/2 z-16 pointer-events-none"
      style={{
        opacity: visible ? 0.7 : 0,
        transition: 'opacity 1.2s ease-out',
      }}
    >
      <div
        className="font-mono text-[10px] uppercase tracking-[0.3em] px-6 py-1.5"
        style={{
          color: hex,
          textShadow: `0 0 8px ${hex}60, 0 0 20px ${hex}30`,
          borderTop: `1px solid ${hex}20`,
          borderBottom: `1px solid ${hex}20`,
          background: `linear-gradient(90deg, transparent, rgba(0,0,0,0.3) 20%, rgba(0,0,0,0.3) 80%, transparent)`,
        }}
      >
        {locationName}
      </div>
    </div>
  );
};

// =============================================================================
// FILIGREE LAYER
// =============================================================================

export const Voice31RPGFiligreeLayer: React.FC<{
  phosphorColor?: string;
}> = ({ phosphorColor = 'amber' }) => {
  const settings = useVoice31RPGStore((s) => s.currentSaveFile?.settings);
  const locationName = useVoice31RPGStore((s) => s.activeScene.location?.name);
  const filigreeTheme = useVoice31RPGStore((s) => s.activeScene.filigreeTheme);

  const hex = useMemo(() => ({
    green: '#33ff33',
    amber: '#ffaa00',
    red: '#ff4444',
    blue: '#4488ff',
    white: '#ffffff',
  }[phosphorColor] || '#ffaa00'), [phosphorColor]);

  // Determine which SVG preset to use based on theme
  const presetKey = useMemo(() => {
    const theme = (filigreeTheme || '').toLowerCase();
    if (theme.includes('cyber') || theme.includes('neon') || theme.includes('tech')) return 'cyberpunk';
    if (theme.includes('noir') || theme.includes('detective') || theme.includes('deco')) return 'noir';
    if (theme.includes('medieval') || theme.includes('castle') || theme.includes('knight')) return 'medieval';
    if (theme.includes('sci') || theme.includes('space') || theme.includes('future')) return 'scifi';
    if (theme.includes('fallout') || theme.includes('wasteland') || theme.includes('apocalyp')) return 'fallout';
    return DEFAULT_PRESET;
  }, [filigreeTheme]);

  const svgContent = useMemo(() => {
    const generator = FILIGREE_PRESETS[presetKey] || FILIGREE_PRESETS[DEFAULT_PRESET];
    return generator(hex);
  }, [presetKey, hex]);

  const svgDataUrl = useMemo(() => {
    const encoded = btoa(unescape(encodeURIComponent(svgContent)));
    return `data:image/svg+xml;base64,${encoded}`;
  }, [svgContent]);

  if (settings?.enableFiligree === false) return null;

  const filigreeOpacity = settings?.filigreeOpacity ?? 0.6;
  const filigreeScale = settings?.filigreeScale ?? 1.0;
  const cornerSize = `${18 * filigreeScale}%`;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* 4 mirrored SVG corners */}
      {Object.entries(CORNER_POSITIONS).map(([corner, style]) => (
        <div
          key={corner}
          className="absolute pointer-events-none filigree-corner-breathe"
          style={{
            ...style,
            width: cornerSize,
            height: cornerSize,
            opacity: filigreeOpacity,
            zIndex: 8,
          }}
        >
          <img
            src={svgDataUrl}
            alt=""
            className="w-full h-full"
            style={{
              filter: `drop-shadow(0 0 4px ${hex}30)`,
            }}
          />
        </div>
      ))}

      {/* Location name overlay */}
      {locationName && (
        <LocationNameOverlay locationName={locationName} phosphorColor={phosphorColor} />
      )}

      <style jsx global>{`
        @keyframes filigree-corner-breathe {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.85; }
        }
        .filigree-corner-breathe {
          animation: filigree-corner-breathe 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default Voice31RPGFiligreeLayer;
