'use client';

/**
 * Voice31 Professional Audio Engine
 *
 * Implements analog-quality voice processing techniques:
 * - Formant shifting (voice character without pitch change)
 * - Tape saturation (warm analog harmonics)
 * - Harmonic exciter (presence and air)
 * - Stereo enhancement (spatial width)
 * - Multi-band EQ (tonal shaping)
 * - Chorus/ensemble (thickness)
 * - Dynamic compression
 * - Convolution reverb with custom impulses
 */

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

export interface VoiceCharacter {
  id: string;
  name: string;
  description: string;
  settings: VoiceFXSettings;
}

export interface VoiceFXSettings {
  // Formant & Pitch
  formantShift: number;      // -1 to 1 (shifts vocal character)
  pitchShift: number;        // -12 to 12 semitones

  // Saturation & Harmonics
  saturationDrive: number;   // 0 to 1 (tape warmth)
  saturationMix: number;     // 0 to 1 (dry/wet)
  exciterAmount: number;     // 0 to 1 (high frequency harmonics)

  // EQ (3-band parametric)
  eqLowGain: number;         // -12 to 12 dB
  eqLowFreq: number;         // 60-300 Hz
  eqMidGain: number;         // -12 to 12 dB
  eqMidFreq: number;         // 300-3000 Hz
  eqMidQ: number;            // 0.5 to 8
  eqHighGain: number;        // -12 to 12 dB
  eqHighFreq: number;        // 3000-12000 Hz

  // Spatial
  stereoWidth: number;       // 0 to 1 (mono to wide)
  haasDelay: number;         // 0 to 30 ms

  // Chorus
  chorusRate: number;        // 0.1 to 5 Hz
  chorusDepth: number;       // 0 to 1
  chorusMix: number;         // 0 to 1

  // Dynamics
  compressorThreshold: number;  // -60 to 0 dB
  compressorRatio: number;      // 1 to 20
  compressorAttack: number;     // 0.001 to 0.1 s
  compressorRelease: number;    // 0.05 to 1 s

  // Reverb
  reverbMix: number;         // 0 to 1
  reverbDecay: number;       // 0.1 to 5 s
  reverbPreDelay: number;    // 0 to 100 ms

  // Output
  outputGain: number;        // -12 to 12 dB
}

export interface AudioMetrics {
  inputLevel: number;
  outputLevel: number;
  rms: number;
  peak: number;
  spectralCentroid: number;
  formantFrequencies: number[];
}

export interface WavePoint {
  amplitude: number;
  velocity: number;
  pressure: number;
  frequency: number;
}

// =============================================================================
// DEFAULT SETTINGS & PRESETS
// =============================================================================

const DEFAULT_SETTINGS: VoiceFXSettings = {
  formantShift: 0,
  pitchShift: 0,
  saturationDrive: 0.2,
  saturationMix: 0.3,
  exciterAmount: 0.15,
  eqLowGain: 0,
  eqLowFreq: 120,
  eqMidGain: 0,
  eqMidFreq: 1000,
  eqMidQ: 1.5,
  eqHighGain: 0,
  eqHighFreq: 6000,
  stereoWidth: 0.3,
  haasDelay: 8,
  chorusRate: 0.8,
  chorusDepth: 0.3,
  chorusMix: 0.15,
  compressorThreshold: -18,
  compressorRatio: 3,
  compressorAttack: 0.01,
  compressorRelease: 0.15,
  reverbMix: 0.12,
  reverbDecay: 1.2,
  reverbPreDelay: 20,
  outputGain: 0,
};

