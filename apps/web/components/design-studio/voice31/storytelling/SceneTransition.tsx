'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { TransitionType } from './types';

// Duration lookup per transition type (ms)
export const TRANSITION_DURATIONS: Record<TransitionType, number> = {
  fade: 800,
  wipe_left: 900,
  wipe_right: 900,
  iris: 1000,
  dissolve: 1200,
  cut: 0,
  crt_static: 1000,
  scanline_wipe: 900,
  ink_bleed: 1400,
  zoom_blur: 800,
  glitch: 600,
};

// Easing functions
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

interface SceneTransitionProps {
  type: TransitionType;
  isTransitioning: boolean;
  /** The outgoing scene content */
  outgoing: React.ReactNode | null;
  /** The incoming scene content */
  children: React.ReactNode;
}

export const SceneTransition: React.FC<SceneTransitionProps> = ({
  type = 'fade',
  isTransitioning,
  outgoing,
  children,
}) => {
  const [progress, setProgress] = useState(0); // 0→1 during transition
  const [active, setActive] = useState(false);
  const rafRef = useRef<number>(0);
  const startRef = useRef(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const duration = TRANSITION_DURATIONS[type] || 800;

  // Start RAF loop on transition
  useEffect(() => {
    if (!isTransitioning || type === 'cut') {
      setActive(false);
      setProgress(0);
      return;
    }

    setActive(true);
    setProgress(0);
    startRef.current = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startRef.current;
      const raw = Math.min(elapsed / duration, 1);
      const eased = easeInOutCubic(raw);
      setProgress(eased);

      if (raw < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setActive(false);
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isTransitioning, type, duration]);

  // CRT static / glitch canvas noise
  useEffect(() => {
    if (!active) return;
    if (type !== 'crt_static' && type !== 'glitch') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 128;
    canvas.height = 128;

    let animId = 0;
    const drawNoise = () => {
      const imageData = ctx.createImageData(128, 128);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const v = Math.random() * 255;
        if (type === 'crt_static') {
          // Phosphor green tint
          data[i] = v * 0.3;
          data[i + 1] = v * 0.9;
          data[i + 2] = v * 0.4;
        } else {
          // RGB shift for glitch
          data[i] = Math.random() > 0.5 ? 255 : 0;
          data[i + 1] = Math.random() > 0.5 ? 255 : 0;
          data[i + 2] = Math.random() > 0.5 ? 255 : 0;
        }
        data[i + 3] = 255;
      }
      ctx.putImageData(imageData, 0, 0);
      animId = requestAnimationFrame(drawNoise);
    };
    drawNoise();

    return () => cancelAnimationFrame(animId);
  }, [active, type]);

  // If not transitioning, just show incoming
  if (!active && !isTransitioning) {
    return <div style={{ position: 'absolute', inset: 0 }}>{children}</div>;
  }

  // Compute styles for outgoing and incoming layers based on transition type + progress
  const getLayerStyles = (): {
    outStyle: React.CSSProperties;
    inStyle: React.CSSProperties;
    overlayStyle?: React.CSSProperties;
  } => {
    const absBase: React.CSSProperties = { position: 'absolute', inset: 0 };

    switch (type) {
      case 'fade':
        return {
          outStyle: { ...absBase, opacity: 1 - progress },
          inStyle: { ...absBase, opacity: progress },
        };

      case 'dissolve':
        return {
          outStyle: {
            ...absBase,
            opacity: 1 - progress,
            filter: `blur(${progress * 8}px)`,
          },
          inStyle: {
            ...absBase,
            opacity: progress,
            filter: `blur(${(1 - progress) * 8}px)`,
          },
        };

      case 'wipe_left': {
        const glowX = progress * 100;
        return {
          outStyle: {
            ...absBase,
            clipPath: `inset(0 0 0 ${progress * 100}%)`,
          },
          inStyle: {
            ...absBase,
            clipPath: `inset(0 ${(1 - progress) * 100}% 0 0)`,
          },
          overlayStyle: {
            ...absBase,
            pointerEvents: 'none' as const,
            background: `linear-gradient(90deg, transparent ${glowX - 3}%, rgba(255,255,255,0.15) ${glowX}%, transparent ${glowX + 3}%)`,
            zIndex: 10,
          },
        };
      }

      case 'wipe_right': {
        const glowX = (1 - progress) * 100;
        return {
          outStyle: {
            ...absBase,
            clipPath: `inset(0 ${progress * 100}% 0 0)`,
          },
          inStyle: {
            ...absBase,
            clipPath: `inset(0 0 0 ${(1 - progress) * 100}%)`,
          },
          overlayStyle: {
            ...absBase,
            pointerEvents: 'none' as const,
            background: `linear-gradient(90deg, transparent ${glowX - 3}%, rgba(255,255,255,0.15) ${glowX}%, transparent ${glowX + 3}%)`,
            zIndex: 10,
          },
        };
      }

      case 'iris': {
        const radius = progress * 85;
        return {
          outStyle: {
            ...absBase,
            clipPath: `circle(${Math.max(0, 85 - radius)}% at 50% 50%)`,
          },
          inStyle: {
            ...absBase,
            clipPath: `circle(${radius}% at 50% 50%)`,
            filter: progress < 0.3 ? `blur(${(0.3 - progress) * 10}px)` : 'none',
          },
        };
      }

      case 'crt_static':
        return {
          outStyle: { ...absBase, opacity: 1 - progress },
          inStyle: { ...absBase, opacity: progress },
          overlayStyle: {
            ...absBase,
            pointerEvents: 'none' as const,
            zIndex: 10,
            // Noise intensity peaks in the middle of transition
            opacity: Math.sin(progress * Math.PI) * 0.7,
          },
        };

      case 'scanline_wipe': {
        const scanY = progress * 100;
        return {
          outStyle: {
            ...absBase,
            clipPath: `inset(${progress * 100}% 0 0 0)`,
          },
          inStyle: {
            ...absBase,
            clipPath: `inset(0 0 ${(1 - progress) * 100}% 0)`,
          },
          overlayStyle: {
            ...absBase,
            pointerEvents: 'none' as const,
            zIndex: 10,
            background: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(255,255,255,0.03) 2px,
              rgba(255,255,255,0.03) 4px
            )`,
            opacity: Math.sin(progress * Math.PI) * 0.8,
            // Bright scanline
            boxShadow: `inset 0 ${scanY}vh 0 0 transparent, inset 0 calc(${scanY}vh + 2px) 0 0 rgba(255,255,255,0.2)`,
          },
        };
      }

      case 'ink_bleed': {
        // Organic circle-based reveal using multiple clip circles
        const r1 = progress * 120;
        const r2 = Math.max(0, progress - 0.15) * 100;
        const r3 = Math.max(0, progress - 0.3) * 90;
        return {
          outStyle: {
            ...absBase,
            opacity: Math.max(0, 1 - progress * 1.5),
          },
          inStyle: {
            ...absBase,
            clipPath: `circle(${r1}% at 30% 40%)`,
            filter: progress < 0.4 ? `blur(${(0.4 - progress) * 6}px)` : 'none',
          },
          overlayStyle: {
            ...absBase,
            pointerEvents: 'none' as const,
            zIndex: 10,
            background: `radial-gradient(circle at 30% 40%, rgba(0,0,0,0.3) 0%, transparent ${r2}%)`,
            opacity: Math.sin(progress * Math.PI) * 0.4,
          },
        };
      }

      case 'zoom_blur':
        return {
          outStyle: {
            ...absBase,
            opacity: 1 - progress,
            transform: `scale(${1 + progress * 0.3})`,
            filter: `blur(${progress * 12}px)`,
          },
          inStyle: {
            ...absBase,
            opacity: progress,
            transform: `scale(${1.3 - progress * 0.3})`,
            filter: `blur(${(1 - progress) * 12}px)`,
          },
        };

      case 'glitch': {
        // RGB shift + block displacement
        const shift = Math.sin(progress * Math.PI * 8) * (1 - progress) * 10;
        return {
          outStyle: {
            ...absBase,
            opacity: 1 - progress,
            transform: `translateX(${shift}px)`,
            filter: progress > 0.3 && progress < 0.7
              ? `hue-rotate(${Math.random() * 360}deg)`
              : 'none',
          },
          inStyle: {
            ...absBase,
            opacity: progress,
            transform: `translateX(${-shift}px)`,
          },
          overlayStyle: {
            ...absBase,
            pointerEvents: 'none' as const,
            zIndex: 10,
            opacity: Math.sin(progress * Math.PI) * 0.5,
          },
        };
      }

      case 'cut':
      default:
        return {
          outStyle: { ...absBase, opacity: 0 },
          inStyle: { ...absBase, opacity: 1 },
        };
    }
  };

  const { outStyle, inStyle, overlayStyle } = getLayerStyles();

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* Outgoing scene */}
      {outgoing && <div style={outStyle}>{outgoing}</div>}

      {/* Incoming scene */}
      <div style={inStyle}>{children}</div>

      {/* Transition overlay (noise, scanlines, glow edge) */}
      {overlayStyle && (
        <div style={overlayStyle}>
          {(type === 'crt_static' || type === 'glitch') && (
            <canvas
              ref={canvasRef}
              style={{
                width: '100%',
                height: '100%',
                imageRendering: 'pixelated',
              }}
            />
          )}
        </div>
      )}
    </div>
  );
};
