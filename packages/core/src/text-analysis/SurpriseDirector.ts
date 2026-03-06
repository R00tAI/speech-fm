/**
 * SurpriseDirector
 *
 * The creative director that decides when to deploy "magic moments" -
 * unexpected, delightful typography behaviors that make users say "whoa".
 *
 * Manages:
 * - Surprise budget (don't overdo it)
 * - Escalation awareness (save big moments for climax)
 * - Animation variety (avoid repetition)
 * - Callback detection (words that should return)
 * - Fourth-wall breaking decisions
 */

import {
  MagicMoment,
  SemanticUnit,
  AnimationDirective,
  SurpriseState,
  AnalysisResult,
  EmotionalState,
  EntranceAnimation,
} from './types';

// =============================================================================
// MAGIC MOMENT DEFINITIONS
// =============================================================================

interface MagicMomentConfig {
  // When to consider this moment
  triggers: {
    patterns?: string[];           // regex patterns in text
    emotions?: EmotionalState[];   // triggering emotions
    intensity?: number;            // minimum intensity
    position?: 'start' | 'middle' | 'end' | 'any';
    requiresContext?: boolean;     // needs conversation history
  };
  // How expensive is this surprise (affects budget)
  cost: number;                    // 0-1
  // Cooldown before can be used again (ms)
  cooldown: number;
  // Implementation
  apply: (unit: SemanticUnit, directive: AnimationDirective, context: SurpriseContext) => MagicMomentResult;
}

interface SurpriseContext {
  conversationHistory: string[];
  recentSurprises: MagicMoment[];
  currentTime: number;
  escalationLevel: number;
  analysisResult: AnalysisResult;
}

interface MagicMomentResult {
  directive: AnimationDirective;
  additionalUnits?: SemanticUnit[];    // extra units to render (like callbacks)
  globalEffect?: 'screen_shake' | 'flash' | 'vignette';
  description: string;                  // for debugging/logging
}

// =============================================================================
// MAGIC MOMENT IMPLEMENTATIONS
// =============================================================================

