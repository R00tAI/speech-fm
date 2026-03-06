'use client';

import React from 'react';
import { useVoice31Store, type BrowserAutomationAction } from '../Voice31Store';
import {
  Globe,
  ArrowClockwise,
  Eye,
  Cursor,
  Keyboard,
  NavigationArrow,
  Lightning,
  Brain,
  Gear,
  Timer,
  CheckCircle,
  XCircle,
} from '@phosphor-icons/react';

interface BrowserPanelProps {
  hex: string;
}

const ACTION_ICONS: Record<BrowserAutomationAction['type'], React.ElementType> = {
  complete: CheckCircle,
  thought: Brain,
  click: Cursor,
  process: Gear,
  observe: Eye,
  input: Keyboard,
  wait: Timer,
  navigate: NavigationArrow,
  other: Lightning,
};

const STATUS_LABELS: Record<string, string> = {
  idle: 'Idle',
  connecting: 'Connecting...',
  executing: 'Executing...',
  complete: 'Complete',
  error: 'Error',
};

export const BrowserPanel: React.FC<BrowserPanelProps> = ({ hex }) => {
  const automation = useVoice31Store((s) => s.browserAutomation);
  const clearBrowserAutomation = useVoice31Store((s) => s.clearBrowserAutomation);

  const lastActions = automation.actionFeed.slice(-8);

  return (
    <div className="space-y-3">
      {/* Session Status */}
      <div className="flex items-center gap-2">
        <Globe size={14} style={{ color: hex }} />
        <span className="text-xs font-mono" style={{ color: hex }}>
          {STATUS_LABELS[automation.status] || automation.status}
        </span>
        {automation.active && (
          <div
            className="w-2 h-2 rounded-full ml-auto animate-pulse"
            style={{ backgroundColor: automation.status === 'error' ? '#ff4444' : hex }}
          />
        )}
      </div>

      {/* Session ID */}
      {automation.sessionId && (
        <div className="text-[9px] font-mono truncate" style={{ color: `${hex}40` }}>
          Session: {automation.sessionId.slice(0, 16)}...
        </div>
      )}

      {/* Action Feed */}
      {lastActions.length > 0 && (
        <div className="space-y-1 pt-2 border-t" style={{ borderColor: `${hex}20` }}>
          <div
            className="text-[9px] uppercase tracking-wider font-mono"
            style={{ color: `${hex}30` }}
          >
            Action Feed
          </div>
          {lastActions.map((action) => {
            const Icon = ACTION_ICONS[action.type] || Lightning;
            return (
              <div
                key={action.id}
                className="flex items-start gap-2 px-1.5 py-1 rounded"
                style={{ backgroundColor: `${hex}05` }}
              >
                <Icon size={12} style={{ color: `${hex}60` }} className="mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[9px] font-mono uppercase tracking-wider" style={{ color: `${hex}40` }}>
                    {action.label}
                  </div>
                  <div className="text-[10px] font-mono truncate" style={{ color: hex }}>
                    {action.headline}
                  </div>
                  {action.detail && (
                    <div className="text-[8px] font-mono truncate" style={{ color: `${hex}30` }}>
                      {action.detail}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Extracted Data */}
      {automation.extractedData && (
        <div className="space-y-1 pt-2 border-t" style={{ borderColor: `${hex}20` }}>
          <div
            className="text-[9px] uppercase tracking-wider font-mono"
            style={{ color: `${hex}30` }}
          >
            Extracted Data
          </div>
          <pre
            className="text-[9px] font-mono p-2 rounded overflow-auto max-h-40"
            style={{ color: `${hex}80`, backgroundColor: `${hex}08` }}
          >
            {typeof automation.extractedData === 'string'
              ? automation.extractedData
              : JSON.stringify(automation.extractedData, null, 2)}
          </pre>
        </div>
      )}

      {/* Empty State */}
      {!automation.active && lastActions.length === 0 && (
        <div className="text-[10px] font-mono text-center py-6" style={{ color: `${hex}40` }}>
          No active browser session.
          <br />
          Say "go to [url]" or "search for [query] on [site]".
        </div>
      )}

      {/* Clear Button */}
      {automation.active && automation.status !== 'executing' && (
        <button
          onClick={clearBrowserAutomation}
          className="flex items-center gap-2 w-full px-2 py-1.5 rounded text-[10px] font-mono transition-all hover:bg-white/5"
          style={{ color: `${hex}60` }}
        >
          <XCircle size={12} /> Clear Session
        </button>
      )}
    </div>
  );
};
