'use client';

import React, { useCallback } from 'react';
import { X } from '@phosphor-icons/react';
import { AdminChangeLog } from './AdminChangeLog';
import { useStorytellingStore } from './StorytellingStore';
import type { SceneType, SceneVisualOverrides } from './types';

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: 10,
      fontWeight: 600,
      color: 'rgba(255,255,255,0.35)',
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      margin: '12px 0 6px',
      paddingBottom: 4,
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}
  >
    {children}
  </div>
);

const SliderRow: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
}> = ({ label, value, min, max, step = 1, onChange }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0' }}>
    <span
      style={{
        flex: '0 0 70px',
        fontFamily: 'system-ui, sans-serif',
        fontSize: 11,
        color: 'rgba(255,255,255,0.5)',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
    >
      {label}
    </span>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      style={{
        flex: 1,
        height: 4,
        accentColor: '#58a6ff',
        cursor: 'pointer',
      }}
    />
    <span
      style={{
        flex: '0 0 36px',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 10,
        color: 'rgba(255,255,255,0.6)',
        textAlign: 'right',
      }}
    >
      {step < 1 ? value.toFixed(2) : value}
    </span>
  </div>
);

const SelectRow: React.FC<{
  label: string;
  value: string;
  options: Array<{ label: string; value: string }>;
  onChange: (v: string) => void;
}> = ({ label, value, options, onChange }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0' }}>
    <span
      style={{
        flex: '0 0 70px',
        fontFamily: 'system-ui, sans-serif',
        fontSize: 11,
        color: 'rgba(255,255,255,0.5)',
      }}
    >
      {label}
    </span>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        flex: 1,
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 4,
        color: 'rgba(255,255,255,0.7)',
        fontFamily: 'system-ui, sans-serif',
        fontSize: 11,
        padding: '3px 6px',
        cursor: 'pointer',
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  </div>
);

// ---------------------------------------------------------------------------
// Scene-type aware sections
// ---------------------------------------------------------------------------

const CINEMATIC_TYPES = new Set<SceneType>([
  'cinematic_point_cloud',
  'cinematic_depth_mesh',
  'cinematic_composition',
  'cinematic_dither',
  'cinematic_flat',
  'cinematic_layered',
]);

const DEPTH_TYPES = new Set<SceneType>([
  'cinematic_point_cloud',
  'cinematic_depth_mesh',
  'cinematic_composition',
]);

interface AdminPanelProps {
  accentColor: string;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ accentColor }) => {
  const scenes = useStorytellingStore((s) => s.scenes);
  const currentIndex = useStorytellingStore((s) => s.currentSceneIndex);
  const overrides = useStorytellingStore((s) => s.sceneOverrides);
  const setOverride = useStorytellingStore((s) => s.setSceneOverride);
  const setVisible = useStorytellingStore((s) => s.setAdminPanelVisible);

  const currentEntry = scenes[currentIndex];
  const scene = currentEntry?.scene;
  if (!scene) return null;

  const sceneType = scene.type;
  const isCinematic = CINEMATIC_TYPES.has(sceneType);
  const isDepth = DEPTH_TYPES.has(sceneType);
  const isDither = sceneType === 'cinematic_dither';
  const isFlat = sceneType === 'cinematic_flat' || sceneType === 'cinematic_dither';

  const ov: SceneVisualOverrides = overrides[scene.id] || {};

  const set = useCallback(
    (param: string, value: unknown) => {
      setOverride(scene.id, sceneType, param, value);
    },
    [scene.id, sceneType, setOverride],
  );

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        width: 240,
        background: 'rgba(8, 8, 12, 0.92)',
        backdropFilter: 'blur(12px)',
        borderLeft: '1px solid rgba(255,255,255,0.06)',
        zIndex: 20,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11,
            fontWeight: 600,
            color: 'rgba(255,255,255,0.6)',
            letterSpacing: '0.06em',
          }}
        >
          ADMIN
        </span>
        <button
          onClick={() => setVisible(false)}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.4)',
            cursor: 'pointer',
            padding: 2,
            display: 'flex',
          }}
        >
          <X size={14} />
        </button>
      </div>

      {/* Scrollable controls */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '4px 12px 12px',
        }}
      >
        {/* Scene info — always shown */}
        <SectionLabel>Scene</SectionLabel>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
          <div>type: <span style={{ color: 'rgba(200,230,255,0.7)' }}>{sceneType}</span></div>
          <div>id: {scene.id}</div>
          <div>accent: <span style={{ color: accentColor }}>{accentColor}</span></div>
          <div>duration: {scene.duration}s</div>
        </div>

        {/* Dither controls */}
        {isDither && (
          <>
            <SectionLabel>Dither</SectionLabel>
            <SelectRow
              label="Mode"
              value={ov.ditherMode || (scene.data as any).mode || 'verticalFM'}
              options={[
                { label: 'Vertical FM', value: 'verticalFM' },
                { label: 'Horizontal FM', value: 'horizontalFM' },
                { label: 'Scatter', value: 'scatter' },
                { label: 'Noise', value: 'noise' },
              ]}
              onChange={(v) => set('ditherMode', v)}
            />
            <SliderRow label="Lines" value={ov.ditherLineCount ?? (scene.data as any).lineCount ?? 140} min={40} max={200} step={5} onChange={(v) => set('ditherLineCount', v)} />
            <SliderRow label="Amplitude" value={ov.ditherAmplitude ?? (scene.data as any).amplitude ?? 0.3} min={0} max={1} step={0.05} onChange={(v) => set('ditherAmplitude', v)} />
            <SliderRow label="Frequency" value={ov.ditherFrequency ?? (scene.data as any).frequency ?? 20} min={5} max={60} step={1} onChange={(v) => set('ditherFrequency', v)} />
            <SliderRow label="Glow" value={ov.ditherGlow ?? (scene.data as any).glow ?? 0.5} min={0} max={2} step={0.1} onChange={(v) => set('ditherGlow', v)} />
          </>
        )}

        {/* 3D Renderer controls */}
        {isDepth && (
          <>
            <SectionLabel>3D Renderer</SectionLabel>
            <SelectRow
              label="Shader"
              value={ov.shaderVariant || (scene.data as any).shader || 'default'}
              options={[
                { label: 'Default', value: 'default' },
                { label: 'Soft Glow', value: 'softGlow' },
                { label: 'Breathing', value: 'breathing' },
                { label: 'Toon', value: 'toon' },
                { label: 'Painterly', value: 'painterly' },
                { label: 'Adaptive', value: 'adaptive' },
              ]}
              onChange={(v) => set('shaderVariant', v)}
            />
          </>
        )}

        {/* Camera controls */}
        {isCinematic && (
          <>
            <SectionLabel>Camera</SectionLabel>
            <SelectRow
              label="Preset"
              value={ov.cinematicPreset || (scene.data as any).preset || 'editorial'}
              options={[
                { label: 'Intimate', value: 'intimate' },
                { label: 'Dramatic', value: 'dramatic' },
                { label: 'Breaking News', value: 'breaking-news' },
                { label: 'Editorial', value: 'editorial' },
                { label: 'Social Viral', value: 'social-viral' },
                { label: 'Documentary', value: 'documentary' },
              ]}
              onChange={(v) => set('cinematicPreset', v)}
            />
            <SliderRow label="Speed" value={ov.cameraSpeed ?? 1} min={0.1} max={3} step={0.1} onChange={(v) => set('cameraSpeed', v)} />
            <SliderRow label="Amplitude" value={ov.cameraAmplitude ?? 1} min={0.1} max={3} step={0.1} onChange={(v) => set('cameraAmplitude', v)} />
            <SliderRow label="FOV" value={ov.cameraFov ?? 50} min={20} max={90} step={1} onChange={(v) => set('cameraFov', v)} />
          </>
        )}

        {/* Atmosphere */}
        {isCinematic && (
          <>
            <SectionLabel>Atmosphere</SectionLabel>
            <SliderRow label="Fog" value={ov.atmosphereDensity ?? 0} min={0} max={0.1} step={0.005} onChange={(v) => set('atmosphereDensity', v)} />
            <SliderRow label="Vignette" value={ov.vignetteIntensity ?? 0.4} min={0} max={1} step={0.05} onChange={(v) => set('vignetteIntensity', v)} />
          </>
        )}

        {/* Particles */}
        {isCinematic && (
          <>
            <SectionLabel>Particles</SectionLabel>
            <SelectRow
              label="Type"
              value={ov.particleType || 'dust'}
              options={[
                { label: 'None', value: 'none' },
                { label: 'Dust', value: 'dust' },
                { label: 'Fireflies', value: 'fireflies' },
                { label: 'Rain', value: 'rain' },
                { label: 'Snow', value: 'snow' },
                { label: 'Ember', value: 'ember' },
              ]}
              onChange={(v) => set('particleType', v)}
            />
            <SliderRow label="Count" value={ov.particleCount ?? 50} min={0} max={200} step={5} onChange={(v) => set('particleCount', v)} />
            <SliderRow label="Speed" value={ov.particleSpeed ?? 1} min={0.1} max={5} step={0.1} onChange={(v) => set('particleSpeed', v)} />
            <SliderRow label="Opacity" value={ov.particleOpacity ?? 0.5} min={0} max={1} step={0.05} onChange={(v) => set('particleOpacity', v)} />
          </>
        )}

        {/* Image stylization for flat/dither */}
        {isFlat && (
          <>
            <SectionLabel>Image</SectionLabel>
            <SelectRow
              label="Style"
              value={ov.imageStylization || 'none'}
              options={[
                { label: 'None', value: 'none' },
                { label: 'Illustrated', value: 'illustrated' },
                { label: 'Editorial', value: 'editorial' },
                { label: 'Photographic', value: 'photographic' },
                { label: 'Dithered', value: 'dithered' },
              ]}
              onChange={(v) => set('imageStylization', v)}
            />
          </>
        )}

        {/* Change log */}
        <AdminChangeLog />
      </div>
    </div>
  );
};
