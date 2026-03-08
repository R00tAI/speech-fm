'use client';

/**
 * Voice31 RPG Character
 *
 * NPC portrait display system with:
 * - Transparent background portraits
 * - Smooth entrance/exit animations
 * - Position-aware placement (left/right/center)
 * - Speaking indicator with glow
 * - Name plate with title
 * - Relationship indicator
 * - Dialogue bubble
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useVoice31RPGStore, type NPCharacter, type NPCPosition } from './Voice31RPGStore';

// =============================================================================
// TYPES
// =============================================================================

interface Voice31RPGCharacterProps {
  npc: NPCharacter;
  phosphorColor?: string;
  onDismiss?: () => void;
}

interface CharacterContainerProps {
  children: React.ReactNode;
  position: NPCPosition;
  displaySize?: 'large' | 'medium' | 'small';
  isVisible: boolean;
  isSpeaking: boolean;
  phosphorColor: string;
}

// =============================================================================
// POSITION CONFIGS
// =============================================================================

// Bottom offset above voice controls bar (fixed ~80px for controls + margin)
const CONTROLS_OFFSET = '90px';

// Dynamic position calculation based on NPC count and position slot
function getPositionStyle(
  position: NPCPosition,
  displaySize?: 'large' | 'medium' | 'small',
): React.CSSProperties {
  switch (position) {
    case 'left':
      return { left: '3%', bottom: CONTROLS_OFFSET, transform: 'translateX(0)' };
    case 'right':
      return { right: '3%', bottom: CONTROLS_OFFSET, transform: 'translateX(0)' };
    case 'center':
      return { left: '50%', bottom: CONTROLS_OFFSET, transform: 'translateX(-50%)' };
    default:
      return { left: '50%', bottom: CONTROLS_OFFSET, transform: 'translateX(-50%)' };
  }
}

// Portrait size as viewport-relative values with max caps
function getPortraitDimensions(displaySize?: 'large' | 'medium' | 'small'): { maxHeight: string; maxWidth: string } {
  switch (displaySize) {
    case 'large': return { maxHeight: 'min(35vh, 340px)', maxWidth: '20vw' };
    case 'small': return { maxHeight: 'min(20vh, 160px)', maxWidth: '12vw' };
    case 'medium':
    default: return { maxHeight: 'min(28vh, 240px)', maxWidth: '16vw' };
  }
}

const ENTER_ANIMATIONS: Record<NPCPosition, string> = {
  left: 'animate-slide-in-left',
  right: 'animate-slide-in-right',
  center: 'animate-fade-in-up',
};

// =============================================================================
// RELATIONSHIP COLORS
// =============================================================================

const getRelationshipColor = (relationship: number): string => {
  if (relationship >= 75) return '#00ff88'; // Friendly (green)
  if (relationship >= 25) return '#88ff00'; // Positive (lime)
  if (relationship >= -25) return '#ffaa00'; // Neutral (amber)
  if (relationship >= -75) return '#ff6600'; // Negative (orange)
  return '#ff3333'; // Hostile (red)
};

const getRelationshipLabel = (relationship: number): string => {
  if (relationship >= 75) return 'Trusted Ally';
  if (relationship >= 50) return 'Friend';
  if (relationship >= 25) return 'Friendly';
  if (relationship >= -25) return 'Neutral';
  if (relationship >= -50) return 'Wary';
  if (relationship >= -75) return 'Hostile';
  return 'Enemy';
};

// =============================================================================
// CHARACTER CONTAINER
// =============================================================================

const CharacterContainer: React.FC<CharacterContainerProps> = ({
  children,
  position,
  displaySize,
  isVisible,
  isSpeaking,
  phosphorColor,
}) => {
  const [mounted, setMounted] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (isVisible && !mounted) {
      setMounted(true);
      setExiting(false);
    } else if (!isVisible && mounted) {
      setExiting(true);
      const timer = setTimeout(() => {
        setMounted(false);
        setExiting(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isVisible, mounted]);

  if (!mounted) return null;

  const positionStyle = getPositionStyle(position, displaySize);
  const animation = exiting ? 'animate-fade-out' : ENTER_ANIMATIONS[position];

  return (
    <div
      className={`absolute z-20 ${animation}`}
      style={{
        ...positionStyle,
        transition: 'all 0.3s ease-out',
      }}
    >
      {/* Speaking glow effect */}
      {isSpeaking && (
        <div
          className="absolute inset-0 -z-10 animate-pulse"
          style={{
            background: `radial-gradient(ellipse at center bottom, var(--phosphor-${phosphorColor}, #ffaa00) 0%, transparent 70%)`,
            filter: 'blur(30px)',
            opacity: 0.4,
            transform: 'scale(1.5)',
          }}
        />
      )}
      {children}
    </div>
  );
};

// =============================================================================
// NPC PORTRAIT
// =============================================================================

