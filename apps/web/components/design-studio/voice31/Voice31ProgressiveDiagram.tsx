'use client';

/**
 * Voice31 Progressive Diagram
 *
 * Renders diagrams that reveal step-by-step in sync with speech.
 * Nodes are organized by "level" - level 0 appears first, level 1 second, etc.
 * Designed for CRT aesthetic with phosphor glow and scanline effects.
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPES
// =============================================================================

export type DiagramStyle = 'flowchart' | 'network' | 'hierarchy' | 'timeline' | 'cycle';

export interface DiagramNode {
  id: string;
  label: string;
  level: number;
  connectsTo?: string[];
}

export interface DiagramState {
  active: boolean;
  title: string;
  style: DiagramStyle;
  nodes: DiagramNode[];
  revealedLevel: number;
  highlightedNode: string | null;
  autoAdvance: boolean;
}

interface Voice31ProgressiveDiagramProps {
  state: DiagramState;
  phosphorColor?: string;
  width?: number;
  height?: number;
  className?: string;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getColorValues(phosphorColor: string) {
  const colors: Record<string, { hex: string; rgb: string; glow: string }> = {
    green: { hex: '#33ff33', rgb: '51, 255, 51', glow: 'rgba(51, 255, 51, 0.5)' },
    amber: { hex: '#ffaa00', rgb: '255, 170, 0', glow: 'rgba(255, 170, 0, 0.5)' },
    red: { hex: '#ff4444', rgb: '255, 68, 68', glow: 'rgba(255, 68, 68, 0.5)' },
    blue: { hex: '#4488ff', rgb: '68, 136, 255', glow: 'rgba(68, 136, 255, 0.5)' },
    white: { hex: '#ffffff', rgb: '255, 255, 255', glow: 'rgba(255, 255, 255, 0.5)' },
  };
  return colors[phosphorColor] || colors.amber;
}

interface NodeLayout {
  x: number;
  y: number;
  visible: boolean;
  width: number;
  height: number;
  lines: string[];
  fontSize: number;
  order: number;
  level: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const wrapLabel = (label: string, maxCharsPerLine: number, maxLines: number) => {
  const words = label.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [''];

  const lines: string[] = [];
  let current = '';

  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxCharsPerLine) {
      current = next;
      return;
    }

    if (current) {
      lines.push(current);
    }

    if (word.length > maxCharsPerLine) {
      lines.push(word.slice(0, maxCharsPerLine));
      current = word.slice(maxCharsPerLine);
    } else {
      current = word;
    }
  });

  if (current) lines.push(current);

  if (lines.length > maxLines) {
    const trimmed = lines.slice(0, maxLines);
    const last = trimmed[maxLines - 1];
    const maxSlice = Math.max(0, maxCharsPerLine - 3);
    trimmed[maxLines - 1] = maxSlice > 0 ? `${last.slice(0, maxSlice)}...` : last;
    return trimmed;
  }

  return lines;
};

// Calculate node layout based on diagram style
function calculateNodeLayout(
  nodes: DiagramNode[],
  style: DiagramStyle,
  width: number,
  height: number,
  revealedLevel: number
): Map<string, NodeLayout> {
  const layout = new Map<string, NodeLayout>();

  // Safety checks for invalid inputs
  if (!nodes || nodes.length === 0 || width <= 0 || height <= 0) {
    return layout;
  }

  const padding = clamp(Math.min(width, height) * 0.08, 36, 72);
  const usableWidth = Math.max(0, width - padding * 2);
  const usableHeight = Math.max(0, height - padding * 2);

  // Group nodes by level
  const nodesByLevel = new Map<number, DiagramNode[]>();
  nodes.forEach((node) => {
    const level = node.level;
    if (!nodesByLevel.has(level)) {
      nodesByLevel.set(level, []);
    }
    nodesByLevel.get(level)!.push(node);
  });

  const levels = Array.from(nodesByLevel.keys()).sort((a, b) => a - b);
  const maxLevel = Math.max(...levels, 0);

  const buildNodeLayout = (
    node: DiagramNode,
    x: number,
    y: number,
    nodeWidth: number,
    nodeHeight: number,
    order: number
  ) => {
    // Validate coordinates
    if (!isFinite(x) || !isFinite(y) || isNaN(x) || isNaN(y)) {
      console.warn('[Voice31] Invalid node position for', node.id, { x, y });
      return;
    }

    const fontSize = clamp(Math.round(Math.min(nodeWidth, nodeHeight) / 8), 10, 14);
    const maxChars = Math.max(8, Math.floor((nodeWidth - 16) / (fontSize * 0.6)));
    const lines = wrapLabel(node.label || '', maxChars, 3);

    layout.set(node.id, {
      x,
      y,
      visible: node.level <= revealedLevel,
      width: nodeWidth,
      height: nodeHeight,
      lines,
      fontSize,
      order,
      level: node.level,
    });
  };

  switch (style) {
    case 'flowchart':
    case 'hierarchy': {
      // For flowcharts, reserve space for title at top
      const titleSpace = 50;
      const adjustedHeight = usableHeight - titleSpace;
      const levelHeight = adjustedHeight / Math.max(levels.length, 1);

      // Find max nodes in any level to determine base sizing
      const maxNodesInLevel = Math.max(...Array.from(nodesByLevel.values()).map((n) => n.length), 1);

      levels.forEach((level, levelIndex) => {
        const nodesAtLevel = nodesByLevel.get(level) || [];
        const numNodes = nodesAtLevel.length;

        // Calculate slot width based on actual number of nodes at this level
        const slotWidth = usableWidth / Math.max(numNodes, 1);

        // Adjust node size based on density - smaller when more nodes
        const widthFactor = numNodes > 2 ? 0.75 : 0.82;
        const heightFactor = levels.length > 3 ? 0.55 : 0.62;

        const nodeWidth = clamp(slotWidth * widthFactor, 80, 180);
        const nodeHeight = clamp(levelHeight * heightFactor, 50, 100);

        nodesAtLevel.forEach((node, nodeIndex) => {
          buildNodeLayout(
            node,
            padding + slotWidth * nodeIndex + slotWidth / 2,
            padding + titleSpace + levelHeight * levelIndex + levelHeight / 2,
            nodeWidth,
            nodeHeight,
            nodeIndex
          );
        });
      });
      break;
    }

    case 'timeline': {
      const levelWidth = usableWidth / Math.max(levels.length, 1);
      levels.forEach((level, levelIndex) => {
        const nodesAtLevel = nodesByLevel.get(level) || [];
        const slotHeight = usableHeight / Math.max(nodesAtLevel.length, 1);
        const nodeWidth = clamp(levelWidth * 0.7, 120, 240);
        const nodeHeight = clamp(slotHeight * 0.65, 48, 90);

        nodesAtLevel.forEach((node, nodeIndex) => {
          buildNodeLayout(
            node,
            padding + levelWidth * levelIndex + levelWidth / 2,
            padding + slotHeight * nodeIndex + slotHeight / 2,
            nodeWidth,
            nodeHeight,
            nodeIndex
          );
        });
      });
      break;
    }

    case 'cycle': {
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(usableWidth, usableHeight) / 2.4;
      const nodeSize = clamp(Math.min(usableWidth, usableHeight) / 4, 80, 140);
      const totalNodes = Math.max(nodes.length, 1);

      nodes.forEach((node, index) => {
        const angle = (index / totalNodes) * Math.PI * 2 - Math.PI / 2;
        buildNodeLayout(
          node,
          centerX + Math.cos(angle) * radius,
          centerY + Math.sin(angle) * radius,
          nodeSize,
          nodeSize,
          index
        );
      });
      break;
    }

    case 'network':
    default: {
      const centerX = width / 2;
      const centerY = height / 2;
      const maxRadius = Math.min(usableWidth, usableHeight) / 2.4;
      const nodeSize = clamp(Math.min(usableWidth, usableHeight) / 5, 70, 120);

      nodes.forEach((node, index) => {
        const levelRadius = maxLevel > 0 ? (node.level / maxLevel) * maxRadius : maxRadius * 0.5;
        const nodesAtLevel = nodesByLevel.get(node.level) || [];
        const indexAtLevel = nodesAtLevel.indexOf(node);
        const angleSpread = Math.PI * 2 / Math.max(nodesAtLevel.length, 1);
        const angle = indexAtLevel * angleSpread - Math.PI / 2;

        buildNodeLayout(
          node,
          centerX + Math.cos(angle) * (levelRadius + 40),
          centerY + Math.sin(angle) * (levelRadius + 40),
          nodeSize,
          nodeSize,
          indexAtLevel
        );
      });
      break;
    }
  }

  return layout;
}

// =============================================================================
// NODE COMPONENT
// =============================================================================

interface DiagramNodeComponentProps {
  node: DiagramNode;
  layout: NodeLayout;
  isHighlighted: boolean;
  isNew: boolean;
  color: ReturnType<typeof getColorValues>;
  style: DiagramStyle;
}

const DiagramNodeComponent: React.FC<DiagramNodeComponentProps> = ({
  node,
  layout,
  isHighlighted,
  isNew,
  color,
  style,
}) => {
  if (!layout.visible) return null;
  const isCircle = style === 'cycle' || style === 'network';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6, y: isNew ? 8 : 0 }}
      animate={{
        opacity: 1,
        scale: isHighlighted ? 1.08 : 1,
        y: 0,
      }}
      transition={{
        duration: isNew ? 0.5 : 0.3,
        ease: 'easeOut',
        delay: isNew ? layout.order * 0.06 : 0,
      }}
      className={cn(
        'absolute flex items-center justify-center font-mono',
        isCircle ? 'rounded-full' : 'rounded-lg'
      )}
      style={{
        left: layout.x,
        top: layout.y,
        transform: 'translate(-50%, -50%)',
        width: `${layout.width}px`,
        height: `${layout.height}px`,
        backgroundColor: `rgba(${color.rgb}, ${isHighlighted ? 0.2 : 0.1})`,
        border: `2px solid ${isHighlighted ? color.hex : `rgba(${color.rgb}, 0.6)`}`,
        color: color.hex,
        fontSize: `${layout.fontSize}px`,
        textShadow: `0 0 8px ${color.glow}`,
        boxShadow: isHighlighted
          ? `0 0 20px ${color.glow}, 0 0 40px ${color.glow}, inset 0 0 15px rgba(${color.rgb}, 0.2)`
          : `0 0 10px rgba(${color.rgb}, 0.3)`,
      }}
    >
      <span className="text-center leading-tight px-2">
        {layout.lines.map((line, index) => (
          <span key={`${node.id}-${index}`} className="block">
            {line}
          </span>
        ))}
      </span>

      {/* Pulse animation for highlighted nodes */}
      {isHighlighted && (
        <motion.div
          className="absolute inset-0 rounded-full"
          initial={{ opacity: 0.5, scale: 1 }}
          animate={{ opacity: 0, scale: 1.5 }}
          transition={{ duration: 1, repeat: Infinity }}
          style={{
            border: `2px solid ${color.hex}`,
            borderRadius: isCircle ? '9999px' : '0.5rem',
          }}
        />
      )}
    </motion.div>
  );
};

