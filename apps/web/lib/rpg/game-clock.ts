/**
 * RPG Game Clock
 *
 * In-game time system with configurable real-to-game time ratio.
 * Tracks day, hour, minute, season, and moon phase.
 * Provides time descriptors for scene prompts and lighting.
 */

// =============================================================================
// TYPES
// =============================================================================

export interface GameTime {
  day: number;            // Day count from session start (1-indexed)
  hour: number;           // 0-23
  minute: number;         // 0-59
  season: Season;
  moonPhase: MoonPhase;
  realTimeToGameTimeRatio: number; // 1 real minute = N game minutes
}

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export type MoonPhase = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
// 0=new, 1=waxing crescent, 2=first quarter, 3=waxing gibbous,
// 4=full, 5=waning gibbous, 6=last quarter, 7=waning crescent

export type TimeOfDay = 'dawn' | 'morning' | 'midday' | 'afternoon' | 'evening' | 'dusk' | 'night' | 'late_night';

export interface GameTimeDelta {
  days: number;
  hours: number;
  minutes: number;
  totalMinutes: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const MOON_PHASE_NAMES: Record<MoonPhase, string> = {
  0: 'new moon',
  1: 'waxing crescent',
  2: 'first quarter',
  3: 'waxing gibbous',
  4: 'full moon',
  5: 'waning gibbous',
  6: 'last quarter',
  7: 'waning crescent',
};

const SEASON_DAYS = 30; // Days per season
const MOON_CYCLE_DAYS = 8; // Simplified moon cycle

const TIME_OF_DAY_RANGES: Record<TimeOfDay, [number, number]> = {
  dawn: [5, 7],
  morning: [7, 10],
  midday: [10, 14],
  afternoon: [14, 17],
  evening: [17, 19],
  dusk: [19, 21],
  night: [21, 24],
  late_night: [0, 5],
};

// =============================================================================
// DEFAULT
// =============================================================================

export const DEFAULT_GAME_TIME: GameTime = {
  day: 1,
  hour: 8,       // Start at 8 AM
  minute: 0,
  season: 'spring',
  moonPhase: 2,  // First quarter
  realTimeToGameTimeRatio: 10, // 1 real minute = 10 game minutes
};

// =============================================================================
// GAME CLOCK
// =============================================================================

export class GameClock {
  private gameTime: GameTime;
  private lastRealTime: number;
  private tickCallbacks: Array<(time: GameTime) => void> = [];

  constructor(initialTime?: Partial<GameTime>) {
    this.gameTime = { ...DEFAULT_GAME_TIME, ...initialTime };
    this.lastRealTime = Date.now();
  }

  /** Advance time based on real-world elapsed time since last tick */
  tick(): GameTime {
    const now = Date.now();
    const realElapsedMs = now - this.lastRealTime;
    this.lastRealTime = now;

    const gameMinutes = (realElapsedMs / 60_000) * this.gameTime.realTimeToGameTimeRatio;
    if (gameMinutes > 0.1) { // Skip trivial advances
      this.advanceMinutes(gameMinutes);
    }

    return this.getTime();
  }

  /** Advance by a specific number of game minutes */
  advanceMinutes(minutes: number): void {
    let totalMinutes = this.gameTime.minute + minutes;
    let hoursToAdd = Math.floor(totalMinutes / 60);
    this.gameTime.minute = Math.floor(totalMinutes % 60);

    if (hoursToAdd > 0) {
      let totalHours = this.gameTime.hour + hoursToAdd;
      let daysToAdd = Math.floor(totalHours / 24);
      this.gameTime.hour = totalHours % 24;

      if (daysToAdd > 0) {
        this.gameTime.day += daysToAdd;
        this.updateSeason();
        this.updateMoonPhase();
      }
    }

    // Notify subscribers
    for (const cb of this.tickCallbacks) {
      cb(this.gameTime);
    }
  }

  /** Advance by hours (for narrative time jumps) */
  advanceHours(hours: number): void {
    this.advanceMinutes(hours * 60);
  }

  /** Advance by days (for narrative time jumps) */
  advanceDays(days: number): void {
    this.advanceMinutes(days * 24 * 60);
  }

  /** Get current game time snapshot */
  getTime(): GameTime {
    return { ...this.gameTime };
  }

  /** Set time directly (for loading saves) */
  setTime(time: GameTime): void {
    this.gameTime = { ...time };
    this.lastRealTime = Date.now();
  }

  /** Reset the real-time anchor (call when resuming from pause/save) */
  resetAnchor(): void {
    this.lastRealTime = Date.now();
  }

  /** Subscribe to time changes */
  onTick(callback: (time: GameTime) => void): () => void {
    this.tickCallbacks.push(callback);
    return () => {
      this.tickCallbacks = this.tickCallbacks.filter((cb) => cb !== callback);
    };
  }

  // ─── Descriptors for prompts ─────────────────────────────────────

  /** Get the current time of day category */
  getTimeOfDay(): TimeOfDay {
    const h = this.gameTime.hour;
    if (h >= 0 && h < 5) return 'late_night';
    if (h >= 5 && h < 7) return 'dawn';
    if (h >= 7 && h < 10) return 'morning';
    if (h >= 10 && h < 14) return 'midday';
    if (h >= 14 && h < 17) return 'afternoon';
    if (h >= 17 && h < 19) return 'evening';
    if (h >= 19 && h < 21) return 'dusk';
    return 'night';
  }

