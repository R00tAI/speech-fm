'use client';

/**
 * Voice31 RPG Background
 *
 * Full-screen background system for RPG mode with:
 * - Theme-appropriate transitions (CRT static, scanline wipe, ink bleed, etc.)
 * - Dark overlay for text readability
 * - Parallax depth effect
 * - Integration with ambient particle effects
 */

import React, { useState, useEffect, useRef } from 'react';
import { useVoice31RPGStore, type SceneTransitionType } from './Voice31RPGStore';
import { Voice31Effects } from './Voice31Effects';
import type { EffectType } from './Voice31Store';

// =============================================================================
// TYPES
// =============================================================================

interface Voice31RPGBackgroundProps {
  width: number;
  height: number;
  phosphorColor?: string;
}

// =============================================================================
// TRANSITION CONFIGS
// =============================================================================

const TRANSITION_DURATIONS: Record<SceneTransitionType, number> = {
  none: 0,
  fade: 800,
  slide: 600,
  dissolve: 1200,
  zoom: 1000,
  crt_static: 1000,
  scanline_wipe: 900,
  ink_bleed: 1400,
};

// =============================================================================
// CRT STATIC TRANSITION - noise burst then reveal
// =============================================================================

const CRTStaticTransition: React.FC<{
  progress: number;
  width: number;
  height: number;
  phosphorColor: string;
}> = ({ progress, width, height, phosphorColor }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  const colors = {
    green: { r: 51, g: 255, b: 51 },
    amber: { r: 255, g: 170, b: 0 },
    red: { r: 255, g: 68, b: 68 },
    blue: { r: 68, g: 136, b: 255 },
    white: { r: 200, g: 200, b: 200 },
  }[phosphorColor] || { r: 255, g: 170, b: 0 };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Render at reduced resolution for pixelated CRT static look
    const scale = 4;
    const w = Math.ceil(width / scale);
    const h = Math.ceil(height / scale);
    canvas.width = w;
    canvas.height = h;

    const draw = () => {
      const imageData = ctx.createImageData(w, h);
      const data = imageData.data;

      // Static intensity peaks in the middle of the transition
      const staticIntensity = progress < 0.5
        ? progress * 2 // Ramp up
        : (1 - progress) * 2; // Ramp down

      for (let i = 0; i < data.length; i += 4) {
        const rand = Math.random();
        const isStatic = rand < staticIntensity;

        if (isStatic) {
          const brightness = Math.random();
          // Tint static with phosphor color
          data[i] = colors.r * brightness * 0.8;
          data[i + 1] = colors.g * brightness * 0.8;
          data[i + 2] = colors.b * brightness * 0.8;
          data[i + 3] = 255;
        } else {
          data[i + 3] = 0; // Transparent
        }
      }

      // Add horizontal interference lines
      const lineCount = Math.floor(staticIntensity * 8);
      for (let l = 0; l < lineCount; l++) {
        const y = Math.floor(Math.random() * h);
        const lineWidth = Math.floor(Math.random() * 3) + 1;
        for (let dy = 0; dy < lineWidth && y + dy < h; dy++) {
          for (let x = 0; x < w; x++) {
            const idx = ((y + dy) * w + x) * 4;
            data[idx] = colors.r;
            data[idx + 1] = colors.g;
            data[idx + 2] = colors.b;
            data[idx + 3] = Math.floor(180 * staticIntensity);
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);
      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [progress, width, height, colors.r, colors.g, colors.b]);

  // Static intensity for opacity
  const staticOpacity = progress < 0.5 ? progress * 2 : (1 - progress) * 2;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-30"
      style={{
        imageRendering: 'pixelated',
        opacity: staticOpacity,
      }}
    />
  );
};

// =============================================================================
// SCANLINE WIPE TRANSITION - horizontal scanline reveals new scene
// =============================================================================

const ScanlineWipeTransition: React.FC<{
  progress: number;
  phosphorColor: string;
}> = ({ progress, phosphorColor }) => {
  const colors = {
    green: '#33ff33',
    amber: '#ffaa00',
    red: '#ff4444',
    blue: '#4488ff',
    white: '#ffffff',
  }[phosphorColor] || '#ffaa00';

  // The wipe line position
  const wipeY = progress * 100;

  return (
    <div className="absolute inset-0 pointer-events-none z-30">
      {/* Dark region being wiped away */}
      <div
        className="absolute left-0 right-0 top-0"
        style={{
          height: `${wipeY}%`,
          opacity: 0,
        }}
      />
      {/* Scanline beam at wipe edge */}
      <div
        className="absolute left-0 right-0"
        style={{
          top: `${wipeY}%`,
          height: '6px',
          background: `linear-gradient(to bottom, ${colors}, transparent)`,
          boxShadow: `0 0 20px ${colors}, 0 0 40px ${colors}`,
          transform: 'translateY(-50%)',
        }}
      />
      {/* Unrevealed region */}
      <div
        className="absolute left-0 right-0 bottom-0"
        style={{
          top: `${wipeY}%`,
          background: 'black',
          opacity: 1 - progress * 0.5,
        }}
      />
    </div>
  );
};

// =============================================================================
// INK BLEED TRANSITION - organic ink-like spread from center
// =============================================================================

const InkBleedTransition: React.FC<{
  progress: number;
  phosphorColor: string;
}> = ({ progress, phosphorColor }) => {
  const colors = {
    green: 'rgba(51, 255, 51, 0.3)',
    amber: 'rgba(255, 170, 0, 0.3)',
    red: 'rgba(255, 68, 68, 0.3)',
    blue: 'rgba(68, 136, 255, 0.3)',
    white: 'rgba(255, 255, 255, 0.3)',
  }[phosphorColor] || 'rgba(255, 170, 0, 0.3)';

  // Ink spreads from center using radial mask
  const radius = progress * 150; // Percentage overshoot for full coverage

  return (
    <div className="absolute inset-0 pointer-events-none z-30">
      {/* Ink bleed mask - covers old scene, shrinks as new scene reveals */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at center, transparent ${radius}%, black ${radius + 5}%)`,
          transition: 'none',
        }}
      />
      {/* Color tint at bleed edge */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at center, transparent ${Math.max(0, radius - 10)}%, ${colors} ${radius}%, transparent ${radius + 15}%)`,
        }}
      />
    </div>
  );
};

