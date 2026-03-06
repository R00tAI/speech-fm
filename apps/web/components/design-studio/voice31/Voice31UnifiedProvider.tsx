'use client';

/**
 * Voice31 Unified Provider
 *
 * Wrapper that allows switching between Hume and ElevenLabs providers.
 * Preserves all Voice31 functionality regardless of backend.
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Voice31Provider as HumeProvider } from './Voice31Provider';
import { Voice31ElevenLabsProvider } from './Voice31ElevenLabsProvider';

// =============================================================================
// TYPES
// =============================================================================

export type VoiceBackend = 'hume' | 'elevenlabs';

interface Voice31UnifiedContextType {
  backend: VoiceBackend;
  setBackend: (backend: VoiceBackend) => void;
}

const Voice31UnifiedContext = createContext<Voice31UnifiedContextType | null>(null);

export const useVoice31Backend = () => {
  const ctx = useContext(Voice31UnifiedContext);
  if (!ctx) {
    throw new Error('useVoice31Backend must be used within Voice31UnifiedProvider');
  }
  return ctx;
};

// =============================================================================
// UNIFIED PROVIDER
// =============================================================================

interface Voice31UnifiedProviderProps {
  children: React.ReactNode;
  defaultBackend?: VoiceBackend;
  elevenLabsAgentId?: string;
}

export const Voice31UnifiedProvider: React.FC<Voice31UnifiedProviderProps> = ({
  children,
  defaultBackend = 'hume',
  elevenLabsAgentId,
}) => {
  const [backend, setBackend] = useState<VoiceBackend>(defaultBackend);

  const handleSetBackend = useCallback((newBackend: VoiceBackend) => {
    console.log('[Voice31] Switching backend to:', newBackend);
    setBackend(newBackend);
  }, []);

  const contextValue: Voice31UnifiedContextType = {
    backend,
    setBackend: handleSetBackend,
  };

  return (
    <Voice31UnifiedContext.Provider value={contextValue}>
      {backend === 'hume' ? (
        <HumeProvider>{children}</HumeProvider>
      ) : (
        <Voice31ElevenLabsProvider agentId={elevenLabsAgentId}>
          {children}
        </Voice31ElevenLabsProvider>
      )}
    </Voice31UnifiedContext.Provider>
  );
};

// =============================================================================
// BACKEND SWITCHER COMPONENT
// =============================================================================

interface BackendSwitcherProps {
  className?: string;
}

export const Voice31BackendSwitcher: React.FC<BackendSwitcherProps> = ({ className = '' }) => {
  const { backend, setBackend } = useVoice31Backend();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-xs text-white/50 font-mono">VOICE:</span>
      <button
        onClick={() => setBackend('hume')}
        className={`px-2 py-1 text-xs font-mono rounded transition-colors ${
          backend === 'hume'
            ? 'bg-amber-500/30 text-amber-400 border border-amber-500/50'
            : 'bg-white/5 text-white/40 border border-white/10 hover:bg-white/10'
        }`}
      >
        HUME
      </button>
      <button
        onClick={() => setBackend('elevenlabs')}
        className={`px-2 py-1 text-xs font-mono rounded transition-colors ${
          backend === 'elevenlabs'
            ? 'bg-amber-500/30 text-amber-400 border border-amber-500/50'
            : 'bg-white/5 text-white/40 border border-white/10 hover:bg-white/10'
        }`}
      >
        ELEVEN
      </button>
    </div>
  );
};

export default Voice31UnifiedProvider;
