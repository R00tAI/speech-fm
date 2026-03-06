/**
 * ASCII Art Generation System
 * Includes character density mapping, pattern-based ASCII, and text rendering
 */

import { perlin2D, fbm, createRandom } from './noise'

// Character ramps from light to dark
export const CHARACTER_RAMPS = {
  // 10-character standard ramp
  standard: ' .:-=+*#%@',

  // Extended 70-character ramp for high detail
  extended: " .'`^\",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$",

  // Block characters
  blocks: ' ░▒▓█',

  // Braille patterns (8-dot)
  braille: '⠀⠁⠂⠃⠄⠅⠆⠇⠈⠉⠊⠋⠌⠍⠎⠏⠐⠑⠒⠓⠔⠕⠖⠗⠘⠙⠚⠛⠜⠝⠞⠟⠠⠡⠢⠣⠤⠥⠦⠧⠨⠩⠪⠫⠬⠭⠮⠯⠰⠱⠲⠳⠴⠵⠶⠷⠸⠹⠺⠻⠼⠽⠾⠿',

  // Geometric patterns
  geometric: ' ·∙●○◐◑◒◓◔◕',

  // Dots only
  dots: ' ·•●',

  // Lines
  lines: ' -=≡',

  // Mathematical symbols
  math: ' ·+×*#',

  // Minimal
  minimal: ' .·•',

  // Stars
  stars: ' ·✦✧★',

  // Circles
  circles: ' ○◐●◉',

  // Arrows
  arrows: ' →↗↑↖←↙↓↘',

  // Box drawing
  box: ' ─│┌┐└┘├┤┬┴┼',

  // Wave characters
  waves: ' ~≈∿',

  // Hearts
  hearts: ' ♡♥',

  // Custom emoji-style
  emoji: '😶🙂😊😃😄',
}

export type CharacterRampType = keyof typeof CHARACTER_RAMPS

export interface ASCIIConfig {
  width: number
  height: number
  characterRamp?: CharacterRampType | string
  invert?: boolean
  contrast?: number
  brightness?: number
}

export interface ASCIIFrame {
  characters: string[][]
  width: number
  height: number
}

/**
 * Get character based on brightness value (0-1)
 */
export function getCharacterForBrightness(
  brightness: number,
  ramp: string = CHARACTER_RAMPS.standard,
  invert: boolean = false
): string {
  const value = Math.max(0, Math.min(1, brightness))
  const adjusted = invert ? 1 - value : value
  const index = Math.floor(adjusted * (ramp.length - 1))
  return ramp[index]
}

/**
 * Apply contrast and brightness adjustments
 */
function adjustValue(value: number, contrast: number = 1, brightness: number = 0): number {
  let adjusted = (value - 0.5) * contrast + 0.5 + brightness
  return Math.max(0, Math.min(1, adjusted))
}

/**
 * Generate ASCII art from noise function
 */
export function noiseToASCII(
  config: ASCIIConfig,
  noiseScale: number = 0.05,
  octaves: number = 4,
  seed?: number
): ASCIIFrame {
  const { width, height, characterRamp = 'standard', invert = false, contrast = 1, brightness = 0 } = config

  const ramp = typeof characterRamp === 'string' && characterRamp in CHARACTER_RAMPS
    ? CHARACTER_RAMPS[characterRamp as CharacterRampType]
    : characterRamp

  const characters: string[][] = []
  const random = createRandom(seed)
  const offsetX = random() * 1000
  const offsetY = random() * 1000

  for (let y = 0; y < height; y++) {
    characters[y] = []
    for (let x = 0; x < width; x++) {
      const noiseValue = fbm((x + offsetX) * noiseScale, (y + offsetY) * noiseScale, octaves)
      const normalized = (noiseValue + 1) / 2
      const adjusted = adjustValue(normalized, contrast, brightness)
      characters[y][x] = getCharacterForBrightness(adjusted, ramp, invert)
    }
  }

  return { characters, width, height }
}

/**
 * Generate ASCII art from a pattern function
 */
export function patternToASCII(
  config: ASCIIConfig,
  patternFn: (x: number, y: number, width: number, height: number) => number
): ASCIIFrame {
  const { width, height, characterRamp = 'standard', invert = false, contrast = 1, brightness = 0 } = config

  const ramp = typeof characterRamp === 'string' && characterRamp in CHARACTER_RAMPS
    ? CHARACTER_RAMPS[characterRamp as CharacterRampType]
    : characterRamp

  const characters: string[][] = []

  for (let y = 0; y < height; y++) {
    characters[y] = []
    for (let x = 0; x < width; x++) {
      const value = patternFn(x, y, width, height)
      const adjusted = adjustValue(value, contrast, brightness)
      characters[y][x] = getCharacterForBrightness(adjusted, ramp, invert)
    }
  }

  return { characters, width, height }
}

