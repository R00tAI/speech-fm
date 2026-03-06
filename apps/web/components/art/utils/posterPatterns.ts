/**
 * Poster Pattern Generators - Swiss/Bauhaus Style
 *
 * Inspired by iStock geometric poster designs featuring:
 * - Bold geometric shapes (diamonds, circles, triangles)
 * - Mandalas and radial symmetry
 * - High contrast black/white patterns
 * - Simple symbolic shapes
 * - Grid-based layouts
 */

export interface PosterPatternConfig {
  width: number
  height: number
  seed?: number
}

// Seeded random number generator
function seededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
}

// ============================================================================
// MANDALA PATTERNS
// ============================================================================

/**
 * Generate a mandala pattern with radial symmetry
 */
export function mandalaPattern(
  config: PosterPatternConfig,
  segments: number = 8,
  layers: number = 5,
  style: 'pointed' | 'rounded' | 'geometric' = 'pointed'
): string[] {
  const { width, height, seed = 12345 } = config
  const random = seededRandom(seed)
  const cx = width / 2
  const cy = height / 2
  const maxRadius = Math.min(width, height) * 0.45
  const paths: string[] = []

  for (let layer = 1; layer <= layers; layer++) {
    const radius = (maxRadius / layers) * layer
    const innerRadius = (maxRadius / layers) * (layer - 1) * 0.8
    const angleStep = (Math.PI * 2) / segments

    // Create petal shapes for each segment
    for (let i = 0; i < segments; i++) {
      const angle = angleStep * i - Math.PI / 2
      const nextAngle = angleStep * (i + 1) - Math.PI / 2
      const midAngle = (angle + nextAngle) / 2

      if (style === 'pointed') {
        // Pointed petal
        const tip = {
          x: cx + Math.cos(midAngle) * radius,
          y: cy + Math.sin(midAngle) * radius
        }
        const base1 = {
          x: cx + Math.cos(angle + angleStep * 0.15) * innerRadius,
          y: cy + Math.sin(angle + angleStep * 0.15) * innerRadius
        }
        const base2 = {
          x: cx + Math.cos(nextAngle - angleStep * 0.15) * innerRadius,
          y: cy + Math.sin(nextAngle - angleStep * 0.15) * innerRadius
        }
        paths.push(`M ${base1.x} ${base1.y} Q ${tip.x} ${tip.y} ${base2.x} ${base2.y}`)
      } else if (style === 'rounded') {
        // Rounded petal
        const r = radius * 0.3
        const petalCx = cx + Math.cos(midAngle) * (radius - r)
        const petalCy = cy + Math.sin(midAngle) * (radius - r)
        paths.push(`M ${petalCx} ${petalCy} m -${r} 0 a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 -${r * 2} 0`)
      } else {
        // Geometric triangles
        const tip = {
          x: cx + Math.cos(midAngle) * radius,
          y: cy + Math.sin(midAngle) * radius
        }
        const base1 = {
          x: cx + Math.cos(angle + angleStep * 0.2) * innerRadius,
          y: cy + Math.sin(angle + angleStep * 0.2) * innerRadius
        }
        const base2 = {
          x: cx + Math.cos(nextAngle - angleStep * 0.2) * innerRadius,
          y: cy + Math.sin(nextAngle - angleStep * 0.2) * innerRadius
        }
        paths.push(`M ${tip.x} ${tip.y} L ${base1.x} ${base1.y} L ${base2.x} ${base2.y} Z`)
      }
    }

    // Add decorative circles
    if (layer > 1 && random() > 0.3) {
      const dotRadius = radius * 0.08
      for (let i = 0; i < segments; i++) {
        const angle = angleStep * i + angleStep / 2 - Math.PI / 2
        const dotX = cx + Math.cos(angle) * (radius * 0.7)
        const dotY = cy + Math.sin(angle) * (radius * 0.7)
        paths.push(`M ${dotX} ${dotY} m -${dotRadius} 0 a ${dotRadius} ${dotRadius} 0 1 0 ${dotRadius * 2} 0 a ${dotRadius} ${dotRadius} 0 1 0 -${dotRadius * 2} 0`)
      }
    }
  }

  // Center circle
  const centerRadius = maxRadius * 0.1
  paths.push(`M ${cx} ${cy} m -${centerRadius} 0 a ${centerRadius} ${centerRadius} 0 1 0 ${centerRadius * 2} 0 a ${centerRadius} ${centerRadius} 0 1 0 -${centerRadius * 2} 0`)

  return paths
}

