'use client';

/**
 * Voice31 Tab
 *
 * Main tab component for Voice31 in Design Studio.
 * Uses UnifiedProvider to support both Hume and ElevenLabs backends.
 * Default: ElevenLabs (better transcription with Scribe v2)
 */

import React from 'react';
import { Voice31UnifiedProvider } from './Voice31UnifiedProvider';
import { Voice31Display } from './Voice31Display';

// =============================================================================
// VOICE26 TAB
// =============================================================================

export const Voice31Tab: React.FC = () => {
  return (
    <div className="h-full w-full bg-black overflow-hidden relative">
      <Voice31UnifiedProvider defaultBackend="elevenlabs">
        <Voice31Display />
      </Voice31UnifiedProvider>
    </div>
  );
};

export default Voice31Tab;
