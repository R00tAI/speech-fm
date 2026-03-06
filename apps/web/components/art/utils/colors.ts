/**
 * Color utilities for algorithmic art generation
 * Includes color space conversions, harmony generators, and gradient creators
 */

export interface RGB {
  r: number
  g: number
  b: number
}

export interface HSL {
  h: number
  s: number
  l: number
}

export interface HSV {
  h: number
  s: number
  v: number
}

export interface LAB {
  l: number
  a: number
  b: number
}

export interface ColorScheme {
  colors: string[]
  name: string
  type: ColorHarmonyType
}

export type ColorHarmonyType =
  | 'complementary'
  | 'analogous'
  | 'triadic'
  | 'split-complementary'
  | 'tetradic'
  | 'square'
  | 'monochromatic'

/**
 * Convert hex to RGB
 */
export function hexToRgb(hex: string): RGB {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return { r: 0, g: 0, b: 0 }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  }
}

/**
 * Convert RGB to hex
 */
export function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) =>
    Math.round(Math.max(0, Math.min(255, n)))
      .toString(16)
      .padStart(2, '0')
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`
}

/**
 * Convert RGB to HSL
 */
export function rgbToHsl(rgb: RGB): HSL {
  const r = rgb.r / 255
  const g = rgb.g / 255
  const b = rgb.b / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 }
}

/**
 * Convert HSL to RGB
 */
export function hslToRgb(hsl: HSL): RGB {
  const h = hsl.h / 360
  const s = hsl.s / 100
  const l = hsl.l / 100

  if (s === 0) {
    const gray = Math.round(l * 255)
    return { r: gray, g: gray, b: gray }
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q

  return {
    r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, h) * 255),
    b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  }
}

/**
 * Convert hex to HSL
 */
export function hexToHsl(hex: string): HSL {
  return rgbToHsl(hexToRgb(hex))
}

/**
 * Convert HSL to hex
 */
export function hslToHex(hsl: HSL): string {
  return rgbToHex(hslToRgb(hsl))
}

/**
 * Convert RGB to HSV
 */
export function rgbToHsv(rgb: RGB): HSV {
  const r = rgb.r / 255
  const g = rgb.g / 255
  const b = rgb.b / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  let h = 0
  const s = max === 0 ? 0 : d / max
  const v = max

  if (max !== min) {
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }
    h /= 6
  }

  return { h: h * 360, s: s * 100, v: v * 100 }
}

/**
 * Convert HSV to RGB
 */
export function hsvToRgb(hsv: HSV): RGB {
  const h = hsv.h / 360
  const s = hsv.s / 100
  const v = hsv.v / 100

  const i = Math.floor(h * 6)
  const f = h * 6 - i
  const p = v * (1 - s)
  const q = v * (1 - f * s)
  const t = v * (1 - (1 - f) * s)

  let r = 0,
    g = 0,
    b = 0
  switch (i % 6) {
    case 0:
      ;(r = v), (g = t), (b = p)
      break
    case 1:
      ;(r = q), (g = v), (b = p)
      break
    case 2:
      ;(r = p), (g = v), (b = t)
      break
    case 3:
      ;(r = p), (g = q), (b = v)
      break
    case 4:
      ;(r = t), (g = p), (b = v)
      break
    case 5:
      ;(r = v), (g = p), (b = q)
      break
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  }
}

/**
 * Generate color harmonies based on a base color
 */
export function generateHarmony(baseHex: string, type: ColorHarmonyType): string[] {
  const hsl = hexToHsl(baseHex)

  const rotateHue = (h: number, degrees: number) => (h + degrees + 360) % 360

  switch (type) {
    case 'complementary':
      return [baseHex, hslToHex({ ...hsl, h: rotateHue(hsl.h, 180) })]

    case 'analogous':
      return [
        hslToHex({ ...hsl, h: rotateHue(hsl.h, -30) }),
        baseHex,
        hslToHex({ ...hsl, h: rotateHue(hsl.h, 30) }),
      ]

    case 'triadic':
      return [
        baseHex,
        hslToHex({ ...hsl, h: rotateHue(hsl.h, 120) }),
        hslToHex({ ...hsl, h: rotateHue(hsl.h, 240) }),
      ]

    case 'split-complementary':
      return [
        baseHex,
        hslToHex({ ...hsl, h: rotateHue(hsl.h, 150) }),
        hslToHex({ ...hsl, h: rotateHue(hsl.h, 210) }),
      ]

    case 'tetradic':
      return [
        baseHex,
        hslToHex({ ...hsl, h: rotateHue(hsl.h, 60) }),
        hslToHex({ ...hsl, h: rotateHue(hsl.h, 180) }),
        hslToHex({ ...hsl, h: rotateHue(hsl.h, 240) }),
      ]

    case 'square':
      return [
        baseHex,
        hslToHex({ ...hsl, h: rotateHue(hsl.h, 90) }),
        hslToHex({ ...hsl, h: rotateHue(hsl.h, 180) }),
        hslToHex({ ...hsl, h: rotateHue(hsl.h, 270) }),
      ]

    case 'monochromatic':
      return [
        hslToHex({ ...hsl, l: Math.max(10, hsl.l - 30) }),
        hslToHex({ ...hsl, l: Math.max(10, hsl.l - 15) }),
        baseHex,
        hslToHex({ ...hsl, l: Math.min(90, hsl.l + 15) }),
        hslToHex({ ...hsl, l: Math.min(90, hsl.l + 30) }),
      ]

    default:
      return [baseHex]
  }
}

/**
 * Generate a random color scheme
 */
export function generateRandomScheme(count: number = 5, seed?: number): string[] {
  const random = seed !== undefined ? seededRandom(seed) : Math.random

  // Start with a random base hue
  const baseHue = random() * 360

  // Generate colors with varying saturation and lightness
  const colors: string[] = []
  for (let i = 0; i < count; i++) {
    const hueOffset = (i * (360 / count) + random() * 30 - 15) % 360
    colors.push(
      hslToHex({
        h: (baseHue + hueOffset) % 360,
        s: 50 + random() * 40,
        l: 35 + random() * 35,
      })
    )
  }

  return colors
}

/**
 * Generate a gradient between two colors
 */
export function generateGradient(startHex: string, endHex: string, steps: number): string[] {
  const start = hexToRgb(startHex)
  const end = hexToRgb(endHex)

  return Array.from({ length: steps }, (_, i) => {
    const t = i / (steps - 1)
    return rgbToHex({
      r: start.r + (end.r - start.r) * t,
      g: start.g + (end.g - start.g) * t,
      b: start.b + (end.b - start.b) * t,
    })
  })
}

/**
 * Generate a multi-stop gradient
 */
export function generateMultiGradient(colors: string[], steps: number): string[] {
  if (colors.length < 2) return colors
  if (colors.length === 2) return generateGradient(colors[0], colors[1], steps)

  const stepsPerSegment = Math.floor(steps / (colors.length - 1))
  const result: string[] = []

  for (let i = 0; i < colors.length - 1; i++) {
    const segment = generateGradient(colors[i], colors[i + 1], stepsPerSegment + 1)
    result.push(...(i === 0 ? segment : segment.slice(1)))
  }

  return result
}

/**
 * Blend two colors together
 */
export function blendColors(color1: string, color2: string, ratio: number = 0.5): string {
  const rgb1 = hexToRgb(color1)
  const rgb2 = hexToRgb(color2)

  return rgbToHex({
    r: rgb1.r + (rgb2.r - rgb1.r) * ratio,
    g: rgb1.g + (rgb2.g - rgb1.g) * ratio,
    b: rgb1.b + (rgb2.b - rgb1.b) * ratio,
  })
}

/**
 * Adjust color luminosity
 */
export function adjustLuminosity(hex: string, amount: number): string {
  const hsl = hexToHsl(hex)
  return hslToHex({
    ...hsl,
    l: Math.max(0, Math.min(100, hsl.l + amount)),
  })
}

/**
 * Adjust color saturation
 */
export function adjustSaturation(hex: string, amount: number): string {
  const hsl = hexToHsl(hex)
  return hslToHex({
    ...hsl,
    s: Math.max(0, Math.min(100, hsl.s + amount)),
  })
}

/**
 * Get contrast ratio between two colors
 */
export function getContrastRatio(color1: string, color2: string): number {
  const getLuminance = (rgb: RGB) => {
    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((c) => {
      c = c / 255
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }

  const l1 = getLuminance(hexToRgb(color1))
  const l2 = getLuminance(hexToRgb(color2))

  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)

  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Get best text color (black or white) for a background
 */
export function getTextColor(backgroundColor: string): string {
  const rgb = hexToRgb(backgroundColor)
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255
  return luminance > 0.5 ? '#000000' : '#ffffff'
}

/**
 * Seeded random number generator
 */
function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
}

/**
 * Predefined color palettes for quick access
 */
export const PRESET_PALETTES: Record<string, string[]> = {
  'ocean-depths': ['#0d1b2a', '#1b263b', '#415a77', '#778da9', '#e0e1dd'],
  'sunset-blaze': ['#2b2d42', '#8d99ae', '#f77f00', '#fcbf49', '#d62828'],
  'forest-moss': ['#0a0f0d', '#1e352f', '#335c3c', '#679267', '#a4c4a8'],
  'cosmic-purple': ['#10002b', '#240046', '#3c096c', '#5a189a', '#7b2cbf'],
  'desert-sand': ['#3d2914', '#6b4423', '#c19a6b', '#ddbea9', '#ffe8d6'],
  'arctic-ice': ['#0a1628', '#1d3557', '#457b9d', '#a8dadc', '#f1faee'],
  'volcanic-ember': ['#1a0000', '#4a0000', '#8b0000', '#cd5c5c', '#f08080'],
  'neon-city': ['#0d0221', '#0f084b', '#3d087b', '#7d0dc3', '#c11cad'],
  'earth-tones': ['#2c1810', '#4a3728', '#7a5c42', '#c8a882', '#e6dcc8'],
  'mint-fresh': ['#0d1b12', '#1a3625', '#2e614a', '#4fb477', '#a8e6cf'],
  'retro-wave': ['#0a0a0a', '#1a1a2e', '#16213e', '#e94560', '#ff6b6b'],
  'golden-hour': ['#1a1a0a', '#3d3d0a', '#b8860b', '#daa520', '#ffd700'],
}

/**
 * Get a random preset palette
 */
export function getRandomPalette(): { name: string; colors: string[] } {
  const names = Object.keys(PRESET_PALETTES)
  const name = names[Math.floor(Math.random() * names.length)]
  return { name, colors: PRESET_PALETTES[name] }
}

/**
 * Generate analogous palette with fine control
 */
export function generateAnalogousPalette(
  baseHue: number,
  count: number = 5,
  spread: number = 30,
  saturation: number = 70,
  lightness: number = 50
): string[] {
  const startHue = baseHue - spread * ((count - 1) / 2)
  return Array.from({ length: count }, (_, i) => {
    const hue = (startHue + i * (spread / (count - 1)) * 2 + 360) % 360
    return hslToHex({ h: hue, s: saturation, l: lightness })
  })
}

/**
 * CSS gradient string generator
 */
export function toCSSGradient(
  colors: string[],
  direction: 'to right' | 'to left' | 'to top' | 'to bottom' | string = 'to right',
  type: 'linear' | 'radial' | 'conic' = 'linear'
): string {
  const stops = colors.map((c, i) => `${c} ${(i / (colors.length - 1)) * 100}%`).join(', ')

  switch (type) {
    case 'radial':
      return `radial-gradient(circle, ${stops})`
    case 'conic':
      return `conic-gradient(from ${direction}, ${stops})`
    default:
      return `linear-gradient(${direction}, ${stops})`
  }
}
