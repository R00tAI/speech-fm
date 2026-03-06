/**
 * TypographyStyleSelector
 *
 * Maps emotional states and contexts to typography personalities.
 * Instead of everything being JetBrains Mono, this creates real
 * typographic variety: serif for editorial moments, display for
 * dramatic emphasis, clean sans for captions, mono for technical.
 *
 * Each emotion has a weighted pool of typography personalities,
 * and within each personality there's further randomization of
 * weight, spacing, and style to avoid repetition.
 */

import { EmotionalState, LinguisticPattern, NarrativeContext } from './types';

// =============================================================================
// TYPOGRAPHY PERSONALITIES
// =============================================================================

export type TypographyPersonality =
  | 'display'      // Heavy, impactful — for dramatic moments
  | 'editorial'    // Serif, authoritative — for confident, formal, tender
  | 'clean'        // Sans-serif, readable — for captions, casual, neutral
  | 'mono'         // Monospace, technical — for analytical, glitchy, CRT
  | 'condensed';   // Tight, energetic — for fast, excited, listing

export interface TypographyStyle {
  fontFamily: string;
  fontWeight: number;
  letterSpacing: number;    // em units
  italic: boolean;
  textTransform: 'none' | 'uppercase' | 'lowercase';
  personality: TypographyPersonality;
}

// Font stacks per personality (system fonts for reliability)
const FONT_STACKS: Record<TypographyPersonality, string[]> = {
  display: [
    'Impact, "Arial Black", sans-serif',
    '"Arial Black", Impact, sans-serif',
    '"Trebuchet MS", Impact, sans-serif',
  ],
  editorial: [
    'Georgia, "Palatino Linotype", serif',
    '"Palatino Linotype", Georgia, serif',
    '"Times New Roman", Georgia, serif',
    'Georgia, "Book Antiqua", serif',
  ],
  clean: [
    'system-ui, -apple-system, "Segoe UI", sans-serif',
    '"Segoe UI", system-ui, sans-serif',
    '"Trebuchet MS", "Segoe UI", sans-serif',
    'Verdana, system-ui, sans-serif',
  ],
  mono: [
    '"JetBrains Mono", "Courier New", monospace',
    '"Courier New", "JetBrains Mono", monospace',
    '"Consolas", "JetBrains Mono", monospace',
  ],
  condensed: [
    '"Arial Narrow", "Segoe UI", sans-serif',
    '"Segoe UI", system-ui, sans-serif',
    'Verdana, "Trebuchet MS", sans-serif',
  ],
};

// Weight ranges per personality
const WEIGHT_RANGES: Record<TypographyPersonality, { min: number; max: number; common: number[] }> = {
  display:   { min: 700, max: 900, common: [800, 900] },
  editorial: { min: 300, max: 700, common: [400, 500, 700] },
  clean:     { min: 300, max: 700, common: [400, 500, 600] },
  mono:      { min: 400, max: 600, common: [400, 500] },
  condensed: { min: 400, max: 700, common: [500, 600, 700] },
};

// Letter spacing ranges per personality (in em)
const SPACING_RANGES: Record<TypographyPersonality, { min: number; max: number }> = {
  display:   { min: 0.02, max: 0.12 },
  editorial: { min: 0.02, max: 0.15 },
  clean:     { min: 0, max: 0.06 },
  mono:      { min: 0, max: 0.02 },
  condensed: { min: -0.02, max: 0.02 },
};

// =============================================================================
// EMOTION → PERSONALITY MAPPING (weighted pools)
// =============================================================================

interface PersonalityWeight {
  personality: TypographyPersonality;
  weight: number;  // relative weight (higher = more likely)
}

