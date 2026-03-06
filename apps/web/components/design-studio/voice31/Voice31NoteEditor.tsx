'use client';

/**
 * Voice31 Note Editor
 *
 * Side panel that connects to the CRT assembly as a hardware extension module.
 * Vertically stacked: note list on top, editor on bottom.
 * Supports streaming content from the assistant.
 */

import React, { useEffect, useRef, useMemo, useCallback, useState } from 'react';
import { useVoice31Store, type NoteDocument } from './Voice31Store';
import { X, Plus, FileText, Trash, PencilSimple, Check } from '@phosphor-icons/react';

// =============================================================================
// NOTE LIST ITEM
// =============================================================================

interface NoteListItemProps {
  note: NoteDocument;
  isActive: boolean;
  color: string;
  onSelect: () => void;
  onDelete: () => void;
}

const NoteListItem: React.FC<NoteListItemProps> = ({
  note,
  isActive,
  color,
  onSelect,
  onDelete,
}) => (
  <div
    className={`group flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-all duration-200 ${
      isActive ? 'bg-opacity-20' : 'hover:bg-opacity-10'
    }`}
    style={{
      backgroundColor: isActive ? `${color}18` : 'transparent',
      border: `1px solid ${isActive ? `${color}80` : `${color}15`}`,
      boxShadow: isActive ? `0 0 10px ${color}12` : 'none',
    }}
    onClick={onSelect}
  >
    <FileText className="w-3.5 h-3.5 flex-shrink-0" color={isActive ? color : `${color}60`} />
    <div className="flex-1 min-w-0">
      <span
        className="block text-[12px] font-mono truncate tracking-wide"
        style={{
          color: isActive ? color : `${color}90`,
          fontWeight: isActive ? 600 : 400,
          textShadow: isActive ? `0 0 6px ${color}30` : 'none',
        }}
      >
        {note.title || 'Untitled'}
      </span>
      <span
        className="block text-[9px] font-mono opacity-50 mt-0.5"
        style={{ color }}
      >
        {new Date(note.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
      </span>
    </div>
    <button
      onClick={(e) => {
        e.stopPropagation();
        onDelete();
      }}
      className="opacity-0 group-hover:opacity-70 hover:opacity-100 transition-all duration-200 p-1 rounded hover:bg-red-500/20"
      style={{ color: '#ff6666' }}
    >
      <Trash className="w-3 h-3" />
    </button>
  </div>
);

// =============================================================================
// STREAMING CURSOR
// =============================================================================

const StreamingCursor: React.FC<{ color: string }> = ({ color }) => (
  <span
    className="inline-block w-2 h-4 animate-pulse"
    style={{
      backgroundColor: color,
      boxShadow: `0 0 8px ${color}`,
    }}
  />
);

// =============================================================================
// MAIN COMPONENT - Integrated side panel
// =============================================================================

export const Voice31NoteEditor: React.FC<{
  height: number;
}> = ({ height }) => {
  const {
    phosphorColor,
    memoryState,
    createNote,
    updateNote,
    deleteNote,
    setActiveNote,
    setEditorVisible,
  } = useVoice31Store();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState('');

  // Get active note
  const activeNote = useMemo(() => {
    if (!memoryState.activeNoteId) return null;
    return memoryState.notes.find((n) => n.id === memoryState.activeNoteId) || null;
  }, [memoryState.notes, memoryState.activeNoteId]);

  // Colors
  const colors = useMemo(() => {
    const palettes: Record<string, { base: string; glow: string; dim: string }> = {
      green: { base: '#88ffaa', glow: '#44dd88', dim: '#224422' },
      amber: { base: '#ffcc88', glow: '#ffaa44', dim: '#442211' },
      red: { base: '#ff8888', glow: '#ff4444', dim: '#441111' },
      blue: { base: '#aaccff', glow: '#6699ff', dim: '#112244' },
      white: { base: '#eeeeff', glow: '#ccccff', dim: '#222233' },
    };
    return palettes[phosphorColor] || palettes.amber;
  }, [phosphorColor]);

  // Auto-scroll to bottom when streaming
  useEffect(() => {
    if (memoryState.isStreaming && textareaRef.current) {
      textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
    }
  }, [memoryState.streamingContent, memoryState.isStreaming]);

  // Handle content change
  const handleContentChange = useCallback((content: string) => {
    if (activeNote) {
      updateNote(activeNote.id, { content });
    }
  }, [activeNote, updateNote]);

  // Handle title change
  const handleTitleSave = useCallback(() => {
    if (activeNote && tempTitle.trim()) {
      updateNote(activeNote.id, { title: tempTitle.trim() });
    }
    setIsEditingTitle(false);
  }, [activeNote, tempTitle, updateNote]);

  // Start title edit
  const startTitleEdit = useCallback(() => {
    if (activeNote) {
      setTempTitle(activeNote.title);
      setIsEditingTitle(true);
    }
  }, [activeNote]);

  // Handle new note
  const handleNewNote = useCallback(() => {
    const timestamp = new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    createNote(`Note - ${timestamp}`);
  }, [createNote]);

  // Note list gets ~35% of height, editor gets the rest
  const listHeight = Math.max(140, Math.floor(height * 0.32));

  return (
    <div
      className="relative flex flex-col"
      style={{
        width: 340,
        height,
        // Hardware bezel — flat left side connects flush to CRT, rounded right
        borderRadius: '0 0 16px 0',
        background: 'linear-gradient(180deg, #2a2a28 0%, #1a1a18 50%, #141412 100%)',
        padding: '0 8px 8px 0',
        boxShadow: `
          inset 0 2px 4px rgba(255,255,255,0.05),
          0 4px 20px rgba(0,0,0,0.5)
        `,
      }}
    >
      {/* Inner screen panel */}
      <div
        className="relative flex-1 flex flex-col overflow-hidden"
        style={{
          borderRadius: '0 0 10px 0',
          background: `linear-gradient(180deg,
            rgba(12, 14, 20, 0.98) 0%,
            rgba(8, 10, 14, 0.99) 50%,
            rgba(5, 7, 10, 1) 100%
          )`,
          border: `1px solid ${colors.glow}35`,
          borderLeft: 'none',
          boxShadow: `
            0 0 20px ${colors.glow}12,
            inset 0 1px 2px ${colors.glow}08,
            inset 0 -2px 4px rgba(0,0,0,0.4)
          `,
        }}
      >
        {/* Scanlines overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-5 z-10"
          style={{
            background: `repeating-linear-gradient(0deg, transparent, transparent 2px, ${colors.dim} 2px, ${colors.dim} 3px)`,
          }}
        />

        {/* Header */}
        <div
          className="flex-shrink-0 flex items-center justify-between px-3 py-2.5 border-b"
          style={{
            borderColor: `${colors.glow}25`,
            background: `linear-gradient(180deg, ${colors.glow}06 0%, transparent 100%)`,
          }}
        >
          <div className="flex items-center gap-2">
            <div
              className="p-1 rounded"
              style={{
                backgroundColor: `${colors.glow}12`,
                boxShadow: `0 0 8px ${colors.glow}15`,
              }}
            >
              <FileText className="w-3.5 h-3.5" color={colors.glow} />
            </div>
            <span
              className="text-[11px] font-mono uppercase tracking-[0.2em] font-bold"
              style={{
                color: colors.base,
                textShadow: `0 0 6px ${colors.glow}25`,
              }}
            >
              NOTES
            </span>
            {memoryState.isStreaming && (
              <span
                className="text-[8px] font-mono uppercase animate-pulse px-1.5 py-0.5 rounded-full"
                style={{
                  backgroundColor: `${colors.glow}20`,
                  color: colors.glow,
                  border: `1px solid ${colors.glow}40`,
                }}
              >
                STREAM
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleNewNote}
              className="p-1.5 rounded transition-all duration-200 hover:scale-105"
              style={{
                color: colors.base,
                backgroundColor: `${colors.glow}10`,
                border: `1px solid ${colors.glow}25`,
              }}
              title="New Note"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setEditorVisible(false)}
              className="p-1.5 rounded transition-all duration-200 hover:scale-105"
              style={{
                color: '#ff6666',
                backgroundColor: 'rgba(255,68,68,0.08)',
                border: '1px solid rgba(255,68,68,0.25)',
              }}
              title="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Notes list section */}
        <div
          className="flex-shrink-0 overflow-y-auto p-2 space-y-1 border-b"
          style={{
            height: listHeight,
            borderColor: `${colors.glow}15`,
            background: `linear-gradient(180deg, ${colors.glow}03 0%, transparent 100%)`,
          }}
        >
          {memoryState.notes.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center text-center text-[11px] font-mono h-full opacity-50 gap-2"
              style={{ color: colors.base }}
            >
              <FileText className="w-6 h-6" style={{ opacity: 0.3 }} />
              <span>No notes yet</span>
              <span className="text-[9px] opacity-60">Click + to create</span>
            </div>
          ) : (
            memoryState.notes.map((note) => (
              <NoteListItem
                key={note.id}
                note={note}
                isActive={memoryState.activeNoteId === note.id}
                color={colors.base}
                onSelect={() => setActiveNote(note.id)}
                onDelete={() => deleteNote(note.id)}
              />
            ))
          )}
        </div>

        {/* Editor section */}
        <div className="flex-1 flex flex-col min-h-0">
          {activeNote ? (
            <>
              {/* Note title */}
              <div
                className="flex-shrink-0 flex items-center gap-2 px-3 py-2 border-b"
                style={{
                  borderColor: `${colors.glow}12`,
                  background: `linear-gradient(180deg, ${colors.glow}04 0%, transparent 100%)`,
                }}
              >
                {isEditingTitle ? (
                  <>
                    <input
                      type="text"
                      value={tempTitle}
                      onChange={(e) => setTempTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleTitleSave();
                        if (e.key === 'Escape') setIsEditingTitle(false);
                      }}
                      className="flex-1 bg-transparent border-none outline-none text-[13px] font-mono tracking-wide px-2 py-0.5 rounded"
                      style={{
                        color: colors.base,
                        backgroundColor: `${colors.glow}10`,
                        border: `1px solid ${colors.glow}35`,
                      }}
                      autoFocus
                    />
                    <button
                      onClick={handleTitleSave}
                      className="p-1 rounded transition-all hover:scale-105"
                      style={{
                        color: colors.glow,
                        backgroundColor: `${colors.glow}12`,
                      }}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <>
                    <span
                      className="flex-1 text-[13px] font-mono font-semibold truncate tracking-wide"
                      style={{
                        color: colors.base,
                        textShadow: `0 0 6px ${colors.glow}20`,
                      }}
                    >
                      {activeNote.title}
                    </span>
                    <button
                      onClick={startTitleEdit}
                      className="p-1 rounded opacity-40 hover:opacity-100 transition-all hover:scale-105"
                      style={{
                        color: colors.base,
                        backgroundColor: `${colors.glow}08`,
                      }}
                    >
                      <PencilSimple className="w-3 h-3" />
                    </button>
                  </>
                )}
              </div>

              {/* Text editor */}
              <div className="flex-1 p-3 min-h-0">
                <textarea
                  ref={textareaRef}
                  value={activeNote.content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  placeholder="Start typing or wait for assistant to stream content..."
                  className="w-full h-full bg-transparent border-none outline-none resize-none font-mono text-[12px] leading-relaxed tracking-wide"
                  style={{
                    color: colors.base,
                    caretColor: colors.glow,
                    textShadow: `0 0 1px ${colors.glow}15`,
                  }}
                  disabled={memoryState.isStreaming}
                />
                {memoryState.isStreaming && (
                  <StreamingCursor color={colors.glow} />
                )}
              </div>

              {/* Footer with stats */}
              <div
                className="flex-shrink-0 flex items-center justify-between px-3 py-1.5 text-[10px] font-mono border-t"
                style={{
                  color: `${colors.base}60`,
                  borderColor: `${colors.glow}12`,
                  background: `linear-gradient(180deg, transparent 0%, ${colors.glow}04 100%)`,
                }}
              >
                <span className="flex items-center gap-2">
                  <span>{activeNote.content.length} chars</span>
                  <span className="opacity-40">|</span>
                  <span>{activeNote.content.split(/\s+/).filter(Boolean).length} words</span>
                </span>
                <span className="opacity-60">
                  {new Date(activeNote.updatedAt).toLocaleTimeString()}
                </span>
              </div>
            </>
          ) : (
            <div
              className="flex-1 flex flex-col items-center justify-center text-[12px] font-mono opacity-50 gap-2"
              style={{ color: colors.base }}
            >
              <FileText className="w-8 h-8" style={{ opacity: 0.2 }} />
              <span>Select or create a note</span>
            </div>
          )}
        </div>
      </div>

      {/* Corner accents — right side only */}
      <div className="absolute top-1 right-2 w-3 h-3 border-r-2 border-t-2 opacity-20" style={{ borderColor: colors.glow }} />
      <div className="absolute bottom-2 right-2 w-3 h-3 border-r-2 border-b-2 opacity-20" style={{ borderColor: colors.glow }} />

      {/* Decorative bolt on right */}
      <div
        className="absolute top-3 right-2.5 w-2 h-2 rounded-full opacity-40"
        style={{
          background: `radial-gradient(circle at 30% 30%, #555 0%, #222 100%)`,
          boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.2), inset 0 -1px 1px rgba(0,0,0,0.5)',
        }}
      />
    </div>
  );
};

export default Voice31NoteEditor;
