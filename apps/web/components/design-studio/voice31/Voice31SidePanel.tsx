"use client";

import {
  BookOpen,
  ChatText,
  ClockCounterClockwise,
  CloudArrowUp,
  GearSix,
  Globe,
  Notepad,
  Plugs,
  Sword,
  Backpack,
  Scroll,
  UserCircle,
  GameController,
} from "@phosphor-icons/react";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { BrowserPanel } from "./sidebar/BrowserPanel";
import { HistoryPanel } from "./sidebar/HistoryPanel";
import { LibraryPanel } from "./sidebar/LibraryPanel";
import { SidebarSettingsPanel } from "./sidebar/SidebarSettingsPanel";
import { StatusPanel } from "./sidebar/StatusPanel";
import { UploadPanel } from "./sidebar/UploadPanel";
import { useVoice31Store } from "./Voice31Store";
import { useVoice31RPGStore } from "./Voice31RPGStore";
import { useVoice31RPG } from "./Voice31RPGProvider";

// =============================================================================
// TYPES
// =============================================================================

type SidebarTab =
  | "status"
  | "uploads"
  | "library"
  | "notes"
  | "history"
  | "browser"
  | "chat"
  | "settings";

type RPGTab =
  | "rpg-status"
  | "rpg-inventory"
  | "rpg-quests"
  | "rpg-character"
  | "rpg-memory";

type AnyTab = SidebarTab | RPGTab;

const COLORS: Record<string, string> = {
  green: "#33ff33",
  amber: "#ffaa00",
  red: "#ff4444",
  blue: "#4488ff",
  white: "#ffffff",
};

interface IconRailItem {
  key: AnyTab;
  icon: React.ElementType;
  label: string;
  group: "top" | "main" | "rpg";
}

const STANDARD_RAIL: IconRailItem[] = [
  { key: "settings", icon: GearSix, label: "Settings", group: "top" },
  { key: "status", icon: Plugs, label: "Status", group: "main" },
  { key: "uploads", icon: CloudArrowUp, label: "Uploads", group: "main" },
  { key: "library", icon: BookOpen, label: "Library", group: "main" },
  { key: "notes", icon: Notepad, label: "Notes", group: "main" },
  { key: "history", icon: ClockCounterClockwise, label: "History", group: "main" },
  { key: "browser", icon: Globe, label: "Browser", group: "main" },
];

const RPG_RAIL: IconRailItem[] = [
  { key: "rpg-status", icon: GameController, label: "Status", group: "rpg" },
  { key: "rpg-inventory", icon: Backpack, label: "Inventory", group: "rpg" },
  { key: "rpg-quests", icon: Scroll, label: "Quests", group: "rpg" },
  { key: "rpg-character", icon: UserCircle, label: "Character", group: "rpg" },
];

// =============================================================================
// NOTES PANEL (inline — uses existing editor)
// =============================================================================

