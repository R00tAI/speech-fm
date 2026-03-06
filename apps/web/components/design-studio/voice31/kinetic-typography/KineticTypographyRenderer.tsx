'use client';

/**
 * KineticTypographyRenderer
 *
 * The main React component that renders kinetic typography.
 * Uses Canvas for performance with all the animation systems.
 *
 * This is the visual output of the entire kinetic typography system.
 */

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { SemanticTextAnalyzer } from './SemanticTextAnalyzer';
import { EmotionMapper, emotionMapper } from './EmotionMapper';
import { ChoreographyEngine } from './ChoreographyEngine';
import { ParticleSystem, GlobalEffectsManager, particleSystem, globalEffects } from './ParticleSystem';
import { CompositionManager } from './CompositionManager';
import { SurpriseDirector, surpriseDirector } from './SurpriseDirector';
import {
  RenderConfig,
  RenderedUnit,
  RenderedCharacter,
  Particle,
  EffectType,
  EmotionalState,
  AnalysisResult,
} from './types';

// =============================================================================
// PHOSPHOR COLORS (matching Voice31 theme)
// =============================================================================

const PHOSPHOR_COLORS = {
  amber: { main: '#FFB000', glow: '#FF8C00', dark: '#CC8800' },
  green: { main: '#00FF41', glow: '#00CC33', dark: '#00AA2A' },
  blue: { main: '#00BFFF', glow: '#0099CC', dark: '#007799' },
  red: { main: '#FF4136', glow: '#CC332B', dark: '#AA2A24' },
  white: { main: '#FFFFFF', glow: '#DDDDDD', dark: '#AAAAAA' },
};

// =============================================================================
// EMOTION ACCENT COLORS (for geometric accent elements per emotion)
// =============================================================================

const EMOTION_ACCENT_COLORS: Record<string, string> = {
  shock: '#FF4444',
  joy: '#FFD700',
  anger: '#FF2222',
  sadness: '#6688AA',
  sarcasm: '#AA88FF',
  confusion: '#AABBCC',
  confidence: '#FFD700',
  fear: '#88AACC',
  relief: '#88DDAA',
  awe: '#AACCFF',
  excitement: '#FF6600',
  tenderness: '#FFAACC',
  frustration: '#FF8844',
  curiosity: '#44DDFF',
  determination: '#FFFFFF',
  neutral: '#AAAAAA',
};

// Intensity to font scale mapping for motion-graphics-level size contrast
function getIntensityScale(intensity: number): number {
  if (intensity > 0.85) return 2.2 + (intensity - 0.85) * 8.67; // 2.2x → 3.5x
  if (intensity > 0.65) return 1.3 + (intensity - 0.65) * 4.5;  // 1.3x → 2.2x
  if (intensity > 0.35) return 0.8 + (intensity - 0.35) * 1.67; // 0.8x → 1.3x
  return 0.5 + intensity * 0.86;                                  // 0.5x → 0.8x
}

// =============================================================================
// KINETIC TYPOGRAPHY RENDERER COMPONENT
// =============================================================================

interface KineticTypographyRendererProps {
  text: string;
  isActive: boolean;
  width: number;
  height: number;
  color?: keyof typeof PHOSPHOR_COLORS;
  fontSize?: number;
  fontFamily?: string;
  /**
   * When true, only show key phrases/concepts (not every word).
   * Filters out low-importance words for a motion-graphics aesthetic.
   */
  keyPhrasesOnly?: boolean;
  /**
   * Minimum intensity threshold for showing a word in keyPhrasesOnly mode.
   * Lower = more words shown. Default 0.4.
   */
  intensityThreshold?: number;
  onAnimationComplete?: () => void;
  className?: string;
}

