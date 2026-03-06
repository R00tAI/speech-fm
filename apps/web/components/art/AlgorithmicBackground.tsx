'use client'

import React, { useEffect, useRef, useMemo, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  flowFieldPaths,
  concentricWaves,
  parallelWaves,
  geometricGrid,
  spiralPattern,
  phyllotaxisPattern,
  rosePattern,
  superformulaShape,
  hatchingPattern,
  contourLines,
  dotPattern,
  mazePattern,
  truchetPattern,
  flowingWaveLines,
  topographicLines,
  parallelLineMorph,
  wireframeGrid,
  layeredWaveBands,
} from './utils/patterns'
import { generateGradient, toCSSGradient, PRESET_PALETTES } from './utils/colors'
import { generateTextureBackground, TextureType, TEXTURE_PRESETS, TexturePresetName } from './utils/textures'

export type PatternType =
  | 'flowField'
  | 'concentricWaves'
  | 'parallelWaves'
  | 'geometric'
  | 'spiral'
  | 'phyllotaxis'
  | 'rose'
  | 'superformula'
  | 'hatching'
  | 'contour'
  | 'dots'
  | 'maze'
  | 'truchet'
  // iStock-inspired smooth line patterns
  | 'flowingWaves'
  | 'topographic'
  | 'parallelMorph'
  | 'wireframe'
  | 'layeredBands'

export type SizeVariant = 'card' | 'hero' | 'fullscreen' | 'banner' | 'thumbnail' | 'custom'

export interface AlgorithmicBackgroundProps {
  // Core settings
  pattern?: PatternType
  colors?: string[]
  colorPreset?: keyof typeof PRESET_PALETTES
  seed?: number

  // Sizing
  size?: SizeVariant
  width?: number | string
  height?: number | string
  aspectRatio?: string

  // Pattern-specific settings
  density?: number
  scale?: number
  complexity?: number
  strokeWidth?: number

  // Visual settings
  showText?: boolean
  textContent?: string
  textPosition?: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  overlay?: boolean
  overlayOpacity?: number
  blur?: number

  // Texture
  texture?: TextureType | TexturePresetName
  textureIntensity?: number

  // Animation
  animated?: boolean
  animationSpeed?: number
  animationType?: 'rotate' | 'pulse' | 'flow' | 'morph'

  // Appearance
  className?: string
  style?: React.CSSProperties
  rounded?: boolean | 'sm' | 'md' | 'lg' | 'xl' | 'full'

  // Children
  children?: React.ReactNode
}

// Size presets
const SIZE_PRESETS: Record<SizeVariant, { width: number; height: number }> = {
  thumbnail: { width: 200, height: 200 },
  card: { width: 400, height: 300 },
  banner: { width: 800, height: 200 },
  hero: { width: 1200, height: 600 },
  fullscreen: { width: 1920, height: 1080 },
  custom: { width: 400, height: 400 },
}

