/**
 * SemanticTextAnalyzer
 *
 * Analyzes incoming text to detect linguistic patterns, emotional states,
 * and narrative context. This is the brain that decides HOW text should perform.
 *
 * Detects:
 * - Elongated vowels ("ohhhhh")
 * - Stuttering ("w-w-wait")
 * - ALL CAPS emphasis
 * - Punctuation patterns (!!!, ???, ...)
 * - Onomatopoeia (BOOM, whoosh)
 * - Rhetorical structures
 * - Emotional keywords
 * - Narrative beats
 */

import {
  SemanticUnit,
  CharacterData,
  AnalysisResult,
  LinguisticPattern,
  EmotionalState,
  NarrativeContext,
} from './types';

// =============================================================================
// PATTERN DETECTION RULES
// =============================================================================

const ONOMATOPOEIA = new Set([
  'boom', 'bang', 'crash', 'pow', 'wham', 'bam', 'slam', 'thud', 'thump',
  'whoosh', 'swoosh', 'swish', 'zoom', 'zip', 'whiz', 'buzz', 'hum',
  'splash', 'splat', 'drip', 'plop', 'gurgle', 'slosh',
  'crack', 'snap', 'pop', 'crunch', 'crackle', 'sizzle', 'fizz',
  'click', 'clack', 'tick', 'tock', 'ding', 'ring', 'ping', 'beep',
  'hiss', 'shhh', 'psst', 'shush', 'whisper',
  'growl', 'roar', 'howl', 'bark', 'meow', 'moo', 'oink',
  'ha', 'haha', 'hahaha', 'lol', 'heh', 'pfft', 'ugh', 'argh', 'oof',
  'wow', 'whoa', 'ooh', 'aah', 'eek', 'yikes', 'oops', 'phew',
]);

const EMOTION_KEYWORDS: Record<string, EmotionalState> = {
  // Shock
  'shocked': 'shock', 'stunned': 'shock', 'unbelievable': 'shock', 'insane': 'shock',
  'crazy': 'shock', 'wtf': 'shock', 'omg': 'shock', 'holy': 'shock',
  // Joy
  'happy': 'joy', 'amazing': 'joy', 'wonderful': 'joy', 'fantastic': 'joy',
  'love': 'joy', 'awesome': 'joy', 'incredible': 'joy', 'beautiful': 'joy',
  'perfect': 'joy', 'great': 'joy', 'excellent': 'joy', 'brilliant': 'joy',
  // Anger
  'angry': 'anger', 'furious': 'anger', 'hate': 'anger', 'stupid': 'anger',
  'ridiculous': 'anger', 'annoying': 'anger', 'frustrating': 'frustration',
  // Sadness
  'sad': 'sadness', 'sorry': 'sadness', 'unfortunately': 'sadness', 'tragic': 'sadness',
  'heartbreaking': 'sadness', 'devastating': 'sadness', 'loss': 'sadness',
  // Fear
  'scared': 'fear', 'terrifying': 'fear', 'horrifying': 'fear', 'nightmare': 'fear',
  'creepy': 'fear', 'dangerous': 'fear', 'warning': 'fear',
  // Excitement
  'exciting': 'excitement', 'thrilling': 'excitement', 'can\'t wait': 'excitement',
  // Awe
  'breathtaking': 'awe', 'magnificent': 'awe', 'spectacular': 'awe', 'majestic': 'awe',
  // Confusion
  'confused': 'confusion', 'weird': 'confusion', 'strange': 'confusion', 'huh': 'confusion',
  // Confidence
  'definitely': 'confidence', 'absolutely': 'confidence', 'certainly': 'confidence',
  'obviously': 'confidence', 'clearly': 'confidence',
  // Sarcasm indicators
  'sure': 'sarcasm', 'right': 'sarcasm', 'totally': 'sarcasm', 'yeah right': 'sarcasm',
};

const CLIMAX_INDICATORS = new Set([
  'finally', 'suddenly', 'then', 'but', 'however', 'until', 'when',
  'realized', 'discovered', 'revealed', 'truth', 'actually',
]);

// =============================================================================
// SEMANTIC TEXT ANALYZER CLASS
// =============================================================================

export class SemanticTextAnalyzer {
  private wordIndex = 0;
  private estimatedWPM = 320; // fast pacing — text arrives as full sentence, don't drip-feed

