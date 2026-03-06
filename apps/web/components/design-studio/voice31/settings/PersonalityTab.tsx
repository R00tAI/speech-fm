'use client';

import React from 'react';
import { useVoice31Store } from '../Voice31Store';
import { SettingRow, SelectDropdown, TextInput, type SelectOption } from './primitives';

export const PersonalityTab: React.FC<{ color: string }> = ({ color }) => {
  const { assistantSettings, updatePersonalityConfig, updateAssistantConfig } = useVoice31Store();
  const config = assistantSettings.currentConfig;
  const personality = config.personality;

  const personalityTypes: SelectOption[] = [
    { value: 'professional', label: 'Professional' },
    { value: 'friendly', label: 'Friendly' },
    { value: 'creative', label: 'Creative' },
    { value: 'technical', label: 'Technical' },
    { value: 'custom', label: 'Custom' },
  ];

  return (
    <div className="space-y-1">
      <SettingRow label="Assistant Name" description="Name of your assistant" color={color}>
        <TextInput value={config.name} onChange={(v) => updateAssistantConfig({ name: v })}
          placeholder="Enter name" color={color} />
      </SettingRow>
      <SettingRow label="Personality Type" description="Base personality style" color={color}>
        <SelectDropdown value={personality.personality} options={personalityTypes}
          onChange={(v) => updatePersonalityConfig({ personality: v as any })} color={color} />
      </SettingRow>
      <SettingRow label="Greeting" description="Initial greeting message" color={color}>
        <TextInput value={personality.greeting || ''} onChange={(v) => updatePersonalityConfig({ greeting: v })}
          placeholder="Hello! How can I help?" color={color} />
      </SettingRow>
      <div className="pt-3">
        <div className="text-sm font-medium mb-2" style={{ color }}>System Prompt</div>
        <TextInput value={personality.systemPrompt} onChange={(v) => updatePersonalityConfig({ systemPrompt: v })}
          placeholder="Enter system instructions..." color={color} multiline />
      </div>
    </div>
  );
};