// Stopwords for key-phrase filtering
const KEY_PHRASE_STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of',
  'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have',
  'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may',
  'might', 'it', 'its', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she',
  'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'our',
  'their', 'what', 'which', 'who', 'when', 'where', 'how', 'all', 'some', 'no',
  'not', 'very', 'just', 'also', 'so', 'um', 'uh', 'like', 'yeah', 'okay', 'ok',
  'well', 'right', 'actually', 'basically', 'can', 'need',
]);

export function KineticTypographyRenderer({
  text,
  isActive,
  width,
  height,
  color = 'amber',
  fontSize = 48,
  fontFamily = 'JetBrains Mono, monospace',
  keyPhrasesOnly = false,
  intensityThreshold = 0.4,
  onAnimationComplete,
  className,
}: KineticTypographyRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  // Core systems
  const analyzerRef = useRef(new SemanticTextAnalyzer());
  const choreographerRef = useRef(new ChoreographyEngine());
  const compositionRef = useRef<CompositionManager | null>(null);
  const particlesRef = useRef(new ParticleSystem());
  const effectsRef = useRef(new GlobalEffectsManager());

  // State
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);
  const [renderedUnits, setRenderedUnits] = useState<RenderedUnit[]>([]);

  // Initialize composition manager
  useEffect(() => {
    compositionRef.current = new CompositionManager(width, height);
  }, [width, height]);

  // Analyze and initialize text when it changes
  useEffect(() => {
    if (!text || !isActive || !compositionRef.current) return;

    // Measure actual monospace character width using canvas
    const canvas = canvasRef.current;
    let measuredCharRatio = 0.6; // fallback
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.font = `400 ${fontSize}px ${fontFamily}`;
        const measured = ctx.measureText('M').width;
        measuredCharRatio = measured / fontSize;
      }
    }

    // Set measured ratio on choreographer for accurate character positioning
    if (choreographerRef.current.setCharWidthRatio) {
      choreographerRef.current.setCharWidthRatio(measuredCharRatio);
    }

    // Analyze the text
    const analysis = analyzerRef.current.analyze(text);
    setCurrentAnalysis(analysis);

    // Clear previous animations
    choreographerRef.current.clear();
    compositionRef.current.clear();
    particlesRef.current.clear();
    effectsRef.current.reset();

    // Add to surprise director history
    surpriseDirector.addToHistory(text);

    // Filter units: in keyPhrasesOnly mode, only show important/emotional words
    let displayUnits = analysis.units;
    if (keyPhrasesOnly) {
      displayUnits = analysis.units.filter(unit => {
        const cleanText = unit.text.replace(/[.,!?;:]+$/, '').toLowerCase();
        // Always show: high intensity, emotional, linguistic patterns, short phrases
        if (unit.intensity >= intensityThreshold) return true;
        if (unit.pattern !== 'normal') return true;
        if (unit.emotion !== 'neutral') return true;
        // Filter out stopwords and very short words
        if (KEY_PHRASE_STOPWORDS.has(cleanText)) return false;
        if (cleanText.length < 3) return false;
        // Show remaining content words
        return true;
      });
      // Limit to at most ~8 key phrases to avoid clutter
      if (displayUnits.length > 8) {
        displayUnits = displayUnits
          .sort((a, b) => b.intensity - a.intensity)
          .slice(0, 8);
        // Re-sort by original order (startTime) for natural reading
        displayUnits.sort((a, b) => a.startTime - b.startTime);
      }
    }

    // Select composition template based on all units at once
    compositionRef.current.selectTemplate(displayUnits);

    // Create animation directives for each unit
    const colors = PHOSPHOR_COLORS[color];

    for (const unit of displayUnits) {
      // Map to animation directive
      let directive = emotionMapper.mapToDirective(unit, analysis.overallEmotion);

      // Let surprise director potentially enhance it
      directive = surpriseDirector.considerMagicMoment(unit, directive, analysis);

      // Blend emotion color with phosphor color based on intensity
      // High-intensity moments keep their emotion color for dramatic variety
      if (unit.intensity <= 0.7) {
        directive.style.color = colors.main;
      }
      // Store accent color for geometric elements (always emotion-derived)
      (directive as any)._accentColor = EMOTION_ACCENT_COLORS[unit.emotion] || colors.main;

      // Dynamic font size with motion-graphics-level scale contrast
      // Low intensity: small peripheral text. High intensity: FILLS the screen
      const unitFontSize = keyPhrasesOnly
        ? fontSize * getIntensityScale(unit.intensity)
        : fontSize;

      // Use measured char width for accurate layout
      const charWidth = unitFontSize * measuredCharRatio;
      const estimatedWidth = unit.text.length * charWidth;
      const estimatedHeight = unitFontSize;

      // Calculate position
      const { x, y, zIndex } = compositionRef.current.calculatePosition(
        unit,
        directive,
        estimatedWidth,
        estimatedHeight
      );

      // Initialize the unit in choreographer
      const renderedUnit = choreographerRef.current.initializeUnit(
        unit,
        directive,
        { x, y },
        unitFontSize
      );

      renderedUnit.zIndex = zIndex;

      // Register with composition manager
      compositionRef.current.registerUnit(renderedUnit);

      // Emit effects if specified
      for (const effect of directive.effects) {
        if (effect === 'screen_shake') {
          effectsRef.current.shake(15, 400);
        } else if (effect === 'flash') {
          effectsRef.current.flash(colors.glow, 0.8, 200);
        } else if (['confetti', 'glitter_burst', 'sparks', 'stardust'].includes(effect)) {
          particlesRef.current.emitBurst(effect as EffectType, x + estimatedWidth / 2, y + estimatedHeight / 2, 30);
        }
      }
    }
  }, [text, isActive, color, fontSize, fontFamily, width, height, keyPhrasesOnly, intensityThreshold]);

  // Animation loop
  const animate = useCallback((timestamp: number) => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const deltaTime = lastTimeRef.current ? timestamp - lastTimeRef.current : 16;
    lastTimeRef.current = timestamp;

    // Update systems
    const units = choreographerRef.current.update(deltaTime);
    const particles = particlesRef.current.update(deltaTime);
    const globalState = effectsRef.current.update(deltaTime);

    // Clean up completed units from composition manager to free space
    if (compositionRef.current) {
      for (const unit of units) {
        if (unit.state === 'complete') {
          compositionRef.current.removeUnit(unit.id);
          choreographerRef.current.removeUnit(unit.id);
        } else if (unit.state === 'exiting') {
          // Move exiting units out of active in composition so new ones can use that space
          compositionRef.current.scheduleExit(unit.id);
        }
      }
    }

    // Get measured char width ratio for consistent rendering
    const charWidthRatio = choreographerRef.current.getCharWidthRatio
      ? choreographerRef.current.getCharWidthRatio()
      : 0.6;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Apply global effects
    ctx.save();

    // Screen shake
    if (globalState.screenShake.active) {
      ctx.translate(globalState.screenShake.offsetX, globalState.screenShake.offsetY);
    }

    // Draw background effects (vignette, etc.)
    if (globalState.vignette.active) {
      const progress = globalState.vignette.elapsed / globalState.vignette.duration;
      const opacity = globalState.vignette.intensity * (1 - progress);
      drawVignette(ctx, width, height, opacity);
    }

    // Draw particles (behind text)
    drawParticles(ctx, particles, particlesRef.current);

    // Sort units by z-index
    const sortedUnits = [...units].sort((a, b) => a.zIndex - b.zIndex);

    // Draw each unit (fontSize per-unit from bounds height)
    const colors = PHOSPHOR_COLORS[color];
    for (const unit of sortedUnits) {
      const unitFontSize = unit.bounds.height || fontSize;
      drawUnit(ctx, unit, colors, unitFontSize, fontFamily, timestamp, charWidthRatio);
    }

    // Draw flash effect (on top)
    if (globalState.flash.active) {
      const progress = globalState.flash.elapsed / globalState.flash.duration;
      const opacity = globalState.flash.intensity * (1 - progress);
      ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
      ctx.fillRect(0, 0, width, height);
    }

    // Premium post-processing: Retro CRT effect
    // Apply when any unit has retro_crt in its effects
    const hasCRT = sortedUnits.some(u => u.directive.effects.includes('retro_crt'));
    if (hasCRT) {
      drawRetroCRT(ctx, width, height, timestamp / 1000, 0.7);
    }

    // Premium post-processing: Halftone overlay for ink_bleed styled units
    for (const unit of sortedUnits) {
      if (unit.directive.effects.includes('ink_bleed') && unit.state !== 'complete') {
        const unitFontSize = unit.bounds.height || fontSize;
        drawHalftoneOverlay(
          ctx,
          unit.bounds.x,
          unit.bounds.y,
          unit.bounds.width,
          unitFontSize,
          (unit.directive as any)._accentColor || colors.main,
          unit.unit.intensity
        );
      }
    }

    ctx.restore();

    // Continue animation
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [width, height, color, fontSize, fontFamily]);

  // Start/stop animation
  useEffect(() => {
    if (isActive && text) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive, text, animate]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={className}
      style={{
        width: '100%',
        height: '100%',
      }}
    />
  );
}