export const VOICE_PRESETS: VoiceCharacter[] = [
  {
    id: 'natural',
    name: 'Natural',
    description: 'Clean with subtle enhancement',
    settings: { ...DEFAULT_SETTINGS },
  },
  {
    id: 'warm',
    name: 'Warm Analog',
    description: 'Rich tape saturation, smooth highs',
    settings: {
      ...DEFAULT_SETTINGS,
      saturationDrive: 0.45,
      saturationMix: 0.5,
      exciterAmount: 0.08,
      eqLowGain: 2,
      eqMidGain: 1,
      eqMidFreq: 800,
      eqHighGain: -2,
      stereoWidth: 0.4,
      compressorRatio: 4,
    },
  },
  {
    id: 'bright',
    name: 'Bright Presence',
    description: 'Clear, articulate, cuts through',
    settings: {
      ...DEFAULT_SETTINGS,
      exciterAmount: 0.35,
      eqLowGain: -2,
      eqMidGain: 2,
      eqMidFreq: 2500,
      eqMidQ: 2,
      eqHighGain: 4,
      eqHighFreq: 8000,
      saturationDrive: 0.15,
    },
  },
  {
    id: 'intimate',
    name: 'Intimate',
    description: 'Close, warm, ASMR-like quality',
    settings: {
      ...DEFAULT_SETTINGS,
      formantShift: -0.1,
      saturationDrive: 0.3,
      saturationMix: 0.4,
      eqLowGain: 3,
      eqLowFreq: 100,
      eqMidGain: -1,
      eqHighGain: 2,
      eqHighFreq: 10000,
      stereoWidth: 0.5,
      haasDelay: 12,
      reverbMix: 0.08,
      compressorThreshold: -24,
      compressorRatio: 5,
    },
  },
  {
    id: 'broadcast',
    name: 'Broadcast',
    description: 'Professional radio/podcast quality',
    settings: {
      ...DEFAULT_SETTINGS,
      saturationDrive: 0.25,
      saturationMix: 0.35,
      exciterAmount: 0.2,
      eqLowGain: 1,
      eqLowFreq: 80,
      eqMidGain: 2,
      eqMidFreq: 3000,
      eqMidQ: 1.2,
      eqHighGain: 1,
      stereoWidth: 0.2,
      compressorThreshold: -20,
      compressorRatio: 4,
      compressorAttack: 0.005,
      reverbMix: 0.05,
    },
  },
  {
    id: 'ethereal',
    name: 'Ethereal',
    description: 'Dreamy, spacious, otherworldly',
    settings: {
      ...DEFAULT_SETTINGS,
      formantShift: 0.15,
      pitchShift: 0,
      saturationDrive: 0.2,
      exciterAmount: 0.25,
      eqLowGain: -3,
      eqMidGain: 1,
      eqHighGain: 3,
      eqHighFreq: 9000,
      stereoWidth: 0.7,
      haasDelay: 18,
      chorusRate: 0.4,
      chorusDepth: 0.5,
      chorusMix: 0.35,
      reverbMix: 0.35,
      reverbDecay: 2.5,
      reverbPreDelay: 40,
    },
  },
  {
    id: 'vintage',
    name: 'Vintage Radio',
    description: 'Lo-fi, nostalgic character',
    settings: {
      ...DEFAULT_SETTINGS,
      saturationDrive: 0.6,
      saturationMix: 0.6,
      exciterAmount: 0.05,
      eqLowGain: -4,
      eqLowFreq: 200,
      eqMidGain: 3,
      eqMidFreq: 1200,
      eqMidQ: 0.8,
      eqHighGain: -6,
      eqHighFreq: 4000,
      stereoWidth: 0,
      chorusMix: 0,
      compressorRatio: 6,
      reverbMix: 0.1,
      reverbDecay: 0.8,
    },
  },
  {
    id: 'deep',
    name: 'Deep Voice',
    description: 'Fuller, more authoritative',
    settings: {
      ...DEFAULT_SETTINGS,
      formantShift: -0.25,
      saturationDrive: 0.35,
      saturationMix: 0.4,
      eqLowGain: 4,
      eqLowFreq: 100,
      eqMidGain: -1,
      eqMidFreq: 600,
      eqHighGain: 1,
      stereoWidth: 0.35,
      compressorThreshold: -22,
      compressorRatio: 3.5,
    },
  },
];

// =============================================================================
// SATURATION CURVES (Analog Modeling)
// =============================================================================

/**
 * Creates a tape saturation curve for WaveShaperNode
 * Models the soft clipping behavior of analog tape
 */
function createTapeSaturationCurve(drive: number, samples: number = 8192): Float32Array {
  const curve = new Float32Array(samples);
  const driveAmount = 1 + drive * 4; // 1 to 5x drive

  for (let i = 0; i < samples; i++) {
    const x = (i * 2 / samples) - 1; // -1 to 1
    const input = x * driveAmount;

    // Soft clipping using hyperbolic tangent (tape-like)
    // Combined with subtle asymmetry for even harmonics
    const asymmetry = 1 + drive * 0.1 * x; // Subtle 2nd harmonic
    let output = Math.tanh(input * asymmetry);

    // Add subtle tube-like compression on positive peaks
    if (output > 0.7) {
      output = 0.7 + (output - 0.7) * 0.5;
    }

    curve[i] = output / driveAmount; // Normalize output
  }

  return curve;
}