// ============================================================================
// DIAMOND PATTERNS
// ============================================================================

/**
 * Diamond with inner shape
 */
export function diamondPattern(
  config: PosterPatternConfig,
  innerShape: 'square' | 'circle' | 'diamond' | 'none' = 'square'
): string[] {
  const { width, height } = config
  const cx = width / 2
  const cy = height / 2
  const size = Math.min(width, height) * 0.4
  const paths: string[] = []

  // Outer diamond
  paths.push(`M ${cx} ${cy - size} L ${cx + size} ${cy} L ${cx} ${cy + size} L ${cx - size} ${cy} Z`)

  // Inner shape
  const innerSize = size * 0.45
  switch (innerShape) {
    case 'square':
      paths.push(`M ${cx - innerSize} ${cy - innerSize} L ${cx + innerSize} ${cy - innerSize} L ${cx + innerSize} ${cy + innerSize} L ${cx - innerSize} ${cy + innerSize} Z`)
      break
    case 'circle':
      paths.push(`M ${cx} ${cy} m -${innerSize} 0 a ${innerSize} ${innerSize} 0 1 0 ${innerSize * 2} 0 a ${innerSize} ${innerSize} 0 1 0 -${innerSize * 2} 0`)
      break
    case 'diamond':
      const s = innerSize * 0.7
      paths.push(`M ${cx} ${cy - s} L ${cx + s} ${cy} L ${cx} ${cy + s} L ${cx - s} ${cy} Z`)
      break
  }

  return paths
}

// ============================================================================
// INTERLOCKING CIRCLES
// ============================================================================

/**
 * Overlapping/interlocking circle pattern
 */
export function interlockingCircles(
  config: PosterPatternConfig,
  count: number = 4,
  style: 'overlap' | 'chain' | 'olympic' = 'overlap'
): string[] {
  const { width, height, seed = 12345 } = config
  const cx = width / 2
  const cy = height / 2
  const paths: string[] = []

  if (style === 'overlap') {
    // Simple overlapping circles like the 8-shape
    const radius = Math.min(width, height) * 0.25
    const offset = radius * 0.7

    // Top circles
    paths.push(`M ${cx - offset} ${cy - offset} m -${radius} 0 a ${radius} ${radius} 0 1 0 ${radius * 2} 0 a ${radius} ${radius} 0 1 0 -${radius * 2} 0`)
    paths.push(`M ${cx + offset} ${cy - offset} m -${radius} 0 a ${radius} ${radius} 0 1 0 ${radius * 2} 0 a ${radius} ${radius} 0 1 0 -${radius * 2} 0`)
    // Bottom circles
    paths.push(`M ${cx - offset} ${cy + offset} m -${radius} 0 a ${radius} ${radius} 0 1 0 ${radius * 2} 0 a ${radius} ${radius} 0 1 0 -${radius * 2} 0`)
    paths.push(`M ${cx + offset} ${cy + offset} m -${radius} 0 a ${radius} ${radius} 0 1 0 ${radius * 2} 0 a ${radius} ${radius} 0 1 0 -${radius * 2} 0`)
  } else if (style === 'chain') {
    // Horizontal chain of circles
    const radius = Math.min(width, height) * 0.15
    const spacing = radius * 1.5
    const startX = cx - spacing * ((count - 1) / 2)

    for (let i = 0; i < count; i++) {
      const x = startX + i * spacing
      paths.push(`M ${x} ${cy} m -${radius} 0 a ${radius} ${radius} 0 1 0 ${radius * 2} 0 a ${radius} ${radius} 0 1 0 -${radius * 2} 0`)
    }
  } else {
    // Olympic rings style
    const radius = Math.min(width, height) * 0.12
    const hSpacing = radius * 2.2
    const vSpacing = radius * 1.1

    // Top row
    for (let i = 0; i < 3; i++) {
      const x = cx + (i - 1) * hSpacing
      paths.push(`M ${x} ${cy - vSpacing / 2} m -${radius} 0 a ${radius} ${radius} 0 1 0 ${radius * 2} 0 a ${radius} ${radius} 0 1 0 -${radius * 2} 0`)
    }
    // Bottom row
    for (let i = 0; i < 2; i++) {
      const x = cx + (i - 0.5) * hSpacing
      paths.push(`M ${x} ${cy + vSpacing / 2} m -${radius} 0 a ${radius} ${radius} 0 1 0 ${radius * 2} 0 a ${radius} ${radius} 0 1 0 -${radius * 2} 0`)
    }
  }

  return paths
}

