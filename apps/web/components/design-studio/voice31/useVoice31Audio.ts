'use client';

/**
 * Voice31 Audio Hook
 *
 * React hook for the professional audio engine.
 * Provides access to all voice processing features and presets.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  getVoice31Engine,
  Voice31AudioEngine,
  VoiceFXSettings,
  VOICE_PRESETS,
  type WavePoint,
  type AudioMetrics,
} from './Voice31AudioEngine';
import { useVoice31Store } from './Voice31Store';

export interface UseVoice31AudioReturn {
  // Connection state
  isConnected: boolean;
  isEnabled: boolean;

  // Settings
  settings: VoiceFXSettings;
  updateSettings: (settings: Partial<VoiceFXSettings>) => void;

  // Presets
  presets: typeof VOICE_PRESETS;
  currentPresetId: string | null;
  applyPreset: (presetId: string) => void;

  // Toggle
  toggleEnabled: () => void;

  // Visualization data
  wavePoints: WavePoint[];
  metrics: AudioMetrics;
}

export function useVoice31Audio(): UseVoice31AudioReturn {
  const engineRef = useRef<Voice31AudioEngine | null>(null);

  const [isConnected, setIsConnected] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);
  const [settings, setSettings] = useState<VoiceFXSettings>(() => {
    // Get default from first preset
    return VOICE_PRESETS[0].settings;
  });
  const [currentPresetId, setCurrentPresetId] = useState<string | null>('natural');
  const [wavePoints, setWavePoints] = useState<WavePoint[]>([]);
  const [metrics, setMetrics] = useState<AudioMetrics>({
    inputLevel: 0,
    outputLevel: 0,
    rms: 0,
    peak: 0,
    spectralCentroid: 0,
    formantFrequencies: [],
  });

  // Store state
  const storeIsConnected = useVoice31Store((s) => s.isConnected);
  const isSpeaking = useVoice31Store((s) => s.isSpeaking);
  const isListening = useVoice31Store((s) => s.isListening);

  // Initialize engine
  useEffect(() => {
    engineRef.current = getVoice31Engine();

    // Set up wave callback
    engineRef.current.setWaveCallback((points, m) => {
      setWavePoints(points);
      setMetrics(m);
    });

    // Apply initial preset
    engineRef.current.applyPreset('natural');

    return () => {
      // Don't destroy - singleton persists
    };
  }, []);

  // Connect when voice connects - try immediately and keep trying
  useEffect(() => {
    if (!engineRef.current) return;

    const tryConnect = async () => {
      if (engineRef.current) {
        const connected = await engineRef.current.connectToAudio();
        setIsConnected(connected);
        if (!connected) {
          console.log('[useVoice31Audio] Connection failed, will keep watching');
        }
      }
    };

    // Try to connect immediately when store reports connection
    if (storeIsConnected) {
      tryConnect();
    }

    // Also try periodically when speaking starts (assistant audio)
    const checkInterval = setInterval(() => {
      if (isSpeaking && !engineRef.current?.getIsConnected()) {
        console.log('[useVoice31Audio] Assistant speaking but not connected, retrying...');
        tryConnect();
      }
    }, 1000);

    return () => clearInterval(checkInterval);
  }, [storeIsConnected, isSpeaking]);

  // Update settings handler
  const updateSettings = useCallback((newSettings: Partial<VoiceFXSettings>) => {
    if (engineRef.current) {
      engineRef.current.applySettings(newSettings);
      setSettings(engineRef.current.getSettings());
      setCurrentPresetId(null); // Custom settings, no preset
    }
  }, []);

  // Apply preset handler
  const applyPreset = useCallback((presetId: string) => {
    if (engineRef.current) {
      engineRef.current.applyPreset(presetId);
      setSettings(engineRef.current.getSettings());
      setCurrentPresetId(presetId);
    }
  }, []);

  // Toggle enabled
  const toggleEnabled = useCallback(() => {
    if (engineRef.current) {
      const newEnabled = !engineRef.current.getIsEnabled();
      engineRef.current.setEnabled(newEnabled);
      setIsEnabled(newEnabled);
    }
  }, []);

  // Generate synthetic wave when not connected
  useEffect(() => {
    if (isConnected) return;

    const interval = setInterval(() => {
      const time = Date.now() / 1000;
      const activity = isSpeaking ? 0.7 : isListening ? 0.3 : 0.1;

      const syntheticPoints: WavePoint[] = Array.from({ length: 64 }, (_, i) => {
        const phase = time * 4 + i * 0.15;
        const wave1 = Math.sin(phase) * 0.4;
        const wave2 = Math.sin(phase * 2.3 + 1) * 0.2;
        const wave3 = Math.sin(phase * 0.7 + 2) * 0.3;
        const noise = (Math.random() - 0.5) * 0.15;

        const amplitude = (wave1 + wave2 + wave3 + noise) * activity;
        const velocity = Math.cos(phase) * 0.1 * activity;
        const pressure = 0.4 + Math.abs(amplitude) * 0.5 + (1 - Math.abs(velocity) * 3) * 0.3;

        return {
          amplitude,
          velocity,
          pressure: Math.min(1, Math.max(0.2, pressure)),
          frequency: 0.3 + Math.sin(phase * 0.5) * 0.2,
        };
      });

      setWavePoints(syntheticPoints);
      setMetrics({
        inputLevel: activity * 0.5,
        outputLevel: activity * 0.5,
        rms: activity * 0.5,
        peak: activity * 0.8,
        spectralCentroid: 0.4,
        formantFrequencies: [500, 1500, 2500],
      });
    }, 40);

    return () => clearInterval(interval);
  }, [isConnected, isSpeaking, isListening]);

  return {
    isConnected,
    isEnabled,
    settings,
    updateSettings,
    presets: VOICE_PRESETS,
    currentPresetId,
    applyPreset,
    toggleEnabled,
    wavePoints,
    metrics,
  };
}

export default useVoice31Audio;