const EMOTION_TYPOGRAPHY: Record<EmotionalState, PersonalityWeight[]> = {
  shock:         [{ personality: 'display', weight: 6 }, { personality: 'editorial', weight: 2 }, { personality: 'mono', weight: 2 }],
  joy:           [{ personality: 'clean', weight: 5 }, { personality: 'editorial', weight: 3 }, { personality: 'condensed', weight: 2 }],
  anger:         [{ personality: 'display', weight: 6 }, { personality: 'condensed', weight: 3 }, { personality: 'mono', weight: 1 }],
  sadness:       [{ personality: 'editorial', weight: 6 }, { personality: 'clean', weight: 3 }, { personality: 'mono', weight: 1 }],
  sarcasm:       [{ personality: 'editorial', weight: 5 }, { personality: 'clean', weight: 3 }, { personality: 'mono', weight: 2 }],
  confusion:     [{ personality: 'mono', weight: 5 }, { personality: 'clean', weight: 3 }, { personality: 'editorial', weight: 2 }],
  confidence:    [{ personality: 'editorial', weight: 5 }, { personality: 'display', weight: 3 }, { personality: 'clean', weight: 2 }],
  fear:          [{ personality: 'mono', weight: 5 }, { personality: 'editorial', weight: 3 }, { personality: 'condensed', weight: 2 }],
  relief:        [{ personality: 'clean', weight: 5 }, { personality: 'editorial', weight: 4 }, { personality: 'condensed', weight: 1 }],
  awe:           [{ personality: 'editorial', weight: 6 }, { personality: 'clean', weight: 3 }, { personality: 'display', weight: 1 }],
  excitement:    [{ personality: 'condensed', weight: 4 }, { personality: 'display', weight: 3 }, { personality: 'clean', weight: 3 }],
  tenderness:    [{ personality: 'editorial', weight: 7 }, { personality: 'clean', weight: 3 }],
  frustration:   [{ personality: 'display', weight: 5 }, { personality: 'condensed', weight: 3 }, { personality: 'mono', weight: 2 }],
  curiosity:     [{ personality: 'clean', weight: 5 }, { personality: 'editorial', weight: 3 }, { personality: 'mono', weight: 2 }],
  determination: [{ personality: 'display', weight: 4 }, { personality: 'editorial', weight: 4 }, { personality: 'condensed', weight: 2 }],
  neutral:       [{ personality: 'clean', weight: 6 }, { personality: 'editorial', weight: 2 }, { personality: 'mono', weight: 2 }],
};

// =============================================================================
// PATTERN OVERRIDES
// =============================================================================

// Some patterns have strong typography associations regardless of emotion
const PATTERN_PERSONALITY_OVERRIDES: Partial<Record<LinguisticPattern, TypographyPersonality>> = {
  all_caps_emphasis: 'display',
  onomatopoeia: 'display',
  whispered_aside: 'editorial',
  trailing_off: 'editorial',
  stuttered: 'mono',
  quoted_speech: 'editorial',
};

// =============================================================================
// TYPOGRAPHY STYLE SELECTOR CLASS
// =============================================================================

export class TypographyStyleSelector {
  private recentPersonalities: TypographyPersonality[] = [];
  private recentFontStacks: string[] = [];
  private maxHistory = 4;

  /**
   * Select a typography style for a semantic unit
   */
  selectStyle(
    emotion: EmotionalState,
    pattern: LinguisticPattern,
    intensity: number,
    isPhrase: boolean = false,
  ): TypographyStyle {
    // Determine personality
    const personality = this.selectPersonality(emotion, pattern, intensity, isPhrase);

    // Select font stack (avoid repeating the exact same one)
    const fontFamily = this.selectFontStack(personality);

    // Select weight with variance
    const fontWeight = this.selectWeight(personality, emotion, intensity);

    // Select letter spacing with variance
    const letterSpacing = this.selectLetterSpacing(personality, emotion, intensity);

    // Italic decision
    const italic = this.shouldBeItalic(emotion, pattern, intensity);

    // Text transform
    const textTransform = this.selectTextTransform(pattern, intensity);

    // Record for anti-repetition
    this.recordSelection(personality, fontFamily);

    return {
      fontFamily,
      fontWeight,
      letterSpacing,
      italic,
      textTransform,
      personality,
    };
  }

  /**
   * Select personality from weighted pool
   */
  private selectPersonality(
    emotion: EmotionalState,
    pattern: LinguisticPattern,
    intensity: number,
    isPhrase: boolean,
  ): TypographyPersonality {
    // Pattern overrides take priority for strong matches
    if (PATTERN_PERSONALITY_OVERRIDES[pattern] && intensity > 0.5) {
      return PATTERN_PERSONALITY_OVERRIDES[pattern]!;
    }

    // Phrases (multi-word) lean toward clean/editorial for readability
    if (isPhrase && intensity < 0.6) {
      const phrasePool: PersonalityWeight[] = [
        { personality: 'clean', weight: 5 },
        { personality: 'editorial', weight: 4 },
        { personality: 'mono', weight: 1 },
      ];
      return this.weightedSelect(phrasePool);
    }

    // Get emotion's pool
    const pool = EMOTION_TYPOGRAPHY[emotion];

    // Boost variety: reduce weight of recently used personalities
    const adjusted = pool.map(pw => {
      const recentCount = this.recentPersonalities.filter(p => p === pw.personality).length;
      return {
        ...pw,
        weight: Math.max(0.5, pw.weight - recentCount * 1.5),
      };
    });

    return this.weightedSelect(adjusted);
  }

