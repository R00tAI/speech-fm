'use client';

import React from 'react';
import { useVoice31Store, type VoiceBackendType } from '../Voice31Store';
import { SettingRow, SelectDropdown, TextInput, type SelectOption } from './primitives';

export const VoiceTab: React.FC<{ color: string }> = ({ color }) => {
  const { assistantSettings, updateVoiceConfig } = useVoice31Store();
  const config = assistantSettings.currentConfig.voice;

  const backends: SelectOption[] = [
    { value: 'elevenlabs', label: 'Realtime Voice' },
    { value: 'hume', label: 'Expressive Voice' },
    { value: 'text', label: 'Text Chat' },
  ];

  return (
    <div className="space-y-1">
      <SettingRow label="Voice Backend" description="Voice AI provider" color={color}>
        <SelectDropdown value={config.backend} options={backends}
          onChange={(v) => updateVoiceConfig({ backend: v as VoiceBackendType })} color={color} />
      </SettingRow>
      <SettingRow label="Voice Name" description="Display name for the voice" color={color}>
        <TextInput value={config.voiceName || ''} onChange={(v) => updateVoiceConfig({ voiceName: v })}
          placeholder="Enter voice name" color={color} />
      </SettingRow>
      {config.backend === 'elevenlabs' && (
        <SettingRow label="Agent ID" description="Voice agent ID" color={color}>
          <TextInput value={config.agentId || ''} onChange={(v) => updateVoiceConfig({ agentId: v })}
            placeholder="Enter agent ID" color={color} />
        </SettingRow>
      )}
      {config.backend === 'hume' && (
        <SettingRow label="Config ID" description="Voice config ID" color={color}>
          <TextInput value={config.configId || ''} onChange={(v) => updateVoiceConfig({ configId: v })}
            placeholder="Enter config ID" color={color} />
        </SettingRow>
      )}
    </div>
  );
};
