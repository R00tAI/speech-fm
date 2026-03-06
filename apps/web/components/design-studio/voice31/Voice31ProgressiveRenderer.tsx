'use client';

/**
 * Voice31 Progressive Renderer
 *
 * Displays engaging visual feedback during all waiting/buffering states.
 * Prevents the "silent blank screen" problem by always showing something
 * while audio or content is loading.
 *
 * Phases:
 * - Thinking: Animated waveform + contextual hint after user stops talking
 * - Processing: Task progress indicators + animated visualization
 * - Streaming: Progressive content reveal as chunks arrive
 * - Audio buffering: Waveform animation while audio loads
 */

import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import { useVoice31Store, type BufferingPhase, type PendingTask } from './Voice31Store';

// =============================================================================
// PHOSPHOR COLOR UTILITIES
// =============================================================================

const PHOSPHOR_COLORS: Record<string, { r: number; g: number; b: number; hex: string }> = {
  green: { r: 51, g: 255, b: 51, hex: '#33ff33' },
  amber: { r: 255, g: 170, b: 0, hex: '#ffaa00' },
  red: { r: 255, g: 68, b: 68, hex: '#ff4444' },
  blue: { r: 68, g: 136, b: 255, hex: '#4488ff' },
  white: { r: 255, g: 255, b: 255, hex: '#ffffff' },
};

function getColors(phosphorColor: string) {
  return PHOSPHOR_COLORS[phosphorColor] || PHOSPHOR_COLORS.amber;
}

// =============================================================================
// THINKING WAVEFORM - Smooth sine wave animation while AI processes
// =============================================================================

const ThinkingWaveform: React.FC<{
  width: number;
  height: number;
  phosphorColor: string;
  contextHint?: string | null;
}> = ({ width, height, phosphorColor, contextHint }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const colors = getColors(phosphorColor);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const canvasWidth = Math.min(width * 0.6, 400);
    const canvasHeight = 80;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    let time = 0;

    const animate = () => {
      time += 0.02;
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      // Draw 3 layered sine waves
      for (let wave = 0; wave < 3; wave++) {
        const freq = 0.015 + wave * 0.008;
        const amp = (20 - wave * 5) * (0.5 + Math.sin(time * 0.5) * 0.3);
        const phase = time * (1.5 + wave * 0.3);
        const yOffset = canvasHeight / 2;

        ctx.strokeStyle = `rgba(${colors.r}, ${colors.g}, ${colors.b}, ${0.7 - wave * 0.2})`;
        ctx.lineWidth = 2 - wave * 0.5;

        if (wave === 0) {
          ctx.shadowColor = colors.hex;
          ctx.shadowBlur = 8;
        }

        ctx.beginPath();
        for (let x = 0; x < canvasWidth; x++) {
          const y = yOffset + Math.sin(x * freq + phase) * amp;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Central pulsing dot
      const dotRadius = 3 + Math.sin(time * 3) * 1.5;
      const dotAlpha = 0.5 + Math.sin(time * 2) * 0.3;
      ctx.fillStyle = `rgba(${colors.r}, ${colors.g}, ${colors.b}, ${dotAlpha})`;
      ctx.shadowColor = colors.hex;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(canvasWidth / 2, canvasHeight / 2, dotRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [width, height, colors.r, colors.g, colors.b, colors.hex]);

  return (
    <div className="flex flex-col items-center gap-3">
      <canvas
        ref={canvasRef}
        style={{
          width: Math.min(width * 0.6, 400),
          height: 80,
          filter: 'brightness(1.1)',
        }}
      />
      {contextHint && (
        <div
          className="font-mono text-xs tracking-widest uppercase animate-pulse"
          style={{
            color: `${colors.hex}90`,
            textShadow: `0 0 8px ${colors.hex}40`,
          }}
        >
          {contextHint}
        </div>
      )}
    </div>
  );
};

// =============================================================================
// TASK PROGRESS RING - Circular progress for individual tasks
// =============================================================================

const TaskProgressRing: React.FC<{
  task: PendingTask;
  phosphorColor: string;
  size?: number;
}> = ({ task, phosphorColor, size = 32 }) => {
  const colors = getColors(phosphorColor);
  const radius = (size - 4) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - task.progress);

  const statusColor = task.status === 'failed'
    ? '#ff4444'
    : task.status === 'retrying'
      ? '#ffaa00'
      : colors.hex;

  return (
    <div className="flex items-center gap-2">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`${statusColor}20`}
          strokeWidth={2}
        />
        {/* Progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={statusColor}
          strokeWidth={2}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 0.3s ease-out',
            filter: `drop-shadow(0 0 4px ${statusColor}60)`,
          }}
        />
      </svg>
      <div className="flex flex-col">
        <span
          className="font-mono text-xs"
          style={{ color: statusColor, textShadow: `0 0 6px ${statusColor}40` }}
        >
          {task.label}
        </span>
        {task.status === 'retrying' && (
          <span className="font-mono text-[10px]" style={{ color: `${statusColor}80` }}>
            retry {task.retryCount}...
          </span>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// AUDIO BUFFERING INDICATOR - Shown while audio is loading
// =============================================================================

const AudioBufferingIndicator: React.FC<{
  phosphorColor: string;
}> = ({ phosphorColor }) => {
  const colors = getColors(phosphorColor);

  return (
    <div className="flex items-center gap-2">
      {/* Animated dots */}
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full"
            style={{
              backgroundColor: colors.hex,
              opacity: 0.4,
              animation: `bufferDot 1.2s ease-in-out ${i * 0.2}s infinite`,
              boxShadow: `0 0 4px ${colors.hex}60`,
            }}
          />
        ))}
      </div>
      <span
        className="font-mono text-[10px] uppercase tracking-wider"
        style={{ color: `${colors.hex}70` }}
      >
        buffering audio
      </span>

      <style jsx>{`
        @keyframes bufferDot {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.5); }
        }
      `}</style>
    </div>
  );
};

