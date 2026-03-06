'use client';

/**
 * Voice31 RPG Dither Overlay
 *
 * Canvas-based FM dither post-processing overlay (Persona-style).
 * Uses Bayer matrix dithering patterns over scene content.
 * Configurable pattern type, color depth, and intensity.
 */

import React, { useRef, useEffect, useMemo } from 'react';
import type { FMDitherPattern } from './Voice31RPGStore';

interface Voice31RPGDitherOverlayProps {
  width: number;
  height: number;
  phosphorColor?: string;
  pattern?: FMDitherPattern;
  colorDepth?: number;
  intensity?: number;
  dramatic?: boolean;
}

// Bayer matrices
const BAYER_4X4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

const BAYER_8X8 = [
  [0, 32, 8, 40, 2, 34, 10, 42],
  [48, 16, 56, 24, 50, 18, 58, 26],
  [12, 44, 4, 36, 14, 46, 6, 38],
  [60, 28, 52, 20, 62, 30, 54, 22],
  [3, 35, 11, 43, 1, 33, 9, 41],
  [51, 19, 59, 27, 49, 17, 57, 25],
  [15, 47, 7, 39, 13, 45, 5, 37],
  [63, 31, 55, 23, 61, 29, 53, 21],
];

// Generate 16x16 Bayer from 8x8
function generateBayer16(): number[][] {
  const m: number[][] = [];
  for (let y = 0; y < 16; y++) {
    m[y] = [];
    for (let x = 0; x < 16; x++) {
      const baseVal = BAYER_8X8[y % 8][x % 8];
      const offset = ((y >= 8 ? 2 : 0) + (x >= 8 ? 1 : 0)) * 0.25;
      m[y][x] = (baseVal + offset * 64) % 64;
    }
  }
  return m;
}

const BAYER_16X16 = generateBayer16();

const PHOSPHOR_COLORS: Record<string, { r: number; g: number; b: number }> = {
  green: { r: 51, g: 255, b: 51 },
  amber: { r: 255, g: 170, b: 0 },
  red: { r: 255, g: 68, b: 68 },
  blue: { r: 68, g: 136, b: 255 },
  white: { r: 255, g: 255, b: 255 },
};

function getMatrix(pattern: FMDitherPattern): { matrix: number[][]; size: number; maxVal: number } {
  switch (pattern) {
    case 'bayer4':
      return { matrix: BAYER_4X4, size: 4, maxVal: 16 };
    case 'bayer8':
      return { matrix: BAYER_8X8, size: 8, maxVal: 64 };
    case 'bayer16':
      return { matrix: BAYER_16X16, size: 16, maxVal: 64 };
    case 'halftone':
      return { matrix: BAYER_8X8, size: 8, maxVal: 64 }; // Same matrix, different rendering
    case 'noise':
      return { matrix: BAYER_8X8, size: 8, maxVal: 64 }; // Noise uses random
    default:
      return { matrix: BAYER_8X8, size: 8, maxVal: 64 };
  }
}

export const Voice31RPGDitherOverlay: React.FC<Voice31RPGDitherOverlayProps> = ({
  width,
  height,
  phosphorColor = 'amber',
  pattern = 'bayer8',
  colorDepth = 4,
  intensity = 0.15,
  dramatic = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  const colors = useMemo(
    () => PHOSPHOR_COLORS[phosphorColor] || PHOSPHOR_COLORS.amber,
    [phosphorColor]
  );

  const { matrix, size, maxVal } = useMemo(() => getMatrix(pattern), [pattern]);

  // Render scale (lower resolution for performance + aesthetic)
  const scale = 2;
  const renderWidth = Math.ceil(width / scale);
  const renderHeight = Math.ceil(height / scale);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || renderWidth <= 0 || renderHeight <= 0) return;

    canvas.width = renderWidth;
    canvas.height = renderHeight;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const imageData = ctx.createImageData(renderWidth, renderHeight);
    const data = imageData.data;

    const render = () => {
      timeRef.current += 0.016;
      const time = timeRef.current;

      const effectiveIntensity = dramatic
        ? intensity * (1 + Math.sin(time * 2) * 0.3)
        : intensity;

      for (let y = 0; y < renderHeight; y++) {
        for (let x = 0; x < renderWidth; x++) {
          const idx = (y * renderWidth + x) * 4;

          // Get threshold from matrix
          let threshold: number;
          if (pattern === 'noise') {
            threshold = Math.random();
          } else if (pattern === 'halftone') {
            // Halftone-style: radial distance within cell
            const cellX = x % size;
            const cellY = y % size;
            const cx = size / 2;
            const dist = Math.sqrt((cellX - cx) ** 2 + (cellY - cx) ** 2) / (size * 0.707);
            threshold = dist;
          } else {
            threshold = matrix[y % size][x % size] / maxVal;
          }

          // Generate subtle wave pattern
          const wave =
            Math.sin(x * 0.02 + time * 0.5) * 0.5 +
            Math.sin(y * 0.03 - time * 0.3) * 0.5;
          const baseIntensity = (wave * 0.5 + 0.5) * effectiveIntensity;

          // Quantize to color depth
          const quantized = Math.floor(baseIntensity * colorDepth) / colorDepth;

          // Apply dithering threshold
          const dithered = quantized > threshold * effectiveIntensity ? 1 : 0;

          // Final pixel
          const alpha = dithered * effectiveIntensity * 255;
          data[idx] = colors.r;
          data[idx + 1] = colors.g;
          data[idx + 2] = colors.b;
          data[idx + 3] = Math.min(255, alpha * 0.4);
        }
      }

      ctx.putImageData(imageData, 0, 0);
      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [renderWidth, renderHeight, colors, matrix, size, maxVal, pattern, colorDepth, intensity, dramatic]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        imageRendering: 'pixelated',
        opacity: 0.6,
        mixBlendMode: 'screen',
      }}
    />
  );
};

export default Voice31RPGDitherOverlay;
