'use client';

/**
 * Voice31 RPG Sidebar
 *
 * Always-visible right panel with tabbed navigation:
 * Status (default), Quests, Inventory, Character, Memory, Notes, Settings
 *
 * Themed to match game theme. Integrated directly into RPG layout.
 */

import React, { useMemo, useState, useCallback } from 'react';
import {
  useVoice31RPGStore,
  type InventoryItem,
  type Quest,
  type Ability,
  type StatusEffect,
  type RPGSettings,
} from './Voice31RPGStore';
import { useVoice31RPG } from './Voice31RPGProvider';
import { useVoice31Store } from './Voice31Store';
import {
  Sword,
  Scroll,
  Backpack,
  UserCircle,
  GearSix,
  Brain,
  Notepad,
  SignOut,
  GameController,
  MapPin,
  Heart,
  Lightning,
  Crown,
  Coin,
} from '@phosphor-icons/react';

// =============================================================================
// TYPES
// =============================================================================

type SidebarTab = 'status' | 'quests' | 'inventory' | 'character' | 'memory' | 'notes' | 'settings';

interface Voice31RPGSidebarProps {
  phosphorColor?: string;
}

// =============================================================================
// PHOSPHOR COLOR UTILS
// =============================================================================

const getPhosphorHex = (color: string) => ({
  green: '#33ff33',
  amber: '#ffaa00',
  red: '#ff4444',
  blue: '#4488ff',
  white: '#ffffff',
}[color] || '#ffaa00');

const getPhosphorGlow = (color: string) => ({
  green: 'rgba(51, 255, 51, 0.4)',
  amber: 'rgba(255, 170, 0, 0.4)',
  red: 'rgba(255, 68, 68, 0.4)',
  blue: 'rgba(68, 136, 255, 0.4)',
  white: 'rgba(255, 255, 255, 0.4)',
}[color] || 'rgba(255, 170, 0, 0.4)');

// =============================================================================
// RARITY COLORS
// =============================================================================

const RARITY_COLORS: Record<string, string> = {
  common: '#aaaaaa',
  uncommon: '#00ff88',
  rare: '#4488ff',
  epic: '#aa88ff',
  legendary: '#ff8800',
};

// =============================================================================
// TAB CONFIG
// =============================================================================

const TAB_CONFIG: Record<SidebarTab, { icon: React.ElementType; label: string; shortcut?: string }> = {
  status: { icon: GameController, label: 'Status' },
  quests: { icon: Scroll, label: 'Quests', shortcut: 'Q' },
  inventory: { icon: Backpack, label: 'Inv', shortcut: 'I' },
  character: { icon: UserCircle, label: 'Char', shortcut: 'C' },
  memory: { icon: Brain, label: 'Memory' },
  notes: { icon: Notepad, label: 'Notes' },
  settings: { icon: GearSix, label: 'Settings' },
};

// =============================================================================
// STATUS PANEL (default tab)
// =============================================================================

