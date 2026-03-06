/**
 * ParticleSystem
 *
 * Creates and manages visual effects through particles:
 * - Ember trails for angry words
 * - Glitter bursts for celebration
 * - Rain streaks for sadness
 * - Electric arcs between letters
 * - Smoke wisps for ethereal effects
 * - Confetti explosions
 * - Stardust trails
 *
 * Particles are pooled for performance.
 */

import { Particle, EffectType } from './types';

// =============================================================================
// PARTICLE DEFINITIONS
// =============================================================================

interface ParticleConfig {
  lifetime: number;           // ms
  size: { min: number; max: number };
  speed: { min: number; max: number };
  gravity: number;
  fadeStart: number;          // 0-1, when to start fading
  rotationSpeed: number;
  spread: number;             // angle spread in radians
  color: string | string[];   // single color or palette
  shape: 'circle' | 'square' | 'triangle' | 'star' | 'line' | 'glow';
  blendMode: 'normal' | 'add' | 'screen' | 'multiply';
  trail?: boolean;
  trailLength?: number;
}

const PARTICLE_CONFIGS: Record<EffectType, ParticleConfig> = {
  ember_trail: {
    lifetime: 1500,
    size: { min: 2, max: 6 },
    speed: { min: 30, max: 80 },
    gravity: -40,  // floats up
    fadeStart: 0.5,
    rotationSpeed: 2,
    spread: Math.PI / 4,
    color: ['#FF4400', '#FF6600', '#FF8800', '#FFAA00'],
    shape: 'circle',
    blendMode: 'add',
    trail: true,
    trailLength: 5,
  },

  frost_crystals: {
    lifetime: 2000,
    size: { min: 4, max: 10 },
    speed: { min: 10, max: 30 },
    gravity: 20,
    fadeStart: 0.7,
    rotationSpeed: 0.5,
    spread: Math.PI * 2,
    color: ['#AAEEFF', '#CCFFFF', '#FFFFFF', '#88DDFF'],
    shape: 'star',
    blendMode: 'add',
  },

  electric_arc: {
    lifetime: 200,
    size: { min: 1, max: 3 },
    speed: { min: 200, max: 400 },
    gravity: 0,
    fadeStart: 0.3,
    rotationSpeed: 0,
    spread: Math.PI / 8,
    color: ['#00FFFF', '#FFFFFF', '#88FFFF'],
    shape: 'line',
    blendMode: 'add',
  },

  glitter_burst: {
    lifetime: 1200,
    size: { min: 2, max: 5 },
    speed: { min: 100, max: 250 },
    gravity: 150,
    fadeStart: 0.6,
    rotationSpeed: 10,
    spread: Math.PI * 2,
    color: ['#FFD700', '#FFA500', '#FFFFFF', '#FFEE88'],
    shape: 'star',
    blendMode: 'add',
  },

  rain_streak: {
    lifetime: 800,
    size: { min: 1, max: 2 },
    speed: { min: 300, max: 500 },
    gravity: 400,
    fadeStart: 0.8,
    rotationSpeed: 0,
    spread: 0.1,
    color: '#6688AA',
    shape: 'line',
    blendMode: 'normal',
  },

  smoke_wisps: {
    lifetime: 3000,
    size: { min: 10, max: 30 },
    speed: { min: 10, max: 30 },
    gravity: -20,
    fadeStart: 0.3,
    rotationSpeed: 0.3,
    spread: Math.PI / 3,
    color: ['#444444', '#555555', '#666666'],
    shape: 'glow',
    blendMode: 'screen',
  },

  stardust: {
    lifetime: 2000,
    size: { min: 1, max: 4 },
    speed: { min: 20, max: 60 },
    gravity: -10,
    fadeStart: 0.5,
    rotationSpeed: 1,
    spread: Math.PI * 2,
    color: ['#FFFFFF', '#FFEECC', '#FFEEDD', '#FFFFEE'],
    shape: 'star',
    blendMode: 'add',
  },

  confetti: {
    lifetime: 3000,
    size: { min: 4, max: 8 },
    speed: { min: 150, max: 300 },
    gravity: 100,
    fadeStart: 0.8,
    rotationSpeed: 8,
    spread: Math.PI,
    color: ['#FF4444', '#44FF44', '#4444FF', '#FFFF44', '#FF44FF', '#44FFFF'],
    shape: 'square',
    blendMode: 'normal',
  },

  sparks: {
    lifetime: 600,
    size: { min: 1, max: 3 },
    speed: { min: 150, max: 350 },
    gravity: 200,
    fadeStart: 0.4,
    rotationSpeed: 0,
    spread: Math.PI * 2,
    color: ['#FFFF00', '#FFAA00', '#FF6600', '#FFFFFF'],
    shape: 'circle',
    blendMode: 'add',
    trail: true,
    trailLength: 3,
  },

  neon_glow: {
    lifetime: 500,
    size: { min: 15, max: 25 },
    speed: { min: 0, max: 10 },
    gravity: 0,
    fadeStart: 0.5,
    rotationSpeed: 0,
    spread: 0,
    color: '#FF00FF',
    shape: 'glow',
    blendMode: 'add',
  },

  drop_shadow: {
    lifetime: 100,
    size: { min: 10, max: 20 },
    speed: { min: 0, max: 0 },
    gravity: 0,
    fadeStart: 0,
    rotationSpeed: 0,
    spread: 0,
    color: '#000000',
    shape: 'glow',
    blendMode: 'multiply',
  },

  chromatic_aberration: {
    lifetime: 100,
    size: { min: 5, max: 10 },
    speed: { min: 0, max: 5 },
    gravity: 0,
    fadeStart: 0,
    rotationSpeed: 0,
    spread: 0,
    color: ['#FF0000', '#00FF00', '#0000FF'],
    shape: 'glow',
    blendMode: 'add',
  },

  scan_lines: {
    lifetime: 50,
    size: { min: 1, max: 2 },
    speed: { min: 500, max: 800 },
    gravity: 0,
    fadeStart: 0,
    rotationSpeed: 0,
    spread: 0,
    color: 'rgba(255,255,255,0.1)',
    shape: 'line',
    blendMode: 'add',
  },

  film_grain: {
    lifetime: 50,
    size: { min: 1, max: 2 },
    speed: { min: 0, max: 0 },
    gravity: 0,
    fadeStart: 0,
    rotationSpeed: 0,
    spread: 0,
    color: ['#FFFFFF', '#888888', '#444444'],
    shape: 'square',
    blendMode: 'screen',
  },

  heat_distortion: {
    lifetime: 1000,
    size: { min: 20, max: 40 },
    speed: { min: 20, max: 40 },
    gravity: -30,
    fadeStart: 0.3,
    rotationSpeed: 0.2,
    spread: Math.PI / 6,
    color: 'rgba(255,200,100,0.1)',
    shape: 'glow',
    blendMode: 'screen',
  },

  ink_bleed: {
    lifetime: 2000,
    size: { min: 5, max: 15 },
    speed: { min: 5, max: 20 },
    gravity: 10,
    fadeStart: 0.4,
    rotationSpeed: 0.1,
    spread: Math.PI * 2,
    color: '#000000',
    shape: 'glow',
    blendMode: 'multiply',
  },

  ghost_trail: {
    lifetime: 500,
    size: { min: 10, max: 20 },
    speed: { min: 0, max: 5 },
    gravity: 0,
    fadeStart: 0,
    rotationSpeed: 0,
    spread: 0,
    color: '#FFFFFF',
    shape: 'glow',
    blendMode: 'screen',
  },

  screen_shake: {
    // Not really particles, handled separately
    lifetime: 100,
    size: { min: 0, max: 0 },
    speed: { min: 0, max: 0 },
    gravity: 0,
    fadeStart: 0,
    rotationSpeed: 0,
    spread: 0,
    color: '#000000',
    shape: 'circle',
    blendMode: 'normal',
  },

  vignette_pulse: {
    lifetime: 500,
    size: { min: 100, max: 200 },
    speed: { min: 0, max: 0 },
    gravity: 0,
    fadeStart: 0.5,
    rotationSpeed: 0,
    spread: 0,
    color: '#000000',
    shape: 'glow',
    blendMode: 'multiply',
  },

  flash: {
    lifetime: 150,
    size: { min: 500, max: 1000 },
    speed: { min: 0, max: 0 },
    gravity: 0,
    fadeStart: 0,
    rotationSpeed: 0,
    spread: 0,
    color: '#FFFFFF',
    shape: 'glow',
    blendMode: 'add',
  },

  ripple_distort: {
    lifetime: 800,
    size: { min: 20, max: 100 },
    speed: { min: 100, max: 200 },
    gravity: 0,
    fadeStart: 0.3,
    rotationSpeed: 0,
    spread: Math.PI * 2,
    color: 'rgba(255,255,255,0.3)',
    shape: 'circle',
    blendMode: 'screen',
  },

  // Premium effect types — handled as canvas rendering passes, not particles.
  // Minimal configs so the type system is satisfied and emitBurst doesn't crash.
  liquid_metal_distort: {
    lifetime: 0, size: { min: 0, max: 0 }, speed: { min: 0, max: 0 },
    gravity: 0, fadeStart: 1, rotationSpeed: 0, spread: 0,
    color: 'transparent', shape: 'circle', blendMode: 'normal',
  },
  chrome_shimmer: {
    lifetime: 0, size: { min: 0, max: 0 }, speed: { min: 0, max: 0 },
    gravity: 0, fadeStart: 1, rotationSpeed: 0, spread: 0,
    color: 'transparent', shape: 'circle', blendMode: 'normal',
  },
  neon_layers: {
    lifetime: 0, size: { min: 0, max: 0 }, speed: { min: 0, max: 0 },
    gravity: 0, fadeStart: 1, rotationSpeed: 0, spread: 0,
    color: 'transparent', shape: 'circle', blendMode: 'normal',
  },
  retro_crt: {
    lifetime: 0, size: { min: 0, max: 0 }, speed: { min: 0, max: 0 },
    gravity: 0, fadeStart: 1, rotationSpeed: 0, spread: 0,
    color: 'transparent', shape: 'circle', blendMode: 'normal',
  },
};

