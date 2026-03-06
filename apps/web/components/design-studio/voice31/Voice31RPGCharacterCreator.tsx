'use client';

/**
 * Voice31 RPG Character Creator
 *
 * Multi-step character creation flow:
 * 1. Name input
 * 2. Race selection
 * 3. Class selection
 * 4. Stat allocation
 * 5. Appearance/Portrait generation
 * 6. Backstory
 * 7. Voice selection
 * 8. Review & Create
 */

import React, { useState, useCallback } from 'react';
import {
  useVoice31RPGStore,
  NPC_VOICE_LIBRARY,
  DEFAULT_STATS,
  type PlayerRace,
  type PlayerClass,
  type CharacterStats,
} from './Voice31RPGStore';

// =============================================================================
// TYPES
// =============================================================================

interface Voice31RPGCharacterCreatorProps {
  phosphorColor?: string;
  onClose: () => void;
  onComplete: (saveId: string) => void;
}

type CreatorStep = 'name' | 'race' | 'class' | 'stats' | 'appearance' | 'backstory' | 'voice' | 'review';

// =============================================================================
// RACE & CLASS DATA
// =============================================================================

const RACES: Record<PlayerRace, { name: string; description: string; bonuses: string; icon: string }> = {
  human: {
    name: 'Human',
    description: 'Versatile and adaptable, humans excel in any role.',
    bonuses: '+1 to all stats',
    icon: '👤',
  },
  elf: {
    name: 'Elf',
    description: 'Graceful and long-lived, elves possess keen senses and magical affinity.',
    bonuses: '+2 DEX, +1 INT',
    icon: '🧝',
  },
  dwarf: {
    name: 'Dwarf',
    description: 'Stout and hardy, dwarves are renowned craftsmen and fierce warriors.',
    bonuses: '+2 CON, +1 STR',
    icon: '⛏️',
  },
  halfling: {
    name: 'Halfling',
    description: 'Small but brave, halflings are nimble and surprisingly lucky.',
    bonuses: '+2 DEX, +1 CHA',
    icon: '🍀',
  },
  orc: {
    name: 'Orc',
    description: 'Powerful and intimidating, orcs are born warriors.',
    bonuses: '+2 STR, +1 CON',
    icon: '👹',
  },
  tiefling: {
    name: 'Tiefling',
    description: 'Descended from fiends, tieflings wield dark charisma and innate magic.',
    bonuses: '+2 CHA, +1 INT',
    icon: '😈',
  },
  dragonborn: {
    name: 'Dragonborn',
    description: 'Proud dragon-kin with a breath weapon and imposing presence.',
    bonuses: '+2 STR, +1 CHA',
    icon: '🐲',
  },
};

const CLASSES: Record<PlayerClass, { name: string; description: string; primary: string; icon: string }> = {
  warrior: {
    name: 'Warrior',
    description: 'Masters of martial combat, warriors excel in strength and endurance.',
    primary: 'STR, CON',
    icon: '⚔️',
  },
  mage: {
    name: 'Mage',
    description: 'Wielders of arcane power, mages command devastating spells.',
    primary: 'INT, WIS',
    icon: '🔮',
  },
  rogue: {
    name: 'Rogue',
    description: 'Cunning and agile, rogues strike from the shadows.',
    primary: 'DEX, CHA',
    icon: '🗡️',
  },
  ranger: {
    name: 'Ranger',
    description: 'Expert trackers and archers, rangers thrive in the wilderness.',
    primary: 'DEX, WIS',
    icon: '🏹',
  },
  cleric: {
    name: 'Cleric',
    description: 'Divine servants who heal allies and smite foes with holy power.',
    primary: 'WIS, CHA',
    icon: '✝️',
  },
  paladin: {
    name: 'Paladin',
    description: 'Holy warriors who combine martial prowess with divine magic.',
    primary: 'STR, CHA',
    icon: '🛡️',
  },
  bard: {
    name: 'Bard',
    description: 'Charismatic performers who inspire allies and weave magic through song.',
    primary: 'CHA, DEX',
    icon: '🎵',
  },
};

