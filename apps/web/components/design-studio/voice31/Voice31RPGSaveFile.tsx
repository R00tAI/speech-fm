'use client';

/**
 * Voice31 RPG Save File / Notebook Viewer
 *
 * Journal-style viewer for the player's adventure including:
 * - Story events chronologically
 * - Locations discovered
 * - Characters met
 * - Quest log
 * - Inventory
 * - Full character stats
 */

import React, { useState, useMemo } from 'react';
import { useVoice31RPGStore, type StoryEvent, type GameLocation, type NPCharacter, type Quest, type InventoryItem } from './Voice31RPGStore';

// =============================================================================
// TYPES
// =============================================================================

interface Voice31RPGSaveFileProps {
  phosphorColor?: string;
  onClose: () => void;
}

type NotebookTab = 'story' | 'locations' | 'characters' | 'quests' | 'inventory' | 'stats';

// =============================================================================
// TAB BUTTON
// =============================================================================

const TabButton: React.FC<{
  tab: NotebookTab;
  activeTab: NotebookTab;
  label: string;
  icon: string;
  onClick: (tab: NotebookTab) => void;
  phosphorColor: string;
}> = ({ tab, activeTab, label, icon, onClick, phosphorColor }) => {
  const isActive = tab === activeTab;
  return (
    <button
      onClick={() => onClick(tab)}
      className={`px-3 py-2 font-mono text-xs uppercase tracking-wider transition-all ${
        isActive ? 'border-b-2' : 'opacity-60 hover:opacity-100'
      }`}
      style={{
        color: `var(--phosphor-${phosphorColor}, #ffaa00)`,
        borderColor: isActive ? `var(--phosphor-${phosphorColor}, #ffaa00)` : 'transparent',
      }}
    >
      <span className="mr-1">{icon}</span>
      {label}
    </button>
  );
};

// =============================================================================
// STORY TAB
// =============================================================================

