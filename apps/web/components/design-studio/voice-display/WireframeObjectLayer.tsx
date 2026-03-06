'use client';

/**
 * WireframeObjectLayer
 *
 * Advanced 3D wireframe overlay for semantic ambience.
 * Supports semantic object types, text integration, and context-aware visuals.
 * Uses deterministic seeds to stay dynamic without random chaos.
 */

import React, { useMemo, useRef, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text, Float, Line, Edges } from '@react-three/drei';
import { Color, Vector3, BufferGeometry, BufferAttribute } from 'three';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPES
// =============================================================================

export type SemanticObjectType =
  | 'idea'           // Light bulb / spark
  | 'question'       // Question mark / floating ?
  | 'data'           // Data cube / database cylinder
  | 'connection'     // Network nodes / links
  | 'time'           // Clock / hourglass
  | 'growth'         // Arrow up / plant
  | 'warning'        // Triangle / exclamation
  | 'success'        // Checkmark / star
  | 'error'          // X mark / broken
  | 'process'        // Gears / circular arrows
  | 'music'          // Notes / wave
  | 'location'       // Pin / globe
  | 'user'           // Person silhouette
  | 'chat'           // Speech bubble
  | 'code'           // Brackets / terminal
  | 'abstract';      // Random geometric shapes

export type WireShape =
  | 'box'
  | 'sphere'
  | 'torus'
  | 'icosahedron'
  | 'octahedron'
  | 'tetrahedron'
  | 'cone'
  | 'cylinder'
  | 'dodecahedron'
  | 'ring'
  | 'plane'
  | 'pyramid'
  | 'helix'
  | 'cross'
  | 'diamond';

export type WireframeLayerMode = 'automatic' | 'manual-only';

interface WireframeObjectLayerProps {
  enabled?: boolean;
  /**
   * 'automatic' - Wireframes are always shown when enabled (original behavior)
   * 'manual-only' - Only shows wireframes when explicitly triggered by tool call
   */
  mode?: WireframeLayerMode;
  /**
   * When mode is 'manual-only', this controls whether wireframes are visible
   * (typically set by tool call via store)
   */
  toolTriggered?: boolean;
  density?: number;
  speed?: number;
  opacity?: number;
  color?: string;
  seed?: string;
  className?: string;
  /** Semantic context for shape selection */
  semanticType?: SemanticObjectType;
  /** Show floating text labels */
  showLabels?: boolean;
  /** Label text to display */
  labels?: string[];
  /** Enable glow effect */
  glow?: boolean;
  /** Glow color */
  glowColor?: string;
  /** Line thickness */
  lineWidth?: number;
  /** Enable depth of field blur */
  depthBlur?: boolean;
  /** Animate entrance */
  animateEntrance?: boolean;
}

interface WireObjectConfig {
  shape: WireShape;
  position: [number, number, number];
  scale: number;
  rotationSpeed: [number, number, number];
  drift: [number, number, number];
  phase: number;
  colorShift: number;
  label?: string;
  entranceDelay?: number;
}

// =============================================================================
// SEMANTIC SHAPE MAPPINGS
// =============================================================================

const SEMANTIC_SHAPES: Record<SemanticObjectType, WireShape[]> = {
  idea: ['icosahedron', 'sphere', 'diamond'],
  question: ['torus', 'ring', 'sphere'],
  data: ['box', 'cylinder', 'octahedron'],
  connection: ['sphere', 'torus', 'icosahedron'],
  time: ['ring', 'cylinder', 'cone'],
  growth: ['cone', 'pyramid', 'tetrahedron'],
  warning: ['tetrahedron', 'pyramid', 'octahedron'],
  success: ['icosahedron', 'dodecahedron', 'diamond'],
  error: ['cross', 'octahedron', 'box'],
  process: ['torus', 'ring', 'cylinder'],
  music: ['sphere', 'ring', 'helix'],
  location: ['cone', 'sphere', 'pyramid'],
  user: ['cylinder', 'sphere', 'box'],
  chat: ['box', 'sphere', 'ring'],
  code: ['box', 'octahedron', 'cross'],
  abstract: ['icosahedron', 'dodecahedron', 'torus', 'octahedron'],
};

// =============================================================================
// CUSTOM GEOMETRY HELPERS
// =============================================================================

const createHelixGeometry = (turns: number = 3, radius: number = 0.5, tubeRadius: number = 0.05) => {
  const points: Vector3[] = [];
  const segments = turns * 32;
  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * turns * Math.PI * 2;
    const y = (i / segments) * 2 - 1;
    points.push(new Vector3(Math.cos(t) * radius, y, Math.sin(t) * radius));
  }
  return points;
};

const createCrossGeometry = () => {
  const points: [number, number, number][] = [
    [-1, 0, 0], [1, 0, 0],
    [0, -1, 0], [0, 1, 0],
    [0, 0, -1], [0, 0, 1],
  ];
  return points;
};

const createDiamondGeometry = () => {
  const points: [number, number, number][] = [
    [0, 1, 0],
    [1, 0, 0],
    [0, 0, 1],
    [-1, 0, 0],
    [0, 0, -1],
    [0, -0.5, 0],
  ];
  return points;
};