// =============================================================================
// STEP COMPONENTS
// =============================================================================

const NameStep: React.FC<{
  value: string;
  onChange: (name: string) => void;
  onNext: () => void;
  phosphorColor: string;
}> = ({ value, onChange, onNext, phosphorColor }) => {
  const suggestions = ['Kyra', 'Theron', 'Elara', 'Magnus', 'Sera', 'Draven', 'Luna', 'Kael'];

  return (
    <div className="text-center">
      <h2
        className="font-mono text-xl mb-6"
        style={{ color: `var(--phosphor-${phosphorColor}, #ffaa00)` }}
      >
        What is your name, adventurer?
      </h2>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter your name..."
        className="w-full max-w-md px-4 py-3 rounded-lg font-mono text-lg text-center bg-black/60 outline-none transition-all"
        style={{
          border: `2px solid var(--phosphor-${phosphorColor}, #ffaa00)`,
          color: 'white',
        }}
        onKeyDown={(e) => e.key === 'Enter' && value.trim() && onNext()}
        autoFocus
      />

      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {suggestions.map((name) => (
          <button
            key={name}
            onClick={() => onChange(name)}
            className="px-3 py-1 rounded font-mono text-sm transition-all hover:opacity-100 opacity-60"
            style={{
              background: `var(--phosphor-${phosphorColor}, #ffaa00)20`,
              color: `var(--phosphor-${phosphorColor}, #ffaa00)`,
            }}
          >
            {name}
          </button>
        ))}
      </div>

      <button
        onClick={onNext}
        disabled={!value.trim()}
        className="mt-8 px-8 py-3 rounded-lg font-mono text-lg uppercase tracking-wider transition-all disabled:opacity-30"
        style={{
          background: `var(--phosphor-${phosphorColor}, #ffaa00)`,
          color: 'black',
        }}
      >
        Continue
      </button>
    </div>
  );
};

const RaceStep: React.FC<{
  value: PlayerRace | null;
  onChange: (race: PlayerRace) => void;
  onNext: () => void;
  onBack: () => void;
  phosphorColor: string;
}> = ({ value, onChange, onNext, onBack, phosphorColor }) => {
  return (
    <div>
      <h2
        className="font-mono text-xl mb-6 text-center"
        style={{ color: `var(--phosphor-${phosphorColor}, #ffaa00)` }}
      >
        Choose Your Race
      </h2>

      <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
        {(Object.entries(RACES) as [PlayerRace, typeof RACES[PlayerRace]][]).map(([key, race]) => (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`p-4 rounded-lg text-left transition-all ${value === key ? 'ring-2' : 'opacity-70 hover:opacity-100'}`}
            style={{
              background: value === key ? `var(--phosphor-${phosphorColor}, #ffaa00)20` : 'rgba(0, 0, 0, 0.4)',
              ringColor: `var(--phosphor-${phosphorColor}, #ffaa00)`,
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{race.icon}</span>
              <span
                className="font-mono font-bold"
                style={{ color: value === key ? `var(--phosphor-${phosphorColor}, #ffaa00)` : 'white' }}
              >
                {race.name}
              </span>
            </div>
            <p className="font-mono text-xs opacity-70 mb-2">{race.description}</p>
            <p className="font-mono text-xs text-green-400">{race.bonuses}</p>
          </button>
        ))}
      </div>

      <div className="flex justify-center gap-4 mt-8">
        <button
          onClick={onBack}
          className="px-6 py-2 rounded-lg font-mono uppercase tracking-wider transition-all opacity-60 hover:opacity-100"
          style={{
            border: `1px solid var(--phosphor-${phosphorColor}, #ffaa00)`,
            color: `var(--phosphor-${phosphorColor}, #ffaa00)`,
          }}
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!value}
          className="px-8 py-2 rounded-lg font-mono uppercase tracking-wider transition-all disabled:opacity-30"
          style={{
            background: `var(--phosphor-${phosphorColor}, #ffaa00)`,
            color: 'black',
          }}
        >
          Continue
        </button>
      </div>
    </div>
  );
};

