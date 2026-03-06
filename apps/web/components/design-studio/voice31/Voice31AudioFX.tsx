'use client';

/**
 * Voice31 Audio FX Panel - Redesigned
 *
 * Connected to bottom of CRT with:
 * - Wire connectors visually linking to CRT
 * - Connect/Disconnect button integrated with waveform
 * - Red hangup button
 * - Mobile-friendly responsive layout
 * - Dynamic waveform from actual audio
 */

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useVoice31Store } from './Voice31Store';
import { useVoice31Audio } from './useVoice31Audio';
import type { WavePoint, AudioMetrics } from './Voice31AudioEngine';
import { Phone, PhoneSlash, Power, Microphone, SpeakerHigh, GearSix, Sword } from '@phosphor-icons/react';
import { BinaryAssistant } from './BinaryAssistant';
import { useVoice31ElevenLabs } from './Voice31ElevenLabsProvider';
import { useVoice31RPGStore } from './Voice31RPGStore';

// =============================================================================
// DYNAMIC WAVEFORM COMPONENT
// =============================================================================

interface DynamicWaveformProps {
  points: WavePoint[];
  width: number;
  height: number;
  baseColor: string;
  glowColor: string;
  metrics: AudioMetrics;
  isConnected: boolean;
  isSpeaking: boolean;
}

const DynamicWaveform: React.FC<DynamicWaveformProps> = ({
  points,
  width,
  height,
  baseColor,
  glowColor,
  metrics,
  isConnected,
  isSpeaking,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const centerY = height / 2;
      const amplitude = height * 0.35;

      // Generate path points
      const pathPoints = points.map((p, i) => {
        const t = points.length > 1 ? i / (points.length - 1) : 0.5;
        const x = t * width;
        const y = centerY + p.amplitude * amplitude;
        return { x, y, pressure: p.pressure };
      });

      if (pathPoints.length < 2) {
        rafRef.current = requestAnimationFrame(render);
        return;
      }

      // Draw glow layers
      for (let bloom = 3; bloom >= 1; bloom--) {
        ctx.beginPath();
        ctx.moveTo(pathPoints[0].x, pathPoints[0].y);

        for (let i = 0; i < pathPoints.length - 1; i++) {
          const p1 = pathPoints[i];
          const p2 = pathPoints[i + 1];
          const midX = (p1.x + p2.x) / 2;
          const midY = (p1.y + p2.y) / 2;
          ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
        }
        ctx.lineTo(pathPoints[pathPoints.length - 1].x, pathPoints[pathPoints.length - 1].y);

        const bloomWidth = bloom * 4 + 2;
        const bloomAlpha = (0.2 / bloom) * (0.3 + metrics.rms * 2);

        ctx.strokeStyle = glowColor;
        ctx.lineWidth = bloomWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = bloomAlpha;
        ctx.filter = `blur(${bloom * 2}px)`;
        ctx.stroke();
        ctx.filter = 'none';
      }

      ctx.globalAlpha = 1;

      // Draw main line
      ctx.beginPath();
      ctx.moveTo(pathPoints[0].x, pathPoints[0].y);

      for (let i = 0; i < pathPoints.length - 1; i++) {
        const p1 = pathPoints[i];
        const p2 = pathPoints[i + 1];
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
      }
      ctx.lineTo(pathPoints[pathPoints.length - 1].x, pathPoints[pathPoints.length - 1].y);

      ctx.strokeStyle = baseColor;
      ctx.lineWidth = 2 + metrics.rms * 2;
      ctx.lineCap = 'round';
      ctx.stroke();

      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafRef.current);
  }, [points, width, height, baseColor, glowColor, metrics]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height }}
      className="block"
    />
  );
};

// =============================================================================
// WIRE CONNECTOR SVG
// =============================================================================

