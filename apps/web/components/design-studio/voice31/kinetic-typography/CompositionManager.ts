/**
 * CompositionManager
 *
 * Manages the spatial layout of kinetic typography with composition templates.
 *
 * Instead of positioning each word independently (which creates repetitive patterns),
 * this now analyzes ALL units together and selects a composition template:
 *
 * - caption_bar:      Clean subtitle text at bottom (for casual speech)
 * - hero_word:        Single dramatic word fills center
 * - headline_sub:     Big phrase + smaller supporting text
 * - editorial_spread: Magazine-style mixed sizes across screen
 * - stacked_lines:    Multiple lines stacked with varying alignment
 * - scattered_poem:   Artistically placed across the full screen
 */

import {
  CompositionState,
  RenderedUnit,
  BoundingBox,
  SemanticUnit,
  AnimationDirective,
  AnalysisResult,
} from './types';

// =============================================================================
// COMPOSITION TEMPLATES
// =============================================================================

export type CompositionTemplate =
  | 'caption_bar'       // Clean subtitle-style at bottom
  | 'hero_word'         // Single dramatic word fills center
  | 'headline_sub'      // Big phrase + smaller supporting text
  | 'editorial_spread'  // Magazine-style mixed sizes
  | 'stacked_lines'     // Multiple lines stacked vertically
  | 'scattered_poem';   // Artistic placement across screen

export type LayoutStrategy =
  | 'center'
  | 'caption'
  | 'stack'
  | 'flow'
  | 'scatter'
  | 'split'
  | 'corners'
  | 'focus'
  | 'timeline';

interface LayoutConfig {
  strategy: LayoutStrategy;
  padding: number;
  spacing: number;
  maxWidth: number;
  alignment: 'left' | 'center' | 'right';
  verticalAlign: 'top' | 'center' | 'bottom';
}

const DEFAULT_CONFIG: LayoutConfig = {
  strategy: 'caption',
  padding: 40,
  spacing: 16,
  maxWidth: 800,
  alignment: 'center',
  verticalAlign: 'bottom',
};

// =============================================================================
// TEMPLATE POSITION GENERATORS
// =============================================================================

interface UnitPosition {
  x: number;
  y: number;
  zIndex: number;
}

// Seeded pseudo-random for deterministic but varied positioning
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + seed * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

// =============================================================================
// COMPOSITION MANAGER CLASS
// =============================================================================

export class CompositionManager {
  private state: CompositionState;
  private config: LayoutConfig;
  private bounds: BoundingBox;
  private transitionQueue: TransitionRequest[] = [];
  private currentTemplate: CompositionTemplate = 'caption_bar';
  private templatePositionIndex = 0;
  private compositionSeed = 0;

  constructor(width: number, height: number, config: Partial<LayoutConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.bounds = { x: 0, y: 0, width, height };

    this.state = {
      activeUnits: new Map(),
      exitingUnits: new Map(),
      availableSpace: { ...this.bounds },
      focusPoint: { x: width / 2, y: height / 2 },
      zIndexCounter: 0,
    };
  }

  /**
   * Select a composition template based on the analysis of ALL units.
   * Call this BEFORE positioning individual units.
   */
  selectTemplate(units: SemanticUnit[]): CompositionTemplate {
    if (units.length === 0) return 'caption_bar';

    // Rotate seed for variety between calls
    this.compositionSeed = Date.now() % 10000;
    this.templatePositionIndex = 0;

    const avgIntensity = units.reduce((s, u) => s + u.intensity, 0) / units.length;
    const maxIntensity = Math.max(...units.map(u => u.intensity));
    const hasPhrase = units.some(u => u.text.includes(' '));
    const hasDramatic = units.some(u => u.intensity > 0.75);
    const unitCount = units.length;

    // Count how many are "solo" high-intensity vs phrase groups
    const soloHighCount = units.filter(u => !u.text.includes(' ') && u.intensity > 0.6).length;
    const phraseCount = units.filter(u => u.text.includes(' ')).length;

    // Single dramatic word → hero
    if (unitCount === 1 && maxIntensity > 0.75 && !hasPhrase) {
      this.currentTemplate = 'hero_word';
      return this.currentTemplate;
    }

    // All calm, mostly phrases → clean caption bar
    if (avgIntensity < 0.45 && !hasDramatic) {
      this.currentTemplate = 'caption_bar';
      return this.currentTemplate;
    }

    // One dramatic word + surrounding calm phrases → headline + subtitle
    if (soloHighCount === 1 && phraseCount >= 1) {
      this.currentTemplate = 'headline_sub';
      return this.currentTemplate;
    }

    // Many units with mixed intensity → strongly prefer readable layouts
    if (unitCount >= 3) {
      const choice = seededRandom(this.compositionSeed + unitCount);
      // Always favor contained layouts — never scatter across entire screen
      if (choice < 0.60) {
        this.currentTemplate = 'stacked_lines';
      } else if (choice < 0.85) {
        this.currentTemplate = 'caption_bar';
      } else {
        this.currentTemplate = 'headline_sub';
      }
      return this.currentTemplate;
    }

    // Medium intensity, 2 units → stacked lines
    if (unitCount === 2) {
      if (hasDramatic) {
        this.currentTemplate = 'headline_sub';
      } else {
        this.currentTemplate = seededRandom(this.compositionSeed) < 0.5 ? 'stacked_lines' : 'caption_bar';
      }
      return this.currentTemplate;
    }

    // Default
    this.currentTemplate = 'caption_bar';
    return this.currentTemplate;
  }