function hashString(input: string) {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createRng(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// =============================================================================
// WIRE OBJECT COMPONENT
// =============================================================================

const WireObject: React.FC<{
  config: WireObjectConfig;
  speed: number;
  opacity: number;
  baseColor: string;
  glow?: boolean;
  glowColor?: string;
  showLabel?: boolean;
  animateEntrance?: boolean;
}> = ({ config, speed, opacity, baseColor, glow, glowColor, showLabel, animateEntrance }) => {
  const ref = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const entranceProgress = useRef(0);

  const color = useMemo(() => {
    const base = new Color(baseColor);
    base.offsetHSL(0.02 * config.colorShift, 0.1 * config.colorShift, 0.08 * config.colorShift);
    return base;
  }, [baseColor, config.colorShift]);

  const glowColorValue = useMemo(() => {
    return new Color(glowColor || baseColor);
  }, [glowColor, baseColor]);

  useFrame((state, delta) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;

    // Entrance animation
    if (animateEntrance && entranceProgress.current < 1) {
      const delay = config.entranceDelay || 0;
      if (t > delay) {
        entranceProgress.current = Math.min(1, entranceProgress.current + delta * 2);
      }
      if (groupRef.current) {
        const progress = entranceProgress.current;
        const eased = 1 - Math.pow(1 - progress, 3);
        groupRef.current.scale.setScalar(eased * config.scale);
      }
    }

    ref.current.rotation.x += delta * speed * config.rotationSpeed[0];
    ref.current.rotation.y += delta * speed * config.rotationSpeed[1];
    ref.current.rotation.z += delta * speed * config.rotationSpeed[2];

    ref.current.position.x = config.position[0] + Math.sin(t * 0.6 + config.phase) * config.drift[0];
    ref.current.position.y = config.position[1] + Math.cos(t * 0.45 + config.phase) * config.drift[1];
    ref.current.position.z = config.position[2] + Math.sin(t * 0.3 + config.phase) * config.drift[2];
  });

  const renderGeometry = () => {
    switch (config.shape) {
      case 'box':
        return <boxGeometry args={[1, 1, 1]} />;
      case 'sphere':
        return <sphereGeometry args={[0.8, 16, 16]} />;
      case 'torus':
        return <torusGeometry args={[0.7, 0.2, 10, 24]} />;
      case 'icosahedron':
        return <icosahedronGeometry args={[0.9, 0]} />;
      case 'octahedron':
        return <octahedronGeometry args={[0.9, 0]} />;
      case 'tetrahedron':
        return <tetrahedronGeometry args={[0.9, 0]} />;
      case 'cone':
        return <coneGeometry args={[0.6, 1.2, 16]} />;
      case 'cylinder':
        return <cylinderGeometry args={[0.5, 0.5, 1, 16]} />;
      case 'dodecahedron':
        return <dodecahedronGeometry args={[0.8, 0]} />;
      case 'ring':
        return <torusGeometry args={[0.8, 0.1, 8, 32]} />;
      case 'plane':
        return <planeGeometry args={[1.2, 1.2, 4, 4]} />;
      case 'pyramid':
        return <coneGeometry args={[0.7, 1, 4]} />;
      default:
        return <boxGeometry args={[1, 1, 1]} />;
    }
  };

  return (
    <group ref={groupRef} scale={animateEntrance ? 0 : config.scale}>
      <mesh ref={ref}>
        {renderGeometry()}
        <meshBasicMaterial
          color={color}
          wireframe
          transparent
          opacity={opacity}
          depthWrite={false}
        />
        {glow && (
          <meshBasicMaterial
            color={glowColorValue}
            wireframe
            transparent
            opacity={opacity * 0.3}
            depthWrite={false}
          />
        )}
      </mesh>

      {/* Floating label */}
      {showLabel && config.label && (
        <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.3}>
          <Text
            position={[0, config.scale + 0.5, 0]}
            fontSize={0.3}
            color={baseColor}
            anchorX="center"
            anchorY="middle"
            font="/fonts/mono.woff"
          >
            {config.label}
          </Text>
        </Float>
      )}
    </group>
  );
};

// =============================================================================
// CONNECTION LINES COMPONENT
// =============================================================================

const ConnectionLines: React.FC<{
  objects: WireObjectConfig[];
  color: string;
  opacity: number;
}> = ({ objects, color, opacity }) => {
  const linesRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!linesRef.current) return;
    const t = state.clock.elapsedTime;
    linesRef.current.children.forEach((child, i) => {
      if (child.type === 'Line2') {
        (child as any).material.opacity = opacity * (0.3 + 0.2 * Math.sin(t * 2 + i));
      }
    });
  });

  const lineColor = useMemo(() => new Color(color), [color]);

  if (objects.length < 2) return null;

  return (
    <group ref={linesRef}>
      {objects.slice(0, -1).map((obj, i) => {
        const next = objects[i + 1];
        const points = [
          new Vector3(...obj.position),
          new Vector3(...next.position),
        ];
        return (
          <Line
            key={`connection-${i}`}
            points={points}
            color={lineColor}
            lineWidth={1}
            transparent
            opacity={opacity * 0.4}
            dashed
            dashScale={10}
            dashSize={0.5}
            gapSize={0.3}
          />
        );
      })}
    </group>
  );
};