// ============================================================================
// CHEVRON / ZIGZAG
// ============================================================================

/**
 * Zigzag or chevron pattern
 */
export function chevronPattern(
  config: PosterPatternConfig,
  rows: number = 3,
  direction: 'right' | 'left' | 'up' | 'down' = 'right'
): string[] {
  const { width, height } = config
  const paths: string[] = []
  const amplitude = height / (rows * 2)
  const thickness = amplitude * 0.8

  for (let i = 0; i < rows; i++) {
    const y = (height / rows) * (i + 0.5)

    if (direction === 'right' || direction === 'left') {
      const mult = direction === 'right' ? 1 : -1
      const startX = direction === 'right' ? 0 : width
      const endX = direction === 'right' ? width : 0

      // Create zigzag triangles
      const triWidth = width / 3
      paths.push(`M ${startX} ${y - amplitude} L ${startX + triWidth * mult} ${y} L ${startX} ${y + amplitude} Z`)
      paths.push(`M ${startX + triWidth * mult} ${y - amplitude} L ${startX + triWidth * 2 * mult} ${y} L ${startX + triWidth * mult} ${y + amplitude} Z`)
      paths.push(`M ${startX + triWidth * 2 * mult} ${y - amplitude} L ${endX} ${y} L ${startX + triWidth * 2 * mult} ${y + amplitude} Z`)
    }
  }

  return paths
}

// ============================================================================
// SCATTERED SHAPES
// ============================================================================

/**
 * Scattered geometric shapes pattern
 */
export function scatteredShapes(
  config: PosterPatternConfig,
  shapes: ('triangle' | 'circle' | 'hexagon' | 'square')[],
  count: number = 20
): string[] {
  const { width, height, seed = 12345 } = config
  const random = seededRandom(seed)
  const paths: string[] = []
  const size = Math.min(width, height) * 0.08

  for (let i = 0; i < count; i++) {
    const x = random() * width * 0.8 + width * 0.1
    const y = random() * height * 0.8 + height * 0.1
    const shapeType = shapes[Math.floor(random() * shapes.length)]
    const s = size * (0.5 + random() * 0.5)
    const filled = random() > 0.5

    let path = ''
    switch (shapeType) {
      case 'triangle':
        path = `M ${x} ${y - s} L ${x + s * 0.866} ${y + s * 0.5} L ${x - s * 0.866} ${y + s * 0.5} Z`
        break
      case 'circle':
        path = `M ${x} ${y} m -${s} 0 a ${s} ${s} 0 1 0 ${s * 2} 0 a ${s} ${s} 0 1 0 -${s * 2} 0`
        break
      case 'hexagon':
        const hexPoints: string[] = []
        for (let j = 0; j < 6; j++) {
          const angle = (Math.PI / 3) * j - Math.PI / 6
          hexPoints.push(`${x + Math.cos(angle) * s} ${y + Math.sin(angle) * s}`)
        }
        path = `M ${hexPoints.join(' L ')} Z`
        break
      case 'square':
        path = `M ${x - s} ${y - s} L ${x + s} ${y - s} L ${x + s} ${y + s} L ${x - s} ${y + s} Z`
        break
    }
    paths.push(path)
  }

  return paths
}