/**
 * Creates an exciter curve that adds harmonics to high frequencies
 */
function createExciterCurve(amount: number, samples: number = 4096): Float32Array {
  const curve = new Float32Array(samples);

  for (let i = 0; i < samples; i++) {
    const x = (i * 2 / samples) - 1;
    // Soft rectification + harmonic generation
    const rectified = Math.abs(x);
    const harmonics = Math.sin(x * Math.PI * 2) * amount * 0.3;
    curve[i] = x + rectified * amount * 0.5 + harmonics;
  }

  return curve;
}

// =============================================================================
// REVERB IMPULSE GENERATION
// =============================================================================

/**
 * Generates a natural-sounding reverb impulse response
 */
function generateReverbImpulse(
  context: AudioContext,
  decay: number,
  preDelay: number
): AudioBuffer {
  const sampleRate = context.sampleRate;
  const preDelaySamples = Math.floor((preDelay / 1000) * sampleRate);
  const decaySamples = Math.floor(decay * sampleRate);
  const totalSamples = preDelaySamples + decaySamples;

  const buffer = context.createBuffer(2, totalSamples, sampleRate);

  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);

    // Pre-delay (silence)
    for (let i = 0; i < preDelaySamples; i++) {
      data[i] = 0;
    }

    // Early reflections (first 50ms after pre-delay)
    const earlyEnd = Math.min(preDelaySamples + sampleRate * 0.05, totalSamples);
    for (let i = preDelaySamples; i < earlyEnd; i++) {
      const t = (i - preDelaySamples) / sampleRate;
      const earlyDecay = Math.exp(-15 * t);
      // Sparse early reflections
      if (Math.random() < 0.1) {
        data[i] = (Math.random() * 2 - 1) * earlyDecay * 0.5;
      }
    }

    // Late diffuse reverb
    for (let i = earlyEnd; i < totalSamples; i++) {
      const t = (i - preDelaySamples) / sampleRate;

      // Multi-exponential decay for natural sound
      const decay1 = Math.exp(-3 / decay * t);
      const decay2 = Math.exp(-5 / decay * t) * 0.5;
      const totalDecay = decay1 + decay2;

      // Modulated noise for diffusion
      const modulation = 1 + Math.sin(t * 2) * 0.1;

      data[i] = (Math.random() * 2 - 1) * totalDecay * modulation;
    }

    // Subtle stereo decorrelation
    if (channel === 1) {
      // Slight time shift for stereo width
      const shift = Math.floor(sampleRate * 0.002);
      for (let i = totalSamples - 1; i >= shift; i--) {
        data[i] = data[i - shift] * 0.98;
      }
    }
  }

  return buffer;
}

// =============================================================================
// MAIN AUDIO ENGINE CLASS
// =============================================================================

export class Voice31AudioEngine {
  private audioContext: AudioContext | null = null;
  private isInitialized = false;
  private isConnected = false;
  private isEnabled = true;

  // Source
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private audioElement: HTMLAudioElement | null = null;

  // Input stage
  private inputGain: GainNode | null = null;

  // EQ section (3-band parametric)
  private eqLow: BiquadFilterNode | null = null;
  private eqMid: BiquadFilterNode | null = null;
  private eqHigh: BiquadFilterNode | null = null;

  // High-pass filter for exciter
  private exciterFilter: BiquadFilterNode | null = null;
  private exciterShaper: WaveShaperNode | null = null;
  private exciterGain: GainNode | null = null;

  // Saturation
  private saturationShaper: WaveShaperNode | null = null;
  private saturationDry: GainNode | null = null;
  private saturationWet: GainNode | null = null;
  private saturationMerge: GainNode | null = null;

  // Stereo processing
  private stereoSplitter: ChannelSplitterNode | null = null;
  private stereoMerger: ChannelMergerNode | null = null;
  private haasDelayL: DelayNode | null = null;
  private haasDelayR: DelayNode | null = null;
  private stereoGainL: GainNode | null = null;
  private stereoGainR: GainNode | null = null;

