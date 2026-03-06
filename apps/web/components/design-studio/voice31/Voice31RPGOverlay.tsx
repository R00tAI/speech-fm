'use client';

/**
 * Voice31 RPG Overlay
 *
 * HUD and stats UI for RPG mode including:
 * - Health/Mana bars with animations
 * - Level and XP progress
 * - Location display
 * - Quick stats panel
 * - Floating damage/heal numbers
 * - Dialogue choice boxes
 * - Dice roll display
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  useVoice31RPGStore,
  type DialogueOption,
  type CharacterStats,
} from './Voice31RPGStore';

// =============================================================================
// TYPES
// =============================================================================

interface Voice31RPGOverlayProps {
  phosphorColor?: string;
  width: number;
  height: number;
}

// =============================================================================
// ANIMATED BAR COMPONENT
// =============================================================================

const AnimatedBar: React.FC<{
  current: number;
  max: number;
  color: string;
  glowColor: string;
  label: string;
  icon: string;
  showNumbers?: boolean;
}> = ({ current, max, color, glowColor, label, icon, showNumbers = true }) => {
  const [displayValue, setDisplayValue] = useState(current);
  const percentage = Math.max(0, Math.min(100, (displayValue / max) * 100));

  // Animate value changes
  useEffect(() => {
    const diff = current - displayValue;
    if (Math.abs(diff) < 1) {
      setDisplayValue(current);
      return;
    }

    const step = diff * 0.1;
    const timer = setTimeout(() => {
      setDisplayValue((prev) => prev + step);
    }, 16);

    return () => clearTimeout(timer);
  }, [current, displayValue]);

  return (
    <div className="flex items-center gap-2">
      {/* Icon */}
      <span className="text-lg" style={{ filter: `drop-shadow(0 0 4px ${glowColor})` }}>
        {icon}
      </span>

      {/* Bar container */}
      <div className="flex-1 relative">
        {/* Background */}
        <div
          className="h-4 rounded-sm overflow-hidden"
          style={{
            background: 'rgba(0, 0, 0, 0.8)',
            border: `1px solid ${color}40`,
          }}
        >
          {/* Fill */}
          <div
            className="h-full transition-all duration-200 relative overflow-hidden"
            style={{
              width: `${percentage}%`,
              background: `linear-gradient(90deg, ${color}80 0%, ${color} 50%, ${color}80 100%)`,
              boxShadow: `0 0 10px ${glowColor}`,
            }}
          >
            {/* Shine effect */}
            <div
              className="absolute inset-0 opacity-30"
              style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, transparent 50%, rgba(0,0,0,0.2) 100%)',
              }}
            />

            {/* Animated pulse when low */}
            {percentage < 25 && (
              <div className="absolute inset-0 animate-pulse bg-white/20" />
            )}
          </div>
        </div>

        {/* Numbers */}
        {showNumbers && (
          <div
            className="absolute inset-0 flex items-center justify-center font-mono text-xs font-bold"
            style={{
              color: 'white',
              textShadow: '0 0 4px rgba(0,0,0,0.8)',
            }}
          >
            {Math.round(displayValue)} / {max}
          </div>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// XP BAR
// =============================================================================

const XPBar: React.FC<{
  current: number;
  toLevel: number;
  level: number;
  phosphorColor: string;
}> = ({ current, toLevel, level, phosphorColor }) => {
  const percentage = (current / toLevel) * 100;

  return (
    <div className="flex items-center gap-2">
      <span
        className="font-mono text-xs font-bold"
        style={{ color: `var(--phosphor-${phosphorColor}, #ffaa00)` }}
      >
        LV.{level}
      </span>

      <div className="flex-1 relative h-2">
        <div
          className="absolute inset-0 rounded-full overflow-hidden"
          style={{
            background: 'rgba(0, 0, 0, 0.8)',
            border: `1px solid var(--phosphor-${phosphorColor}, #ffaa00)40`,
          }}
        >
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${percentage}%`,
              background: `linear-gradient(90deg, var(--phosphor-${phosphorColor}, #ffaa00)60 0%, var(--phosphor-${phosphorColor}, #ffaa00) 100%)`,
            }}
          />
        </div>
      </div>

      <span
        className="font-mono text-[10px] opacity-60"
        style={{ color: `var(--phosphor-${phosphorColor}, #ffaa00)` }}
      >
        {Math.round(percentage)}%
      </span>
    </div>
  );
};

// =============================================================================
// STAT DISPLAY
// =============================================================================

const StatDisplay: React.FC<{
  stat: keyof CharacterStats;
  value: number;
  icon: string;
  phosphorColor: string;
}> = ({ stat, value, icon, phosphorColor }) => {
  const modifier = Math.floor((value - 10) / 2);
  const modifierStr = modifier >= 0 ? `+${modifier}` : `${modifier}`;

  return (
    <div
      className="flex items-center gap-1 px-2 py-1 rounded"
      style={{
        background: 'rgba(0, 0, 0, 0.6)',
        border: `1px solid var(--phosphor-${phosphorColor}, #ffaa00)30`,
      }}
    >
      <span className="text-sm">{icon}</span>
      <span
        className="font-mono text-xs uppercase"
        style={{ color: `var(--phosphor-${phosphorColor}, #ffaa00)` }}
      >
        {stat.slice(0, 3)}
      </span>
      <span
        className="font-mono text-xs font-bold"
        style={{ color: 'white' }}
      >
        {value}
      </span>
      <span
        className="font-mono text-[10px]"
        style={{ color: modifier >= 0 ? '#00ff88' : '#ff4444' }}
      >
        ({modifierStr})
      </span>
    </div>
  );
};

// =============================================================================
// FLOATING NUMBER
// =============================================================================

const FloatingNumber: React.FC<{
  value: number;
  type: 'damage' | 'heal' | 'xp' | 'gold';
  x: number;
  y: number;
  onComplete: () => void;
}> = ({ value, type, x, y, onComplete }) => {
  const [opacity, setOpacity] = useState(1);
  const [offsetY, setOffsetY] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const duration = 1500;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);

      setOpacity(1 - progress);
      setOffsetY(-50 * progress);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        onComplete();
      }
    };

    requestAnimationFrame(animate);
  }, [onComplete]);

  const colors = {
    damage: '#ff4444',
    heal: '#00ff88',
    xp: '#aa88ff',
    gold: '#ffd700',
  };

  const prefixes = {
    damage: '-',
    heal: '+',
    xp: '+',
    gold: '+',
  };

  const suffixes = {
    damage: '',
    heal: '',
    xp: ' XP',
    gold: ' G',
  };

  return (
    <div
      className="absolute font-mono font-bold text-2xl pointer-events-none"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: `translateY(${offsetY}px) translateX(-50%)`,
        opacity,
        color: colors[type],
        textShadow: `0 0 10px ${colors[type]}, 0 2px 4px rgba(0,0,0,0.8)`,
      }}
    >
      {prefixes[type]}{value}{suffixes[type]}
    </div>
  );
};

