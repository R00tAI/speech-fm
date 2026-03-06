'use client';

import React, { useRef, useEffect } from 'react';

interface WaveformVisualizerProps {
  audioElement: HTMLAudioElement | null;
  isPlaying: boolean;
  accentColor: string;
  width: number;
  height?: number;
}

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  audioElement,
  isPlaying,
  accentColor,
  width,
  height = 32,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const contextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!audioElement || !isPlaying) return;

    // Create AudioContext and analyser
    if (!contextRef.current) {
      contextRef.current = new AudioContext();
    }

    const ctx = contextRef.current;
    if (!analyserRef.current) {
      analyserRef.current = ctx.createAnalyser();
      analyserRef.current.fftSize = 64;
      const source = ctx.createMediaElementSource(audioElement);
      source.connect(analyserRef.current);
      analyserRef.current.connect(ctx.destination);
    }

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;

    canvas.width = width;
    canvas.height = height;

    // Parse accent color
    const r = parseInt(accentColor.slice(1, 3), 16);
    const g = parseInt(accentColor.slice(3, 5), 16);
    const b = parseInt(accentColor.slice(5, 7), 16);

    const draw = () => {
      analyser.getByteFrequencyData(dataArray);
      canvasCtx.clearRect(0, 0, width, height);

      const barWidth = width / bufferLength;
      const centerY = height / 2;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * centerY;
        const x = i * barWidth;
        const alpha = 0.4 + (dataArray[i] / 255) * 0.6;

        canvasCtx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
        canvasCtx.fillRect(x, centerY - barHeight, barWidth - 1, barHeight * 2);
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
    };
  }, [audioElement, isPlaying, accentColor, width, height]);

  // Fallback: animated bars when no audio context
  if (!audioElement) {
    return (
      <div
        style={{
          width,
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
        }}
      >
        {Array.from({ length: 16 }, (_, i) => (
          <div
            key={i}
            style={{
              width: 3,
              height: isPlaying
                ? `${20 + Math.sin(Date.now() / 300 + i) * 40}%`
                : '15%',
              background: accentColor,
              borderRadius: 1,
              opacity: isPlaying ? 0.6 : 0.2,
              transition: 'height 0.1s ease, opacity 0.3s ease',
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      style={{
        width,
        height,
        opacity: isPlaying ? 0.8 : 0.2,
        transition: 'opacity 0.3s ease',
      }}
    />
  );
};