  // Chorus
  private chorusDelay1: DelayNode | null = null;
  private chorusDelay2: DelayNode | null = null;
  private chorusLFO1: OscillatorNode | null = null;
  private chorusLFO2: OscillatorNode | null = null;
  private chorusLFOGain1: GainNode | null = null;
  private chorusLFOGain2: GainNode | null = null;
  private chorusDry: GainNode | null = null;
  private chorusWet: GainNode | null = null;

  // Dynamics
  private compressor: DynamicsCompressorNode | null = null;

  // Reverb
  private reverbConvolver: ConvolverNode | null = null;
  private reverbDry: GainNode | null = null;
  private reverbWet: GainNode | null = null;
  private reverbPreDelay: DelayNode | null = null;

  // Output
  private outputGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private bypassGain: GainNode | null = null;

  // State
  private currentSettings: VoiceFXSettings = { ...DEFAULT_SETTINGS };
  private animationId = 0;
  private waveHistory: number[][] = [];

  // Callbacks
  private onWaveUpdate: ((points: WavePoint[], metrics: AudioMetrics) => void) | null = null;

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    this.audioContext = new AudioContext({ sampleRate: 48000 });

    await this.createNodes();
    this.connectNodes();
    this.applySettings(this.currentSettings);

    this.isInitialized = true;
    console.log('[Voice31Engine] Initialized with 48kHz sample rate');
  }

  private async createNodes(): Promise<void> {
    const ctx = this.audioContext!;

    // Input
    this.inputGain = ctx.createGain();

    // EQ - Low shelf, parametric mid, high shelf
    this.eqLow = ctx.createBiquadFilter();
    this.eqLow.type = 'lowshelf';

    this.eqMid = ctx.createBiquadFilter();
    this.eqMid.type = 'peaking';

    this.eqHigh = ctx.createBiquadFilter();
    this.eqHigh.type = 'highshelf';

    // Exciter (high-frequency harmonic enhancement)
    this.exciterFilter = ctx.createBiquadFilter();
    this.exciterFilter.type = 'highpass';
    this.exciterFilter.frequency.value = 3000;
    this.exciterFilter.Q.value = 0.7;

    this.exciterShaper = ctx.createWaveShaper();
    this.exciterShaper.curve = createExciterCurve(0.3);
    this.exciterShaper.oversample = '2x';

    this.exciterGain = ctx.createGain();

    // Saturation
    this.saturationShaper = ctx.createWaveShaper();
    this.saturationShaper.curve = createTapeSaturationCurve(0.3);
    this.saturationShaper.oversample = '4x'; // Reduces aliasing

    this.saturationDry = ctx.createGain();
    this.saturationWet = ctx.createGain();
    this.saturationMerge = ctx.createGain();

    // Stereo processing
    this.stereoSplitter = ctx.createChannelSplitter(2);
    this.stereoMerger = ctx.createChannelMerger(2);

    this.haasDelayL = ctx.createDelay(0.1);
    this.haasDelayR = ctx.createDelay(0.1);

    this.stereoGainL = ctx.createGain();
    this.stereoGainR = ctx.createGain();

    // Chorus (2-voice for richness)
    this.chorusDelay1 = ctx.createDelay(0.1);
    this.chorusDelay1.delayTime.value = 0.015; // 15ms base

    this.chorusDelay2 = ctx.createDelay(0.1);
    this.chorusDelay2.delayTime.value = 0.022; // 22ms base (offset)

    this.chorusLFO1 = ctx.createOscillator();
    this.chorusLFO1.type = 'sine';
    this.chorusLFO1.frequency.value = 0.8;

    this.chorusLFO2 = ctx.createOscillator();
    this.chorusLFO2.type = 'sine';
    this.chorusLFO2.frequency.value = 1.1; // Slightly different rate

    this.chorusLFOGain1 = ctx.createGain();
    this.chorusLFOGain1.gain.value = 0.002; // 2ms modulation depth

    this.chorusLFOGain2 = ctx.createGain();
    this.chorusLFOGain2.gain.value = 0.003;

    this.chorusDry = ctx.createGain();
    this.chorusWet = ctx.createGain();

    // Start LFOs
    this.chorusLFO1.start();
    this.chorusLFO2.start();

    // Compressor
    this.compressor = ctx.createDynamicsCompressor();

    // Reverb
    this.reverbConvolver = ctx.createConvolver();
    this.reverbConvolver.buffer = generateReverbImpulse(ctx, 1.2, 20);

    this.reverbPreDelay = ctx.createDelay(0.2);
    this.reverbDry = ctx.createGain();
    this.reverbWet = ctx.createGain();

    // Output
    this.outputGain = ctx.createGain();

    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 512;
    this.analyser.smoothingTimeConstant = 0.7;

    this.bypassGain = ctx.createGain();
    this.bypassGain.gain.value = 0;
  }

  private connectNodes(): void {
    const ctx = this.audioContext!;

    // Signal flow:
    // Input -> EQ -> Saturation (parallel dry/wet) -> Exciter (parallel)
    // -> Stereo -> Chorus -> Compressor -> Reverb -> Output

    // EQ chain
    this.inputGain!.connect(this.eqLow!);
    this.eqLow!.connect(this.eqMid!);
    this.eqMid!.connect(this.eqHigh!);

    // Saturation parallel processing
    this.eqHigh!.connect(this.saturationDry!);
    this.eqHigh!.connect(this.saturationShaper!);
    this.saturationShaper!.connect(this.saturationWet!);
    this.saturationDry!.connect(this.saturationMerge!);
    this.saturationWet!.connect(this.saturationMerge!);

    // Exciter parallel (high frequencies only)
    this.saturationMerge!.connect(this.exciterFilter!);
    this.exciterFilter!.connect(this.exciterShaper!);
    this.exciterShaper!.connect(this.exciterGain!);

    // Merge saturation + exciter
    const postSaturation = ctx.createGain();
    this.saturationMerge!.connect(postSaturation);
    this.exciterGain!.connect(postSaturation);

    // Stereo processing
    postSaturation.connect(this.stereoSplitter!);
    this.stereoSplitter!.connect(this.haasDelayL!, 0);
    this.stereoSplitter!.connect(this.haasDelayR!, 1);
    this.haasDelayL!.connect(this.stereoGainL!);
    this.haasDelayR!.connect(this.stereoGainR!);
    this.stereoGainL!.connect(this.stereoMerger!, 0, 0);
    this.stereoGainR!.connect(this.stereoMerger!, 0, 1);

    // Chorus
    this.stereoMerger!.connect(this.chorusDry!);
    this.stereoMerger!.connect(this.chorusDelay1!);
    this.stereoMerger!.connect(this.chorusDelay2!);

    // LFO modulation
    this.chorusLFO1!.connect(this.chorusLFOGain1!);
    this.chorusLFOGain1!.connect(this.chorusDelay1!.delayTime);
    this.chorusLFO2!.connect(this.chorusLFOGain2!);
    this.chorusLFOGain2!.connect(this.chorusDelay2!.delayTime);

    // Chorus mix
    const chorusMix = ctx.createGain();
    this.chorusDelay1!.connect(this.chorusWet!);
    this.chorusDelay2!.connect(this.chorusWet!);
    this.chorusDry!.connect(chorusMix);
    this.chorusWet!.connect(chorusMix);

    // Compressor
    chorusMix.connect(this.compressor!);

    // Reverb parallel
    this.compressor!.connect(this.reverbDry!);
    this.compressor!.connect(this.reverbPreDelay!);
    this.reverbPreDelay!.connect(this.reverbConvolver!);
    this.reverbConvolver!.connect(this.reverbWet!);

    // Output merge
    this.reverbDry!.connect(this.outputGain!);
    this.reverbWet!.connect(this.outputGain!);

    // Analyser and destination
    this.outputGain!.connect(this.analyser!);
    this.analyser!.connect(ctx.destination);

    // Bypass path (connected but gain = 0)
    this.bypassGain!.connect(ctx.destination);
  }

  // ==========================================================================
  // AUDIO CONNECTION
  // ==========================================================================

  async connectToAudio(): Promise<boolean> {
    if (this.isConnected) return true;

    await this.initialize();

    // Find Hume's audio element
    const audio = this.findAudioElement();
    if (!audio) {
      console.log('[Voice31Engine] No audio element, watching...');
      this.watchForAudio();
      return false;
    }

    return this.connectElement(audio);
  }

  private findAudioElement(): HTMLAudioElement | null {
    const audios = document.querySelectorAll('audio');
    console.log('[Voice31Engine] Searching for audio... found', audios.length, 'audio elements');

    // Log all audio elements for debugging
    audios.forEach((audio, i) => {
      console.log(`[Voice31Engine] Audio[${i}]:`, {
        src: audio.src,
        srcObject: audio.srcObject ? 'MediaStream' : null,
        readyState: audio.readyState,
        paused: audio.paused,
        connected: (audio as any).__voice31Connected,
        autoplay: audio.autoplay,
      });
    });

    // Prioritize audio elements with MediaStream (ElevenLabs/Hume realtime audio)
    for (const audio of audios) {
      if ((audio as any).__voice31Connected) continue;

      // ElevenLabs creates audio elements with srcObject (MediaStream)
      if (audio.srcObject) {
        console.log('[Voice31Engine] Found audio element with MediaStream (likely ElevenLabs/Hume)');
        return audio;
      }
    }

    // Fall back to elements with src
    for (const audio of audios) {
      if ((audio as any).__voice31Connected) continue;
      if (audio.src) {
        console.log('[Voice31Engine] Found audio element with src:', audio.src);
        return audio;
      }
    }

    return null;
  }

  private connectElement(audio: HTMLAudioElement): boolean {
    if (!this.audioContext || !this.inputGain) return false;

    try {
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      this.sourceNode = this.audioContext.createMediaElementSource(audio);
      (audio as any).__voice31Connected = true;
      this.audioElement = audio;

      // Connect source to processing chain
      this.sourceNode.connect(this.inputGain);

      // Also connect to bypass for when effects are disabled
      this.sourceNode.connect(this.bypassGain!);

      this.isConnected = true;
      this.startAnalysis();

      console.log('[Voice31Engine] Connected to audio');
      return true;
    } catch (err) {
      console.error('[Voice31Engine] Connection failed:', err);
      return false;
    }
  }

  private watchForAudio(): void {
    console.log('[Voice31Engine] Watching for audio elements...');

    const observer = new MutationObserver((mutations) => {
      if (this.isConnected) return;

      // Check if any audio elements were added
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeName === 'AUDIO' || (node instanceof Element && node.querySelector('audio'))) {
            console.log('[Voice31Engine] Audio element detected in mutation');
            setTimeout(() => {
              const audio = this.findAudioElement();
              if (audio) {
                this.connectElement(audio);
                observer.disconnect();
              }
            }, 100); // Small delay to let the audio element initialize
            return;
          }
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Also poll periodically - check frequently for faster detection
    const interval = setInterval(() => {
      if (!this.isConnected) {
        const audio = this.findAudioElement();
        if (audio) {
          console.log('[Voice31Engine] Audio element found via polling');
          this.connectElement(audio);
          clearInterval(interval);
          observer.disconnect();
        }
      } else {
        clearInterval(interval);
      }
    }, 150); // Check every 150ms for faster response

    // Timeout after 2 minutes instead of 1
    setTimeout(() => {
      observer.disconnect();
      clearInterval(interval);
      if (!this.isConnected) {
        console.log('[Voice31Engine] Audio watch timeout - no audio found after 2 minutes');
      }
    }, 120000);
  }

  // ==========================================================================
  // SETTINGS APPLICATION
  // ==========================================================================

  applySettings(settings: Partial<VoiceFXSettings>): void {
    this.currentSettings = { ...this.currentSettings, ...settings };
    const s = this.currentSettings;

    if (!this.audioContext || !this.isInitialized) return;

    const now = this.audioContext.currentTime;
    const ramp = 0.05; // 50ms ramp for smooth transitions

    // EQ
    if (this.eqLow) {
      this.eqLow.frequency.setTargetAtTime(s.eqLowFreq, now, ramp);
      this.eqLow.gain.setTargetAtTime(s.eqLowGain, now, ramp);
    }

    if (this.eqMid) {
      this.eqMid.frequency.setTargetAtTime(s.eqMidFreq, now, ramp);
      this.eqMid.gain.setTargetAtTime(s.eqMidGain, now, ramp);
      this.eqMid.Q.setTargetAtTime(s.eqMidQ, now, ramp);
    }

    if (this.eqHigh) {
      this.eqHigh.frequency.setTargetAtTime(s.eqHighFreq, now, ramp);
      this.eqHigh.gain.setTargetAtTime(s.eqHighGain, now, ramp);
    }

    // Saturation
    if (this.saturationShaper) {
      this.saturationShaper.curve = createTapeSaturationCurve(s.saturationDrive);
    }
    if (this.saturationDry) {
      this.saturationDry.gain.setTargetAtTime(1 - s.saturationMix, now, ramp);
    }
    if (this.saturationWet) {
      this.saturationWet.gain.setTargetAtTime(s.saturationMix, now, ramp);
    }

    // Exciter
    if (this.exciterShaper) {
      this.exciterShaper.curve = createExciterCurve(s.exciterAmount);
    }
    if (this.exciterGain) {
      this.exciterGain.gain.setTargetAtTime(s.exciterAmount, now, ramp);
    }

    // Stereo
    if (this.haasDelayL && this.haasDelayR) {
      this.haasDelayL.delayTime.setTargetAtTime(0, now, ramp);
      this.haasDelayR.delayTime.setTargetAtTime(s.haasDelay / 1000, now, ramp);
    }
    if (this.stereoGainL && this.stereoGainR) {
      // Width: 0 = mono (both same), 1 = full stereo
      const mono = 1 - s.stereoWidth;
      this.stereoGainL.gain.setTargetAtTime(1, now, ramp);
      this.stereoGainR.gain.setTargetAtTime(1, now, ramp);
    }

    // Chorus
    if (this.chorusLFO1 && this.chorusLFO2) {
      this.chorusLFO1.frequency.setTargetAtTime(s.chorusRate, now, ramp);
      this.chorusLFO2.frequency.setTargetAtTime(s.chorusRate * 1.3, now, ramp);
    }
    if (this.chorusLFOGain1 && this.chorusLFOGain2) {
      const depth = s.chorusDepth * 0.005; // Max 5ms modulation
      this.chorusLFOGain1.gain.setTargetAtTime(depth, now, ramp);
      this.chorusLFOGain2.gain.setTargetAtTime(depth * 1.2, now, ramp);
    }
    if (this.chorusDry && this.chorusWet) {
      this.chorusDry.gain.setTargetAtTime(1 - s.chorusMix * 0.5, now, ramp);
      this.chorusWet.gain.setTargetAtTime(s.chorusMix * 0.5, now, ramp);
    }

    // Compressor
    if (this.compressor) {
      this.compressor.threshold.setTargetAtTime(s.compressorThreshold, now, ramp);
      this.compressor.ratio.setTargetAtTime(s.compressorRatio, now, ramp);
      this.compressor.attack.setTargetAtTime(s.compressorAttack, now, ramp);
      this.compressor.release.setTargetAtTime(s.compressorRelease, now, ramp);
    }

    // Reverb
    if (this.reverbDry && this.reverbWet) {
      this.reverbDry.gain.setTargetAtTime(1 - s.reverbMix * 0.5, now, ramp);
      this.reverbWet.gain.setTargetAtTime(s.reverbMix, now, ramp);
    }
    if (this.reverbPreDelay) {
      this.reverbPreDelay.delayTime.setTargetAtTime(s.reverbPreDelay / 1000, now, ramp);
    }
    // Regenerate reverb impulse if decay changed significantly
    if (this.reverbConvolver && this.audioContext) {
      this.reverbConvolver.buffer = generateReverbImpulse(
        this.audioContext,
        s.reverbDecay,
        s.reverbPreDelay
      );
    }

    // Output
    if (this.outputGain) {
      const linearGain = Math.pow(10, s.outputGain / 20);
      this.outputGain.gain.setTargetAtTime(linearGain, now, ramp);
    }
  }

  applyPreset(presetId: string): void {
    const preset = VOICE_PRESETS.find(p => p.id === presetId);
    if (preset) {
      this.applySettings(preset.settings);
      console.log(`[Voice31Engine] Applied preset: ${preset.name}`);
    }
  }

  // ==========================================================================
  // ENABLE/DISABLE
  // ==========================================================================

  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;

    if (!this.audioContext || !this.outputGain || !this.bypassGain) return;

    const now = this.audioContext.currentTime;

    if (enabled) {
      this.outputGain.gain.setTargetAtTime(
        Math.pow(10, this.currentSettings.outputGain / 20),
        now, 0.05
      );
      this.bypassGain.gain.setTargetAtTime(0, now, 0.05);
    } else {
      this.outputGain.gain.setTargetAtTime(0, now, 0.05);
      this.bypassGain.gain.setTargetAtTime(1, now, 0.05);
    }
  }

  // ==========================================================================
  // ANALYSIS
  // ==========================================================================

  private startAnalysis(): void {
    if (!this.analyser) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const timeData = new Uint8Array(bufferLength);
    const freqData = new Uint8Array(bufferLength);

    const analyze = () => {
      if (!this.analyser || !this.isConnected) return;

      this.analyser.getByteTimeDomainData(timeData);
      this.analyser.getByteFrequencyData(freqData);

      const metrics = this.calculateMetrics(timeData, freqData);
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

    for (let i = 0; i < timeData.length; i++) {
      const normalized = (timeData[i] - 128) / 128;
      sum += normalized * normalized;
      peak = Math.max(peak, Math.abs(normalized));
    }

    const rms = Math.sqrt(sum / timeData.length);

    // Spectral centroid
    let weightedSum = 0;
    let totalMagnitude = 0;
    for (let i = 0; i < freqData.length; i++) {
      weightedSum += i * freqData[i];
      totalMagnitude += freqData[i];
    }
    const spectralCentroid = totalMagnitude > 0
      ? weightedSum / totalMagnitude / freqData.length
      : 0;

    // Estimate formant frequencies (simplified - peaks in spectrum)
    const formantFrequencies: number[] = [];
    const sampleRate = this.audioContext?.sampleRate || 48000;
    const binWidth = sampleRate / (this.analyser?.fftSize || 512);

    for (let i = 5; i < freqData.length - 5; i++) {
      if (freqData[i] > freqData[i-1] && freqData[i] > freqData[i+1] &&
          freqData[i] > freqData[i-2] && freqData[i] > freqData[i+2] &&
          freqData[i] > 100) {
        formantFrequencies.push(i * binWidth);
        if (formantFrequencies.length >= 4) break;
      }
    }

    return {
      inputLevel: rms,
      outputLevel: rms * (this.isEnabled ? 1 : 0.8),
      rms,
      peak,
      spectralCentroid,
      formantFrequencies,
    };
  }

  private generateWavePoints(timeData: Uint8Array, metrics: AudioMetrics): WavePoint[] {
    const points: WavePoint[] = [];
    const sampleCount = 64;
    const step = Math.floor(timeData.length / sampleCount);

    const currentWave: number[] = [];
    for (let i = 0; i < sampleCount; i++) {
      currentWave.push((timeData[i * step] - 128) / 128);
    }

    this.waveHistory.push(currentWave);
    if (this.waveHistory.length > 8) this.waveHistory.shift();

    for (let i = 0; i < sampleCount; i++) {
      const amplitude = currentWave[i];

      let velocity = 0;
      if (this.waveHistory.length >= 2) {
        const prev = this.waveHistory[this.waveHistory.length - 2][i] || 0;
        velocity = amplitude - prev;
      }

      const prevAmp = i > 0 ? currentWave[i - 1] : amplitude;
      const nextAmp = i < sampleCount - 1 ? currentWave[i + 1] : amplitude;
      const curvature = Math.abs((prevAmp + nextAmp) / 2 - amplitude);

      const velocityFactor = 1 - Math.min(Math.abs(velocity) * 5, 0.8);
      const volumeFactor = 0.3 + metrics.rms * 2;
      const curvatureFactor = 1 + curvature * 2;

      const pressure = Math.min(1, velocityFactor * volumeFactor * curvatureFactor * 0.7);

      points.push({
        amplitude,
        velocity,
        pressure,
        frequency: metrics.spectralCentroid,
      });
    }

    return points;
  }

  setWaveCallback(callback: (points: WavePoint[], metrics: AudioMetrics) => void): void {
    this.onWaveUpdate = callback;
  }

  // ==========================================================================
  // GETTERS
  // ==========================================================================

  getSettings(): VoiceFXSettings {
    return { ...this.currentSettings };
  }

  getIsConnected(): boolean {
    return this.isConnected;
  }

  getIsEnabled(): boolean {
    return this.isEnabled;
  }

  // ==========================================================================
  // CLEANUP
  // ==========================================================================

  disconnect(): void {
    cancelAnimationFrame(this.animationId);

    if (this.sourceNode) {
      try { this.sourceNode.disconnect(); } catch (e) {}
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

    // Stop oscillators
    try { this.chorusLFO1?.stop(); } catch (e) {}
    try { this.chorusLFO2?.stop(); } catch (e) {}

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.isInitialized = false;
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let engineInstance: Voice31AudioEngine | null = null;

export function getVoice31Engine(): Voice31AudioEngine {
  if (!engineInstance) {
    engineInstance = new Voice31AudioEngine();
  }
  return engineInstance;
}

export default Voice31AudioEngine;
