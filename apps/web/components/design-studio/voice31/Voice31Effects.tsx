'use client';

/**
 * Voice31 Effects
 *
 * Particle effects overlay for voice31.
 * Reuses the DynamicEffectsLayer particle system.
 */

import React, { useEffect, useRef, useCallback } from 'react';
import type { ActiveEffect, EffectType } from './Voice31Store';

// =============================================================================
// TYPES
// =============================================================================

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  rotation: number;
  rotationSpeed: number;
  life: number;
  maxLife: number;
}

interface Voice31EffectsProps {
  effect: ActiveEffect;
  width: number;
  height: number;
}

// =============================================================================
// EFFECT COLORS
// =============================================================================

const EFFECT_COLORS: Record<string, string[]> = {
  rain: ['#6699cc', '#88aadd', '#aaccff'],
  snow: ['#ffffff', '#f0f8ff', '#e8f4ff'],
  confetti: ['#ff6b6b', '#4ecdc4', '#ffe66d', '#95e1d3', '#f38181', '#aa96da'],
  sparkles: ['#ffd700', '#ffec8b', '#fff8dc', '#ffffff'],
  fire: ['#ff4500', '#ff6a00', '#ff8c00', '#ffa500', '#ffcc00'],
  hearts: ['#ff6b6b', '#ff8585', '#ff9999', '#ee5a5a'],
  stars: ['#ffd700', '#ffec8b', '#ffffff', '#87ceeb'],
};

// =============================================================================
// PARTICLE FACTORY
// =============================================================================

function createParticle(
  type: string,
  width: number,
  height: number,
  intensity: number
): Particle {
  const colors = EFFECT_COLORS[type] || ['#ffffff'];
  const color = colors[Math.floor(Math.random() * colors.length)];

  const base: Particle = {
    x: Math.random() * width,
    y: 0,
    vx: 0,
    vy: 1,
    size: 2,
    color,
    alpha: 1,
    rotation: 0,
    rotationSpeed: 0,
    life: 0,
    maxLife: 100,
  };

  switch (type) {
    case 'rain':
      return {
        ...base,
        y: -10,
        vx: (Math.random() - 0.5) * 2,
        vy: 8 + Math.random() * 8 * intensity,
        size: 1 + Math.random() * 2,
        alpha: 0.3 + Math.random() * 0.4,
        maxLife: height / 8,
      };

    case 'snow':
      return {
        ...base,
        y: -10,
        vx: (Math.random() - 0.5) * 2,
        vy: 1 + Math.random() * 2 * intensity,
        size: 2 + Math.random() * 4,
        alpha: 0.6 + Math.random() * 0.4,
        maxLife: height / 2,
      };

    case 'confetti':
      return {
        ...base,
        x: width / 2 + (Math.random() - 0.5) * width * 0.5,
        y: -20,
        vx: (Math.random() - 0.5) * 6 * intensity,
        vy: 2 + Math.random() * 4,
        size: 6 + Math.random() * 8,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2,
        maxLife: height / 3,
      };

    case 'sparkles':
      return {
        ...base,
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 1,
        vy: -1 - Math.random() * 2,
        size: 2 + Math.random() * 4,
        alpha: Math.random(),
        maxLife: 50 + Math.random() * 50,
      };

    case 'fire':
      return {
        ...base,
        x: width / 2 + (Math.random() - 0.5) * width * 0.3,
        y: height,
        vx: (Math.random() - 0.5) * 3,
        vy: -3 - Math.random() * 4 * intensity,
        size: 4 + Math.random() * 10,
        alpha: 0.8,
        maxLife: 30 + Math.random() * 40,
      };

    case 'hearts':
      return {
        ...base,
        x: Math.random() * width,
        y: height + 20,
        vx: (Math.random() - 0.5) * 2,
        vy: -2 - Math.random() * 3,
        size: 10 + Math.random() * 15,
        rotation: (Math.random() - 0.5) * 0.5,
        rotationSpeed: (Math.random() - 0.5) * 0.05,
        maxLife: height / 2,
      };

    case 'stars':
      return {
        ...base,
        x: Math.random() * width,
        y: Math.random() * height * 0.7,
        vx: 0,
        vy: 0,
        size: 2 + Math.random() * 6,
        alpha: 0.3 + Math.random() * 0.7,
        maxLife: 100 + Math.random() * 100,
      };

    default:
      return base;
  }
}