  // Maximum active units before forced eviction — keep low to prevent screen fill
  private static MAX_ACTIVE_UNITS = 3;

  /**
   * Calculate position for a unit using the selected composition template.
   */
  calculatePosition(
    unit: SemanticUnit,
    directive: AnimationDirective,
    estimatedWidth: number,
    estimatedHeight: number
  ): { x: number; y: number; zIndex: number } {
    // Evict oldest units when we're at capacity to prevent pile-up
    while (this.state.activeUnits.size >= CompositionManager.MAX_ACTIVE_UNITS) {
      const oldest = this.getOldestUnit();
      if (oldest) {
        this.scheduleExit(oldest.id);
      } else {
        break;
      }
    }

    let position: { x: number; y: number };

    // Use template-based positioning
    switch (this.currentTemplate) {
      case 'caption_bar':
        position = this.templateCaptionBar(unit, estimatedWidth, estimatedHeight);
        break;
      case 'hero_word':
        position = this.templateHeroWord(estimatedWidth, estimatedHeight);
        break;
      case 'headline_sub':
        position = this.templateHeadlineSub(unit, estimatedWidth, estimatedHeight);
        break;
      case 'editorial_spread':
        position = this.templateEditorialSpread(unit, estimatedWidth, estimatedHeight);
        break;
      case 'stacked_lines':
        position = this.templateStackedLines(unit, estimatedWidth, estimatedHeight);
        break;
      case 'scattered_poem':
        position = this.templateScatteredPoem(unit, estimatedWidth, estimatedHeight);
        break;
      default:
        position = this.templateCaptionBar(unit, estimatedWidth, estimatedHeight);
    }

    // Override: whispered asides always go to corners
    if (unit.pattern === 'whispered_aside' || unit.pattern === 'parenthetical') {
      position = this.layoutCorner(estimatedWidth, estimatedHeight);
    }

    // Ensure within bounds
    position.x = Math.max(
      this.config.padding,
      Math.min(position.x, this.bounds.width - estimatedWidth - this.config.padding)
    );
    position.y = Math.max(
      this.config.padding,
      Math.min(position.y, this.bounds.height - estimatedHeight - this.config.padding)
    );

    // Avoid collisions
    position = this.avoidCollisions(position, estimatedWidth, estimatedHeight);

    this.templatePositionIndex++;

    return {
      ...position,
      zIndex: ++this.state.zIndexCounter,
    };
  }

  // =============================================================================
  // TEMPLATE IMPLEMENTATIONS
  // =============================================================================