  /**
   * Weighted random selection from pool
   */
  private weightedSelect(pool: PersonalityWeight[]): TypographyPersonality {
    const totalWeight = pool.reduce((sum, pw) => sum + pw.weight, 0);
    let random = Math.random() * totalWeight;

    for (const pw of pool) {
      random -= pw.weight;
      if (random <= 0) return pw.personality;
    }

    return pool[0].personality;
  }

  /**
   * Select a font stack, avoiding recent repeats
   */
  private selectFontStack(personality: TypographyPersonality): string {
    const stacks = FONT_STACKS[personality];
    const available = stacks.filter(s => !this.recentFontStacks.includes(s));
    const pool = available.length > 0 ? available : stacks;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  /**
   * Select font weight with variance
   */
  private selectWeight(
    personality: TypographyPersonality,
    emotion: EmotionalState,
    intensity: number,
  ): number {
    const range = WEIGHT_RANGES[personality];

    // High intensity leans toward heavier weights
    if (intensity > 0.75) {
      const heavy = range.common.filter(w => w >= 600);
      if (heavy.length > 0) return heavy[Math.floor(Math.random() * heavy.length)];
    }

    // Low intensity leans toward lighter weights
    if (intensity < 0.35) {
      const light = range.common.filter(w => w <= 500);
      if (light.length > 0) return light[Math.floor(Math.random() * light.length)];
    }

    // Random from common weights
    return range.common[Math.floor(Math.random() * range.common.length)];
  }

  /**
   * Select letter spacing with variance
   */
  private selectLetterSpacing(
    personality: TypographyPersonality,
    emotion: EmotionalState,
    intensity: number,
  ): number {
    const range = SPACING_RANGES[personality];

    // Awe and sadness use wider spacing
    if (emotion === 'awe' || emotion === 'sadness' || emotion === 'relief') {
      return range.min + (range.max - range.min) * (0.6 + Math.random() * 0.4);
    }

    // Anger and frustration use tighter spacing
    if (emotion === 'anger' || emotion === 'frustration') {
      return range.min + (range.max - range.min) * Math.random() * 0.3;
    }

    // Default: random within range with slight intensity bias
    const t = 0.3 + intensity * 0.4 + Math.random() * 0.3;
    return range.min + (range.max - range.min) * t;
  }

  /**
   * Decide if text should be italic
   */
  private shouldBeItalic(
    emotion: EmotionalState,
    pattern: LinguisticPattern,
    intensity: number,
  ): boolean {
    // Sarcasm is often italic
    if (emotion === 'sarcasm') return Math.random() < 0.7;

    // Whispered/aside content is italic
    if (pattern === 'whispered_aside' || pattern === 'parenthetical') return true;

    // Trailing off can be italic
    if (pattern === 'trailing_off') return Math.random() < 0.5;

    // Tenderness sometimes italic
    if (emotion === 'tenderness') return Math.random() < 0.3;

    // Quoted speech
    if (pattern === 'quoted_speech') return Math.random() < 0.4;

    return false;
  }

  /**
   * Select text transform
   */
  private selectTextTransform(
    pattern: LinguisticPattern,
    intensity: number,
  ): 'none' | 'uppercase' | 'lowercase' {
    if (pattern === 'all_caps_emphasis' || pattern === 'onomatopoeia') {
      return 'uppercase';
    }

    // Very high intensity has a chance of uppercase
    if (intensity > 0.85) return Math.random() < 0.4 ? 'uppercase' : 'none';

    // Very low intensity whispers could be lowercase
    if (pattern === 'whispered_aside' && Math.random() < 0.3) return 'lowercase';

    return 'none';
  }

  /**
   * Record selection for anti-repetition
   */
  private recordSelection(personality: TypographyPersonality, fontStack: string): void {
    this.recentPersonalities.push(personality);
    if (this.recentPersonalities.length > this.maxHistory) {
      this.recentPersonalities.shift();
    }

    this.recentFontStacks.push(fontStack);
    if (this.recentFontStacks.length > this.maxHistory) {
      this.recentFontStacks.shift();
    }
  }

  /**
   * Reset state
   */
  reset(): void {
    this.recentPersonalities = [];
    this.recentFontStacks = [];
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export const typographySelector = new TypographyStyleSelector();