const StoryTab: React.FC<{
  events: StoryEvent[];
  phosphorColor: string;
}> = ({ events, phosphorColor }) => {
  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => b.timestamp - a.timestamp),
    [events]
  );

  if (events.length === 0) {
    return (
      <div className="text-center py-8 opacity-50 font-mono text-sm">
        Your adventure has just begun...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sortedEvents.map((event) => (
        <div
          key={event.id}
          className={`p-4 rounded-lg ${event.important ? 'border-l-4' : ''}`}
          style={{
            background: 'rgba(0, 0, 0, 0.4)',
            borderColor: event.important ? `var(--phosphor-${phosphorColor}, #ffaa00)` : undefined,
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm">
              {event.type === 'narrative' && '📜'}
              {event.type === 'dialogue' && '💬'}
              {event.type === 'combat' && '⚔️'}
              {event.type === 'discovery' && '🔍'}
              {event.type === 'death' && '💀'}
              {event.type === 'levelup' && '⭐'}
              {event.type === 'quest' && '📋'}
              {event.type === 'item' && '🎒'}
            </span>
            <span
              className="font-mono text-xs uppercase"
              style={{ color: `var(--phosphor-${phosphorColor}, #ffaa00)` }}
            >
              {event.type}
            </span>
            <span className="font-mono text-xs opacity-40 ml-auto">
              {new Date(event.timestamp).toLocaleString()}
            </span>
          </div>
          <div
            className="font-mono text-sm mb-1"
            style={{ color: event.important ? `var(--phosphor-${phosphorColor}, #ffaa00)` : 'white' }}
          >
            {event.summary}
          </div>
          <div className="font-mono text-xs opacity-70 leading-relaxed">
            {event.fullText}
          </div>
          <div className="mt-2 font-mono text-xs opacity-40">
            📍 {event.locationName}
          </div>
        </div>
      ))}
    </div>
  );
};

// =============================================================================
// LOCATIONS TAB
// =============================================================================

const LocationsTab: React.FC<{
  locations: Record<string, GameLocation>;
  currentLocationId: string | null;
  phosphorColor: string;
}> = ({ locations, currentLocationId, phosphorColor }) => {
  const locationList = Object.values(locations).filter((l) => l.discovered);

  if (locationList.length === 0) {
    return (
      <div className="text-center py-8 opacity-50 font-mono text-sm">
        No locations discovered yet...
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {locationList.map((location) => (
        <div
          key={location.id}
          className={`p-4 rounded-lg relative overflow-hidden ${
            location.id === currentLocationId ? 'ring-2' : ''
          }`}
          style={{
            background: 'rgba(0, 0, 0, 0.4)',
            ringColor: `var(--phosphor-${phosphorColor}, #ffaa00)`,
          }}
        >
          {/* Background thumbnail */}
          {location.backgroundUrl && (
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `url(${location.backgroundUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
          )}

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">📍</span>
              <span
                className="font-mono text-sm font-bold"
                style={{ color: `var(--phosphor-${phosphorColor}, #ffaa00)` }}
              >
                {location.name}
              </span>
              {location.id === currentLocationId && (
                <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400 ml-auto">
                  HERE
                </span>
              )}
            </div>

            <div className="font-mono text-xs opacity-70 mb-2 line-clamp-2">
              {location.description}
            </div>

            <div className="flex items-center gap-4 text-xs opacity-50 font-mono">
              <span>Visits: {location.visitCount}</span>
              {location.firstVisitedAt && (
                <span>First: {new Date(location.firstVisitedAt).toLocaleDateString()}</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// =============================================================================
// CHARACTERS TAB
// =============================================================================

const CharactersTab: React.FC<{
  npcs: Record<string, NPCharacter>;
  phosphorColor: string;
}> = ({ npcs, phosphorColor }) => {
  const npcList = Object.values(npcs);

  if (npcList.length === 0) {
    return (
      <div className="text-center py-8 opacity-50 font-mono text-sm">
        No characters met yet...
      </div>
    );
  }

  const getRelationshipColor = (rel: number) => {
    if (rel >= 50) return '#00ff88';
    if (rel >= 0) return '#ffaa00';
    return '#ff4444';
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      {npcList.map((npc) => (
        <div
          key={npc.id}
          className="p-4 rounded-lg flex gap-4"
          style={{ background: 'rgba(0, 0, 0, 0.4)' }}
        >
          {/* Portrait */}
          <div
            className="w-16 h-20 rounded flex items-center justify-center shrink-0"
            style={{
              background: 'rgba(0, 0, 0, 0.6)',
              border: `1px solid ${getRelationshipColor(npc.relationship)}40`,
            }}
          >
            {npc.portraitUrl ? (
              <img
                src={npc.portraitUrl}
                alt={npc.name}
                className="w-full h-full object-cover rounded"
              />
            ) : (
              <span
                className="text-2xl font-mono"
                style={{ color: `var(--phosphor-${phosphorColor}, #ffaa00)` }}
              >
                {npc.name.charAt(0)}
              </span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div
              className="font-mono text-sm font-bold truncate"
              style={{ color: `var(--phosphor-${phosphorColor}, #ffaa00)` }}
            >
              {npc.name}
            </div>
            {npc.title && (
              <div className="font-mono text-xs opacity-60 truncate">
                {npc.title}
              </div>
            )}

            {/* Relationship bar */}
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-black/50 overflow-hidden">
                <div
                  className="h-full transition-all"
                  style={{
                    width: `${(npc.relationship + 100) / 2}%`,
                    backgroundColor: getRelationshipColor(npc.relationship),
                  }}
                />
              </div>
              <span
                className="font-mono text-[10px]"
                style={{ color: getRelationshipColor(npc.relationship) }}
              >
                {npc.relationship > 0 ? '+' : ''}{npc.relationship}
              </span>
            </div>

            {/* Race/Personality */}
            <div className="mt-1 font-mono text-[10px] opacity-50">
              {npc.race} {npc.personality.length > 0 && `• ${npc.personality.slice(0, 2).join(', ')}`}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// =============================================================================
// QUESTS TAB
// =============================================================================

const QuestsTab: React.FC<{
  quests: Quest[];
  phosphorColor: string;
}> = ({ quests, phosphorColor }) => {
  const activeQuests = quests.filter((q) => q.status === 'active');
  const completedQuests = quests.filter((q) => q.status === 'completed');
  const failedQuests = quests.filter((q) => q.status === 'failed');

  if (quests.length === 0) {
    return (
      <div className="text-center py-8 opacity-50 font-mono text-sm">
        No quests yet...
      </div>
    );
  }

  const QuestItem: React.FC<{ quest: Quest }> = ({ quest }) => (
    <div
      className="p-4 rounded-lg"
      style={{
        background: 'rgba(0, 0, 0, 0.4)',
        borderLeft: `3px solid ${
          quest.status === 'completed' ? '#00ff88' : quest.status === 'failed' ? '#ff4444' : `var(--phosphor-${phosphorColor}, #ffaa00)`
        }`,
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm">
          {quest.status === 'completed' ? '✓' : quest.status === 'failed' ? '✗' : '◉'}
        </span>
        <span
          className="font-mono text-sm font-bold"
          style={{
            color: quest.status === 'completed' ? '#00ff88' : quest.status === 'failed' ? '#ff4444' : `var(--phosphor-${phosphorColor}, #ffaa00)`,
          }}
        >
          {quest.name}
        </span>
      </div>
      <div className="font-mono text-xs opacity-70 mb-2">
        {quest.description}
      </div>
      {quest.giverName && (
        <div className="font-mono text-[10px] opacity-50">
          From: {quest.giverName}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {activeQuests.length > 0 && (
        <div>
          <h3
            className="font-mono text-sm uppercase mb-3"
            style={{ color: `var(--phosphor-${phosphorColor}, #ffaa00)` }}
          >
            Active Quests ({activeQuests.length})
          </h3>
          <div className="space-y-2">
            {activeQuests.map((q) => <QuestItem key={q.id} quest={q} />)}
          </div>
        </div>
      )}

      {completedQuests.length > 0 && (
        <div>
          <h3 className="font-mono text-sm uppercase mb-3 text-green-400">
            Completed ({completedQuests.length})
          </h3>
          <div className="space-y-2">
            {completedQuests.map((q) => <QuestItem key={q.id} quest={q} />)}
          </div>
        </div>
      )}

      {failedQuests.length > 0 && (
        <div>
          <h3 className="font-mono text-sm uppercase mb-3 text-red-400">
            Failed ({failedQuests.length})
          </h3>
          <div className="space-y-2">
            {failedQuests.map((q) => <QuestItem key={q.id} quest={q} />)}
          </div>
        </div>
      )}
    </div>
  );
};

// =============================================================================
// INVENTORY TAB
// =============================================================================

const InventoryTab: React.FC<{
  inventory: InventoryItem[];
  gold: number;
  phosphorColor: string;
}> = ({ inventory, gold, phosphorColor }) => {
  const rarityColors: Record<string, string> = {
    common: '#aaaaaa',
    uncommon: '#00ff88',
    rare: '#4488ff',
    epic: '#aa88ff',
    legendary: '#ff8800',
  };

  return (
    <div>
      {/* Gold */}
      <div
        className="flex items-center gap-2 p-4 rounded-lg mb-4"
        style={{
          background: 'rgba(0, 0, 0, 0.4)',
          border: '1px solid #ffd70040',
        }}
      >
        <span className="text-xl">💰</span>
        <span className="font-mono text-lg font-bold" style={{ color: '#ffd700' }}>
          {gold.toLocaleString()} Gold
        </span>
      </div>

      {/* Items */}
      {inventory.length === 0 ? (
        <div className="text-center py-8 opacity-50 font-mono text-sm">
          Inventory is empty...
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {inventory.map((item) => (
            <div
              key={item.id}
              className={`p-3 rounded-lg ${item.equipped ? 'ring-2 ring-green-500' : ''}`}
              style={{
                background: 'rgba(0, 0, 0, 0.4)',
                borderLeft: `3px solid ${rarityColors[item.rarity]}`,
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="font-mono text-sm font-bold"
                  style={{ color: rarityColors[item.rarity] }}
                >
                  {item.name}
                </span>
                {item.quantity > 1 && (
                  <span className="font-mono text-xs opacity-60">x{item.quantity}</span>
                )}
                {item.equipped && (
                  <span className="text-xs text-green-400 ml-auto">[E]</span>
                )}
              </div>
              <div className="font-mono text-[10px] opacity-60 uppercase">
                {item.type} • {item.rarity}
              </div>
              {item.description && (
                <div className="font-mono text-xs opacity-50 mt-1 line-clamp-1">
                  {item.description}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// =============================================================================
// STATS TAB
// =============================================================================

const StatsTab: React.FC<{
  player: NonNullable<ReturnType<typeof useVoice31RPGStore.getState>['currentSaveFile']>['player'];
  phosphorColor: string;
}> = ({ player, phosphorColor }) => {
  const stats = player.stats;

  const StatRow: React.FC<{ label: string; value: number; icon: string }> = ({ label, value, icon }) => {
    const modifier = Math.floor((value - 10) / 2);
    return (
      <div
        className="flex items-center justify-between p-3 rounded"
        style={{ background: 'rgba(0, 0, 0, 0.3)' }}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <span className="font-mono text-sm uppercase">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-lg font-bold" style={{ color: `var(--phosphor-${phosphorColor}, #ffaa00)` }}>
            {value}
          </span>
          <span
            className="font-mono text-sm"
            style={{ color: modifier >= 0 ? '#00ff88' : '#ff4444' }}
          >
            ({modifier >= 0 ? '+' : ''}{modifier})
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Character Info */}
      <div
        className="p-4 rounded-lg text-center"
        style={{ background: 'rgba(0, 0, 0, 0.4)' }}
      >
        <div
          className="text-2xl font-mono font-bold mb-1"
          style={{ color: `var(--phosphor-${phosphorColor}, #ffaa00)` }}
        >
          {player.name}
        </div>
        <div className="font-mono text-sm opacity-70">
          Level {stats.level} {player.race.charAt(0).toUpperCase() + player.race.slice(1)} {player.class.charAt(0).toUpperCase() + player.class.slice(1)}
        </div>
      </div>

      {/* Vitals */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-lg" style={{ background: 'rgba(0, 0, 0, 0.4)' }}>
          <div className="font-mono text-xs uppercase opacity-60 mb-1">Health</div>
          <div className="font-mono text-2xl font-bold text-red-400">
            {stats.health} / {stats.maxHealth}
          </div>
        </div>
        <div className="p-4 rounded-lg" style={{ background: 'rgba(0, 0, 0, 0.4)' }}>
          <div className="font-mono text-xs uppercase opacity-60 mb-1">Mana</div>
          <div className="font-mono text-2xl font-bold text-blue-400">
            {stats.mana} / {stats.maxMana}
          </div>
        </div>
      </div>

      {/* XP */}
      <div className="p-4 rounded-lg" style={{ background: 'rgba(0, 0, 0, 0.4)' }}>
        <div className="flex justify-between mb-2">
          <span className="font-mono text-xs uppercase opacity-60">Experience</span>
          <span className="font-mono text-xs" style={{ color: `var(--phosphor-${phosphorColor}, #ffaa00)` }}>
            {stats.experience} / {stats.experienceToLevel}
          </span>
        </div>
        <div className="h-2 rounded-full bg-black/50 overflow-hidden">
          <div
            className="h-full transition-all"
            style={{
              width: `${(stats.experience / stats.experienceToLevel) * 100}%`,
              backgroundColor: `var(--phosphor-${phosphorColor}, #ffaa00)`,
            }}
          />
        </div>
      </div>

      {/* Core Stats */}
      <div className="space-y-2">
        <StatRow label="Strength" value={stats.strength} icon="⚔️" />
        <StatRow label="Dexterity" value={stats.dexterity} icon="🏃" />
        <StatRow label="Constitution" value={stats.constitution} icon="🛡️" />
        <StatRow label="Intelligence" value={stats.intelligence} icon="📖" />
        <StatRow label="Wisdom" value={stats.wisdom} icon="🔮" />
        <StatRow label="Charisma" value={stats.charisma} icon="💬" />
      </div>
    </div>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export const Voice31RPGSaveFile: React.FC<Voice31RPGSaveFileProps> = ({
  phosphorColor = 'amber',
  onClose,
}) => {
  const currentSaveFile = useVoice31RPGStore((s) => s.currentSaveFile);
  const notebookTab = useVoice31RPGStore((s) => s.notebookTab);
  const setNotebookTab = useVoice31RPGStore((s) => s.setNotebookTab);
  const activeScene = useVoice31RPGStore((s) => s.activeScene);

  if (!currentSaveFile) {
    return (
      <div
        className="absolute inset-0 flex items-center justify-center bg-black/90 z-50"
        onClick={onClose}
      >
        <div className="text-center font-mono">
          <div
            className="text-xl mb-2"
            style={{ color: `var(--phosphor-${phosphorColor}, #ffaa00)` }}
          >
            No Save File
          </div>
          <div className="text-sm opacity-60">Start a new game to begin your adventure</div>
        </div>
      </div>
    );
  }

  const formatPlayTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div
      className="absolute inset-4 rounded-lg overflow-hidden flex flex-col z-50"
      style={{
        background: 'rgba(10, 10, 15, 0.98)',
        border: `2px solid var(--phosphor-${phosphorColor}, #ffaa00)`,
        boxShadow: `0 0 40px var(--phosphor-${phosphorColor}, #ffaa00)30`,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: `1px solid var(--phosphor-${phosphorColor}, #ffaa00)40` }}
      >
        <div>
          <h2
            className="font-mono text-lg font-bold uppercase tracking-widest"
            style={{ color: `var(--phosphor-${phosphorColor}, #ffaa00)` }}
          >
            📖 {currentSaveFile.name}
          </h2>
          <div className="font-mono text-xs opacity-50 mt-1">
            Playtime: {formatPlayTime(currentSaveFile.playTime)} • Last saved: {new Date(currentSaveFile.lastPlayedAt).toLocaleString()}
          </div>
        </div>
        <button
          onClick={onClose}
          className="px-4 py-2 font-mono text-sm uppercase transition-opacity hover:opacity-70"
          style={{
            background: `var(--phosphor-${phosphorColor}, #ffaa00)20`,
            border: `1px solid var(--phosphor-${phosphorColor}, #ffaa00)`,
            color: `var(--phosphor-${phosphorColor}, #ffaa00)`,
          }}
        >
          Close
        </button>
      </div>

      {/* Tabs */}
      <div
        className="flex gap-1 px-4 pt-2"
        style={{ borderBottom: `1px solid var(--phosphor-${phosphorColor}, #ffaa00)20` }}
      >
        <TabButton tab="story" activeTab={notebookTab} label="Story" icon="📜" onClick={setNotebookTab} phosphorColor={phosphorColor} />
        <TabButton tab="locations" activeTab={notebookTab} label="Locations" icon="📍" onClick={setNotebookTab} phosphorColor={phosphorColor} />
        <TabButton tab="characters" activeTab={notebookTab} label="Characters" icon="👤" onClick={setNotebookTab} phosphorColor={phosphorColor} />
        <TabButton tab="quests" activeTab={notebookTab} label="Quests" icon="📋" onClick={setNotebookTab} phosphorColor={phosphorColor} />
        <TabButton tab="inventory" activeTab={notebookTab} label="Inventory" icon="🎒" onClick={setNotebookTab} phosphorColor={phosphorColor} />
        <TabButton tab="stats" activeTab={notebookTab} label="Stats" icon="📊" onClick={setNotebookTab} phosphorColor={phosphorColor} />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
        {notebookTab === 'story' && (
          <StoryTab events={currentSaveFile.storyEvents} phosphorColor={phosphorColor} />
        )}
        {notebookTab === 'locations' && (
          <LocationsTab
            locations={currentSaveFile.locations}
            currentLocationId={activeScene.location?.id || null}
            phosphorColor={phosphorColor}
          />
        )}
        {notebookTab === 'characters' && (
          <CharactersTab npcs={currentSaveFile.npcs} phosphorColor={phosphorColor} />
        )}
        {notebookTab === 'quests' && (
          <QuestsTab quests={currentSaveFile.quests} phosphorColor={phosphorColor} />
        )}
        {notebookTab === 'inventory' && (
          <InventoryTab
            inventory={currentSaveFile.player.inventory}
            gold={currentSaveFile.player.gold}
            phosphorColor={phosphorColor}
          />
        )}
        {notebookTab === 'stats' && (
          <StatsTab player={currentSaveFile.player} phosphorColor={phosphorColor} />
        )}
      </div>
    </div>
  );
};

export default Voice31RPGSaveFile;