  /**
   * Caption Bar: Clean subtitle text at bottom of screen.
   * Multi-word phrases centered, stacking upward.
   */
  private templateCaptionBar(
    unit: SemanticUnit,
    width: number,
    height: number
  ): { x: number; y: number } {
    const captionZoneBottom = this.bounds.height - this.config.padding;
    const captionZoneTop = this.bounds.height * 0.75; // Keep captions in bottom 25% only

    let y = captionZoneBottom - height;

    // Stack upward from existing units in caption zone
    for (const [, existing] of this.state.activeUnits) {
      if (existing.bounds.y >= captionZoneTop) {
        if (y + height > existing.bounds.y && y < existing.bounds.y + existing.bounds.height) {
          y = existing.bounds.y - height - this.config.spacing;
        }
      }
    }

    if (y < captionZoneTop) {
      const oldest = this.getOldestCaptionUnit(captionZoneTop);
      if (oldest) this.scheduleExit(oldest.id);
      y = captionZoneBottom - height;
    }

    // Slight horizontal variation for visual interest
    const xVariance = seededRandom(this.compositionSeed + this.templatePositionIndex * 7) * 0.1 - 0.05;
    const x = (this.bounds.width - width) / 2 + this.bounds.width * xVariance;

    return { x, y };
  }

  /**
   * Hero Word: Single dramatic word fills center of screen.
   */
  private templateHeroWord(
    width: number,
    height: number
  ): { x: number; y: number } {
    // Slight randomized offset from dead center for dynamism
    const xOff = (seededRandom(this.compositionSeed + 1) - 0.5) * this.bounds.width * 0.08;
    const yOff = (seededRandom(this.compositionSeed + 2) - 0.5) * this.bounds.height * 0.06;

    return {
      x: (this.bounds.width - width) / 2 + xOff,
      y: (this.bounds.height - height) / 2 + yOff,
    };
  }

  /**
   * Headline + Subtitle: Big dramatic element with supporting text.
   * The highest-intensity unit goes large and central, others below/around it.
   */
  private templateHeadlineSub(
    unit: SemanticUnit,
    width: number,
    height: number
  ): { x: number; y: number } {
    const isHeadline = unit.intensity > 0.6 && !unit.text.includes(' ');

    if (isHeadline) {
      // Headline: upper-center area with slight variance
      const xOff = (seededRandom(this.compositionSeed + 3) - 0.5) * 0.15 * this.bounds.width;
      return {
        x: (this.bounds.width - width) / 2 + xOff,
        y: this.bounds.height * 0.3 - height / 2,
      };
    }

    // Subtitle: below the headline, centered
    const subtitleY = this.bounds.height * 0.55 + this.templatePositionIndex * (height + 12);
    const alignRandom = seededRandom(this.compositionSeed + this.templatePositionIndex * 11);
    let x: number;

    if (alignRandom < 0.4) {
      x = this.bounds.width * 0.15; // left-aligned
    } else if (alignRandom < 0.7) {
      x = (this.bounds.width - width) / 2; // centered
    } else {
      x = this.bounds.width * 0.85 - width; // right-aligned
    }

    return { x, y: subtitleY };
  }

  /**
   * Editorial Spread: Magazine-style layout with mixed sizes and positions.
   * Each unit gets a unique position across the full screen.
   */
  private templateEditorialSpread(
    unit: SemanticUnit,
    width: number,
    height: number
  ): { x: number; y: number } {
    // Generate positions using golden ratio spiral for natural distribution
    const phi = 1.618033988749895;
    const idx = this.templatePositionIndex;
    const seed = this.compositionSeed;

    // Use golden angle for angular distribution
    const angle = idx * phi * Math.PI * 2;
    const radius = 0.15 + (idx * 0.08) + seededRandom(seed + idx * 3) * 0.1;

    // Convert to screen coordinates with bounds
    const cx = 0.5 + Math.cos(angle) * radius * (0.6 + seededRandom(seed + idx * 5) * 0.3);
    const cy = 0.5 + Math.sin(angle) * radius * (0.5 + seededRandom(seed + idx * 7) * 0.3);

    // Clamp to safe area
    const safeX = Math.max(0.08, Math.min(0.92, cx));
    const safeY = Math.max(0.08, Math.min(0.88, cy));

    return {
      x: this.bounds.width * safeX - width / 2,
      y: this.bounds.height * safeY - height / 2,
    };
  }

