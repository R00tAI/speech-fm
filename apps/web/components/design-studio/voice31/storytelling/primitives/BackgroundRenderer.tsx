'use client';

import React, { useMemo } from 'react';
import type { SceneType } from '../types';
import type { PatternType } from '@/components/art/AlgorithmicBackground';
import { Particles } from './Particles';
import { CircleWave } from './CircleWave';
import { GridLines } from './GridLines';
import { FilmGrain } from './FilmGrain';

// Lazy import AlgorithmicBackground to avoid heavy upfront load
const AlgorithmicBackground = React.lazy(
  () => import('@/components/art/AlgorithmicBackground').then((m) => ({ default: m.AlgorithmicBackground }))
);

// Error boundary to prevent AlgorithmicBackground failures from crashing scenes
class PatternErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

interface BackgroundRendererProps {
  bg?: string;
  bgGradient?: string;
  accent: string;
  children: React.ReactNode;
  sceneType?: SceneType;
  progress?: number;
  width?: number;
  height?: number;
}

// ─── Scene-to-pattern mapping ───────────────────────────────────────

interface PatternConfig {
  pattern: PatternType;
  animated: boolean;
  density?: number;
  strokeWidth?: number;
  complexity?: number;
}

const SCENE_PATTERN_MAP: Partial<Record<SceneType, PatternConfig>> = {
  kinetic_title: { pattern: 'flowField', animated: true, density: 0.5, strokeWidth: 1.2 },
  big_number: { pattern: 'concentricWaves', animated: true, density: 0.4 },
  chart: { pattern: 'wireframe', animated: false, density: 0.3, strokeWidth: 0.8 },
  h_bars: { pattern: 'wireframe', animated: false, density: 0.3, strokeWidth: 0.8 },
  donut: { pattern: 'concentricWaves', animated: true, density: 0.3 },
  editorial_callout: { pattern: 'topographic', animated: false, density: 0.4, strokeWidth: 0.6 },
  quote: { pattern: 'topographic', animated: false, density: 0.4, strokeWidth: 0.6 },
  ticker_facts: { pattern: 'parallelWaves', animated: true, density: 0.5 },
  card_stack: { pattern: 'layeredBands', animated: true, density: 0.4 },
  profile: { pattern: 'contour', animated: false, density: 0.3 },
  group: { pattern: 'contour', animated: false, density: 0.3 },
  kinetic_text: { pattern: 'flowField', animated: true, density: 0.6, strokeWidth: 1 },
  research_highlight: { pattern: 'topographic', animated: false, density: 0.25, strokeWidth: 0.5 },
  split: { pattern: 'geometric', animated: false, density: 0.3 },
  infographic_map: { pattern: 'wireframe', animated: false, density: 0.4 },
  svg_visual: { pattern: 'flowField', animated: true, density: 0.3 },
};

// Derive dark pattern colors from accent hex
function derivePatternColors(accent: string): string[] {
  // Parse hex to RGB (guard against undefined/null accent)
  const hex = (accent || 'ffaa00').replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) || 100;
  const g = parseInt(hex.substring(2, 4), 16) || 100;
  const b = parseInt(hex.substring(4, 6), 16) || 100;

  // Create very dark versions (5-15% lightness, 30-50% saturation)
  const dark1 = `rgb(${Math.floor(r * 0.12)}, ${Math.floor(g * 0.12)}, ${Math.floor(b * 0.12)})`;
  const dark2 = `rgb(${Math.floor(r * 0.08)}, ${Math.floor(g * 0.08)}, ${Math.floor(b * 0.08)})`;
  // One slightly visible stroke color
  const stroke = `rgb(${Math.floor(r * 0.25)}, ${Math.floor(g * 0.25)}, ${Math.floor(b * 0.25)})`;

  return [dark1, dark2, stroke];
}

// ─── Ambient overlays (kept from original) ──────────────────────────

