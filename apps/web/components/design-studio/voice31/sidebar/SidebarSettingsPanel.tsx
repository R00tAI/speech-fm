"use client";

/**
 * SidebarSettingsPanel
 *
 * Inline settings panel for the sidebar.
 * Renders the same settings sub-tabs as the old fullscreen modal,
 * but compact enough for a 280px sidebar.
 */

import {
  Brain,
  CheckCircle,
  Code,
  Eye,
  FloppyDisk,
  Microphone,
  Palette,
  Sliders,
  Sword,
  Trash,
} from "@phosphor-icons/react";
import type React from "react";
import { useState } from "react";
import { AppearanceTab } from "../settings/AppearanceTab";
import { EmbedTab } from "../settings/EmbedTab";
import { PersonalityTab } from "../settings/PersonalityTab";
import { RPGTab } from "../settings/RPGTab";
import { ToolsTab } from "../settings/ToolsTab";
import { VisualsTab } from "../settings/VisualsTab";
import { VoiceTab } from "../settings/VoiceTab";
import type { AssistantSettingsState } from "../Voice31Store";
import { useVoice31Store } from "../Voice31Store";

// =============================================================================
// TYPES
// =============================================================================

type SettingsSubTab = AssistantSettingsState["activeTab"];

interface SidebarSettingsPanelProps {
  hex: string;
}

const SETTINGS_TABS: {
  id: SettingsSubTab;
  label: string;
  icon: React.ElementType;
}[] = [
  { id: "appearance", label: "Look", icon: Palette },
  { id: "voice", label: "Voice", icon: Microphone },
  { id: "personality", label: "AI", icon: Brain },
  { id: "tools", label: "Tools", icon: Sliders },
  { id: "visuals", label: "Visuals", icon: Eye },
  { id: "embed", label: "Embed", icon: Code },
  { id: "rpg", label: "RPG", icon: Sword },
];

// =============================================================================
// SIDEBAR SETTINGS PANEL
// =============================================================================

export const SidebarSettingsPanel: React.FC<SidebarSettingsPanelProps> = ({
  hex,
}) => {
  const {
    assistantSettings,
    setSettingsTab,
    saveCurrentAssistant,
    loadAssistant,
    deleteAssistant,
  } = useVoice31Store();

  const [saveFlash, setSaveFlash] = useState(false);

  const { activeTab, savedAssistants, currentConfig } = assistantSettings;

  const handleSave = () => {
    saveCurrentAssistant();
    setSaveFlash(true);
    setTimeout(() => setSaveFlash(false), 1500);
  };

  return (
    <div className="space-y-3">
      {/* Settings sub-tabs — compact icon row */}
      <div className="flex flex-wrap gap-1">
        {SETTINGS_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSettingsTab(tab.id)}
              className="flex items-center gap-1 px-1.5 py-1 rounded text-[9px] font-mono transition-all"
              style={{
                color: isActive ? "#000" : `${hex}60`,
                backgroundColor: isActive ? hex : `${hex}10`,
                border: `1px solid ${isActive ? hex : `${hex}20`}`,
              }}
              title={tab.label}
            >
              <Icon size={11} weight={isActive ? "fill" : "regular"} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Assistant name */}
      <div
        className="text-[9px] font-mono uppercase tracking-wider px-1"
        style={{ color: `${hex}40` }}
      >
        {currentConfig.name}
      </div>

      {/* Active tab content */}
      <div className="min-h-0">
        {activeTab === "appearance" && <AppearanceTab color={hex} />}
        {activeTab === "voice" && <VoiceTab color={hex} />}
        {activeTab === "personality" && <PersonalityTab color={hex} />}
        {activeTab === "tools" && <ToolsTab color={hex} />}
        {activeTab === "visuals" && <VisualsTab color={hex} />}
        {activeTab === "embed" && <EmbedTab color={hex} />}
        {activeTab === "rpg" && <RPGTab color={hex} />}
      </div>

      {/* Save / Load / Delete bar */}
      <div
        className="pt-3 border-t space-y-2"
        style={{ borderColor: `${hex}15` }}
      >
        {/* Saved assistants */}
        {savedAssistants.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {savedAssistants.slice(0, 4).map((assistant) => (
              <button
                key={assistant.id}
                onClick={() => loadAssistant(assistant.id)}
                className="px-1.5 py-0.5 rounded text-[8px] font-mono transition-all hover:bg-white/5"
                style={{
                  backgroundColor:
                    assistant.id === currentConfig.id
                      ? `${hex}20`
                      : "transparent",
                  border: `1px solid ${assistant.id === currentConfig.id ? hex : `${hex}30`}`,
                  color: assistant.id === currentConfig.id ? hex : `${hex}60`,
                }}
              >
                {assistant.name.slice(0, 8)}
              </button>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-1.5">
          {!currentConfig.isDefault && (
            <button
              onClick={() => deleteAssistant(currentConfig.id)}
              className="flex items-center gap-1 px-2 py-1 rounded text-[9px] font-mono transition-all hover:bg-red-500/20"
              style={{ color: "#ff4444", border: "1px solid #ff444430" }}
            >
              <Trash size={11} /> Del
            </button>
          )}
          <button
            onClick={handleSave}
            className="flex items-center gap-1 px-2 py-1 rounded text-[9px] font-mono transition-all flex-1 justify-center"
            style={{
              backgroundColor: saveFlash ? "#00ff8840" : `${hex}20`,
              border: `1px solid ${saveFlash ? "#00ff88" : hex}`,
              color: saveFlash ? "#00ff88" : hex,
            }}
          >
            {saveFlash ? (
              <CheckCircle size={11} weight="fill" />
            ) : (
              <FloppyDisk size={11} />
            )}
            {saveFlash ? "Saved" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};
