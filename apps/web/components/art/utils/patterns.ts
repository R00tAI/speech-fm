/**
 * Pattern generation utilities for algorithmic art
 * Inspired by iStock abstract line art styles:
 * - Flowing wave lines with smooth curves
 * - Topographic/contour line patterns
 * - Parallel line morphs
 * - Geometric precision patterns
 */

import { perlin2D, fbm, voronoi, phyllotaxis, roseCurve, superformula, createRandom, waves, spirals } from './noise'

export interface Point {
  x: number
  y: number
}

export interface PatternConfig {
  width: number
  height: number
  scale?: number
  seed?: number
  density?: number
  strokeWidth?: number
  colors?: string[]
}

// ============================================================================
// FLOWING WAVE LINES (iStock-style smooth curves)
// ============================================================================

/**
 * Generate smooth flowing wave lines - the signature iStock abstract style
 * Creates parallel curved lines that flow across the canvas
 */
export function flowingWaveLines(
  config: PatternConfig,
  lineCount: number = 30,
  amplitude: number = 40,
  frequency: number = 0.008,
  curvature: number = 0.5
): string[] {
  const { width, height, seed } = config
  const random = createRandom(seed)
  const paths: string[] = []

  const spacing = height / (lineCount + 1)

  for (let i = 0; i < lineCount; i++) {
    const baseY = spacing * (i + 1)
    const phaseOffset = random() * Math.PI * 2
    const amplitudeVariation = 0.5 + random() * 0.5

    const points: Point[] = []
    const step = 3

    for (let x = -20; x <= width + 20; x += step) {
      // Multiple sine waves combined for organic feel
      const wave1 = Math.sin(x * frequency + phaseOffset) * amplitude * amplitudeVariation
      const wave2 = Math.sin(x * frequency * 2.3 + phaseOffset * 1.5) * amplitude * 0.3 * amplitudeVariation
      const wave3 = Math.sin(x * frequency * 0.5 + phaseOffset * 0.7) * amplitude * 0.5 * amplitudeVariation

      // Add subtle noise for organic variation
      const noiseOffset = perlin2D(x * 0.01 + (seed || 0) * 0.1, i * 0.5) * amplitude * curvature * 0.3

      const y = baseY + wave1 + wave2 + wave3 + noiseOffset
      points.push({ x, y })
    }

    // Convert to smooth bezier curve
    paths.push(pointsToSmoothPath(points))
  }

  return paths
}

/**
 * Generate topographic/contour lines - elevation map style
 */
