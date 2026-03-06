'use client';

/**
 * SemanticPersonalityDisplay
 *
 * Visual personality display based on semantic analysis of speech.
 * Instead of word-for-word transcription, this component:
 * - Extracts key concepts and themes
 * - Shows emotional state through visual style
 * - Displays important keywords/phrases that capture meaning
 * - Creates a dynamic visual mood rather than literal text
 *
 * Content persists until explicitly cleared by agent action.
 */

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useVoice31Store } from './Voice31Store';

// =============================================================================
// TYPES
// =============================================================================

interface KeyConcept {
  id: string;
  text: string;
  importance: number; // 0-1, higher = more prominent
  emotion: string;
  category: 'topic' | 'action' | 'entity' | 'modifier' | 'emphasis';
  position: { x: number; y: number };
  scale: number;
  opacity: number;
  rotation: number;
  velocity: { x: number; y: number };
  lifetime: number;
  maxLifetime: number;
}

interface MoodState {
  primary: string;
  intensity: number;
  colors: { main: string; glow: string; accent: string };
}

// Phosphor color palettes
const PHOSPHOR_PALETTES = {
  amber: { main: '#FFB000', glow: 'rgba(255, 176, 0, 0.6)', accent: '#FF8C00' },
  green: { main: '#00FF41', glow: 'rgba(0, 255, 65, 0.6)', accent: '#00CC33' },
  blue: { main: '#00BFFF', glow: 'rgba(0, 191, 255, 0.6)', accent: '#0099CC' },
  red: { main: '#FF4136', glow: 'rgba(255, 65, 54, 0.6)', accent: '#CC332B' },
  white: { main: '#FFFFFF', glow: 'rgba(255, 255, 255, 0.6)', accent: '#DDDDDD' },
};

// Stopwords to filter out
const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of',
  'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have',
  'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may',
  'might', 'must', 'shall', 'can', 'need', 'it', 'its', 'this', 'that', 'these',
  'those', 'i', 'you', 'he', 'she', 'we', 'they', 'me', 'him', 'her', 'us',
  'them', 'my', 'your', 'his', 'her', 'our', 'their', 'mine', 'yours', 'hers',
  'ours', 'theirs', 'what', 'which', 'who', 'whom', 'whose', 'when', 'where',
  'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other',
  'some', 'such', 'no', 'not', 'only', 'own', 'same', 'so', 'than', 'too',
  'very', 'just', 'also', 'now', 'here', 'there', 'then', 'once', 'um', 'uh',
  'like', 'yeah', 'okay', 'ok', 'well', 'right', 'actually', 'basically',
]);

// Emotion-related words for mood detection
const EMOTION_WORDS: Record<string, string> = {
  happy: 'joy', excited: 'excitement', amazing: 'awe', wonderful: 'joy',
  terrible: 'anger', awful: 'sadness', sad: 'sadness', angry: 'anger',
  scared: 'fear', worried: 'anxiety', confused: 'confusion', surprised: 'shock',
  love: 'joy', hate: 'anger', beautiful: 'awe', ugly: 'disgust',
  interesting: 'curiosity', boring: 'neutral', funny: 'joy', serious: 'neutral',
  important: 'emphasis', critical: 'emphasis', urgent: 'urgency',
};

// =============================================================================
// SEMANTIC ANALYSIS
// =============================================================================