  /**
   * Main analysis entry point
   */
  analyze(text: string): AnalysisResult {
    this.wordIndex = 0;

    // Tokenize into semantic units (words/phrases)
    const tokens = this.tokenize(text);
    const individualUnits = tokens.map((token, idx) =>
      this.analyzeUnit(token, idx, tokens.length)
    );

    // Group consecutive low-intensity words into multi-word phrases
    // This prevents the "one word at a time" effect for conversational text
    const units = this.groupIntoPhrases(individualUnits);

    // Detect overall patterns
    const overallEmotion = this.detectOverallEmotion(units);
    const narrativeContext = this.detectNarrativeContext(text, units);
    const climaxIndex = this.findClimaxIndex(units);

    return {
      units,
      overallEmotion,
      narrativeContext,
      hasDramaticMoments: units.some(u => u.intensity > 0.7),
      climaxIndex,
      totalDuration: this.estimateTotalDuration(units),
    };
  }

  /**
   * Group consecutive low/medium-intensity words into multi-word phrases.
   * High-intensity words, special patterns, and clause boundaries break groups.
   *
   * This creates a natural mix: casual speech becomes readable phrases,
   * while dramatic moments remain as standalone words.
   */
  private groupIntoPhrases(units: SemanticUnit[]): SemanticUnit[] {
    if (units.length <= 2) return units;

    const INTENSITY_THRESHOLD = 0.42;     // lower threshold → more solo expressive words
    const MAX_PHRASE_WORDS = 3;           // shorter phrases preserve per-word dynamicism
    const SOLO_PATTERNS: Set<LinguisticPattern> = new Set([
      'all_caps_emphasis', 'onomatopoeia', 'exclamation_burst',
      'elongated_vowel', 'stuttered', 'whispered_aside',
      'dramatic_pause', 'pause_beat',
    ]);

    // Clause-ending punctuation that breaks groups
    const CLAUSE_BREAK_PUNCT = new Set(['.', ',', ';', ':', '!', '?']);

    const result: SemanticUnit[] = [];
    let currentGroup: SemanticUnit[] = [];

    const flushGroup = () => {
      if (currentGroup.length === 0) return;

      if (currentGroup.length === 1) {
        result.push(currentGroup[0]);
      } else {
        result.push(this.mergeUnitsIntoPhrase(currentGroup));
      }
      currentGroup = [];
    };

    for (let i = 0; i < units.length; i++) {
      const unit = units[i];

      // Check if this word should stay solo
      const isSolo = (
        unit.intensity >= INTENSITY_THRESHOLD ||
        SOLO_PATTERNS.has(unit.pattern) ||
        unit.emotion !== 'neutral'
      );

      if (isSolo) {
        // Flush current group, then add this as solo
        flushGroup();
        result.push(unit);
        continue;
      }

      // Add to current group
      currentGroup.push(unit);

      // Check if we should break the group
      const hasClauseBreak = unit.metadata.punctuation.some(p => CLAUSE_BREAK_PUNCT.has(p));
      const groupFull = currentGroup.length >= MAX_PHRASE_WORDS;
      const isLastUnit = i === units.length - 1;

      // Check if next word is high-intensity (break before it)
      const nextIsSolo = i + 1 < units.length && (
        units[i + 1].intensity >= INTENSITY_THRESHOLD ||
        SOLO_PATTERNS.has(units[i + 1].pattern) ||
        units[i + 1].emotion !== 'neutral'
      );

      if (hasClauseBreak || groupFull || isLastUnit || nextIsSolo) {
        flushGroup();
      }
    }

    flushGroup();

    // Re-index the units
    for (let i = 0; i < result.length; i++) {
      result[i].metadata.wordIndex = i;
      result[i].metadata.totalWords = result.length;
      result[i].metadata.position = i === 0 ? 'start' : i === result.length - 1 ? 'end' : 'middle';
    }

    return result;
  }