// =============================================================================
// DIALOGUE OPTIONS
// =============================================================================

const DialogueOptions: React.FC<{
  options: DialogueOption[];
  onSelect: (optionId: string) => void;
  phosphorColor: string;
}> = ({ options, onSelect, phosphorColor }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w') {
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : options.length - 1));
      } else if (e.key === 'ArrowDown' || e.key === 's') {
        setSelectedIndex((prev) => (prev < options.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'Enter' || e.key === ' ') {
        const option = options[selectedIndex];
        if (option && !option.disabled) {
          onSelect(option.id);
        }
      } else if (e.key >= '1' && e.key <= '9') {
        const index = parseInt(e.key) - 1;
        if (index < options.length && !options[index].disabled) {
          onSelect(options[index].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [options, selectedIndex, onSelect]);

  return (
    <div
      className="absolute bottom-20 left-1/2 -translate-x-1/2 w-full max-w-lg p-4 rounded-lg"
      style={{
        background: 'rgba(0, 0, 0, 0.9)',
        border: `2px solid var(--phosphor-${phosphorColor}, #ffaa00)`,
        boxShadow: `0 0 30px rgba(255, 170, 0, 0.3)`,
      }}
    >
      {/* Header */}
      <div
        className="font-mono text-sm mb-3 pb-2"
        style={{
          color: `var(--phosphor-${phosphorColor}, #ffaa00)`,
          borderBottom: `1px solid var(--phosphor-${phosphorColor}, #ffaa00)40`,
        }}
      >
        CHOOSE YOUR RESPONSE
      </div>

      {/* Options */}
      <div className="space-y-2">
        {options.map((option, index) => (
          <button
            key={option.id}
            onClick={() => !option.disabled && onSelect(option.id)}
            onMouseEnter={() => setSelectedIndex(index)}
            disabled={option.disabled}
            className={`w-full text-left px-3 py-2 rounded font-mono text-sm transition-all ${
              option.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
            }`}
            style={{
              background:
                selectedIndex === index
                  ? `var(--phosphor-${phosphorColor}, #ffaa00)20`
                  : 'transparent',
              border:
                selectedIndex === index
                  ? `1px solid var(--phosphor-${phosphorColor}, #ffaa00)`
                  : '1px solid transparent',
              color:
                selectedIndex === index
                  ? `var(--phosphor-${phosphorColor}, #ffaa00)`
                  : 'rgba(255, 255, 255, 0.8)',
            }}
          >
            <span className="opacity-50 mr-2">[{index + 1}]</span>
            {option.text}
            {option.disabled && option.disabledReason && (
              <span className="ml-2 text-xs opacity-50">({option.disabledReason})</span>
            )}
          </button>
        ))}
      </div>

      {/* Hint */}
      <div
        className="mt-3 pt-2 text-[10px] font-mono opacity-40 flex items-center gap-3"
        style={{
          borderTop: `1px solid var(--phosphor-${phosphorColor}, #ffaa00)20`,
          color: `var(--phosphor-${phosphorColor}, #ffaa00)`,
        }}
      >
        <span>[W/S] navigate, [Enter] or [1-9] to select</span>
        <span className="flex items-center gap-1 opacity-70">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2H3v2a9 9 0 0 0 8 8.94V23h2v-2.06A9 9 0 0 0 21 12v-2h-2z"/>
          </svg>
          speak or click
        </span>
      </div>
    </div>
  );
};

// =============================================================================
// DICE ROLL DISPLAY
// =============================================================================

const DiceRollDisplay: React.FC<{
  dice: string;
  purpose: string;
  result: number | null;
  success: boolean | null;
  dc?: number;
  phosphorColor: string;
}> = ({ dice, purpose, result, success, dc, phosphorColor }) => {
  const [rolling, setRolling] = useState(true);
  const [displayValue, setDisplayValue] = useState<string>('?');

  useEffect(() => {
    if (result !== null) {
      setRolling(false);
      setDisplayValue(result.toString());
    } else {
      setRolling(true);
      // Animate random numbers while rolling
      const interval = setInterval(() => {
        setDisplayValue(Math.floor(Math.random() * 20 + 1).toString());
      }, 80);
      return () => clearInterval(interval);
    }
  }, [result]);

  return (
    <div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-8 rounded-lg text-center"
      style={{
        background: 'rgba(0, 0, 0, 0.95)',
        border: `2px solid var(--phosphor-${phosphorColor}, #ffaa00)`,
        boxShadow: `0 0 50px rgba(255, 170, 0, 0.4)`,
      }}
    >
      {/* Purpose */}
      <div
        className="font-mono text-sm mb-4 uppercase tracking-widest"
        style={{ color: `var(--phosphor-${phosphorColor}, #ffaa00)` }}
      >
        {purpose}
      </div>

      {/* Dice notation */}
      <div className="font-mono text-xs opacity-50 mb-2" style={{ color: 'white' }}>
        Rolling {dice}
      </div>

      {/* Result */}
      <div
        className={`text-6xl font-bold font-mono ${rolling ? 'animate-pulse' : ''}`}
        style={{
          color: result === null
            ? `var(--phosphor-${phosphorColor}, #ffaa00)`
            : success
            ? '#00ff88'
            : '#ff4444',
          textShadow: `0 0 30px ${result === null ? 'rgba(255, 170, 0, 0.5)' : success ? 'rgba(0, 255, 136, 0.5)' : 'rgba(255, 68, 68, 0.5)'}`,
        }}
      >
        {displayValue}
      </div>

      {/* DC comparison */}
      {dc !== undefined && result !== null && (
        <div className="mt-4 font-mono text-sm" style={{ color: 'white' }}>
          vs DC {dc}:{' '}
          <span
            className="font-bold uppercase"
            style={{ color: success ? '#00ff88' : '#ff4444' }}
          >
            {success ? 'SUCCESS' : 'FAILURE'}
          </span>
        </div>
      )}

      {/* Rolling animation dots */}
      {rolling && (
        <div className="flex justify-center gap-2 mt-4">
          <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: `var(--phosphor-${phosphorColor}, #ffaa00)`, animationDelay: '0ms' }} />
          <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: `var(--phosphor-${phosphorColor}, #ffaa00)`, animationDelay: '150ms' }} />
          <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: `var(--phosphor-${phosphorColor}, #ffaa00)`, animationDelay: '300ms' }} />
        </div>
      )}
    </div>
  );
};