  /**
   * Stacked Lines: Multiple lines stacked vertically with varying alignment.
   * Each phrase gets its own line with different horizontal alignment.
   */
  private templateStackedLines(
    unit: SemanticUnit,
    width: number,
    height: number
  ): { x: number; y: number } {
    const idx = this.templatePositionIndex;
    const totalHeight = (idx + 1) * (height + this.config.spacing * 1.5);

    // Start from vertical center, distribute upward and downward
    const baseY = (this.bounds.height - totalHeight) / 2;
    const y = baseY + idx * (height + this.config.spacing * 1.5);

    // Varying horizontal alignment with true randomization
    const alignSeed = seededRandom(this.compositionSeed + idx * 13 + 42);
    let x: number;

    if (alignSeed < 0.3) {
      // Left-aligned with random indent
      const indent = seededRandom(this.compositionSeed + idx * 17) * this.bounds.width * 0.15;
      x = this.config.padding + indent;
    } else if (alignSeed < 0.6) {
      // Center-aligned with slight offset
      const offset = (seededRandom(this.compositionSeed + idx * 19) - 0.5) * this.bounds.width * 0.1;
      x = (this.bounds.width - width) / 2 + offset;
    } else {
      // Right-aligned with random indent
      const indent = seededRandom(this.compositionSeed + idx * 23) * this.bounds.width * 0.15;
      x = this.bounds.width - width - this.config.padding - indent;
    }

    return { x, y };
  }

  /**
   * Scattered Poem: Artistic placement across the full screen.
   * Each unit gets a unique position with no obvious pattern.
   */
  private templateScatteredPoem(
    unit: SemanticUnit,
    width: number,
    height: number
  ): { x: number; y: number } {
    const idx = this.templatePositionIndex;
    const seed = this.compositionSeed;

    // Use multiple overlapping sine waves for organic distribution
    const t = idx / 7; // normalize
    const x1 = 0.5 + Math.sin(t * 3.7 + seed * 0.1) * 0.35;
    const y1 = 0.5 + Math.cos(t * 2.3 + seed * 0.2) * 0.35;
    const x2 = seededRandom(seed + idx * 31) * 0.2 - 0.1;
    const y2 = seededRandom(seed + idx * 37) * 0.15 - 0.075;

    const finalX = Math.max(0.08, Math.min(0.92, x1 + x2));
    const finalY = Math.max(0.08, Math.min(0.88, y1 + y2));

    // High intensity units gravitate toward center
    if (unit.intensity > 0.7) {
      const pull = (unit.intensity - 0.7) * 2;
      return {
        x: this.bounds.width * (finalX * (1 - pull) + 0.5 * pull) - width / 2,
        y: this.bounds.height * (finalY * (1 - pull) + 0.45 * pull) - height / 2,
      };
    }

    return {
      x: this.bounds.width * finalX - width / 2,
      y: this.bounds.height * finalY - height / 2,
    };
  }

  // =============================================================================
  // LEGACY LAYOUT METHODS (kept for direct use / fallback)
  // =============================================================================

  private layoutCorner(width: number, height: number): { x: number; y: number } {
    const corners = [
      { x: this.config.padding, y: this.config.padding },
      { x: this.bounds.width - width - this.config.padding, y: this.config.padding },
      { x: this.config.padding, y: this.bounds.height - height - this.config.padding },
      { x: this.bounds.width - width - this.config.padding, y: this.bounds.height - height - this.config.padding },
    ];

    let bestCorner = corners[0];
    let minOccupancy = Infinity;

    for (const corner of corners) {
      let occupancy = 0;
      for (const [, unit] of this.state.activeUnits) {
        const dx = corner.x - unit.bounds.x;
        const dy = corner.y - unit.bounds.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        occupancy += 1 / (dist + 1);
      }
      if (occupancy < minOccupancy) {
        minOccupancy = occupancy;
        bestCorner = corner;
      }
    }

    return bestCorner;
  }

  // =============================================================================
  // COLLISION AVOIDANCE
  // =============================================================================

