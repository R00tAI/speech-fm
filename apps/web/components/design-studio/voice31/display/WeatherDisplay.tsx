'use client';

/**
 * WeatherDisplay — CRT-style animated weather with 90s retro aesthetic
 *
 * Canvas-based rain/snow, SVG sun/moon/clouds, phosphor-colored temperature readout,
 * 90s mascot character, forecast strip.
 */

import React, { useEffect, useRef, useMemo } from 'react';
import type { WeatherData, WeatherCondition } from '../Voice31Store';

interface WeatherDisplayProps {
  data: WeatherData;
  phosphorColor: string;
  width?: number;
  height?: number;
}

// =============================================================================
// PHOSPHOR COLOR MAPPING
// =============================================================================

const CONDITION_COLORS: Record<WeatherCondition, string> = {
  clear: '#ffaa00',
  clouds: '#aaaacc',
  rain: '#4488ff',
  drizzle: '#6699cc',
  thunderstorm: '#ff4444',
  snow: '#ccddff',
  mist: '#888899',
  fog: '#888899',
  wind: '#88ccaa',
};

const PHOSPHOR_HEX: Record<string, string> = {
  green: '#33ff33',
  amber: '#ffaa00',
  red: '#ff4444',
  blue: '#4488ff',
  white: '#ffffff',
};

// =============================================================================
// RAIN CANVAS RENDERER
// =============================================================================

function drawRain(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  drops: { x: number; y: number; speed: number; len: number }[],
  color: string
) {
  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.6;

  for (const drop of drops) {
    ctx.beginPath();
    ctx.moveTo(drop.x, drop.y);
    ctx.lineTo(drop.x - 1, drop.y + drop.len);
    ctx.stroke();

    drop.y += drop.speed;
    if (drop.y > h) {
      drop.y = -drop.len;
      drop.x = Math.random() * w;
    }
  }
  ctx.globalAlpha = 1;
}

function drawSnow(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  flakes: { x: number; y: number; speed: number; size: number; wobble: number }[],
  color: string,
  time: number
) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.7;

  for (const flake of flakes) {
    ctx.beginPath();
    ctx.arc(
      flake.x + Math.sin(time * 0.002 + flake.wobble) * 15,
      flake.y,
      flake.size,
      0,
      Math.PI * 2
    );
    ctx.fill();

    flake.y += flake.speed;
    if (flake.y > h) {
      flake.y = -5;
      flake.x = Math.random() * w;
    }
  }
  ctx.globalAlpha = 1;
}

// =============================================================================
// MASCOT SVG — 90s clippy-style weather buddy
// =============================================================================

const WeatherMascot: React.FC<{ condition: WeatherCondition; color: string }> = ({
  condition,
  color,
}) => {
  const accessories: Record<string, React.ReactNode> = {
    rain: (
      <g transform="translate(18, 2)">
        {/* Umbrella */}
        <path d="M0 8 Q8 -2 16 8" fill="none" stroke={color} strokeWidth="1.5" />
        <line x1="8" y1="0" x2="8" y2="14" stroke={color} strokeWidth="1.5" />
        <path d="M8 14 Q6 16 5 14" fill="none" stroke={color} strokeWidth="1" />
      </g>
    ),
    snow: (
      <g transform="translate(20, 2)">
        {/* Scarf */}
        <rect x="0" y="18" width="12" height="3" rx="1" fill={color} opacity="0.8" />
        <rect x="10" y="18" width="3" height="8" rx="1" fill={color} opacity="0.6" />
      </g>
    ),
    clear: (
      <g transform="translate(18, 6)">
        {/* Sunglasses */}
        <rect x="2" y="0" width="5" height="3" rx="1" fill="#111" />
        <rect x="9" y="0" width="5" height="3" rx="1" fill="#111" />
        <line x1="7" y1="1.5" x2="9" y2="1.5" stroke="#111" strokeWidth="0.8" />
      </g>
    ),
    thunderstorm: (
      <g transform="translate(24, 0)">
        {/* Lightning bolt above */}
        <polygon points="4,0 2,5 5,5 3,10 8,4 5,4 7,0" fill="#ffcc00" />
      </g>
    ),
  };

  return (
    <svg width="52" height="40" viewBox="0 0 52 40" className="shrink-0">
      {/* Body — simple rounded rectangle */}
      <rect x="14" y="8" width="24" height="26" rx="8" fill={`${color}30`} stroke={color} strokeWidth="1" />
      {/* Eyes */}
      <circle cx="22" cy="18" r="2" fill={color} />
      <circle cx="30" cy="18" r="2" fill={color} />
      {/* Mouth */}
      <path d="M22 24 Q26 28 30 24" fill="none" stroke={color} strokeWidth="1" strokeLinecap="round" />
      {/* Feet */}
      <ellipse cx="20" cy="35" rx="4" ry="2" fill={`${color}40`} />
      <ellipse cx="32" cy="35" rx="4" ry="2" fill={`${color}40`} />
      {/* Accessory */}
      {accessories[condition] || accessories.clear}
      {/* Bobbing animation via CSS */}
      <animateTransform
        attributeName="transform"
        type="translate"
        values="0 0; 0 -2; 0 0"
        dur="2s"
        repeatCount="indefinite"
      />
    </svg>
  );
};