// ============================================================================
// DIAGONAL STRIPES
// ============================================================================

/**
 * Diagonal stripe pattern
 */
export function diagonalStripes(
  config: PosterPatternConfig,
  stripeCount: number = 15,
  angle: number = 45
): string[] {
  const { width, height } = config
  const paths: string[] = []
  const rad = (angle * Math.PI) / 180
  const diagonal = Math.sqrt(width * width + height * height)
  const spacing = diagonal / stripeCount
  const thickness = spacing * 0.4

  for (let i = -stripeCount; i < stripeCount * 2; i++) {
    const offset = i * spacing
    const cos = Math.cos(rad)
    const sin = Math.sin(rad)

    // Calculate stripe endpoints
    const x1 = offset * cos
    const y1 = offset * sin - diagonal
    const x2 = offset * cos - diagonal * sin
    const y2 = offset * sin + diagonal * cos

    // Create thick line as rectangle
    const dx = thickness * sin / 2
    const dy = thickness * cos / 2

    paths.push(`M ${x1 - dx} ${y1 + dy} L ${x1 + dx} ${y1 - dy} L ${x2 + dx} ${y2 - dy} L ${x2 - dx} ${y2 + dy} Z`)
  }

  return paths
}

// ============================================================================
// SHAPE GRID
// ============================================================================

/**
 * Grid of shapes with varying fill states
 */
export function shapeGrid(
  config: PosterPatternConfig,
  cols: number = 5,
  rows: number = 5,
  shape: 'circle' | 'square' | 'mixed' = 'circle'
): { path: string; filled: boolean }[] {
  const { width, height, seed = 12345 } = config
  const random = seededRandom(seed)
  const items: { path: string; filled: boolean }[] = []

  const cellWidth = width / (cols + 1)
  const cellHeight = height / (rows + 1)
  const size = Math.min(cellWidth, cellHeight) * 0.35

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = cellWidth * (col + 1)
      const y = cellHeight * (row + 1)
      const filled = random() > 0.5
      const useShape = shape === 'mixed' ? (random() > 0.5 ? 'circle' : 'square') : shape

      let path = ''
      if (useShape === 'circle') {
        path = `M ${x} ${y} m -${size} 0 a ${size} ${size} 0 1 0 ${size * 2} 0 a ${size} ${size} 0 1 0 -${size * 2} 0`
      } else {
        path = `M ${x - size} ${y - size} L ${x + size} ${y - size} L ${x + size} ${y + size} L ${x - size} ${y + size} Z`
      }

      items.push({ path, filled })
    }
  }

  return items
}

// ============================================================================
// SIMPLE SYMBOLS
// ============================================================================

/**
 * Simple bold symbol shapes
 */
