'use client';

import React from 'react';
import { Image, MagnifyingGlass, BookOpen, Terminal, FloppyDisk } from '@phosphor-icons/react';
import { useVoice31Store } from '../Voice31Store';
import { useStorytellingStore } from '../storytelling/StorytellingStore';
import type { NarrationMode } from '../storytelling/types';
import { SettingRow, SelectDropdown, CapabilitySection, ToolChip, type SelectOption } from './primitives';

export const ToolsTab: React.FC<{ color: string }> = ({ color }) => {
  const { assistantSettings, updateAssistantConfig } = useVoice31Store();
  const disabledTools = assistantSettings.currentConfig.disabledTools;
  const narrationMode = useStorytellingStore((s) => s.narrationMode);
  const setNarrationMode = useStorytellingStore((s) => s.setNarrationMode);

  const toggleTool = (toolId: string) => {
    const newTools = disabledTools.includes(toolId)
      ? disabledTools.filter(t => t !== toolId)
      : [...disabledTools, toolId];
    updateAssistantConfig({ disabledTools: newTools });
  };

  return (
    <div className="space-y-3">
      <CapabilitySection title="Visual" icon={<Image size={14} />} color={color}>
        <div className="flex flex-wrap gap-1.5 pt-2">
          {[
            { id: 'show_text', name: 'Kinetic Text' },
            { id: 'show_list', name: 'Lists' },
            { id: 'show_image', name: 'AI Images' },
            { id: 'show_wireframe', name: '3D Wireframe' },
            { id: 'show_visualization', name: 'Data Viz' },
            { id: 'trigger_effect', name: 'Effects' },
          ].map((t) => (
            <ToolChip key={t.id} {...t} enabled={!disabledTools.includes(t.id)} onToggle={toggleTool} color={color} />
          ))}
        </div>
      </CapabilitySection>

      <CapabilitySection title="Research" icon={<MagnifyingGlass size={14} />} color={color}>
        <div className="flex flex-wrap gap-1.5 pt-2">
          {[
            { id: 'search_web', name: 'Web Search' },
            { id: 'fetch_article', name: 'Article Fetch' },
          ].map((t) => (
            <ToolChip key={t.id} {...t} enabled={!disabledTools.includes(t.id)} onToggle={toggleTool} color={color} />
          ))}
        </div>
      </CapabilitySection>

      <CapabilitySection title="Story Mode" icon={<BookOpen size={14} />} color={color}>
        <div className="space-y-2 pt-2">
          <div className="flex flex-wrap gap-1.5">
            <ToolChip id="start_visual_story" name="Visual Stories" enabled={!disabledTools.includes('start_visual_story')} onToggle={toggleTool} color={color} />
          </div>
          <SettingRow label="Narration Mode" description="Who narrates the story" color={color}>
            <SelectDropdown
              value={narrationMode}
              options={[
                { value: 'assistant', label: 'Assistant Voice' },
                { value: 'separate_voice', label: 'Separate Voice' },
                { value: 'text_only', label: 'Text Only' },
              ]}
              onChange={(v) => setNarrationMode(v as NarrationMode)}
              color={color}
            />
          </SettingRow>
        </div>
      </CapabilitySection>

      <CapabilitySection title="Code" icon={<Terminal size={14} />} color={color} defaultOpen={false}>
        <div className="flex flex-wrap gap-1.5 pt-2">
          {[
            { id: 'generate_code_display', name: 'Code Gen' },
            { id: 'generate_visual_with_image', name: 'Visual + Image' },
          ].map((t) => (
            <ToolChip key={t.id} {...t} enabled={!disabledTools.includes(t.id)} onToggle={toggleTool} color={color} />
          ))}
        </div>
      </CapabilitySection>

      <CapabilitySection title="Memory" icon={<FloppyDisk size={14} />} color={color} defaultOpen={false}>
        <div className="flex flex-wrap gap-1.5 pt-2">
          {[
            { id: 'remember', name: 'Remember' },
            { id: 'create_note', name: 'Notes' },
          ].map((t) => (
            <ToolChip key={t.id} {...t} enabled={!disabledTools.includes(t.id)} onToggle={toggleTool} color={color} />
          ))}
        </div>
      </CapabilitySection>
    </div>
  );
};