// =============================================================================
// FORECAST ICON
// =============================================================================

const ForecastIcon: React.FC<{ condition: WeatherCondition; color: string; size?: number }> = ({
  condition,
  color,
  size = 16,
}) => {
  const icons: Record<WeatherCondition, React.ReactNode> = {
    clear: (
      <circle cx="8" cy="8" r="4" fill={color} opacity="0.9">
        <animate attributeName="opacity" values="0.9;0.6;0.9" dur="3s" repeatCount="indefinite" />
      </circle>
    ),
    clouds: (
      <g>
        <circle cx="6" cy="9" r="3" fill={`${color}60`} />
        <circle cx="10" cy="8" r="4" fill={`${color}80`} />
        <circle cx="14" cy="9" r="3" fill={`${color}60`} />
      </g>
    ),
    rain: (
      <g>
        <circle cx="8" cy="6" r="3" fill={`${color}60`} />
        <line x1="5" y1="11" x2="4" y2="14" stroke={color} strokeWidth="1" opacity="0.7" />
        <line x1="8" y1="11" x2="7" y2="14" stroke={color} strokeWidth="1" opacity="0.7" />
        <line x1="11" y1="11" x2="10" y2="14" stroke={color} strokeWidth="1" opacity="0.7" />
      </g>
    ),
    drizzle: (
      <g>
        <circle cx="8" cy="6" r="3" fill={`${color}50`} />
        <line x1="6" y1="12" x2="5" y2="14" stroke={color} strokeWidth="0.8" opacity="0.5" />
        <line x1="10" y1="12" x2="9" y2="14" stroke={color} strokeWidth="0.8" opacity="0.5" />
      </g>
    ),
    thunderstorm: (
      <g>
        <circle cx="8" cy="5" r="3" fill={`${color}70`} />
        <polygon points="8,9 6,12 8,12 7,15" fill="#ffcc00" />
      </g>
    ),
    snow: (
      <g>
        <circle cx="5" cy="10" r="1.5" fill={color} opacity="0.6" />
        <circle cx="8" cy="12" r="1.5" fill={color} opacity="0.8" />
        <circle cx="11" cy="10" r="1.5" fill={color} opacity="0.6" />
      </g>
    ),
    mist: (
      <g>
        <line x1="2" y1="7" x2="14" y2="7" stroke={color} strokeWidth="1" opacity="0.3" />
        <line x1="3" y1="10" x2="13" y2="10" stroke={color} strokeWidth="1" opacity="0.3" />
        <line x1="2" y1="13" x2="14" y2="13" stroke={color} strokeWidth="1" opacity="0.3" />
      </g>
    ),
    fog: (
      <g>
        <line x1="2" y1="7" x2="14" y2="7" stroke={color} strokeWidth="1.5" opacity="0.25" />
        <line x1="3" y1="10" x2="13" y2="10" stroke={color} strokeWidth="1.5" opacity="0.25" />
        <line x1="2" y1="13" x2="14" y2="13" stroke={color} strokeWidth="1.5" opacity="0.25" />
      </g>
    ),
    wind: (
      <g>
        <path d="M2 8 Q8 4 14 8" fill="none" stroke={color} strokeWidth="1" opacity="0.5" />
        <path d="M2 11 Q10 7 14 11" fill="none" stroke={color} strokeWidth="1" opacity="0.5" />
      </g>
    ),
  };

  return (
    <svg width={size} height={size} viewBox="0 0 16 16">
      {icons[condition] || icons.clear}
    </svg>
  );
};

// =============================================================================
// MAIN WEATHER DISPLAY
// =============================================================================

