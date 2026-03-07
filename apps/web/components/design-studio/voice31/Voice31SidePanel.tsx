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

const COLORS: Record<string, string> = {
  green: "#33ff33",
  amber: "#ffaa00",
  red: "#ff4444",
  blue: "#4488ff",
  white: "#ffffff",
};

const TAB_CONFIG: Record<
  SidebarTab,
  { icon: React.ElementType; label: string }
> = {
  status: { icon: Plugs, label: "Status" },
  uploads: { icon: CloudArrowUp, label: "Uploads" },
  library: { icon: BookOpen, label: "Library" },
  notes: { icon: Notepad, label: "Notes" },
  history: { icon: ClockCounterClockwise, label: "History" },
  browser: { icon: Globe, label: "Browser" },
  chat: { icon: ChatText, label: "Chat" },
  settings: { icon: GearSix, label: "Settings" },
};

const TAB_ORDER_BASE: SidebarTab[] = [
  "status",
  "uploads",
  "library",
  "notes",
  "history",
  "browser",
  "settings",
];

// =============================================================================
// NOTES PANEL (inline — uses existing editor)
// =============================================================================

const NotesPanel: React.FC<{ hex: string }> = ({ hex }) => {
  const notes = useVoice31Store((s) => s.memoryState.notes);
  const activeNoteId = useVoice31Store((s) => s.memoryState.activeNoteId);
  const setActiveNote = useVoice31Store((s) => s.setActiveNote);
  const createNote = useVoice31Store((s) => s.createNote);
  const deleteNote = useVoice31Store((s) => s.deleteNote);
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
            No notes yet. Create one or say "take a note".
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
// MAIN SIDE PANEL
// =============================================================================

export const Voice31SidePanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SidebarTab>("status");
  const phosphorColor = useVoice31Store((s) => s.phosphorColor);
  const browserAutomation = useVoice31Store((s) => s.browserAutomation);
  const interactionMode = useVoice31Store((s) => s.interactionMode);
  const settingsPanelVisible = useVoice31Store(
    (s) => s.assistantSettings.settingsPanelVisible,
  );
  const setSettingsPanelVisible = useVoice31Store(
    (s) => s.setSettingsPanelVisible,
  );

  const hex = COLORS[phosphorColor] || COLORS.amber;

  // Show indicator dot on browser tab when active
  const hasBrowserActivity = browserAutomation.active;

  // Dynamic tab order: include chat tab when in text/fallback mode
  const isTextMode = interactionMode === "text" || interactionMode === "fallback";
  const TAB_ORDER: SidebarTab[] = isTextMode
    ? [...TAB_ORDER_BASE.slice(0, -1), "chat", "settings"]
    : TAB_ORDER_BASE;

  // Sync settings panel visibility with sidebar tab
  useEffect(() => {
    if (settingsPanelVisible) {
      setActiveTab("settings");
    }
  }, [settingsPanelVisible]);

  // When switching away from settings tab, close the settings panel state
  const handleTabChange = useCallback(
    (tab: SidebarTab) => {
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

  return (
    <div className="flex flex-col h-full">
      {/* Tab strip */}
      <div
        className="flex items-center gap-0.5 px-1.5 py-1.5 border-b"
        style={{ borderColor: `${hex}15` }}
      >
        {TAB_ORDER.map((tab) => {
          const config = TAB_CONFIG[tab];
          const Icon = config.icon;
          const isActive = activeTab === tab;
          const showDot = tab === "browser" && hasBrowserActivity;

          return (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className="relative flex items-center gap-1 px-2 py-1 rounded text-[9px] font-mono transition-all"
              style={{
                color: isActive ? "#000" : `${hex}50`,
                backgroundColor: isActive ? hex : "transparent",
              }}
              title={config.label}
            >
              <Icon size={12} weight={isActive ? "fill" : "regular"} />
              <span className="hidden xl:inline">{config.label}</span>
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

      {/* Tab content — scrollable */}
      <div
        className="flex-1 overflow-y-auto px-3 py-3"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: `${hex}20 transparent`,
        }}
      >
        {activeTab === "status" && <StatusPanel hex={hex} />}
        {activeTab === "uploads" && <UploadPanel hex={hex} />}
        {activeTab === "library" && <LibraryPanel hex={hex} />}
        {activeTab === "notes" && <NotesPanel hex={hex} />}
        {activeTab === "history" && <HistoryPanel hex={hex} />}
        {activeTab === "browser" && <BrowserPanel hex={hex} />}
        {activeTab === "chat" && <ChatPanel hex={hex} />}
        {activeTab === "settings" && <SidebarSettingsPanel hex={hex} />}
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
  );
};
