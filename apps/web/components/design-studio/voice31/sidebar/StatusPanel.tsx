'use client';

import React from 'react';
import { useVoice31Store } from '../Voice31Store';
import { Plugs, Gear, Notepad, WaveformSlash, Waveform } from '@phosphor-icons/react';

interface StatusPanelProps {
  hex: string;
}

export const StatusPanel: React.FC<StatusPanelProps> = ({ hex }) => {
  const isConnected = useVoice31Store((s) => s.isConnected);
  const isSpeaking = useVoice31Store((s) => s.isSpeaking);
  const isListening = useVoice31Store((s) => s.isListening);
  const config = useVoice31Store((s) => s.assistantSettings.currentConfig);
  const memoryState = useVoice31Store((s) => s.memoryState);
  const toggleSettingsPanel = useVoice31Store((s) => s.toggleSettingsPanel);
  const setEditorVisible = useVoice31Store((s) => s.setEditorVisible);
  const bufferingState = useVoice31Store((s) => s.bufferingState);
  const interactionMode = useVoice31Store((s) => s.interactionMode);
  const fallbackReason = useVoice31Store((s) => s.fallbackReason);

  const activeTasks = bufferingState.pendingTasks.filter(
    (t) => t.status === 'running' || t.status === 'queued'
  );

  // Mode-aware status label and color
  const getStatusLabel = () => {
    if (interactionMode === 'text' || interactionMode === 'fallback') {
      if (fallbackReason && fallbackReason !== 'user_choice') {
        return 'Text Mode (fallback)';
      }
      return 'Text Mode';
    }
    if (isConnected) return 'Voice Active';
    return 'Ready';
  };

  const getStatusColor = () => {
    if (interactionMode === 'fallback' && fallbackReason !== 'user_choice') {
      return '#ff4444'; // red phosphor for fallback
    }
    if (interactionMode === 'text') {
      return '#4488ff'; // blue for intentional text mode
    }
    if (isConnected) return '#33ff33'; // green for connected
    return `${hex}60`; // dim for ready
  };

  return (
    <div className="space-y-3">
      {/* Connection Status */}
      <div className="flex items-center gap-2">
        <Plugs size={14} style={{ color: hex }} />
        <span className="text-xs font-mono" style={{ color: getStatusColor() }}>
          {getStatusLabel()}
        </span>
        <div
          className="w-2 h-2 rounded-full ml-auto"
          style={{
            backgroundColor: getStatusColor(),
            boxShadow: `0 0 6px ${getStatusColor()}`,
          }}
        />
      </div>

      {/* Voice State */}
      {isConnected && interactionMode === 'voice' && (
        <div className="flex items-center gap-2">
          {isSpeaking ? (
            <Waveform size={14} style={{ color: hex }} className="animate-pulse" />
          ) : (
            <WaveformSlash size={14} style={{ color: `${hex}60` }} />
          )}
          <span className="text-[10px] font-mono" style={{ color: `${hex}80` }}>
            {isSpeaking ? 'Speaking...' : isListening ? 'Listening...' : 'Idle'}
          </span>
        </div>
      )}

      {/* Current Config */}
      <div className="space-y-2 pt-2 border-t" style={{ borderColor: `${hex}20` }}>
        <div
          className="text-[9px] uppercase tracking-wider font-mono"
          style={{ color: `${hex}30` }}
        >
          Assistant
        </div>
        <div className="text-xs font-mono" style={{ color: hex }}>
          {config.name}
        </div>
        <div className="text-[10px] font-mono" style={{ color: `${hex}60` }}>
          {config.screenType.toUpperCase()} · {interactionMode === 'voice' ? 'VOICE' : 'TEXT'}
        </div>
      </div>

      {/* Active Tasks */}
      {activeTasks.length > 0 && (
        <div className="space-y-1 pt-2 border-t" style={{ borderColor: `${hex}20` }}>
          <div
            className="text-[9px] uppercase tracking-wider font-mono"
            style={{ color: `${hex}30` }}
          >
            Active Tasks
          </div>
          {activeTasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-2 text-[10px] font-mono"
              style={{ color: `${hex}80` }}
            >
              <div
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ backgroundColor: hex }}
              />
              {task.label}
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="space-y-1 pt-2 border-t" style={{ borderColor: `${hex}20` }}>
        <div
          className="text-[9px] uppercase tracking-wider font-mono mb-2"
          style={{ color: `${hex}30` }}
        >
          Quick Actions
        </div>
        <button
          onClick={toggleSettingsPanel}
          className="flex items-center gap-2 w-full px-2 py-1.5 rounded text-xs font-mono transition-all hover:bg-white/5"
          style={{ color: hex }}
        >
          <Gear size={14} /> Settings
        </button>
        <button
          onClick={() => setEditorVisible(!memoryState.editorVisible)}
          className="flex items-center gap-2 w-full px-2 py-1.5 rounded text-xs font-mono transition-all hover:bg-white/5"
          style={{ color: hex }}
        >
          <Notepad size={14} /> Notes
        </button>
      </div>

      {/* Stats */}
      <div className="pt-2 border-t" style={{ borderColor: `${hex}20` }}>
        <div
          className="flex items-center justify-between text-xs font-mono"
          style={{ color: `${hex}80` }}
        >
          <span>Tools</span>
          <span style={{ color: hex }}>{config.disabledTools.length === 0 ? 'All' : `${config.disabledTools.length} off`}</span>
        </div>
        <div
          className="flex items-center justify-between text-xs font-mono mt-1"
          style={{ color: `${hex}80` }}
        >
          <span>Notes</span>
          <span style={{ color: hex }}>{memoryState.notes.length}</span>
        </div>
        <div
          className="flex items-center justify-between text-xs font-mono mt-1"
          style={{ color: `${hex}80` }}
        >
          <span>Memories</span>
          <span style={{ color: hex }}>{memoryState.memories.length}</span>
        </div>
      </div>
    </div>
  );
};
