'use client';

import React, { Suspense, lazy } from 'react';
import { Microphone } from '@phosphor-icons/react';

const Voice31Tab = lazy(() => import('@/components/design-studio/voice31/Voice31Tab'));

const LoadingFallback = () => (
  <div className="w-full h-full bg-black flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <Microphone className="w-16 h-16 text-amber-500 animate-pulse" />
        <div className="absolute inset-0 w-16 h-16 border-2 border-amber-500/30 rounded-full animate-ping" />
      </div>
      <div className="text-amber-500 font-mono text-sm tracking-wider animate-pulse">
        INITIALIZING SPEECH FM...
      </div>
    </div>
  </div>
);

export default function SpeechFMAppPage() {
  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      <Suspense fallback={<LoadingFallback />}>
        <Voice31Tab />
      </Suspense>
    </div>
  );
}
