'use client';

/**
 * Voice31 Audio Processor
 *
 * Intercepts and processes Hume voice audio output with real-time effects.
 * Provides waveform data for visualization with pressure/velocity metrics.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useVoice31Store, type AudioFXSettings } from './Voice31Store';

// =============================================================================
// TYPES
// =============================================================================

export interface WavePoint {
  amplitude: number;      // -1 to 1 displacement
  velocity: number;       // Rate of change
  pressure: number;       // Derived pressure (0-1)
  frequency: number;      // Local frequency content
}

export interface AudioMetrics {
  rms: number;            // Root mean square (volume)
  peak: number;           // Peak amplitude
  spectralCentroid: number; // Brightness
  zeroCrossings: number;  // Pitch indicator
}

// =============================================================================
// AUDIO EFFECTS PROCESSOR
// =============================================================================

class Voice31AudioEngine {
  private audioContext: AudioContext | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private reverbGainNode: GainNode | null = null;
  private dryGainNode: GainNode | null = null;
  private wetGainNode: GainNode | null = null;
  private reverbNode: ConvolverNode | null = null;
  private masterGainNode: GainNode | null = null;
  private bypassNode: GainNode | null = null;

  private audioElement: HTMLAudioElement | null = null;
  private isConnected = false;
  private isEnabled = true;
  private animationId = 0;

  // Waveform history for pressure calculation
  private waveHistory: number[][] = [];
  private readonly historyLength = 8;

  // Callbacks
  private onWaveUpdate: ((points: WavePoint[], metrics: AudioMetrics) => void) | null = null;

  async initialize(): Promise<void> {
    if (this.audioContext) return;

    this.audioContext = new AudioContext({ sampleRate: 44100 });

    // Create nodes
    this.analyserNode = this.audioContext.createAnalyser();
    this.analyserNode.fftSize = 512;
    this.analyserNode.smoothingTimeConstant = 0.65;

    this.filterNode = this.audioContext.createBiquadFilter();
    this.filterNode.type = 'lowpass';
    this.filterNode.frequency.value = 20000;
    this.filterNode.Q.value = 0.7;

    this.dryGainNode = this.audioContext.createGain();
    this.wetGainNode = this.audioContext.createGain();
    this.masterGainNode = this.audioContext.createGain();
    this.bypassNode = this.audioContext.createGain();

    // Create reverb impulse
    await this.createReverbImpulse();

    console.log('[Voice31Audio] Engine initialized');
  }

  private async createReverbImpulse(): Promise<void> {
    if (!this.audioContext) return;

    const sampleRate = this.audioContext.sampleRate;
    const duration = 2.5;
    const length = sampleRate * duration;
    const impulse = this.audioContext.createBuffer(2, length, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const data = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        // Multi-tap decay for richer reverb
        const decay1 = Math.exp(-3.0 * t);
        const decay2 = Math.exp(-1.5 * t) * 0.3;
        const earlyReflections = i < sampleRate * 0.05
          ? Math.random() * Math.exp(-20 * t) * 0.5
          : 0;

        data[i] = (Math.random() * 2 - 1) * (decay1 + decay2) + earlyReflections;

        // Add subtle modulation
        data[i] *= 1 + Math.sin(t * 3) * 0.1;
      }
    }

    this.reverbNode = this.audioContext.createConvolver();
    this.reverbNode.buffer = impulse;
  }

  async connectToAudio(): Promise<boolean> {
    if (this.isConnected) return true;

    await this.initialize();
    if (!this.audioContext) return false;

    // Find Hume's audio element
    const findAudio = (): HTMLAudioElement | null => {
      const audios = document.querySelectorAll('audio');
      for (const audio of audios) {
        // Skip already connected elements
        if ((audio as any).__voice31Connected) continue;
        if (audio.src || audio.srcObject) {
          return audio;
        }
      }
      return null;
    };

    const audio = findAudio();

    if (!audio) {
      console.log('[Voice31Audio] No audio element found, watching...');
      this.watchForAudio();
      return false;
    }

    return this.connectElement(audio);
  }

  private connectElement(audio: HTMLAudioElement): boolean {
    if (!this.audioContext) return false;

    try {
      // Resume context
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      // Create source
      this.sourceNode = this.audioContext.createMediaElementSource(audio);
      (audio as any).__voice31Connected = true;
      this.audioElement = audio;

      this.buildEffectsChain();
      this.isConnected = true;
      this.startAnalysis();

      console.log('[Voice31Audio] Connected to Hume audio');
      return true;
    } catch (err) {
      console.error('[Voice31Audio] Connection failed:', err);
      return false;
    }
  }

  private buildEffectsChain(): void {
    if (!this.sourceNode || !this.audioContext) return;

    const {
      filterNode,
      reverbNode,
      dryGainNode,
      wetGainNode,
      masterGainNode,
      bypassNode,
      analyserNode,
    } = this;

    if (!filterNode || !dryGainNode || !wetGainNode || !masterGainNode || !bypassNode || !analyserNode) return;

    // Source -> Filter
    this.sourceNode.connect(filterNode);

    // Filter -> Dry path
    filterNode.connect(dryGainNode);
    dryGainNode.connect(masterGainNode);

    // Filter -> Wet path (reverb)
    if (reverbNode) {
      filterNode.connect(reverbNode);
      reverbNode.connect(wetGainNode);
      wetGainNode.connect(masterGainNode);
    }

    // Master -> Analyser -> Output
    masterGainNode.connect(analyserNode);
    analyserNode.connect(this.audioContext.destination);

    // Also connect bypass path for when disabled
    this.sourceNode.connect(bypassNode);
    bypassNode.gain.value = 0; // Start with effects enabled

    bypassNode.connect(this.audioContext.destination);
  }

  private watchForAudio(): void {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node instanceof HTMLAudioElement && !this.isConnected) {
            setTimeout(() => {
              if (!this.isConnected) {
                this.connectElement(node);
              }
            }, 100);
            return;
          }
          if (node instanceof Element) {
            const audio = node.querySelector('audio');
            if (audio && !this.isConnected) {
              setTimeout(() => {
                if (!this.isConnected) {
                  this.connectElement(audio);
                }
              }, 100);
              return;
            }
          }
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Periodic check as fallback
    const interval = setInterval(() => {
      if (!this.isConnected) {
        const audio = document.querySelector('audio:not([data-voice31])');
        if (audio instanceof HTMLAudioElement) {
          this.connectElement(audio);
        }
      } else {
        clearInterval(interval);
        observer.disconnect();
      }
    }, 500);

    // Cleanup after 60s
    setTimeout(() => {
      observer.disconnect();
      clearInterval(interval);
    }, 60000);
  }

  updateSettings(settings: AudioFXSettings): void {
    if (!this.audioContext || !this.isEnabled) return;

    const now = this.audioContext.currentTime;
    const rampTime = 0.05;

    // Filter: 0 = 150Hz (muffled), 1 = 20000Hz (open)
    if (this.filterNode) {
      const minFreq = 150;
      const maxFreq = 20000;
      const freq = minFreq * Math.pow(maxFreq / minFreq, settings.filter);
      this.filterNode.frequency.setTargetAtTime(freq, now, rampTime);
    }

    // Reverb wet/dry mix
    if (this.dryGainNode && this.wetGainNode) {
      const wet = settings.reverb;
      const dry = 1 - wet * 0.4; // Keep some dry even at max reverb
      this.dryGainNode.gain.setTargetAtTime(dry, now, rampTime);
      this.wetGainNode.gain.setTargetAtTime(wet * 1.2, now, rampTime);
    }

    // Note: Pitch and bitcrush require AudioWorklet - they affect visualization for now
  }

  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;

    if (!this.audioContext || !this.masterGainNode || !this.bypassNode) return;

    const now = this.audioContext.currentTime;

    if (enabled) {
      this.masterGainNode.gain.setTargetAtTime(1, now, 0.05);
      this.bypassNode.gain.setTargetAtTime(0, now, 0.05);
    } else {
      this.masterGainNode.gain.setTargetAtTime(0, now, 0.05);
      this.bypassNode.gain.setTargetAtTime(1, now, 0.05);
    }
  }

  private startAnalysis(): void {
    if (!this.analyserNode) return;

    const bufferLength = this.analyserNode.frequencyBinCount;
    const timeData = new Uint8Array(bufferLength);
    const freqData = new Uint8Array(bufferLength);

    const analyze = () => {
      if (!this.analyserNode || !this.isConnected) return;

      this.analyserNode.getByteTimeDomainData(timeData);
      this.analyserNode.getByteFrequencyData(freqData);

      // Calculate metrics
      const metrics = this.calculateMetrics(timeData, freqData);

      // Generate wave points with pressure
      const wavePoints = this.generateWavePoints(timeData, metrics);

      if (this.onWaveUpdate) {
        this.onWaveUpdate(wavePoints, metrics);
      }

      this.animationId = requestAnimationFrame(analyze);
    };

    analyze();
  }

  private calculateMetrics(timeData: Uint8Array, freqData: Uint8Array): AudioMetrics {
    let sum = 0;
    let peak = 0;
    let zeroCrossings = 0;
    let lastSign = 0;

    for (let i = 0; i < timeData.length; i++) {
      const normalized = (timeData[i] - 128) / 128;
      sum += normalized * normalized;
      peak = Math.max(peak, Math.abs(normalized));

      const sign = normalized >= 0 ? 1 : -1;
      if (lastSign !== 0 && sign !== lastSign) zeroCrossings++;
      lastSign = sign;
    }

    const rms = Math.sqrt(sum / timeData.length);

    // Spectral centroid (brightness)
    let weightedSum = 0;
    let totalMagnitude = 0;
    for (let i = 0; i < freqData.length; i++) {
      weightedSum += i * freqData[i];
      totalMagnitude += freqData[i];
    }
    const spectralCentroid = totalMagnitude > 0 ? weightedSum / totalMagnitude / freqData.length : 0;

    return { rms, peak, spectralCentroid, zeroCrossings };
  }

  private generateWavePoints(timeData: Uint8Array, metrics: AudioMetrics): WavePoint[] {
    const points: WavePoint[] = [];
    const sampleCount = 64;
    const step = Math.floor(timeData.length / sampleCount);

    // Store current wave for history
    const currentWave: number[] = [];
    for (let i = 0; i < sampleCount; i++) {
      currentWave.push((timeData[i * step] - 128) / 128);
    }

    this.waveHistory.push(currentWave);
    if (this.waveHistory.length > this.historyLength) {
      this.waveHistory.shift();
    }

    for (let i = 0; i < sampleCount; i++) {
      const amplitude = currentWave[i];

      // Calculate velocity from history
      let velocity = 0;
      if (this.waveHistory.length >= 2) {
        const prev = this.waveHistory[this.waveHistory.length - 2][i] || 0;
        velocity = amplitude - prev;
      }

      // Calculate pressure based on:
      // - Velocity magnitude (faster movement = less pressure)
      // - RMS level (louder = more pressure)
      // - Local curvature
      const prevAmp = i > 0 ? currentWave[i - 1] : amplitude;
      const nextAmp = i < sampleCount - 1 ? currentWave[i + 1] : amplitude;
      const curvature = Math.abs((prevAmp + nextAmp) / 2 - amplitude);

      // Pressure formula: high when slow, loud, and at peaks
      const velocityFactor = 1 - Math.min(Math.abs(velocity) * 5, 0.8);
      const volumeFactor = 0.3 + metrics.rms * 2;
      const curvatureFactor = 1 + curvature * 2;

      const pressure = Math.min(1, velocityFactor * volumeFactor * curvatureFactor * 0.7);

      // Local frequency from zero crossings in neighborhood
      let localZero = 0;
      for (let j = Math.max(0, i - 3); j <= Math.min(sampleCount - 1, i + 3); j++) {
        const curr = currentWave[j];
        const next = currentWave[j + 1] || curr;
        if ((curr >= 0 && next < 0) || (curr < 0 && next >= 0)) localZero++;
      }

      points.push({
        amplitude,
        velocity,
        pressure,
        frequency: localZero / 6,
      });
    }

    return points;
  }

  setWaveCallback(callback: (points: WavePoint[], metrics: AudioMetrics) => void): void {
    this.onWaveUpdate = callback;
  }

  getIsConnected(): boolean {
    return this.isConnected;
  }

  getIsEnabled(): boolean {
    return this.isEnabled;
  }

  disconnect(): void {
    cancelAnimationFrame(this.animationId);

    if (this.sourceNode) {
      try {
        this.sourceNode.disconnect();
      } catch (e) {}
      this.sourceNode = null;
    }

    if (this.audioElement) {
      (this.audioElement as any).__voice31Connected = false;
      this.audioElement = null;
    }

    this.isConnected = false;
    this.waveHistory = [];
  }

  destroy(): void {
    this.disconnect();

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// =============================================================================
// SINGLETON & HOOK
// =============================================================================

let engineInstance: Voice31AudioEngine | null = null;

function getEngine(): Voice31AudioEngine {
  if (!engineInstance) {
    engineInstance = new Voice31AudioEngine();
  }
  return engineInstance;
}

export function useVoice31AudioProcessor() {
  const [isConnected, setIsConnected] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);
  const [wavePoints, setWavePoints] = useState<WavePoint[]>([]);
  const [metrics, setMetrics] = useState<AudioMetrics>({ rms: 0, peak: 0, spectralCentroid: 0, zeroCrossings: 0 });

  const audioFX = useVoice31Store((s) => s.audioFX);
  const storeIsConnected = useVoice31Store((s) => s.isConnected);
  const isSpeaking = useVoice31Store((s) => s.isSpeaking);
  const isListening = useVoice31Store((s) => s.isListening);

  // Initialize and connect
  useEffect(() => {
    const engine = getEngine();

    engine.setWaveCallback((points, m) => {
      setWavePoints(points);
      setMetrics(m);
    });

    if (storeIsConnected) {
      engine.connectToAudio().then((connected) => {
        setIsConnected(connected);
      });
    }

    return () => {
      // Don't destroy, just update state
      setIsConnected(engine.getIsConnected());
    };
  }, [storeIsConnected]);

  // Update effects
  useEffect(() => {
    const engine = getEngine();
    engine.updateSettings(audioFX);
  }, [audioFX]);

  // Toggle enable/disable
  const toggleEnabled = useCallback(() => {
    const engine = getEngine();
    const newState = !engine.getIsEnabled();
    engine.setEnabled(newState);
    setIsEnabled(newState);
  }, []);

  // Generate synthetic wave when not connected but speaking
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
        rms: activity * 0.5,
        peak: activity * 0.8,
        spectralCentroid: 0.4,
        zeroCrossings: 20,
      });
    }, 40);

    return () => clearInterval(interval);
  }, [isConnected, isSpeaking, isListening]);

  return {
    isConnected,
    isEnabled,
    toggleEnabled,
    wavePoints,
    metrics,
  };
}

export default Voice31AudioEngine;