/**
 * Predefined pattern functions for ASCII generation
 */
export const ASCII_PATTERNS = {
  // Radial gradient from center
  radial: (x: number, y: number, w: number, h: number) => {
    const cx = w / 2
    const cy = h / 2
    const maxDist = Math.sqrt(cx * cx + cy * cy)
    const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2)
    return 1 - dist / maxDist
  },

  // Horizontal gradient
  horizontal: (x: number, _y: number, w: number) => x / w,

  // Vertical gradient
  vertical: (_x: number, y: number, _w: number, h: number) => y / h,

  // Diagonal gradient
  diagonal: (x: number, y: number, w: number, h: number) => (x + y) / (w + h),

  // Concentric circles
  circles: (x: number, y: number, w: number, h: number) => {
    const cx = w / 2
    const cy = h / 2
    const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2)
    return (Math.sin(dist * 0.5) + 1) / 2
  },

  // Waves
  waves: (x: number, y: number) => (Math.sin(x * 0.3) * Math.cos(y * 0.3) + 1) / 2,

  // Checkerboard
  checkerboard: (x: number, y: number) => (Math.floor(x / 4) + Math.floor(y / 4)) % 2,

  // Spiral
  spiral: (x: number, y: number, w: number, h: number) => {
    const cx = w / 2
    const cy = h / 2
    const angle = Math.atan2(y - cy, x - cx)
    const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2)
    return (Math.sin(angle * 3 + dist * 0.2) + 1) / 2
  },

  // Plasma
  plasma: (x: number, y: number) => {
    const v1 = Math.sin(x * 0.1)
    const v2 = Math.sin(y * 0.1)
    const v3 = Math.sin((x + y) * 0.1)
    const v4 = Math.sin(Math.sqrt(x * x + y * y) * 0.1)
    return (v1 + v2 + v3 + v4 + 4) / 8
  },

  // Diamond
  diamond: (x: number, y: number, w: number, h: number) => {
    const cx = w / 2
    const cy = h / 2
    const dist = Math.abs(x - cx) + Math.abs(y - cy)
    return 1 - dist / (cx + cy)
  },

  // Noise-based
  noise: (x: number, y: number) => (perlin2D(x * 0.1, y * 0.1) + 1) / 2,

  // Heart shape
  heart: (x: number, y: number, w: number, h: number) => {
    const nx = (x - w / 2) / (w / 4)
    const ny = (y - h / 3) / (h / 4)
    const heart = (nx * nx + ny * ny - 1) ** 3 - nx * nx * ny * ny * ny
    return heart < 0 ? 1 : 0
  },

  // Star burst
  starburst: (x: number, y: number, w: number, h: number) => {
    const cx = w / 2
    const cy = h / 2
    const angle = Math.atan2(y - cy, x - cx)
    const points = 8
    return (Math.sin(angle * points) + 1) / 2
  },
}

export type ASCIIPatternType = keyof typeof ASCII_PATTERNS

/**
 * Convert ASCII frame to string
 */
export function frameToString(frame: ASCIIFrame, colorize?: (char: string, x: number, y: number) => string): string {
  return frame.characters
    .map((row, y) =>
      row.map((char, x) => (colorize ? colorize(char, x, y) : char)).join('')
    )
    .join('\n')
}

/**
 * Convert ASCII frame to HTML with colors
 */
export function frameToHTML(
  frame: ASCIIFrame,
  colorFn: (x: number, y: number, char: string) => string = () => '#ffffff'
): string {
  return frame.characters
    .map((row, y) =>
      row.map((char, x) => `<span style="color:${colorFn(x, y, char)}">${char === ' ' ? '&nbsp;' : char}</span>`).join('')
    )
    .join('<br>')
}

/**
 * Generate animated ASCII by varying parameters over time
 */
export function animateASCII(
  baseConfig: ASCIIConfig,
  pattern: ASCIIPatternType,
  frameCount: number,
  timeFn: (frame: number, totalFrames: number) => { offsetX?: number; offsetY?: number; scale?: number }
): ASCIIFrame[] {
  const frames: ASCIIFrame[] = []
  const basePattern = ASCII_PATTERNS[pattern]

  for (let f = 0; f < frameCount; f++) {
    const { offsetX = 0, offsetY = 0, scale = 1 } = timeFn(f, frameCount)

    const modifiedPattern = (x: number, y: number, w: number, h: number) =>
      basePattern((x + offsetX) * scale, (y + offsetY) * scale, w, h)

    frames.push(patternToASCII(baseConfig, modifiedPattern))
  }

  return frames
}

