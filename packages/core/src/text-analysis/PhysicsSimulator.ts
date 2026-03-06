/**
 * PhysicsSimulator
 *
 * Handles realistic physics for kinetic typography:
 * - Gravity and falling
 * - Bouncing and collisions
 * - Springs and elastic behavior
 * - Pendulum swinging
 * - Floating/buoyancy
 *
 * Each character can have independent physics state.
 */

import { PhysicsParams, PhysicsState, CharacterAnimation } from './types';

// =============================================================================
// PHYSICS ENGINE
// =============================================================================

export class PhysicsSimulator {
  private states: Map<string, PhysicsState> = new Map();
  private groundY: number = 0;

  /**
   * Initialize physics state for a character
   */
  initializeState(
    id: string,
    startPosition: { x: number; y: number },
    params: Partial<PhysicsParams> = {}
  ): void {
    this.states.set(id, {
      position: { ...startPosition },
      velocity: params.velocity || { x: 0, y: 0 },
      acceleration: { x: 0, y: 0 },
      rotation: 0,
      angularVelocity: params.angularVelocity || 0,
    });
  }

  /**
   * Set ground level for bouncing
   */
  setGroundY(y: number): void {
    this.groundY = y;
  }

  /**
   * Update physics simulation for one timestep
   */
  update(id: string, params: PhysicsParams, deltaTime: number): PhysicsState | null {
    const state = this.states.get(id);
    if (!state) return null;

    const dt = deltaTime / 1000; // convert to seconds

    // Apply gravity
    state.acceleration.y = params.gravity;

    // Update velocity
    state.velocity.x += state.acceleration.x * dt;
    state.velocity.y += state.acceleration.y * dt;

    // Apply friction/air resistance
    state.velocity.x *= 1 - params.friction * dt;
    state.velocity.y *= 1 - params.friction * dt * 0.1; // less friction on Y for natural falling

    // Update position
    state.position.x += state.velocity.x * dt;
    state.position.y += state.velocity.y * dt;

    // Update rotation
    state.rotation += state.angularVelocity * dt;
    state.angularVelocity *= 1 - params.friction * dt;

    // Ground collision
    if (state.position.y > this.groundY) {
      state.position.y = this.groundY;

      // Bounce
      if (Math.abs(state.velocity.y) > 10) {
        state.velocity.y *= -params.bounce;
        state.angularVelocity = (Math.random() - 0.5) * state.velocity.y * 0.1;
      } else {
        state.velocity.y = 0;
      }

      // Friction on ground
      state.velocity.x *= 0.9;
    }

    return { ...state };
  }

  /**
   * Apply spring force toward target position
   */
  applySpring(
    id: string,
    targetX: number,
    targetY: number,
    params: PhysicsParams
  ): void {
    const state = this.states.get(id);
    if (!state) return;

    // Calculate spring force (Hooke's law)
    const dx = targetX - state.position.x;
    const dy = targetY - state.position.y;

    const forceX = dx * params.tension - state.velocity.x * params.dampening;
    const forceY = dy * params.tension - state.velocity.y * params.dampening;

    // Apply force (F = ma, so a = F/m)
    state.acceleration.x = forceX / params.mass;
    state.acceleration.y = forceY / params.mass;
  }

  /**
   * Apply impulse force (sudden push)
   */
  applyImpulse(id: string, forceX: number, forceY: number, mass: number): void {
    const state = this.states.get(id);
    if (!state) return;

    state.velocity.x += forceX / mass;
    state.velocity.y += forceY / mass;
  }