// =============================================================================
// PROGRESSIVE CONTENT SHIMMER - Skeleton loading animation
// =============================================================================

const ContentShimmer: React.FC<{
  phosphorColor: string;
  type: 'text' | 'image' | 'code' | 'search';
}> = ({ phosphorColor, type }) => {
  const colors = getColors(phosphorColor);

  const lines = type === 'text' ? 4 : type === 'code' ? 6 : type === 'search' ? 3 : 1;
  const widths = type === 'text'
    ? ['80%', '65%', '90%', '40%']
    : type === 'code'
      ? ['70%', '50%', '85%', '45%', '75%', '30%']
      : type === 'search'
        ? ['90%', '70%', '60%']
        : ['100%'];

  return (
    <div className="flex flex-col gap-2 w-full max-w-sm">
      {widths.slice(0, lines).map((w, i) => (
        <div
          key={i}
          className="h-2 rounded-full overflow-hidden"
          style={{
            width: w,
            backgroundColor: `${colors.hex}08`,
          }}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: '40%',
              backgroundColor: `${colors.hex}20`,
              animation: `shimmerSlide 1.5s ease-in-out ${i * 0.1}s infinite`,
            }}
          />
        </div>
      ))}

      <style jsx>{`
        @keyframes shimmerSlide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(350%); }
        }
      `}</style>
    </div>
  );
};

// =============================================================================
// MAIN PROGRESSIVE RENDERER
// =============================================================================

export interface Voice31ProgressiveRendererProps {
  width: number;
  height: number;
}