// =============================================================================
// PARTICLE SYSTEM CLASS
// =============================================================================

export class ParticleSystem {
  private particles: Particle[] = [];
  private pool: Particle[] = [];
  private maxParticles: number = 1000;
  private idCounter: number = 0;

  /**
   * Emit particles of a specific effect type
   */
  emit(
    type: EffectType,
    x: number,
    y: number,
    count: number = 10,
    direction?: number,  // override direction in radians
    colorOverride?: string
  ): void {
    const config = PARTICLE_CONFIGS[type];
    if (!config) return;

    for (let i = 0; i < count; i++) {
      const particle = this.getParticle();

      // Random angle within spread
      const baseAngle = direction ?? -Math.PI / 2; // default upward
      const angle = baseAngle + (Math.random() - 0.5) * config.spread;

      // Random speed
      const speed = config.speed.min + Math.random() * (config.speed.max - config.speed.min);

      // Random size
      const size = config.size.min + Math.random() * (config.size.max - config.size.min);

      // Color
      let color = colorOverride || (
        Array.isArray(config.color)
          ? config.color[Math.floor(Math.random() * config.color.length)]
          : config.color
      );

      particle.id = `particle-${this.idCounter++}`;
      particle.type = type;
      particle.position = { x, y };
      particle.velocity = {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed,
      };
      particle.life = 1;
      particle.size = size;
      particle.color = color;
      particle.opacity = 1;
      particle.rotation = Math.random() * Math.PI * 2;

      this.particles.push(particle);

      // Respect max particles
      if (this.particles.length > this.maxParticles) {
        const oldest = this.particles.shift();
        if (oldest) this.pool.push(oldest);
      }
    }
  }