// =============================================================================
// DRAWING FUNCTIONS
// =============================================================================

function drawUnit(
  ctx: CanvasRenderingContext2D,
  unit: RenderedUnit,
  colors: { main: string; glow: string; dark: string },
  fontSize: number,
  fontFamily: string,
  timestamp: number = 0,
  charWidthRatio: number = 0.6
): void {
  const { characters, directive } = unit;
  const emotion = unit.unit.emotion;
  const intensity = unit.unit.intensity;
  const pattern = unit.unit.pattern;
  const accentColor = (directive as any)._accentColor || colors.main;

  // Calculate unit text bounds for accent elements
  const visibleChars = characters.filter(c => c.char !== ' ' && c.currentTransform.opacity > 0);
  if (visibleChars.length === 0) return;

  const firstChar = visibleChars[0];
  const lastChar = visibleChars[visibleChars.length - 1];
  const charW = fontSize * charWidthRatio;

  const textStartX = firstChar.basePosition.x + firstChar.currentTransform.x;
  const textEndX = lastChar.basePosition.x + lastChar.currentTransform.x + charW;
  const textY = firstChar.basePosition.y + firstChar.currentTransform.y;
  const textWidth = textEndX - textStartX;
  const textHeight = fontSize;
  const textCenterX = textStartX + textWidth / 2;
  const textCenterY = textY + textHeight / 2;

  // Entrance progress (0→1) for animating accent elements
  const maxOpacity = Math.max(...visibleChars.map(c => c.currentTransform.opacity));
  const entranceProgress = unit.state === 'entering' ? maxOpacity : unit.state === 'active' ? 1 : maxOpacity;

  // ── BACKGROUND ACCENTS (behind text) ──

  // Highlight block for high-intensity emphasis
  if (intensity > 0.7 && entranceProgress > 0.1) {
    drawHighlightBlock(ctx, textStartX, textY, textWidth, textHeight, accentColor, intensity, entranceProgress);
  }

  // ── DRAW CHARACTERS with enhanced multi-pass glow ──

  for (const char of characters) {
    if (char.char === ' ') continue;

    const transform = char.currentTransform;
    if (transform.opacity <= 0) continue;

    ctx.save();

    const x = char.basePosition.x + transform.x;
    const y = char.basePosition.y + transform.y;

    ctx.translate(x, y);
    ctx.rotate((transform.rotation * Math.PI) / 180);
    ctx.scale(transform.scale, transform.scale);
    ctx.globalAlpha = transform.opacity;

    const glowMultiplier = 1 + intensity * 0.6;
    const weight = directive.style.fontWeight || 400;
    const unitFont = directive.style.fontFamily || fontFamily;
    const italicPrefix = directive.style.italic ? 'italic ' : '';
    ctx.font = `${italicPrefix}${weight} ${fontSize}px ${unitFont}`;
    ctx.textBaseline = 'top';

    // Pass 1: Wide outer glow (atmosphere)
    ctx.shadowColor = colors.glow;
    ctx.shadowBlur = 25 * glowMultiplier;
    ctx.fillStyle = directive.style.color || colors.main;
    ctx.fillText(char.char, 0, 0);

    // Pass 2: Accent-colored mid glow (emotion tint)
    if (intensity > 0.5) {
      ctx.shadowColor = accentColor;
      ctx.shadowBlur = 12 * glowMultiplier;
      ctx.fillText(char.char, 0, 0);
    }

    // Pass 3: Sharp text (crisp edge)
    ctx.shadowColor = colors.glow;
    ctx.shadowBlur = 4;
    ctx.fillText(char.char, 0, 0);

    // Chromatic aberration for shock/glitch emotions
    if ((emotion === 'shock' || emotion === 'fear' || pattern === 'stuttered') && intensity > 0.5) {
      drawChromaticAberration(ctx, char.char, fontSize, unitFont, weight, intensity);
    }

    // Premium: Neon layers glow for high-intensity awe/excitement/confidence
    if (directive.effects.includes('neon_layers') && intensity > 0.5) {
      const time = timestamp / 1000;
      drawNeonLayersGlow(ctx, char.char, accentColor, fontSize, `${italicPrefix}${weight} ${fontSize}px ${unitFont}`, intensity, time);
    }

    // Premium: Chrome shimmer for confidence/determination
    if (directive.effects.includes('chrome_shimmer')) {
      const time = timestamp / 1000;
      drawChromeShimmer(ctx, char.char, x - textStartX, textWidth, fontSize, `${italicPrefix}${weight} ${fontSize}px ${unitFont}`, time, intensity);
    }

    ctx.restore();
  }

  // ── FOREGROUND ACCENTS (on top of text) ──

  if (entranceProgress > 0.2) {
    // Underline bar: confidence, determination, or medium+ neutral
    if ((emotion === 'confidence' || emotion === 'determination' || (emotion === 'neutral' && intensity > 0.5))) {
      drawUnderlineBar(ctx, textStartX, textY + textHeight + 4, textWidth, accentColor, entranceProgress, intensity);
    }

    // Corner brackets: all_caps, exclamation burst, or peak intensity
    if ((pattern === 'all_caps_emphasis' || pattern === 'exclamation_burst' || intensity > 0.85) && entranceProgress > 0.3) {
      drawCornerBrackets(ctx, textStartX - 12, textY - 8, textWidth + 24, textHeight + 16, accentColor, entranceProgress);
    }

    // Radiating lines: shock, excitement, anger
    if ((emotion === 'shock' || emotion === 'excitement' || emotion === 'anger') && intensity > 0.7) {
      drawRadiatingLines(ctx, textCenterX, textCenterY, Math.max(textWidth, textHeight), accentColor, entranceProgress, intensity);
    }

    // Dot accents: curiosity, questions
    if ((emotion === 'curiosity' || pattern === 'question_float' || pattern === 'rhetorical_question') && intensity > 0.4) {
      drawDotAccents(ctx, textStartX, textY, textWidth, textHeight, accentColor, entranceProgress);
    }

    // Side accent bar: sarcasm, asides, parenthetical
    if (emotion === 'sarcasm' || pattern === 'whispered_aside' || pattern === 'parenthetical') {
      drawSideAccentBar(ctx, textStartX - 16, textY, textHeight, accentColor, entranceProgress);
    }
  }
}

