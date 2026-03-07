'use client';

/**
 * Voice31 Code Display
 *
 * Renders generated React/TSX code in a sandboxed iframe with CRT styling.
 * Supports dynamic scaling, fullscreen modes, and streaming preview.
 *
 * Security layers:
 * - Code sanitization (strips dangerous APIs)
 * - iframe sandbox="allow-scripts" only
 * - CSP meta tag inside iframe
 * - window.onerror handler with structured postMessage
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { CodeDisplayState } from './Voice31Store';
import { useVoice31Store } from './Voice31Store';

// =============================================================================
// SECURITY: Code Sanitization
// =============================================================================

const DANGEROUS_PATTERNS = [
  /\bfetch\s*\(/g,
  /\bXMLHttpRequest\b/g,
  /\bWebSocket\b/g,
  /\beval\s*\(/g,
  /\bFunction\s*\(/g,
  /\bimport\s*\(/g,
  /\brequire\s*\(/g,
  /\bdocument\.cookie\b/g,
  /\blocalStorage\b/g,
  /\bsessionStorage\b/g,
  /\bwindow\.open\b/g,
  /\bwindow\.top\b/g,
  /\bwindow\.location\b/g,
  /\bnavigator\.sendBeacon\b/g,
  /\bpostMessage\b(?!\s*\(\s*\{[^}]*type:\s*'code-render)/g, // Allow our own postMessage pattern
];

function sanitizeCode(code: string): string {
  let sanitized = code;
  for (const pattern of DANGEROUS_PATTERNS) {
    sanitized = sanitized.replace(pattern, '/* [blocked] */');
  }
  // Generated snippets are executed in a non-module script context.
  sanitized = sanitized.replace(/^\s*export\s+default\s+function\s+/gm, 'function ');
  sanitized = sanitized.replace(/^\s*export\s+default\s+class\s+/gm, 'class ');
  sanitized = sanitized.replace(/^\s*export\s+default\s+/gm, '');
  sanitized = sanitized.replace(/^\s*export\s+\{[^}]*\}\s*;?\s*$/gm, '');
  return sanitized;
}

// =============================================================================
// COMPONENT
// =============================================================================

interface Voice31CodeDisplayProps {
  codeState: CodeDisplayState;
  phosphorColor: string;
  width?: number;
  height?: number;
}