  /** Human-readable time descriptor for prompts */
  getTimeDescriptor(): string {
    const tod = this.getTimeOfDay();
    const descriptors: Record<TimeOfDay, string[]> = {
      dawn: ['early dawn', 'first light', 'sunrise'],
      morning: ['bright morning', 'clear morning', 'mid-morning'],
      midday: ['high noon', 'midday sun', 'bright afternoon'],
      afternoon: ['warm afternoon', 'late afternoon', 'afternoon light'],
      evening: ['golden evening', 'early evening', 'sunset hour'],
      dusk: ['twilight', 'fading dusk', 'purple dusk'],
      night: ['deep night', 'starlit night', 'nighttime'],
      late_night: ['dead of night', 'witching hour', 'pre-dawn darkness'],
    };

    const options = descriptors[tod];
    return options[Math.floor(this.gameTime.minute / 20) % options.length];
  }

  /** Lighting descriptor for scene generation prompts */
  getLightingDescriptor(): string {
    const tod = this.getTimeOfDay();
    const moonLit = this.gameTime.moonPhase >= 3 && this.gameTime.moonPhase <= 5;

    const lighting: Record<TimeOfDay, string> = {
      dawn: 'soft golden light from the horizon, long shadows, warm haze',
      morning: 'clear natural daylight, gentle shadows',
      midday: 'harsh overhead sunlight, short shadows, bright and exposed',
      afternoon: 'warm angled sunlight, lengthening shadows',
      evening: 'golden hour light, rich warm tones, dramatic shadows',
      dusk: 'purple and orange twilight, fading light, first stars visible',
      night: moonLit
        ? 'pale moonlight casting silver tones, deep shadows'
        : 'darkness with sparse torchlight or lanterns, deep shadows',
      late_night: moonLit
        ? 'dim moonlight, heavy shadows, cold blue tones'
        : 'near-total darkness, faint starlight, deep noir shadows',
    };

    return lighting[tod];
  }

  /** Season descriptor for prompts */
  getSeasonDescriptor(): string {
    const descriptors: Record<Season, string> = {
      spring: 'spring bloom, fresh green foliage, gentle breezes',
      summer: 'lush summer, full canopy, warm and vibrant',
      autumn: 'autumn colors, falling leaves, golden and amber tones',
      winter: 'winter barren, frost and snow, cold grey skies',
    };
    return descriptors[this.gameTime.season];
  }

  /** Full environmental descriptor combining time + season + moon */
  getEnvironmentDescriptor(): string {
    const parts = [
      this.getTimeDescriptor(),
      this.getLightingDescriptor(),
      this.getSeasonDescriptor(),
    ];

    // Add moon info for night scenes
    const tod = this.getTimeOfDay();
    if (tod === 'night' || tod === 'late_night' || tod === 'dusk') {
      parts.push(MOON_PHASE_NAMES[this.gameTime.moonPhase]);
    }

    return parts.join(', ');
  }

  /** Formatted time string (e.g. "Day 3, 14:30") */
  getFormattedTime(): string {
    const h = this.gameTime.hour.toString().padStart(2, '0');
    const m = this.gameTime.minute.toString().padStart(2, '0');
    return `Day ${this.gameTime.day}, ${h}:${m}`;
  }

  /** Calculate time delta between two GameTime values */
  static timeDelta(from: GameTime, to: GameTime): GameTimeDelta {
    const fromTotal = (from.day - 1) * 24 * 60 + from.hour * 60 + from.minute;
    const toTotal = (to.day - 1) * 24 * 60 + to.hour * 60 + to.minute;
    const totalMinutes = Math.max(0, toTotal - fromTotal);

    return {
      days: Math.floor(totalMinutes / (24 * 60)),
      hours: Math.floor((totalMinutes % (24 * 60)) / 60),
      minutes: totalMinutes % 60,
      totalMinutes,
    };
  }

  /** Describe a time delta in natural language */
  static describeDelta(delta: GameTimeDelta): string {
    const parts: string[] = [];
    if (delta.days > 0) parts.push(`${delta.days} day${delta.days > 1 ? 's' : ''}`);
    if (delta.hours > 0) parts.push(`${delta.hours} hour${delta.hours > 1 ? 's' : ''}`);
    if (parts.length === 0) parts.push('a few moments');
    return parts.join(' and ');
  }

  // ─── Internal helpers ────────────────────────────────────────────

  private updateSeason(): void {
    const seasonIndex = Math.floor(((this.gameTime.day - 1) / SEASON_DAYS) % 4);
    const seasons: Season[] = ['spring', 'summer', 'autumn', 'winter'];
    this.gameTime.season = seasons[seasonIndex];
  }

  private updateMoonPhase(): void {
    this.gameTime.moonPhase = ((this.gameTime.day - 1) % MOON_CYCLE_DAYS) as MoonPhase;
  }
}

// Singleton for the current session
let _gameClock: GameClock | null = null;

export function getGameClock(initialTime?: Partial<GameTime>): GameClock {
  if (!_gameClock) {
    _gameClock = new GameClock(initialTime);
  }
  return _gameClock;
}

export function resetGameClock(time?: Partial<GameTime>): GameClock {
  _gameClock = new GameClock(time);
  return _gameClock;
}