// =============================================================================
// DISSOLVE EFFECT COMPONENT
// =============================================================================

const DissolveCanvas: React.FC<{
  fromUrl: string | null;
  toUrl: string | null;
  progress: number;
  width: number;
  height: number;
}> = ({ fromUrl, toUrl, progress, width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fromImageRef = useRef<HTMLImageElement | null>(null);
  const toImageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (fromUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = fromUrl;
      img.onload = () => { fromImageRef.current = img; };
    }
    if (toUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = toUrl;
      img.onload = () => { toImageRef.current = img; };
    }
  }, [fromUrl, toUrl]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    if (fromImageRef.current && progress < 1) {
      ctx.globalAlpha = 1 - progress;
      const fromImg = fromImageRef.current;
      const fromScale = Math.max(width / fromImg.width, height / fromImg.height);
      const fromW = fromImg.width * fromScale;
      const fromH = fromImg.height * fromScale;
      const fromX = (width - fromW) / 2;
      const fromY = (height - fromH) / 2;
      ctx.drawImage(fromImg, fromX, fromY, fromW, fromH);
    }

    if (toImageRef.current && progress > 0) {
      ctx.globalAlpha = progress;
      const toImg = toImageRef.current;
      const toScale = Math.max(width / toImg.width, height / toImg.height);
      const toW = toImg.width * toScale;
      const toH = toImg.height * toScale;
      const toX = (width - toW) / 2;
      const toY = (height - toH) / 2;
      ctx.drawImage(toImg, toX, toY, toW, toH);
    }

    ctx.globalAlpha = 1;
  }, [progress, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute inset-0 w-full h-full"
    />
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export const Voice31RPGBackground: React.FC<Voice31RPGBackgroundProps> = ({
  width,
  height,
  phosphorColor = 'amber',
}) => {
  const activeScene = useVoice31RPGStore((s) => s.activeScene);
  const currentSaveFile = useVoice31RPGStore((s) => s.currentSaveFile);
  const settings = currentSaveFile?.settings;

  const [prevBackgroundUrl, setPrevBackgroundUrl] = useState<string | null>(null);
  const [currentBackgroundUrl, setCurrentBackgroundUrl] = useState<string | null>(null);
  const [transitionProgress, setTransitionProgress] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const transitionRef = useRef<number | null>(null);
  const parallaxRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const prevBgRef = useRef<HTMLDivElement>(null);
  const currBgRef = useRef<HTMLDivElement>(null);

  const transitionType = activeScene.backgroundTransition;
  // Use per-type duration by default; only use user's custom speed if they changed it from the default 800ms
  const defaultSpeed = 800;
  const userSpeed = settings?.backgroundTransitionSpeed;
  const transitionDuration = (userSpeed && userSpeed !== defaultSpeed)
    ? userSpeed
    : TRANSITION_DURATIONS[transitionType];

  // Handle background URL changes
  useEffect(() => {
    const newUrl = activeScene.backgroundUrl;

    if (newUrl !== currentBackgroundUrl && newUrl !== null) {
      setPrevBackgroundUrl(currentBackgroundUrl);
      setCurrentBackgroundUrl(newUrl);
      setTransitionProgress(0);
      setIsTransitioning(true);

      if (transitionRef.current) {
        cancelAnimationFrame(transitionRef.current);
      }

      if (transitionType === 'none' || !currentBackgroundUrl) {
        setTransitionProgress(1);
        setIsTransitioning(false);
        return;
      }

      const startTime = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(1, elapsed / transitionDuration);
        const eased = 1 - Math.pow(1 - progress, 3);
        setTransitionProgress(eased);

        if (progress < 1) {
          transitionRef.current = requestAnimationFrame(animate);
        } else {
          setIsTransitioning(false);
          setPrevBackgroundUrl(null);
        }
      };

      transitionRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (transitionRef.current) {
        cancelAnimationFrame(transitionRef.current);
      }
    };
  }, [activeScene.backgroundUrl, transitionType, transitionDuration, currentBackgroundUrl]);

  // Parallax mouse tracking - directly update DOM transforms to avoid React re-render dependency
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const x = (e.clientX - centerX) / centerX * 15;
      const y = (e.clientY - centerY) / centerY * 10;
      parallaxRef.current = { x, y };

      // Directly update DOM for smooth parallax without waiting for React re-render
      const transform = `translate(${-x}px, ${-y}px)`;
      if (prevBgRef.current) {
        prevBgRef.current.style.transform = transform;
      }
      if (currBgRef.current) {
        currBgRef.current.style.transform = transform;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const ambientEffect = activeScene.location?.ambientEffect;
  const ambientIntensity = activeScene.location?.ambientIntensity || 0.5;
  const overlayOpacity = 0.40;

  // Get transition styles for basic CSS transitions
  const getTransitionStyles = (isPrev: boolean): React.CSSProperties => {
    const progress = isPrev ? 1 - transitionProgress : transitionProgress;

    switch (transitionType) {
      case 'fade':
        return { opacity: progress };

      case 'slide': {
        const slideOffset = isPrev ? -100 * transitionProgress : 100 * (1 - transitionProgress);
        return { opacity: progress, transform: `translateX(${slideOffset}%)` };
      }

      case 'zoom': {
        const scale = isPrev
          ? 1 + (0.2 * transitionProgress)
          : 0.8 + (0.2 * transitionProgress);
        return { opacity: progress, transform: `scale(${scale})` };
      }

      case 'dissolve':
        return { opacity: 0 }; // Handled by canvas

      // For CRT/scanline/ink transitions, both images crossfade, overlay handles the effect
      case 'crt_static':
      case 'scanline_wipe':
      case 'ink_bleed': {
        // Old scene fades out, new scene fades in
        const alpha = isPrev ? 1 - transitionProgress : transitionProgress;
        return { opacity: alpha };
      }

      default:
        return { opacity: progress };
    }
  };

  // Whether we need themed transition overlay
  const needsTransitionOverlay = isTransitioning && (
    transitionType === 'crt_static' ||
    transitionType === 'scanline_wipe' ||
    transitionType === 'ink_bleed'
  );

  // Loading state — show subtle indicator overlaid on current scene instead of black screen
  const showLoadingIndicator = activeScene.backgroundLoading;

  const phosphorHex = ({
    green: '#33ff33',
    amber: '#ffaa00',
    red: '#ff4444',
    blue: '#4488ff',
    white: '#ffffff',
  } as Record<string, string>)[phosphorColor] || '#ffaa00';

  // No background set — show CRT-styled loading state
  if (!currentBackgroundUrl && !prevBackgroundUrl) {
    const locationName = activeScene.location?.name;
    return (
      <div className="absolute inset-0 bg-black">
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: `
              linear-gradient(to right, ${phosphorHex} 1px, transparent 1px),
              linear-gradient(to bottom, ${phosphorHex} 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />
        {/* CRT loading indicator — centered */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
          {locationName && (
            <div
              className="font-mono text-sm uppercase tracking-[0.3em] opacity-60"
              style={{ color: phosphorHex, textShadow: `0 0 10px ${phosphorHex}40` }}
            >
              {locationName}
            </div>
          )}
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1.5 h-4 rounded-sm"
                  style={{
                    backgroundColor: phosphorHex,
                    opacity: 0.6,
                    animation: `rpgLoadPulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                  }}
                />
              ))}
            </div>
            <span
              className="font-mono text-[11px] uppercase tracking-wider opacity-50"
              style={{ color: phosphorHex }}
            >
              {showLoadingIndicator ? 'Generating scene...' : 'Awaiting scene...'}
            </span>
          </div>
        </div>
        <style jsx>{`
          @keyframes rpgLoadPulse {
            0%, 100% { transform: scaleY(0.4); opacity: 0.3; }
            50% { transform: scaleY(1); opacity: 0.8; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Dissolve transition (uses canvas) */}
      {transitionType === 'dissolve' && isTransitioning && (
        <DissolveCanvas
          fromUrl={prevBackgroundUrl}
          toUrl={currentBackgroundUrl}
          progress={transitionProgress}
          width={width}
          height={height}
        />
      )}

      {/* Previous background (during non-dissolve transitions) */}
      {transitionType !== 'dissolve' && prevBackgroundUrl && isTransitioning && (
        <div
          ref={prevBgRef}
          className="absolute inset-0 transition-none"
          style={getTransitionStyles(true)}
        >
          <img
            src={prevBackgroundUrl}
            alt="Previous scene"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ transform: 'scale(1.1)' }}
          />
        </div>
      )}

      {/* Current background */}
      {transitionType !== 'dissolve' && currentBackgroundUrl && (
        <div
          ref={currBgRef}
          className="absolute inset-0 transition-none"
          style={getTransitionStyles(false)}
        >
          <img
            src={currentBackgroundUrl}
            alt="Current scene"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ transform: 'scale(1.1)' }}
          />
        </div>
      )}

      {/* Theme-appropriate transition overlays */}
      {needsTransitionOverlay && transitionType === 'crt_static' && (
        <CRTStaticTransition
          progress={transitionProgress}
          width={width}
          height={height}
          phosphorColor={phosphorColor}
        />
      )}
      {needsTransitionOverlay && transitionType === 'scanline_wipe' && (
        <ScanlineWipeTransition
          progress={transitionProgress}
          phosphorColor={phosphorColor}
        />
      )}
      {needsTransitionOverlay && transitionType === 'ink_bleed' && (
        <InkBleedTransition
          progress={transitionProgress}
          phosphorColor={phosphorColor}
        />
      )}

      {/* Dark overlay for text readability — reduced by ~20% */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            linear-gradient(
              to bottom,
              rgba(0, 0, 0, ${overlayOpacity * 0.65}) 0%,
              rgba(0, 0, 0, ${overlayOpacity * 0.35}) 30%,
              rgba(0, 0, 0, ${overlayOpacity * 0.3}) 50%,
              rgba(0, 0, 0, ${overlayOpacity * 0.35}) 70%,
              rgba(0, 0, 0, ${overlayOpacity * 0.75}) 100%
            )
          `,
        }}
      />

      {/* Dynamic color grading overlay — tinted by location keywords */}
      {(() => {
        const locationName = (activeScene.location?.name || '').toLowerCase();
        let tint: string | null = null;

        if (/forest|grove|woods|garden|jungle|swamp/.test(locationName)) {
          tint = 'rgba(40, 80, 30, 0.04)';
        } else if (/cave|dungeon|crypt|tomb|catacomb|mine/.test(locationName)) {
          tint = 'rgba(20, 30, 60, 0.06)';
        } else if (/desert|sand|fire|volcano|lava|inferno/.test(locationName)) {
          tint = 'rgba(80, 50, 20, 0.05)';
        } else if (/night|dark|shadow|moon|void|abyss/.test(locationName)) {
          tint = 'rgba(10, 15, 40, 0.08)';
        } else if (/tavern|inn|hearth|camp|village|home/.test(locationName)) {
          tint = 'rgba(60, 35, 10, 0.05)';
        } else if (/ocean|sea|river|lake|harbor|port|shore/.test(locationName)) {
          tint = 'rgba(15, 50, 60, 0.05)';
        } else if (/snow|ice|frost|frozen|tundra|glacier/.test(locationName)) {
          tint = 'rgba(40, 50, 65, 0.05)';
        }

        if (!tint) return null;

        return (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ backgroundColor: tint }}
          />
        );
      })()}

      {/* Side vignette — softened */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(
              ellipse at center,
              transparent 50%,
              rgba(0, 0, 0, 0.35) 100%
            )
          `,
        }}
      />

      {/* Scanline overlay for CRT effect */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              to bottom,
              transparent 0px,
              transparent 1px,
              rgba(0, 0, 0, 0.8) 1px,
              rgba(0, 0, 0, 0.8) 2px
            )
          `,
        }}
      />

      {/* Ambient effect overlay */}
      {ambientEffect && settings?.ambientEffectsEnabled !== false && (
        <Voice31Effects
          effect={{
            type: ambientEffect as EffectType,
            intensity: ambientIntensity,
            duration: 999999999,
            startTime: Date.now(),
          }}
          width={width}
          height={height}
        />
      )}

      {/* Phosphor glow edge */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          boxShadow: `inset 0 0 100px rgba(0, 0, 0, 0.8)`,
        }}
      />

      {/* Loading indicator — overlaid on existing scene */}
      {showLoadingIndicator && (
        <div className="absolute bottom-4 right-4 z-10 pointer-events-none flex items-center gap-2 px-3 py-1.5 rounded"
          style={{ background: 'rgba(0,0,0,0.5)', border: `1px solid ${phosphorHex}20` }}>
          <div className="flex gap-0.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1 h-3 rounded-sm"
                style={{
                  backgroundColor: phosphorHex,
                  animation: `rpgLoadPulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
          </div>
          <span
            className="font-mono text-[10px] uppercase tracking-wider opacity-70"
            style={{ color: phosphorHex }}
          >
            Generating scene...
          </span>
        </div>
      )}
      <style jsx>{`
        @keyframes rpgLoadPulse {
          0%, 100% { transform: scaleY(0.4); opacity: 0.3; }
          50% { transform: scaleY(1); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
};

export default Voice31RPGBackground;
