'use client';

import React from 'react';
import {
  Sword,
  Book,
  Backpack,
  Scroll,
  UserCircle,
  SlidersHorizontal,
} from '@phosphor-icons/react';
import { useVoice31Store } from '../Voice31Store';
import { useVoice31RPGStore } from '../Voice31RPGStore';
import { useVoice31RPG } from '../Voice31RPGProvider';

/**
 * Control Bar
 * Top-right buttons: RPG toggle, RPG panels, notes, settings.
 * Uses absolute positioning (not fixed) for plugin panel compatibility.
 */

export const ControlBar: React.FC = () => {
  const phosphorColor = useVoice31Store((s) => s.phosphorColor);

  const rpgModeActive = useVoice31RPGStore((s) => s.rpgModeActive);
  const currentSaveFile = useVoice31RPGStore((s) => s.currentSaveFile);
  const saveFileViewerOpen = useVoice31RPGStore((s) => s.saveFileViewerOpen);
  const sceneInspectorOpen = useVoice31RPGStore((s) => s.sceneInspectorOpen);
  const toggleInventory = useVoice31RPGStore((s) => s.toggleInventory);
  const toggleQuestLog = useVoice31RPGStore((s) => s.toggleQuestLog);
  const toggleCharacterSheet = useVoice31RPGStore((s) => s.toggleCharacterSheet);
  const toggleSaveFileViewer = useVoice31RPGStore((s) => s.toggleSaveFileViewer);
  const toggleSceneInspector = useVoice31RPGStore((s) => s.toggleSceneInspector);

  const rpgContext = useVoice31RPG();
  const toggleRPGMode = rpgContext.toggleRPGMode;

  const phosphorHex = {
    green: '#33ff33',
    amber: '#ffaa00',
    red: '#ff4444',
    blue: '#4488ff',
    white: '#ffffff',
  }[phosphorColor] || '#ffaa00';

  return (
    <div className="absolute top-4 right-4 z-40 flex items-center gap-2">
      {/* RPG Mode Toggle */}
      <button
        onClick={toggleRPGMode}
        className="p-2 rounded-lg transition-all hover:scale-110"
        style={{
          backgroundColor: rpgModeActive ? `${phosphorHex}30` : `${phosphorHex}15`,
          border: `1px solid ${rpgModeActive ? phosphorHex : `${phosphorHex}40`}`,
          color: phosphorHex,
          boxShadow: rpgModeActive ? `0 0 15px ${phosphorHex}40` : `0 0 10px ${phosphorHex}20`,
        }}
        title="RPG Mode"
      >
        <Sword size={20} weight="bold" />
      </button>

      {/* RPG Panel Buttons (RPG Mode only) */}
      {rpgModeActive && currentSaveFile && (
        <>
          <button
            onClick={toggleInventory}
            className="p-2 rounded-lg transition-all hover:scale-110"
            style={{
              backgroundColor: `${phosphorHex}15`,
              border: `1px solid ${phosphorHex}40`,
              color: phosphorHex,
              boxShadow: `0 0 10px ${phosphorHex}20`,
            }}
            title="Inventory (I)"
          >
            <Backpack size={20} weight="bold" />
          </button>
          <button
            onClick={toggleQuestLog}
            className="p-2 rounded-lg transition-all hover:scale-110"
            style={{
              backgroundColor: `${phosphorHex}15`,
              border: `1px solid ${phosphorHex}40`,
              color: phosphorHex,
              boxShadow: `0 0 10px ${phosphorHex}20`,
            }}
            title="Quests (Q)"
          >
            <Scroll size={20} weight="bold" />
          </button>
          <button
            onClick={toggleCharacterSheet}
            className="p-2 rounded-lg transition-all hover:scale-110"
            style={{
              backgroundColor: `${phosphorHex}15`,
              border: `1px solid ${phosphorHex}40`,
              color: phosphorHex,
              boxShadow: `0 0 10px ${phosphorHex}20`,
            }}
            title="Character (C)"
          >
            <UserCircle size={20} weight="bold" />
          </button>
          <button
            onClick={toggleSaveFileViewer}
            className="p-2 rounded-lg transition-all hover:scale-110"
            style={{
              backgroundColor: saveFileViewerOpen ? `${phosphorHex}30` : `${phosphorHex}15`,
              border: `1px solid ${saveFileViewerOpen ? phosphorHex : `${phosphorHex}40`}`,
              color: phosphorHex,
              boxShadow: saveFileViewerOpen ? `0 0 15px ${phosphorHex}40` : `0 0 10px ${phosphorHex}20`,
            }}
            title="Adventure Journal (J)"
          >
            <Book size={20} weight="bold" />
          </button>
          <button
            onClick={toggleSceneInspector}
            className="p-2 rounded-lg transition-all hover:scale-110"
            style={{
              backgroundColor: sceneInspectorOpen ? `${phosphorHex}30` : `${phosphorHex}15`,
              border: `1px solid ${sceneInspectorOpen ? phosphorHex : `${phosphorHex}40`}`,
              color: phosphorHex,
              boxShadow: sceneInspectorOpen ? `0 0 15px ${phosphorHex}40` : `0 0 10px ${phosphorHex}20`,
            }}
            title="Scene Inspector"
          >
            <SlidersHorizontal size={20} weight="bold" />
          </button>
        </>
      )}

    </div>
  );
};