  /**
   * Apply explosion force from a point
   */
  applyExplosion(
    ids: string[],
    epicenter: { x: number; y: number },
    force: number,
    radius: number
  ): void {
    for (const id of ids) {
      const state = this.states.get(id);
      if (!state) continue;

      const dx = state.position.x - epicenter.x;
      const dy = state.position.y - epicenter.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < radius && distance > 0) {
        const falloff = 1 - distance / radius;
        const magnitude = force * falloff * falloff;

        const nx = dx / distance;
        const ny = dy / distance;

        state.velocity.x += nx * magnitude;
        state.velocity.y += ny * magnitude;
        state.angularVelocity += (Math.random() - 0.5) * magnitude * 0.5;
      }
    }
  }

  /**
   * Apply vortex/swirl force
   */
  applyVortex(
    ids: string[],
    center: { x: number; y: number },
    strength: number,
    radius: number
  ): void {
    for (const id of ids) {
      const state = this.states.get(id);
      if (!state) continue;

      const dx = state.position.x - center.x;
      const dy = state.position.y - center.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < radius && distance > 0) {
        const falloff = 1 - distance / radius;

        // Perpendicular force (tangent to circle)
        const perpX = -dy / distance;
        const perpY = dx / distance;

        // Also pull toward center slightly
        const inwardX = -dx / distance * 0.3;
        const inwardY = -dy / distance * 0.3;

        const force = strength * falloff;

        state.velocity.x += (perpX + inwardX) * force;
        state.velocity.y += (perpY + inwardY) * force;
      }
    }
  }

  /**
   * Simulate pendulum motion
   */
  simulatePendulum(
    id: string,
    pivotX: number,
    pivotY: number,
    length: number,
    gravity: number,
    damping: number
  ): { x: number; y: number; rotation: number } | null {
    const state = this.states.get(id);
    if (!state) return null;

    // Calculate current angle from pivot
    const dx = state.position.x - pivotX;
    const dy = state.position.y - pivotY;
    const currentAngle = Math.atan2(dx, dy);

    // Angular acceleration due to gravity
    const angularAccel = -(gravity / length) * Math.sin(currentAngle);

    // Update angular velocity
    state.angularVelocity += angularAccel * 0.016; // assuming 60fps
    state.angularVelocity *= 1 - damping;

    // Update position
    const newAngle = currentAngle + state.angularVelocity * 0.016;
    const newX = pivotX + Math.sin(newAngle) * length;
    const newY = pivotY + Math.cos(newAngle) * length;

    state.position.x = newX;
    state.position.y = newY;
    state.rotation = newAngle * (180 / Math.PI);

    return { x: newX, y: newY, rotation: state.rotation };
  }

  /**
   * Simulate floating/buoyancy
   */
  simulateFloat(
    id: string,
    targetY: number,
    buoyancy: number,
    wobbleAmount: number,
    time: number
  ): { x: number; y: number } | null {
    const state = this.states.get(id);
    if (!state) return null;

    // Buoyancy force
    const dy = targetY - state.position.y;
    state.velocity.y += dy * buoyancy;
    state.velocity.y *= 0.95; // damping

    // Gentle wobble
    const wobbleX = Math.sin(time * 2) * wobbleAmount;
    const wobbleY = Math.cos(time * 3) * wobbleAmount * 0.5;

    state.position.y += state.velocity.y * 0.016;
    state.position.x += wobbleX * 0.016;

    return {
      x: state.position.x + wobbleX,
      y: state.position.y + wobbleY,
    };
  }

  /**
   * Check if physics is settled (near rest)
   */
  isSettled(id: string, threshold: number = 0.5): boolean {
    const state = this.states.get(id);
    if (!state) return true;

    const speed = Math.sqrt(
      state.velocity.x * state.velocity.x +
      state.velocity.y * state.velocity.y
    );

    return speed < threshold && Math.abs(state.angularVelocity) < threshold;
  }

  /**
   * Get current state
   */
  getState(id: string): PhysicsState | undefined {
    return this.states.get(id);
  }

  /**
   * Remove state
   */
  removeState(id: string): void {
    this.states.delete(id);
  }

  /**
   * Clear all states
   */
  clear(): void {
    this.states.clear();
  }

  /**
   * Convert physics state to character animation
   */
  stateToAnimation(state: PhysicsState, basePosition: { x: number; y: number }): Partial<CharacterAnimation> {
    return {
      x: state.position.x - basePosition.x,
      y: state.position.y - basePosition.y,
      rotation: state.rotation,
    };
  }
}

// =============================================================================
// SPRING SYSTEM
// =============================================================================

export class SpringSystem {
  private springs: Map<string, SpringState> = new Map();

  /**
   * Create a spring
   */
  create(
    id: string,
    initialValue: number,
    targetValue: number,
    tension: number = 200,
    friction: number = 20
  ): void {
    this.springs.set(id, {
      value: initialValue,
      velocity: 0,
      target: targetValue,
      tension,
      friction,
    });
  }

  /**
   * Update spring and return current value
   */
  update(id: string, deltaTime: number): number | null {
    const spring = this.springs.get(id);
    if (!spring) return null;

    const dt = Math.min(deltaTime / 1000, 0.064); // cap at ~16fps min

    // Spring physics
    const displacement = spring.target - spring.value;
    const springForce = displacement * spring.tension;
    const dampingForce = -spring.velocity * spring.friction;
    const acceleration = springForce + dampingForce;

    spring.velocity += acceleration * dt;
    spring.value += spring.velocity * dt;

    return spring.value;
  }

  /**
   * Set new target
   */
  setTarget(id: string, target: number): void {
    const spring = this.springs.get(id);
    if (spring) {
      spring.target = target;
    }
  }

  /**
   * Check if spring is at rest
   */
  isAtRest(id: string, threshold: number = 0.01): boolean {
    const spring = this.springs.get(id);
    if (!spring) return true;

    const atTarget = Math.abs(spring.value - spring.target) < threshold;
    const velocityLow = Math.abs(spring.velocity) < threshold;

    return atTarget && velocityLow;
  }

  /**
   * Get current value
   */
  getValue(id: string): number | null {
    return this.springs.get(id)?.value ?? null;
  }

  /**
   * Remove spring
   */
  remove(id: string): void {
    this.springs.delete(id);
  }

  /**
   * Clear all springs
   */
  clear(): void {
    this.springs.clear();
  }
}

interface SpringState {
  value: number;
  velocity: number;
  target: number;
  tension: number;
  friction: number;
}

// =============================================================================
// COLLISION DETECTION
// =============================================================================

export interface CollisionBox {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export function detectCollisions(boxes: CollisionBox[]): Array<[string, string]> {
  const collisions: Array<[string, string]> = [];

  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i];
      const b = boxes[j];

      if (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
      ) {
        collisions.push([a.id, b.id]);
      }
    }
  }

  return collisions;
}

export function resolveCollision(
  stateA: PhysicsState,
  stateB: PhysicsState,
  restitution: number = 0.5
): void {
  // Simple elastic collision
  const dx = stateB.position.x - stateA.position.x;
  const dy = stateB.position.y - stateA.position.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance === 0) return;

  const nx = dx / distance;
  const ny = dy / distance;

  // Relative velocity
  const dvx = stateA.velocity.x - stateB.velocity.x;
  const dvy = stateA.velocity.y - stateB.velocity.y;

  // Relative velocity along normal
  const dvn = dvx * nx + dvy * ny;

  // Don't resolve if moving apart
  if (dvn > 0) return;

  // Calculate impulse
  const impulse = -(1 + restitution) * dvn / 2;

  // Apply impulse
  stateA.velocity.x += impulse * nx;
  stateA.velocity.y += impulse * ny;
  stateB.velocity.x -= impulse * nx;
  stateB.velocity.y -= impulse * ny;
}

// =============================================================================
// EXPORTS
// =============================================================================

export const physicsSimulator = new PhysicsSimulator();
export const springSystem = new SpringSystem();
