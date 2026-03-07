'use client';

/**
 * Voice31 Unified Provider
 *
 * Wrapper that allows switching between voice providers and text chat.
 * Handles auto-fallback when voice services fail.
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Voice31Provider as HumeProvider } from './Voice31Provider';
import { Voice31ElevenLabsProvider } from './Voice31ElevenLabsProvider';
import { Voice31TextProvider } from './Voice31TextProvider';
import { useVoice31Store } from './Voice31Store';

// =============================================================================
// TYPES
// =============================================================================

export type VoiceBackend = 'hume' | 'elevenlabs' | 'text';

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

    // Sync interaction mode with store
    const store = useVoice31Store.getState();
    if (newBackend === 'text') {
      store.setInteractionMode('text');
      store.setFallbackReason('user_choice');
    } else {
      store.setInteractionMode('voice');
      store.setFallbackReason(null);
      store.setFallbackAlert(false);
    }
  }, []);

  // Auto-fallback handler — called by ElevenLabs provider on failure
  const handleFallback = useCallback((reason: string) => {
    console.log('[Voice31] Auto-fallback triggered:', reason);
    setBackend('text');

    const store = useVoice31Store.getState();
    store.setInteractionMode('fallback');
    store.setFallbackReason(
      reason === 'credits_exhausted'
        ? 'credits_exhausted'
        : reason === 'service_unavailable'
          ? 'service_unavailable'
          : 'api_error',
    );
    store.setFallbackAlert(true, reason);
  }, []);

  // Sync store voice.backend setting → provider backend
  const storeBackend = useVoice31Store((s) => s.assistantSettings.currentConfig.voice.backend);
  useEffect(() => {
    if (storeBackend && storeBackend !== backend) {
      handleSetBackend(storeBackend as VoiceBackend);
    }
  }, [storeBackend]); // eslint-disable-line react-hooks/exhaustive-deps

  const contextValue: Voice31UnifiedContextType = {
    backend,
    setBackend: handleSetBackend,
  };

  return (
    <Voice31UnifiedContext.Provider value={contextValue}>
      {backend === 'text' ? (
        <Voice31TextProvider>{children}</Voice31TextProvider>
      ) : backend === 'hume' ? (
        <HumeProvider>{children}</HumeProvider>
      ) : (
        <Voice31ElevenLabsProvider
          agentId={elevenLabsAgentId}
          onFallback={handleFallback}
        >
          {children}
        </Voice31ElevenLabsProvider>
      )}
    </Voice31UnifiedContext.Provider>
  );
};

export default Voice31UnifiedProvider;