  /**
   * Emit particles along a path (for trails)
   */
  emitTrail(
    type: EffectType,
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    density: number = 0.1  // particles per pixel
  ): void {
    const dx = endX - startX;
    const dy = endY - startY;
    const length = Math.sqrt(dx * dx + dy * dy);
    const count = Math.floor(length * density);

    for (let i = 0; i < count; i++) {
      const t = i / count;
      const x = startX + dx * t;
      const y = startY + dy * t;
      this.emit(type, x, y, 1);
    }
  }

  /**
   * Emit particles in a burst pattern
   */
  emitBurst(
    type: EffectType,
    x: number,
    y: number,
    count: number = 20,
    radius: number = 0
  ): void {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const offsetX = Math.cos(angle) * radius;
      const offsetY = Math.sin(angle) * radius;
      this.emit(type, x + offsetX, y + offsetY, 1, angle);
    }
  }

  /**
   * Emit electric arc between two points
   */
  emitArc(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    segments: number = 5
  ): void {
    const points: { x: number; y: number }[] = [];
    points.push({ x: startX, y: startY });

    // Generate jagged path
    for (let i = 1; i < segments; i++) {
      const t = i / segments;
      const baseX = startX + (endX - startX) * t;
      const baseY = startY + (endY - startY) * t;

      // Perpendicular offset
      const perpX = -(endY - startY);
      const perpY = endX - startX;
      const perpLen = Math.sqrt(perpX * perpX + perpY * perpY);
      const offset = (Math.random() - 0.5) * 20;

      points.push({
        x: baseX + (perpX / perpLen) * offset,
        y: baseY + (perpY / perpLen) * offset,
      });
    }
    points.push({ x: endX, y: endY });

    // Emit particles along arc
    for (let i = 0; i < points.length - 1; i++) {
      this.emitTrail('electric_arc', points[i].x, points[i].y, points[i + 1].x, points[i + 1].y, 0.2);
    }
  }

  /**
   * Update all particles
   */
  update(deltaTime: number): Particle[] {
    const dt = deltaTime / 1000;
    const toRemove: number[] = [];

    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];
      const config = PARTICLE_CONFIGS[particle.type];

      // Update life
      particle.life -= dt / (config.lifetime / 1000);

      if (particle.life <= 0) {
        toRemove.push(i);
        continue;
      }

      // Apply gravity
      particle.velocity.y += config.gravity * dt;

      // Update position
      particle.position.x += particle.velocity.x * dt;
      particle.position.y += particle.velocity.y * dt;

      // Update rotation
      particle.rotation += config.rotationSpeed * dt;

      // Update opacity based on fadeStart
      if (particle.life < config.fadeStart) {
        particle.opacity = particle.life / config.fadeStart;
      }
    }

    // Remove dead particles (reverse order to maintain indices)
    for (let i = toRemove.length - 1; i >= 0; i--) {
      const removed = this.particles.splice(toRemove[i], 1)[0];
      this.pool.push(removed);
    }

    return this.particles;
  }

  /**
   * Get or create a particle from the pool
   */
  private getParticle(): Particle {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return {
      id: '',
      type: 'confetti',
      position: { x: 0, y: 0 },
      velocity: { x: 0, y: 0 },
      life: 1,
      size: 5,
      color: '#FFFFFF',
      opacity: 1,
      rotation: 0,
    };
  }

  /**
   * Get particle config for rendering
   */
  getConfig(type: EffectType): ParticleConfig {
    return PARTICLE_CONFIGS[type];
  }

  /**
   * Clear all particles
   */
  clear(): void {
    this.pool.push(...this.particles);
    this.particles = [];
  }

  /**
   * Get current particle count
   */
  get count(): number {
    return this.particles.length;
  }

  /**
   * Get all active particles
   */
  getParticles(): Particle[] {
    return this.particles;
  }
}

