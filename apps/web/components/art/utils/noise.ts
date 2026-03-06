/**
 * Mathematical utilities for algorithmic art generation
 * Includes Perlin noise, simplex noise approximations, and wave functions
 */

// Permutation table for Perlin noise
const permutation = Array.from({ length: 256 }, (_, i) => i)
for (let i = 255; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1))
  ;[permutation[i], permutation[j]] = [permutation[j], permutation[i]]
}
const p = [...permutation, ...permutation]

function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10)
}

function lerp(a: number, b: number, t: number): number {
  return a + t * (b - a)
}

function grad(hash: number, x: number, y: number): number {
  const h = hash & 3
  const u = h < 2 ? x : y
  const v = h < 2 ? y : x
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v)
}

/**
 * 2D Perlin noise implementation
 */
export function perlin2D(x: number, y: number): number {
  const X = Math.floor(x) & 255
  const Y = Math.floor(y) & 255

  x -= Math.floor(x)
  y -= Math.floor(y)

  const u = fade(x)
  const v = fade(y)

  const A = p[X] + Y
  const B = p[X + 1] + Y

  return lerp(
    lerp(grad(p[A], x, y), grad(p[B], x - 1, y), u),
    lerp(grad(p[A + 1], x, y - 1), grad(p[B + 1], x - 1, y - 1), u),
    v
  )
}

/**
 * Fractal Brownian Motion - layered Perlin noise
 */
export function fbm(
  x: number,
  y: number,
  octaves: number = 4,
  lacunarity: number = 2,
  persistence: number = 0.5
): number {
  let value = 0
  let amplitude = 1
  let frequency = 1
  let maxValue = 0

  for (let i = 0; i < octaves; i++) {
    value += amplitude * perlin2D(x * frequency, y * frequency)
    maxValue += amplitude
    amplitude *= persistence
    frequency *= lacunarity
  }

  return value / maxValue
}

/**
 * Turbulence - absolute value of layered noise
 */
export function turbulence(
  x: number,
  y: number,
  octaves: number = 4,
  lacunarity: number = 2,
  persistence: number = 0.5
): number {
  let value = 0
  let amplitude = 1
  let frequency = 1
  let maxValue = 0

  for (let i = 0; i < octaves; i++) {
    value += amplitude * Math.abs(perlin2D(x * frequency, y * frequency))
    maxValue += amplitude
    amplitude *= persistence
    frequency *= lacunarity
  }

  return value / maxValue
}

/**
 * Ridge noise - inverted turbulence for mountain-like patterns
 */
export function ridgeNoise(
  x: number,
  y: number,
  octaves: number = 4,
  lacunarity: number = 2,
  persistence: number = 0.5,
  offset: number = 1
): number {
  let value = 0
  let amplitude = 1
  let frequency = 1
  let maxValue = 0

  for (let i = 0; i < octaves; i++) {
    let n = perlin2D(x * frequency, y * frequency)
    n = offset - Math.abs(n)
    n = n * n
    value += amplitude * n
    maxValue += amplitude
    amplitude *= persistence
    frequency *= lacunarity
  }

  return value / maxValue
}

/**
 * Voronoi/Worley noise
 */
export function voronoi(
  x: number,
  y: number,
  cellSize: number = 1,
  seed: number = 12345
): { distance: number; cellX: number; cellY: number } {
  const cellX = Math.floor(x / cellSize)
  const cellY = Math.floor(y / cellSize)

  let minDist = Infinity
  let closestCellX = 0
  let closestCellY = 0

  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      const neighborX = cellX + i
      const neighborY = cellY + j

      // Random point within cell using hash
      const hash = (neighborX * 374761393 + neighborY * 668265263 + seed) ^ (seed * 1013904223)
      const randX = ((hash & 0xffff) / 0xffff) * cellSize
      const randY = (((hash >> 16) & 0xffff) / 0xffff) * cellSize

      const pointX = neighborX * cellSize + randX
      const pointY = neighborY * cellSize + randY

      const dist = Math.sqrt((x - pointX) ** 2 + (y - pointY) ** 2)

      if (dist < minDist) {
        minDist = dist
        closestCellX = neighborX
        closestCellY = neighborY
      }
    }
  }

  return { distance: minDist, cellX: closestCellX, cellY: closestCellY }
}

/**
 * Wave functions
 */
