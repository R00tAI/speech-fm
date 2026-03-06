'use client';

import React, { useRef, useEffect } from 'react';
import type { VisualizationType } from '../Voice31Store';

/**
 * Procedural Visualization Component
 * Renders various animated scientific/data visualizations on canvas.
 * Supports: isometric_lattice, waveform, graph, particles, matrix, neural_net, dna_helix
 */

interface ProceduralVisualizationProps {
  type: VisualizationType;
  title?: string;
  phosphorColor: string;
}

export const ProceduralVisualization: React.FC<ProceduralVisualizationProps> = ({
  type,
  title,
  phosphorColor,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  const colors = {
    green: { r: 51, g: 255, b: 51, hex: '#33ff33' },
    amber: { r: 255, g: 170, b: 0, hex: '#ffaa00' },
    red: { r: 255, g: 68, b: 68, hex: '#ff4444' },
    blue: { r: 68, g: 136, b: 255, hex: '#4488ff' },
    white: { r: 255, g: 255, b: 255, hex: '#ffffff' },
  }[phosphorColor] || { r: 255, g: 170, b: 0, hex: '#ffaa00' };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 400;
    const height = 300;
    canvas.width = width;
    canvas.height = height;

    let time = 0;

    const drawIsometricLattice = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, width, height);

      const spacing = 40;
      const rows = 6;
      const cols = 8;
      const offsetX = width / 2;
      const offsetY = 60;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = offsetX + (col - cols / 2) * spacing * 0.866 + (row % 2) * spacing * 0.433;
          const y = offsetY + row * spacing * 0.75;
          const z = Math.sin(time * 2 + col * 0.5 + row * 0.3) * 15;

          ctx.strokeStyle = `rgba(${colors.r}, ${colors.g}, ${colors.b}, 0.3)`;
          ctx.lineWidth = 1;

          if (col < cols - 1) {
            const nx = offsetX + (col + 1 - cols / 2) * spacing * 0.866 + (row % 2) * spacing * 0.433;
            const nz = Math.sin(time * 2 + (col + 1) * 0.5 + row * 0.3) * 15;
            ctx.beginPath();
            ctx.moveTo(x, y - z);
            ctx.lineTo(nx, y - nz);
            ctx.stroke();
          }
          if (row < rows - 1) {
            const ny = offsetY + (row + 1) * spacing * 0.75;
            const nz = Math.sin(time * 2 + col * 0.5 + (row + 1) * 0.3) * 15;
            ctx.beginPath();
            ctx.moveTo(x, y - z);
            ctx.lineTo(x + ((row + 1) % 2 - row % 2) * spacing * 0.433, ny - nz);
            ctx.stroke();
          }

          const pulse = Math.sin(time * 3 + col * 0.3 + row * 0.5) * 0.3 + 0.7;
          const radius = 4 + pulse * 2;

          ctx.fillStyle = `rgba(${colors.r}, ${colors.g}, ${colors.b}, ${pulse})`;
          ctx.shadowColor = colors.hex;
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(x, y - z, radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
    };

    const drawWaveform = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, width, height);

      for (let wave = 0; wave < 3; wave++) {
        const freq = 0.02 + wave * 0.01;
        const amp = 30 - wave * 8;
        const phase = time * (2 + wave * 0.5);
        const yOffset = height / 2 + (wave - 1) * 20;

        ctx.strokeStyle = `rgba(${colors.r}, ${colors.g}, ${colors.b}, ${0.8 - wave * 0.2})`;
        ctx.lineWidth = 2 - wave * 0.5;
        ctx.shadowColor = colors.hex;
        ctx.shadowBlur = wave === 0 ? 8 : 0;

        ctx.beginPath();
        for (let x = 0; x < width; x++) {
          const y = yOffset + Math.sin(x * freq + phase) * amp * Math.sin(x * 0.005 + time);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    };

    const drawGraph = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = `rgba(${colors.r}, ${colors.g}, ${colors.b}, 0.1)`;
      ctx.lineWidth = 1;
      for (let i = 0; i < 10; i++) {
        ctx.beginPath();
        ctx.moveTo(40, 30 + i * 24);
        ctx.lineTo(width - 20, 30 + i * 24);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(40 + i * 35, 30);
        ctx.lineTo(40 + i * 35, height - 30);
        ctx.stroke();
      }

      ctx.strokeStyle = colors.hex;
      ctx.lineWidth = 2;
      ctx.shadowColor = colors.hex;
      ctx.shadowBlur = 5;
      ctx.beginPath();

      const points = 12;
      for (let i = 0; i < points; i++) {
        const x = 40 + i * 28;
        const baseY = 50 + Math.sin(i * 0.8 + time * 0.5) * 30 + Math.random() * 5;
        const y = height - 30 - (baseY + Math.sin(time * 2 + i) * 10);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      for (let i = 0; i < points; i++) {
        const x = 40 + i * 28;
        const baseY = 50 + Math.sin(i * 0.8 + time * 0.5) * 30;
        const y = height - 30 - (baseY + Math.sin(time * 2 + i) * 10);
        ctx.fillStyle = colors.hex;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const drawParticles = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fillRect(0, 0, width, height);

      const particleCount = 50;
      for (let i = 0; i < particleCount; i++) {
        const angle = (i / particleCount) * Math.PI * 2 + time * 0.3;
        const radius = 50 + Math.sin(time * 2 + i * 0.2) * 30 + i % 3 * 20;
        const x = width / 2 + Math.cos(angle) * radius;
        const y = height / 2 + Math.sin(angle) * radius * 0.6;
        const size = 2 + Math.sin(time * 3 + i) * 1.5;
        const alpha = 0.5 + Math.sin(time * 2 + i * 0.1) * 0.3;

        ctx.fillStyle = `rgba(${colors.r}, ${colors.g}, ${colors.b}, ${alpha})`;
        ctx.shadowColor = colors.hex;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    };

    const drawMatrix = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
      ctx.fillRect(0, 0, width, height);

      const chars = '01アイウエオカキクケコ';
      ctx.font = '12px monospace';

      for (let col = 0; col < 30; col++) {
        const x = col * 14;
        const speed = 1 + (col % 3) * 0.5;
        const yOffset = (time * 30 * speed + col * 50) % (height + 200) - 100;

        for (let row = 0; row < 15; row++) {
          const y = yOffset + row * 18;
          if (y < 0 || y > height) continue;

          const charIndex = Math.floor((time * 10 + row + col) % chars.length);
          const alpha = Math.max(0, 1 - row / 15);
          ctx.fillStyle = `rgba(${colors.r}, ${colors.g}, ${colors.b}, ${alpha * 0.8})`;

          if (row === 0) {
            ctx.shadowColor = colors.hex;
            ctx.shadowBlur = 10;
          }
          ctx.fillText(chars[charIndex], x, y);
          ctx.shadowBlur = 0;
        }
      }
    };

    const drawNeuralNet = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fillRect(0, 0, width, height);

      const layers = [4, 6, 6, 4, 2];
      const layerSpacing = width / (layers.length + 1);

      for (let l = 0; l < layers.length - 1; l++) {
        const x1 = (l + 1) * layerSpacing;
        const x2 = (l + 2) * layerSpacing;

        for (let n1 = 0; n1 < layers[l]; n1++) {
          const y1 = height / 2 + (n1 - (layers[l] - 1) / 2) * 35;

          for (let n2 = 0; n2 < layers[l + 1]; n2++) {
            const y2 = height / 2 + (n2 - (layers[l + 1] - 1) / 2) * 35;
            const pulse = Math.sin(time * 3 + n1 * 0.3 + n2 * 0.5 + l) * 0.5 + 0.5;

            ctx.strokeStyle = `rgba(${colors.r}, ${colors.g}, ${colors.b}, ${0.1 + pulse * 0.2})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
          }
        }
      }

      for (let l = 0; l < layers.length; l++) {
        const x = (l + 1) * layerSpacing;

        for (let n = 0; n < layers[l]; n++) {
          const y = height / 2 + (n - (layers[l] - 1) / 2) * 35;
          const pulse = Math.sin(time * 2 + n * 0.5 + l * 0.3) * 0.3 + 0.7;

          ctx.fillStyle = `rgba(${colors.r}, ${colors.g}, ${colors.b}, ${pulse})`;
          ctx.shadowColor = colors.hex;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(x, y, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
    };

    const drawDNAHelix = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fillRect(0, 0, width, height);

      const segments = 40;
      const amplitude = 60;
      const spacing = width / segments;

      for (let i = 0; i < segments; i++) {
        const x = i * spacing;
        const phase = time * 2 + i * 0.3;

        const y1 = height / 2 + Math.sin(phase) * amplitude;
        const y2 = height / 2 - Math.sin(phase) * amplitude;

        if (i > 0) {
          const prevPhase = time * 2 + (i - 1) * 0.3;
          const prevY1 = height / 2 + Math.sin(prevPhase) * amplitude;
          const prevY2 = height / 2 - Math.sin(prevPhase) * amplitude;

          ctx.strokeStyle = `rgba(${colors.r}, ${colors.g}, ${colors.b}, 0.6)`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo((i - 1) * spacing, prevY1);
          ctx.lineTo(x, y1);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo((i - 1) * spacing, prevY2);
          ctx.lineTo(x, y2);
          ctx.stroke();
        }

        if (i % 4 === 0) {
          const gradient = ctx.createLinearGradient(x, y1, x, y2);
          gradient.addColorStop(0, colors.hex);
          gradient.addColorStop(0.5, `rgba(${colors.r}, ${colors.g}, ${colors.b}, 0.3)`);
          gradient.addColorStop(1, colors.hex);

          ctx.strokeStyle = gradient;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x, y1);
          ctx.lineTo(x, y2);
          ctx.stroke();
        }

        const alpha = 0.5 + Math.sin(phase) * 0.5;
        ctx.fillStyle = `rgba(${colors.r}, ${colors.g}, ${colors.b}, ${alpha})`;
        ctx.shadowColor = colors.hex;
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.arc(x, y1, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, y2, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    };

    const animate = () => {
      time += 0.016;

      switch (type) {
        case 'isometric_lattice':
          drawIsometricLattice();
          break;
        case 'waveform':
          drawWaveform();
          break;
        case 'graph':
          drawGraph();
          break;
        case 'particles':
          drawParticles();
          break;
        case 'matrix':
          drawMatrix();
          break;
        case 'neural_net':
          drawNeuralNet();
          break;
        case 'dna_helix':
          drawDNAHelix();
          break;
        default:
          drawWaveform();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [type, phosphorColor, colors.r, colors.g, colors.b, colors.hex]);

  const glowColor = `rgba(${colors.r}, ${colors.g}, ${colors.b}, 0.5)`;

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      {title && (
        <div
          className="text-lg font-mono font-bold tracking-wider"
          style={{
            color: colors.hex,
            textShadow: `0 0 10px ${glowColor}`,
          }}
        >
          {title.toUpperCase()}
        </div>
      )}
      <div
        className="relative rounded-lg overflow-hidden"
        style={{
          boxShadow: `0 0 30px ${glowColor}`,
        }}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-auto max-w-[400px]"
          style={{
            filter: 'brightness(1.1) contrast(1.05)',
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
              rgba(0, 0, 0, 0.2) 2px,
              rgba(0, 0, 0, 0.2) 4px
            )`,
          }}
        />
      </div>
    </div>
  );
};