const ClassStep: React.FC<{
  value: PlayerClass | null;
  onChange: (cls: PlayerClass) => void;
  onNext: () => void;
  onBack: () => void;
  phosphorColor: string;
}> = ({ value, onChange, onNext, onBack, phosphorColor }) => {
  return (
    <div>
      <h2
        className="font-mono text-xl mb-6 text-center"
        style={{ color: `var(--phosphor-${phosphorColor}, #ffaa00)` }}
      >
        Choose Your Class
      </h2>

      <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
        {(Object.entries(CLASSES) as [PlayerClass, typeof CLASSES[PlayerClass]][]).map(([key, cls]) => (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`p-4 rounded-lg text-left transition-all ${value === key ? 'ring-2' : 'opacity-70 hover:opacity-100'}`}
            style={{
              background: value === key ? `var(--phosphor-${phosphorColor}, #ffaa00)20` : 'rgba(0, 0, 0, 0.4)',
              ringColor: `var(--phosphor-${phosphorColor}, #ffaa00)`,
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{cls.icon}</span>
              <span
                className="font-mono font-bold"
                style={{ color: value === key ? `var(--phosphor-${phosphorColor}, #ffaa00)` : 'white' }}
              >
                {cls.name}
              </span>
            </div>
            <p className="font-mono text-xs opacity-70 mb-2">{cls.description}</p>
            <p className="font-mono text-xs text-blue-400">Primary: {cls.primary}</p>
          </button>
        ))}
      </div>

      <div className="flex justify-center gap-4 mt-8">
        <button
          onClick={onBack}
          className="px-6 py-2 rounded-lg font-mono uppercase tracking-wider transition-all opacity-60 hover:opacity-100"
          style={{
            border: `1px solid var(--phosphor-${phosphorColor}, #ffaa00)`,
            color: `var(--phosphor-${phosphorColor}, #ffaa00)`,
          }}
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!value}
          className="px-8 py-2 rounded-lg font-mono uppercase tracking-wider transition-all disabled:opacity-30"
          style={{
            background: `var(--phosphor-${phosphorColor}, #ffaa00)`,
            color: 'black',
          }}
        >
          Continue
        </button>
      </div>
    </div>
  );
};

const AppearanceStep: React.FC<{
  value: string;
  onChange: (desc: string) => void;
  onNext: () => void;
  onBack: () => void;
  race: PlayerRace;
  playerClass: PlayerClass;
  phosphorColor: string;
}> = ({ value, onChange, onNext, onBack, race, playerClass, phosphorColor }) => {
  const suggestions = [
    'tall with flowing silver hair and piercing blue eyes',
    'scarred from many battles, with a stern but kind face',
    'young and eager, with wild red hair and freckles',
    'mysterious, hooded, with glowing green eyes',
    'muscular and imposing, with tribal tattoos',
    'elegant and refined, with long dark braids',
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <h2
        className="font-mono text-xl mb-6 text-center"
        style={{ color: `var(--phosphor-${phosphorColor}, #ffaa00)` }}
      >
        Describe Your Appearance
      </h2>

      <p className="font-mono text-sm opacity-70 text-center mb-4">
        This will be used to generate your character portrait
      </p>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Describe your ${RACES[race].name} ${CLASSES[playerClass].name}...`}
        className="w-full h-32 px-4 py-3 rounded-lg font-mono text-sm bg-black/60 outline-none resize-none"
        style={{
          border: `2px solid var(--phosphor-${phosphorColor}, #ffaa00)`,
          color: 'white',
        }}
      />

      <div className="mt-4 flex flex-wrap gap-2">
        {suggestions.map((desc, i) => (
          <button
            key={i}
            onClick={() => onChange(value ? `${value}, ${desc}` : desc)}
            className="px-3 py-1 rounded font-mono text-xs transition-all hover:opacity-100 opacity-60"
            style={{
              background: `var(--phosphor-${phosphorColor}, #ffaa00)20`,
              color: `var(--phosphor-${phosphorColor}, #ffaa00)`,
            }}
          >
            + {desc}
          </button>
        ))}
      </div>

      <div className="flex justify-center gap-4 mt-8">
        <button
          onClick={onBack}
          className="px-6 py-2 rounded-lg font-mono uppercase tracking-wider transition-all opacity-60 hover:opacity-100"
          style={{
            border: `1px solid var(--phosphor-${phosphorColor}, #ffaa00)`,
            color: `var(--phosphor-${phosphorColor}, #ffaa00)`,
          }}
        >
          Back
        </button>
        <button
          onClick={onNext}
          className="px-8 py-2 rounded-lg font-mono uppercase tracking-wider transition-all"
          style={{
            background: `var(--phosphor-${phosphorColor}, #ffaa00)`,
            color: 'black',
          }}
        >
          Continue
        </button>
      </div>
    </div>
  );
};