export const Voice31ProgressiveRenderer: React.FC<Voice31ProgressiveRendererProps> = ({
  width,
  height,
}) => {
  const {
    phosphorColor,
    isThinking,
    isSpeaking,
    bufferingState,
  } = useVoice31Store();

  const colors = getColors(phosphorColor);
  const { phase, contextHint, pendingTasks, audioBuffering, lastUserQuery } = bufferingState;

  // Determine what to show based on current state
  const activeTasks = pendingTasks.filter((t) =>
    t.status === 'queued' || t.status === 'running' || t.status === 'retrying'
  );
  const hasActiveTasks = activeTasks.length > 0;

  // Generate context hint based on state
  const displayHint = useMemo(() => {
    if (contextHint) return contextHint;
    if (isThinking && lastUserQuery) {
      const query = lastUserQuery.toLowerCase();
      if (query.includes('show') || query.includes('generate') || query.includes('create'))
        return 'Composing visuals...';
      if (query.includes('search') || query.includes('find') || query.includes('look'))
        return 'Searching...';
      if (query.includes('code') || query.includes('build') || query.includes('make'))
        return 'Writing code...';
      return 'Processing...';
    }
    if (isThinking) return 'Thinking...';
    return null;
  }, [contextHint, isThinking, lastUserQuery]);

  // Don't render if nothing to show
  const shouldRender = isThinking || hasActiveTasks || audioBuffering || phase !== 'idle';
  if (!shouldRender) return null;

  return (
    <div
      className="absolute inset-0 z-12 pointer-events-none flex flex-col items-center justify-center"
      style={{
        background: hasActiveTasks
          ? `radial-gradient(ellipse at center, ${colors.hex}04 0%, transparent 70%)`
          : 'transparent',
      }}
    >
      {/* Thinking waveform - shown during AI processing gap */}
      {isThinking && !hasActiveTasks && !isSpeaking && (
        <ThinkingWaveform
          width={width}
          height={height}
          phosphorColor={phosphorColor}
          contextHint={displayHint}
        />
      )}

      {/* Active task progress indicators */}
      {hasActiveTasks && (
        <div className="flex flex-col items-center gap-3">
          {/* Content shimmer based on task type */}
          {activeTasks.some((t) => t.type === 'code_gen') && (
            <ContentShimmer phosphorColor={phosphorColor} type="code" />
          )}
          {activeTasks.some((t) => t.type === 'image_gen') && (
            <ContentShimmer phosphorColor={phosphorColor} type="image" />
          )}
          {activeTasks.some((t) => t.type === 'web_search') && (
            <ContentShimmer phosphorColor={phosphorColor} type="search" />
          )}

          {/* Task progress rings */}
          <div className="flex flex-col gap-2 mt-3">
            {activeTasks.map((task) => (
              <TaskProgressRing
                key={task.id}
                task={task}
                phosphorColor={phosphorColor}
              />
            ))}
          </div>
        </div>
      )}

      {/* Audio buffering indicator - subtle, bottom of screen */}
      {audioBuffering && (
        <div className="absolute bottom-6 left-0 right-0 flex justify-center">
          <AudioBufferingIndicator phosphorColor={phosphorColor} />
        </div>
      )}
    </div>
  );
};

// =============================================================================
// THINKING CONTEXT GENERATOR - Generates smart context hints
// =============================================================================

/**
 * Generate a contextual thinking hint based on the user's last query.
 * Used to show relevant visual feedback during the thinking gap.
 */
export function generateThinkingHint(userQuery: string): string | null {
  if (!userQuery || userQuery.length < 3) return null;

  const lower = userQuery.toLowerCase();

  // Map common intents to hints
  const intentMap: [RegExp, string][] = [
    [/show\s+(me\s+)?a?\s*(picture|image|photo)/i, 'Imagining...'],
    [/generat(e|ing)\s+(a\s+)?(picture|image|visual)/i, 'Creating visual...'],
    [/(draw|paint|sketch|illustrate)/i, 'Sketching...'],
    [/search\s+(for|the|web)/i, 'Searching the web...'],
    [/(find|look\s+up|research)/i, 'Researching...'],
    [/(code|program|build|develop|create\s+a?\s*(component|app|page))/i, 'Writing code...'],
    [/(diagram|chart|graph|visuali[zs])/i, 'Building visualization...'],
    [/(explain|tell\s+me|what\s+is|how\s+does)/i, 'Formulating response...'],
    [/(play|music|song|audio|sound)/i, 'Preparing audio...'],
    [/(story|tale|narrative|adventure)/i, 'Crafting narrative...'],
    [/(list|steps|instructions|recipe)/i, 'Organizing information...'],
    [/(help|assist|solve|fix)/i, 'Analyzing...'],
    [/(weather|time|date|news)/i, 'Looking up information...'],
    [/(math|calculat|compute)/i, 'Computing...'],
  ];

  for (const [pattern, hint] of intentMap) {
    if (pattern.test(lower)) return hint;
  }

  return 'Processing...';
}

export default Voice31ProgressiveRenderer;