const FloatingDots: React.FC<{ accent: string; progress: number }> = ({ accent, progress }) => {
  const dots = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      left: `${10 + (i * 7) % 80}%`,
      top: `${15 + (i * 13) % 70}%`,
      size: 2 + (i % 3),
      delay: i * 0.4,
    }));
  }, []);

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {dots.map((dot, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: dot.left,
            top: dot.top,
            width: dot.size,
            height: dot.size,
            borderRadius: '50%',
            backgroundColor: accent,
            opacity: 0.15 + Math.sin((progress * 4 + dot.delay) * Math.PI) * 0.1,
            transform: `translateY(${Math.sin((progress * 2 + dot.delay) * Math.PI) * 8}px)`,
          }}
        />
      ))}
    </div>
  );
};

const Vignette: React.FC<{ intensity?: number }> = ({ intensity = 0.6 }) => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
      background: `radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,${intensity}) 100%)`,
    }}
  />
);

const GradientBands: React.FC<{ accent: string; progress: number }> = ({ accent, progress }) => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
      opacity: 0.06,
      backgroundImage: `repeating-linear-gradient(
        0deg,
        transparent,
        transparent 60px,
        ${accent} 60px,
        ${accent} 62px
      )`,
      transform: `translateX(${-progress * 40}px)`,
    }}
  />
);

const BreathingGlow: React.FC<{ accent: string; progress: number }> = ({ accent, progress }) => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
      background: `radial-gradient(ellipse at 50% 60%, ${accent}18 0%, transparent 60%)`,
      opacity: 0.5 + Math.sin(progress * Math.PI * 2) * 0.3,
    }}
  />
);