// =============================================================================
// GLOBAL EFFECTS MANAGER
// =============================================================================

export interface GlobalEffectState {
  screenShake: {
    active: boolean;
    intensity: number;
    duration: number;
    elapsed: number;
    offsetX: number;
    offsetY: number;
  };
  vignette: {
    active: boolean;
    intensity: number;
    duration: number;
    elapsed: number;
  };
  flash: {
    active: boolean;
    intensity: number;
    duration: number;
    elapsed: number;
    color: string;
  };
}

export class GlobalEffectsManager {
  private state: GlobalEffectState = {
    screenShake: { active: false, intensity: 0, duration: 0, elapsed: 0, offsetX: 0, offsetY: 0 },
    vignette: { active: false, intensity: 0, duration: 0, elapsed: 0 },
    flash: { active: false, intensity: 0, duration: 0, elapsed: 0, color: '#FFFFFF' },
  };

  /**
   * Trigger screen shake
   */
  shake(intensity: number = 10, duration: number = 300): void {
    this.state.screenShake = {
      active: true,
      intensity,
      duration,
      elapsed: 0,
      offsetX: 0,
      offsetY: 0,
    };
  }

  /**
   * Trigger vignette pulse
   */
  vignette(intensity: number = 0.5, duration: number = 500): void {
    this.state.vignette = {
      active: true,
      intensity,
      duration,
      elapsed: 0,
    };
  }

