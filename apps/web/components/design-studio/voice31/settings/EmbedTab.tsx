'use client';

import React, { useState } from 'react';
import { Copy } from '@phosphor-icons/react';
import { useVoice31Store } from '../Voice31Store';
import { SettingRow, SelectDropdown } from './primitives';

export const EmbedTab: React.FC<{ color: string }> = ({ color }) => {
  const { assistantSettings, setEmbedSettings, generateEmbedCode } = useVoice31Store();
  const [copied, setCopied] = useState(false);

  const embedCode = generateEmbedCode();

  const copyToClipboard = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const inputStyle = {
    backgroundColor: `${color}10`,
    border: `1px solid ${color}30`,
    color,
  };

  return (
    <div className="space-y-4">
      <SettingRow label="Width" description="Embed width in pixels" color={color}>
        <input type="number" value={assistantSettings.embedWidth}
          onChange={(e) => setEmbedSettings({ embedWidth: parseInt(e.target.value) || 800 })}
          className="w-24 px-3 py-1.5 rounded-lg text-sm font-mono focus:outline-none" style={inputStyle} />
      </SettingRow>

      <SettingRow label="Height" description="Embed height in pixels" color={color}>
        <input type="number" value={assistantSettings.embedHeight}
          onChange={(e) => setEmbedSettings({ embedHeight: parseInt(e.target.value) || 600 })}
          className="w-24 px-3 py-1.5 rounded-lg text-sm font-mono focus:outline-none" style={inputStyle} />
      </SettingRow>

      <SettingRow label="Theme" description="Embed theme mode" color={color}>
        <SelectDropdown value={assistantSettings.embedTheme}
          options={[
            { value: 'dark', label: 'Dark' },
            { value: 'light', label: 'Light' },
            { value: 'auto', label: 'Auto' },
          ]}
          onChange={(v) => setEmbedSettings({ embedTheme: v as any })}
          color={color} />
      </SettingRow>

      <div className="pt-3">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium" style={{ color }}>Embed Code</div>
          <button onClick={copyToClipboard}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-mono transition-all hover:bg-white/5"
            style={{ color }}>
            <Copy size={12} />
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <pre className="p-3 rounded-lg text-xs font-mono overflow-x-auto"
          style={{ backgroundColor: `${color}10`, border: `1px solid ${color}30`, color: `${color}cc` }}>
          {embedCode}
        </pre>
      </div>
    </div>
  );
};