// ── Accent Drawing Functions ──

function drawHighlightBlock(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, width: number, height: number,
  color: string, intensity: number, progress: number
): void {
  const padding = 10;
  const blockWidth = (width + padding * 2) * Math.min(1, progress * 1.4);

  ctx.save();
  ctx.globalAlpha = progress * 0.12 * intensity;
  ctx.fillStyle = color;
  ctx.fillRect(x - padding, y - padding * 0.5, blockWidth, height + padding);
  ctx.restore();
}

function drawUnderlineBar(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, width: number,
  color: string, progress: number, intensity: number
): void {
  const barWidth = width * Math.min(1, progress * 1.5);
  const barHeight = 2 + intensity * 2;

  ctx.save();
  ctx.globalAlpha = progress * 0.8;
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;
  ctx.fillRect(x, y, barWidth, barHeight);
  ctx.restore();
}

function drawCornerBrackets(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, width: number, height: number,
  color: string, progress: number
): void {
  const bracketSize = Math.min(18, width * 0.08);
  const p = Math.min(1, progress * 1.3);

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.globalAlpha = p * 0.7;
  ctx.shadowColor = color;
  ctx.shadowBlur = 6;

  // Top-left
  ctx.beginPath();
  ctx.moveTo(x, y + bracketSize * p);
  ctx.lineTo(x, y);
  ctx.lineTo(x + bracketSize * p, y);
  ctx.stroke();

  // Top-right
  ctx.beginPath();
  ctx.moveTo(x + width - bracketSize * p, y);
  ctx.lineTo(x + width, y);
  ctx.lineTo(x + width, y + bracketSize * p);
  ctx.stroke();

  // Bottom-left
  ctx.beginPath();
  ctx.moveTo(x, y + height - bracketSize * p);
  ctx.lineTo(x, y + height);
  ctx.lineTo(x + bracketSize * p, y + height);
  ctx.stroke();

  // Bottom-right
  ctx.beginPath();
  ctx.moveTo(x + width - bracketSize * p, y + height);
  ctx.lineTo(x + width, y + height);
  ctx.lineTo(x + width, y + height - bracketSize * p);
  ctx.stroke();

  ctx.restore();
}