export function symbolPattern(
  config: PosterPatternConfig,
  symbol: 'play' | 'pause' | 'stop' | 'arrow' | 'plus' | 'star' | 'd-shape'
): string[] {
  const { width, height } = config
  const cx = width / 2
  const cy = height / 2
  const size = Math.min(width, height) * 0.35
  const paths: string[] = []

  switch (symbol) {
    case 'play':
      // Play button triangle
      paths.push(`M ${cx - size * 0.4} ${cy - size} L ${cx + size * 0.8} ${cy} L ${cx - size * 0.4} ${cy + size} Z`)
      break

    case 'pause':
      // Two vertical bars
      const barWidth = size * 0.3
      const barGap = size * 0.2
      paths.push(`M ${cx - barGap - barWidth} ${cy - size} L ${cx - barGap} ${cy - size} L ${cx - barGap} ${cy + size} L ${cx - barGap - barWidth} ${cy + size} Z`)
      paths.push(`M ${cx + barGap} ${cy - size} L ${cx + barGap + barWidth} ${cy - size} L ${cx + barGap + barWidth} ${cy + size} L ${cx + barGap} ${cy + size} Z`)
      break

    case 'stop':
      // Square
      paths.push(`M ${cx - size} ${cy - size} L ${cx + size} ${cy - size} L ${cx + size} ${cy + size} L ${cx - size} ${cy + size} Z`)
      break

    case 'arrow':
      // Right arrow
      paths.push(`M ${cx - size} ${cy - size * 0.3} L ${cx + size * 0.3} ${cy - size * 0.3} L ${cx + size * 0.3} ${cy - size * 0.7} L ${cx + size} ${cy} L ${cx + size * 0.3} ${cy + size * 0.7} L ${cx + size * 0.3} ${cy + size * 0.3} L ${cx - size} ${cy + size * 0.3} Z`)
      break

    case 'plus':
      // Plus sign
      const arm = size * 0.3
      paths.push(`M ${cx - arm} ${cy - size} L ${cx + arm} ${cy - size} L ${cx + arm} ${cy - arm} L ${cx + size} ${cy - arm} L ${cx + size} ${cy + arm} L ${cx + arm} ${cy + arm} L ${cx + arm} ${cy + size} L ${cx - arm} ${cy + size} L ${cx - arm} ${cy + arm} L ${cx - size} ${cy + arm} L ${cx - size} ${cy - arm} L ${cx - arm} ${cy - arm} Z`)
      break

    case 'star':
      // 5-pointed star
      const outerR = size
      const innerR = size * 0.4
      const points: string[] = []
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? outerR : innerR
        const angle = (Math.PI / 5) * i - Math.PI / 2
        points.push(`${cx + Math.cos(angle) * r} ${cy + Math.sin(angle) * r}`)
      }
      paths.push(`M ${points.join(' L ')} Z`)
      break

    case 'd-shape':
      // D letterform
      const dWidth = size * 0.8
      const dHeight = size
      const curveR = dHeight * 0.5
      paths.push(`M ${cx - dWidth} ${cy - dHeight} L ${cx - dWidth * 0.2} ${cy - dHeight} A ${curveR} ${dHeight} 0 0 1 ${cx - dWidth * 0.2} ${cy + dHeight} L ${cx - dWidth} ${cy + dHeight} Z`)
      // Inner cutout would need stroke-width or separate path
      break
  }

  return paths
}

// ============================================================================
// KALEIDOSCOPE
// ============================================================================

/**
 * Kaleidoscope pattern with mirrored segments
 */
export function kaleidoscope(
  config: PosterPatternConfig,
  segments: number = 6,
  complexity: number = 3
): string[] {
  const { width, height, seed = 12345 } = config
  const random = seededRandom(seed)
  const cx = width / 2
  const cy = height / 2
  const maxRadius = Math.min(width, height) * 0.45
  const paths: string[] = []

  const angleStep = (Math.PI * 2) / segments

  // Generate base shapes that will be mirrored
  const baseShapes: { type: 'circle' | 'triangle' | 'line'; params: number[] }[] = []
  for (let i = 0; i < complexity * 3; i++) {
    const type = ['circle', 'triangle', 'line'][Math.floor(random() * 3)] as 'circle' | 'triangle' | 'line'
    const r = random() * maxRadius * 0.8 + maxRadius * 0.1
    const angle = random() * angleStep
    baseShapes.push({ type, params: [r, angle, random() * 20 + 5] })
  }

  // Mirror across all segments
  for (let seg = 0; seg < segments; seg++) {
    const segAngle = angleStep * seg

    for (const shape of baseShapes) {
      const [r, localAngle, size] = shape.params
      const angle = segAngle + localAngle
      const x = cx + Math.cos(angle) * r
      const y = cy + Math.sin(angle) * r

      if (shape.type === 'circle') {
        paths.push(`M ${x} ${y} m -${size} 0 a ${size} ${size} 0 1 0 ${size * 2} 0 a ${size} ${size} 0 1 0 -${size * 2} 0`)
      } else if (shape.type === 'triangle') {
        const s = size
        paths.push(`M ${x} ${y - s} L ${x + s * 0.866} ${y + s * 0.5} L ${x - s * 0.866} ${y + s * 0.5} Z`)
      } else {
        const endX = cx + Math.cos(angle) * (r + size * 2)
        const endY = cy + Math.sin(angle) * (r + size * 2)
        paths.push(`M ${x} ${y} L ${endX} ${endY}`)
      }
    }
  }

  return paths
}