  /**
   * Merge multiple SemanticUnits into a single phrase unit.
   * Takes the combined text, timing from first-to-last, and
   * aggregate properties.
   */
  private mergeUnitsIntoPhrase(units: SemanticUnit[]): SemanticUnit {
    const first = units[0];
    const last = units[units.length - 1];

    // Combined text with spaces
    const text = units.map(u => u.text).join(' ');

    // Build character data for the full phrase
    const characters = this.buildCharacterData(text);

    // Intensity: preserve the peak — phrases should still feel dynamic
    const maxIntensity = Math.max(...units.map(u => u.intensity));
    const avgIntensity = units.reduce((sum, u) => sum + u.intensity, 0) / units.length;
    const intensity = avgIntensity * 0.3 + maxIntensity * 0.7;

    // Emotion: first non-neutral emotion, or neutral
    const dominantEmotion = units.find(u => u.emotion !== 'neutral')?.emotion || 'neutral';

    // Timing spans from first to last
    const startTime = first.startTime;
    const duration = (last.startTime + last.duration) - first.startTime;

    // Collect all punctuation
    const allPunct = units.flatMap(u => u.metadata.punctuation).filter(Boolean);

    return {
      id: `phrase-${first.id}`,
      text,
      characters,
      pattern: 'normal',
      emotion: dominantEmotion,
      intensity,
      isEmphasis: false,
      startTime,
      duration,
      metadata: {
        isAllCaps: false,
        hasElongation: false,
        elongationFactor: 1,
        punctuation: allPunct,
        isQuoted: false,
        isParenthetical: false,
        position: first.metadata.position,
        wordIndex: first.metadata.wordIndex,
        totalWords: first.metadata.totalWords,
      },
    };
  }

  /**
   * Tokenize text into words while preserving important patterns
   */
  private tokenize(text: string): string[] {
    const tokens: string[] = [];

    // Split but keep punctuation attached
    const rawTokens = text.match(/[\w'-]+[.,!?;:]*|\.\.\.|[.,!?;:]+|["'()[\]{}]/g) || [];

    for (const token of rawTokens) {
      // Check for quoted speech - keep together
      if (token.startsWith('"') || token.startsWith("'")) {
        tokens.push(token);
        continue;
      }

      // Check for contractions - keep together
      if (token.includes("'")) {
        tokens.push(token);
        continue;
      }

      tokens.push(token);
    }

    return tokens;
  }

  /**
   * Analyze a single semantic unit (word/phrase)
   */
  private analyzeUnit(token: string, index: number, total: number): SemanticUnit {
    const id = `unit-${Date.now()}-${index}`;
    const cleanToken = token.replace(/[.,!?;:]+$/, '');
    const punctuation = token.match(/[.,!?;:]+$/)?.[0] || '';

    // Detect linguistic pattern
    const pattern = this.detectPattern(token, punctuation, index, total);

    // Detect emotion
    const emotion = this.detectEmotion(cleanToken, pattern, punctuation);

    // Calculate intensity
    const intensity = this.calculateIntensity(token, pattern, punctuation);

    // Build character data
    const characters = this.buildCharacterData(token);

    // Estimate timing
    const { startTime, duration } = this.estimateTiming(token, pattern, intensity);

    const position = index === 0 ? 'start' : index === total - 1 ? 'end' : 'middle';

    return {
      id,
      text: token,
      characters,
      pattern,
      emotion,
      intensity,
      isEmphasis: intensity > 0.6 || pattern !== 'normal',
      startTime,
      duration,
      metadata: {
        isAllCaps: this.isAllCaps(cleanToken),
        hasElongation: this.hasElongation(cleanToken),
        elongationFactor: this.getElongationFactor(cleanToken),
        punctuation: punctuation.split(''),
        isQuoted: token.startsWith('"') || token.startsWith("'"),
        isParenthetical: token.startsWith('('),
        position,
        wordIndex: index,
        totalWords: total,
      },
    };
  }

  /**
   * Detect the linguistic pattern of a token
   */
  private detectPattern(
    token: string,
    punctuation: string,
    index: number,
    total: number
  ): LinguisticPattern {
    const clean = token.replace(/[.,!?;:]+$/, '').toLowerCase();

    // Trailing off
    if (punctuation === '...') {
      return 'trailing_off';
    }

    // Dramatic pause (em-dash)
    if (token.includes('—') || token.includes('--')) {
      return 'dramatic_pause';
    }

    // Stuttering: w-w-wait, n-no
    if (/^(\w)-\1/.test(clean)) {
      return 'stuttered';
    }

    // Elongated vowels: ohhhhh, nooooo, yeahhhhh
    if (this.hasElongation(clean)) {
      return 'elongated_vowel';
    }

    // All caps emphasis
    if (this.isAllCaps(token.replace(/[.,!?;:]+$/, '')) && token.length > 1) {
      // Check if it's an onomatopoeia
      if (ONOMATOPOEIA.has(clean)) {
        return 'onomatopoeia';
      }
      return 'all_caps_emphasis';
    }

    // Exclamation burst
    if (punctuation.includes('!')) {
      if (punctuation.length > 1) {
        return 'exclamation_burst'; // Multiple !!!
      }
      return 'exclamation_burst';
    }

    // Question
    if (punctuation.includes('?')) {
      // Rhetorical if it's a common phrase
      const prevWords = index > 0 ? ['you', 'know', 'right', 'what'] : [];
      if (clean === 'right' || clean === 'what' || clean === 'huh') {
        return 'rhetorical_question';
      }
      return 'question_float';
    }

    // Onomatopoeia
    if (ONOMATOPOEIA.has(clean)) {
      return 'onomatopoeia';
    }

    // Parenthetical
    if (token.startsWith('(') || token.endsWith(')')) {
      return 'parenthetical';
    }

    // Quoted speech
    if (token.startsWith('"') || token.startsWith("'")) {
      return 'quoted_speech';
    }

    // Whispered aside (parenthetical at start or standalone)
    if (token.startsWith('(') && token.endsWith(')')) {
      return 'whispered_aside';
    }

    // Repetition check (would need context - simplified)
    // This would ideally look at surrounding tokens

    // Pause beat
    if (token === '...' || token === '…') {
      return 'pause_beat';
    }

    return 'normal';
  }