function extractKeyConcepts(text: string, existingConcepts: KeyConcept[]): KeyConcept[] {
  if (!text || text.trim().length === 0) return existingConcepts;

  // Tokenize and clean
  const words = text.toLowerCase().match(/\b[a-z]+(?:'[a-z]+)?\b/gi) || [];

  // Filter and score words
  const wordScores = new Map<string, { count: number; positions: number[] }>();

  words.forEach((word, idx) => {
    const cleanWord = word.toLowerCase();
    if (STOPWORDS.has(cleanWord) || cleanWord.length < 3) return;

    if (!wordScores.has(cleanWord)) {
      wordScores.set(cleanWord, { count: 0, positions: [] });
    }
    const entry = wordScores.get(cleanWord)!;
    entry.count++;
    entry.positions.push(idx);
  });

  // Convert to concepts - only take top scoring words
  const newConcepts: KeyConcept[] = [];
  const existingTexts = new Set(existingConcepts.map(c => c.text.toLowerCase()));

  for (const [word, data] of wordScores.entries()) {
    // Skip if already exists
    if (existingTexts.has(word)) continue;

    // Calculate importance based on frequency and position
    const positionScore = data.positions.reduce((sum, pos) => sum + (1 - pos / words.length), 0) / data.positions.length;
    const importance = Math.min(1, (data.count * 0.3 + positionScore * 0.7));

    // Only add if important enough
    if (importance < 0.3) continue;

    // Determine category
    let category: KeyConcept['category'] = 'topic';
    if (word.endsWith('ing') || word.endsWith('ed')) category = 'action';
    if (word.endsWith('ly')) category = 'modifier';
    if (EMOTION_WORDS[word]) category = 'emphasis';

    // Create concept with random position
    const concept: KeyConcept = {
      id: `concept-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: word.charAt(0).toUpperCase() + word.slice(1),
      importance,
      emotion: EMOTION_WORDS[word] || 'neutral',
      category,
      position: { x: Math.random() * 0.6 + 0.2, y: Math.random() * 0.6 + 0.2 },
      scale: 0.8 + importance * 0.6,
      opacity: 0,
      rotation: (Math.random() - 0.5) * 10,
      velocity: { x: (Math.random() - 0.5) * 0.001, y: (Math.random() - 0.5) * 0.001 },
      lifetime: 0,
      maxLifetime: 10000 + Math.random() * 5000,
    };

    newConcepts.push(concept);
  }

  // Combine with existing, removing old ones that have exceeded lifetime
  const combined = existingConcepts.filter(c => c.lifetime < c.maxLifetime);

  // Limit total concepts
  const all = [...combined, ...newConcepts].sort((a, b) => b.importance - a.importance);
  return all.slice(0, 8); // Keep only top 8 concepts
}

function detectMood(text: string, phosphorColor: string): MoodState {
  const words = text.toLowerCase().split(/\s+/);
  let dominantEmotion = 'neutral';
  let maxScore = 0;

  const emotionScores: Record<string, number> = {};

  words.forEach(word => {
    const emotion = EMOTION_WORDS[word];
    if (emotion) {
      emotionScores[emotion] = (emotionScores[emotion] || 0) + 1;
    }
  });

  for (const [emotion, score] of Object.entries(emotionScores)) {
    if (score > maxScore) {
      maxScore = score;
      dominantEmotion = emotion;
    }
  }

  const palette = PHOSPHOR_PALETTES[phosphorColor as keyof typeof PHOSPHOR_PALETTES] || PHOSPHOR_PALETTES.amber;

  return {
    primary: dominantEmotion,
    intensity: Math.min(1, maxScore / 3),
    colors: palette,
  };
}

// =============================================================================
// COMPONENT
// =============================================================================

interface SemanticPersonalityDisplayProps {
  width: number;
  height: number;
  className?: string;
}

export function SemanticPersonalityDisplay({
  width,
  height,
  className,
}: SemanticPersonalityDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const conceptsRef = useRef<KeyConcept[]>([]);
  const lastTextRef = useRef<string>('');

  const { displayContent, phosphorColor, isSpeaking } = useVoice31Store();

  // Get current text content
  const currentText = displayContent.type === 'text' ? displayContent.text || '' : '';

  // Extract concepts when text changes
  useEffect(() => {
    if (currentText && currentText !== lastTextRef.current) {
      lastTextRef.current = currentText;
      conceptsRef.current = extractKeyConcepts(currentText, conceptsRef.current);
    }
  }, [currentText]);

  // Detect mood
  const mood = useMemo(() => detectMood(currentText, phosphorColor), [currentText, phosphorColor]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();

    const animate = (time: number) => {
      const dt = time - lastTime;
      lastTime = time;

      // Clear with subtle trail effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.fillRect(0, 0, width, height);

      const concepts = conceptsRef.current;

      // Update and draw concepts
      concepts.forEach((concept, idx) => {
        // Update lifetime
        concept.lifetime += dt;

        // Fade in/out
        const fadeInDuration = 500;
        const fadeOutStart = concept.maxLifetime - 1000;

        if (concept.lifetime < fadeInDuration) {
          concept.opacity = concept.lifetime / fadeInDuration;
        } else if (concept.lifetime > fadeOutStart) {
          concept.opacity = 1 - (concept.lifetime - fadeOutStart) / 1000;
        } else {
          concept.opacity = 1;
        }

        // Update position with gentle drift
        concept.position.x += concept.velocity.x * dt;
        concept.position.y += concept.velocity.y * dt;

        // Bounce off edges
        if (concept.position.x < 0.1 || concept.position.x > 0.9) {
          concept.velocity.x *= -1;
          concept.position.x = Math.max(0.1, Math.min(0.9, concept.position.x));
        }
        if (concept.position.y < 0.1 || concept.position.y > 0.9) {
          concept.velocity.y *= -1;
          concept.position.y = Math.max(0.1, Math.min(0.9, concept.position.y));
        }

        // Gentle breathing scale
        const breathe = 1 + Math.sin(time * 0.002 + idx) * 0.05;
        const currentScale = concept.scale * breathe;

        // Calculate pixel position
        const x = concept.position.x * width;
        const y = concept.position.y * height;

        // Draw concept
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate((concept.rotation * Math.PI) / 180);
        ctx.globalAlpha = concept.opacity * 0.9;

        // Font size based on importance
        const fontSize = 20 + concept.importance * 30;
        ctx.font = `bold ${fontSize * currentScale}px "JetBrains Mono", monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Glow effect
        ctx.shadowColor = mood.colors.glow;
        ctx.shadowBlur = 15 + concept.importance * 10;
        ctx.fillStyle = mood.colors.main;

        // Draw text
        ctx.fillText(concept.text, 0, 0);

        // Second pass for extra glow
        ctx.shadowBlur = 5;
        ctx.fillText(concept.text, 0, 0);

        ctx.restore();
      });

      // Remove expired concepts
      conceptsRef.current = concepts.filter(c => c.lifetime < c.maxLifetime);

      // Draw ambient particles based on mood
      if (isSpeaking) {
        drawAmbientParticles(ctx, width, height, mood, time);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [width, height, mood, isSpeaking]);

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

// Draw ambient particles based on mood
function drawAmbientParticles(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  mood: MoodState,
  time: number
) {
  const particleCount = Math.floor(5 + mood.intensity * 10);

  for (let i = 0; i < particleCount; i++) {
    const phase = time * 0.001 + i * 0.5;
    const x = width * (0.2 + 0.6 * ((Math.sin(phase) + 1) / 2));
    const y = height * (0.2 + 0.6 * ((Math.cos(phase * 0.7) + 1) / 2));
    const size = 2 + Math.sin(phase * 2) * 1;

    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = mood.colors.glow;
    ctx.globalAlpha = 0.3 + mood.intensity * 0.3;
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export default SemanticPersonalityDisplay;