// ============================================================================
// POSTER PATTERN TYPE
// ============================================================================

export type PosterPatternType =
  | 'mandala-pointed'
  | 'mandala-rounded'
  | 'mandala-geometric'
  | 'diamond-square'
  | 'diamond-circle'
  | 'diamond-empty'
  | 'circles-overlap'
  | 'circles-chain'
  | 'circles-olympic'
  | 'chevron'
  | 'scattered-shapes'
  | 'diagonal-stripes'
  | 'shape-grid'
  | 'symbol-play'
  | 'symbol-arrow'
  | 'symbol-plus'
  | 'symbol-star'
  | 'kaleidoscope'

export function generatePosterPattern(
  config: PosterPatternConfig,
  type: PosterPatternType
): string[] | { path: string; filled: boolean }[] {
  switch (type) {
    case 'mandala-pointed':
      return mandalaPattern(config, 8, 5, 'pointed')
    case 'mandala-rounded':
      return mandalaPattern(config, 12, 4, 'rounded')
    case 'mandala-geometric':
      return mandalaPattern(config, 6, 6, 'geometric')
    case 'diamond-square':
      return diamondPattern(config, 'square')
    case 'diamond-circle':
      return diamondPattern(config, 'circle')
    case 'diamond-empty':
      return diamondPattern(config, 'none')
    case 'circles-overlap':
      return interlockingCircles(config, 4, 'overlap')
    case 'circles-chain':
      return interlockingCircles(config, 5, 'chain')
    case 'circles-olympic':
      return interlockingCircles(config, 5, 'olympic')
    case 'chevron':
      return chevronPattern(config, 3, 'right')
    case 'scattered-shapes':
      return scatteredShapes(config, ['triangle', 'circle', 'hexagon'], 25)
    case 'diagonal-stripes':
      return diagonalStripes(config, 20, 45)
    case 'shape-grid':
      return shapeGrid(config, 5, 5, 'circle')
    case 'symbol-play':
      return symbolPattern(config, 'play')
    case 'symbol-arrow':
      return symbolPattern(config, 'arrow')
    case 'symbol-plus':
      return symbolPattern(config, 'plus')
    case 'symbol-star':
      return symbolPattern(config, 'star')
    case 'kaleidoscope':
      return kaleidoscope(config, 8, 4)
    default:
      return mandalaPattern(config, 8, 5, 'pointed')
  }
}

// ============================================================================
// COLOR PRESETS - VIBRANT SWISS STYLE
// ============================================================================

export const POSTER_COLOR_PRESETS = {
  'cyan-pop': { bg: '#00BFFF', fg: '#000000', accent: '#FFFFFF' },
  'magenta-pop': { bg: '#FF00FF', fg: '#000000', accent: '#FFFFFF' },
  'yellow-pop': { bg: '#FFFF00', fg: '#000000', accent: '#FFFFFF' },
  'lime-pop': { bg: '#00FF00', fg: '#000000', accent: '#FFFFFF' },
  'red-pop': { bg: '#FF0000', fg: '#000000', accent: '#FFFFFF' },
  'orange-pop': { bg: '#FF6600', fg: '#000000', accent: '#FFFFFF' },
  'purple-pop': { bg: '#9900FF', fg: '#000000', accent: '#FFFFFF' },
  'white-clean': { bg: '#FFFFFF', fg: '#000000', accent: '#333333' },
  'black-bold': { bg: '#000000', fg: '#FFFFFF', accent: '#CCCCCC' },
  'gray-minimal': { bg: '#808080', fg: '#FFFFFF', accent: '#000000' },
  'blue-corporate': { bg: '#0066CC', fg: '#FFFFFF', accent: '#000000' },
  'taupe-neutral': { bg: '#A89078', fg: '#000000', accent: '#FFFFFF' },
} as const

export type PosterColorPreset = keyof typeof POSTER_COLOR_PRESETS