const MAGIC_MOMENTS: Record<MagicMoment, MagicMomentConfig> = {
  callback: {
    triggers: {
      patterns: ['remember', 'earlier', 'before', 'again', 'like i said', 'as i mentioned'],
      requiresContext: true,
    },
    cost: 0.3,
    cooldown: 30000,
    apply: (unit, directive, context) => {
      // Find a word from earlier in the conversation to bring back
      const keywords = extractKeywords(context.conversationHistory);
      if (keywords.length === 0) {
        // No keywords to callback — just enhance the entrance
        return {
          directive: { ...directive, entrance: 'slide_left' as EntranceAnimation },
          description: 'Callback: no keywords available',
        };
      }
      const callbackWord = keywords[Math.floor(Math.random() * keywords.length)];
      const wordLen = callbackWord.length;

      // The callback word slides in from the side
      const callbackUnit: SemanticUnit = {
        ...unit,
        id: `callback-${unit.id}`,
        text: callbackWord,
        characters: callbackWord.split('').map((c, i) => ({
          char: c,
          index: i,
          isSpace: c === ' ',
          isElongated: false,
          elongationIndex: 0,
          wordPosition: wordLen === 1 ? 'only' as any : i === 0 ? 'first' : i === wordLen - 1 ? 'last' : 'middle',
        })),
      };

      return {
        directive: {
          ...directive,
          entrance: 'slide_left' as EntranceAnimation,
        },
        additionalUnits: [callbackUnit],
        description: `Callback: "${callbackWord}" returns from earlier`,
      };
    },
  },

  underline_grow: {
    triggers: {
      emotions: ['confidence', 'determination'],
      intensity: 0.7,
      position: 'end',
    },
    cost: 0.15,
    cooldown: 10000,
    apply: (unit, directive, _context) => {
      return {
        directive: {
          ...directive,
          entrance: 'cinematic_reveal' as EntranceAnimation,
          effects: [...directive.effects, 'neon_glow', 'chrome_shimmer'],
          continuous: 'glow_breathe',
        },
        description: 'Cinematic reveal with chrome shimmer underline',
      };
    },
  },

  thought_bubble: {
    triggers: {
      patterns: ['\\(.*\\)', 'thinking', 'wondering', 'maybe'],
      emotions: ['curiosity', 'confusion'],
    },
    cost: 0.2,
    cooldown: 15000,
    apply: (unit, directive, _context) => {
      return {
        directive: {
          ...directive,
          entrance: 'balloon_float' as EntranceAnimation,
          style: {
            ...directive.style,
            scale: directive.style.scale * 0.8,
            opacity: 0.9,
          },
          continuous: 'hover',
        },
        description: 'Thought appears in floating bubble style',
      };
    },
  },

  redaction: {
    triggers: {
      patterns: ['actually', 'wait', 'no', 'i mean', 'correction', 'sorry'],
    },
    cost: 0.25,
    cooldown: 20000,
    apply: (unit, directive, _context) => {
      // First show wrong word, then scribble, then correct
      return {
        directive: {
          ...directive,
          entrance: 'glitch_in' as EntranceAnimation,
          effects: [...directive.effects, 'chromatic_aberration'],
          timing: {
            ...directive.timing,
            entranceDuration: directive.timing.entranceDuration * 1.5,
          },
        },
        description: 'Text appears to be corrected/redacted',
      };
    },
  },

  split_personality: {
    triggers: {
      patterns: ['but also', 'on one hand', 'part of me', 'conflicted'],
      emotions: ['confusion'],
    },
    cost: 0.4,
    cooldown: 45000,
    apply: (unit, directive, _context) => {
      // Split text appears on opposite sides
      return {
        directive: {
          ...directive,
          entrance: 'scatter_gather' as EntranceAnimation,
          effects: [...directive.effects, 'ghost_trail'],
        },
        description: 'Conflicting thoughts appear on opposite sides',
      };
    },
  },

  zoom_punch: {
    triggers: {
      emotions: ['shock', 'anger', 'excitement'],
      intensity: 0.85,
    },
    cost: 0.35,
    cooldown: 25000,
    apply: (unit, directive, _context) => {
      // Randomly pick between zoom_punch, impact_slam, cinematic_flash for variety
      const entrances: EntranceAnimation[] = ['zoom_punch', 'impact_slam', 'cinematic_flash'];
      const chosen = entrances[Math.floor(Math.random() * entrances.length)];
      return {
        directive: {
          ...directive,
          entrance: chosen,
          style: {
            ...directive.style,
            scale: directive.style.scale * 1.5,
          },
        },
        globalEffect: 'screen_shake',
        description: `Camera ${chosen} into word dramatically`,
      };
    },
  },

  letter_swap: {
    triggers: {
      patterns: ['transform', 'change', 'become', 'turn into', 'morph'],
    },
    cost: 0.3,
    cooldown: 30000,
    apply: (unit, directive, _context) => {
      // Use liquid_morph for transform-themed moments
      return {
        directive: {
          ...directive,
          entrance: 'liquid_morph' as EntranceAnimation,
          timing: {
            ...directive.timing,
            staggerPerChar: 80,
          },
        },
        description: 'Letters morph fluidly into arrangement',
      };
    },
  },

  ghost_echo: {
    triggers: {
      patterns: ['echo', 'repeat', 'again', 'and again'],
      emotions: ['awe', 'fear'],
    },
    cost: 0.2,
    cooldown: 20000,
    apply: (unit, directive, _context) => {
      return {
        directive: {
          ...directive,
          entrance: 'smoke_form' as EntranceAnimation,
          effects: [...directive.effects, 'ghost_trail', 'neon_layers'],
          continuous: 'lfo_modulate',
        },
        description: 'Word forms from smoke with fading afterimages',
      };
    },
  },

  magnetic_poetry: {
    triggers: {
      patterns: ['rearrange', 'organize', 'sort', 'order'],
    },
    cost: 0.25,
    cooldown: 25000,
    apply: (unit, directive, _context) => {
      return {
        directive: {
          ...directive,
          entrance: 'magnetic_pull' as EntranceAnimation,
          timing: {
            ...directive.timing,
            staggerPerChar: 80,
          },
        },
        description: 'Words rearrange like magnetic poetry',
      };
    },
  },

  fourth_wall: {
    triggers: {
      patterns: ['you', 'reading this', 'listening', 'watching', 'right\\?$'],
      emotions: ['sarcasm'],
      position: 'end',
    },
    cost: 0.35,
    cooldown: 60000,
    apply: (unit, directive, _context) => {
      // Text tilts toward viewer, maybe winks
      return {
        directive: {
          ...directive,
          entrance: 'pendulum_swing' as EntranceAnimation,
          style: {
            ...directive.style,
            rotation: 5,
          },
          continuous: 'subtle_rotate',
        },
        description: 'Text breaks fourth wall, acknowledges viewer',
      };
    },
  },

  typewriter_jam: {
    triggers: {
      patterns: ['stuck', 'frozen', 'can\'t', 'won\'t', 'error'],
      emotions: ['frustration'],
    },
    cost: 0.2,
    cooldown: 20000,
    apply: (unit, directive, _context) => {
      return {
        directive: {
          ...directive,
          entrance: 'typewriter' as EntranceAnimation,
          effects: [...directive.effects, 'chromatic_aberration', 'retro_crt'],
          continuous: 'jitter',
        },
        description: 'Typewriter effect with CRT glitch and stuck letters',
      };
    },
  },

  palimpsest: {
    triggers: {
      patterns: ['replace', 'instead', 'rather', 'new'],
      requiresContext: true,
    },
    cost: 0.25,
    cooldown: 30000,
    apply: (unit, directive, _context) => {
      return {
        directive: {
          ...directive,
          entrance: 'dissolve_in' as EntranceAnimation,
          effects: [...directive.effects, 'ghost_trail'],
        },
        description: 'New text writes over ghost of previous',
      };
    },
  },

  stage_direction: {
    triggers: {
      patterns: ['\\*.*\\*', '\\[.*\\]', 'quietly', 'loudly', 'whispers', 'shouts'],
    },
    cost: 0.15,
    cooldown: 15000,
    apply: (unit, directive, _context) => {
      return {
        directive: {
          ...directive,
          entrance: 'fade_in' as EntranceAnimation,
          style: {
            ...directive.style,
            scale: directive.style.scale * 0.75,
            opacity: 0.7,
          },
        },
        description: 'Stage direction in italics like a script',
      };
    },
  },

  footnote_drop: {
    triggers: {
      patterns: ['by the way', 'incidentally', 'also', 'note:', 'ps:'],
      position: 'end',
    },
    cost: 0.2,
    cooldown: 20000,
    apply: (unit, directive, _context) => {
      return {
        directive: {
          ...directive,
          entrance: 'gravity_drop' as EntranceAnimation,
          style: {
            ...directive.style,
            scale: directive.style.scale * 0.7,
          },
        },
        description: 'Additional context drops down like footnote',
      };
    },
  },

  word_painting: {
    triggers: {
      patterns: ['circle', 'wave', 'up', 'down', 'spiral', 'around'],
    },
    cost: 0.4,
    cooldown: 45000,
    apply: (unit, directive, _context) => {
      // Text forms the shape it describes — use ink_drop for organic feel
      return {
        directive: {
          ...directive,
          entrance: 'ink_drop' as EntranceAnimation,
          continuous: 'gentle_sway',
          timing: {
            ...directive.timing,
            staggerPerChar: 60,
          },
        },
        description: 'Text forms organically like ink on paper',
      };
    },
  },
};

