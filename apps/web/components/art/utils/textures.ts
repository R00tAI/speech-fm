/**
 * Canvas texture generation utilities
 * Creates paper, grain, canvas, and other texture effects using SVG filters
 */

export interface TextureConfig {
  type: TextureType
  intensity?: number
  scale?: number
  color?: string
  opacity?: number
}

export type TextureType =
  | 'paper'
  | 'canvas'
  | 'grain'
  | 'noise'
  | 'linen'
  | 'concrete'
  | 'wood'
  | 'fabric'
  | 'watercolor'
  | 'chalk'
  | 'scratched'
  | 'halftone'
  | 'scanlines'
  | 'crosshatch'
  | 'stipple'

/**
 * Generate SVG filter definition for texture
 */
export function generateTextureFilter(config: TextureConfig): string {
  const { type, intensity = 0.5, scale = 1, opacity = 1 } = config
  const id = `texture-${type}-${Math.random().toString(36).substr(2, 9)}`

  const filters: Record<TextureType, string> = {
    paper: `
      <filter id="${id}" x="0%" y="0%" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="${0.04 * scale}" numOctaves="5" result="noise"/>
        <feDiffuseLighting in="noise" lighting-color="white" surfaceScale="${2 * intensity}" result="light">
          <feDistantLight azimuth="45" elevation="60"/>
        </feDiffuseLighting>
        <feBlend in="SourceGraphic" in2="light" mode="multiply"/>
      </filter>
    `,

    canvas: `
      <filter id="${id}" x="0%" y="0%" width="100%" height="100%">
        <feTurbulence type="turbulence" baseFrequency="${0.02 * scale} ${0.06 * scale}" numOctaves="2" result="noise"/>
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="${5 * intensity}" xChannelSelector="R" yChannelSelector="G"/>
        <feDiffuseLighting in="noise" lighting-color="#f5f5f0" surfaceScale="${1.5 * intensity}">
          <feDistantLight azimuth="135" elevation="50"/>
        </feDiffuseLighting>
      </filter>
    `,

    grain: `
      <filter id="${id}" x="0%" y="0%" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="${0.8 * scale}" numOctaves="4" stitchTiles="stitch" result="noise"/>
        <feColorMatrix type="saturate" values="0"/>
        <feBlend in="SourceGraphic" mode="overlay" result="blend"/>
        <feComponentTransfer>
          <feFuncA type="linear" slope="${intensity}"/>
        </feComponentTransfer>
      </filter>
    `,

    noise: `
      <filter id="${id}" x="0%" y="0%" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="${0.65 * scale}" numOctaves="3" result="noise"/>
        <feColorMatrix type="saturate" values="0" result="mono"/>
        <feBlend in="SourceGraphic" in2="mono" mode="overlay"/>
        <feComponentTransfer>
          <feFuncA type="linear" slope="${0.5 * intensity}"/>
        </feComponentTransfer>
      </filter>
    `,

    linen: `
      <filter id="${id}" x="0%" y="0%" width="100%" height="100%">
        <feTurbulence type="turbulence" baseFrequency="${0.04 * scale} ${0.15 * scale}" numOctaves="2" result="noise"/>
        <feDiffuseLighting in="noise" lighting-color="#f8f4e8" surfaceScale="${3 * intensity}">
          <feDistantLight azimuth="90" elevation="65"/>
        </feDiffuseLighting>
        <feBlend in="SourceGraphic" mode="multiply"/>
      </filter>
    `,

    concrete: `
      <filter id="${id}" x="0%" y="0%" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="${0.02 * scale}" numOctaves="5" result="noise"/>
        <feColorMatrix type="saturate" values="0"/>
        <feDiffuseLighting in="noise" lighting-color="#b0b0b0" surfaceScale="${4 * intensity}">
          <feDistantLight azimuth="225" elevation="45"/>
        </feDiffuseLighting>
        <feBlend in="SourceGraphic" mode="multiply"/>
      </filter>
    `,

    wood: `
      <filter id="${id}" x="0%" y="0%" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="${0.01 * scale} ${0.2 * scale}" numOctaves="3" result="noise"/>
        <feColorMatrix type="matrix" values="
          0.8 0.2 0 0 0.1
          0.5 0.3 0 0 0.05
          0.2 0.1 0 0 0
          0 0 0 1 0
        "/>
        <feDiffuseLighting surfaceScale="${2 * intensity}" lighting-color="#d4a574">
          <feDistantLight azimuth="180" elevation="55"/>
        </feDiffuseLighting>
        <feBlend in="SourceGraphic" mode="multiply"/>
      </filter>
    `,

    fabric: `
      <filter id="${id}" x="0%" y="0%" width="100%" height="100%">
        <feTurbulence type="turbulence" baseFrequency="${0.1 * scale} ${0.1 * scale}" numOctaves="1" result="noise"/>
        <feConvolveMatrix order="3" kernelMatrix="1 0 -1 0 0 0 -1 0 1" preserveAlpha="true"/>
        <feDiffuseLighting in="noise" surfaceScale="${2 * intensity}" lighting-color="white">
          <feDistantLight azimuth="0" elevation="70"/>
        </feDiffuseLighting>
        <feBlend in="SourceGraphic" mode="soft-light"/>
      </filter>
    `,

    watercolor: `
      <filter id="${id}" x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="${0.03 * scale}" numOctaves="3" result="noise"/>
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="${15 * intensity}" xChannelSelector="R" yChannelSelector="G"/>
        <feGaussianBlur stdDeviation="${0.5 * intensity}"/>
        <feColorMatrix type="saturate" values="1.2"/>
      </filter>
    `,

    chalk: `
      <filter id="${id}" x="0%" y="0%" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="${0.5 * scale}" numOctaves="4" result="noise"/>
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="${2 * intensity}" xChannelSelector="R" yChannelSelector="G"/>
        <feMorphology operator="erode" radius="${0.5 * intensity}"/>
        <feColorMatrix type="saturate" values="0.8"/>
      </filter>
    `,

    scratched: `
      <filter id="${id}" x="0%" y="0%" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="${0.01 * scale} ${0.5 * scale}" numOctaves="1" result="noise"/>
        <feColorMatrix type="matrix" values="
          1 0 0 0 0
          1 0 0 0 0
          1 0 0 0 0
          0 0 0 ${intensity} 0
        "/>
        <feBlend in="SourceGraphic" mode="overlay"/>
      </filter>
    `,

    halftone: `
      <filter id="${id}" x="0%" y="0%" width="100%" height="100%">
        <feImage href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${4 * scale}' height='${4 * scale}'%3E%3Ccircle cx='${2 * scale}' cy='${2 * scale}' r='${1 * scale}' fill='%23000'/%3E%3C/svg%3E" result="pattern"/>
        <feTile in="pattern" result="tiled"/>
        <feBlend in="SourceGraphic" in2="tiled" mode="multiply"/>
        <feComponentTransfer>
          <feFuncA type="linear" slope="${intensity}"/>
        </feComponentTransfer>
      </filter>
    `,

    scanlines: `
      <filter id="${id}" x="0%" y="0%" width="100%" height="100%">
        <feImage href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='${2 * scale}'%3E%3Crect width='1' height='1' fill='%23000' opacity='${0.1 * intensity}'/%3E%3C/svg%3E" result="pattern"/>
        <feTile in="pattern" result="tiled"/>
        <feBlend in="SourceGraphic" in2="tiled" mode="multiply"/>
      </filter>
    `,

    crosshatch: `
      <filter id="${id}" x="0%" y="0%" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="${0.15 * scale}" numOctaves="2" result="noise"/>
        <feConvolveMatrix order="3" kernelMatrix="
          1 -2 1
          -2 4 -2
          1 -2 1
        " preserveAlpha="true"/>
        <feColorMatrix type="saturate" values="0"/>
        <feBlend in="SourceGraphic" mode="overlay"/>
        <feComponentTransfer>
          <feFuncA type="linear" slope="${intensity}"/>
        </feComponentTransfer>
      </filter>
    `,

    stipple: `
      <filter id="${id}" x="0%" y="0%" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="${1 * scale}" numOctaves="1" result="noise"/>
        <feColorMatrix type="discrete" values="
          0 0 0 0 0 0 0 0 0 0 1
          0 0 0 0 0 0 0 0 0 0 1
          0 0 0 0 0 0 0 0 0 0 1
          0 0 0 0 0 0 0 0 0 0 ${intensity}
        "/>
        <feBlend in="SourceGraphic" mode="multiply"/>
      </filter>
    `,
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" style="position:absolute;width:0;height:0">
    <defs>
      ${filters[type]}
    </defs>
  </svg>`
}

/**
 * Get CSS filter property for texture
 */
export function getTextureCSS(id: string): string {
  return `url(#${id})`
}

/**
 * Generate a CSS background with texture overlay
 */
export function generateTextureBackground(
  baseColor: string,
  textureType: TextureType,
  intensity: number = 0.3
): { background: string; backgroundImage: string } {
  const patterns: Record<TextureType, string> = {
    paper: `
      radial-gradient(circle at 50% 50%, rgba(255,255,255,${intensity * 0.1}), transparent 70%),
      repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,${intensity * 0.02}) 2px, rgba(0,0,0,${intensity * 0.02}) 4px)
    `,

    canvas: `
      repeating-linear-gradient(
        0deg,
        transparent,
        transparent 1px,
        rgba(0,0,0,${intensity * 0.05}) 1px,
        rgba(0,0,0,${intensity * 0.05}) 2px
      ),
      repeating-linear-gradient(
        90deg,
        transparent,
        transparent 1px,
        rgba(0,0,0,${intensity * 0.05}) 1px,
        rgba(0,0,0,${intensity * 0.05}) 2px
      )
    `,

    grain: `
      url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n' x='0' y='0'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='256' height='256' filter='url(%23n)' opacity='${intensity}'/%3E%3C/svg%3E")
    `,

    noise: `
      url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='${intensity}'/%3E%3C/svg%3E")
    `,

    linen: `
      repeating-linear-gradient(
        45deg,
        transparent,
        transparent 1px,
        rgba(0,0,0,${intensity * 0.03}) 1px,
        rgba(0,0,0,${intensity * 0.03}) 3px
      ),
      repeating-linear-gradient(
        -45deg,
        transparent,
        transparent 1px,
        rgba(0,0,0,${intensity * 0.03}) 1px,
        rgba(0,0,0,${intensity * 0.03}) 3px
      )
    `,

    concrete: `
      url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='c'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.04' numOctaves='5'/%3E%3CfeDiffuseLighting lighting-color='%23888' surfaceScale='2'%3E%3CfeDistantLight azimuth='45' elevation='30'/%3E%3C/feDiffuseLighting%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23c)' opacity='${intensity}'/%3E%3C/svg%3E")
    `,

    wood: `
      repeating-linear-gradient(
        90deg,
        transparent,
        transparent 2px,
        rgba(139,90,43,${intensity * 0.1}) 2px,
        rgba(139,90,43,${intensity * 0.1}) 4px,
        transparent 4px,
        transparent 10px
      )
    `,

    fabric: `
      repeating-linear-gradient(
        0deg,
        transparent,
        transparent 2px,
        rgba(0,0,0,${intensity * 0.1}) 2px,
        rgba(0,0,0,${intensity * 0.1}) 4px
      ),
      repeating-linear-gradient(
        90deg,
        transparent,
        transparent 2px,
        rgba(0,0,0,${intensity * 0.1}) 2px,
        rgba(0,0,0,${intensity * 0.1}) 4px
      )
    `,

    watercolor: `
      radial-gradient(ellipse at 30% 20%, rgba(255,255,255,${intensity * 0.2}) 0%, transparent 50%),
      radial-gradient(ellipse at 70% 60%, rgba(255,255,255,${intensity * 0.15}) 0%, transparent 40%),
      radial-gradient(ellipse at 20% 80%, rgba(0,0,0,${intensity * 0.1}) 0%, transparent 30%)
    `,

    chalk: `
      url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='chalk'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.5' numOctaves='4'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23chalk)' opacity='${intensity}'/%3E%3C/svg%3E")
    `,

    scratched: `
      repeating-linear-gradient(
        ${Math.random() * 180}deg,
        transparent,
        transparent 1px,
        rgba(255,255,255,${intensity * 0.3}) 1px,
        rgba(255,255,255,${intensity * 0.3}) 2px
      )
    `,

    halftone: `
      radial-gradient(circle at center, black 0.5px, transparent 0.5px)
    `,

    scanlines: `
      repeating-linear-gradient(
        0deg,
        transparent,
        transparent 1px,
        rgba(0,0,0,${intensity * 0.15}) 1px,
        rgba(0,0,0,${intensity * 0.15}) 2px
      )
    `,

    crosshatch: `
      repeating-linear-gradient(
        45deg,
        transparent,
        transparent 2px,
        rgba(0,0,0,${intensity * 0.1}) 2px,
        rgba(0,0,0,${intensity * 0.1}) 4px
      ),
      repeating-linear-gradient(
        -45deg,
        transparent,
        transparent 2px,
        rgba(0,0,0,${intensity * 0.1}) 2px,
        rgba(0,0,0,${intensity * 0.1}) 4px
      )
    `,

    stipple: `
      radial-gradient(circle at 50% 50%, rgba(0,0,0,${intensity * 0.3}) 1px, transparent 1px)
    `,
  }

  return {
    background: baseColor,
    backgroundImage: patterns[textureType],
  }
}

/**
 * Texture presets for common use cases
 */
export const TEXTURE_PRESETS = {
  'vintage-paper': { type: 'paper' as TextureType, intensity: 0.4, scale: 1 },
  'artist-canvas': { type: 'canvas' as TextureType, intensity: 0.5, scale: 1 },
  'film-grain': { type: 'grain' as TextureType, intensity: 0.3, scale: 1.5 },
  'subtle-noise': { type: 'noise' as TextureType, intensity: 0.2, scale: 1 },
  'natural-linen': { type: 'linen' as TextureType, intensity: 0.4, scale: 1 },
  'urban-concrete': { type: 'concrete' as TextureType, intensity: 0.5, scale: 1 },
  'oak-wood': { type: 'wood' as TextureType, intensity: 0.6, scale: 1 },
  'soft-fabric': { type: 'fabric' as TextureType, intensity: 0.3, scale: 1 },
  'watercolor-wash': { type: 'watercolor' as TextureType, intensity: 0.6, scale: 1 },
  'chalkboard': { type: 'chalk' as TextureType, intensity: 0.5, scale: 1 },
  'weathered-metal': { type: 'scratched' as TextureType, intensity: 0.4, scale: 1 },
  'retro-halftone': { type: 'halftone' as TextureType, intensity: 0.4, scale: 2 },
  'crt-scanlines': { type: 'scanlines' as TextureType, intensity: 0.3, scale: 1 },
  'sketch-hatching': { type: 'crosshatch' as TextureType, intensity: 0.4, scale: 1 },
  'pointillism': { type: 'stipple' as TextureType, intensity: 0.5, scale: 1 },
}

export type TexturePresetName = keyof typeof TEXTURE_PRESETS