const BackstoryStep: React.FC<{
  value: string;
  onChange: (backstory: string) => void;
  onNext: () => void;
  onBack: () => void;
  name: string;
  race: PlayerRace;
  playerClass: PlayerClass;
  phosphorColor: string;
}> = ({ value, onChange, onNext, onBack, name, race, playerClass, phosphorColor }) => {
  const prompts = [
    `${name} grew up in a small village...`,
    `Orphaned at a young age, ${name} learned to survive...`,
    `As a noble's child, ${name} was trained from birth...`,
    `${name} discovered their powers during a tragedy...`,
    `A mysterious stranger taught ${name} the ways of...`,
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <h2
        className="font-mono text-xl mb-6 text-center"
        style={{ color: `var(--phosphor-${phosphorColor}, #ffaa00)` }}
      >
        Tell Your Story
      </h2>

      <p className="font-mono text-sm opacity-70 text-center mb-4">
        What drives your {RACES[race].name} {CLASSES[playerClass].name}?
      </p>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Write your backstory... (optional)"
        className="w-full h-40 px-4 py-3 rounded-lg font-mono text-sm bg-black/60 outline-none resize-none"
        style={{
          border: `2px solid var(--phosphor-${phosphorColor}, #ffaa00)`,
          color: 'white',
        }}
      />

      <div className="mt-4 flex flex-wrap gap-2">
        {prompts.map((prompt, i) => (
          <button
            key={i}
            onClick={() => onChange(prompt)}
            className="px-3 py-1 rounded font-mono text-xs transition-all hover:opacity-100 opacity-60 text-left"
            style={{
              background: `var(--phosphor-${phosphorColor}, #ffaa00)20`,
              color: `var(--phosphor-${phosphorColor}, #ffaa00)`,
            }}
          >
            {prompt.slice(0, 40)}...
          </button>
        ))}
      </div>

      <div className="flex justify-center gap-4 mt-8">
        <button
          onClick={onBack}
          className="px-6 py-2 rounded-lg font-mono uppercase tracking-wider transition-all opacity-60 hover:opacity-100"
          style={{
            border: `1px solid var(--phosphor-${phosphorColor}, #ffaa00)`,
            color: `var(--phosphor-${phosphorColor}, #ffaa00)`,
          }}
        >
          Back
        </button>
        <button
          onClick={onNext}
          className="px-8 py-2 rounded-lg font-mono uppercase tracking-wider transition-all"
          style={{
            background: `var(--phosphor-${phosphorColor}, #ffaa00)`,
            color: 'black',
          }}
        >
          Continue
        </button>
      </div>
    </div>
  );
};

