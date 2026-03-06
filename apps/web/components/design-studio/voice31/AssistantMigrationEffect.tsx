'use client';

/**
 * AssistantMigrationEffect
 *
 * Portal/glitch transition effect that renders at the CRT-LED junction
 * when the assistant migrates between the CRT screen and LED panel.
 *
 * Effect composition:
 * 1. Chromatic aberration scan line sweep
 * 2. Glitch rectangles (VHS tracking error)
 * 3. Radial time-warp distortion
 * 4. Portal glow at the connection ridge
 * 5. Binary scatter particles
 */

import React, { useRef, useEffect, useMemo } from 'react';

interface AssistantMigrationEffectProps {
  direction: 'to-led' | 'to-crt';
  width: number;
  junctionY: number; // Y position of the CRT-LED border
  phosphorColor: string;
  onComplete: () => void;
  phrase?: string | null;
}

const MIGRATION_DURATION = 800;

export const AssistantMigrationEffect: React.FC<AssistantMigrationEffectProps> = ({
  direction,
  width,
  junctionY,
  phosphorColor,
  onComplete,
  phrase,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const phraseOpacityRef = useRef(1);

  const colors = useMemo(() => ({
    green: { r: 51, g: 255, b: 51, hex: '#33ff33', glow: 'rgba(51, 255, 51, 0.6)' },
    amber: { r: 255, g: 170, b: 0, hex: '#ffaa00', glow: 'rgba(255, 170, 0, 0.6)' },
    red: { r: 255, g: 68, b: 68, hex: '#ff4444', glow: 'rgba(255, 68, 68, 0.6)' },
    blue: { r: 68, g: 136, b: 255, hex: '#4488ff', glow: 'rgba(68, 136, 255, 0.6)' },
    white: { r: 255, g: 255, b: 255, hex: '#ffffff', glow: 'rgba(255, 255, 255, 0.6)' },
  })[phosphorColor] || { r: 255, g: 170, b: 0, hex: '#ffaa00', glow: 'rgba(255, 170, 0, 0.6)' }, [phosphorColor]);

  // Pre-generate glitch rects
  const glitchRects = useMemo(() => {
    return Array.from({ length: 12 }, () => ({
      x: Math.random() * width,
      y: (Math.random() - 0.5) * 60,
      w: 10 + Math.random() * 60,
      h: 2 + Math.random() * 6,
      speed: 0.5 + Math.random() * 2,
      delay: Math.random() * 0.5,
      channel: Math.floor(Math.random() * 3), // 0=R, 1=G, 2=B
    }));
  }, [width]);

  // Pre-generate binary scatter particles
  const scatterParticles = useMemo(() => {
    return Array.from({ length: 24 }, () => ({
      char: Math.random() > 0.5 ? '1' : '0',
      startX: width / 2 + (Math.random() - 0.5) * 200,
      startY: 0,
      velocityX: (Math.random() - 0.5) * 300,
      velocityY: direction === 'to-led' ? 50 + Math.random() * 150 : -(50 + Math.random() * 150),
      size: 8 + Math.random() * 6,
      delay: Math.random() * 0.3,
      lifetime: 0.4 + Math.random() * 0.4,
    }));
  }, [width, direction]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const canvasHeight = 100; // Zone spans 50px above and below junction
    canvas.width = width;
    canvas.height = canvasHeight;

    startTimeRef.current = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(elapsed / MIGRATION_DURATION, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic

      ctx.clearRect(0, 0, width, canvasHeight);

      const centerY = canvasHeight / 2;

      // 1. Portal glow — pulsing light at the junction
      const glowIntensity = Math.sin(progress * Math.PI) * 0.8; // peaks at midpoint
      const gradient = ctx.createRadialGradient(
        width / 2, centerY, 0,
        width / 2, centerY, 120
      );
      gradient.addColorStop(0, `rgba(${colors.r}, ${colors.g}, ${colors.b}, ${glowIntensity * 0.5})`);
      gradient.addColorStop(0.4, `rgba(${colors.r}, ${colors.g}, ${colors.b}, ${glowIntensity * 0.2})`);
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, canvasHeight);

      // Horizontal light band at junction
      const bandGrad = ctx.createLinearGradient(0, centerY - 3, 0, centerY + 3);
      bandGrad.addColorStop(0, 'transparent');
      bandGrad.addColorStop(0.5, `rgba(${colors.r}, ${colors.g}, ${colors.b}, ${glowIntensity * 0.9})`);
      bandGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = bandGrad;
      ctx.fillRect(0, centerY - 3, width, 6);

      // 2. Chromatic aberration scan line
      const scanY = direction === 'to-led'
        ? centerY * eased * 2 - 20
        : canvasHeight - centerY * eased * 2 + 20;

      if (progress < 0.8) {
        const scanHeight = 8;
        // Red channel
        ctx.fillStyle = `rgba(255, 0, 0, ${0.3 * (1 - progress)})`;
        ctx.fillRect(0, scanY - 2, width, scanHeight);
        // Cyan channel offset
        ctx.fillStyle = `rgba(0, 255, 255, ${0.3 * (1 - progress)})`;
        ctx.fillRect(0, scanY + 2, width, scanHeight);
      }

      // 3. Glitch rectangles — VHS tracking error
      for (const rect of glitchRects) {
        const rectProgress = Math.max(0, (progress - rect.delay) / (1 - rect.delay));
        if (rectProgress <= 0 || rectProgress >= 1) continue;

        const flicker = Math.sin(rectProgress * Math.PI * 6 * rect.speed) > 0.2;
        if (!flicker) continue;

        const alpha = Math.sin(rectProgress * Math.PI) * 0.7;
        const offsetY = centerY + rect.y + (direction === 'to-led' ? rectProgress * 30 : -rectProgress * 30);

        const channelColors = [
          `rgba(255, ${colors.g * 0.3}, ${colors.b * 0.3}, ${alpha})`,
          `rgba(${colors.r * 0.3}, 255, ${colors.b * 0.3}, ${alpha})`,
          `rgba(${colors.r * 0.3}, ${colors.g * 0.3}, 255, ${alpha})`,
        ];
        ctx.fillStyle = channelColors[rect.channel];
        ctx.fillRect(rect.x, offsetY, rect.w, rect.h);
      }

      // 4. Time-warp distortion — radial blur lines
      if (progress > 0.1 && progress < 0.9) {
        const warpAlpha = Math.sin((progress - 0.1) / 0.8 * Math.PI) * 0.3;
        const lineCount = 16;

        ctx.strokeStyle = `rgba(${colors.r}, ${colors.g}, ${colors.b}, ${warpAlpha})`;
        ctx.lineWidth = 1;

        for (let i = 0; i < lineCount; i++) {
          const angle = (i / lineCount) * Math.PI * 2;
          const innerR = 10 + progress * 20;
          const outerR = 40 + progress * 60;
          const cx = width / 2;

          ctx.beginPath();
          ctx.moveTo(
            cx + Math.cos(angle) * innerR,
            centerY + Math.sin(angle) * innerR * 0.4
          );
          ctx.lineTo(
            cx + Math.cos(angle) * outerR,
            centerY + Math.sin(angle) * outerR * 0.4
          );
          ctx.stroke();
        }
      }

      // 5. Binary scatter particles
      for (const p of scatterParticles) {
        const pProgress = Math.max(0, (progress - p.delay) / p.lifetime);
        if (pProgress <= 0 || pProgress >= 1) continue;

        const alpha = Math.sin(pProgress * Math.PI);
        const px = p.startX + p.velocityX * pProgress;
        const py = centerY + p.velocityY * pProgress;

        ctx.font = `${p.size}px monospace`;
        ctx.fillStyle = `rgba(${colors.r}, ${colors.g}, ${colors.b}, ${alpha * 0.8})`;
        ctx.textAlign = 'center';
        ctx.shadowColor = colors.hex;
        ctx.shadowBlur = 4;
        ctx.fillText(p.char, px, py);
        ctx.shadowBlur = 0;
      }

      // 6. Migration phrase text
      if (phrase && progress < 0.95) {
        phraseOpacityRef.current = progress < 0.7 ? Math.min(1, progress * 3) : Math.max(0, (1 - progress) * 3);
        const phraseY = direction === 'to-led' ? centerY - 25 : centerY + 30;

        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = `rgba(${colors.r}, ${colors.g}, ${colors.b}, ${phraseOpacityRef.current * 0.9})`;
        ctx.shadowColor = colors.hex;
        ctx.shadowBlur = 8;
        ctx.fillText(phrase, width / 2, phraseY);
        ctx.shadowBlur = 0;
      }

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        onComplete();
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [direction, width, colors, glitchRects, scatterParticles, onComplete, phrase]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute left-0 pointer-events-none z-30"
      style={{
        top: junctionY - 50,
        width,
        height: 100,
        mixBlendMode: 'screen',
      }}
    />
  );
};

export default AssistantMigrationEffect;