/**
 * Generate text-based ASCII art (banner style)
 */
export function textToASCII(text: string, font: 'standard' | 'block' | 'mini' = 'standard'): string[] {
  // Simplified banner generation - maps characters to predefined patterns
  const fonts: Record<string, Record<string, string[]>> = {
    standard: {
      A: ['  A  ', ' A A ', 'AAAAA', 'A   A', 'A   A'],
      B: ['BBBB ', 'B   B', 'BBBB ', 'B   B', 'BBBB '],
      C: [' CCC ', 'C    ', 'C    ', 'C    ', ' CCC '],
      D: ['DDD  ', 'D  D ', 'D   D', 'D  D ', 'DDD  '],
      E: ['EEEEE', 'E    ', 'EEE  ', 'E    ', 'EEEEE'],
      F: ['FFFFF', 'F    ', 'FFF  ', 'F    ', 'F    '],
      G: [' GGG ', 'G    ', 'G GGG', 'G   G', ' GGG '],
      H: ['H   H', 'H   H', 'HHHHH', 'H   H', 'H   H'],
      I: ['IIIII', '  I  ', '  I  ', '  I  ', 'IIIII'],
      J: ['JJJJJ', '   J ', '   J ', 'J  J ', ' JJ  '],
      K: ['K   K', 'K  K ', 'KKK  ', 'K  K ', 'K   K'],
      L: ['L    ', 'L    ', 'L    ', 'L    ', 'LLLLL'],
      M: ['M   M', 'MM MM', 'M M M', 'M   M', 'M   M'],
      N: ['N   N', 'NN  N', 'N N N', 'N  NN', 'N   N'],
      O: [' OOO ', 'O   O', 'O   O', 'O   O', ' OOO '],
      P: ['PPPP ', 'P   P', 'PPPP ', 'P    ', 'P    '],
      Q: [' QQQ ', 'Q   Q', 'Q Q Q', 'Q  Q ', ' QQ Q'],
      R: ['RRRR ', 'R   R', 'RRRR ', 'R R  ', 'R  RR'],
      S: [' SSS ', 'S    ', ' SSS ', '    S', 'SSSS '],
      T: ['TTTTT', '  T  ', '  T  ', '  T  ', '  T  '],
      U: ['U   U', 'U   U', 'U   U', 'U   U', ' UUU '],
      V: ['V   V', 'V   V', 'V   V', ' V V ', '  V  '],
      W: ['W   W', 'W   W', 'W W W', 'WW WW', 'W   W'],
      X: ['X   X', ' X X ', '  X  ', ' X X ', 'X   X'],
      Y: ['Y   Y', ' Y Y ', '  Y  ', '  Y  ', '  Y  '],
      Z: ['ZZZZZ', '   Z ', '  Z  ', ' Z   ', 'ZZZZZ'],
      ' ': ['     ', '     ', '     ', '     ', '     '],
      '0': [' 000 ', '0   0', '0   0', '0   0', ' 000 '],
      '1': ['  1  ', ' 11  ', '  1  ', '  1  ', '11111'],
      '2': [' 222 ', '2   2', '  22 ', ' 2   ', '22222'],
      '3': ['3333 ', '    3', ' 333 ', '    3', '3333 '],
      '4': ['4   4', '4   4', '44444', '    4', '    4'],
      '5': ['55555', '5    ', '5555 ', '    5', '5555 '],
      '6': [' 666 ', '6    ', '6666 ', '6   6', ' 666 '],
      '7': ['77777', '   7 ', '  7  ', ' 7   ', '7    '],
      '8': [' 888 ', '8   8', ' 888 ', '8   8', ' 888 '],
      '9': [' 999 ', '9   9', ' 9999', '    9', ' 999 '],
    },
    block: {
      A: ['█▀█', '█▀█', '▀ ▀'],
      B: ['█▀▄', '█▀▄', '▀▀ '],
      C: ['█▀▀', '█  ', '▀▀▀'],
      D: ['█▀▄', '█ █', '▀▀ '],
      E: ['█▀▀', '█▀▀', '▀▀▀'],
      F: ['█▀▀', '█▀ ', '▀  '],
      G: ['█▀▀', '█ █', '▀▀▀'],
      H: ['█ █', '█▀█', '▀ ▀'],
      I: ['▀█▀', ' █ ', '▀▀▀'],
      J: ['  █', '█ █', '▀▀ '],
      K: ['█ █', '█▀▄', '▀ ▀'],
      L: ['█  ', '█  ', '▀▀▀'],
      M: ['█▄█', '█ █', '▀ ▀'],
      N: ['█▀█', '█ █', '▀ ▀'],
      O: ['█▀█', '█ █', '▀▀▀'],
      P: ['█▀█', '█▀ ', '▀  '],
      Q: ['█▀█', '█▀█', '▀ ▀'],
      R: ['█▀█', '█▀▄', '▀ ▀'],
      S: ['█▀▀', '▀▀█', '▀▀▀'],
      T: ['▀█▀', ' █ ', ' ▀ '],
      U: ['█ █', '█ █', '▀▀▀'],
      V: ['█ █', '█ █', ' ▀ '],
      W: ['█ █', '█▄█', '▀ ▀'],
      X: ['▀▄▀', ' █ ', '▀ ▀'],
      Y: ['█ █', ' █ ', ' ▀ '],
      Z: ['▀▀█', ' █ ', '▀▀▀'],
      ' ': ['   ', '   ', '   '],
    },
    mini: {
      A: ['▄█▄', '█ █'],
      B: ['██▄', '██▀'],
      C: ['█▀ ', '▀█ '],
      D: ['█▄ ', '█▀ '],
      E: ['██ ', '▄█ '],
      F: ['█▀ ', '█  '],
      G: ['█▀ ', '▀█ '],
      H: ['█▄█', '█ █'],
      I: ['█', '█'],
      J: [' █', '▀█'],
      K: ['█▀▄', '█ █'],
      L: ['█ ', '▀█'],
      M: ['███', '█ █'],
      N: ['█▀█', '█ █'],
      O: ['▄█▄', '▀█▀'],
      P: ['█▀█', '█▀ '],
      Q: ['▄█▄', '▀█▄'],
      R: ['█▀█', '█▀▄'],
      S: ['▄█ ', ' █▄'],
      T: ['▀█▀', ' █ '],
      U: ['█ █', '▀█▀'],
      V: ['█ █', ' █ '],
      W: ['█ █', '███'],
      X: ['▀▄▀', '▄▀▄'],
      Y: ['█ █', ' █ '],
      Z: ['▀▀█', '█▀▀'],
      ' ': ['  ', '  '],
    },
  }

  const selectedFont = fonts[font] || fonts.standard
  const lines: string[] = Array(font === 'mini' ? 2 : font === 'block' ? 3 : 5).fill('')
  const upperText = text.toUpperCase()

  for (const char of upperText) {
    const charPattern = selectedFont[char] || selectedFont[' ']
    charPattern.forEach((line, i) => {
      lines[i] += line + ' '
    })
  }

  return lines
}

