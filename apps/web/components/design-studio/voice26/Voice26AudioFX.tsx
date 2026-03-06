'use client';

/**
 * Voice26 Audio FX Panel - Professional Edition
 *
 * Embedded control panel with:
 * - Voice character presets
 * - Professional analog processing controls
 * - Organic oil-pen wave visualization
 * - Celestial decorations
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useVoice26Store } from './Voice26Store';
import { useVoice26Audio } from './useVoice26Audio';
import type { WavePoint, AudioMetrics } from './Voice26AudioEngine';

// =============================================================================
// SPRING PHYSICS
// =============================================================================

interface SpringState {
  position: number;
  velocity: number;
}

class SpringSimulator {
  private states: SpringState[] = [];
  private tension: number;
  private friction: number;
  private mass: number;

  constructor(count: number, tension = 280, friction = 22, mass = 1) {
    this.tension = tension;
    this.friction = friction;
    this.mass = mass;
    this.states = Array.from({ length: count }, () => ({ position: 0, velocity: 0 }));
  }

  update(targets: number[], dt: number = 0.016): number[] {
    return this.states.map((state, i) => {
      const target = targets[i] ?? 0;
      const displacement = target - state.position;
      const springForce = displacement * this.tension;
      const dampingForce = state.velocity * this.friction;
      const acceleration = (springForce - dampingForce) / this.mass;

      state.velocity += acceleration * dt;
      state.position += state.velocity * dt;

      return state.position;
    });
  }

  resize(count: number): void {
    if (this.states.length !== count) {
      this.states = Array.from({ length: count }, () => ({ position: 0, velocity: 0 }));
    }
  }
}

// =============================================================================
// OIL PEN WAVE
// =============================================================================

interface OilPenWaveProps {
  points: WavePoint[];
  width: number;
  height: number;
  baseColor: string;
  glowColor: string;
  metrics: AudioMetrics;
}

const OilPenWave: React.FC<OilPenWaveProps> = ({
  points,
  width,
  height,
  baseColor,
  glowColor,
  metrics,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const springRef = useRef<SpringSimulator>(new SpringSimulator(64, 320, 18, 0.8));
  const rafRef = useRef(0);

  useEffect(() => {
    springRef.current.resize(points.length || 64);
  }, [points.length]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const centerY = height / 2;
      const amplitude = height * 0.4;

      const targets = points.map(p => p.amplitude);
      const smoothed = springRef.current.update(targets);

      if (smoothed.length === 0) {
        rafRef.current = requestAnimationFrame(render);
        return;
      }

      // Generate path points
      const pathPoints = smoothed.map((amp, i) => {
        const t = smoothed.length > 1 ? i / (smoothed.length - 1) : 0.5;
        const x = t * width;
        const y = centerY + amp * amplitude;

        const rawPressure = points[i]?.pressure ?? 0.5;
        const velocity = points[i]?.velocity ?? 0;
        const speedFactor = 1 - Math.min(Math.abs(velocity) * 4, 0.7);
        const peakFactor = 1 + Math.abs(amp) * 0.5;
        const pressure = rawPressure * speedFactor * peakFactor;

        return { x, y, pressure: Math.min(1, Math.max(0.15, pressure)), velocity };
      });

      // Draw bloom layers
      for (let bloom = 4; bloom >= 1; bloom--) {
        ctx.beginPath();
        ctx.moveTo(pathPoints[0].x, pathPoints[0].y);

        for (let i = 0; i < pathPoints.length - 1; i++) {
          const p0 = pathPoints[Math.max(0, i - 1)];
          const p1 = pathPoints[i];
          const p2 = pathPoints[Math.min(pathPoints.length - 1, i + 1)];
          const p3 = pathPoints[Math.min(pathPoints.length - 1, i + 2)];

          const tension = 0.4;
          const cp1x = p1.x + (p2.x - p0.x) * tension;
          const cp1y = p1.y + (p2.y - p0.y) * tension;
          const cp2x = p2.x - (p3.x - p1.x) * tension;
          const cp2y = p2.y - (p3.y - p1.y) * tension;

          ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
        }

        const bloomWidth = bloom * 3 + 2;
        const bloomAlpha = (0.12 / bloom) * (0.5 + metrics.rms);

        ctx.strokeStyle = glowColor;
        ctx.lineWidth = bloomWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = bloomAlpha;
        ctx.filter = `blur(${bloom}px)`;
        ctx.stroke();
        ctx.filter = 'none';
      }

      ctx.globalAlpha = 1;

      // Variable-width stroke (oil pen)
      for (let i = 0; i < pathPoints.length - 1; i++) {
        const p1 = pathPoints[i];
        const p2 = pathPoints[i + 1];
        const avgPressure = (p1.pressure + p2.pressure) / 2;
        const strokeWidth = 0.8 + avgPressure * 2.5;

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);

        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        ctx.quadraticCurveTo(p1.x + (p2.x - p1.x) * 0.5, p1.y, midX, midY);
        ctx.quadraticCurveTo(midX + (p2.x - midX) * 0.5, p2.y, p2.x, p2.y);

        ctx.strokeStyle = baseColor;
        ctx.lineWidth = strokeWidth;
        ctx.lineCap = 'round';
        ctx.stroke();
      }

      // Bright core
      ctx.beginPath();
      ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
      for (let i = 0; i < pathPoints.length - 1; i++) {
        const p0 = pathPoints[Math.max(0, i - 1)];
        const p1 = pathPoints[i];
        const p2 = pathPoints[Math.min(pathPoints.length - 1, i + 1)];
        const p3 = pathPoints[Math.min(pathPoints.length - 1, i + 2)];

        const cp1x = p1.x + (p2.x - p0.x) * 0.3;
        const cp1y = p1.y + (p2.y - p0.y) * 0.3;
        const cp2x = p2.x - (p3.x - p1.x) * 0.3;
        const cp2y = p2.y - (p3.y - p1.y) * 0.3;

        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
      }

      ctx.strokeStyle = baseColor;
      ctx.lineWidth = 0.5 + metrics.rms * 0.5;
      ctx.globalAlpha = 0.9;
      ctx.stroke();

      ctx.globalAlpha = 1;
      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafRef.current);
  }, [points, width, height, baseColor, glowColor, metrics]);

  return <canvas ref={canvasRef} style={{ width, height }} className="block" />;
};

// =============================================================================
// CELESTIAL BACKGROUND
// =============================================================================

interface Star {
  x: number;
  y: number;
  size: number;
  brightness: number;
  twinkleSpeed: number;
  phase: number;
}

export const CelestialCanvas: React.FC<{
  width: number;
  height: number;
  color: string;
  intensity: number;
}> = ({ width, height, color, intensity }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const frameRef = useRef(0);

  useEffect(() => {
    const count = Math.floor((width * height) / 1000);
    starsRef.current = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: 0.3 + Math.random() * 1.2,
      brightness: 0.3 + Math.random() * 0.7,
      twinkleSpeed: 0.5 + Math.random() * 2,
      phase: Math.random() * Math.PI * 2,
    }));
  }, [width, height]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      } : { r: 200, g: 220, b: 255 };
    };

    const render = (time: number) => {
      ctx.clearRect(0, 0, width, height);
      const rgb = hexToRgb(color);

      starsRef.current.forEach((star) => {
        const twinkle = 0.5 + 0.5 * Math.sin(time * 0.001 * star.twinkleSpeed + star.phase);
        const alpha = star.brightness * twinkle * intensity;

        const glow = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.size * 3);
        glow.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha * 0.8})`);
        glow.addColorStop(0.3, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha * 0.3})`);
        glow.addColorStop(1, 'transparent');

        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size * 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
      });

      frameRef.current = requestAnimationFrame(render);
    };

    frameRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frameRef.current);
  }, [width, height, color, intensity]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ width, height }}
    />
  );
};

// =============================================================================
// PRESET BUTTON
// =============================================================================

interface PresetButtonProps {
  id: string;
  name: string;
  isActive: boolean;
  onClick: () => void;
  color: string;
}

const PresetButton: React.FC<PresetButtonProps> = ({ id, name, isActive, onClick, color }) => (
  <button
    onClick={onClick}
    className="px-2 py-1 rounded text-[9px] font-mono uppercase tracking-wider transition-all"
    style={{
      backgroundColor: isActive ? `${color}30` : 'transparent',
      border: `1px solid ${isActive ? color : `${color}30`}`,
      color: isActive ? color : `${color}80`,
      boxShadow: isActive ? `0 0 8px ${color}30` : 'none',
    }}
  >
    {name}
  </button>
);

// =============================================================================
// MINI KNOB
// =============================================================================

interface MiniKnobProps {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  label: string;
  color: string;
  format?: (v: number) => string;
}

const MiniKnob: React.FC<MiniKnobProps> = ({
  value,
  min,
  max,
  onChange,
  label,
  color,
  format = (v) => v.toFixed(1),
}) => {
  const percent = ((value - min) / (max - min)) * 100;
  const angle = -135 + (percent / 100) * 270; // -135 to 135 degrees

  return (
    <div className="flex flex-col items-center gap-0.5">
      <span
        className="text-[7px] font-mono uppercase tracking-wider opacity-50"
        style={{ color }}
      >
        {label}
      </span>
      <div
        className="relative w-7 h-7 rounded-full cursor-pointer"
        style={{
          backgroundColor: `${color}10`,
          border: `1px solid ${color}30`,
        }}
      >
        {/* Track arc */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 28 28">
          <circle
            cx="14"
            cy="14"
            r="11"
            fill="none"
            stroke={`${color}20`}
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="52"
            strokeDashoffset="17"
            transform="rotate(135 14 14)"
          />
          <circle
            cx="14"
            cy="14"
            r="11"
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={`${percent * 0.52} 100`}
            strokeDashoffset="17"
            transform="rotate(135 14 14)"
            style={{ filter: `drop-shadow(0 0 2px ${color})` }}
          />
        </svg>

        {/* Indicator dot */}
        <div
          className="absolute w-1.5 h-1.5 rounded-full"
          style={{
            backgroundColor: color,
            boxShadow: `0 0 4px ${color}`,
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-8px)`,
          }}
        />

        {/* Invisible range input */}
        <input
          type="range"
          min={min}
          max={max}
          step={(max - min) / 100}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>
      <span
        className="text-[7px] font-mono tabular-nums opacity-40"
        style={{ color }}
      >
        {format(value)}
      </span>
    </div>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export const Voice26AudioFX: React.FC<{
  embedded?: boolean;
  width?: number;
  height?: number;
}> = ({ embedded = true, width = 280, height = 100 }) => {
  const { phosphorColor, isSpeaking } = useVoice26Store();

  const {
    isConnected,
    isEnabled,
    settings,
    updateSettings,
    presets,
    currentPresetId,
    applyPreset,
    toggleEnabled,
    wavePoints,
    metrics,
  } = useVoice26Audio();

  const containerRef = useRef<HTMLDivElement>(null);
  const [panelWidth, setPanelWidth] = useState(width);

  // Colors
  const colors = useMemo(() => {
    const palettes: Record<string, { base: string; glow: string; dim: string }> = {
      green: { base: '#88ffaa', glow: '#44dd88', dim: '#224422' },
      amber: { base: '#ffcc88', glow: '#ffaa44', dim: '#442211' },
      red: { base: '#ff8888', glow: '#ff4444', dim: '#441111' },
      blue: { base: '#aaccff', glow: '#6699ff', dim: '#112244' },
      white: { base: '#eeeeff', glow: '#ccccff', dim: '#222233' },
    };
    return palettes[phosphorColor] || palettes.amber;
  }, [phosphorColor]);

  // Resize observer
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setPanelWidth(entry.contentRect.width);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const intensity = isSpeaking ? 1 : 0.5;

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden"
      style={{
        height,
        backgroundColor: 'rgba(5, 8, 15, 0.9)',
        borderTop: `1px solid ${colors.dim}40`,
      }}
    >
      {/* Celestial background */}
      <CelestialCanvas
        width={panelWidth}
        height={height}
        color={colors.glow}
        intensity={intensity * 0.6}
      />

      {/* Content */}
      <div className="relative z-10 h-full flex items-center px-3 gap-3">
        {/* Enable toggle */}
        <button
          onClick={toggleEnabled}
          className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg transition-all"
          style={{
            backgroundColor: isEnabled ? `${colors.glow}20` : 'transparent',
            border: `1px solid ${isEnabled ? colors.glow : colors.dim}`,
          }}
          title={isEnabled ? 'FX Enabled' : 'FX Bypassed'}
        >
          <div
            className="w-3 h-3 rounded-full transition-all"
            style={{
              backgroundColor: isEnabled ? colors.base : colors.dim,
              boxShadow: isEnabled ? `0 0 8px ${colors.glow}` : 'none',
            }}
          />
        </button>

        {/* Presets */}
        <div className="flex-shrink-0 flex gap-1 overflow-x-auto hide-scrollbar">
          {presets.slice(0, 5).map((preset) => (
            <PresetButton
              key={preset.id}
              id={preset.id}
              name={preset.name.split(' ')[0]}
              isActive={currentPresetId === preset.id}
              onClick={() => applyPreset(preset.id)}
              color={colors.base}
            />
          ))}
        </div>

        {/* Wave */}
        <div className="flex-1 min-w-0">
          <OilPenWave
            points={wavePoints}
            width={Math.max(100, panelWidth - 450)}
            height={height - 30}
            baseColor={colors.base}
            glowColor={colors.glow}
            metrics={metrics}
          />
        </div>

        {/* Key controls */}
        <div className="flex-shrink-0 flex gap-2">
          <MiniKnob
            label="WARM"
            value={settings.saturationDrive}
            min={0}
            max={0.8}
            onChange={(v) => updateSettings({ saturationDrive: v })}
            color={colors.base}
            format={(v) => `${Math.round(v * 100)}%`}
          />
          <MiniKnob
            label="AIR"
            value={settings.exciterAmount}
            min={0}
            max={0.5}
            onChange={(v) => updateSettings({ exciterAmount: v })}
            color={colors.base}
            format={(v) => `${Math.round(v * 100)}%`}
          />
          <MiniKnob
            label="SPACE"
            value={settings.reverbMix}
            min={0}
            max={0.6}
            onChange={(v) => updateSettings({ reverbMix: v })}
            color={colors.base}
            format={(v) => `${Math.round(v * 100)}%`}
          />
        </div>

        {/* Status */}
        <div className="flex-shrink-0 flex flex-col items-center gap-1">
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{
              backgroundColor: isConnected ? colors.glow : colors.dim,
              boxShadow: isConnected ? `0 0 6px ${colors.glow}` : 'none',
            }}
          />
          <span
            className="text-[6px] font-mono uppercase tracking-wider"
            style={{ color: isConnected ? colors.glow : colors.dim }}
          >
            {isConnected ? 'LIVE' : 'SIM'}
          </span>
        </div>
      </div>

      {/* Top glow line */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${colors.glow}30 50%, transparent 100%)`,
        }}
      />

      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default Voice26AudioFX;