  private avoidCollisions(
    position: { x: number; y: number },
    width: number,
    height: number
  ): { x: number; y: number } {
    const newBounds: BoundingBox = { ...position, width, height };

    const checkCollision = (bounds: BoundingBox): boolean => {
      for (const [, unit] of this.state.activeUnits) {
        if (this.boundsIntersect(bounds, unit.bounds)) return true;
      }
      // Also check exiting units — they're still visually present
      for (const [, unit] of this.state.exitingUnits) {
        if (this.boundsIntersect(bounds, unit.bounds)) return true;
      }
      return false;
    };

    if (!checkCollision(newBounds)) {
      return { x: newBounds.x, y: newBounds.y };
    }

    // Try multiple directions: down, up, right, left, then diagonals
    const spacing = this.config.spacing;
    const directions = [
      { dx: 0, dy: 1 },   // down
      { dx: 0, dy: -1 },  // up
      { dx: 1, dy: 0 },   // right
      { dx: -1, dy: 0 },  // left
      { dx: 1, dy: 1 },   // down-right
      { dx: -1, dy: -1 }, // up-left
    ];

    for (const dir of directions) {
      for (let step = 1; step <= 5; step++) {
        const testBounds: BoundingBox = {
          x: position.x + dir.dx * spacing * step,
          y: position.y + dir.dy * spacing * step,
          width,
          height,
        };

        // Stay within canvas bounds
        if (testBounds.x < this.config.padding || testBounds.x + width > this.bounds.width - this.config.padding) continue;
        if (testBounds.y < this.config.padding || testBounds.y + height > this.bounds.height - this.config.padding) continue;

        if (!checkCollision(testBounds)) {
          return { x: testBounds.x, y: testBounds.y };
        }
      }
    }

    // Last resort: evict the oldest unit to make room
    const oldest = this.getOldestUnit();
    if (oldest) {
      this.scheduleExit(oldest.id);
    }

    return position;
  }

  private boundsIntersect(a: BoundingBox, b: BoundingBox): boolean {
    // Add 20px margin around each unit to enforce minimum visual spacing
    const margin = 20;
    return !(
      a.x + a.width + margin < b.x ||
      b.x + b.width + margin < a.x ||
      a.y + a.height + margin < b.y ||
      b.y + b.height + margin < a.y
    );
  }

  // =============================================================================
  // UNIT MANAGEMENT
  // =============================================================================

  registerUnit(unit: RenderedUnit): void {
    this.state.activeUnits.set(unit.id, unit);
  }

  scheduleExit(unitId: string): void {
    const unit = this.state.activeUnits.get(unitId);
    if (unit) {
      this.state.exitingUnits.set(unitId, unit);
      this.state.activeUnits.delete(unitId);
    }
  }

  removeUnit(unitId: string): void {
    this.state.activeUnits.delete(unitId);
    this.state.exitingUnits.delete(unitId);
  }

  private getOldestCaptionUnit(captionZoneTop: number): RenderedUnit | null {
    let oldest: RenderedUnit | null = null;
    let oldestTime = Infinity;

    for (const [, unit] of this.state.activeUnits) {
      if (unit.bounds.y >= captionZoneTop && unit.startTime < oldestTime) {
        oldestTime = unit.startTime;
        oldest = unit;
      }
    }

    return oldest;
  }

  private getOldestUnit(): RenderedUnit | null {
    let oldest: RenderedUnit | null = null;
    let oldestTime = Infinity;

    for (const [, unit] of this.state.activeUnits) {
      if (unit.startTime < oldestTime) {
        oldestTime = unit.startTime;
        oldest = unit;
      }
    }

    return oldest;
  }

  clear(): void {
    this.state.activeUnits.clear();
    this.state.exitingUnits.clear();
    this.state.zIndexCounter = 0;
    this.transitionQueue = [];
    this.templatePositionIndex = 0;
  }

  clearForTransition(keepFocus: boolean = true): void {
    for (const [id, unit] of this.state.activeUnits) {
      if (!keepFocus || !unit.unit.isEmphasis) {
        this.scheduleExit(id);
      }
    }
  }

  setFocusPoint(x: number, y: number): void {
    this.state.focusPoint = { x, y };
  }

  updateBounds(width: number, height: number): void {
    this.bounds = { x: 0, y: 0, width, height };
    this.state.availableSpace = { ...this.bounds };
    this.state.focusPoint = { x: width / 2, y: height / 2 };
  }

  getActiveUnits(): RenderedUnit[] {
    return [...this.state.activeUnits.values()];
  }

  getExitingUnits(): RenderedUnit[] {
    return [...this.state.exitingUnits.values()];
  }

  getCurrentTemplate(): CompositionTemplate {
    return this.currentTemplate;
  }

  getState(): CompositionState {
    return { ...this.state };
  }
}

// =============================================================================
// TYPES
// =============================================================================

interface TransitionRequest {
  fromUnitId: string;
  toUnit: SemanticUnit;
  type: 'replace' | 'morph' | 'push';
}

// =============================================================================
// EXPORTS
// =============================================================================

export const createCompositionManager = (width: number, height: number) => {
  return new CompositionManager(width, height);
};