function drawRadiatingLines(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, radius: number,
  color: string, progress: number, intensity: number
): void {
  const numLines = 6 + Math.floor(intensity * 6);
  const lineLength = radius * 0.35 * progress;
  const startDist = radius * 0.65;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = progress * 0.4 * intensity;
  ctx.shadowColor = color;
  ctx.shadowBlur = 4;

  for (let i = 0; i < numLines; i++) {
    const angle = (i / numLines) * Math.PI * 2;
    const sx = cx + Math.cos(angle) * startDist;
    const sy = cy + Math.sin(angle) * startDist;
    const ex = cx + Math.cos(angle) * (startDist + lineLength);
    const ey = cy + Math.sin(angle) * (startDist + lineLength);

    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    ctx.stroke();
  }

  ctx.restore();
}

function drawDotAccents(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, width: number, height: number,
  color: string, progress: number
): void {
  const dotSize = 3;
  const positions = [
    { x: x - 12, y: y + height * 0.3 },
    { x: x + width + 8, y: y + height * 0.5 },
    { x: x + width * 0.5, y: y - 10 },
  ];

  ctx.save();
  ctx.fillStyle = color;

  for (let i = 0; i < positions.length; i++) {
    const delay = i * 0.15;
    const dotProgress = Math.max(0, Math.min(1, (progress - delay) / (1 - delay)));
    if (dotProgress <= 0) continue;

    ctx.globalAlpha = dotProgress * 0.6;
    ctx.beginPath();
    ctx.arc(positions[i].x, positions[i].y, dotSize * dotProgress, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawSideAccentBar(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, height: number,
  color: string, progress: number
): void {
  const barWidth = 3;
  const barHeight = height * Math.min(1, progress * 1.5);

  ctx.save();
  ctx.globalAlpha = progress * 0.6;
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 4;
  ctx.fillRect(x, y + (height - barHeight) / 2, barWidth, barHeight);
  ctx.restore();
}

function drawChromaticAberration(
  ctx: CanvasRenderingContext2D,
  char: string, fontSize: number, fontFamily: string,
  weight: number, intensity: number
): void {
  const offset = 1.5 + intensity * 2.5;

  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.font = `${weight} ${fontSize}px ${fontFamily}`;
  ctx.textBaseline = 'top';
  ctx.shadowBlur = 0;

  // Red channel offset left
  ctx.fillStyle = `rgba(255, 0, 0, ${intensity * 0.25})`;
  ctx.fillText(char, -offset, 0);

  // Blue channel offset right
  ctx.fillStyle = `rgba(0, 80, 255, ${intensity * 0.25})`;
  ctx.fillText(char, offset, 0);

  ctx.restore();
}

function drawParticles(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
  system: ParticleSystem
): void {
  for (const particle of particles) {
    const config = system.getConfig(particle.type);

    ctx.save();
    ctx.translate(particle.position.x, particle.position.y);
    ctx.rotate(particle.rotation);
    ctx.globalAlpha = particle.opacity;

    switch (config.shape) {
      case 'circle':
        ctx.beginPath();
        ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.fill();
        break;

      case 'square':
        ctx.fillStyle = particle.color;
        ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
        break;

      case 'star':
        drawStar(ctx, 0, 0, particle.size, particle.color);
        break;

      case 'line':
        ctx.strokeStyle = particle.color;
        ctx.lineWidth = particle.size;
        ctx.beginPath();
        ctx.moveTo(0, -particle.size * 3);
        ctx.lineTo(0, particle.size * 3);
        ctx.stroke();
        break;

      case 'glow':
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, particle.size);
        gradient.addColorStop(0, particle.color);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
        ctx.fill();
        break;
    }

    ctx.restore();
  }
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  color: string
): void {
  const spikes = 5;
  const outerRadius = size;
  const innerRadius = size / 2;

  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (i * Math.PI) / spikes - Math.PI / 2;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function drawVignette(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  opacity: number
): void {
  const gradient = ctx.createRadialGradient(
    width / 2,
    height / 2,
    0,
    width / 2,
    height / 2,
    Math.max(width, height) / 1.5
  );
  gradient.addColorStop(0, 'transparent');
  gradient.addColorStop(1, `rgba(0, 0, 0, ${opacity})`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

// =============================================================================
// PREMIUM RENDERING PASSES
// =============================================================================

/**
 * Multi-layer neon glow — 5 layers with decreasing blur, increasing opacity.
 * Random flicker + floor reflection for high-drama moments.
 */
function drawNeonLayersGlow(
  ctx: CanvasRenderingContext2D,
  char: string,
  glowColor: string,
  fontSize: number,
  fontStr: string,
  intensity: number,
  time: number
): void {
  const layers = 5;
  const flicker = 0.85 + Math.random() * 0.15;

  ctx.save();
  ctx.font = fontStr;
  ctx.textBaseline = 'top';
  ctx.globalCompositeOperation = 'screen';

  for (let l = 0; l < layers; l++) {
    const layerFraction = l / (layers - 1); // 0→1
    const blur = (1 - layerFraction) * 30 * intensity;
    const alpha = (0.1 + layerFraction * 0.3) * flicker * intensity;

    ctx.shadowColor = glowColor;
    ctx.shadowBlur = blur;
    ctx.fillStyle = glowColor;
    ctx.globalAlpha = alpha;
    ctx.fillText(char, 0, 0);
  }

  // Floor reflection (inverted, scaled, blurred below)
  if (intensity > 0.7) {
    ctx.save();
    ctx.translate(0, fontSize * 1.8);
    ctx.scale(1, -0.3);
    ctx.globalAlpha = 0.12 * flicker * intensity;
    ctx.shadowBlur = 15;
    ctx.shadowColor = glowColor;
    ctx.fillStyle = glowColor;
    ctx.fillText(char, 0, 0);
    ctx.restore();
  }

  ctx.restore();
}

/**
 * Chrome/metallic shimmer — sweeping specular highlight across text.
 * Uses screen composite to add a bright travelling band.
 */
function drawChromeShimmer(
  ctx: CanvasRenderingContext2D,
  char: string,
  x: number,
  textWidth: number,
  fontSize: number,
  fontStr: string,
  time: number,
  intensity: number
): void {
  ctx.save();
  ctx.font = fontStr;
  ctx.textBaseline = 'top';
  ctx.globalCompositeOperation = 'screen';

  // Sweeping highlight band position (loops every ~3s)
  const cyclePos = ((time * 0.35) % 1);
  const bandCenter = -textWidth * 0.3 + cyclePos * textWidth * 1.6;
  const bandWidth = fontSize * 1.5;

  // Only draw if band is near this character
  const distFromBand = Math.abs(x - bandCenter);
  if (distFromBand < bandWidth) {
    const bandAlpha = (1 - distFromBand / bandWidth) * 0.4 * intensity;

    ctx.globalAlpha = bandAlpha;
    ctx.shadowColor = '#FFFFFF';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(char, 0, 0);
  }

  ctx.restore();
}

/**
 * Retro CRT effect — scanlines + chromatic split + horizontal jitter.
 * Applied as post-processing pass over the full canvas.
 */
function drawRetroCRT(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  intensity: number
): void {
  ctx.save();

  // Scanline overlay (alternating semi-transparent bars)
  const scanlineSpacing = 3;
  ctx.fillStyle = `rgba(0, 0, 0, ${0.08 * intensity})`;
  for (let y = 0; y < height; y += scanlineSpacing) {
    ctx.fillRect(0, y, width, 1);
  }

  // Subtle horizontal jitter on random scanlines
  if (intensity > 0.5) {
    const jitterLines = 3 + Math.floor(intensity * 5);
    for (let j = 0; j < jitterLines; j++) {
      const jitterY = Math.floor(Math.random() * height);
      const jitterX = (Math.random() - 0.5) * 4 * intensity;
      const lineHeight = 1 + Math.floor(Math.random() * 2);

      if (jitterY >= 0 && jitterY + lineHeight <= height && width > 0) {
        try {
          const lineData = ctx.getImageData(0, jitterY, width, lineHeight);
          ctx.putImageData(lineData, jitterX, jitterY);
        } catch { /* Canvas tainted, skip */ }
      }
    }
  }

  ctx.restore();
}

/**
 * Halftone dot overlay — sample text brightness and draw dots at grid positions.
 * Applied selectively for stylized look.
 */
function drawHalftoneOverlay(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  textWidth: number, textHeight: number,
  color: string,
  intensity: number
): void {
  const dotSpacing = 6;
  const maxDotSize = 2.5 * intensity;

  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.3 * intensity;

  // Sample area and draw dots
  const ox = Math.max(0, Math.floor(x));
  const oy = Math.max(0, Math.floor(y));
  const ow = Math.min(Math.ceil(textWidth), ctx.canvas.width - ox);
  const oh = Math.min(Math.ceil(textHeight), ctx.canvas.height - oy);
  if (ow <= 0 || oh <= 0) { ctx.restore(); return; }
  try {
    const imageData = ctx.getImageData(ox, oy, ow, oh);
    const data = imageData.data;
    const w = imageData.width;

    for (let gy = 0; gy < imageData.height; gy += dotSpacing) {
      for (let gx = 0; gx < w; gx += dotSpacing) {
        const idx = (gy * w + gx) * 4;
        const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / (3 * 255);

        if (brightness > 0.05) {
          const dotSize = brightness * maxDotSize;
          ctx.beginPath();
          ctx.arc(x + gx, y + gy, dotSize, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  } catch {
    // Canvas tainted, skip
  }

  ctx.restore();
}

// =============================================================================
// EXPORTS
// =============================================================================

export default KineticTypographyRenderer;
