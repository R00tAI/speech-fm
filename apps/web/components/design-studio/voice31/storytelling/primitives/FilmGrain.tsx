'use client';

import React, { useRef, useEffect } from 'react';

interface FilmGrainProps {
  intensity?: number; // 0-1, default 0.04
  speed?: number;     // fps, default 10
}

/**
 * Animated film grain overlay using a small canvas tiled via CSS.
 * Uses RAF with frame-skip throttle for smooth, battery-friendly noise.
 */
export const FilmGrain: React.FC<FilmGrainProps> = ({
  intensity = 0.04,
  speed = 10,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 64;
    canvas.width = size;
    canvas.height = size;

    const frameInterval = 1000 / Math.min(speed, 30); // cap at 30fps
    let lastFrameTime = 0;
    let rafId: number;

    const imageData = ctx.createImageData(size, size);
    const data = imageData.data;

    const tick = (now: number) => {
      rafId = requestAnimationFrame(tick);

      if (now - lastFrameTime < frameInterval) return;
      lastFrameTime = now;

      for (let i = 0; i < data.length; i += 4) {
        const v = (Math.random() * 255) | 0;
        data[i] = v;
        data[i + 1] = v;
        data[i + 2] = v;
        data[i + 3] = 255;
      }
      ctx.putImageData(imageData, 0, 0);
    };

    rafId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafId);
  }, [speed]);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        opacity: intensity,
        mixBlendMode: 'overlay',
        zIndex: 2,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          imageRendering: 'auto',
        }}
      />
    </div>
  );
};
