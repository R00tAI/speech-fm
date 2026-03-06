'use client';

import React, { useRef, useState, useEffect } from 'react';

/**
 * FM Dither Loading Effect
 * Bayer 8x8 dithered canvas animation with morphing patterns.
 */

interface FMDitherLoadingProps {
  phosphorColor: string;
  prompt?: string;
}

export const FMDitherLoading: React.FC<FMDitherLoadingProps> = ({ phosphorColor, prompt }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const [morphPhase, setMorphPhase] = useState(0);

  const colors = {
    green: { r: 51, g: 255, b: 51 },
    amber: { r: 255, g: 170, b: 0 },
    red: { r: 255, g: 68, b: 68 },
    blue: { r: 68, g: 136, b: 255 },
    white: { r: 255, g: 255, b: 255 },
  }[phosphorColor] || { r: 255, g: 170, b: 0 };

  // Bayer 8x8 dithering matrix
  const bayerMatrix = [
    [0, 32, 8, 40, 2, 34, 10, 42],
    [48, 16, 56, 24, 50, 18, 58, 26],
    [12, 44, 4, 36, 14, 46, 6, 38],
    [60, 28, 52, 20, 62, 30, 54, 22],
    [3, 35, 11, 43, 1, 33, 9, 41],
    [51, 19, 59, 27, 49, 17, 57, 25],
    [15, 47, 7, 39, 13, 45, 5, 37],
    [63, 31, 55, 23, 61, 29, 53, 21],
  ];

  // Morph animation - pattern evolves through phases
  useEffect(() => {
    const morphInterval = setInterval(() => {
      setMorphPhase(prev => (prev + 1) % 4);
    }, 2000);
    return () => clearInterval(morphInterval);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 256;
    const height = 256;
    canvas.width = width;
    canvas.height = height;

    let time = 0;

    const animate = () => {
      time += 0.03;

      const imageData = ctx.createImageData(width, height);
      const data = imageData.data;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const cx = width / 2;
          const cy = height / 2;
          const dx = x - cx;
          const dy = y - cy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx);

          // Morphing wave patterns based on phase
          let intensity: number;
          switch (morphPhase) {
            case 0: // Radial pulse
              intensity = Math.sin(dist * 0.08 - time * 3) * 0.5 + 0.5;
              break;
            case 1: // Spiral
              intensity = Math.sin(dist * 0.06 + angle * 4 - time * 2) * 0.5 + 0.5;
              break;
            case 2: // Cellular
              intensity = (Math.sin(x * 0.1 + time) + Math.sin(y * 0.1 - time)) * 0.25 + 0.5;
              break;
            default: // Convergence
              const convergeDist = Math.max(0, 1 - dist / 100);
              intensity = convergeDist * (Math.sin(time * 4) * 0.3 + 0.7);
          }

          // Center glow
          const centerGlow = Math.max(0, 1 - dist / 60) * (Math.sin(time * 5) * 0.2 + 0.8);
          intensity = intensity * 0.7 + centerGlow * 0.3;

          // Subtle noise
          intensity += (Math.random() - 0.5) * 0.05;
          intensity = Math.max(0, Math.min(1, intensity));

          // Apply Bayer dithering
          const threshold = bayerMatrix[y % 8][x % 8] / 64;
          const dithered = intensity > threshold ? 1 : 0;

          const idx = (y * width + x) * 4;
          data[idx] = colors.r * dithered * (0.7 + intensity * 0.3);
          data[idx + 1] = colors.g * dithered * (0.7 + intensity * 0.3);
          data[idx + 2] = colors.b * dithered * (0.7 + intensity * 0.3);
          data[idx + 3] = 255;
        }
      }

      ctx.putImageData(imageData, 0, 0);
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [phosphorColor, colors.r, colors.g, colors.b, morphPhase]);

  const glowColor = {
    green: 'rgba(51, 255, 51, 0.5)',
    amber: 'rgba(255, 170, 0, 0.5)',
    red: 'rgba(255, 68, 68, 0.5)',
    blue: 'rgba(68, 136, 255, 0.5)',
    white: 'rgba(255, 255, 255, 0.5)',
  }[phosphorColor] || 'rgba(255, 170, 0, 0.5)';

  // NO TEXT - purely visual loading animation
  return (
    <div className="flex items-center justify-center">
      <div
        className="relative rounded-lg overflow-hidden transition-all duration-1000"
        style={{
          boxShadow: `0 0 30px ${glowColor}, 0 0 60px ${glowColor}`,
          transform: `scale(${1 + Math.sin(morphPhase * Math.PI / 2) * 0.05})`,
        }}
      >
        <canvas
          ref={canvasRef}
          className="w-48 h-48"
          style={{
            imageRendering: 'pixelated',
            filter: `brightness(1.2) contrast(1.1)`,
          }}
        />
        {/* Scanline overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(0, 0, 0, 0.3) 2px,
              rgba(0, 0, 0, 0.3) 4px
            )`,
          }}
        />
        {/* Breathing pulse overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at center, transparent 40%, ${glowColor} 100%)`,
            opacity: 0.3 + Math.sin(morphPhase * Math.PI / 2) * 0.2,
          }}
        />
      </div>
    </div>
  );
};
