'use client';

/**
 * Voice31 Scene Inspector
 *
 * Side panel for real-time scene inspection and editing.
 * Mirrors the NoteEditor pattern (340px width, phosphor-colored bezel).
 * Sections: Scene Info, Scene Type, Camera, Lighting, Depth, Dither, Filigree, NPCs.
 */

import React from 'react';
import { X, Camera, Sun, Cube, GridFour, Flower, Users } from '@phosphor-icons/react';
import {
  useVoice31RPGStore,
  RPG_SCENE_LIGHTING_PRESETS,
  type RPGSceneType,
  type CameraPreset,
  type RPGSceneLighting,
  type FMDitherPattern,
} from './Voice31RPGStore';
import { CAMERA_PRESETS, DEFAULT_CAMERA_CONFIG } from './scene/CameraController';
import { SliderRow, SettingRow, ToggleSwitch, SelectDropdown, ButtonGroup, type SelectOption } from './settings/primitives';

interface Voice31SceneInspectorProps {
  height: number;
}

const SCENE_TYPE_OPTIONS: SelectOption[] = [
  { value: 'depthmap', label: 'Depth Map' },
  { value: 'webgl_dither', label: 'WebGL Dither' },
  { value: 'parallax_popup', label: 'Parallax Popup' },
  { value: 'css_only', label: 'CSS Only' },
];

const CAMERA_PRESET_OPTIONS: SelectOption[] = Object.entries(CAMERA_PRESETS).map(([value, label]) => ({
  value,
  label: label.split(' ').slice(0, 3).join(' '),
}));

const LIGHTING_PRESET_OPTIONS: SelectOption[] = [
  { value: 'default', label: 'Default' },
  { value: 'fantasy', label: 'Fantasy' },
  { value: 'cyberpunk', label: 'Cyberpunk' },
  { value: 'noir', label: 'Noir' },
  { value: 'fallout', label: 'Fallout' },
  { value: 'medieval', label: 'Medieval' },
  { value: 'scifi', label: 'Sci-Fi' },
];

const DITHER_PATTERN_OPTIONS: SelectOption[] = [
  { value: 'bayer4', label: 'Bayer 4x4' },
  { value: 'bayer8', label: 'Bayer 8x8' },
  { value: 'bayer16', label: 'Bayer 16x16' },
  { value: 'halftone', label: 'Halftone' },
  { value: 'noise', label: 'Noise' },
];

// =============================================================================
// Section Header
// =============================================================================

const SectionHeader: React.FC<{ icon: React.ReactNode; title: string; color: string }> = ({ icon, title, color }) => (
  <div className="flex items-center gap-2 pt-4 pb-2" style={{ color }}>
    {icon}
    <span className="text-xs font-mono font-bold tracking-wide uppercase">{title}</span>
  </div>
);

// =============================================================================
// Main Component
// =============================================================================