  /**
   * Trigger flash
   */
  flash(color: string = '#FFFFFF', intensity: number = 1, duration: number = 150): void {
    this.state.flash = {
      active: true,
      intensity,
      duration,
      elapsed: 0,
      color,
    };
  }

  /**
   * Update effects
   */
  update(deltaTime: number): GlobalEffectState {
    // Screen shake
    if (this.state.screenShake.active) {
      this.state.screenShake.elapsed += deltaTime;

      if (this.state.screenShake.elapsed >= this.state.screenShake.duration) {
        this.state.screenShake.active = false;
        this.state.screenShake.offsetX = 0;
        this.state.screenShake.offsetY = 0;
      } else {
        const progress = this.state.screenShake.elapsed / this.state.screenShake.duration;
        const decay = 1 - progress;
        const intensity = this.state.screenShake.intensity * decay;

        this.state.screenShake.offsetX = (Math.random() - 0.5) * 2 * intensity;
        this.state.screenShake.offsetY = (Math.random() - 0.5) * 2 * intensity;
      }
    }

    // Vignette
    if (this.state.vignette.active) {
      this.state.vignette.elapsed += deltaTime;

      if (this.state.vignette.elapsed >= this.state.vignette.duration) {
        this.state.vignette.active = false;
      }
    }

    // Flash
    if (this.state.flash.active) {
      this.state.flash.elapsed += deltaTime;

      if (this.state.flash.elapsed >= this.state.flash.duration) {
        this.state.flash.active = false;
      }
    }

    return { ...this.state };
  }

  /**
   * Get current state
   */
  getState(): GlobalEffectState {
    return { ...this.state };
  }

  /**
   * Reset all effects
   */
  reset(): void {
    this.state = {
      screenShake: { active: false, intensity: 0, duration: 0, elapsed: 0, offsetX: 0, offsetY: 0 },
      vignette: { active: false, intensity: 0, duration: 0, elapsed: 0 },
      flash: { active: false, intensity: 0, duration: 0, elapsed: 0, color: '#FFFFFF' },
    };
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export const particleSystem = new ParticleSystem();
export const globalEffects = new GlobalEffectsManager();