const WireConnector: React.FC<{ color: string; side: 'left' | 'right' }> = ({ color, side }) => (
  <svg
    className={`absolute top-0 ${side === 'left' ? 'left-4' : 'right-4'} -translate-y-full`}
    width="24"
    height="20"
    viewBox="0 0 24 20"
  >
    {/* Wire coming down from CRT */}
    <path
      d={side === 'left' ? 'M12 0 L12 12 Q12 18 18 18 L24 18' : 'M12 0 L12 12 Q12 18 6 18 L0 18'}
      fill="none"
      stroke={color}
      strokeWidth="3"
      strokeLinecap="round"
    />
    {/* Glow */}
    <path
      d={side === 'left' ? 'M12 0 L12 12 Q12 18 18 18 L24 18' : 'M12 0 L12 12 Q12 18 6 18 L0 18'}
      fill="none"
      stroke={color}
      strokeWidth="6"
      strokeLinecap="round"
      opacity="0.3"
      filter="url(#wireGlow)"
    />
    {/* Connector dot */}
    <circle cx="12" cy="4" r="4" fill={color} />
    <circle cx="12" cy="4" r="6" fill={color} opacity="0.3" />
    <defs>
      <filter id="wireGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2" result="blur" />
      </filter>
    </defs>
  </svg>
);

// =============================================================================
// COMPACT KNOB
// =============================================================================

interface CompactKnobProps {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  label: string;
  color: string;
}