// =============================================================================
// EDGE COMPONENT
// =============================================================================

interface DiagramEdgeProps {
  fromPos: NodeLayout;
  toPos: NodeLayout;
  color: ReturnType<typeof getColorValues>;
  animated?: boolean;
  delay?: number;
}

const DiagramEdge: React.FC<DiagramEdgeProps> = ({
  fromPos,
  toPos,
  color,
  animated = true,
  delay = 0,
}) => {
  if (!fromPos.visible || !toPos.visible) return null;

  const pathRef = useRef<SVGPathElement>(null);
  const [pathLength, setPathLength] = useState(0);

  useEffect(() => {
    if (pathRef.current) {
      setPathLength(pathRef.current.getTotalLength());
    }
  }, [fromPos, toPos]);

  // Calculate control points for curved path
  const dx = toPos.x - fromPos.x;
  const dy = toPos.y - fromPos.y;
  const midX = fromPos.x + dx / 2;
  const midY = fromPos.y + dy / 2;

  // Add slight curve
  const curve = Math.min(Math.abs(dx), Math.abs(dy)) * 0.2;
  const controlX = midX + (dy > 0 ? curve : -curve);
  const controlY = midY + (dx > 0 ? -curve : curve);

  // Validate all coordinates before creating path
  const coords = [fromPos.x, fromPos.y, controlX, controlY, toPos.x, toPos.y];
  const hasInvalidCoords = coords.some(c => !isFinite(c) || isNaN(c));

  if (hasInvalidCoords) {
    console.warn('[Voice31] Invalid coordinates for edge path:', coords);
    return null;
  }

  const pathD = `M ${fromPos.x} ${fromPos.y} Q ${controlX} ${controlY} ${toPos.x} ${toPos.y}`;

  return (
    <motion.path
      ref={pathRef}
      d={pathD}
      fill="none"
      stroke={`rgba(${color.rgb}, 0.5)`}
      strokeWidth={2}
      initial={animated ? { pathLength: 0, opacity: 0 } : { pathLength: 1, opacity: 1 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeInOut', delay }}
      style={{
        filter: `drop-shadow(0 0 4px ${color.glow})`,
      }}
    />
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export const Voice31ProgressiveDiagram: React.FC<Voice31ProgressiveDiagramProps> = ({
  state,
  phosphorColor = 'amber',
  width = 500,
  height = 400,
  className,
}) => {
  const color = getColorValues(phosphorColor);

  // Compute max level from nodes
  const maxLevel = useMemo(
    () => state.nodes.length > 0 ? Math.max(...state.nodes.map((n) => n.level), 0) : 0,
    [state.nodes]
  );

  // Calculate layout for all nodes
  const nodeLayouts = useMemo(
    () => calculateNodeLayout(state.nodes, state.style, width, height, state.revealedLevel),
    [state.nodes, state.style, width, height, state.revealedLevel]
  );

  // Get all edges
  const edges = useMemo(() => {
    const result: { from: string; to: string }[] = [];
    const nodeIds = new Set(state.nodes.map(n => n.id));

    state.nodes.forEach((node) => {
      if (node.connectsTo && Array.isArray(node.connectsTo)) {
        node.connectsTo.forEach((targetId) => {
          // Only add edge if both nodes exist
          if (nodeIds.has(targetId)) {
            result.push({ from: node.id, to: targetId });
          }
        });
      }
    });
    return result;
  }, [state.nodes]);

  if (!state.active) return null;

  return (
    <div
      className={cn('relative overflow-hidden font-mono', className)}
      style={{ width, height }}
    >
      {/* Background with subtle grid */}
      <div
        className="absolute inset-0"
        style={{
          background: 'rgba(0, 0, 0, 0.7)',
          backgroundImage: `
            linear-gradient(rgba(${color.rgb}, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(${color.rgb}, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Title */}
      {state.title && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-4 left-4 right-4 text-center"
        >
          <h3
            className="text-lg font-bold tracking-wider uppercase"
            style={{
              color: color.hex,
              textShadow: `0 0 15px ${color.glow}`,
            }}
          >
            {state.title}
          </h3>
          <div
            className="text-xs opacity-50 mt-1"
            style={{ color: color.hex }}
          >
            LEVEL {state.revealedLevel + 1} / {maxLevel + 1}
          </div>
        </motion.div>
      )}

      {/* Edges SVG Layer */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <AnimatePresence>
          {edges.map(({ from, to }) => {
            const fromPos = nodeLayouts.get(from);
            const toPos = nodeLayouts.get(to);
            if (!fromPos || !toPos) return null;

            return (
              <DiagramEdge
                key={`${from}-${to}`}
                fromPos={fromPos}
                toPos={toPos}
                color={color}
              />
            );
          })}
        </AnimatePresence>
      </svg>

      {/* Nodes Layer */}
      <AnimatePresence>
        {state.nodes.map((node) => {
          const layout = nodeLayouts.get(node.id);
          if (!layout) return null;

          const isNew = layout.level === state.revealedLevel;

          return (
            <DiagramNodeComponent
              key={node.id}
              node={node}
              layout={layout}
              isHighlighted={state.highlightedNode === node.id}
              isNew={isNew}
              color={color}
              style={state.style}
            />
          );
        })}
      </AnimatePresence>

      {/* Progress indicator */}
      <div
        className="absolute bottom-4 left-4 right-4 h-1 rounded-full overflow-hidden"
        style={{ backgroundColor: `rgba(${color.rgb}, 0.2)` }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color.hex }}
          initial={{ width: '0%' }}
          animate={{
            width: `${((state.revealedLevel + 1) / (maxLevel + 1)) * 100}%`,
          }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Scanline overlay for CRT effect */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0, 0, 0, 0.1) 2px,
            rgba(0, 0, 0, 0.1) 4px
          )`,
        }}
      />
    </div>
  );
};

export default Voice31ProgressiveDiagram;