const NPCPortrait: React.FC<{
  npc: NPCharacter;
  phosphorColor: string;
}> = ({ npc, phosphorColor }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [breathOffset, setBreathOffset] = useState(0);

  // Breathing animation for depth wobble
  useEffect(() => {
    const interval = setInterval(() => {
      setBreathOffset(Math.sin(Date.now() * 0.001) * 2);
    }, 32);
    return () => clearInterval(interval);
  }, []);

  // Reset state when portrait URL changes
  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
  }, [npc.portraitUrl, npc.portraitBgRemovedUrl]);

  // Use bg-removed portrait if available
  const displayUrl = npc.portraitBgRemovedUrl || npc.portraitUrl;
  const dims = getPortraitDimensions(npc.displaySize);

  if (!displayUrl || imageError) {
    // Placeholder portrait - frameless, uses initial
    return (
      <div
        className="flex items-center justify-center"
        style={{
          width: dims.maxWidth,
          height: dims.maxHeight,
          background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.4) 0%, transparent 70%)',
        }}
      >
        <div className="text-center">
          <div
            className="text-7xl mb-2 font-mono animate-pulse"
            style={{
              color: `var(--phosphor-${phosphorColor}, #ffaa00)`,
              textShadow: `0 0 30px var(--phosphor-${phosphorColor}, #ffaa00)`,
            }}
          >
            {npc.name.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative"
      style={{
        height: dims.maxHeight,
        maxWidth: dims.maxWidth,
      }}
    >
      {/* Loading state */}
      {!imageLoaded && (
        <div
          className="absolute inset-0 flex items-center justify-center animate-pulse"
          style={{ background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.3) 0%, transparent 70%)' }}
        >
          <div
            className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: `var(--phosphor-${phosphorColor}, #ffaa00)`, borderTopColor: 'transparent' }}
          />
        </div>
      )}

      {/* Frameless portrait with depth wobble */}
      <img
        src={displayUrl}
        alt={npc.name}
        className={`h-full w-auto object-contain transition-all duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
        style={{
          filter: npc.isSpeaking
            ? 'drop-shadow(0 0 25px rgba(255, 170, 0, 0.6))'
            : 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))',
          transform: npc.portraitDepthUrl
            ? `translateY(${breathOffset}px) scale(${1 + breathOffset * 0.003})`
            : undefined,
        }}
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageError(true)}
      />

      {/* Subtle relationship glow at base (replaces hard border) */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{
          width: '120%',
          height: '30px',
          background: `radial-gradient(ellipse at center, ${getRelationshipColor(npc.relationship)}30 0%, transparent 70%)`,
          filter: 'blur(8px)',
        }}
      />
    </div>
  );
};

// =============================================================================
// NAME PLATE
// =============================================================================

const NamePlate: React.FC<{
  name: string;
  title?: string;
  relationship: number;
  phosphorColor: string;
  isSpeaking: boolean;
}> = ({ name, title, relationship, phosphorColor, isSpeaking }) => {
  return (
    <div
      className="relative px-3 py-1.5 rounded mt-1 max-w-[180px]"
      style={{
        background: 'rgba(0, 0, 0, 0.8)',
        borderBottom: `2px solid ${getRelationshipColor(relationship)}`,
        boxShadow: isSpeaking
          ? `0 0 12px ${getRelationshipColor(relationship)}40`
          : 'none',
        backdropFilter: 'blur(4px)',
      }}
    >
      {/* Speaking indicator */}
      {isSpeaking && (
        <div className="absolute -top-1 -right-1 flex gap-0.5">
          <span className="w-1 h-1 rounded-full bg-current animate-bounce" style={{ color: `var(--phosphor-${phosphorColor}, #ffaa00)`, animationDelay: '0ms' }} />
          <span className="w-1 h-1 rounded-full bg-current animate-bounce" style={{ color: `var(--phosphor-${phosphorColor}, #ffaa00)`, animationDelay: '150ms' }} />
          <span className="w-1 h-1 rounded-full bg-current animate-bounce" style={{ color: `var(--phosphor-${phosphorColor}, #ffaa00)`, animationDelay: '300ms' }} />
        </div>
      )}

      {/* Name + relationship label inline */}
      <div className="flex items-center justify-between gap-2">
        <div
          className="font-mono font-bold text-xs tracking-wide truncate"
          style={{ color: `var(--phosphor-${phosphorColor}, #ffaa00)` }}
        >
          {name.toUpperCase()}
        </div>
        <div
          className="text-[9px] font-mono uppercase shrink-0"
          style={{ color: getRelationshipColor(relationship) }}
        >
          {getRelationshipLabel(relationship)}
        </div>
      </div>

      {/* Title */}
      {title && (
        <div
          className="font-mono text-[10px] opacity-60 truncate"
          style={{ color: getRelationshipColor(relationship) }}
        >
          {title}
        </div>
      )}

      {/* Compact relationship bar */}
      <div className="h-0.5 rounded-full bg-black/50 overflow-hidden mt-1">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${Math.abs(relationship)}%`,
            backgroundColor: getRelationshipColor(relationship),
            marginLeft: relationship < 0 ? `${100 - Math.abs(relationship)}%` : 0,
          }}
        />
      </div>
    </div>
  );
};

// =============================================================================
// DIALOGUE BUBBLE
// =============================================================================

const DialogueBubble: React.FC<{
  text: string;
  position: NPCPosition;
  phosphorColor: string;
}> = ({ text, position, phosphorColor }) => {
  const bubblePosition = position === 'left' ? 'left-full ml-4' : position === 'right' ? 'right-full mr-4' : 'left-1/2 -translate-x-1/2 bottom-full mb-4';

  return (
    <div
      className={`absolute ${bubblePosition} max-w-xs`}
      style={{
        top: position !== 'center' ? '20%' : undefined,
      }}
    >
      <div
        className="relative px-4 py-3 rounded-lg font-mono text-sm"
        style={{
          background: 'rgba(0, 0, 0, 0.9)',
          border: `1px solid var(--phosphor-${phosphorColor}, #ffaa00)`,
          color: `var(--phosphor-${phosphorColor}, #ffaa00)`,
          boxShadow: `0 0 20px rgba(255, 170, 0, 0.2)`,
        }}
      >
        {/* Bubble pointer */}
        <div
          className="absolute w-3 h-3 rotate-45"
          style={{
            background: 'rgba(0, 0, 0, 0.9)',
            border: `1px solid var(--phosphor-${phosphorColor}, #ffaa00)`,
            borderTop: 'none',
            borderRight: 'none',
            ...(position === 'left' ? { left: '-7px', top: '20px' } : {}),
            ...(position === 'right' ? { right: '-7px', top: '20px', transform: 'rotate(225deg)' } : {}),
            ...(position === 'center' ? { bottom: '-7px', left: '50%', marginLeft: '-6px', transform: 'rotate(-45deg)' } : {}),
          }}
        />

        {/* Text with typing effect */}
        <p className="relative z-10 leading-relaxed">
          "{text}"
        </p>
      </div>
    </div>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export const Voice31RPGCharacter: React.FC<Voice31RPGCharacterProps> = ({
  npc,
  phosphorColor = 'amber',
  onDismiss,
}) => {
  return (
    <CharacterContainer
      position={npc.position}
      displaySize={npc.displaySize}
      isVisible={npc.isVisible}
      isSpeaking={npc.isSpeaking}
      phosphorColor={phosphorColor}
    >
      <div className="flex flex-col items-center relative">
        {/* Dialogue bubble */}
        {npc.isSpeaking && npc.currentDialogue && (
          <DialogueBubble
            text={npc.currentDialogue}
            position={npc.position}
            phosphorColor={phosphorColor}
          />
        )}

        {/* Portrait */}
        <NPCPortrait npc={npc} phosphorColor={phosphorColor} />

        {/* Name plate */}
        <NamePlate
          name={npc.name}
          title={npc.title}
          relationship={npc.relationship}
          phosphorColor={phosphorColor}
          isSpeaking={npc.isSpeaking}
        />
      </div>
    </CharacterContainer>
  );
};