// =============================================================================
// SURPRISE DIRECTOR CLASS
// =============================================================================

export class SurpriseDirector {
  private state: SurpriseState = {
    surpriseBudget: 1.0,
    lastSurpriseTime: 0,
    recentAnimations: [],
    conversationHistory: [],
    escalationLevel: 0,
  };

  private lastMomentTimes: Map<MagicMoment, number> = new Map();
  private budgetRegenRate = 0.0003; // per ms - faster regen for more variety

  /**
   * Consider whether to apply a magic moment to a unit
   */
  considerMagicMoment(
    unit: SemanticUnit,
    directive: AnimationDirective,
    analysisResult: AnalysisResult
  ): AnimationDirective {
    // Regenerate budget over time
    const now = Date.now();
    this.state.surpriseBudget = Math.min(1.0,
      this.state.surpriseBudget + (now - this.state.lastSurpriseTime) * this.budgetRegenRate
    );

    // Don't surprise too often - 3 second cooldown for more variety
    if (now - this.state.lastSurpriseTime < 3000) {
      return directive;
    }

    // Find applicable moments
    const applicable = this.findApplicableMoments(unit, analysisResult);

    if (applicable.length === 0) {
      return directive;
    }

    // Weight by intensity and budget
    const weighted = applicable
      .filter(m => MAGIC_MOMENTS[m].cost <= this.state.surpriseBudget)
      .filter(m => this.isOffCooldown(m, now))
      .sort((a, b) => {
        // Prefer moments that match the intensity level
        const costA = MAGIC_MOMENTS[a].cost;
        const costB = MAGIC_MOMENTS[b].cost;
        const intensityMatch = Math.abs(unit.intensity - costA) - Math.abs(unit.intensity - costB);
        return intensityMatch;
      });

    if (weighted.length === 0) {
      return directive;
    }

    // Random chance based on intensity (higher intensity = more likely)
    const chance = unit.intensity * 0.5; // max 50% chance
    if (Math.random() > chance) {
      return directive;
    }

    // Pick the best moment
    const chosenMoment = weighted[0];
    const config = MAGIC_MOMENTS[chosenMoment];

    // Apply the moment
    const context: SurpriseContext = {
      conversationHistory: this.state.conversationHistory,
      recentSurprises: this.state.recentAnimations as any, // type hack
      currentTime: now,
      escalationLevel: this.state.escalationLevel,
      analysisResult,
    };

    const result = config.apply(unit, directive, context);

    // Update state
    this.state.surpriseBudget -= config.cost;
    this.state.lastSurpriseTime = now;
    this.lastMomentTimes.set(chosenMoment, now);
    this.state.escalationLevel = Math.min(1, this.state.escalationLevel + 0.1);

    console.log(`[SurpriseDirector] Applied ${chosenMoment}: ${result.description}`);

    return result.directive;
  }