// =============================================================================
// LOCATION DISPLAY
// =============================================================================

const LocationDisplay: React.FC<{
  name: string;
  phosphorColor: string;
}> = ({ name, phosphorColor }) => {
  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded"
      style={{
        background: 'rgba(0, 0, 0, 0.7)',
        border: `1px solid var(--phosphor-${phosphorColor}, #ffaa00)40`,
      }}
    >
      <span className="text-sm">📍</span>
      <span
        className="font-mono text-xs uppercase tracking-wider"
        style={{ color: `var(--phosphor-${phosphorColor}, #ffaa00)` }}
      >
        {name}
      </span>
    </div>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export const Voice31RPGOverlay: React.FC<Voice31RPGOverlayProps> = ({
  phosphorColor = 'amber',
  width,
  height,
}) => {
  const currentSaveFile = useVoice31RPGStore((s) => s.currentSaveFile);
  const activeScene = useVoice31RPGStore((s) => s.activeScene);
  const hudVisible = useVoice31RPGStore((s) => s.hudVisible);
  const floatingNumbers = useVoice31RPGStore((s) => s.floatingNumbers);
  const diceRoll = useVoice31RPGStore((s) => s.diceRoll);
  const selectDialogueOption = useVoice31RPGStore((s) => s.selectDialogueOption);
  const [statsExpanded, setStatsExpanded] = useState(false);

  const player = currentSaveFile?.player;
  const stats = player?.stats;
  const settings = currentSaveFile?.settings;
  const location = activeScene.location;
  const gameTime = currentSaveFile?.gameTime;
  const tickGameClock = useVoice31RPGStore((s) => s.tickGameClock);
  const hudOpacity = settings?.hudOpacity ?? 0.9;
  const showDiceRolls = settings?.showDiceRolls !== false;
  const showDamageNumbers = settings?.showDamageNumbers !== false;

  // Tick game clock every 6 seconds (= 1 game minute at default 10:1 ratio)
  useEffect(() => {
    if (!gameTime) return;
    const interval = setInterval(() => tickGameClock(), 6000);
    return () => clearInterval(interval);
  }, [gameTime, tickGameClock]);

  // Handle dialogue selection
  const handleDialogueSelect = useCallback((optionId: string) => {
    const selected = selectDialogueOption(optionId);
    console.log('[RPG] Dialogue selected:', selected);
  }, [selectDialogueOption]);

  // Handle floating number completion
  const handleFloatingNumberComplete = useCallback((id: string) => {
    useVoice31RPGStore.setState((state) => ({
      floatingNumbers: state.floatingNumbers.filter((n) => n.id !== id),
    }));
  }, []);

  if (!currentSaveFile || !player || !stats || !hudVisible) {
    return null;
  }

  return (
    <div className="absolute inset-0 pointer-events-none z-30" style={{ opacity: hudOpacity }}>
      {/* Top HUD - Compact bars + location */}
      <div
        className="absolute top-3 left-3 right-3 flex items-start justify-between gap-3"
        style={{ pointerEvents: 'auto' }}
      >
        {/* Left side - Compact bars */}
        <div className="flex flex-col gap-1.5 w-52">
          {/* Health */}
          <AnimatedBar
            current={stats.health}
            max={stats.maxHealth}
            color="#ff4444"
            glowColor="rgba(255, 68, 68, 0.5)"
            label="HP"
            icon="♥"
          />

          {/* Mana */}
          <AnimatedBar
            current={stats.mana}
            max={stats.maxMana}
            color="#4488ff"
            glowColor="rgba(68, 136, 255, 0.5)"
            label="MP"
            icon="✧"
          />

          {/* XP */}
          <XPBar
            current={stats.experience}
            toLevel={stats.experienceToLevel}
            level={stats.level}
            phosphorColor={phosphorColor}
          />

          {/* Gold - inline with bars */}
          {/* Gold + Time */}
          <div className="flex items-center gap-2 self-start">
            <div
              className="flex items-center gap-1 px-1.5 py-0.5 rounded"
              style={{
                background: 'rgba(0, 0, 0, 0.5)',
                border: '1px solid #ffd70030',
              }}
            >
              <span className="text-[10px]">💰</span>
              <span className="font-mono text-[10px] font-bold" style={{ color: '#ffd700' }}>
                {player.gold}
              </span>
            </div>

            {gameTime && (
              <div
                className="flex items-center gap-1 px-1.5 py-0.5 rounded"
                style={{
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: `1px solid var(--phosphor-${phosphorColor}, #ffaa00)20`,
                }}
              >
                <span className="font-mono text-[10px]" style={{ color: `var(--phosphor-${phosphorColor}, #ffaa00)`, opacity: 0.7 }}>
                  D{gameTime.day} {String(gameTime.hour).padStart(2, '0')}:{String(gameTime.minute).padStart(2, '0')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right side - Location (positioned to avoid filigree overlap) */}
        {location && (
          <div className="mt-1">
            <LocationDisplay name={location.name} phosphorColor={phosphorColor} />
          </div>
        )}
      </div>

      {/* Stats panel - shows on hover only, positioned in top-left below bars */}
      <div
        className="absolute top-[110px] left-3 transition-all duration-300"
        style={{
          pointerEvents: 'auto',
          opacity: statsExpanded ? 1 : 0,
          transform: statsExpanded ? 'translateY(0)' : 'translateY(-8px)',
        }}
        onMouseLeave={() => setStatsExpanded(false)}
      >
        {statsExpanded && (
          <div className="flex flex-col gap-1.5 p-2 rounded-lg" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
            <StatDisplay stat="strength" value={stats.strength} icon="⚔" phosphorColor={phosphorColor} />
            <StatDisplay stat="dexterity" value={stats.dexterity} icon="🏃" phosphorColor={phosphorColor} />
            <StatDisplay stat="intelligence" value={stats.intelligence} icon="📖" phosphorColor={phosphorColor} />
            <StatDisplay stat="wisdom" value={stats.wisdom} icon="🔮" phosphorColor={phosphorColor} />
            <StatDisplay stat="charisma" value={stats.charisma} icon="💬" phosphorColor={phosphorColor} />
            <StatDisplay stat="constitution" value={stats.constitution} icon="🛡" phosphorColor={phosphorColor} />
          </div>
        )}
      </div>

      {/* Stats toggle button - small, below HP/MP bars */}
      <div
        className="absolute top-[100px] left-3"
        style={{ pointerEvents: 'auto' }}
      >
        <button
          className="font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded transition-all hover:opacity-100"
          style={{
            color: `var(--phosphor-${phosphorColor}, #ffaa00)`,
            background: 'rgba(0,0,0,0.4)',
            border: `1px solid var(--phosphor-${phosphorColor}, #ffaa00)30`,
            opacity: 0.5,
          }}
          onMouseEnter={() => setStatsExpanded(true)}
          onClick={() => setStatsExpanded(!statsExpanded)}
        >
          stats
        </button>
      </div>

      {/* Floating Numbers */}
      {showDamageNumbers && floatingNumbers.map((num) => (
        <FloatingNumber
          key={num.id}
          value={num.value}
          type={num.type}
          x={num.x}
          y={num.y}
          onComplete={() => handleFloatingNumberComplete(num.id)}
        />
      ))}

      {/* Dialogue Options */}
      {activeScene.showingDialogueOptions && activeScene.dialogueOptions.length > 0 && (
        <div style={{ pointerEvents: 'auto' }}>
          <DialogueOptions
            options={activeScene.dialogueOptions}
            onSelect={handleDialogueSelect}
            phosphorColor={phosphorColor}
          />
        </div>
      )}

      {/* Dice Roll */}
      {showDiceRolls && diceRoll?.active && (
        <DiceRollDisplay
          dice={diceRoll.dice}
          purpose={diceRoll.purpose}
          result={diceRoll.result}
          success={diceRoll.success}
          dc={diceRoll.dc}
          phosphorColor={phosphorColor}
        />
      )}
    </div>
  );
};

export default Voice31RPGOverlay;