export const WireframeObjectLayer: React.FC<WireframeObjectLayerProps> = ({
  enabled = true,
  mode = 'automatic',
  toolTriggered = false,
  density = 0.6,
  speed = 0.6,
  opacity = 0.25,
  color = '#6de5ff',
  seed = 'wireframe',
  className,
  semanticType = 'abstract',
  showLabels = false,
  labels = [],
  glow = false,
  glowColor,
  lineWidth = 1,
  depthBlur = false,
  animateEntrance = false,
}) => {
  // In manual-only mode, only show objects if explicitly triggered by tool call
  const shouldShowObjects = mode === 'manual-only'
    ? enabled && toolTriggered
    : enabled;

  const objectCount = Math.max(2, Math.round(2 + density * 4));

  const objects = useMemo(() => {
    const rng = createRng(hashString(`${seed}-${objectCount}-${semanticType}`));
    const shapes = SEMANTIC_SHAPES[semanticType] || SEMANTIC_SHAPES.abstract;

    return Array.from({ length: objectCount }, (_, index) => {
      const shape = shapes[Math.floor(rng() * shapes.length)];
      const position: [number, number, number] = [
        (rng() - 0.5) * 5.5,
        (rng() - 0.5) * 3.5,
        (rng() - 0.5) * 2.5,
      ];
      return {
        shape,
        position,
        scale: 0.6 + rng() * 1.6,
        rotationSpeed: [0.2 + rng(), 0.15 + rng(), 0.1 + rng()] as [number, number, number],
        drift: [0.25 + rng() * 0.4, 0.2 + rng() * 0.35, 0.15 + rng() * 0.25] as [number, number, number],
        phase: rng() * Math.PI * 2,
        colorShift: rng() - 0.5,
        label: labels[index] || undefined,
        entranceDelay: index * 0.15,
      };
    });
  }, [seed, objectCount, semanticType, labels]);

  const showConnections = semanticType === 'connection' || semanticType === 'process';

  return (
    <div
      className={cn('absolute inset-0 pointer-events-none', className)}
      style={{ opacity }}
    >
      <Canvas
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: 'high-performance',
          failIfMajorPerformanceCaveat: false,
        }}
        camera={{ position: [0, 0, 6], fov: 45 }}
        onCreated={({ gl }) => {
          // Handle context loss gracefully
          gl.domElement.addEventListener('webglcontextlost', (e) => {
            e.preventDefault();
            console.warn('[WireframeObjectLayer] WebGL context lost, will restore');
          });
          gl.domElement.addEventListener('webglcontextrestored', () => {
            console.log('[WireframeObjectLayer] WebGL context restored');
          });
        }}
      >
        <Suspense fallback={null}>
          {/* Only render objects when active - Canvas stays mounted */}
          {shouldShowObjects && (
            <>
              {/* Connection lines for network-type semantics */}
              {showConnections && (
                <ConnectionLines objects={objects} color={color} opacity={opacity} />
              )}

              {/* Wire objects */}
              {objects.map((config, index) => (
                <WireObject
                  key={`${config.shape}-${index}`}
                  config={config}
                  speed={speed}
                  opacity={opacity}
                  baseColor={color}
                  glow={glow}
                  glowColor={glowColor}
                  showLabel={showLabels}
                  animateEntrance={animateEntrance}
                />
              ))}
            </>
          )}
        </Suspense>
      </Canvas>
    </div>
  );
};

// =============================================================================
// SPECIALIZED SEMANTIC WIREFRAME PRESETS
// =============================================================================

export const SemanticWireframePresets = {
  thinking: {
    semanticType: 'idea' as SemanticObjectType,
    speed: 0.3,
    opacity: 0.2,
    color: '#ffcc00',
    glow: true,
    animateEntrance: true,
  },
  processing: {
    semanticType: 'process' as SemanticObjectType,
    speed: 0.8,
    opacity: 0.25,
    color: '#00f0ff',
    glow: true,
  },
  data: {
    semanticType: 'data' as SemanticObjectType,
    speed: 0.4,
    opacity: 0.3,
    color: '#00ff88',
    showLabels: true,
  },
  error: {
    semanticType: 'error' as SemanticObjectType,
    speed: 1.2,
    opacity: 0.35,
    color: '#ff3366',
    glow: true,
  },
  success: {
    semanticType: 'success' as SemanticObjectType,
    speed: 0.5,
    opacity: 0.3,
    color: '#00ff88',
    glow: true,
    animateEntrance: true,
  },
  network: {
    semanticType: 'connection' as SemanticObjectType,
    speed: 0.4,
    opacity: 0.25,
    color: '#a855f7',
    density: 0.8,
  },
  ambient: {
    semanticType: 'abstract' as SemanticObjectType,
    speed: 0.2,
    opacity: 0.15,
    color: '#6de5ff',
  },
};

export default WireframeObjectLayer;
