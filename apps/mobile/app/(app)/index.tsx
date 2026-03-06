/**
 * Voice Tab - Main voice assistant screen
 */

import React from 'react';
import { VoiceProvider } from '@/components/voice/VoiceProvider';
import { VoiceScreen } from '@/components/voice/VoiceScreen';

export default function VoiceTab() {
  return (
    <VoiceProvider>
      <VoiceScreen />
    </VoiceProvider>
  );
}