// =============================================================================
// PARTICLE UPDATE
// =============================================================================

function updateParticle(
  particle: Particle,
  type: string,
  width: number,
  height: number
): boolean {
  particle.life++;
  particle.x += particle.vx;
  particle.y += particle.vy;
  particle.rotation += particle.rotationSpeed;

  switch (type) {
    case 'snow':
      particle.vx = Math.sin(particle.life * 0.05) * 0.5;
      break;
    case 'confetti':
      particle.vy += 0.1;
      particle.vx *= 0.99;
      break;
    case 'fire':
      particle.alpha *= 0.97;
      particle.size *= 1.01;
      break;
    case 'sparkles':
      particle.alpha = 0.5 + Math.sin(particle.life * 0.2) * 0.5;
      break;
  }

  return (
    particle.life < particle.maxLife &&
    particle.y < height + 50 &&
    particle.y > -50 &&
    particle.x > -50 &&
    particle.x < width + 50 &&
    particle.alpha > 0.01
  );
}

// =============================================================================
// PARTICLE DRAW
// =============================================================================

function drawParticle(
  ctx: CanvasRenderingContext2D,
  particle: Particle,
  type: string
): void {
  ctx.save();
  ctx.translate(particle.x, particle.y);
  ctx.rotate(particle.rotation);
  ctx.globalAlpha = particle.alpha;

  switch (type) {
    case 'rain':
      ctx.fillStyle = particle.color;
      ctx.fillRect(-0.5, -particle.size * 2, 1, particle.size * 4);
      break;

    case 'snow':
    case 'fire':
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
      ctx.fill();
      break;

    case 'confetti':
      ctx.fillStyle = particle.color;
      ctx.fillRect(-particle.size / 2, -particle.size / 4, particle.size, particle.size / 2);
      break;

    case 'sparkles':
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2;
        const innerAngle = angle + Math.PI / 4;
        ctx.lineTo(Math.cos(angle) * particle.size, Math.sin(angle) * particle.size);
        ctx.lineTo(Math.cos(innerAngle) * particle.size * 0.4, Math.sin(innerAngle) * particle.size * 0.4);
      }
      ctx.closePath();
      ctx.fill();
      break;

    case 'hearts':
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      const size = particle.size * 0.5;
      ctx.moveTo(0, size * 0.3);
      ctx.bezierCurveTo(-size, -size * 0.5, -size, size * 0.5, 0, size);
      ctx.bezierCurveTo(size, size * 0.5, size, -size * 0.5, 0, size * 0.3);
      ctx.fill();
      break;

    case 'stars':
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
        const innerAngle = angle + Math.PI / 5;
        ctx.lineTo(Math.cos(angle) * particle.size, Math.sin(angle) * particle.size);
        ctx.lineTo(Math.cos(innerAngle) * particle.size * 0.4, Math.sin(innerAngle) * particle.size * 0.4);
      }
      ctx.closePath();
      ctx.fill();
      break;

    default:
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
      ctx.fill();
  }

  ctx.restore();
}

// =============================================================================
// COMPONENT
// =============================================================================

export const Voice31Effects: React.FC<Voice31EffectsProps> = ({ effect, width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>();

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    const now = Date.now();
    const elapsed = now - effect.startTime;

    // Stop spawning near end of duration
    const shouldSpawn = elapsed < effect.duration * 0.8;

    // Spawn particles
    if (shouldSpawn && effect.type) {
      const spawnRate = effect.intensity * 10;
      if (Math.random() < spawnRate / 60) {
        particlesRef.current.push(
          createParticle(effect.type, width, height, effect.intensity)
        );
      }
    }

    // Update and draw particles
    particlesRef.current = particlesRef.current.filter((particle) => {
      const alive = updateParticle(particle, effect.type || '', width, height);
      if (alive) {
        drawParticle(ctx, particle, effect.type || '');
      }
      return alive;
    });

    // Continue animation if particles exist or within duration
    if (particlesRef.current.length > 0 || elapsed < effect.duration) {
      animationRef.current = requestAnimationFrame(animate);
    }
  }, [effect, width, height]);

  useEffect(() => {
    // Reset particles when effect changes
    particlesRef.current = [];
    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 100 }}
    />
  );
};

export default Voice31Effects;