export const Voice31SceneInspector: React.FC<Voice31SceneInspectorProps> = ({ height }) => {
  const activeScene = useVoice31RPGStore((s) => s.activeScene);
  const settings = useVoice31RPGStore((s) => s.currentSaveFile?.settings);
  const toggleSceneInspector = useVoice31RPGStore((s) => s.toggleSceneInspector);
  const setSceneType = useVoice31RPGStore((s) => s.setSceneType);
  const setCameraConfig = useVoice31RPGStore((s) => s.setCameraConfig);
  const setSceneLighting = useVoice31RPGStore((s) => s.setSceneLighting);
  const updateSettings = useVoice31RPGStore((s) => s.updateSettings);
  const clearFiligree = useVoice31RPGStore((s) => s.clearFiligree);
  const updateNPCPosition = useVoice31RPGStore((s) => s.updateNPCPosition);
  const updateNPCDisplaySize = useVoice31RPGStore((s) => s.updateNPCDisplaySize);

  const color = '#ffaa00'; // Use amber for inspector panel
  const lighting = activeScene.sceneLighting || RPG_SCENE_LIGHTING_PRESETS['default'];
  const camera = activeScene.cameraConfig || DEFAULT_CAMERA_CONFIG;

  const updateLighting = (partial: Partial<RPGSceneLighting>) => {
    setSceneLighting({ ...lighting, ...partial });
  };

  const updateGodRays = (partial: Partial<RPGSceneLighting['godRays']>) => {
    setSceneLighting({ ...lighting, godRays: { ...lighting.godRays, ...partial } });
  };

  const updateCamera = (partial: Partial<typeof camera>) => {
    setCameraConfig({ ...camera, ...partial });
  };

  // Detect current lighting preset
  const currentLightingPreset = (() => {
    if (!activeScene.sceneLighting) return 'default';
    for (const [key, preset] of Object.entries(RPG_SCENE_LIGHTING_PRESETS)) {
      if (preset.fogDensity === activeScene.sceneLighting.fogDensity &&
          preset.ambientIntensity === activeScene.sceneLighting.ambientIntensity &&
          preset.colorTemperature === activeScene.sceneLighting.colorTemperature) {
        return key;
      }
    }
    return 'custom';
  })();

  return (
    <div
      className="relative flex flex-col"
      style={{
        width: 340,
        height,
        background: 'linear-gradient(180deg, #12100e 0%, #0e0d0b 100%)',
        borderLeft: `2px solid ${color}30`,
        borderTop: `2px solid ${color}20`,
        borderBottom: `2px solid ${color}15`,
        borderRadius: '0 12px 12px 0',
        boxShadow: `inset 0 0 20px rgba(0,0,0,0.5), -2px 0 15px rgba(0,0,0,0.4)`,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ borderBottom: `1px solid ${color}20` }}
      >
        <div className="flex items-center gap-2">
          <Cube size={16} weight="bold" color={color} />
          <span className="text-xs font-mono font-bold tracking-wide uppercase" style={{ color }}>
            Scene Inspector
          </span>
        </div>
        <button
          onClick={toggleSceneInspector}
          className="p-1 rounded-md transition-all hover:bg-white/10"
          style={{ color }}
        >
          <X size={14} weight="bold" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4" style={{ scrollbarWidth: 'thin', scrollbarColor: `${color}30 transparent` }}>
        {/* Scene Info */}
        <SectionHeader icon={<Cube size={14} />} title="Scene Info" color={color} />
        {activeScene.location ? (
          <div className="space-y-2">
            <div className="text-sm font-mono" style={{ color }}>{activeScene.location.name}</div>
            {activeScene.backgroundUrl && (
              <div
                className="w-full h-20 rounded-lg bg-cover bg-center"
                style={{
                  backgroundImage: `url(${activeScene.backgroundUrl})`,
                  border: `1px solid ${color}20`,
                }}
              />
            )}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono" style={{ color: `${color}60` }}>
                Type: {activeScene.sceneType}
              </span>
              {activeScene.depthMapUrl && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: `${color}15`, color: `${color}80` }}>
                  Depth Map
                </span>
              )}
              {activeScene.backgroundLoading && (
                <span className="text-[10px] font-mono animate-pulse" style={{ color }}>Loading...</span>
              )}
            </div>
          </div>
        ) : (
          <div className="text-xs font-mono opacity-40" style={{ color }}>No scene active</div>
        )}

        {/* Scene Type */}
        <SectionHeader icon={<GridFour size={14} />} title="Scene Type" color={color} />
        <SettingRow label="Render Mode" description="How the scene is rendered" color={color}>
          <SelectDropdown
            value={activeScene.sceneType}
            options={SCENE_TYPE_OPTIONS}
            onChange={(v) => setSceneType(v as RPGSceneType)}
            color={color}
          />
        </SettingRow>

        {/* Camera */}
        <SectionHeader icon={<Camera size={14} />} title="Camera" color={color} />
        <SettingRow label="Preset" description="Auto-pan behavior" color={color}>
          <SelectDropdown
            value={camera.preset}
            options={CAMERA_PRESET_OPTIONS}
            onChange={(v) => updateCamera({ preset: v as CameraPreset })}
            color={color}
          />
        </SettingRow>
        <SliderRow
          label="Speed" description="Camera movement speed"
          value={Math.round(camera.speed * 10)}
          min={1} max={30} step={1} color={color}
          onChange={(v) => updateCamera({ speed: v / 10 })}
          format={(v) => `${(v / 10).toFixed(1)}x`}
        />
        <SliderRow
          label="Amplitude" description="Movement range"
          value={Math.round(camera.amplitude * 1000)}
          min={10} max={200} step={5} color={color}
          onChange={(v) => updateCamera({ amplitude: v / 1000 })}
          format={(v) => `${(v / 1000).toFixed(3)}`}
        />
        <SliderRow
          label="Mouse Influence" description="How much mouse affects camera"
          value={Math.round(camera.mouseInfluence * 100)}
          min={0} max={100} step={5} color={color}
          onChange={(v) => updateCamera({ mouseInfluence: v / 100 })}
          format={(v) => `${v}%`}
        />

        {/* Lighting */}
        <SectionHeader icon={<Sun size={14} />} title="Lighting" color={color} />
        <SettingRow label="Preset" description="Theme-based lighting" color={color}>
          <SelectDropdown
            value={currentLightingPreset}
            options={[...LIGHTING_PRESET_OPTIONS, ...(currentLightingPreset === 'custom' ? [{ value: 'custom', label: 'Custom' }] : [])]}
            onChange={(v) => {
              const preset = RPG_SCENE_LIGHTING_PRESETS[v];
              if (preset) setSceneLighting(preset);
            }}
            color={color}
          />
        </SettingRow>
        <SliderRow
          label="Fog Density"
          value={Math.round(lighting.fogDensity * 100)}
          min={0} max={100} step={5} color={color}
          onChange={(v) => updateLighting({ fogDensity: v / 100 })}
          format={(v) => `${v}%`}
        />
        <SliderRow
          label="Ambient"
          value={Math.round(lighting.ambientIntensity * 100)}
          min={0} max={200} step={5} color={color}
          onChange={(v) => updateLighting({ ambientIntensity: v / 100 })}
          format={(v) => `${(v / 100).toFixed(2)}`}
        />
        <SliderRow
          label="Temperature"
          value={Math.round(lighting.colorTemperature * 100)}
          min={-100} max={100} step={5} color={color}
          onChange={(v) => updateLighting({ colorTemperature: v / 100 })}
          format={(v) => v === 0 ? '0' : `${(v / 100).toFixed(2)}`}
        />
        <SliderRow
          label="Vignette"
          value={Math.round(lighting.vignetteIntensity * 100)}
          min={0} max={100} step={5} color={color}
          onChange={(v) => updateLighting({ vignetteIntensity: v / 100 })}
          format={(v) => `${v}%`}
        />
        <SettingRow label="God Rays" color={color}>
          <ToggleSwitch
            enabled={lighting.godRays.enabled}
            onToggle={() => updateGodRays({ enabled: !lighting.godRays.enabled })}
            color={color}
          />
        </SettingRow>
        {lighting.godRays.enabled && (
          <SliderRow
            label="Ray Intensity"
            value={Math.round(lighting.godRays.intensity * 100)}
            min={0} max={100} step={5} color={color}
            onChange={(v) => updateGodRays({ intensity: v / 100 })}
            format={(v) => `${v}%`}
          />
        )}

        {/* Depth Parallax */}
        {activeScene.sceneType === 'depthmap' && (
          <>
            <SectionHeader icon={<Cube size={14} />} title="Depth Parallax" color={color} />
            <SettingRow label="Enable" description="3D depth effect" color={color}>
              <ToggleSwitch
                enabled={settings?.enableDepthParallax !== false}
                onToggle={() => updateSettings({ enableDepthParallax: !(settings?.enableDepthParallax !== false) })}
                color={color}
              />
            </SettingRow>
          </>
        )}

        {/* Dither */}
        <SectionHeader icon={<GridFour size={14} />} title="Dither" color={color} />
        <SettingRow label="Enable" description="Post-processing dither overlay" color={color}>
          <ToggleSwitch
            enabled={settings?.enableFMDither !== false}
            onToggle={() => updateSettings({ enableFMDither: !(settings?.enableFMDither !== false) })}
            color={color}
          />
        </SettingRow>
        {settings?.enableFMDither !== false && (
          <>
            <SettingRow label="Pattern" color={color}>
              <SelectDropdown
                value={settings?.fmDitherPattern || 'bayer8'}
                options={DITHER_PATTERN_OPTIONS}
                onChange={(v) => updateSettings({ fmDitherPattern: v as FMDitherPattern })}
                color={color}
              />
            </SettingRow>
            <SliderRow
              label="Color Depth"
              value={settings?.fmDitherColorDepth || 4}
              min={2} max={16} step={1} color={color}
              onChange={(v) => updateSettings({ fmDitherColorDepth: v })}
            />
          </>
        )}

        {/* Filigree */}
        <SectionHeader icon={<Flower size={14} />} title="Filigree" color={color} />
        <SettingRow label="Enable" description="Decorative corner elements" color={color}>
          <ToggleSwitch
            enabled={settings?.enableFiligree !== false}
            onToggle={() => {
              const next = !(settings?.enableFiligree !== false);
              updateSettings({ enableFiligree: next });
              if (!next) clearFiligree();
            }}
            color={color}
          />
        </SettingRow>
        {settings?.enableFiligree !== false && (
          <>
            <SliderRow
              label="Opacity"
              value={Math.round((settings?.filigreeOpacity ?? 0.6) * 100)}
              min={10} max={100} step={5} color={color}
              onChange={(v) => updateSettings({ filigreeOpacity: v / 100 })}
              format={(v) => `${v}%`}
            />
            <SliderRow
              label="Scale"
              value={Math.round((settings?.filigreeScale ?? 1.0) * 100)}
              min={50} max={200} step={10} color={color}
              onChange={(v) => updateSettings({ filigreeScale: v / 100 })}
              format={(v) => `${v}%`}
            />
            {activeScene.filigree.length > 0 && (
              <button
                onClick={clearFiligree}
                className="w-full mt-2 px-3 py-1.5 rounded-lg text-xs font-mono transition-all hover:bg-white/5"
                style={{ border: `1px solid ${color}30`, color: `${color}80` }}
              >
                Regenerate Filigree
              </button>
            )}
          </>
        )}

        {/* NPCs */}
        {activeScene.activeNPCs.length > 0 && (
          <>
            <SectionHeader icon={<Users size={14} />} title={`NPCs (${activeScene.activeNPCs.length})`} color={color} />
            {activeScene.activeNPCs.map((npc) => (
              <div key={npc.id} className="py-2 border-b border-white/5">
                <div className="flex items-center gap-2 mb-2">
                  {npc.portraitBgRemovedUrl || npc.portraitUrl ? (
                    <div
                      className="w-8 h-8 rounded-full bg-cover bg-center flex-shrink-0"
                      style={{
                        backgroundImage: `url(${npc.portraitBgRemovedUrl || npc.portraitUrl})`,
                        border: `1px solid ${color}30`,
                      }}
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs"
                      style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30`, color }}>
                      {npc.name[0]}
                    </div>
                  )}
                  <div>
                    <div className="text-xs font-mono font-bold" style={{ color }}>{npc.name}</div>
                    {npc.title && <div className="text-[10px] font-mono" style={{ color: `${color}60` }}>{npc.title}</div>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <ButtonGroup
                    value={npc.position}
                    options={[
                      { value: 'left', label: 'L' },
                      { value: 'center', label: 'C' },
                      { value: 'right', label: 'R' },
                    ]}
                    onChange={(v) => updateNPCPosition(npc.id, v as 'left' | 'center' | 'right')}
                    color={color}
                  />
                  <ButtonGroup
                    value={npc.displaySize || 'medium'}
                    options={[
                      { value: 'small', label: 'S' },
                      { value: 'medium', label: 'M' },
                      { value: 'large', label: 'L' },
                    ]}
                    onChange={(v) => updateNPCDisplaySize(npc.id, v as 'small' | 'medium' | 'large')}
                    color={color}
                  />
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};