  /**
   * Find moments that could apply to this unit
   */
  private findApplicableMoments(unit: SemanticUnit, analysis: AnalysisResult): MagicMoment[] {
    const applicable: MagicMoment[] = [];
    const text = unit.text.toLowerCase();

    for (const [moment, config] of Object.entries(MAGIC_MOMENTS)) {
      const triggers = config.triggers;

      // Check patterns
      if (triggers.patterns) {
        const matches = triggers.patterns.some(p => new RegExp(p, 'i').test(text));
        if (matches) {
          applicable.push(moment as MagicMoment);
          continue;
        }
      }

      // Check emotions
      if (triggers.emotions && triggers.emotions.includes(unit.emotion)) {
        if (!triggers.intensity || unit.intensity >= triggers.intensity) {
          applicable.push(moment as MagicMoment);
          continue;
        }
      }

      // Check intensity alone
      if (triggers.intensity && !triggers.emotions && !triggers.patterns) {
        if (unit.intensity >= triggers.intensity) {
          applicable.push(moment as MagicMoment);
        }
      }
    }

    return applicable;
  }

  /**
   * Check if a moment is off cooldown
   */
  private isOffCooldown(moment: MagicMoment, now: number): boolean {
    const lastUse = this.lastMomentTimes.get(moment) || 0;
    const cooldown = MAGIC_MOMENTS[moment].cooldown;
    return now - lastUse >= cooldown;
  }

  /**
   * Add text to conversation history (for callbacks)
   */
  addToHistory(text: string): void {
    this.state.conversationHistory.push(text);

    // Keep history manageable
    if (this.state.conversationHistory.length > 50) {
      this.state.conversationHistory.shift();
    }
  }

  /**
   * Record an animation used (for variety)
   */
  recordAnimation(animation: EntranceAnimation): void {
    this.state.recentAnimations.push(animation);

    if (this.state.recentAnimations.length > 10) {
      this.state.recentAnimations.shift();
    }
  }

  /**
   * Check if an animation was used recently
   */
  wasRecentlyUsed(animation: EntranceAnimation): boolean {
    return this.state.recentAnimations.includes(animation);
  }

  /**
   * Reset escalation (e.g., after climax)
   */
  resetEscalation(): void {
    this.state.escalationLevel = 0;
  }

  /**
   * Get current state for debugging
   */
  getState(): SurpriseState {
    return { ...this.state };
  }

  /**
   * Reset all state
   */
  reset(): void {
    this.state = {
      surpriseBudget: 1.0,
      lastSurpriseTime: 0,
      recentAnimations: [],
      conversationHistory: [],
      escalationLevel: 0,
    };
    this.lastMomentTimes.clear();
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function extractKeywords(history: string[]): string[] {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought',
    'used', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which',
    'who', 'whom', 'this', 'that', 'these', 'those', 'am', 'is', 'are',
    'was', 'were', 'being', 'been', 'have', 'has', 'had', 'having', 'do',
    'does', 'did', 'doing', 'a', 'an', 'the', 'and', 'but', 'if', 'or',
    'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with',
    'about', 'against', 'between', 'into', 'through', 'during', 'before',
    'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out',
    'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once',
    'just', 'so', 'very', 'really', 'like', 'well', 'also', 'only',
  ]);

  const words: string[] = [];

  for (const text of history) {
    const tokens = text.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
    for (const token of tokens) {
      if (!stopWords.has(token)) {
        words.push(token);
      }
    }
  }

  // Return unique words, most recent first
  return [...new Set(words.reverse())].slice(0, 20);
}

// =============================================================================
// EXPORTS
// =============================================================================

export const surpriseDirector = new SurpriseDirector();
