'use client';

import React from 'react';
import { useVoice31Store } from '../Voice31Store';
import type { VisualDisplayLevel, BackgroundSource } from '../Voice31Store';
import { SettingRow, SelectDropdown, SliderRow, ToggleSwitch } from './primitives';
import type { SelectOption } from './primitives';

// =============================================================================
// DISPLAY LEVEL OPTIONS
// =============================================================================

const DISPLAY_LEVEL_OPTIONS: SelectOption[] = [
  { value: 'off', label: 'Off' },
  { value: 'minimal', label: 'Minimal' },
  { value: 'standard', label: 'Standard' },
  { value: 'cinematic', label: 'Cinematic' },
];

const BACKGROUND_SOURCE_OPTIONS: SelectOption[] = [
  { value: 'auto', label: 'Auto' },
  { value: 'unsplash', label: 'Unsplash' },
  { value: 'flux', label: 'Flux AI' },
];

// =============================================================================
// BUDGET DISPLAY
// =============================================================================

const BudgetDisplay: React.FC<{ color: string }> = ({ color }) => {
  const vi = useVoice31Store((s) => s.visualIntelligence);

  return (
    <div className="flex items-center gap-4 py-3 border-b border-white/5">
      <div className="flex-1">
        <div className="text-sm font-medium" style={{ color }}>Session Budget</div>
        <div className="text-xs text-white/40 mt-0.5">Usage resets each session</div>
      </div>
      <div className="flex items-center gap-3 text-xs font-mono">
        <div className="flex items-center gap-1.5 px-2 py-1 rounded" style={{ backgroundColor: `${color}10`, border: `1px solid ${color}20` }}>
          <div className="w-1.5 h-1.5 rounded-full" style={{
            backgroundColor: vi.fluxGenerationsUsed >= 30 ? '#ff4444' : color,
          }} />
          <span style={{ color: `${color}90` }}>
            {vi.fluxGenerationsUsed}/30 Flux
          </span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded" style={{ backgroundColor: `${color}10`, border: `1px solid ${color}20` }}>
          <div className="w-1.5 h-1.5 rounded-full" style={{
            backgroundColor: vi.unsplashRequestsUsed >= 40 ? '#ff4444' : color,
          }} />
          <span style={{ color: `${color}90` }}>
            {vi.unsplashRequestsUsed}/40 Unsplash
          </span>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// MAIN TAB
// =============================================================================

interface VisualsTabProps {
  color: string;
}

export const VisualsTab: React.FC<VisualsTabProps> = ({ color }) => {
  const vi = useVoice31Store((s) => s.visualIntelligence);
  const setDisplayLevel = useVoice31Store((s) => s.setDisplayLevel);
  const setBackgroundSource = useVoice31Store((s) => s.setBackgroundSource);
  const updateVisualIntelligenceSettings = useVoice31Store((s) => s.updateVisualIntelligenceSettings);

  return (
    <div className="space-y-1">
      {/* Description */}
      <div className="text-xs text-white/50 mb-4 leading-relaxed">
        Configure how the CRT display reacts to conversation context.
        Standard mode uses stock photos, Cinematic mode generates AI backgrounds.
      </div>

      {/* Display Level */}
      <SettingRow label="Display Level" description="Controls ambient visual intensity" color={color}>
        <SelectDropdown
          value={vi.displayLevel}
          options={DISPLAY_LEVEL_OPTIONS}
          onChange={(v) => setDisplayLevel(v as VisualDisplayLevel)}
          color={color}
        />
      </SettingRow>

      {/* Background Source */}
      <SettingRow label="Background Source" description="Where to fetch ambient backgrounds" color={color}>
        <SelectDropdown
          value={vi.backgroundSource}
          options={BACKGROUND_SOURCE_OPTIONS}
          onChange={(v) => setBackgroundSource(v as BackgroundSource)}
          color={color}
        />
      </SettingRow>

      {/* Background Opacity */}
      <SliderRow
        label="Background Opacity"
        description="How visible the ambient background is"
        value={vi.backgroundOpacity}
        min={0}
        max={1}
        step={0.05}
        color={color}
        onChange={(v) => updateVisualIntelligenceSettings({ backgroundOpacity: v })}
        format={(v) => `${Math.round(v * 100)}%`}
      />

      {/* Transition Interval */}
      <SliderRow
        label="Transition Interval"
        description="Minimum seconds between background changes"
        value={vi.transitionInterval}
        min={10}
        max={120}
        step={5}
        color={color}
        onChange={(v) => updateVisualIntelligenceSettings({ transitionInterval: Math.round(v) })}
        format={(v) => `${Math.round(v)}s`}
      />

      {/* Topic Detection Toggle */}
      <SettingRow label="Topic Detection" description="Automatically detect conversation topics" color={color}>
        <ToggleSwitch
          enabled={vi.topicDetectionEnabled}
          onToggle={() => updateVisualIntelligenceSettings({ topicDetectionEnabled: !vi.topicDetectionEnabled })}
          color={color}
        />
      </SettingRow>

      {/* Budget Display */}
      <BudgetDisplay color={color} />

      {/* Level descriptions */}
      <div className="mt-4 space-y-2">
        <div className="text-xs font-mono uppercase tracking-wider" style={{ color: `${color}80` }}>Level Details</div>
        {[
          { level: 'Off', desc: 'Black CRT. No ambient visuals. Kinetic text disabled.' },
          { level: 'Minimal', desc: 'Current behavior: kinetic text, wireframes on demand.' },
          { level: 'Standard', desc: 'Kinetic text + Unsplash backgrounds + topic particles.' },
          { level: 'Cinematic', desc: 'Kinetic text + Flux AI backgrounds + full CRT transitions.' },
        ].map((item) => (
          <div key={item.level} className="flex gap-2 text-xs">
            <span className="font-mono w-20 shrink-0" style={{ color: `${color}90` }}>{item.level}</span>
            <span className="text-white/40">{item.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VisualsTab;