  /**
   * Detect emotional state of a token
   */
  private detectEmotion(
    token: string,
    pattern: LinguisticPattern,
    punctuation: string
  ): EmotionalState {
    const lower = token.toLowerCase();

    // Check keyword dictionary
    if (EMOTION_KEYWORDS[lower]) {
      return EMOTION_KEYWORDS[lower];
    }

    // Pattern-based emotion inference
    switch (pattern) {
      case 'all_caps_emphasis':
        return punctuation.includes('!') ? 'excitement' : 'confidence';
      case 'exclamation_burst':
        return 'excitement';
      case 'trailing_off':
        return 'sadness';
      case 'stuttered':
        return 'fear';
      case 'onomatopoeia':
        // Context-dependent, but default to excitement
        if (ONOMATOPOEIA.has(lower) && ['ugh', 'argh', 'oof'].includes(lower)) {
          return 'frustration';
        }
        return 'excitement';
      case 'whispered_aside':
        return 'tenderness';
      case 'rhetorical_question':
        return 'sarcasm';
      default:
        return 'neutral';
    }
  }

  /**
   * Calculate intensity (0-1) based on various factors
   */
  private calculateIntensity(
    token: string,
    pattern: LinguisticPattern,
    punctuation: string
  ): number {
    let intensity = 0.5; // baseline

    // All caps boost
    if (this.isAllCaps(token.replace(/[.,!?;:]+$/, '')) && token.length > 1) {
      intensity += 0.25;
    }

    // Punctuation boost
    intensity += punctuation.length * 0.1;

    // Elongation boost
    if (this.hasElongation(token)) {
      intensity += Math.min(this.getElongationFactor(token) * 0.1, 0.3);
    }

    // Pattern-specific boosts
    switch (pattern) {
      case 'onomatopoeia':
        intensity += 0.3;
        break;
      case 'exclamation_burst':
        intensity += 0.2;
        break;
      case 'sudden_realization':
        intensity += 0.35;
        break;
      case 'trailing_off':
        intensity -= 0.2;
        break;
      case 'whispered_aside':
        intensity -= 0.3;
        break;
    }

    return Math.max(0, Math.min(1, intensity));
  }

  /**
   * Build per-character data for animation
   */
  private buildCharacterData(token: string): CharacterData[] {
    const chars: CharacterData[] = [];
    let elongationStart = -1;
    let elongationCount = 0;

    for (let i = 0; i < token.length; i++) {
      const char = token[i];
      const isElongated = i > 0 && char === token[i - 1] && /[aeiouAEIOU]/.test(char);

      if (isElongated) {
        elongationCount++;
      } else {
        elongationCount = 0;
        elongationStart = i;
      }

      const wordPosition =
        token.length === 1
          ? 'only'
          : i === 0
            ? 'first'
            : i === token.length - 1
              ? 'last'
              : 'middle';

      chars.push({
        char,
        index: i,
        isSpace: char === ' ',
        isElongated,
        elongationIndex: isElongated ? elongationCount : 0,
        wordPosition,
      });
    }

    return chars;
  }