/**
 * Generate matrix-style falling characters
 */
export function matrixRain(config: ASCIIConfig, density: number = 0.1): ASCIIFrame {
  const { width, height } = config
  const characters: string[][] = []
  const chars = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789'

  for (let y = 0; y < height; y++) {
    characters[y] = []
    for (let x = 0; x < width; x++) {
      if (Math.random() < density) {
        characters[y][x] = chars[Math.floor(Math.random() * chars.length)]
      } else {
        characters[y][x] = ' '
      }
    }
  }

  return { characters, width, height }
}

/**
 * Generate ASCII art border/frame
 */
export function asciiBorder(
  width: number,
  height: number,
  style: 'simple' | 'double' | 'rounded' | 'heavy' = 'simple'
): ASCIIFrame {
  const styles = {
    simple: { h: '─', v: '│', tl: '┌', tr: '┐', bl: '└', br: '┘' },
    double: { h: '═', v: '║', tl: '╔', tr: '╗', bl: '╚', br: '╝' },
    rounded: { h: '─', v: '│', tl: '╭', tr: '╮', bl: '╰', br: '╯' },
    heavy: { h: '━', v: '┃', tl: '┏', tr: '┓', bl: '┗', br: '┛' },
  }

  const s = styles[style]
  const characters: string[][] = []

  for (let y = 0; y < height; y++) {
    characters[y] = []
    for (let x = 0; x < width; x++) {
      if (y === 0) {
        if (x === 0) characters[y][x] = s.tl
        else if (x === width - 1) characters[y][x] = s.tr
        else characters[y][x] = s.h
      } else if (y === height - 1) {
        if (x === 0) characters[y][x] = s.bl
        else if (x === width - 1) characters[y][x] = s.br
        else characters[y][x] = s.h
      } else {
        if (x === 0 || x === width - 1) characters[y][x] = s.v
        else characters[y][x] = ' '
      }
    }
  }

  return { characters, width, height }
}