export const waves = {
  sine: (x: number, frequency: number = 1, amplitude: number = 1, phase: number = 0) =>
    amplitude * Math.sin(x * frequency + phase),

  cosine: (x: number, frequency: number = 1, amplitude: number = 1, phase: number = 0) =>
    amplitude * Math.cos(x * frequency + phase),

  sawtooth: (x: number, frequency: number = 1, amplitude: number = 1, phase: number = 0) => {
    const t = ((x * frequency + phase) / (2 * Math.PI)) % 1
    return amplitude * (2 * t - 1)
  },

  triangle: (x: number, frequency: number = 1, amplitude: number = 1, phase: number = 0) => {
    const t = ((x * frequency + phase) / (2 * Math.PI)) % 1
    return amplitude * (4 * Math.abs(t - 0.5) - 1)
  },

  square: (x: number, frequency: number = 1, amplitude: number = 1, phase: number = 0) =>
    amplitude * (Math.sin(x * frequency + phase) >= 0 ? 1 : -1),

  pulse: (x: number, frequency: number = 1, amplitude: number = 1, phase: number = 0, duty: number = 0.5) => {
    const t = ((x * frequency + phase) / (2 * Math.PI)) % 1
    return amplitude * (t < duty ? 1 : -1)
  },
}

/**
 * Spiral functions
 */
export const spirals = {
  archimedean: (theta: number, a: number = 0, b: number = 1) => a + b * theta,

  logarithmic: (theta: number, a: number = 1, b: number = 0.1) => a * Math.exp(b * theta),

  fermat: (theta: number, a: number = 1) => a * Math.sqrt(theta),

  hyperbolic: (theta: number, a: number = 1) => a / theta,

  lituus: (theta: number, a: number = 1) => a / Math.sqrt(theta),
}

/**
 * Lissajous curves
 */
export function lissajous(
  t: number,
  a: number = 1,
  b: number = 1,
  freqX: number = 3,
  freqY: number = 2,
  phaseX: number = 0,
  phaseY: number = Math.PI / 2
): { x: number; y: number } {
  return {
    x: a * Math.sin(freqX * t + phaseX),
    y: b * Math.sin(freqY * t + phaseY),
  }
}

/**
 * Rose curve (rhodonea)
 */
export function roseCurve(theta: number, k: number = 5, a: number = 1): { x: number; y: number } {
  const r = a * Math.cos(k * theta)
  return {
    x: r * Math.cos(theta),
    y: r * Math.sin(theta),
  }
}

/**
 * Superformula - generalized shape formula
 */
export function superformula(
  theta: number,
  a: number = 1,
  b: number = 1,
  m: number = 6,
  n1: number = 1,
  n2: number = 1,
  n3: number = 1
): number {
  const part1 = Math.pow(Math.abs(Math.cos((m * theta) / 4) / a), n2)
  const part2 = Math.pow(Math.abs(Math.sin((m * theta) / 4) / b), n3)
  return Math.pow(part1 + part2, -1 / n1)
}

/**
 * Map value from one range to another
 */
export function mapRange(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin
}

/**
 * Clamp value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * Smooth step interpolation
 */
export function smoothStep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}

/**
 * Smoother step interpolation (Ken Perlin's improved version)
 */
export function smootherStep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1)
  return t * t * t * (t * (t * 6 - 15) + 10)
}

/**
 * Distance functions
 */
export const distance = {
  euclidean: (x1: number, y1: number, x2: number, y2: number) => Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2),

  manhattan: (x1: number, y1: number, x2: number, y2: number) => Math.abs(x2 - x1) + Math.abs(y2 - y1),

  chebyshev: (x1: number, y1: number, x2: number, y2: number) => Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)),

  minkowski: (x1: number, y1: number, x2: number, y2: number, p: number = 3) =>
    Math.pow(Math.pow(Math.abs(x2 - x1), p) + Math.pow(Math.abs(y2 - y1), p), 1 / p),
}

/**
 * Golden ratio and Fibonacci
 */
export const PHI = (1 + Math.sqrt(5)) / 2
export const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5))

export function fibonacci(n: number): number {
  if (n <= 1) return n
  let a = 0,
    b = 1
  for (let i = 2; i <= n; i++) {
    const c = a + b
    a = b
    b = c
  }
  return b
}

/**
 * Phyllotaxis pattern (sunflower spiral)
 */
export function phyllotaxis(
  index: number,
  scaleFactor: number = 5
): { x: number; y: number; angle: number; radius: number } {
  const angle = index * GOLDEN_ANGLE
  const radius = scaleFactor * Math.sqrt(index)
  return {
    x: radius * Math.cos(angle),
    y: radius * Math.sin(angle),
    angle,
    radius,
  }
}

/**
 * Create a seeded random number generator
 */
export function createRandom(seed: number = Date.now()) {
  let s = seed
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
}

/**
 * Generate random color in HSL
 */
export function randomHSL(random: () => number = Math.random): { h: number; s: number; l: number } {
  return {
    h: random() * 360,
    s: 50 + random() * 50,
    l: 40 + random() * 30,
  }
}
