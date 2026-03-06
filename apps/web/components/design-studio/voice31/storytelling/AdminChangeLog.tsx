'use client';

import React, { useMemo, useState } from 'react';
import { CaretDown, CaretUp, ClipboardText, Trash } from '@phosphor-icons/react';
import { useStorytellingStore } from './StorytellingStore';

export const AdminChangeLog: React.FC = () => {
  const log = useStorytellingStore((s) => s.settingsChangeLog);
  const [expanded, setExpanded] = useState(false);

  const entries = useMemo(() => {
    return log.slice().reverse().slice(0, 50);
  }, [log]);

  const handleCopy = () => {
    const json = JSON.stringify(log, null, 2);
    navigator.clipboard.writeText(json).catch(() => {});
  };

  const handleClear = () => {
    // Direct store manipulation — reset the log
    useStorytellingStore.setState({ settingsChangeLog: [] });
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
  };

  const formatValue = (v: unknown) => {
    if (v === undefined || v === null) return '—';
    if (typeof v === 'number') return v.toFixed(2).replace(/\.?0+$/, '');
    return String(v);
  };

  return (
    <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: 8 }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 0',
          background: 'none',
          border: 'none',
          color: 'rgba(255,255,255,0.4)',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 10,
          cursor: 'pointer',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        <span>Change Log ({log.length})</span>
        {expanded ? <CaretUp size={12} /> : <CaretDown size={12} />}
      </button>

      {expanded && (
        <div>
          <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
            <button
              onClick={handleCopy}
              style={{
                display: 'flex', alignItems: 'center', gap: 3,
                padding: '3px 8px', background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4,
                color: 'rgba(255,255,255,0.5)', fontSize: 10,
                fontFamily: 'system-ui, sans-serif', cursor: 'pointer',
              }}
            >
              <ClipboardText size={11} /> Copy JSON
            </button>
            <button
              onClick={handleClear}
              style={{
                display: 'flex', alignItems: 'center', gap: 3,
                padding: '3px 8px', background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4,
                color: 'rgba(255,255,255,0.5)', fontSize: 10,
                fontFamily: 'system-ui, sans-serif', cursor: 'pointer',
              }}
            >
              <Trash size={11} /> Clear
            </button>
          </div>

          <div
            style={{
              maxHeight: 160,
              overflowY: 'auto',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 10,
              lineHeight: 1.6,
              color: 'rgba(255,255,255,0.45)',
            }}
          >
            {entries.length === 0 && (
              <div style={{ padding: '8px 0', color: 'rgba(255,255,255,0.2)' }}>
                No changes recorded yet
              </div>
            )}
            {entries.map((e, i) => (
              <div key={`${e.timestamp}-${i}`} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                <span style={{ color: 'rgba(255,255,255,0.25)' }}>[{formatTime(e.timestamp)}]</span>{' '}
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>{e.sceneType}</span>
                .{e.parameter}: {formatValue(e.oldValue)}{' '}
                <span style={{ color: 'rgba(255,255,255,0.3)' }}>&rarr;</span>{' '}
                <span style={{ color: 'rgba(200,230,255,0.7)' }}>{formatValue(e.newValue)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