const StatusPanel: React.FC<{ hex: string }> = ({ hex }) => {
  const player = useVoice31RPGStore((s) => s.currentSaveFile?.player);
  const location = useVoice31RPGStore((s) => s.activeScene.location);
  const quests = useVoice31RPGStore((s) => s.currentSaveFile?.quests) || [];
  const gameTime = useVoice31RPGStore((s) => s.currentSaveFile?.gameTime);
  const combatState = useVoice31RPGStore((s) => s.currentSaveFile?.combatState);

  if (!player) return null;

  const { stats, gold } = player;
  const activeQuests = quests.filter((q) => q.status === 'active');
  const currentObjective = activeQuests[0]?.objectives.find((o) => !o.completed);

  return (
    <div className="space-y-3">
      {/* Player name + level */}
      <div className="flex items-center justify-between">
        <div>
          <div className="font-mono text-xs font-bold" style={{ color: hex }}>{player.name}</div>
          <div className="font-mono text-[10px] opacity-40">Lv.{stats.level} {player.race} {player.class}</div>
        </div>
        <div className="flex items-center gap-1">
          <Coin size={12} weight="bold" style={{ color: '#ffd700' }} />
          <span className="font-mono text-[11px] font-bold" style={{ color: '#ffd700' }}>{gold}</span>
        </div>
      </div>

      {/* HP / MP bars */}
      <div className="space-y-1.5">
        <CompactVitalBar label="HP" current={stats.health} max={stats.maxHealth} color="#ff4444" icon={Heart} />
        <CompactVitalBar label="MP" current={stats.mana} max={stats.maxMana} color="#4488ff" icon={Lightning} />
        <CompactVitalBar label="XP" current={stats.experience} max={stats.experienceToLevel} color={hex} icon={Crown} />
      </div>

      {/* Location */}
      {location && (
        <div className="flex items-center gap-2 px-2 py-1.5 rounded" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <MapPin size={12} weight="bold" style={{ color: hex, opacity: 0.6 }} />
          <span className="font-mono text-[10px] opacity-70 truncate">{location.name}</span>
        </div>
      )}

      {/* Active quest objective */}
      {activeQuests.length > 0 && (
        <div className="px-2 py-2 rounded" style={{ background: 'rgba(0,0,0,0.3)', borderLeft: `2px solid ${hex}40` }}>
          <div className="font-mono text-[9px] uppercase tracking-wider opacity-30 mb-1" style={{ color: hex }}>Active Quest</div>
          <div className="font-mono text-[10px] font-bold opacity-80" style={{ color: hex }}>
            {activeQuests[0].name}
          </div>
          {currentObjective && (
            <div className="font-mono text-[9px] opacity-50 mt-0.5">{currentObjective.description}</div>
          )}
        </div>
      )}

      {/* Combat indicator */}
      {combatState?.inCombat && (
        <div className="px-2 py-2 rounded animate-pulse" style={{ background: 'rgba(255,0,0,0.1)', border: '1px solid rgba(255,68,68,0.3)' }}>
          <div className="font-mono text-[10px] font-bold text-red-400 flex items-center gap-2">
            <Sword size={12} weight="bold" />
            IN COMBAT
          </div>
        </div>
      )}

      {/* Game time */}
      {gameTime && (
        <div className="font-mono text-[9px] opacity-25 text-center">
          Day {gameTime.day} \u00b7 {String(gameTime.hour).padStart(2, '0')}:{String(gameTime.minute).padStart(2, '0')}
        </div>
      )}
    </div>
  );
};

const CompactVitalBar: React.FC<{
  label: string;
  current: number;
  max: number;
  color: string;
  icon: React.ElementType;
}> = ({ label, current, max, color, icon: Icon }) => (
  <div className="flex items-center gap-2">
    <Icon size={10} weight="bold" style={{ color, opacity: 0.5 }} />
    <span className="font-mono text-[9px] opacity-40 w-5">{label}</span>
    <div className="flex-1 h-1.5 rounded-full bg-black/50 overflow-hidden">
      <div className="h-full transition-all duration-500" style={{ width: `${Math.min(100, (current / max) * 100)}%`, backgroundColor: color }} />
    </div>
    <span className="font-mono text-[9px] w-12 text-right" style={{ color }}>{current}/{max}</span>
  </div>
);

// =============================================================================
// INVENTORY PANEL
// =============================================================================

const InventoryPanel: React.FC<{ hex: string }> = ({ hex }) => {
  const player = useVoice31RPGStore((s) => s.currentSaveFile?.player);
  if (!player) return null;

  const { inventory, gold } = player;
  const equipped = inventory.filter((i) => i.equipped);
  const unequipped = inventory.filter((i) => !i.equipped);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-2 py-1.5 rounded" style={{ background: 'rgba(255, 215, 0, 0.06)', border: '1px solid rgba(255, 215, 0, 0.15)' }}>
        <Coin size={14} weight="bold" style={{ color: '#ffd700' }} />
        <span className="font-mono text-sm font-bold" style={{ color: '#ffd700' }}>{gold.toLocaleString()}</span>
        <span className="font-mono text-[9px] opacity-40 ml-auto">GOLD</span>
      </div>

      {equipped.length > 0 && (
        <div>
          <div className="font-mono text-[9px] uppercase tracking-wider opacity-30 mb-1.5" style={{ color: hex }}>Equipped</div>
          <div className="space-y-0.5">
            {equipped.map((item) => <ItemRow key={item.id} item={item} hex={hex} />)}
          </div>
        </div>
      )}

      <div>
        <div className="font-mono text-[9px] uppercase tracking-wider opacity-30 mb-1.5" style={{ color: hex }}>Bag ({unequipped.length})</div>
        {unequipped.length === 0 ? (
          <div className="text-center py-4 font-mono text-[10px] opacity-20">Empty</div>
        ) : (
          <div className="space-y-0.5">
            {unequipped.map((item) => <ItemRow key={item.id} item={item} hex={hex} />)}
          </div>
        )}
      </div>
    </div>
  );
};