export function AlgorithmicBackground({
  pattern = 'flowField',
  colors,
  colorPreset,
  seed,
  size = 'card',
  width,
  height,
  aspectRatio,
  density = 0.5,
  scale = 1,
  complexity = 4,
  strokeWidth = 1.5,
  showText = false,
  textContent = '',
  textPosition = 'center',
  overlay = false,
  overlayOpacity = 0.6,
  blur = 0,
  texture,
  textureIntensity = 0.3,
  animated = false,
  animationSpeed = 1,
  animationType = 'rotate',
  className = '',
  style = {},
  rounded = 'lg',
  children,
}: AlgorithmicBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState(() => {
    const preset = SIZE_PRESETS[size]
    return {
      width: typeof width === 'number' ? width : preset.width,
      height: typeof height === 'number' ? height : preset.height,
    }
  })

  // Get actual seed
  const actualSeed = useMemo(() => seed ?? Math.floor(Math.random() * 100000), [seed])

  // Get colors from preset or props
  const patternColors = useMemo(() => {
    if (colors && colors.length > 0) return colors
    if (colorPreset && PRESET_PALETTES[colorPreset]) return PRESET_PALETTES[colorPreset]
    return PRESET_PALETTES['ocean-depths']
  }, [colors, colorPreset])

  // Generate pattern paths
  const patternElements = useMemo(() => {
    const config = {
      width: dimensions.width,
      height: dimensions.height,
      seed: actualSeed,
      scale,
      density,
    }

    switch (pattern) {
      case 'flowField':
        return flowFieldPaths(config, Math.floor(density * 200), Math.floor(complexity * 50), 0.005 * scale)

      case 'concentricWaves':
        return concentricWaves(config, Math.floor(density * 30), 'sine', 10 * scale, 0.05)

      case 'parallelWaves':
        return parallelWaves(config, Math.floor(density * 40), 20 * scale, 0.02)

      case 'geometric':
        const shapes = ['squares', 'circles', 'triangles', 'hexagons', 'diamonds'] as const
        return geometricGrid(config, 50 / scale, shapes[Math.floor(actualSeed % 5)], density)

      case 'spiral':
        const spiralTypes = ['archimedean', 'logarithmic', 'fermat'] as const
        return [spiralPattern(config, spiralTypes[actualSeed % 3], Math.floor(complexity * 10), 5 * scale)]

      case 'phyllotaxis':
        return phyllotaxisPattern(config, Math.floor(density * 800), 4 * scale)

      case 'rose':
        const k = 3 + (actualSeed % 8)
        return [rosePattern(config, k)]

      case 'superformula':
        const m = 3 + (actualSeed % 10)
        return [superformulaShape(config, m, 1, 1, 1)]

      case 'hatching':
        return hatchingPattern(config, 10 / scale, 45, complexity > 2)

      case 'contour':
        return contourLines(config, Math.floor(complexity * 5), 0.01 * scale)

      case 'dots':
        const distributions = ['grid', 'random', 'halftone', 'phyllotaxis'] as const
        return dotPattern(config, distributions[actualSeed % 4], Math.floor(density * 500))

      case 'maze':
        return mazePattern(config, 20 / scale)

      case 'truchet':
        return truchetPattern(config, 40 / scale)

      // iStock-inspired smooth line patterns
      case 'flowingWaves':
        return flowingWaveLines(config, Math.floor(density * 50), 30 * scale, 0.006, complexity * 0.3)

      case 'topographic':
        return topographicLines(config, Math.floor(complexity * 8), 0.006 * scale, 0.7)

      case 'parallelMorph':
        return parallelLineMorph(config, Math.floor(density * 60), Math.floor(complexity), 80 * scale)

      case 'wireframe':
        return wireframeGrid(config, 25 / scale, density, 40 * complexity)

      case 'layeredBands':
        const bands = layeredWaveBands(config, Math.floor(density * 12), 25 * scale, 0.008)
        return bands.map(b => b.path)

      default:
        return []
    }
  }, [pattern, dimensions, actualSeed, scale, density, complexity])

  // Get border radius class
  const getRoundedClass = () => {
    if (rounded === true) return 'rounded-lg'
    if (rounded === false) return ''
    return `rounded-${rounded}`
  }

  // Get texture styles
  const textureStyles = useMemo(() => {
    if (!texture) return {}

    const presetConfig = TEXTURE_PRESETS[texture as TexturePresetName]
    const textureType = presetConfig ? presetConfig.type : (texture as TextureType)
    const intensity = presetConfig ? presetConfig.intensity * textureIntensity : textureIntensity

    return generateTextureBackground('transparent', textureType, intensity)
  }, [texture, textureIntensity])

  // Animation variants
  const animationVariants = useMemo(() => {
    const duration = 20 / animationSpeed

    switch (animationType) {
      case 'rotate':
        return {
          animate: {
            rotate: [0, 360],
            transition: { duration, repeat: Infinity, ease: 'linear' },
          },
        }
      case 'pulse':
        return {
          animate: {
            scale: [1, 1.05, 1],
            opacity: [1, 0.8, 1],
            transition: { duration: duration / 4, repeat: Infinity, ease: 'easeInOut' },
          },
        }
      case 'flow':
        return {
          animate: {
            x: [0, -50, 0],
            y: [0, -30, 0],
            transition: { duration, repeat: Infinity, ease: 'easeInOut' },
          },
        }
      case 'morph':
        return {
          animate: {
            scale: [1, 1.1, 0.95, 1],
            rotate: [0, 5, -5, 0],
            transition: { duration: duration / 2, repeat: Infinity, ease: 'easeInOut' },
          },
        }
      default:
        return {}
    }
  }, [animationType, animationSpeed])

  // Text position styles
  const getTextPositionStyles = (): React.CSSProperties => {
    const base: React.CSSProperties = { position: 'absolute', zIndex: 20 }
    switch (textPosition) {
      case 'top-left':
        return { ...base, top: '1rem', left: '1rem' }
      case 'top-right':
        return { ...base, top: '1rem', right: '1rem' }
      case 'bottom-left':
        return { ...base, bottom: '1rem', left: '1rem' }
      case 'bottom-right':
        return { ...base, bottom: '1rem', right: '1rem' }
      default:
        return {
          ...base,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
        }
    }
  }

  // Render pattern element
  const renderPatternElement = (element: any, index: number) => {
    const colorIndex = index % patternColors.length
    const color = patternColors[colorIndex]

    // Handle dot patterns
    if (typeof element === 'object' && 'x' in element && 'y' in element && 'size' in element) {
      return (
        <circle
          key={index}
          cx={element.x}
          cy={element.y}
          r={element.size}
          fill={color}
          opacity={0.7}
        />
      )
    }

    // Handle path strings
    if (typeof element === 'string') {
      return (
        <path
          key={index}
          d={element}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.8}
        />
      )
    }

    // Handle voronoi-style objects
    if (typeof element === 'object' && 'path' in element) {
      return (
        <path
          key={index}
          d={element.path}
          fill={color}
          fillOpacity={0.3}
          stroke={color}
          strokeWidth={strokeWidth * 0.5}
          opacity={0.7}
        />
      )
    }

    return null
  }

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${getRoundedClass()} ${className}`}
      style={{
        width: width ?? dimensions.width,
        height: height ?? dimensions.height,
        aspectRatio,
        background: toCSSGradient(patternColors.slice(0, 3), 'to bottom right'),
        ...style,
      }}
    >
      {/* Pattern SVG */}
      <motion.svg
        className="absolute inset-0 w-full h-full"
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        preserveAspectRatio="xMidYMid slice"
        style={{ filter: blur ? `blur(${blur}px)` : undefined }}
        {...(animated ? animationVariants : {})}
        animate={animated ? 'animate' : undefined}
      >
        {patternElements.map(renderPatternElement)}
      </motion.svg>

      {/* Texture overlay */}
      {texture && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            ...textureStyles,
            backgroundSize: 'cover',
            mixBlendMode: 'overlay',
          }}
        />
      )}

      {/* Dark overlay for text readability */}
      {overlay && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `rgba(0, 0, 0, ${overlayOpacity})`,
          }}
        />
      )}

      {/* Text content */}
      {showText && textContent && (
        <div
          className="text-white font-semibold text-lg drop-shadow-lg"
          style={getTextPositionStyles()}
        >
          {textContent}
        </div>
      )}

      {/* Children */}
      {children && <div className="relative z-10 h-full">{children}</div>}
    </div>
  )
}

export default AlgorithmicBackground