  /**
   * Estimate timing for a unit based on speech patterns
   */
  private estimateTiming(
    token: string,
    pattern: LinguisticPattern,
    intensity: number
  ): { startTime: number; duration: number } {
    const msPerWord = 60000 / this.estimatedWPM;
    const startTime = this.wordIndex * msPerWord;

    let duration = msPerWord;

    // Adjust duration based on pattern
    switch (pattern) {
      case 'elongated_vowel':
        duration *= 1.5 + this.getElongationFactor(token) * 0.3;
        break;
      case 'pause_beat':
        duration *= 2;
        break;
      case 'trailing_off':
        duration *= 1.8;
        break;
      case 'dramatic_pause':
        duration *= 2.5;
        break;
      case 'stuttered':
        duration *= 1.3;
        break;
    }

    // High intensity = slightly longer for impact
    duration *= 1 + intensity * 0.2;

    this.wordIndex++;

    return { startTime, duration };
  }

  /**
   * Check if text is all uppercase
   */
  private isAllCaps(text: string): boolean {
    const letters = text.replace(/[^a-zA-Z]/g, '');
    return letters.length > 0 && letters === letters.toUpperCase();
  }

  /**
   * Check if text has elongated vowels
   */
  private hasElongation(text: string): boolean {
    // Check for repeated vowels (3+ in a row)
    return /([aeiouAEIOU])\1{2,}/.test(text);
  }

  /**
   * Get the elongation factor (how many times the vowel repeats)
   */
  private getElongationFactor(text: string): number {
    const match = text.match(/([aeiouAEIOU])\1+/g);
    if (!match) return 1;
    const maxRepeat = Math.max(...match.map(m => m.length));
    return maxRepeat;
  }

  /**
   * Detect overall emotion from all units
   */
  private detectOverallEmotion(units: SemanticUnit[]): EmotionalState {
    const emotionCounts: Record<EmotionalState, number> = {} as any;

    for (const unit of units) {
      emotionCounts[unit.emotion] = (emotionCounts[unit.emotion] || 0) + unit.intensity;
    }

    // Find dominant emotion (excluding neutral)
    let maxEmotion: EmotionalState = 'neutral';
    let maxScore = 0;

    for (const [emotion, score] of Object.entries(emotionCounts)) {
      if (emotion !== 'neutral' && score > maxScore) {
        maxScore = score;
        maxEmotion = emotion as EmotionalState;
      }
    }

    return maxEmotion;
  }

  /**
   * Detect narrative context
   */
  private detectNarrativeContext(text: string, units: SemanticUnit[]): NarrativeContext {
    const lower = text.toLowerCase();

    // Check for quoted speech
    if (text.includes('"') || text.includes("'")) {
      return 'quote';
    }

    // Check for story climax indicators
    if (CLIMAX_INDICATORS.has(lower.split(' ')[0])) {
      return 'story_climax';
    }

    // Check for explanation patterns
    if (lower.includes('because') || lower.includes('therefore') || lower.includes('basically')) {
      return 'explanation';
    }

    // Check for memory/past
    if (lower.includes('remember') || lower.includes('used to') || lower.includes('back when')) {
      return 'memory';
    }

    // Check for prediction/future
    if (lower.includes('will') || lower.includes('going to') || lower.includes('might')) {
      return 'prediction';
    }

    // Check for confession
    if (lower.includes('honestly') || lower.includes('truth is') || lower.includes('actually')) {
      return 'confession';
    }

    // Default based on formality
    const avgIntensity = units.reduce((sum, u) => sum + u.intensity, 0) / units.length;
    return avgIntensity > 0.6 ? 'story_climax' : 'casual';
  }

  /**
   * Find the climax moment in the text
   */
  private findClimaxIndex(units: SemanticUnit[]): number | null {
    if (units.length === 0) return null;

    let maxIntensity = 0;
    let climaxIndex = null;

    for (let i = 0; i < units.length; i++) {
      const unit = units[i];

      // Weight later units slightly higher (climax usually near end)
      const positionWeight = 1 + (i / units.length) * 0.3;
      const score = unit.intensity * positionWeight;

      if (score > maxIntensity) {
        maxIntensity = score;
        climaxIndex = i;
      }
    }

    // Only return if there's a clear climax (intensity > 0.6)
    return maxIntensity > 0.6 ? climaxIndex : null;
  }

  /**
   * Estimate total duration of the text
   */
  private estimateTotalDuration(units: SemanticUnit[]): number {
    if (units.length === 0) return 0;
    const lastUnit = units[units.length - 1];
    return lastUnit.startTime + lastUnit.duration;
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export const analyzeText = (text: string): AnalysisResult => {
  const analyzer = new SemanticTextAnalyzer();
  return analyzer.analyze(text);
};
