'use client';

import React, { useMemo, useCallback } from 'react';
import { useVoice31Store, type ArtifactType, type Artifact } from '../Voice31Store';
import {
  MagnifyingGlass,
  Notepad,
  Code,
  Image,
  Article,
  CloudSun,
  Sword,
  Globe,
  PushPin,
  Trash,
  FileText,
} from '@phosphor-icons/react';

interface LibraryPanelProps {
  hex: string;
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  note: Notepad,
  document: FileText,
  code_generation: Code,
  image_generation: Image,
  search_result: Globe,
  article: Article,
  weather_snapshot: CloudSun,
  rpg_scene: Sword,
  rpg_character: Sword,
  story_session: FileText,
  browser_result: Globe,
  file: FileText,
};

const FILTER_CHIPS: { label: string; value: ArtifactType | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Notes', value: 'note' },
  { label: 'Code', value: 'code_generation' },
  { label: 'Images', value: 'image_generation' },
  { label: 'Articles', value: 'article' },
  { label: 'Weather', value: 'weather_snapshot' },
  { label: 'RPG', value: 'rpg_scene' },
  { label: 'Browser', value: 'browser_result' },
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

export const LibraryPanel: React.FC<LibraryPanelProps> = ({ hex }) => {
  const artifacts = useVoice31Store((s) => s.artifacts);
  const filter = useVoice31Store((s) => s.artifactFilter);
  const search = useVoice31Store((s) => s.artifactSearch);
  const setFilter = useVoice31Store((s) => s.setArtifactFilter);
  const setSearch = useVoice31Store((s) => s.setArtifactSearch);
  const pinArtifact = useVoice31Store((s) => s.pinArtifact);
  const deleteArtifact = useVoice31Store((s) => s.deleteArtifact);

  const filtered = useMemo(() => {
    let list = artifacts;
    if (filter !== 'all') {
      list = list.filter((a) => a.type === filter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    // Pinned first, then by date
    return [...list].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.createdAt - a.createdAt;
    });
  }, [artifacts, filter, search]);

  const handlePin = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      pinArtifact(id);
    },
    [pinArtifact]
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      deleteArtifact(id);
    },
    [deleteArtifact]
  );

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <MagnifyingGlass
          size={12}
          className="absolute left-2 top-1/2 -translate-y-1/2"
          style={{ color: `${hex}50` }}
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search artifacts..."
          className="w-full bg-white/5 border rounded px-2 py-1.5 pl-7 text-[11px] font-mono outline-none transition-colors focus:bg-white/10"
          style={{ borderColor: `${hex}20`, color: hex }}
        />
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-1">
        {FILTER_CHIPS.map((chip) => (
          <button
            key={chip.value}
            onClick={() => setFilter(chip.value)}
            className="px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider transition-all"
            style={{
              color: filter === chip.value ? '#000' : `${hex}70`,
              backgroundColor: filter === chip.value ? hex : `${hex}10`,
              borderColor: `${hex}20`,
            }}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Artifact Count */}
      <div className="text-[9px] uppercase tracking-wider font-mono" style={{ color: `${hex}30` }}>
        {filtered.length} artifact{filtered.length !== 1 ? 's' : ''}
      </div>

      {/* Artifact List */}
      <div className="space-y-1.5">
        {filtered.length === 0 && (
          <div className="text-[10px] font-mono text-center py-6" style={{ color: `${hex}40` }}>
            No artifacts yet. Start talking to create some.
          </div>
        )}
        {filtered.map((artifact) => {
          const Icon = TYPE_ICONS[artifact.type] || FileText;
          return (
            <div
              key={artifact.id}
              className="group flex items-start gap-2 px-2 py-1.5 rounded cursor-pointer transition-all hover:bg-white/5"
              style={{ borderLeft: `2px solid ${artifact.pinned ? hex : `${hex}20`}` }}
            >
              <Icon size={14} style={{ color: `${hex}60` }} className="mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-mono truncate" style={{ color: hex }}>
                  {artifact.title}
                </div>
                {artifact.preview && (
                  <div
                    className="text-[9px] font-mono truncate mt-0.5"
                    style={{ color: `${hex}40` }}
                  >
                    {artifact.preview}
                  </div>
                )}
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[8px] font-mono" style={{ color: `${hex}30` }}>
                    {timeAgo(artifact.createdAt)}
                  </span>
                  {artifact.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="text-[7px] font-mono px-1 rounded"
                      style={{ color: `${hex}50`, backgroundColor: `${hex}10` }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              {/* Actions */}
              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                <button
                  onClick={(e) => handlePin(e, artifact.id)}
                  className="p-0.5 rounded hover:bg-white/10"
                >
                  <PushPin
                    size={10}
                    weight={artifact.pinned ? 'fill' : 'regular'}
                    style={{ color: artifact.pinned ? hex : `${hex}40` }}
                  />
                </button>
                <button
                  onClick={(e) => handleDelete(e, artifact.id)}
                  className="p-0.5 rounded hover:bg-white/10"
                >
                  <Trash size={10} style={{ color: '#ff444480' }} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
