'use client';

import React, { useMemo, useState } from 'react';
import { useVoice31Store } from '../Voice31Store';
import { Code, Image, Globe, Clock } from '@phosphor-icons/react';

interface HistoryPanelProps {
  hex: string;
}

type HistorySubTab = 'code' | 'images' | 'browser';

const SUB_TABS: { key: HistorySubTab; label: string; icon: React.ElementType; type: string }[] = [
  { key: 'code', label: 'Code', icon: Code, type: 'code_generation' },
  { key: 'images', label: 'Images', icon: Image, type: 'image_generation' },
  { key: 'browser', label: 'Browser', icon: Globe, type: 'browser_result' },
];

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ hex }) => {
  const [subTab, setSubTab] = useState<HistorySubTab>('code');
  const artifacts = useVoice31Store((s) => s.artifacts);

  const activeSubTab = SUB_TABS.find((t) => t.key === subTab)!;

  const filtered = useMemo(() => {
    return artifacts
      .filter((a) => a.type === activeSubTab.type)
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [artifacts, activeSubTab.type]);

  return (
    <div className="space-y-3">
      {/* Sub-tabs */}
      <div className="flex gap-0.5">
        {SUB_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = subTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setSubTab(tab.key)}
              className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono transition-all"
              style={{
                color: isActive ? '#000' : `${hex}60`,
                backgroundColor: isActive ? hex : 'transparent',
              }}
            >
              <Icon size={12} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Count */}
      <div className="text-[9px] uppercase tracking-wider font-mono" style={{ color: `${hex}30` }}>
        {filtered.length} {activeSubTab.label.toLowerCase()}
      </div>

      {/* History List */}
      <div className="space-y-1.5">
        {filtered.length === 0 && (
          <div className="text-[10px] font-mono text-center py-6" style={{ color: `${hex}40` }}>
            No {activeSubTab.label.toLowerCase()} history yet.
          </div>
        )}
        {filtered.map((item) => (
          <div
            key={item.id}
            className="px-2 py-1.5 rounded cursor-pointer transition-all hover:bg-white/5"
            style={{ borderLeft: `2px solid ${hex}20` }}
          >
            <div className="text-[11px] font-mono truncate" style={{ color: hex }}>
              {item.title}
            </div>
            {item.preview && (
              <div className="text-[9px] font-mono truncate mt-0.5" style={{ color: `${hex}40` }}>
                {item.preview}
              </div>
            )}
            <div className="flex items-center gap-1 mt-0.5">
              <Clock size={8} style={{ color: `${hex}30` }} />
              <span className="text-[8px] font-mono" style={{ color: `${hex}30` }}>
                {timeAgo(item.createdAt)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