// =============================================================================
// NPC LAYER (Renders all active NPCs)
// =============================================================================

export const Voice31RPGCharacterLayer: React.FC<{
  phosphorColor?: string;
}> = ({ phosphorColor = 'amber' }) => {
  const activeNPCs = useVoice31RPGStore((s) => s.activeScene.activeNPCs);
  const dismissNPC = useVoice31RPGStore((s) => s.dismissNPC);

  // Filter only visible NPCs
  const visibleNPCs = useMemo(
    () => activeNPCs.filter((npc) => npc.isVisible),
    [activeNPCs]
  );

  if (visibleNPCs.length === 0) return null;

  return (
    <>
      <div className="absolute inset-0 pointer-events-none z-20">
        {visibleNPCs.map((npc) => (
          <Voice31RPGCharacter
            key={npc.id}
            npc={npc}
            phosphorColor={phosphorColor}
            onDismiss={() => dismissNPC(npc.id)}
          />
        ))}
      </div>

      {/* Animation keyframes for character entrance/exit */}
      <style jsx global>{`
        @keyframes slide-in-left {
          from {
            opacity: 0;
            transform: translateX(-100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slide-in-right {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }

        @keyframes fade-out {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }

        .animate-slide-in-left {
          animation: slide-in-left 0.5s ease-out forwards;
        }

        .animate-slide-in-right {
          animation: slide-in-right 0.5s ease-out forwards;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out forwards;
        }

        .animate-fade-out {
          animation: fade-out 0.5s ease-out forwards;
        }
      `}</style>
    </>
  );
};

export default Voice31RPGCharacter;