export function topographicLines(
  config: PatternConfig,
  levels: number = 15,
  noiseScale: number = 0.008,
  smoothness: number = 0.7
): string[] {
  const { width, height, seed } = config
  const paths: string[] = []
  const resolution = 4

  // Generate noise field
  const cols = Math.ceil(width / resolution) + 1
  const rows = Math.ceil(height / resolution) + 1
  const field: number[][] = []

  const offsetX = (seed || 0) * 0.1
  const offsetY = (seed || 0) * 0.2

  for (let y = 0; y < rows; y++) {
    field[y] = []
    for (let x = 0; x < cols; x++) {
      // Use FBM for organic contours
      field[y][x] = fbm(
        x * resolution * noiseScale + offsetX,
        y * resolution * noiseScale + offsetY,
        4, 2, 0.5
      )
    }
  }

  // Marching squares for each contour level
  for (let level = 0; level < levels; level++) {
    const threshold = -1 + (2 * (level + 0.5)) / levels
    const segments: [Point, Point][] = []

    for (let y = 0; y < rows - 1; y++) {
      for (let x = 0; x < cols - 1; x++) {
        const corners = [
          field[y][x],
          field[y][x + 1],
          field[y + 1][x + 1],
          field[y + 1][x]
        ]

        // Classify corners
        const caseIndex =
          (corners[0] > threshold ? 1 : 0) |
          (corners[1] > threshold ? 2 : 0) |
          (corners[2] > threshold ? 4 : 0) |
          (corners[3] > threshold ? 8 : 0)

        if (caseIndex === 0 || caseIndex === 15) continue

        // Linear interpolation for edge crossings
        const lerp = (a: number, b: number, t: number) => a + t * (b - a)
        const getT = (v1: number, v2: number) => {
          if (Math.abs(v2 - v1) < 0.0001) return 0.5
          return (threshold - v1) / (v2 - v1)
        }

        const px = x * resolution
        const py = y * resolution

        const edges: Point[] = []

        // Top edge
        if ((caseIndex & 1) !== ((caseIndex >> 1) & 1)) {
          const t = getT(corners[0], corners[1])
          edges.push({ x: lerp(px, px + resolution, t), y: py })
        }
        // Right edge
        if (((caseIndex >> 1) & 1) !== ((caseIndex >> 2) & 1)) {
          const t = getT(corners[1], corners[2])
          edges.push({ x: px + resolution, y: lerp(py, py + resolution, t) })
        }
        // Bottom edge
        if (((caseIndex >> 2) & 1) !== ((caseIndex >> 3) & 1)) {
          const t = getT(corners[3], corners[2])
          edges.push({ x: lerp(px, px + resolution, t), y: py + resolution })
        }
        // Left edge
        if (((caseIndex >> 3) & 1) !== (caseIndex & 1)) {
          const t = getT(corners[0], corners[3])
          edges.push({ x: px, y: lerp(py, py + resolution, t) })
        }

        if (edges.length >= 2) {
          segments.push([edges[0], edges[1]])
          if (edges.length === 4) {
            segments.push([edges[2], edges[3]])
          }
        }
      }
    }

    // Connect segments into continuous paths
    const connectedPaths = connectSegments(segments, resolution * 1.5)
    paths.push(...connectedPaths)
  }

  return paths
}

/**
 * Connect line segments into continuous paths
 */
function connectSegments(segments: [Point, Point][], threshold: number): string[] {
  if (segments.length === 0) return []

  const paths: string[] = []
  const used = new Set<number>()

  const distance = (p1: Point, p2: Point) =>
    Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2)

  for (let i = 0; i < segments.length; i++) {
    if (used.has(i)) continue

    const chain: Point[] = [segments[i][0], segments[i][1]]
    used.add(i)

    let extended = true
    while (extended) {
      extended = false

      for (let j = 0; j < segments.length; j++) {
        if (used.has(j)) continue

        const seg = segments[j]
        const chainStart = chain[0]
        const chainEnd = chain[chain.length - 1]

        if (distance(chainEnd, seg[0]) < threshold) {
          chain.push(seg[1])
          used.add(j)
          extended = true
        } else if (distance(chainEnd, seg[1]) < threshold) {
          chain.push(seg[0])
          used.add(j)
          extended = true
        } else if (distance(chainStart, seg[0]) < threshold) {
          chain.unshift(seg[1])
          used.add(j)
          extended = true
        } else if (distance(chainStart, seg[1]) < threshold) {
          chain.unshift(seg[0])
          used.add(j)
          extended = true
        }
      }
    }

    if (chain.length >= 3) {
      paths.push(pointsToSmoothPath(chain))
    }
  }

  return paths
}

/**
 * Convert points to smooth bezier path using Catmull-Rom splines
 */
