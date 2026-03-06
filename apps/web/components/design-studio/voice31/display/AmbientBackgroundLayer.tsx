'use client';

/**
 * AmbientBackgroundLayer
 *
 * Renders ambient background images inside the CRT with smooth transitions.
 * Two-layer image stack: currentBg → incomingBg with dissolve/static/wipe transitions.
 * 65% dark overlay for text readability + phosphor-color tinting + CRT scanlines.
 *
 * Renders at z-index 2 (behind ContentRenderer z-10, behind persistentImage z-8).
 * Only active when displayLevel >= 'standard'.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useVoice31Store, type AmbientTransitionType } from '../Voice31Store';

// =============================================================================
// TRANSITION DURATIONS
// =============================================================================

const TRANSITION_DURATIONS: Record<AmbientTransitionType, number> = {
  dissolve: 1500,
  crt_static: 1200,
  scanline_wipe: 1000,
};

// =============================================================================
// PHOSPHOR TINT COLORS
// =============================================================================

const PHOSPHOR_TINTS: Record<string, string> = {
  green: 'rgba(51, 255, 51, 0.06)',
  amber: 'rgba(255, 170, 0, 0.06)',
  red: 'rgba(255, 68, 68, 0.06)',
  blue: 'rgba(68, 136, 255, 0.06)',
  white: 'rgba(255, 255, 255, 0.03)',
};

// =============================================================================
// CRT STATIC NOISE OVERLAY (canvas-based)
// =============================================================================

const CRTStaticOverlay: React.FC<{ progress: number; width: number; height: number }> = ({
  progress, width, height,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scale = 4;
    const w = Math.ceil(width / scale);
    const h = Math.ceil(height / scale);
    canvas.width = w;
    canvas.height = h;

    // Static noise intensity peaks at 50% progress
    const noiseIntensity = progress < 0.5
      ? progress * 2
      : (1 - progress) * 2;

    const imageData = ctx.createImageData(w, h);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = Math.random() * 255;
      const alpha = noiseIntensity * (0.3 + Math.random() * 0.7);
      data[i] = noise;
      data[i + 1] = noise;
      data[i + 2] = noise;
      data[i + 3] = alpha * 255;
    }
    ctx.putImageData(imageData, 0, 0);
  }, [progress, width, height]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{
        width: '100%',
        height: '100%',
        imageRendering: 'pixelated',
        zIndex: 5,
      }}
    />
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export const AmbientBackgroundLayer: React.FC = () => {
  const vi = useVoice31Store((s) => s.visualIntelligence);
  const phosphorColor = useVoice31Store((s) => s.phosphorColor);
  const setTransitioning = useVoice31Store((s) => s.setTransitioning);

  const [currentSrc, setCurrentSrc] = useState<string | null>(null);
  const [incomingSrc, setIncomingSrc] = useState<string | null>(null);
  const [transitionProgress, setTransitionProgress] = useState(0);
  const [activeTransition, setActiveTransition] = useState<AmbientTransitionType | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const transitionStartRef = useRef<number>(0);

  // Track container dimensions
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setDimensions({
          width: Math.floor(entry.contentRect.width),
          height: Math.floor(entry.contentRect.height),
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Handle incoming background changes
  useEffect(() => {
    if (!vi.isTransitioning || !vi.incomingBackgroundUrl) return;
    if (vi.incomingBackgroundUrl === incomingSrc) return;

    // Preload the incoming image
    const img = new Image();
    img.onload = () => {
      setIncomingSrc(vi.incomingBackgroundUrl);
      setActiveTransition(vi.transitionType);
      setTransitionProgress(0);
      transitionStartRef.current = performance.now();

      // Animate transition
      const duration = TRANSITION_DURATIONS[vi.transitionType] || 1500;
      const animate = (now: number) => {
        const elapsed = now - transitionStartRef.current;
        const progress = Math.min(1, elapsed / duration);
        setTransitionProgress(progress);

        if (progress < 1) {
          animRef.current = requestAnimationFrame(animate);
        } else {
          // Transition complete
          setCurrentSrc(vi.incomingBackgroundUrl);
          setIncomingSrc(null);
          setActiveTransition(null);
          setTransitionProgress(0);
          setTransitioning(false);
        }
      };
      animRef.current = requestAnimationFrame(animate);
    };
    img.onerror = () => {
      console.warn('[AmbientBG] Failed to load image:', vi.incomingBackgroundUrl);
      setTransitioning(false);
    };
    img.src = vi.incomingBackgroundUrl!;

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [vi.isTransitioning, vi.incomingBackgroundUrl, vi.transitionType, incomingSrc, setTransitioning]);

  // Don't render if display level is off or minimal
  if (vi.displayLevel === 'off' || vi.displayLevel === 'minimal') return null;

  // Don't render if no backgrounds at all
  if (!currentSrc && !incomingSrc) return null;

  const opacity = vi.backgroundOpacity;
  const tint = PHOSPHOR_TINTS[phosphorColor] || PHOSPHOR_TINTS.amber;

  // Compute transition styles for incoming image
  const getIncomingStyle = (): React.CSSProperties => {
    if (!activeTransition) return { opacity: 0 };

    switch (activeTransition) {
      case 'dissolve':
        return { opacity: transitionProgress };

      case 'scanline_wipe':
        return {
          opacity: 1,
          clipPath: `inset(0 0 ${(1 - transitionProgress) * 100}% 0)`,
        };

      case 'crt_static':
        // Image fades in during second half of transition
        return {
          opacity: transitionProgress > 0.5 ? (transitionProgress - 0.5) * 2 : 0,
        };

      default:
        return { opacity: transitionProgress };
    }
  };

  // Current image fades out during transition
  const getCurrentStyle = (): React.CSSProperties => {
    if (!activeTransition || !incomingSrc) return { opacity: 1 };

    switch (activeTransition) {
      case 'dissolve':
        return { opacity: 1 - transitionProgress * 0.3 }; // Slight fade for overlap

      case 'crt_static':
        return { opacity: transitionProgress < 0.5 ? 1 - transitionProgress : 0 };

      case 'scanline_wipe':
        return { opacity: 1 };

      default:
        return { opacity: 1 };
    }
  };

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 2 }}
    >
      {/* Current background */}
      {currentSrc && (
        <div
          className="absolute inset-0 transition-none"
          style={getCurrentStyle()}
        >
          <img
            src={currentSrc}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{ opacity, filter: 'brightness(0.7) contrast(1.1) saturate(0.8)' }}
          />
        </div>
      )}

      {/* Incoming background (transitioning in) */}
      {incomingSrc && (
        <div
          className="absolute inset-0"
          style={getIncomingStyle()}
        >
          <img
            src={incomingSrc}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{ opacity, filter: 'brightness(0.7) contrast(1.1) saturate(0.8)' }}
          />
        </div>
      )}

      {/* CRT Static noise during crt_static transition */}
      {activeTransition === 'crt_static' && transitionProgress > 0 && transitionProgress < 1 && (
        <CRTStaticOverlay
          progress={transitionProgress}
          width={dimensions.width}
          height={dimensions.height}
        />
      )}

      {/* Dark overlay for text readability (65%) */}
      {(currentSrc || incomingSrc) && (
        <div
          className="absolute inset-0"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)', zIndex: 3 }}
        />
      )}

      {/* Phosphor color tint */}
      {(currentSrc || incomingSrc) && (
        <div
          className="absolute inset-0"
          style={{ backgroundColor: tint, zIndex: 4 }}
        />
      )}

      {/* CRT scanline overlay */}
      {(currentSrc || incomingSrc) && (
        <div
          className="absolute inset-0"
          style={{
            zIndex: 4,
            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)',
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
};

export default AmbientBackgroundLayer;