const ItemRow: React.FC<{ item: InventoryItem; hex: string }> = ({ item }) => {
  const rarityColor = RARITY_COLORS[item.rarity] || '#aaaaaa';
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded transition-colors hover:bg-white/5"
      style={{ borderLeft: `2px solid ${rarityColor}` }}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[10px] font-bold truncate" style={{ color: rarityColor }}>{item.name}</span>
          {item.quantity > 1 && <span className="font-mono text-[9px] opacity-40">x{item.quantity}</span>}
          {item.equipped && <span className="font-mono text-[8px] px-1 py-0.5 rounded bg-green-500/20 text-green-400">E</span>}
        </div>
        <div className="font-mono text-[9px] opacity-30 uppercase">{item.type}{item.value > 0 && ` \u00b7 ${item.value}g`}</div>
      </div>
    </div>
  );
};

// =============================================================================
// QUEST PANEL
// =============================================================================

const QuestPanel: React.FC<{ hex: string }> = ({ hex }) => {
  const quests = useVoice31RPGStore((s) => s.currentSaveFile?.quests) || [];
  const active = useMemo(() => quests.filter((q) => q.status === 'active'), [quests]);
  const completed = useMemo(() => quests.filter((q) => q.status === 'completed'), [quests]);
  const failed = useMemo(() => quests.filter((q) => q.status === 'failed'), [quests]);

  if (quests.length === 0) return <div className="text-center py-6 font-mono text-[10px] opacity-20">No quests yet</div>;

  return (
    <div className="space-y-4">
      {active.length > 0 && <QuestSection label="Active" quests={active} hex={hex} color={hex} />}
      {completed.length > 0 && <QuestSection label="Completed" quests={completed} hex={hex} color="#00ff88" />}
      {failed.length > 0 && <QuestSection label="Failed" quests={failed} hex={hex} color="#ff4444" />}
    </div>
  );
};