function pointsToSmoothPath(points: Point[], tension: number = 0.3): string {
  if (points.length < 2) return ''
  if (points.length === 2) {
    return `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)} L ${points[1].x.toFixed(2)} ${points[1].y.toFixed(2)}`
  }

  let path = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[Math.min(points.length - 1, i + 2)]

    // Calculate control points
    const cp1x = p1.x + (p2.x - p0.x) * tension
    const cp1y = p1.y + (p2.y - p0.y) * tension
    const cp2x = p2.x - (p3.x - p1.x) * tension
    const cp2y = p2.y - (p3.y - p1.y) * tension

    path += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`
  }

  return path
}

// ============================================================================
// PARALLEL LINE MORPHS
// ============================================================================

/**
 * Generate parallel lines that morph/bend together
 */
export function parallelLineMorph(
  config: PatternConfig,
  lineCount: number = 40,
  bendPoints: number = 3,
  bendStrength: number = 100
): string[] {
  const { width, height, seed } = config
  const random = createRandom(seed)
  const paths: string[] = []

  // Generate shared bend control points
  const bends: { x: number; direction: number; strength: number }[] = []
  for (let i = 0; i < bendPoints; i++) {
    bends.push({
      x: (width / (bendPoints + 1)) * (i + 1) + (random() - 0.5) * 50,
      direction: (random() - 0.5) * 2,
      strength: bendStrength * (0.5 + random() * 0.5)
    })
  }

  const spacing = height / (lineCount + 1)

  for (let i = 0; i < lineCount; i++) {
    const baseY = spacing * (i + 1)
    const points: Point[] = []
    const step = 5

    for (let x = 0; x <= width; x += step) {
      let yOffset = 0

      // Apply each bend influence
      for (const bend of bends) {
        const dist = Math.abs(x - bend.x)
        const influence = Math.exp(-dist * dist / (10000))
        yOffset += bend.direction * bend.strength * influence
      }

      // Add subtle per-line variation
      const lineVariation = perlin2D(x * 0.005 + i * 0.3, (seed || 0) * 0.1) * 20

      points.push({ x, y: baseY + yOffset + lineVariation })
    }

    paths.push(pointsToSmoothPath(points))
  }

  return paths
}

/**
 * Generate flow field particle paths - more organic and varied
 */
export function flowFieldPaths(
  config: PatternConfig,
  particleCount: number = 100,
  pathLength: number = 80,
  noiseScale: number = 0.003
): string[] {
  const { width, height, seed } = config
  const random = createRandom(seed)
  const paths: string[] = []

  for (let i = 0; i < particleCount; i++) {
    let x = random() * width
    let y = random() * height
    const points: Point[] = [{ x, y }]

    const stepSize = 3

    for (let j = 0; j < pathLength; j++) {
      const angle = perlin2D(
        x * noiseScale + (seed || 0) * 0.1,
        y * noiseScale
      ) * Math.PI * 4

      x += Math.cos(angle) * stepSize
      y += Math.sin(angle) * stepSize

      // Keep within bounds with soft wrapping
      if (x < -50 || x > width + 50 || y < -50 || y > height + 50) break

      points.push({ x, y })
    }

    if (points.length > 10) {
      paths.push(pointsToSmoothPath(points, 0.2))
    }
  }

  return paths
}

// ============================================================================
// CONCENTRIC AND RADIAL PATTERNS
// ============================================================================

/**
 * Generate concentric wave patterns from center
 */
export function concentricWaves(
  config: PatternConfig,
  waveCount: number = 20,
  waveType: keyof typeof waves = 'sine',
  amplitude: number = 15,
  frequency: number = 0.08
): string[] {
  const { width, height, seed } = config
  const random = createRandom(seed)
  const centerX = width / 2
  const centerY = height / 2
  const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY) * 1.2

  const paths: string[] = []
  const waveFunc = waves[waveType]

  for (let w = 1; w <= waveCount; w++) {
    const baseRadius = (w / waveCount) * maxRadius
    const phaseOffset = random() * Math.PI * 2
    const points: Point[] = []

    const angleStep = 0.03

    for (let angle = 0; angle <= Math.PI * 2 + angleStep; angle += angleStep) {
      const waveOffset = waveFunc(angle * 8 + phaseOffset, 1, amplitude * (0.5 + w / waveCount * 0.5))
      const noiseOffset = perlin2D(
        Math.cos(angle) * 5 + (seed || 0) * 0.1,
        Math.sin(angle) * 5 + w * 0.2
      ) * amplitude * 0.3

      const radius = baseRadius + waveOffset + noiseOffset

      points.push({
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      })
    }

    paths.push(pointsToSmoothPath(points, 0.2))
  }

  return paths
}

/**
 * Generate parallel wave lines (horizontal or vertical)
 */
export function parallelWaves(
  config: PatternConfig,
  lineCount: number = 30,
  waveAmplitude: number = 25,
  waveFrequency: number = 0.015,
  direction: 'horizontal' | 'vertical' = 'horizontal'
): string[] {
  const { width, height, seed } = config
  const random = createRandom(seed)
  const paths: string[] = []

  const spacing = (direction === 'horizontal' ? height : width) / (lineCount + 1)

  for (let i = 0; i < lineCount; i++) {
    const offset = random() * Math.PI * 2
    const ampVariation = 0.7 + random() * 0.6
    const freqVariation = 0.8 + random() * 0.4
    const points: Point[] = []

    if (direction === 'horizontal') {
      const baseY = spacing * (i + 1)
      for (let x = -10; x <= width + 10; x += 4) {
        const wave1 = Math.sin(x * waveFrequency * freqVariation + offset) * waveAmplitude * ampVariation
        const wave2 = Math.sin(x * waveFrequency * 2.1 + offset * 1.3) * waveAmplitude * 0.3
        const y = baseY + wave1 + wave2
        points.push({ x, y })
      }
    } else {
      const baseX = spacing * (i + 1)
      for (let y = -10; y <= height + 10; y += 4) {
        const wave1 = Math.sin(y * waveFrequency * freqVariation + offset) * waveAmplitude * ampVariation
        const wave2 = Math.sin(y * waveFrequency * 2.1 + offset * 1.3) * waveAmplitude * 0.3
        const x = baseX + wave1 + wave2
        points.push({ x, y })
      }
    }

    paths.push(pointsToSmoothPath(points))
  }

  return paths
}

// ============================================================================
// GEOMETRIC PATTERNS
// ============================================================================

/**
 * Generate geometric grid patterns with various shapes
 */
export function geometricGrid(
  config: PatternConfig,
  cellSize: number = 50,
  pattern: 'squares' | 'circles' | 'triangles' | 'hexagons' | 'diamonds' = 'squares',
  fillProbability: number = 0.6
): string[] {
  const { width, height, seed } = config
  const random = createRandom(seed)
  const paths: string[] = []

  const cols = Math.ceil(width / cellSize) + 1
  const rows = Math.ceil(height / cellSize) + 1

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (random() > fillProbability) continue

      const x = col * cellSize
      const y = row * cellSize
      const size = cellSize * (0.3 + random() * 0.5)
      const cx = x + cellSize / 2
      const cy = y + cellSize / 2

      switch (pattern) {
        case 'squares': {
          const half = size / 2
          paths.push(`M ${cx - half} ${cy - half} L ${cx + half} ${cy - half} L ${cx + half} ${cy + half} L ${cx - half} ${cy + half} Z`)
          break
        }

        case 'circles': {
          const r = size / 2
          paths.push(`M ${cx + r} ${cy} A ${r} ${r} 0 1 1 ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy}`)
          break
        }

        case 'triangles': {
          const h = size * 0.866
          paths.push(`M ${cx} ${cy - h/2} L ${cx + size/2} ${cy + h/2} L ${cx - size/2} ${cy + h/2} Z`)
          break
        }

        case 'hexagons': {
          const r = size / 2
          let hexPath = ''
          for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i - Math.PI / 6
            const px = cx + r * Math.cos(angle)
            const py = cy + r * Math.sin(angle)
            hexPath += i === 0 ? `M ${px.toFixed(2)} ${py.toFixed(2)}` : ` L ${px.toFixed(2)} ${py.toFixed(2)}`
          }
          paths.push(hexPath + ' Z')
          break
        }

        case 'diamonds': {
          const half = size / 2
          paths.push(`M ${cx} ${cy - half} L ${cx + half} ${cy} L ${cx} ${cy + half} L ${cx - half} ${cy} Z`)
          break
        }
      }
    }
  }

  return paths
}

/**
 * Generate spiral patterns
 */
export function spiralPattern(
  config: PatternConfig,
  spiralType: keyof typeof spirals = 'archimedean',
  turns: number = 12,
  spacing: number = 8
): string {
  const { width, height } = config
  const centerX = width / 2
  const centerY = height / 2
  const spiralFunc = spirals[spiralType]

  const points: Point[] = []
  const maxTheta = turns * Math.PI * 2
  const step = 0.05

  for (let theta = 0.1; theta <= maxTheta; theta += step) {
    const r = spiralFunc(theta, 0, spacing)
    const x = centerX + r * Math.cos(theta)
    const y = centerY + r * Math.sin(theta)

    if (x >= -50 && x <= width + 50 && y >= -50 && y <= height + 50) {
      points.push({ x, y })
    }
  }

  return pointsToSmoothPath(points, 0.15)
}

/**
 * Generate phyllotaxis (sunflower) pattern points
 */
export function phyllotaxisPattern(
  config: PatternConfig,
  pointCount: number = 500,
  scaleFactor: number = 5
): { x: number; y: number; size: number; index: number }[] {
  const { width, height } = config
  const centerX = width / 2
  const centerY = height / 2
  const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5))

  const points: { x: number; y: number; size: number; index: number }[] = []

  for (let i = 1; i <= pointCount; i++) {
    const angle = i * GOLDEN_ANGLE
    const radius = scaleFactor * Math.sqrt(i)

    const x = centerX + radius * Math.cos(angle)
    const y = centerY + radius * Math.sin(angle)

    if (x >= -10 && x <= width + 10 && y >= -10 && y <= height + 10) {
      points.push({
        x,
        y,
        size: 2 + Math.sqrt(i) * 0.15,
        index: i,
      })
    }
  }

  return points
}

/**
 * Generate rose curve patterns
 */
export function rosePattern(config: PatternConfig, k: number = 5, petals: number = 1): string {
  const { width, height } = config
  const centerX = width / 2
  const centerY = height / 2
  const size = Math.min(width, height) * 0.4

  const points: Point[] = []
  const maxTheta = k % 1 === 0 ? (k % 2 === 0 ? 2 * Math.PI : Math.PI) * petals : Math.PI * 20
  const step = 0.02

  for (let theta = 0; theta <= maxTheta; theta += step) {
    const { x, y } = roseCurve(theta, k, size)
    points.push({ x: centerX + x, y: centerY + y })
  }

  return pointsToSmoothPath(points, 0.1)
}

/**
 * Generate superformula shape
 */
export function superformulaShape(
  config: PatternConfig,
  m: number = 6,
  n1: number = 1,
  n2: number = 1,
  n3: number = 1
): string {
  const { width, height } = config
  const centerX = width / 2
  const centerY = height / 2
  const size = Math.min(width, height) * 0.35

  const points: Point[] = []
  const step = 0.02

  for (let theta = 0; theta <= Math.PI * 2 + step; theta += step) {
    const r = superformula(theta, 1, 1, m, n1, n2, n3) * size
    points.push({
      x: centerX + r * Math.cos(theta),
      y: centerY + r * Math.sin(theta)
    })
  }

  return pointsToSmoothPath(points, 0.15)
}

// ============================================================================
// HATCHING AND LINE FILLS
// ============================================================================

/**
 * Generate hatching/crosshatch patterns
 */
export function hatchingPattern(
  config: PatternConfig,
  spacing: number = 8,
  angle: number = 45,
  crosshatch: boolean = false
): string[] {
  const { width, height } = config
  const paths: string[] = []

  const diagonal = Math.sqrt(width * width + height * height)
  const radians = (angle * Math.PI) / 180

  const generateLines = (angleRad: number) => {
    const cos = Math.cos(angleRad)
    const sin = Math.sin(angleRad)
    const lineCount = Math.ceil(diagonal / spacing) * 2

    for (let i = -lineCount; i <= lineCount; i++) {
      const offset = i * spacing

      // Line perpendicular to angle
      const x1 = -diagonal
      const y1 = offset
      const x2 = diagonal
      const y2 = offset

      // Rotate around center
      const cx = width / 2
      const cy = height / 2

      const rx1 = cos * (x1) - sin * (y1) + cx
      const ry1 = sin * (x1) + cos * (y1) + cy
      const rx2 = cos * (x2) - sin * (y2) + cx
      const ry2 = sin * (x2) + cos * (y2) + cy

      paths.push(`M ${rx1.toFixed(2)} ${ry1.toFixed(2)} L ${rx2.toFixed(2)} ${ry2.toFixed(2)}`)
    }
  }

  generateLines(radians)
  if (crosshatch) {
    generateLines(radians + Math.PI / 2)
  }

  return paths
}

/**
 * Generate contour lines using marching squares
 */
export function contourLines(config: PatternConfig, levels: number = 12, noiseScale: number = 0.008): string[] {
  return topographicLines(config, levels, noiseScale)
}

/**
 * Generate dot patterns with various distributions
 */
export function dotPattern(
  config: PatternConfig,
  distribution: 'grid' | 'random' | 'halftone' | 'phyllotaxis' = 'grid',
  dotCount: number = 500
): { x: number; y: number; size: number }[] {
  const { width, height, seed } = config
  const random = createRandom(seed)
  const dots: { x: number; y: number; size: number }[] = []

  switch (distribution) {
    case 'grid': {
      const spacing = Math.sqrt((width * height) / dotCount)
      for (let y = spacing / 2; y < height; y += spacing) {
        for (let x = spacing / 2; x < width; x += spacing) {
          dots.push({ x, y, size: 2 + random() * 2 })
        }
      }
      break
    }

    case 'random': {
      for (let i = 0; i < dotCount; i++) {
        dots.push({
          x: random() * width,
          y: random() * height,
          size: 2 + random() * 4,
        })
      }
      break
    }

    case 'halftone': {
      const spacing = Math.sqrt((width * height) / dotCount)
      for (let y = spacing / 2; y < height; y += spacing) {
        for (let x = spacing / 2; x < width; x += spacing) {
          const noise = (fbm(x * 0.01, y * 0.01) + 1) / 2
          const size = noise * spacing * 0.7
          if (size > 1) {
            dots.push({ x, y, size })
          }
        }
      }
      break
    }

    case 'phyllotaxis': {
      const points = phyllotaxisPattern(config, dotCount)
      points.forEach((p) => dots.push({ x: p.x, y: p.y, size: p.size }))
      break
    }
  }

  return dots
}

/**
 * Generate maze-like diagonal patterns
 */
export function mazePattern(config: PatternConfig, cellSize: number = 20): string[] {
  const { width, height, seed } = config
  const random = createRandom(seed)
  const paths: string[] = []

  const cols = Math.ceil(width / cellSize)
  const rows = Math.ceil(height / cellSize)

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * cellSize
      const y = row * cellSize

      if (random() > 0.5) {
        paths.push(`M ${x} ${y} L ${x + cellSize} ${y + cellSize}`)
      } else {
        paths.push(`M ${x + cellSize} ${y} L ${x} ${y + cellSize}`)
      }
    }
  }

  return paths
}

/**
 * Generate truchet tile patterns with curved arcs
 */
export function truchetPattern(config: PatternConfig, tileSize: number = 40): string[] {
  const { width, height, seed } = config
  const random = createRandom(seed)
  const paths: string[] = []

  const cols = Math.ceil(width / tileSize)
  const rows = Math.ceil(height / tileSize)
  const r = tileSize / 2

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * tileSize
      const y = row * tileSize

      if (random() > 0.5) {
        // Arcs connecting top-left to right-bottom
        paths.push(`M ${x} ${y + r} A ${r} ${r} 0 0 1 ${x + r} ${y}`)
        paths.push(`M ${x + tileSize} ${y + r} A ${r} ${r} 0 0 1 ${x + r} ${y + tileSize}`)
      } else {
        // Arcs connecting left-bottom to top-right
        paths.push(`M ${x} ${y + r} A ${r} ${r} 0 0 0 ${x + r} ${y + tileSize}`)
        paths.push(`M ${x + tileSize} ${y + r} A ${r} ${r} 0 0 0 ${x + r} ${y}`)
      }
    }
  }

  return paths
}

// ============================================================================
// WIREFRAME AND 3D EFFECT PATTERNS
// ============================================================================

/**
 * Generate wireframe grid with perspective distortion
 */
export function wireframeGrid(
  config: PatternConfig,
  gridSize: number = 20,
  perspectiveStrength: number = 0.5,
  waveHeight: number = 50
): string[] {
  const { width, height, seed } = config
  const paths: string[] = []

  const cols = Math.ceil(width / gridSize)
  const rows = Math.ceil(height / gridSize)
  const centerX = width / 2

  // Horizontal lines with wave distortion
  for (let row = 0; row <= rows; row++) {
    const points: Point[] = []
    const baseY = row * gridSize
    const perspectiveFactor = 1 - (baseY / height) * perspectiveStrength * 0.5

    for (let col = 0; col <= cols; col++) {
      const x = col * gridSize
      const distFromCenter = Math.abs(x - centerX) / centerX

      // Apply wave and perspective
      const wave = perlin2D(x * 0.01 + (seed || 0) * 0.1, row * 0.2) * waveHeight * (1 - row / rows)
      const y = baseY + wave

      points.push({ x, y })
    }

    paths.push(pointsToSmoothPath(points, 0.2))
  }

  // Vertical lines
  for (let col = 0; col <= cols; col++) {
    const points: Point[] = []
    const baseX = col * gridSize

    for (let row = 0; row <= rows; row++) {
      const y = row * gridSize
      const wave = perlin2D(col * 0.2 + (seed || 0) * 0.1, y * 0.01) * waveHeight * (1 - row / rows)

      points.push({ x: baseX, y: y + wave })
    }

    paths.push(pointsToSmoothPath(points, 0.2))
  }

  return paths
}

/**
 * Generate layered wave bands
 */
export function layeredWaveBands(
  config: PatternConfig,
  bandCount: number = 8,
  amplitude: number = 30,
  frequency: number = 0.01
): { path: string; fillPath: string }[] {
  const { width, height, seed } = config
  const random = createRandom(seed)
  const bands: { path: string; fillPath: string }[] = []

  const bandHeight = height / bandCount

  for (let i = 0; i < bandCount; i++) {
    const baseY = height - (i + 1) * bandHeight
    const phaseOffset = random() * Math.PI * 2
    const ampVariation = 0.7 + random() * 0.6

    const topPoints: Point[] = []
    const bottomPoints: Point[] = []

    for (let x = -10; x <= width + 10; x += 5) {
      const wave = Math.sin(x * frequency + phaseOffset) * amplitude * ampVariation
      const noise = perlin2D(x * 0.005 + i * 0.5, (seed || 0) * 0.1) * amplitude * 0.3

      topPoints.push({ x, y: baseY + wave + noise })
      bottomPoints.push({ x, y: baseY + bandHeight + wave * 0.5 + noise * 0.5 })
    }

    const topPath = pointsToSmoothPath(topPoints)

    // Create fill path (closed shape)
    const fillPath = topPath +
      ` L ${width + 10} ${height + 10} L -10 ${height + 10} Z`

    bands.push({ path: topPath, fillPath })
  }

  return bands
}