const CompactKnob: React.FC<CompactKnobProps> = ({
  value,
  min,
  max,
  onChange,
  label,
  color,
}) => {
  const percent = ((value - min) / (max - min)) * 100;
  const angle = -135 + (percent / 100) * 270;

  return (
    <div className="flex flex-col items-center gap-0.5">
      <span
        className="text-[7px] font-mono uppercase tracking-wide opacity-70 font-semibold"
        style={{ color }}
      >
        {label}
      </span>
      <div
        className="relative w-8 h-8 rounded-full cursor-pointer transition-all hover:scale-110 active:scale-95"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${color}20, ${color}08)`,
          border: `2px solid ${color}50`,
          boxShadow: `inset 0 2px 4px rgba(0,0,0,0.5), 0 2px 8px ${color}20`,
        }}
      >
        {/* Track */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 32 32">
          <circle
            cx="16" cy="16" r="12"
            fill="none"
            stroke={`${color}30`}
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="56.5"
            strokeDashoffset="18.8"
            transform="rotate(135 16 16)"
          />
          <circle
            cx="16" cy="16" r="12"
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={`${percent * 0.565} 100`}
            strokeDashoffset="18.8"
            transform="rotate(135 16 16)"
            style={{ filter: `drop-shadow(0 0 3px ${color})` }}
          />
        </svg>

        {/* Indicator */}
        <div
          className="absolute w-0.5 h-2.5 rounded-full"
          style={{
            backgroundColor: color,
            boxShadow: `0 0 6px ${color}`,
            top: '50%',
            left: '50%',
            transformOrigin: 'center center',
            transform: `translate(-50%, -100%) rotate(${angle}deg) translateY(-8px)`,
          }}
        />

        <input
          type="range"
          min={min}
          max={max}
          step={(max - min) / 100}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>
    </div>
  );
};

// =============================================================================
// PRESET CHIP
// =============================================================================

interface PresetChipProps {
  name: string;
  isActive: boolean;
  onClick: () => void;
  color: string;
}

const PresetChip: React.FC<PresetChipProps> = ({ name, isActive, onClick, color }) => (
  <button
    onClick={onClick}
    className="px-2 py-0.5 rounded text-[8px] font-mono uppercase tracking-wider transition-all hover:scale-105 font-semibold whitespace-nowrap"
    style={{
      backgroundColor: isActive ? `${color}30` : `${color}10`,
      border: `1px solid ${isActive ? color : `${color}40`}`,
      color: isActive ? color : `${color}80`,
      boxShadow: isActive ? `0 0 10px ${color}40` : 'none',
    }}
  >
    {name}
  </button>
);

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export const Voice31AudioFX: React.FC<{
  embedded?: boolean;
  width?: number;
  height?: number;
  showAssistant?: boolean;
}> = ({ embedded = true, width = 280, height = 90, showAssistant = false }) => {
  const { phosphorColor, isSpeaking, isThinking, isConnected: voiceConnected, toggleSettingsPanel } = useVoice31Store();
  const {
    isConnected: audioConnected,
    isEnabled,
    settings,
    updateSettings,
    presets,
    currentPresetId,
    applyPreset,
    toggleEnabled,
    wavePoints,
    metrics,
  } = useVoice31Audio();

  const containerRef = useRef<HTMLDivElement>(null);
  const [panelWidth, setPanelWidth] = useState(width);
  const [showPresets, setShowPresets] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // ElevenLabs voice control (default backend)
  const elevenLabs = useVoice31ElevenLabs();

  // RPG mode state for Continue Adventure button
  const rpgModeActive = useVoice31RPGStore((s) => s.rpgModeActive);
  const currentSaveFile = useVoice31RPGStore((s) => s.currentSaveFile);
  const showContinueRPG = rpgModeActive && !!currentSaveFile && !voiceConnected && !isConnecting;

  const handleConnect = useCallback(async () => {
    if (voiceConnected || isConnecting) return;
    setIsConnecting(true);

    try {
      await elevenLabs.startConversation();
    } catch (error) {
      console.error('[Voice31AudioFX] Connect error:', error);
    } finally {
      setIsConnecting(false);
    }
  }, [elevenLabs, voiceConnected, isConnecting]);

  const handleContinueRPG = useCallback(async () => {
    if (voiceConnected || isConnecting) return;
    setIsConnecting(true);

    try {
      await elevenLabs.startConversation({ rpgContinue: true });
    } catch (error) {
      console.error('[Voice31AudioFX] RPG Continue error:', error);
    } finally {
      setIsConnecting(false);
    }
  }, [elevenLabs, voiceConnected, isConnecting]);

  const handleDisconnect = useCallback(async () => {
    try {
      await elevenLabs.endConversation();
    } catch (error) {
      console.error('[Voice31AudioFX] Disconnect error:', error);
    }
  }, [elevenLabs]);

  // Colors
  const colors = useMemo(() => {
    const palettes: Record<string, { base: string; glow: string; dim: string }> = {
      green: { base: '#88ffaa', glow: '#44dd88', dim: '#224422' },
      amber: { base: '#ffcc88', glow: '#ffaa44', dim: '#442211' },
      red: { base: '#ff8888', glow: '#ff4444', dim: '#441111' },
      blue: { base: '#aaccff', glow: '#6699ff', dim: '#112244' },
      white: { base: '#eeeeff', glow: '#ccccff', dim: '#222233' },
    };
    return palettes[phosphorColor] || palettes.amber;
  }, [phosphorColor]);

  // Resize observer
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setPanelWidth(entry.contentRect.width);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);


  // Calculate waveform width based on available space
  const waveformWidth = Math.max(80, panelWidth - 320);

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      style={{ height }}
    >
      {/* Main panel body - clean embedded style */}
      <div
        className="absolute inset-0 overflow-hidden rounded-lg"
        style={{
          background: `linear-gradient(180deg,
            #080c18 0%,
            #050810 50%,
            #030508 100%
          )`,
          border: `1px solid ${colors.glow}25`,
          boxShadow: `
            inset 0 1px 2px ${colors.glow}10,
            inset 0 -2px 4px rgba(0,0,0,0.4)
          `,
        }}
      >
        {/* LED dot-matrix overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: 0.06,
            backgroundImage: `radial-gradient(circle, ${colors.base} 0.5px, transparent 0.5px)`,
            backgroundSize: '4px 4px',
          }}
        />

        {/* Scanlines */}
        <div
          className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            background: `repeating-linear-gradient(0deg, transparent, transparent 2px, ${colors.dim} 2px, ${colors.dim} 3px)`,
          }}
        />

        {/* Content */}
        <div className="relative z-10 h-full flex items-center px-3 gap-2">

          {/* Connect/Disconnect section */}
          <div className="flex-shrink-0 flex flex-col items-center gap-1">
            {voiceConnected ? (
              <button
                onClick={handleDisconnect}
                className="flex items-center justify-center w-10 h-10 rounded-lg transition-all hover:scale-105 active:scale-95"
                style={{
                  backgroundColor: '#ff444430',
                  border: '2px solid #ff4444',
                  boxShadow: '0 0 15px #ff444440',
                }}
                title="Disconnect"
              >
                <PhoneSlash className="w-[18px] h-[18px]" color="#ff4444" />
              </button>
            ) : isConnecting ? (
              <button
                disabled
                className="flex items-center justify-center w-10 h-10 rounded-lg"
                style={{
                  backgroundColor: `${colors.glow}15`,
                  border: `2px solid ${colors.glow}60`,
                }}
                title="Connecting..."
              >
                <div
                  className="w-5 h-5 border-2 rounded-full animate-spin"
                  style={{
                    borderColor: `${colors.glow}30`,
                    borderTopColor: colors.base,
                  }}
                />
              </button>
            ) : (
              <button
                onClick={handleConnect}
                className="flex items-center justify-center w-10 h-10 rounded-lg transition-all hover:scale-105 active:scale-95"
                style={{
                  backgroundColor: `${colors.glow}20`,
                  border: `2px solid ${colors.glow}`,
                  boxShadow: `0 0 15px ${colors.glow}40`,
                }}
                title="Connect"
              >
                <Phone className="w-[18px] h-[18px]" color={colors.base} />
              </button>
            )}
            <span
              className="text-[7px] font-mono uppercase font-bold"
              style={{ color: voiceConnected ? '#ff4444' : isConnecting ? colors.glow : colors.base }}
            >
              {voiceConnected ? 'END' : isConnecting ? '...' : 'CALL'}
            </span>
          </div>

          {/* Waveform area — shows mini assistant when migrated, otherwise waveform */}
          <div
            className="flex-1 min-w-0 relative rounded-lg overflow-hidden"
            style={{
              backgroundColor: `${colors.dim}40`,
              border: `1px solid ${colors.glow}30`,
              height: height - 20,
            }}
          >
            {showAssistant ? (
              /* Mini Binary Assistant lives inside the waveform area */
              <BinaryAssistant
                phosphorColor={phosphorColor}
                width={waveformWidth}
                height={height - 22}
                scale={0.45}
                compact={true}
                isThinking={isThinking}
              />
            ) : (
              <>
                {/* Status overlay when not speaking */}
                {!isSpeaking && (
                  <div
                    className={`absolute inset-0 flex items-center justify-center z-10 ${showContinueRPG ? '' : 'pointer-events-none'}`}
                    style={{ backgroundColor: `${colors.dim}80` }}
                  >
                    {showContinueRPG ? (
                      /* Continue Adventure button for RPG mode */
                      <button
                        onClick={handleContinueRPG}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
                        style={{
                          backgroundColor: `${colors.glow}20`,
                          border: `1px solid ${colors.glow}60`,
                          boxShadow: `0 0 12px ${colors.glow}30`,
                        }}
                      >
                        <Sword className="w-3.5 h-3.5" color={colors.glow} />
                        <span className="text-[10px] font-mono uppercase font-bold" style={{ color: colors.glow }}>
                          CONTINUE ADVENTURE
                        </span>
                      </button>
                    ) : (
                    <div className="flex items-center gap-2">
                      {voiceConnected ? (
                        <>
                          <Microphone className="w-3.5 h-3.5 animate-pulse" color={colors.glow} />
                          <span className="text-[10px] font-mono uppercase" style={{ color: colors.glow }}>
                            LISTENING
                          </span>
                        </>
                      ) : (
                        <>
                          <SpeakerHigh className="w-3.5 h-3.5" color={colors.dim} />
                          <span className="text-[10px] font-mono uppercase" style={{ color: `${colors.base}60` }}>
                            STANDBY
                          </span>
                        </>
                      )}
                    </div>
                    )}
                  </div>
                )}

                <DynamicWaveform
                  points={wavePoints}
                  width={waveformWidth}
                  height={height - 22}
                  baseColor={colors.base}
                  glowColor={colors.glow}
                  metrics={metrics}
                  isConnected={audioConnected}
                  isSpeaking={isSpeaking}
                />
              </>
            )}
          </div>

          {/* FX Enable toggle */}
          <button
            onClick={toggleEnabled}
            className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full transition-all hover:scale-110"
            style={{
              backgroundColor: isEnabled ? `${colors.glow}25` : `${colors.dim}20`,
              border: `2px solid ${isEnabled ? colors.glow : colors.dim}50`,
              boxShadow: isEnabled ? `0 0 12px ${colors.glow}50` : 'none',
            }}
            title={isEnabled ? 'FX On' : 'FX Off'}
          >
            <Power
              className="w-3.5 h-3.5"
              color={isEnabled ? colors.base : colors.dim}
              style={{ filter: isEnabled ? `drop-shadow(0 0 4px ${colors.glow})` : 'none' }}
            />
          </button>

          {/* Preset selector */}
          <div className="flex-shrink-0 relative">
            <button
              onClick={() => setShowPresets(!showPresets)}
              className="px-2 py-1 rounded text-[8px] font-mono uppercase tracking-wider font-semibold"
              style={{
                backgroundColor: `${colors.glow}15`,
                border: `1px solid ${colors.glow}50`,
                color: colors.base,
              }}
            >
              {presets.find(p => p.id === currentPresetId)?.name.slice(0, 6) || 'PRESET'}
            </button>

            {/* Preset dropdown */}
            {showPresets && (
              <div
                className="absolute bottom-full left-0 mb-1 p-1 rounded-lg flex flex-col gap-1 z-50"
                style={{
                  backgroundColor: `${colors.dim}f0`,
                  border: `1px solid ${colors.glow}50`,
                  boxShadow: `0 -4px 20px rgba(0,0,0,0.5)`,
                }}
              >
                {presets.map((preset) => (
                  <PresetChip
                    key={preset.id}
                    name={preset.name}
                    isActive={currentPresetId === preset.id}
                    onClick={() => {
                      applyPreset(preset.id);
                      setShowPresets(false);
                    }}
                    color={colors.base}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Quick knobs */}
          <div className="flex-shrink-0 flex gap-1">
            <CompactKnob
              label="WARM"
              value={settings.saturationDrive}
              min={0}
              max={0.8}
              onChange={(v) => updateSettings({ saturationDrive: v })}
              color={colors.base}
            />
            <CompactKnob
              label="AIR"
              value={settings.exciterAmount}
              min={0}
              max={0.5}
              onChange={(v) => updateSettings({ exciterAmount: v })}
              color={colors.base}
            />
            <CompactKnob
              label="VERB"
              value={settings.reverbMix}
              min={0}
              max={0.6}
              onChange={(v) => updateSettings({ reverbMix: v })}
              color={colors.base}
            />
          </div>

          {/* Status LED */}
          <div className="flex-shrink-0 flex flex-col items-center gap-0.5">
            <div
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: audioConnected ? colors.base : isSpeaking ? colors.glow : colors.dim,
                boxShadow: audioConnected
                  ? `0 0 8px ${colors.glow}`
                  : isSpeaking
                  ? `0 0 6px ${colors.glow}80`
                  : 'none',
              }}
            />
            <span
              className="text-[6px] font-mono uppercase font-bold"
              style={{ color: audioConnected ? colors.glow : colors.dim }}
            >
              {audioConnected ? 'FX' : 'SIM'}
            </span>
          </div>

          {/* Settings */}
          <div className="flex-shrink-0 flex flex-col items-center gap-0.5">
            <button
              onClick={toggleSettingsPanel}
              className="flex items-center justify-center w-8 h-8 rounded-full transition-all hover:scale-110 active:scale-95"
              style={{
                backgroundColor: `${colors.glow}15`,
                border: `1.5px solid ${colors.glow}40`,
              }}
              title="Settings"
            >
              <GearSix className="w-3.5 h-3.5" color={colors.base} />
            </button>
            <span
              className="text-[6px] font-mono uppercase font-bold"
              style={{ color: `${colors.base}80` }}
            >
              SET
            </span>
          </div>
        </div>

        {/* Corner brackets */}
        <div className="absolute bottom-1.5 left-1.5 w-3 h-3 border-l border-b opacity-30" style={{ borderColor: colors.glow }} />
        <div className="absolute bottom-1.5 right-1.5 w-3 h-3 border-r border-b opacity-30" style={{ borderColor: colors.glow }} />
      </div>
    </div>
  );
};

export default Voice31AudioFX;
