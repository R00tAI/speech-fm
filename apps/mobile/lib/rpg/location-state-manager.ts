/**
 * Location State Manager
 *
 * Tracks the physical state of each location including modifications,
 * events that occurred, environmental conditions, and NPC presence.
 * Provides the data needed for the World Evolution Engine to compute
 * how a location has changed between player visits.
 */

import type { GameTime, GameTimeDelta } from './game-clock';

// =============================================================================
// TYPES
// =============================================================================

export type LocationModificationType =
  | 'construction'
  | 'destruction'
  | 'repair'
  | 'decoration'
  | 'fortification'
  | 'nature_reclaim'
  | 'weather_damage'
  | 'magical_effect'
  | 'ownership_change';

export interface LocationModification {
  id: string;
  type: LocationModificationType;
  description: string;
  appliedAt: GameTime;
  permanent: boolean;          // If false, can be reversed/fade over time
  visualImpact: string;        // Prompt modifier for scene generation
}

export interface LocationEvent {
  id: string;
  description: string;
  timestamp: GameTime;
  participants: string[];       // Character IDs involved
  significance: number;         // 0-100, affects how long it's remembered
  consequences: string[];       // What happened as a result
  resolved: boolean;
}

export interface WeatherState {
  condition: 'clear' | 'cloudy' | 'rain' | 'storm' | 'snow' | 'fog' | 'heat';
  intensity: number;            // 0-1
  description: string;
}

export interface LocationState {
  locationId: string;
  locationName: string;

  // Physical state
  modifications: LocationModification[];
  currentCondition: string;     // Overall physical state description

  // History
  events: LocationEvent[];
  lastVisitedAt: GameTime | null;
  totalVisits: number;

  // Environment
  weather: WeatherState;
  npcsCurrentlyPresent: string[]; // NPC IDs at this location

  // Player ownership / influence
  playerOwned: boolean;
  playerReputation: number;     // -100 to 100 at this specific location
}

// =============================================================================
// DEFAULTS
// =============================================================================

const generateId = () => `loc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

export function createLocationState(locationId: string, locationName: string): LocationState {
  return {
    locationId,
    locationName,
    modifications: [],
    currentCondition: 'Normal condition',
    events: [],
    lastVisitedAt: null,
    totalVisits: 0,
    weather: { condition: 'clear', intensity: 0.3, description: 'Fair weather' },
    npcsCurrentlyPresent: [],
    playerOwned: false,
    playerReputation: 0,
  };
}

// =============================================================================
// STATE OPERATIONS
// =============================================================================

/** Record that the player visited this location */
export function recordVisit(state: LocationState, currentTime: GameTime): LocationState {
  return {
    ...state,
    lastVisitedAt: currentTime,
    totalVisits: state.totalVisits + 1,
  };
}

/** Add a modification to the location */
export function addModification(
  state: LocationState,
  mod: Omit<LocationModification, 'id'>
): LocationState {
  return {
    ...state,
    modifications: [...state.modifications, { ...mod, id: generateId() }],
  };
}

/** Record an event that happened at this location */
export function addLocationEvent(
  state: LocationState,
  event: Omit<LocationEvent, 'id'>
): LocationState {
  return {
    ...state,
    events: [...state.events, { ...event, id: generateId() }],
  };
}

/** Get recent unresolved events */
export function getUnresolvedEvents(state: LocationState): LocationEvent[] {
  return state.events.filter((e) => !e.resolved);
}

/** Get significant events for the evolution engine */
export function getSignificantEvents(state: LocationState, minSignificance: number = 30): LocationEvent[] {
  return state.events
    .filter((e) => e.significance >= minSignificance)
    .sort((a, b) => b.significance - a.significance);
}

/** Build a prompt-friendly summary of the location's current state */
export function getLocationStateSummary(state: LocationState): string {
  const parts: string[] = [`${state.locationName}: ${state.currentCondition}`];

  // Recent modifications
  const recentMods = state.modifications.slice(-3);
  if (recentMods.length > 0) {
    parts.push('Recent changes: ' + recentMods.map((m) => m.description).join('; '));
  }

  // Unresolved events
  const unresolved = getUnresolvedEvents(state);
  if (unresolved.length > 0) {
    parts.push('Ongoing situations: ' + unresolved.map((e) => e.description).join('; '));
  }

  // Weather
  if (state.weather.condition !== 'clear') {
    parts.push(`Weather: ${state.weather.description}`);
  }

  // Player reputation
  if (state.playerReputation > 30) {
    parts.push('The people here regard the player favorably.');
  } else if (state.playerReputation < -30) {
    parts.push('The people here are hostile toward the player.');
  }

  return parts.join('\n');
}

/** Get visual prompt modifiers from all active modifications */
export function getVisualModifiers(state: LocationState): string[] {
  return state.modifications
    .filter((m) => m.visualImpact)
    .map((m) => m.visualImpact);
}

/** Generate a random weather appropriate to the season */
export function generateWeather(season: string): WeatherState {
  const rand = Math.random();

  const seasonWeather: Record<string, Array<{ condition: WeatherState['condition']; weight: number }>> = {
    spring: [
      { condition: 'clear', weight: 0.3 },
      { condition: 'cloudy', weight: 0.3 },
      { condition: 'rain', weight: 0.3 },
      { condition: 'fog', weight: 0.1 },
    ],
    summer: [
      { condition: 'clear', weight: 0.5 },
      { condition: 'heat', weight: 0.2 },
      { condition: 'cloudy', weight: 0.15 },
      { condition: 'storm', weight: 0.15 },
    ],
    autumn: [
      { condition: 'cloudy', weight: 0.3 },
      { condition: 'rain', weight: 0.3 },
      { condition: 'fog', weight: 0.2 },
      { condition: 'clear', weight: 0.2 },
    ],
    winter: [
      { condition: 'snow', weight: 0.35 },
      { condition: 'cloudy', weight: 0.25 },
      { condition: 'clear', weight: 0.2 },
      { condition: 'fog', weight: 0.1 },
      { condition: 'storm', weight: 0.1 },
    ],
  };

  const options = seasonWeather[season] || seasonWeather.spring;
  let cumulative = 0;
  let selected = options[0].condition;
  for (const opt of options) {
    cumulative += opt.weight;
    if (rand <= cumulative) {
      selected = opt.condition;
      break;
    }
  }

  const descriptions: Record<string, string> = {
    clear: 'Clear skies',
    cloudy: 'Overcast skies with grey clouds',
    rain: 'Steady rainfall',
    storm: 'Thunderstorm with heavy rain and lightning',
    snow: 'Snowfall blanketing the area',
    fog: 'Dense fog reducing visibility',
    heat: 'Oppressive heat with shimmering air',
  };

  return {
    condition: selected,
    intensity: 0.3 + Math.random() * 0.5,
    description: descriptions[selected],
  };
}
