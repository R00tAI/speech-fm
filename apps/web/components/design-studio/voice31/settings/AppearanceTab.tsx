"use client";

import { CheckCircle, Monitor, Terminal } from "@phosphor-icons/react";
import type React from "react";
import {
  type AspectRatioMode,
  type AssistantVisual,
  type ScreenType,
  useVoice31Store,
} from "../Voice31Store";
import {
  ColorPicker,
  SelectDropdown,
  type SelectOption,
  SettingRow,
} from "./primitives";

export const AppearanceTab: React.FC<{ color: string }> = ({ color }) => {
  const { assistantSettings, updateAssistantConfig } = useVoice31Store();
  const config = assistantSettings.currentConfig;

  const screenTypes: SelectOption[] = [
    { value: "crt", label: "CRT Monitor", icon: <Monitor size={14} /> },
    { value: "modern", label: "Modern", icon: <Monitor size={14} /> },
    { value: "terminal", label: "Terminal", icon: <Terminal size={14} /> },
    { value: "hologram", label: "Hologram", icon: <CheckCircle size={14} /> },
    { value: "minimal", label: "Minimal", icon: <Monitor size={14} /> },
  ];

  const visualTypes: SelectOption[] = [
    { value: "binary", label: "Binary Assistant" },
    { value: "waveform", label: "Waveform" },
    { value: "orb", label: "Energy Orb" },
    { value: "avatar", label: "Avatar" },
    { value: "none", label: "None" },
  ];

  const aspectRatioOptions: SelectOption[] = [
    { value: "16:9", label: "16:9 Widescreen" },
    { value: "4:3", label: "4:3 Classic" },
    { value: "none", label: "Fill (No Constraint)" },
  ];

  return (
    <div className="space-y-1">
      <SettingRow
        label="Screen Type"
        description="Visual style of the display"
        color={color}
      >
        <SelectDropdown
          value={config.screenType}
          options={screenTypes}
          onChange={(v) =>
            updateAssistantConfig({ screenType: v as ScreenType })
          }
          color={color}
        />
      </SettingRow>
      <SettingRow
        label="Phosphor Color"
        description="Main accent color"
        color={color}
      >
        <ColorPicker
          value={config.phosphorColor}
          onChange={(c) => updateAssistantConfig({ phosphorColor: c })}
        />
      </SettingRow>
      <SettingRow
        label="Assistant Visual"
        description="Visual representation"
        color={color}
      >
        <SelectDropdown
          value={config.assistantVisual}
          options={visualTypes}
          onChange={(v) =>
            updateAssistantConfig({ assistantVisual: v as AssistantVisual })
          }
          color={color}
        />
      </SettingRow>
      <SettingRow
        label="Aspect Ratio"
        description="Display aspect ratio"
        color={color}
      >
        <SelectDropdown
          value={config.aspectRatio ?? "16:9"}
          options={aspectRatioOptions}
          onChange={(v) =>
            updateAssistantConfig({ aspectRatio: v as AspectRatioMode })
          }
          color={color}
        />
      </SettingRow>
    </div>
  );
};