export const Voice31CodeDisplay: React.FC<Voice31CodeDisplayProps> = ({
  codeState,
  phosphorColor,
  width = 800,
  height = 600,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [revealProgress, setRevealProgress] = useState(0);
  const [iframeError, setIframeError] = useState<string | null>(null);
  const readyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const errorClearTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearCodeDisplay = useVoice31Store((s) => s.clearCodeDisplay);

  const colors = {
    green: { text: '#33ff33', glow: 'rgba(51, 255, 51, 0.6)' },
    amber: { text: '#ffaa00', glow: 'rgba(255, 170, 0, 0.6)' },
    red: { text: '#ff4444', glow: 'rgba(255, 68, 68, 0.6)' },
    blue: { text: '#4488ff', glow: 'rgba(68, 136, 255, 0.6)' },
    white: { text: '#ffffff', glow: 'rgba(255, 255, 255, 0.6)' },
  }[phosphorColor] || { text: '#ffaa00', glow: 'rgba(255, 170, 0, 0.6)' };

  // Organic reveal animation
  useEffect(() => {
    if (isReady && codeState.active) {
      let progress = 0;
      const revealInterval = setInterval(() => {
        progress += 0.015 + Math.random() * 0.025;
        setRevealProgress(Math.min(progress, 1));
        if (progress >= 1) {
          clearInterval(revealInterval);
        }
      }, 30);
      return () => clearInterval(revealInterval);
    }
  }, [isReady, codeState.active]);

  // Reset on new code
  useEffect(() => {
    setIsReady(false);
    setRevealProgress(0);
    setIframeError(null);
  }, [codeState.code]);

  // Render code in iframe sandbox
  useEffect(() => {
    if (!codeState.active || !codeState.code || !iframeRef.current) return;

    const iframe = iframeRef.current;

    // Sanitize code before injection
    const safeCode = sanitizeCode(codeState.code);

    // Use srcdoc instead of contentDocument.write() to avoid SecurityError
    // when updating sandboxed iframes (sandbox without allow-same-origin
    // creates an opaque origin after the first write, blocking subsequent access)
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval' https://unpkg.com; style-src 'unsafe-inline'; img-src data: blob: https:; font-src data:; connect-src https:;">
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://unpkg.com/three@0.170.0/build/three.min.js"></script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    html, body, #root {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: #000;
      color: ${colors.text};
      font-family: 'JetBrains Mono', 'SF Mono', 'Fira Code', 'Courier New', monospace;
    }
    .flex { display: flex; }
    .flex-col { flex-direction: column; }
    .items-center { align-items: center; }
    .justify-center { justify-content: center; }
    .absolute { position: absolute; }
    .relative { position: relative; }
    .inset-0 { top: 0; right: 0; bottom: 0; left: 0; }
    .w-full { width: 100%; }
    .h-full { height: 100%; }
    .text-center { text-align: center; }
    .font-bold { font-weight: bold; }
    .overflow-hidden { overflow: hidden; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    @keyframes glow { 0%, 100% { filter: brightness(1); } 50% { filter: brightness(1.3); } }
  </style>
</head>
<body>
  <div id="root"></div>
  <script>
    // Structured error reporting
    window.onerror = function(message, source, lineno, colno, error) {
      window.parent.postMessage({
        type: 'code-render-error',
        error: String(message),
        source: source || '',
        line: lineno || 0,
      }, '*');
      document.getElementById('root').innerHTML = '<div style="color:#ff4444;padding:20px;font-family:monospace;font-size:12px;">Error: ' + String(message) + '</div>';
      return true;
    };
  </script>
  <script type="text/babel" data-presets="typescript,react">
    const { useState, useEffect, useRef, useCallback, useMemo, Fragment } = React;
    const THREE = window.THREE;

    const lerp = (a, b, t) => a + (b - a) * t;
    const clamp = (val, min, max) => Math.max(min, Math.min(max, val));
    const random = (min, max) => Math.random() * (max - min) + min;
    const noise = (x, y) => {
      const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
      return n - Math.floor(n);
    };

    try {
      ${safeCode}

      const rootElement = document.getElementById('root');
      const root = ReactDOM.createRoot(rootElement);
      root.render(<GeneratedComponent />);

      window.parent.postMessage({ type: 'code-render-ready' }, '*');
    } catch (error) {
      console.error('Code execution error:', error);
      document.getElementById('root').innerHTML = '<div style="color:#ff4444;padding:20px;font-family:monospace;font-size:12px;">Error: ' + error.message + '</div>';
      window.parent.postMessage({ type: 'code-render-error', error: error.message }, '*');
    }
  </script>
</body>
</html>`;

    iframe.srcdoc = html;

    // Listen for render complete or error
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'code-render-ready') {
        setIsReady(true);
        setIframeError(null);
      } else if (event.data.type === 'code-render-error') {
        setIframeError(event.data.error || 'Unknown render error');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [codeState.code, codeState.active, colors.text]);

  // Auto-clear: if iframe doesn't signal ready within 15s, clear the display
  useEffect(() => {
    if (!codeState.active || !codeState.code || codeState.isStreaming || codeState.isLoading) return;
    if (readyTimeoutRef.current) clearTimeout(readyTimeoutRef.current);

    if (!isReady && !iframeError) {
      readyTimeoutRef.current = setTimeout(() => {
        if (!isReady) {
          console.warn('[CodeDisplay] Iframe did not signal ready within 15s — auto-clearing');
          clearCodeDisplay();
        }
      }, 15_000);
    }

    return () => {
      if (readyTimeoutRef.current) clearTimeout(readyTimeoutRef.current);
    };
  }, [codeState.active, codeState.code, codeState.isStreaming, codeState.isLoading, isReady, iframeError, clearCodeDisplay]);

  // Auto-clear on error after 5s display
  useEffect(() => {
    if (errorClearTimeoutRef.current) clearTimeout(errorClearTimeoutRef.current);

    if (iframeError && codeState.active) {
      errorClearTimeoutRef.current = setTimeout(() => {
        console.warn('[CodeDisplay] Render error — auto-clearing after 5s:', iframeError);
        clearCodeDisplay();
      }, 5_000);
    }

    return () => {
      if (errorClearTimeoutRef.current) clearTimeout(errorClearTimeoutRef.current);
    };
  }, [iframeError, codeState.active, clearCodeDisplay]);

  // Auto-clear code generation errors after 5s
  useEffect(() => {
    if (codeState.error && codeState.active) {
      const timer = setTimeout(() => {
        console.warn('[CodeDisplay] Generation error — auto-clearing after 5s');
        clearCodeDisplay();
      }, 5_000);
      return () => clearTimeout(timer);
    }
  }, [codeState.error, codeState.active, clearCodeDisplay]);

  if (!codeState.active) return null;

  if (codeState.isLoading) {
    return (
      <div
        className="flex items-center justify-center w-full h-full"
        style={{ color: colors.text }}
      >
        <div className="text-center">
          <div
            className="text-xl font-mono mb-4 animate-pulse"
            style={{ textShadow: `0 0 10px ${colors.glow}` }}
          >
            GENERATING CODE...
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: colors.text, animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: colors.text, animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: colors.text, animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    );
  }

  if (codeState.error) {
    return (
      <div
        className="flex items-center justify-center w-full h-full p-8"
        style={{ color: '#ff4444' }}
      >
        <div className="text-center max-w-md">
          <div
            className="text-xl font-mono mb-4"
            style={{ textShadow: '0 0 10px rgba(255, 68, 68, 0.6)' }}
          >
            CODE GENERATION ERROR
          </div>
          <div className="text-sm font-mono opacity-70">
            {codeState.error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* Streaming preview overlay */}
      {codeState.isStreaming && codeState.streamingCode && (
        <div
          className="absolute inset-0 z-30 flex items-end pointer-events-none"
          style={{ padding: '16px' }}
        >
          <div
            className="w-full max-h-[60%] overflow-hidden font-mono text-xs leading-relaxed"
            style={{
              color: colors.text,
              opacity: 0.35,
              maskImage: 'linear-gradient(to bottom, transparent 0%, black 30%, black 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 30%, black 100%)',
            }}
          >
            <pre className="whitespace-pre-wrap break-words">
              {codeState.streamingCode.slice(-500)}
            </pre>
          </div>
          <div
            className="absolute top-4 right-4 font-mono text-xs tracking-[0.3em] uppercase animate-pulse"
            style={{
              color: colors.text,
              textShadow: `0 0 8px ${colors.glow}`,
            }}
          >
            COMPOSING...
          </div>
        </div>
      )}

      {/* Reveal mask */}
      <div
        className="absolute inset-0 z-20 pointer-events-none"
        style={{
          background: `linear-gradient(
            to bottom,
            transparent ${revealProgress * 100}%,
            rgba(0, 0, 0, 0.95) ${revealProgress * 100}%
          )`,
          opacity: iframeError ? 0 : 1,
          transition: 'opacity 160ms ease-out',
        }}
      />

      {/* Code iframe */}
      <div
        className="relative w-full h-full rounded-lg overflow-hidden"
        style={{
          boxShadow: isReady ? `0 0 30px ${colors.glow}, inset 0 0 20px ${colors.text}10` : 'none',
          transition: 'box-shadow 0.5s ease-out',
          opacity: codeState.isStreaming
            ? 0.2
            : iframeError
              ? 1
              : isReady
                ? Math.max(0.35, revealProgress * 0.95)
                : 0.35,
        }}
      >
        <iframe
          ref={iframeRef}
          className="w-full h-full border-0"
          sandbox="allow-scripts"
          title="Generated Code Display"
          style={{
            backgroundColor: '#000',
            filter: 'brightness(1.05) contrast(1.05)',
          }}
        />

        {/* Scanline overlay */}
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(0, 0, 0, 0.15) 2px,
              rgba(0, 0, 0, 0.15) 4px
            )`,
            mixBlendMode: 'multiply',
          }}
        />

        {/* Phosphor glow overlay */}
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background: `radial-gradient(ellipse at center, ${colors.text}05 0%, transparent 70%)`,
          }}
        />

        {/* Visible fallback when iframe reports a render error */}
        {iframeError && (
          <div
            className="absolute inset-0 z-30 flex items-center justify-center p-6"
            style={{ background: 'rgba(0, 0, 0, 0.85)' }}
          >
            <div
              className="max-w-lg text-center font-mono"
              style={{ color: '#ff6666', textShadow: '0 0 10px rgba(255, 68, 68, 0.45)' }}
            >
              <div className="text-sm tracking-[0.25em] uppercase mb-3">Render Error</div>
              <div className="text-xs opacity-85 break-words">{iframeError}</div>
            </div>
          </div>
        )}
      </div>

      {/* Caption with fade-in */}
      {codeState.prompt && !codeState.isStreaming && (
        <div
          className="absolute bottom-0 left-0 right-0 p-3 text-xs font-mono transition-all duration-500"
          style={{
            color: colors.text,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            opacity: iframeError ? 1 : revealProgress,
            textShadow: `0 0 8px ${colors.glow}`,
          }}
        >
          <span className="opacity-50">GENERATED: </span>
          {codeState.prompt}
        </div>
      )}
    </div>
  );
};

export default Voice31CodeDisplay;