const WeatherDisplay: React.FC<WeatherDisplayProps> = ({
  data,
  phosphorColor,
  width = 600,
  height = 400,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const timeRef = useRef(0);

  const hex = PHOSPHOR_HEX[phosphorColor] || PHOSPHOR_HEX.amber;
  const conditionColor = CONDITION_COLORS[data.condition] || hex;

  // Generate particles once
  const particles = useMemo(() => {
    if (data.condition === 'rain' || data.condition === 'drizzle' || data.condition === 'thunderstorm') {
      const count = data.condition === 'drizzle' ? 40 : 80;
      return Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        speed: 3 + Math.random() * 5,
        len: 8 + Math.random() * 12,
      }));
    }
    if (data.condition === 'snow') {
      return Array.from({ length: 50 }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        speed: 0.5 + Math.random() * 1.5,
        size: 1 + Math.random() * 3,
        wobble: Math.random() * Math.PI * 2,
      }));
    }
    return [];
  }, [data.condition, width, height]);

  // Canvas animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const hasParticles = data.condition === 'rain' || data.condition === 'drizzle' ||
      data.condition === 'thunderstorm' || data.condition === 'snow';

    if (!hasParticles) return;

    const animate = () => {
      timeRef.current += 16;

      if (data.condition === 'snow') {
        drawSnow(ctx, width, height, particles as any, conditionColor, timeRef.current);
      } else {
        drawRain(ctx, width, height, particles as any, conditionColor);
      }

      // Lightning flash for thunderstorms
      if (data.condition === 'thunderstorm' && Math.random() < 0.005) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(0, 0, width, height);
      }

      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [data.condition, width, height, particles, conditionColor]);

  // Wind direction arrow
  const windArrow = data.windDirection != null
    ? `rotate(${data.windDirection}deg)`
    : '';

  return (
    <div
      className="relative font-mono overflow-hidden rounded-lg"
      style={{ width, height, backgroundColor: '#0a0a0a' }}
    >
      {/* Canvas for particles (rain/snow) */}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="absolute inset-0 pointer-events-none z-10"
      />

      {/* Fogged glass overlay for rain */}
      {(data.condition === 'rain' || data.condition === 'drizzle') && (
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at 50% 30%, transparent 0%, ${conditionColor}08 100%)`,
          }}
        />
      )}

      {/* Main content */}
      <div className="relative z-20 flex flex-col h-full p-6">
        {/* Top row: Location + Mascot */}
        <div className="flex items-start justify-between">
          <div>
            <div
              className="text-[10px] uppercase tracking-[0.3em]"
              style={{ color: `${hex}50` }}
            >
              Weather Report
            </div>
            <div className="text-lg font-bold mt-1" style={{ color: hex }}>
              {data.location}
            </div>
            <div className="text-[11px] capitalize mt-0.5" style={{ color: `${hex}70` }}>
              {data.description}
            </div>
          </div>
          <WeatherMascot condition={data.condition} color={hex} />
        </div>

        {/* Temperature — large digital readout */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div
              className="text-7xl font-bold tracking-tighter"
              style={{
                color: hex,
                textShadow: `0 0 30px ${hex}40, 0 0 60px ${hex}20`,
                fontFamily: 'monospace',
              }}
            >
              {data.temperature}°
            </div>
            <div className="text-xs mt-1" style={{ color: `${hex}50` }}>
              Feels like {data.feelsLike}°F
            </div>
          </div>
        </div>

        {/* Data readout strip */}
        <div
          className="grid grid-cols-4 gap-3 py-3 border-t border-b"
          style={{ borderColor: `${hex}15` }}
        >
          <div>
            <div className="text-[8px] uppercase tracking-wider" style={{ color: `${hex}30` }}>
              Humidity
            </div>
            <div className="text-sm font-bold" style={{ color: hex }}>
              {data.humidity}%
            </div>
          </div>
          <div>
            <div className="text-[8px] uppercase tracking-wider" style={{ color: `${hex}30` }}>
              Wind
            </div>
            <div className="flex items-center gap-1">
              <div className="text-sm font-bold" style={{ color: hex }}>
                {data.windSpeed}
              </div>
              <span className="text-[8px]" style={{ color: `${hex}50` }}>mph</span>
              {windArrow && (
                <span className="text-[10px]" style={{ color: `${hex}40`, transform: windArrow, display: 'inline-block' }}>
                  ↑
                </span>
              )}
            </div>
          </div>
          <div>
            <div className="text-[8px] uppercase tracking-wider" style={{ color: `${hex}30` }}>
              Pressure
            </div>
            <div className="text-sm font-bold" style={{ color: hex }}>
              {data.pressure}
            </div>
          </div>
          <div>
            <div className="text-[8px] uppercase tracking-wider" style={{ color: `${hex}30` }}>
              Condition
            </div>
            <ForecastIcon condition={data.condition} color={hex} size={20} />
          </div>
        </div>

        {/* 5-day forecast strip */}
        {data.forecast.length > 0 && (
          <div className="flex items-center gap-2 mt-3">
            {data.forecast.map((day, i) => (
              <div
                key={i}
                className="flex-1 text-center py-1.5 rounded"
                style={{ backgroundColor: `${hex}08` }}
              >
                <div className="text-[8px] uppercase tracking-wider" style={{ color: `${hex}40` }}>
                  {day.date}
                </div>
                <div className="flex justify-center my-1">
                  <ForecastIcon condition={day.condition as WeatherCondition} color={hex} size={14} />
                </div>
                <div className="text-[10px] font-bold" style={{ color: hex }}>
                  {day.tempHigh}°
                </div>
                <div className="text-[8px]" style={{ color: `${hex}30` }}>
                  {day.tempLow}°
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CRT scanlines overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-30"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)',
        }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none z-30"
        style={{
          boxShadow: 'inset 0 0 100px rgba(0,0,0,0.5)',
        }}
      />
    </div>
  );
};

export default WeatherDisplay;
