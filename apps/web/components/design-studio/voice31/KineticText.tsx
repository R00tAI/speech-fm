'use client';

/**
 * KineticText - Dynamic Typography for Voice31
 *
 * Renders text with motion, emotion, and visual personality.
 * Features:
 * - Words animate in with timing and CRT-style effects
 * - Auto-scales to fit container
 * - Decorative icons as accents
 * - Emotion-based styling
 * - Flicker, glow, and scanline integration
 * - 80s AI assistant aesthetic
 */

import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useVoice31Store, type PhosphorColor } from './Voice31Store';

// =============================================================================
// TYPES
// =============================================================================

interface WordToken {
  text: string;
  emphasis?: 'normal' | 'strong' | 'subtle';
  delay: number;
}

interface KineticTextProps {
  phosphorColor?: PhosphorColor;
  maxWidth?: number;
  maxHeight?: number;
}

// =============================================================================
// EMPHASIS SYSTEM — Content-Aware Word Scoring
// =============================================================================

// Stop words: NEVER emphasize these — articles, prepositions, conjunctions, pronouns, filler
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'it', 'of', 'to', 'in', 'and', 'but', 'or',
  'he', 'she', 'we', 'they', 'this', 'that', 'was', 'were', 'are', 'be',
  'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'for', 'with', 'on', 'at', 'by', 'from', 'not',
  'no', 'so', 'if', 'my', 'your', 'our', 'its', 'just', 'very',
  'really', 'also', 'then', 'than', 'into', 'about', 'over', 'up',
  'out', 'some', 'only', 'can', 'may', 'each', 'which', 'when', 'what',
  'how', 'all', 'both', 'few', 'more', 'most', 'other', 'such', 'where',
  'who', 'why', 'i', 'me', 'him', 'her', 'us', 'them', 'you', 'am',
  'as', 'like', 'well', 'much', 'too', 'get', 'got', 'let', 'say',
  'said', 'here', 'there',
]);

// High-impact power words — always deserve emphasis regardless of context
const POWER_WORDS = new Set([
  'never', 'always', 'must', 'critical', 'dangerous', 'beautiful',
  'impossible', 'extraordinary', 'devastating', 'magnificent', 'shattered',
  'triumphant', 'ancient', 'forbidden', 'legendary', 'powerful', 'destroy',
  'create', 'discover', 'transform', 'unleash', 'conquer', 'betrayed',
  'sacred', 'eternal', 'cursed', 'blessed', 'chaos', 'destiny', 'revenge',
  'sacrifice', 'treasure', 'kingdom', 'dragon', 'magic', 'sword', 'battle',
  'victory', 'defeat', 'death', 'life', 'love', 'hate', 'fear', 'hope',
  'glory', 'doom', 'rise', 'fall', 'war', 'peace', 'secret', 'darkness',
  'light', 'fire', 'storm', 'thunder', 'blood', 'soul', 'spirit',
]);

// =============================================================================
// COLOR UTILITIES
// =============================================================================

const getPhosphorColors = (color: PhosphorColor) => {
  switch (color) {
    case 'green':
      return { primary: '#33ff33', glow: 'rgba(51, 255, 51, 0.6)' };
    case 'amber':
      return { primary: '#ffaa00', glow: 'rgba(255, 170, 0, 0.6)' };
    case 'red':
      return { primary: '#ff4444', glow: 'rgba(255, 68, 68, 0.6)' };
    case 'blue':
      return { primary: '#4488ff', glow: 'rgba(68, 136, 255, 0.6)' };
    case 'white':
    default:
      return { primary: '#ffffff', glow: 'rgba(255, 255, 255, 0.6)' };
  }
};

// =============================================================================
// KINETIC WORD COMPONENT - With CRT flicker and glow effects
// =============================================================================

interface KineticWordProps {
  token: WordToken;
  colors: { primary: string; glow: string };
  isVisible: boolean;
  fontSize: number;
  wordIndex: number;
}