const BokehCircles: React.FC<{ accent: string; progress: number }> = ({ accent, progress }) => {
  const circles = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => ({
      left: `${5 + (i * 14) % 90}%`,
      top: `${10 + (i * 17) % 80}%`,
      size: 30 + (i % 4) * 20,
      delay: i * 0.5,
    }));
  }, []);

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {circles.map((c, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: c.left,
            top: c.top,
            width: c.size,
            height: c.size,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${accent}10 0%, transparent 70%)`,
            opacity: 0.3 + Math.sin((progress * 3 + c.delay) * Math.PI) * 0.2,
            transform: `scale(${0.8 + Math.sin((progress * 2 + c.delay) * Math.PI) * 0.3})`,
          }}
        />
      ))}
    </div>
  );
};

const SplitGradient: React.FC<{ accent: string }> = ({ accent }) => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
      background: `linear-gradient(135deg, ${accent}08 0%, transparent 50%, ${accent}05 100%)`,
    }}
  />
);

const WarmNoise: React.FC = () => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
      opacity: 0.06,
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      mixBlendMode: 'overlay',
    }}
  />
);

const AccentGlow: React.FC<{ accent: string }> = ({ accent }) => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
      background: `radial-gradient(ellipse at 50% 50%, ${accent}12 0%, transparent 50%)`,
      filter: 'blur(40px)',
    }}
  />
);

const RotatingGradient: React.FC<{ accent: string; progress: number }> = ({ accent, progress }) => (
  <div
    style={{
      position: 'absolute',
      inset: '-20%',
      pointerEvents: 'none',
      background: `conic-gradient(from ${progress * 360}deg at 50% 50%, ${accent}08, transparent, ${accent}05, transparent)`,
      opacity: 0.6,
    }}
  />
);

// Get scene-type-specific ambient overlays
function getAmbientOverlays(
  sceneType: SceneType | undefined,
  accent: string,
  progress: number,
  width: number,
  height: number,
): React.ReactNode {
  if (!sceneType) return null;

  switch (sceneType) {
    case 'kinetic_title':
      return (
        <>
          <RotatingGradient accent={accent} progress={progress} />
          <Particles color={accent} count={20} speed={0.3} width={width} height={height} />
        </>
      );
    case 'big_number':
      return (
        <CircleWave
          color={accent}
          progress={progress}
          cx={width / 2}
          cy={height / 2}
          maxRadius={Math.min(width, height) * 0.4}
          rings={4}
        />
      );
    case 'chart':
    case 'h_bars':
    case 'donut':
      return <GridLines color={accent} spacing={50} opacity={0.05} animated />;
    case 'editorial_callout':
    case 'quote':
      return (
        <>
          <Vignette intensity={0.5} />
          <FloatingDots accent={accent} progress={progress} />
        </>
      );
    case 'ticker_facts':
      return <GradientBands accent={accent} progress={progress} />;
    case 'card_stack':
      return <BreathingGlow accent={accent} progress={progress} />;
    case 'profile':
    case 'group':
      return <BokehCircles accent={accent} progress={progress} />;
    case 'split':
      return <SplitGradient accent={accent} />;
    case 'image_frame':
      return <AccentGlow accent={accent} />;
    case 'research_highlight':
      return (
        <>
          <WarmNoise />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              backgroundColor: 'rgba(60, 40, 20, 0.03)',
            }}
          />
        </>
      );
    case 'kinetic_text':
      return (
        <>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              opacity: 0.04,
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
              filter: `hue-rotate(${progress * 60}deg)`,
            }}
          />
          <Particles color={accent} count={10} speed={0.2} width={width} height={height} />
        </>
      );
    case 'infographic_map':
    case 'svg_visual':
      return (
        <>
          <GridLines color={accent} spacing={60} opacity={0.04} />
          <Particles color={accent} count={8} speed={0.15} width={width} height={height} />
        </>
      );
    default:
      return null;
  }
}

// ─── Main Component ─────────────────────────────────────────────────

export const BackgroundRenderer: React.FC<BackgroundRendererProps> = ({
  bg,
  bgGradient,
  accent: rawAccent,
  children,
  sceneType,
  progress = 0,
  width = 800,
  height = 600,
}) => {
  // Guard against undefined accent (scene data may omit it)
  const accent = rawAccent || '#ffaa00';

  // Layer 1: Base fill
  const baseBg = bg || `#0a0a0a`;

  // Pattern config for this scene type
  const patternConfig = sceneType ? SCENE_PATTERN_MAP[sceneType] : undefined;
  const patternColors = useMemo(() => derivePatternColors(accent), [accent]);

  // Skip pattern for image_frame (image is the background)
  const showPattern = patternConfig && sceneType !== 'image_frame';

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: baseBg,
        overflow: 'hidden',
      }}
    >
      {/* Layer 2: AlgorithmicBackground pattern */}
      {showPattern && (
        <PatternErrorBoundary>
          <React.Suspense fallback={null}>
            <div style={{ position: 'absolute', inset: 0, opacity: 0.35, zIndex: 0 }}>
              <AlgorithmicBackground
                pattern={patternConfig.pattern}
                colors={patternColors}
                animated={patternConfig.animated}
                animationSpeed={0.3}
                density={patternConfig.density}
                strokeWidth={patternConfig.strokeWidth}
                complexity={patternConfig.complexity}
                size="custom"
                width="100%"
                height="100%"
              />
            </div>
          </React.Suspense>
        </PatternErrorBoundary>
      )}

      {/* Layer 3: Dark overlay for text readability (65%) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: bgGradient
            || `radial-gradient(ellipse at 30% 50%, ${accent}15 0%, rgba(10,10,10,0.65) 70%)`,
          zIndex: 1,
        }}
      />

      {/* Layer 4: Scene-type-specific ambient animations */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 2 }}>
        {getAmbientOverlays(sceneType, accent, progress, width, height)}
      </div>

      {/* Layer 5: Film grain */}
      <FilmGrain intensity={0.04} speed={10} />

      {/* Layer 6: Content */}
      <div style={{ position: 'relative', zIndex: 3, width: '100%', height: '100%' }}>
        {children}
      </div>
    </div>
  );
};