const VoiceStep: React.FC<{
  value: string | null;
  onChange: (voiceId: string) => void;
  onNext: () => void;
  onBack: () => void;
  phosphorColor: string;
}> = ({ value, onChange, onNext, onBack, phosphorColor }) => {
  // Filter voices for player characters (not creature voices)
  const playerVoices = NPC_VOICE_LIBRARY.filter((v) => v.gender !== 'neutral');

  return (
    <div className="max-w-2xl mx-auto">
      <h2
        className="font-mono text-xl mb-6 text-center"
        style={{ color: `var(--phosphor-${phosphorColor}, #ffaa00)` }}
      >
        Choose Your Voice
      </h2>

      <p className="font-mono text-sm opacity-70 text-center mb-4">
        Select how your character sounds (optional)
      </p>

      <div className="grid grid-cols-2 gap-3">
        {playerVoices.map((voice) => (
          <button
            key={voice.id}
            onClick={() => onChange(voice.voiceId)}
            className={`p-3 rounded-lg text-left transition-all ${value === voice.voiceId ? 'ring-2' : 'opacity-70 hover:opacity-100'}`}
            style={{
              background: value === voice.voiceId ? `var(--phosphor-${phosphorColor}, #ffaa00)20` : 'rgba(0, 0, 0, 0.4)',
              ringColor: `var(--phosphor-${phosphorColor}, #ffaa00)`,
            }}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{voice.gender === 'male' ? '👨' : '👩'}</span>
              <div>
                <div
                  className="font-mono text-sm font-bold"
                  style={{ color: value === voice.voiceId ? `var(--phosphor-${phosphorColor}, #ffaa00)` : 'white' }}
                >
                  {voice.name}
                </div>
                <div className="font-mono text-xs opacity-60">{voice.description}</div>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="flex justify-center gap-4 mt-8">
        <button
          onClick={onBack}
          className="px-6 py-2 rounded-lg font-mono uppercase tracking-wider transition-all opacity-60 hover:opacity-100"
          style={{
            border: `1px solid var(--phosphor-${phosphorColor}, #ffaa00)`,
            color: `var(--phosphor-${phosphorColor}, #ffaa00)`,
          }}
        >
          Back
        </button>
        <button
          onClick={onNext}
          className="px-8 py-2 rounded-lg font-mono uppercase tracking-wider transition-all"
          style={{
            background: `var(--phosphor-${phosphorColor}, #ffaa00)`,
            color: 'black',
          }}
        >
          Continue
        </button>
      </div>
    </div>
  );
};

const ReviewStep: React.FC<{
  name: string;
  race: PlayerRace;
  playerClass: PlayerClass;
  appearance: string;
  backstory: string;
  onBack: () => void;
  onCreate: () => void;
  isCreating: boolean;
  phosphorColor: string;
}> = ({ name, race, playerClass, appearance, backstory, onBack, onCreate, isCreating, phosphorColor }) => {
  const raceData = RACES[race];
  const classData = CLASSES[playerClass];

  return (
    <div className="max-w-2xl mx-auto">
      <h2
        className="font-mono text-xl mb-6 text-center"
        style={{ color: `var(--phosphor-${phosphorColor}, #ffaa00)` }}
      >
        Review Your Character
      </h2>

      <div
        className="p-6 rounded-lg mb-6"
        style={{ background: 'rgba(0, 0, 0, 0.4)' }}
      >
        <div className="text-center mb-4">
          <div className="text-4xl mb-2">{raceData.icon}{classData.icon}</div>
          <div
            className="font-mono text-2xl font-bold"
            style={{ color: `var(--phosphor-${phosphorColor}, #ffaa00)` }}
          >
            {name}
          </div>
          <div className="font-mono text-sm opacity-70">
            {raceData.name} {classData.name}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <div className="font-mono text-xs uppercase opacity-60 mb-1">Race</div>
            <div className="font-mono text-sm">{raceData.name}</div>
            <div className="font-mono text-xs text-green-400">{raceData.bonuses}</div>
          </div>
          <div>
            <div className="font-mono text-xs uppercase opacity-60 mb-1">Class</div>
            <div className="font-mono text-sm">{classData.name}</div>
            <div className="font-mono text-xs text-blue-400">Primary: {classData.primary}</div>
          </div>
        </div>

        {appearance && (
          <div className="mt-4">
            <div className="font-mono text-xs uppercase opacity-60 mb-1">Appearance</div>
            <div className="font-mono text-sm opacity-80">{appearance}</div>
          </div>
        )}

        {backstory && (
          <div className="mt-4">
            <div className="font-mono text-xs uppercase opacity-60 mb-1">Backstory</div>
            <div className="font-mono text-sm opacity-80">{backstory}</div>
          </div>
        )}
      </div>

      <div className="flex justify-center gap-4">
        <button
          onClick={onBack}
          disabled={isCreating}
          className="px-6 py-2 rounded-lg font-mono uppercase tracking-wider transition-all opacity-60 hover:opacity-100 disabled:opacity-30"
          style={{
            border: `1px solid var(--phosphor-${phosphorColor}, #ffaa00)`,
            color: `var(--phosphor-${phosphorColor}, #ffaa00)`,
          }}
        >
          Back
        </button>
        <button
          onClick={onCreate}
          disabled={isCreating}
          className="px-8 py-3 rounded-lg font-mono text-lg uppercase tracking-wider transition-all disabled:opacity-50"
          style={{
            background: `var(--phosphor-${phosphorColor}, #ffaa00)`,
            color: 'black',
          }}
        >
          {isCreating ? 'Creating...' : 'Begin Adventure'}
        </button>
      </div>
    </div>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export const Voice31RPGCharacterCreator: React.FC<Voice31RPGCharacterCreatorProps> = ({
  phosphorColor = 'amber',
  onClose,
  onComplete,
}) => {
  const createNewGame = useVoice31RPGStore((s) => s.createNewGame);
  const updatePlayerPortrait = useVoice31RPGStore((s) => s.updatePlayerPortrait);
  const updatePlayerVoice = useVoice31RPGStore((s) => s.updatePlayerVoice);

  const [step, setStep] = useState<CreatorStep>('name');
  const [name, setName] = useState('');
  const [race, setRace] = useState<PlayerRace | null>(null);
  const [playerClass, setPlayerClass] = useState<PlayerClass | null>(null);
  const [appearance, setAppearance] = useState('');
  const [backstory, setBackstory] = useState('');
  const [voiceId, setVoiceId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const steps: CreatorStep[] = ['name', 'race', 'class', 'appearance', 'backstory', 'voice', 'review'];
  const currentStepIndex = steps.indexOf(step);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const goNext = useCallback(() => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setStep(steps[nextIndex]);
    }
  }, [currentStepIndex, steps]);

  const goBack = useCallback(() => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setStep(steps[prevIndex]);
    }
  }, [currentStepIndex, steps]);

  const handleCreate = useCallback(async () => {
    if (!race || !playerClass) return;

    setIsCreating(true);

    try {
      // Create the game
      const saveId = createNewGame(name, race, playerClass);

      // Update optional fields
      if (voiceId) {
        updatePlayerVoice(voiceId);
      }

      // Update backstory and appearance in store
      useVoice31RPGStore.setState((state) => {
        if (!state.currentSaveFile) return state;
        return {
          currentSaveFile: {
            ...state.currentSaveFile,
            player: {
              ...state.currentSaveFile.player,
              backstory,
              appearance,
            },
          },
        };
      });

      // Generate portrait if appearance provided
      if (appearance) {
        try {
          const portraitPrompt = `RPG character portrait, ${RACES[race].name} ${CLASSES[playerClass].name}, ${appearance}, fantasy art style, head and shoulders`;
          const response = await fetch('/api/voice-canvas/generate-media', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'image',
              prompt: portraitPrompt,
              style: 'illustration',
              saveToAccount: true,
              forceSchnell: true,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            const portraitUrl = data.media?.[0]?.url;
            if (portraitUrl) {
              updatePlayerPortrait(portraitUrl);
            }
          }
        } catch (e) {
          console.error('[RPG] Failed to generate portrait:', e);
        }
      }

      onComplete(saveId);
    } catch (error) {
      console.error('[RPG] Failed to create character:', error);
      setIsCreating(false);
    }
  }, [name, race, playerClass, appearance, backstory, voiceId, createNewGame, updatePlayerVoice, updatePlayerPortrait, onComplete]);

  return (
    <div
      className="absolute inset-0 flex flex-col z-50"
      style={{
        background: 'rgba(5, 5, 10, 0.98)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: `1px solid var(--phosphor-${phosphorColor}, #ffaa00)40` }}
      >
        <h1
          className="font-mono text-lg uppercase tracking-widest"
          style={{ color: `var(--phosphor-${phosphorColor}, #ffaa00)` }}
        >
          Character Creation
        </h1>
        <button
          onClick={onClose}
          className="font-mono text-sm opacity-60 hover:opacity-100 transition-opacity"
          style={{ color: `var(--phosphor-${phosphorColor}, #ffaa00)` }}
        >
          ✕ Cancel
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-black/50">
        <div
          className="h-full transition-all duration-300"
          style={{
            width: `${progress}%`,
            background: `var(--phosphor-${phosphorColor}, #ffaa00)`,
          }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8" style={{ color: 'white' }}>
        {step === 'name' && (
          <NameStep
            value={name}
            onChange={setName}
            onNext={goNext}
            phosphorColor={phosphorColor}
          />
        )}

        {step === 'race' && (
          <RaceStep
            value={race}
            onChange={setRace}
            onNext={goNext}
            onBack={goBack}
            phosphorColor={phosphorColor}
          />
        )}

        {step === 'class' && (
          <ClassStep
            value={playerClass}
            onChange={setPlayerClass}
            onNext={goNext}
            onBack={goBack}
            phosphorColor={phosphorColor}
          />
        )}

        {step === 'appearance' && race && playerClass && (
          <AppearanceStep
            value={appearance}
            onChange={setAppearance}
            onNext={goNext}
            onBack={goBack}
            race={race}
            playerClass={playerClass}
            phosphorColor={phosphorColor}
          />
        )}

        {step === 'backstory' && race && playerClass && (
          <BackstoryStep
            value={backstory}
            onChange={setBackstory}
            onNext={goNext}
            onBack={goBack}
            name={name}
            race={race}
            playerClass={playerClass}
            phosphorColor={phosphorColor}
          />
        )}

        {step === 'voice' && (
          <VoiceStep
            value={voiceId}
            onChange={setVoiceId}
            onNext={goNext}
            onBack={goBack}
            phosphorColor={phosphorColor}
          />
        )}

        {step === 'review' && race && playerClass && (
          <ReviewStep
            name={name}
            race={race}
            playerClass={playerClass}
            appearance={appearance}
            backstory={backstory}
            onBack={goBack}
            onCreate={handleCreate}
            isCreating={isCreating}
            phosphorColor={phosphorColor}
          />
        )}
      </div>

      {/* Step indicators */}
      <div className="flex justify-center gap-2 py-4">
        {steps.map((s, i) => (
          <div
            key={s}
            className={`w-2 h-2 rounded-full transition-all ${
              i < currentStepIndex ? 'bg-current' : i === currentStepIndex ? 'bg-current scale-125' : 'bg-current/30'
            }`}
            style={{ color: `var(--phosphor-${phosphorColor}, #ffaa00)` }}
          />
        ))}
      </div>
    </div>
  );
};

export default Voice31RPGCharacterCreator;