const NotesPanel: React.FC<{ hex: string }> = ({ hex }) => {
  const notes = useVoice31Store((s) => s.memoryState.notes);
  const activeNoteId = useVoice31Store((s) => s.memoryState.activeNoteId);
  const setActiveNote = useVoice31Store((s) => s.setActiveNote);
  const createNote = useVoice31Store((s) => s.createNote);
  const setEditorVisible = useVoice31Store((s) => s.setEditorVisible);

  const handleCreateNote = useCallback(() => {
    const id = createNote("Untitled Note");
    setActiveNote(id);
    setEditorVisible(true);
  }, [createNote, setActiveNote, setEditorVisible]);

  const handleSelectNote = useCallback(
    (id: string) => {
      setActiveNote(id);
      setEditorVisible(true);
    },
    [setActiveNote, setEditorVisible],
  );

  return (
    <div className="space-y-3">
      <button
        onClick={handleCreateNote}
        className="w-full px-2 py-1.5 rounded text-[10px] font-mono uppercase tracking-wider transition-all hover:bg-white/10"
        style={{ color: hex, border: `1px solid ${hex}30` }}
      >
        + New Note
      </button>

      <div
        className="text-[9px] uppercase tracking-wider font-mono"
        style={{ color: `${hex}30` }}
      >
        {notes.length} note{notes.length !== 1 ? "s" : ""}
      </div>

      <div className="space-y-1.5">
        {notes.length === 0 && (
          <div
            className="text-[10px] font-mono text-center py-6"
            style={{ color: `${hex}40` }}
          >
            No notes yet. Create one or say &quot;take a note&quot;.
          </div>
        )}
        {notes.map((note) => (
          <div
            key={note.id}
            onClick={() => handleSelectNote(note.id)}
            className="px-2 py-1.5 rounded cursor-pointer transition-all hover:bg-white/5"
            style={{
              borderLeft: `2px solid ${note.id === activeNoteId ? hex : `${hex}20`}`,
            }}
          >
            <div
              className="text-[11px] font-mono truncate"
              style={{ color: hex }}
            >
              {note.title}
            </div>
            {note.content && (
              <div
                className="text-[9px] font-mono truncate mt-0.5"
                style={{ color: `${hex}40` }}
              >
                {note.content.slice(0, 60)}
              </div>
            )}
            <div
              className="text-[8px] font-mono mt-0.5"
              style={{ color: `${hex}20` }}
            >
              {new Date(note.updatedAt).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// =============================================================================
// CHAT PANEL (inline — chat history for text mode)
// =============================================================================

const ChatPanel: React.FC<{ hex: string }> = ({ hex }) => {
  const chatMessages = useVoice31Store((s) => s.chatMessages);
  const isProcessing = useVoice31Store((s) => s.isChatProcessing);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages.length]);

  return (
    <div className="flex flex-col h-full -my-3 -mx-3">
      <div
        className="text-[9px] uppercase tracking-wider font-mono px-3 pt-3 pb-1"
        style={{ color: `${hex}30` }}
      >
        {chatMessages.length} message{chatMessages.length !== 1 ? "s" : ""}
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 pb-3 space-y-2"
        style={{ scrollbarWidth: "thin", scrollbarColor: `${hex}20 transparent` }}
      >
        {chatMessages.length === 0 && (
          <div
            className="text-[10px] font-mono text-center py-6"
            style={{ color: `${hex}40` }}
          >
            No messages yet. Type below to chat.
          </div>
        )}
        {chatMessages.map((msg) => (
          <div
            key={msg.id}
            className={`text-[11px] font-mono leading-relaxed px-2 py-1.5 rounded ${
              msg.role === "user" ? "ml-4" : "mr-4"
            }`}
            style={{
              backgroundColor:
                msg.role === "user" ? `${hex}10` : `${hex}08`,
              borderLeft:
                msg.role === "assistant" ? `2px solid ${hex}40` : "none",
              borderRight:
                msg.role === "user" ? `2px solid ${hex}20` : "none",
              color: msg.role === "user" ? `${hex}90` : hex,
            }}
          >
            <div
              className="text-[8px] uppercase tracking-wider mb-0.5"
              style={{ color: `${hex}40` }}
            >
              {msg.role === "user" ? "you" : "assistant"}
            </div>
            {msg.content}
            {msg.toolCalls && msg.toolCalls.length > 0 && (
              <div
                className="mt-1 text-[9px]"
                style={{ color: `${hex}40` }}
              >
                [{msg.toolCalls.map((t) => t.name).join(", ")}]
              </div>
            )}
          </div>
        ))}
        {isProcessing && (
          <div
            className="text-[10px] font-mono animate-pulse px-2 py-1"
            style={{ color: `${hex}60` }}
          >
            thinking...
          </div>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// MAIN SIDE PANEL — Vertical Icon Rail Layout
// =============================================================================

export const Voice31SidePanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AnyTab>("status");
  const phosphorColor = useVoice31Store((s) => s.phosphorColor);
  const browserAutomation = useVoice31Store((s) => s.browserAutomation);
  const interactionMode = useVoice31Store((s) => s.interactionMode);
  const settingsPanelVisible = useVoice31Store(
    (s) => s.assistantSettings.settingsPanelVisible,
  );
  const setSettingsPanelVisible = useVoice31Store(
    (s) => s.setSettingsPanelVisible,
  );

  // RPG mode state
  const rpgModeActive = useVoice31RPGStore((s) => s.rpgModeActive);
  const currentSaveFile = useVoice31RPGStore((s) => s.currentSaveFile);
  const rpgContext = useVoice31RPG();

  const hex = COLORS[phosphorColor] || COLORS.amber;

  // Show indicator dot on browser tab when active
  const hasBrowserActivity = browserAutomation.active;

  // Dynamic tab order: include chat tab when in text/fallback mode
  const isTextMode = interactionMode === "text" || interactionMode === "fallback";

  // Build icon rail based on RPG mode
  const railItems: IconRailItem[] = [];

  // Top section: RPG toggle + Settings
  railItems.push({ key: "settings", icon: GearSix, label: "Settings", group: "top" });

  if (rpgModeActive && currentSaveFile) {
    // RPG mode: show RPG-specific tabs
    RPG_RAIL.forEach((item) => railItems.push(item));
  } else {
    // Standard mode tabs
    STANDARD_RAIL.filter((i) => i.group === "main").forEach((item) => railItems.push(item));
    if (isTextMode) {
      railItems.push({ key: "chat", icon: ChatText, label: "Chat", group: "main" });
    }
  }

  // Sync settings panel visibility with sidebar tab
  useEffect(() => {
    if (settingsPanelVisible) {
      setActiveTab("settings");
    }
  }, [settingsPanelVisible]);

  // When switching away from settings tab, close the settings panel state
  const handleTabChange = useCallback(
    (tab: AnyTab) => {
      setActiveTab(tab);
      if (tab !== "settings" && settingsPanelVisible) {
        setSettingsPanelVisible(false);
      }
      if (tab === "settings" && !settingsPanelVisible) {
        setSettingsPanelVisible(true);
      }
    },
    [settingsPanelVisible, setSettingsPanelVisible],
  );

  // Render RPG panels inline (reuses data from RPG store)
  const renderRPGPanel = (tab: RPGTab) => {
    switch (tab) {
      case "rpg-status":
        return <RPGStatusInline hex={hex} />;
      case "rpg-inventory":
        return <RPGInventoryInline hex={hex} />;
      case "rpg-quests":
        return <RPGQuestsInline hex={hex} />;
      case "rpg-character":
        return <RPGCharacterInline hex={hex} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-full">
      {/* Vertical Icon Rail — 40px wide */}
      <div
        className="flex flex-col items-center py-2 gap-1 flex-shrink-0"
        style={{
          width: 40,
          borderRight: `1px solid ${hex}10`,
          background: 'rgba(0,0,0,0.3)',
        }}
      >
        {/* RPG mode toggle at very top */}
        <button
          onClick={rpgContext.toggleRPGMode}
          className="flex items-center justify-center w-8 h-8 rounded-lg transition-all hover:scale-110 mb-1"
          style={{
            backgroundColor: rpgModeActive ? `${hex}25` : 'transparent',
            border: `1px solid ${rpgModeActive ? hex : `${hex}20`}`,
            color: rpgModeActive ? hex : `${hex}40`,
            boxShadow: rpgModeActive ? `0 0 10px ${hex}30` : 'none',
          }}
          title="RPG Mode"
        >
          <Sword size={16} weight={rpgModeActive ? "bold" : "regular"} />
        </button>

        {/* Divider */}
        <div className="w-5 h-px my-1" style={{ backgroundColor: `${hex}15` }} />

        {/* Rail icons */}
        {railItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.key;
          const showDot = item.key === "browser" && hasBrowserActivity;

          return (
            <button
              key={item.key}
              onClick={() => handleTabChange(item.key)}
              className="relative flex items-center justify-center w-8 h-8 rounded-lg transition-all hover:scale-105"
              style={{
                backgroundColor: isActive ? `${hex}15` : 'transparent',
                borderLeft: isActive ? `2px solid ${hex}` : '2px solid transparent',
                color: isActive ? hex : `${hex}40`,
                boxShadow: isActive ? `inset 0 0 8px ${hex}10` : 'none',
              }}
              title={item.label}
            >
              <Icon size={16} weight={isActive ? "bold" : "regular"} />
              {showDot && (
                <div
                  className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full"
                  style={{
                    backgroundColor:
                      browserAutomation.status === "error"
                        ? "#ff4444"
                        : "#33ff33",
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Content Panel — fills remaining width */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Tab content — scrollable */}
        <div
          className="flex-1 overflow-y-auto px-3 py-3"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: `${hex}20 transparent`,
          }}
        >
          {/* Standard tabs */}
          {activeTab === "status" && <StatusPanel hex={hex} />}
          {activeTab === "uploads" && <UploadPanel hex={hex} />}
          {activeTab === "library" && <LibraryPanel hex={hex} />}
          {activeTab === "notes" && <NotesPanel hex={hex} />}
          {activeTab === "history" && <HistoryPanel hex={hex} />}
          {activeTab === "browser" && <BrowserPanel hex={hex} />}
          {activeTab === "chat" && <ChatPanel hex={hex} />}
          {activeTab === "settings" && <SidebarSettingsPanel hex={hex} />}

          {/* RPG tabs */}
          {(activeTab as string).startsWith("rpg-") && renderRPGPanel(activeTab as RPGTab)}
        </div>

        {/* Footer — Voice31 branding */}
        <div
          className="px-3 py-1.5 border-t text-center"
          style={{ borderColor: `${hex}10` }}
        >
          <div
            className="text-[8px] uppercase tracking-[0.3em] font-mono"
            style={{ color: `${hex}20` }}
          >
            Speech FM
          </div>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// INLINE RPG PANELS (lightweight versions for sidebar integration)
// =============================================================================

const RPGStatusInline: React.FC<{ hex: string }> = ({ hex }) => {
  const player = useVoice31RPGStore((s) => s.currentSaveFile?.player);
  const location = useVoice31RPGStore((s) => s.activeScene.location);
  const quests = useVoice31RPGStore((s) => s.currentSaveFile?.quests) || [];
  const gameTime = useVoice31RPGStore((s) => s.currentSaveFile?.gameTime);

  if (!player) return <div className="text-[10px] font-mono text-center py-6" style={{ color: `${hex}40` }}>No active save file</div>;

  const { stats, gold } = player;
  const activeQuests = quests.filter((q) => q.status === 'active');

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-mono text-xs font-bold" style={{ color: hex }}>{player.name}</div>
          <div className="font-mono text-[10px] opacity-40">Lv.{stats.level} {player.race} {player.class}</div>
        </div>
        <span className="font-mono text-[11px] font-bold" style={{ color: '#ffd700' }}>{gold}g</span>
      </div>

      {/* HP / MP bars */}
      <div className="space-y-1.5">
        <RPGBar label="HP" current={stats.health} max={stats.maxHealth} color="#ff4444" hex={hex} />
        <RPGBar label="MP" current={stats.mana} max={stats.maxMana} color="#4488ff" hex={hex} />
        <RPGBar label="XP" current={stats.experience} max={stats.experienceToLevel} color={hex} hex={hex} />
      </div>

      {location && (
        <div className="px-2 py-1.5 rounded text-[10px] font-mono opacity-70" style={{ background: 'rgba(0,0,0,0.3)' }}>
          {location.name}
        </div>
      )}

      {activeQuests.length > 0 && (
        <div className="px-2 py-1.5 rounded" style={{ background: 'rgba(0,0,0,0.3)', borderLeft: `2px solid ${hex}40` }}>
          <div className="font-mono text-[9px] uppercase tracking-wider opacity-30 mb-0.5" style={{ color: hex }}>Active Quest</div>
          <div className="font-mono text-[10px] font-bold opacity-80" style={{ color: hex }}>{activeQuests[0].name}</div>
        </div>
      )}

      {gameTime && (
        <div className="font-mono text-[9px] opacity-25 text-center">
          Day {gameTime.day} · {String(gameTime.hour).padStart(2, '0')}:{String(gameTime.minute).padStart(2, '0')}
        </div>
      )}
    </div>
  );
};

const RPGBar: React.FC<{ label: string; current: number; max: number; color: string; hex: string }> = ({ label, current, max, color }) => (
  <div className="flex items-center gap-2">
    <span className="font-mono text-[9px] opacity-40 w-5">{label}</span>
    <div className="flex-1 h-1.5 rounded-full bg-black/50 overflow-hidden">
      <div className="h-full transition-all duration-500" style={{ width: `${Math.min(100, (current / max) * 100)}%`, backgroundColor: color }} />
    </div>
    <span className="font-mono text-[9px] w-12 text-right" style={{ color }}>{current}/{max}</span>
  </div>
);

const RPGInventoryInline: React.FC<{ hex: string }> = ({ hex }) => {
  const player = useVoice31RPGStore((s) => s.currentSaveFile?.player);
  if (!player) return null;

  const { inventory, gold } = player;
  const equipped = inventory.filter((i) => i.equipped);
  const unequipped = inventory.filter((i) => !i.equipped);

  const RARITY_COLORS: Record<string, string> = {
    common: '#aaaaaa', uncommon: '#00ff88', rare: '#4488ff', epic: '#aa88ff', legendary: '#ff8800',
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-2 py-1.5 rounded" style={{ background: 'rgba(255, 215, 0, 0.06)', border: '1px solid rgba(255, 215, 0, 0.15)' }}>
        <span className="font-mono text-sm font-bold" style={{ color: '#ffd700' }}>{gold.toLocaleString()}</span>
        <span className="font-mono text-[9px] opacity-40 ml-auto">GOLD</span>
      </div>

      {equipped.length > 0 && (
        <div>
          <div className="font-mono text-[9px] uppercase tracking-wider opacity-30 mb-1" style={{ color: hex }}>Equipped</div>
          {equipped.map((item) => (
            <div key={item.id} className="flex items-center gap-2 px-2 py-1 rounded text-[10px] font-mono hover:bg-white/5"
              style={{ borderLeft: `2px solid ${RARITY_COLORS[item.rarity] || '#aaa'}` }}>
              <span style={{ color: RARITY_COLORS[item.rarity] || '#aaa' }}>{item.name}</span>
              {item.quantity > 1 && <span className="opacity-40">x{item.quantity}</span>}
            </div>
          ))}
        </div>
      )}

      <div>
        <div className="font-mono text-[9px] uppercase tracking-wider opacity-30 mb-1" style={{ color: hex }}>Bag ({unequipped.length})</div>
        {unequipped.length === 0 ? (
          <div className="text-center py-4 font-mono text-[10px] opacity-20">Empty</div>
        ) : (
          unequipped.map((item) => (
            <div key={item.id} className="flex items-center gap-2 px-2 py-1 rounded text-[10px] font-mono hover:bg-white/5"
              style={{ borderLeft: `2px solid ${RARITY_COLORS[item.rarity] || '#aaa'}` }}>
              <span style={{ color: RARITY_COLORS[item.rarity] || '#aaa' }}>{item.name}</span>
              {item.quantity > 1 && <span className="opacity-40">x{item.quantity}</span>}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const RPGQuestsInline: React.FC<{ hex: string }> = ({ hex }) => {
  const quests = useVoice31RPGStore((s) => s.currentSaveFile?.quests) || [];
  const active = quests.filter((q) => q.status === 'active');
  const completed = quests.filter((q) => q.status === 'completed');

  if (quests.length === 0) return <div className="text-center py-6 font-mono text-[10px] opacity-20">No quests yet</div>;

  return (
    <div className="space-y-3">
      {active.length > 0 && (
        <div>
          <div className="font-mono text-[9px] uppercase tracking-wider opacity-30 mb-1" style={{ color: hex }}>Active ({active.length})</div>
          {active.map((quest) => (
            <div key={quest.id} className="px-2 py-2 rounded mb-1" style={{ background: 'rgba(0,0,0,0.3)', borderLeft: `2px solid ${hex}` }}>
              <div className="font-mono text-[10px] font-bold" style={{ color: hex }}>{quest.name}</div>
              <div className="font-mono text-[9px] opacity-50 mt-0.5 line-clamp-2">{quest.description}</div>
              {quest.objectives.length > 0 && (
                <div className="mt-1 space-y-0.5">
                  {quest.objectives.map((obj) => (
                    <div key={obj.id} className="flex items-center gap-1 font-mono text-[9px]">
                      <span style={{ color: obj.completed ? '#00ff88' : 'rgba(255,255,255,0.3)' }}>{obj.completed ? '✓' : '○'}</span>
                      <span className={obj.completed ? 'line-through opacity-30' : 'opacity-60'}>{obj.description}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {completed.length > 0 && (
        <div>
          <div className="font-mono text-[9px] uppercase tracking-wider opacity-30 mb-1" style={{ color: '#00ff88' }}>Completed ({completed.length})</div>
          {completed.map((quest) => (
            <div key={quest.id} className="px-2 py-1.5 rounded mb-1 opacity-50" style={{ background: 'rgba(0,0,0,0.2)' }}>
              <div className="font-mono text-[10px] line-through">{quest.name}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const RPGCharacterInline: React.FC<{ hex: string }> = ({ hex }) => {
  const player = useVoice31RPGStore((s) => s.currentSaveFile?.player);
  if (!player) return null;

  const { stats, abilities } = player;

  return (
    <div className="space-y-3">
      <div>
        <div className="font-mono text-xs font-bold" style={{ color: hex }}>{player.name}</div>
        <div className="font-mono text-[10px] opacity-50">{player.race} {player.class} · Level {stats.level}</div>
      </div>

      <div>
        <div className="font-mono text-[9px] uppercase tracking-wider opacity-30 mb-1" style={{ color: hex }}>Stats</div>
        <div className="grid grid-cols-2 gap-1">
          {[
            ['STR', stats.strength], ['DEX', stats.dexterity],
            ['INT', stats.intelligence], ['WIS', stats.wisdom],
            ['CON', stats.constitution], ['CHA', stats.charisma],
          ].map(([label, value]) => (
            <div key={label as string} className="flex items-center justify-between px-2 py-1 rounded" style={{ background: 'rgba(0,0,0,0.3)' }}>
              <span className="font-mono text-[9px] opacity-50">{label}</span>
              <span className="font-mono text-[11px] font-bold" style={{ color: hex }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {abilities && abilities.length > 0 && (
        <div>
          <div className="font-mono text-[9px] uppercase tracking-wider opacity-30 mb-1" style={{ color: hex }}>Abilities</div>
          {abilities.map((ability) => (
            <div key={ability.id} className="px-2 py-1 rounded mb-0.5 hover:bg-white/5" style={{ borderLeft: `2px solid ${hex}40` }}>
              <div className="font-mono text-[10px] font-bold" style={{ color: hex }}>{ability.name}</div>
              <div className="font-mono text-[9px] opacity-40">{ability.description}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