const KineticWord: React.FC<KineticWordProps> = ({
  token,
  colors,
  isVisible,
  fontSize,
  wordIndex,
}) => {
  const [entered, setEntered] = useState(false);
  const [flickerIntensity, setFlickerIntensity] = useState(1);

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => setEntered(true), token.delay);
      return () => clearTimeout(timer);
    } else {
      setEntered(false);
    }
  }, [isVisible, token.delay]);

  // Subtler CRT flicker (0.96-1.0 range)
  useEffect(() => {
    if (!entered) return;
    const flickerInterval = setInterval(() => {
      setFlickerIntensity(0.96 + Math.random() * 0.04);
    }, 120 + Math.random() * 60);
    return () => clearInterval(flickerInterval);
  }, [entered]);

  const emphasis = token.emphasis || 'normal';
  const fontWeight = emphasis === 'strong' ? 700 : emphasis === 'subtle' ? 500 : 400;
  const scale = emphasis === 'strong' ? 1.05 : 1;

  // Add trailing space for word separation
  const displayText = token.text + ' ';

  // Strong words get a breathing glow CSS class after entrance
  const glowClass = entered && emphasis === 'strong' ? 'kinetic-glow-breathe' : '';

  return (
    <span
      className={`inline transition-all duration-300 ease-out ${glowClass}`}
      style={{
        opacity: entered ? flickerIntensity : 0,
        transform: entered
          ? `translateY(0) scale(${scale})`
          : 'translateY(15px) scale(0.85)',
        color: colors.primary,
        textShadow: entered
          ? emphasis === 'strong'
            ? `0 0 12px ${colors.glow}, 0 0 4px ${colors.primary}, 0 0 25px ${colors.glow}60`
            : `0 0 8px ${colors.glow}, 0 0 2px ${colors.primary}`
          : 'none',
        fontWeight,
        fontSize: `${fontSize}px`,
        letterSpacing: emphasis === 'strong' ? '0.08em' : '0.05em',
        whiteSpace: 'pre',
        // CSS custom property for glow color used by animation
        '--glow-color': colors.glow,
        '--primary-color': colors.primary,
      } as React.CSSProperties}
    >
      {displayText}
    </span>
  );
};

// =============================================================================
// KINETIC TEXT COMPONENT - 80s AI Assistant Aesthetic
// =============================================================================