const QuestSection: React.FC<{ label: string; quests: Quest[]; hex: string; color: string }> = ({ label, quests, color }) => (
  <div>
    <div className="font-mono text-[9px] uppercase tracking-wider opacity-30 mb-1.5" style={{ color }}>{label} ({quests.length})</div>
    <div className="space-y-1.5">
      {quests.map((quest) => (
        <div key={quest.id} className="px-2 py-2 rounded" style={{ background: 'rgba(0,0,0,0.3)', borderLeft: `2px solid ${color}` }}>
          <div className="font-mono text-[10px] font-bold mb-0.5" style={{ color }}>{quest.name}</div>
          <div className="font-mono text-[9px] opacity-50 leading-relaxed line-clamp-2">{quest.description}</div>
          {quest.objectives.length > 0 && quest.status === 'active' && (
            <div className="mt-1.5 space-y-0.5">
              {quest.objectives.map((obj) => (
                <div key={obj.id} className="flex items-center gap-1.5 font-mono text-[9px]">
                  <span style={{ color: obj.completed ? '#00ff88' : 'rgba(255,255,255,0.3)' }}>{obj.completed ? '\u2713' : '\u25cb'}</span>
                  <span className={obj.completed ? 'line-through opacity-30' : 'opacity-60'}>{obj.description}</span>
                  {obj.required > 1 && <span className="opacity-30 ml-auto">{obj.current}/{obj.required}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
);

// =============================================================================
// CHARACTER PANEL
// =============================================================================

const CharacterPanel: React.FC<{ hex: string }> = ({ hex }) => {
  const player = useVoice31RPGStore((s) => s.currentSaveFile?.player);
  if (!player) return null;

  const { stats, statusEffects, abilities } = player;
  const mod = (val: number) => { const m = Math.floor((val - 10) / 2); return m >= 0 ? `+${m}` : `${m}`; };

  return (
    <div className="space-y-3">
      <div className="text-center pb-2" style={{ borderBottom: `1px solid ${hex}15` }}>
        <div className="font-mono text-xs font-bold" style={{ color: hex }}>{player.name}</div>
        <div className="font-mono text-[9px] opacity-40">Lv.{stats.level} {player.race} {player.class}</div>
      </div>

      <div className="grid grid-cols-2 gap-1">
        <CompactVitalBar label="HP" current={stats.health} max={stats.maxHealth} color="#ff4444" icon={Heart} />
        <CompactVitalBar label="MP" current={stats.mana} max={stats.maxMana} color="#4488ff" icon={Lightning} />
      </div>

      <div>
        <div className="font-mono text-[9px] uppercase tracking-wider opacity-30 mb-1.5" style={{ color: hex }}>Attributes</div>
        <div className="grid grid-cols-3 gap-1">
          {[
            { label: 'STR', value: stats.strength },
            { label: 'DEX', value: stats.dexterity },
            { label: 'CON', value: stats.constitution },
            { label: 'INT', value: stats.intelligence },
            { label: 'WIS', value: stats.wisdom },
            { label: 'CHA', value: stats.charisma },
          ].map((s) => (
            <div key={s.label} className="flex items-center justify-between px-1.5 py-1 rounded" style={{ background: 'rgba(0,0,0,0.3)' }}>
              <span className="font-mono text-[9px] opacity-40">{s.label}</span>
              <div className="flex items-center gap-0.5">
                <span className="font-mono text-[10px] font-bold" style={{ color: hex }}>{s.value}</span>
                <span className="font-mono text-[8px]" style={{ color: Math.floor((s.value - 10) / 2) >= 0 ? '#00ff88' : '#ff4444' }}>{mod(s.value)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {statusEffects.length > 0 && (
        <div>
          <div className="font-mono text-[9px] uppercase tracking-wider opacity-30 mb-1.5" style={{ color: hex }}>Status</div>
          <div className="space-y-0.5">
            {statusEffects.map((effect) => (
              <div key={effect.id} className="flex items-center gap-1.5 px-1.5 py-1 rounded text-[9px] font-mono"
                style={{ background: 'rgba(0,0,0,0.3)', borderLeft: `2px solid ${effect.type === 'buff' ? '#00ff88' : effect.type === 'debuff' ? '#ff4444' : '#888'}` }}>
                <span style={{ color: effect.type === 'buff' ? '#00ff88' : effect.type === 'debuff' ? '#ff4444' : '#888' }}>{effect.name}</span>
                {effect.duration > 0 && <span className="opacity-30 ml-auto">{effect.duration}t</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {abilities.length > 0 && (
        <div>
          <div className="font-mono text-[9px] uppercase tracking-wider opacity-30 mb-1.5" style={{ color: hex }}>Abilities</div>
          <div className="space-y-0.5">
            {abilities.map((ability) => (
              <div key={ability.id} className="px-1.5 py-1 rounded" style={{ background: 'rgba(0,0,0,0.3)' }}>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[9px] font-bold" style={{ color: hex }}>{ability.name}</span>
                  {ability.manaCost > 0 && <span className="font-mono text-[8px] text-blue-400 ml-auto">{ability.manaCost}MP</span>}
                </div>
                <div className="font-mono text-[8px] opacity-30 mt-0.5">{ability.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// =============================================================================
// MEMORY PANEL
// =============================================================================

const MemoryPanel: React.FC<{ hex: string }> = ({ hex }) => {
  const activeNPCs = useVoice31RPGStore((s) => s.activeScene.activeNPCs);
  const npcMemories = useVoice31RPGStore((s) => s.currentSaveFile?.npcMemories) || {};
  const storyEvents = useVoice31RPGStore((s) => s.currentSaveFile?.storyEvents) || [];
  const [filter, setFilter] = useState<'npcs' | 'events' | 'gossip'>('npcs');

  const npcMemoryEntries = useMemo(() => Object.values(npcMemories), [npcMemories]);
  const importantEvents = useMemo(() => storyEvents.filter((e: any) => e.important).slice(-10), [storyEvents]);

  return (
    <div className="space-y-3">
      {/* Filter tabs */}
      <div className="flex gap-1">
        {(['npcs', 'events', 'gossip'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className="flex-1 py-1 rounded font-mono text-[9px] uppercase transition-colors"
            style={{
              backgroundColor: filter === f ? `${hex}20` : 'rgba(0,0,0,0.3)',
              border: `1px solid ${filter === f ? hex + '40' : 'transparent'}`,
              color: filter === f ? hex : 'rgba(255,255,255,0.3)',
            }}>
            {f}
          </button>
        ))}
      </div>

      {filter === 'npcs' && (
        <div className="space-y-2">
          {npcMemoryEntries.length === 0 ? (
            <div className="text-center py-4 font-mono text-[10px] opacity-20">No NPC memories yet</div>
          ) : (
            npcMemoryEntries.map((mem: any) => (
              <div key={mem.npcId} className="px-2 py-2 rounded" style={{ background: 'rgba(0,0,0,0.3)' }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[10px] font-bold" style={{ color: hex }}>{mem.npcName}</span>
                  <span className="font-mono text-[8px] px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor: mem.emotionalState?.primary === 'friendly' ? 'rgba(0,255,136,0.15)' :
                        mem.emotionalState?.primary === 'angry' ? 'rgba(255,68,68,0.15)' :
                        mem.emotionalState?.primary === 'suspicious' ? 'rgba(255,170,0,0.15)' : 'rgba(255,255,255,0.05)',
                      color: mem.emotionalState?.primary === 'friendly' ? '#00ff88' :
                        mem.emotionalState?.primary === 'angry' ? '#ff4444' :
                        mem.emotionalState?.primary === 'suspicious' ? '#ffaa00' : 'rgba(255,255,255,0.4)',
                    }}>
                    {mem.emotionalState?.primary || 'neutral'}
                  </span>
                </div>
                <div className="font-mono text-[8px] opacity-30">
                  {mem.interactionCount} interaction{mem.interactionCount !== 1 ? 's' : ''}
                </div>
                {mem.memories?.length > 0 && (
                  <div className="mt-1 font-mono text-[8px] opacity-40 line-clamp-2">
                    Latest: {mem.memories[mem.memories.length - 1]?.description}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {filter === 'events' && (
        <div className="space-y-1.5">
          {importantEvents.length === 0 ? (
            <div className="text-center py-4 font-mono text-[10px] opacity-20">No key events yet</div>
          ) : (
            importantEvents.reverse().map((event: any, i: number) => (
              <div key={i} className="px-2 py-1.5 rounded" style={{ background: 'rgba(0,0,0,0.3)', borderLeft: `2px solid ${hex}40` }}>
                <div className="font-mono text-[9px] font-bold opacity-70">{event.summary}</div>
                <div className="font-mono text-[8px] opacity-30">{event.locationName}</div>
              </div>
            ))
          )}
        </div>
      )}

      {filter === 'gossip' && (
        <div className="space-y-1.5">
          {npcMemoryEntries.flatMap((mem: any) => mem.gossipKnown || []).length === 0 ? (
            <div className="text-center py-4 font-mono text-[10px] opacity-20">No gossip heard yet</div>
          ) : (
            npcMemoryEntries.flatMap((mem: any) => (mem.gossipKnown || []).map((g: any) => ({ ...g, from: mem.npcName }))).map((gossip: any, i: number) => (
              <div key={i} className="px-2 py-1.5 rounded" style={{ background: 'rgba(0,0,0,0.3)' }}>
                <div className="font-mono text-[9px] opacity-60 italic">"{gossip.content}"</div>
                <div className="font-mono text-[8px] opacity-25 mt-0.5">
                  from {gossip.from} \u00b7 reliability: {Math.round((gossip.reliability || 0) * 100)}%
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

// =============================================================================
// NOTES PANEL
// =============================================================================

const NotesPanel: React.FC<{ hex: string }> = ({ hex }) => {
  const [note, setNote] = useState('');
  const storyEvents = useVoice31RPGStore((s) => s.currentSaveFile?.storyEvents) || [];
  const recentEvents = useMemo(() => storyEvents.slice(-15).reverse(), [storyEvents]);

  return (
    <div className="space-y-3">
      {/* User notes textarea */}
      <div>
        <div className="font-mono text-[9px] uppercase tracking-wider opacity-30 mb-1.5" style={{ color: hex }}>Your Notes</div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Write notes about your adventure..."
          className="w-full h-20 px-2 py-1.5 rounded font-mono text-[10px] resize-none outline-none"
          style={{ background: 'rgba(0,0,0,0.4)', color: 'rgba(255,255,255,0.7)', border: `1px solid ${hex}15` }}
        />
      </div>

      {/* Story journal */}
      <div>
        <div className="font-mono text-[9px] uppercase tracking-wider opacity-30 mb-1.5" style={{ color: hex }}>Story Journal</div>
        <div className="space-y-1">
          {recentEvents.length === 0 ? (
            <div className="text-center py-4 font-mono text-[10px] opacity-20">No events yet</div>
          ) : (
            recentEvents.map((event: any, i: number) => (
              <div key={i} className="px-2 py-1 rounded font-mono text-[9px]" style={{ background: 'rgba(0,0,0,0.2)' }}>
                <span className="opacity-40 mr-1.5">[{event.type}]</span>
                <span className="opacity-60">{event.summary}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// SETTINGS PANEL
// =============================================================================

const SettingsPanel: React.FC<{ hex: string }> = ({ hex }) => {
  const settings = useVoice31RPGStore((s) => s.currentSaveFile?.settings);
  const updateSettings = useVoice31RPGStore((s) => s.updateSettings);
  const rpgContext = useVoice31RPG();

  if (!settings) return null;

  const Toggle: React.FC<{ label: string; value: boolean; onChange: (v: boolean) => void }> = ({ label, value, onChange }) => (
    <div className="flex items-center justify-between py-1.5">
      <span className="font-mono text-[10px] opacity-60">{label}</span>
      <button onClick={() => onChange(!value)}
        className="w-8 h-4 rounded-full transition-colors relative"
        style={{ backgroundColor: value ? `${hex}40` : 'rgba(255,255,255,0.1)', border: `1px solid ${value ? hex : 'rgba(255,255,255,0.15)'}` }}>
        <div className="absolute top-0.5 w-2.5 h-2.5 rounded-full transition-all"
          style={{ left: value ? '16px' : '2px', backgroundColor: value ? hex : 'rgba(255,255,255,0.3)' }} />
      </button>
    </div>
  );

  return (
    <div className="space-y-4">
      <div>
        <div className="font-mono text-[9px] uppercase tracking-wider opacity-30 mb-1" style={{ color: hex }}>Story Drive</div>
        <div className="flex gap-1">
          {(['passive', 'balanced', 'aggressive', 'railroaded'] as const).map((level) => (
            <button key={level}
              onClick={() => updateSettings({ storyDriveLevel: level } as any)}
              className="flex-1 py-1 rounded font-mono text-[8px] uppercase transition-colors"
              style={{
                backgroundColor: (settings as any).storyDriveLevel === level ? `${hex}25` : 'rgba(0,0,0,0.3)',
                border: `1px solid ${(settings as any).storyDriveLevel === level ? hex + '50' : 'transparent'}`,
                color: (settings as any).storyDriveLevel === level ? hex : 'rgba(255,255,255,0.3)',
              }}>
              {level}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="font-mono text-[9px] uppercase tracking-wider opacity-30 mb-1" style={{ color: hex }}>Difficulty</div>
        <div className="flex gap-1 flex-wrap">
          {(['god_mode', 'easy', 'normal', 'hard', 'hardcore'] as const).map((diff) => (
            <button key={diff}
              onClick={() => updateSettings({ worldDifficulty: diff } as any)}
              className="flex-1 min-w-[50px] py-1 rounded font-mono text-[8px] uppercase transition-colors"
              style={{
                backgroundColor: (settings as any).worldDifficulty === diff ? `${hex}25` : 'rgba(0,0,0,0.3)',
                border: `1px solid ${(settings as any).worldDifficulty === diff ? hex + '50' : 'transparent'}`,
                color: (settings as any).worldDifficulty === diff ? hex : 'rgba(255,255,255,0.3)',
              }}>
              {diff.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="font-mono text-[9px] uppercase tracking-wider opacity-30 mb-1" style={{ color: hex }}>Gameplay</div>
        <Toggle label="Show Dice Rolls" value={settings.showDiceRolls} onChange={(v) => updateSettings({ showDiceRolls: v })} />
        <Toggle label="Show Damage Numbers" value={settings.showDamageNumbers} onChange={(v) => updateSettings({ showDamageNumbers: v })} />
        <Toggle label="Auto Save" value={settings.autoSave} onChange={(v) => updateSettings({ autoSave: v })} />
        <Toggle label="NPC Voices" value={settings.npcVoiceEnabled} onChange={(v) => updateSettings({ npcVoiceEnabled: v })} />
      </div>

      <div>
        <div className="font-mono text-[9px] uppercase tracking-wider opacity-30 mb-1" style={{ color: hex }}>Visuals</div>
        <Toggle label="Depth Parallax" value={settings.enableDepthParallax} onChange={(v) => updateSettings({ enableDepthParallax: v })} />
        <Toggle label="FM Dither" value={settings.enableFMDither} onChange={(v) => updateSettings({ enableFMDither: v })} />
        <Toggle label="BG Removal" value={settings.enableBgRemoval} onChange={(v) => updateSettings({ enableBgRemoval: v })} />
        <Toggle label="Filigree" value={settings.enableFiligree} onChange={(v) => updateSettings({ enableFiligree: v })} />
        <Toggle label="Ambient FX" value={settings.ambientEffectsEnabled} onChange={(v) => updateSettings({ ambientEffectsEnabled: v })} />
      </div>

      <div>
        <div className="font-mono text-[9px] uppercase tracking-wider opacity-30 mb-1" style={{ color: hex }}>Narrative</div>
        <div className="flex gap-1">
          {(['verbose', 'balanced', 'minimal'] as const).map((style) => (
            <button key={style} onClick={() => updateSettings({ narrativeStyle: style })}
              className="flex-1 py-1 rounded font-mono text-[9px] uppercase transition-colors"
              style={{
                backgroundColor: settings.narrativeStyle === style ? `${hex}25` : 'rgba(0,0,0,0.3)',
                border: `1px solid ${settings.narrativeStyle === style ? hex + '50' : 'transparent'}`,
                color: settings.narrativeStyle === style ? hex : 'rgba(255,255,255,0.3)',
              }}>
              {style}
            </button>
          ))}
        </div>
      </div>

      {/* Exit RPG */}
      <button onClick={rpgContext.toggleRPGMode}
        className="w-full py-2 rounded font-mono text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 transition-colors hover:bg-red-500/20"
        style={{ border: '1px solid rgba(255,68,68,0.3)', color: '#ff4444' }}>
        <SignOut size={12} weight="bold" />
        Exit RPG Mode
      </button>
    </div>
  );
};

// =============================================================================
// MAIN SIDEBAR COMPONENT
// =============================================================================

export const Voice31RPGSidebar: React.FC<Voice31RPGSidebarProps> = ({ phosphorColor = 'amber' }) => {
  const [activeTab, setActiveTab] = useState<SidebarTab>('status');
  const hex = getPhosphorHex(phosphorColor);

  return (
    <div
      className="flex flex-col h-full"
      style={{
        width: '280px',
        minWidth: '280px',
        background: 'rgba(6, 6, 10, 0.97)',
        borderLeft: `1px solid ${hex}15`,
      }}
    >
      {/* Tab strip - vertical icon tabs */}
      <div className="flex items-center gap-0.5 px-1.5 py-1.5 shrink-0 overflow-x-auto"
        style={{ borderBottom: `1px solid ${hex}10` }}>
        {(Object.entries(TAB_CONFIG) as [SidebarTab, typeof TAB_CONFIG[SidebarTab]][]).map(([key, config]) => {
          const Icon = config.icon;
          const isActive = activeTab === key;
          return (
            <button key={key} onClick={() => setActiveTab(key)}
              className="flex items-center gap-1 px-2 py-1.5 rounded transition-all shrink-0"
              style={{
                backgroundColor: isActive ? `${hex}15` : 'transparent',
                border: `1px solid ${isActive ? hex + '30' : 'transparent'}`,
                color: isActive ? hex : 'rgba(255,255,255,0.3)',
              }}
              title={config.label + (config.shortcut ? ` (${config.shortcut})` : '')}>
              <Icon size={13} weight={isActive ? 'bold' : 'regular'} />
              <span className="font-mono text-[8px] uppercase tracking-wider">{config.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-3 py-3 rpg-sidebar-scroll">
        {activeTab === 'status' && <StatusPanel hex={hex} />}
        {activeTab === 'quests' && <QuestPanel hex={hex} />}
        {activeTab === 'inventory' && <InventoryPanel hex={hex} />}
        {activeTab === 'character' && <CharacterPanel hex={hex} />}
        {activeTab === 'memory' && <MemoryPanel hex={hex} />}
        {activeTab === 'notes' && <NotesPanel hex={hex} />}
        {activeTab === 'settings' && <SettingsPanel hex={hex} />}
      </div>

      <style jsx>{`
        .rpg-sidebar-scroll::-webkit-scrollbar {
          width: 3px;
        }
        .rpg-sidebar-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .rpg-sidebar-scroll::-webkit-scrollbar-thumb {
          background: ${hex}20;
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
};

export default Voice31RPGSidebar;