export const KineticText: React.FC<KineticTextProps> = ({
  phosphorColor = 'amber',
  maxWidth = 800,
  maxHeight = 400,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState(48);
  const [isVisible, setIsVisible] = useState(false);
  const [cursorBlink, setCursorBlink] = useState(true);

  // Get state from store
  const displayContent = useVoice31Store((s) => s.displayContent);
  const assistantText = useVoice31Store((s) => s.assistantText);
  const userTranscript = useVoice31Store((s) => s.userTranscript);
  const isListening = useVoice31Store((s) => s.isListening);
  const isSpeaking = useVoice31Store((s) => s.isSpeaking);

  const colors = useMemo(() => getPhosphorColors(phosphorColor), [phosphorColor]);

  // Cursor blink effect
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setCursorBlink((prev) => !prev);
    }, 530);
    return () => clearInterval(blinkInterval);
  }, []);

  // Determine what text to display
  const displayText = useMemo(() => {
    if (displayContent.type === 'text' && displayContent.text) {
      return displayContent.text;
    }
    if (displayContent.type === 'generating') {
      return displayContent.imagePrompt || 'Generating...';
    }
    if (assistantText && assistantText !== 'VOICE26') {
      return assistantText;
    }
    if (isListening && userTranscript) {
      return userTranscript;
    }
    return '';
  }, [displayContent, assistantText, userTranscript, isListening]);

  // Parse text into tokens with semantic emphasis scoring
  const tokens = useMemo((): WordToken[] => {
    if (!displayText) return [];

    const words = displayText.split(/\s+/).filter(Boolean);
    const result: WordToken[] = [];
    let delay = 0;

    // Pre-scan: find sentence boundaries for sentence-end emphasis
    const sentenceEndIndices = new Set<number>();
    let contentWordTracker = -1;
    for (let i = words.length - 1; i >= 0; i--) {
      const w = words[i];
      const endsWithPunctuation = /[.!?;:]$/.test(w);
      const isNextSentenceStart = i < words.length - 1 && sentenceEndIndices.has(i + 1) === false;

      if (endsWithPunctuation || i === words.length - 1) {
        // Walk back to find last content word before this punctuation
        for (let j = i; j >= 0; j--) {
          const clean = words[j].toLowerCase().replace(/[^a-z]/g, '');
          if (clean && !STOP_WORDS.has(clean)) {
            sentenceEndIndices.add(j);
            break;
          }
        }
      }
    }

    words.forEach((word, index) => {
      const cleanWord = word.toLowerCase().replace(/[^a-z']/g, '');

      // Emphasis scoring
      const isAllCaps = word === word.toUpperCase() && word.length > 2 && /[A-Z]/.test(word);
      const hasExclamation = word.includes('!');
      const isPowerWord = POWER_WORDS.has(cleanWord);
      const isStopWord = STOP_WORDS.has(cleanWord);
      const isSentenceEnd = sentenceEndIndices.has(index);
      const isLongWord = cleanWord.length >= 8;

      let emphasis: 'strong' | 'subtle' | 'normal' = 'normal';

      if (isStopWord) {
        emphasis = 'normal'; // NEVER emphasize stop words
      } else if (isPowerWord || isAllCaps || hasExclamation) {
        emphasis = 'strong';
      } else if (isSentenceEnd || isLongWord) {
        emphasis = 'subtle';
      }

      // Dramatic beat: strong words get a 50ms pause before them
      if (emphasis === 'strong' && index > 0) {
        delay += 50;
      }

      result.push({
        text: word,
        emphasis,
        delay,
      });

      // Consistent acceleration feel instead of random jitter
      delay += 50 + (index * 5);
    });

    return result;
  }, [displayText]);

  // Calculate font size to fit content
  useEffect(() => {
    if (!containerRef.current || tokens.length === 0) return;

    const textLength = tokens.reduce((acc, t) => acc + (t.text?.length || 2) + 1, 0); // +1 for spaces
    const avgCharsPerLine = Math.floor(maxWidth / 20); // Rough chars that fit
    const lineCount = Math.ceil(textLength / avgCharsPerLine);

    // Calculate optimal font size
    const widthBasedSize = (maxWidth / avgCharsPerLine) * 1.4;
    const heightBasedSize = maxHeight / (lineCount * 1.8);
    const newSize = Math.min(Math.max(Math.min(widthBasedSize, heightBasedSize), 28), 64);

    setFontSize(newSize);
  }, [tokens, maxWidth, maxHeight]);

  // Trigger visibility on content change
  useEffect(() => {
    setIsVisible(false);
    const timer = setTimeout(() => setIsVisible(true), 80);
    return () => clearTimeout(timer);
  }, [displayText]);

  // Idle state - minimal, elegant, no verbose status text
  if (tokens.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 font-mono">
        {/* Subtle presence indicator - no status announcements */}
        <div
          className="flex items-center justify-center gap-3"
          style={{
            color: colors.primary,
            textShadow: `0 0 15px ${colors.glow}`,
          }}
        >
          {/* Breathing dot indicator */}
          <div
            className="w-3 h-3 rounded-full transition-all duration-700"
            style={{
              backgroundColor: colors.primary,
              boxShadow: `0 0 ${isSpeaking || isListening ? '20px' : '10px'} ${colors.glow}`,
              opacity: isSpeaking ? 1 : isListening ? 0.8 : 0.4,
              transform: `scale(${isSpeaking ? 1.3 : isListening ? 1.1 : 1})`,
            }}
          />

          {/* Blinking cursor only - no text */}
          <span
            className="text-2xl tracking-[0.3em] font-light"
            style={{
              opacity: cursorBlink ? 0.7 : 0.2,
              transition: 'opacity 0.15s',
            }}
          >
            ▌
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="font-mono leading-loose text-center"
      style={{
        maxWidth,
        maxHeight,
        overflow: 'hidden',
        lineHeight: 1.8,
      }}
    >
      {/* Breathing glow animation for strong-emphasis words */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes kineticGlowBreathe {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.15); }
        }
        .kinetic-glow-breathe {
          animation: kineticGlowBreathe 4s ease-in-out infinite;
        }
      `}} />

      {tokens.map((token, index) => (
        <KineticWord
          key={`${token.text}-${index}-${displayText.slice(0, 10)}`}
          token={token}
          colors={colors}
          isVisible={isVisible}
          fontSize={fontSize}
          wordIndex={index}
        />
      ))}
      {/* Trailing cursor */}
      <span
        className="inline-block transition-opacity duration-100"
        style={{
          color: colors.primary,
          fontSize: `${fontSize}px`,
          opacity: cursorBlink && isVisible ? 0.8 : 0,
          textShadow: `0 0 8px ${colors.glow}`,
        }}
      >
        ▌
      </span>
    </div>
  );
};

export default KineticText;
