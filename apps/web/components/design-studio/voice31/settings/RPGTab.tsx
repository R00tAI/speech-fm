'use client';

import React from 'react';
import {
  useVoice31RPGStore,
  RPG_SCENE_LIGHTING_PRESETS,
  type VisualQuality,
  type FMDitherPattern,
  type PortraitDisplaySize,
  type SceneTransitionType,
  type NarrativeStyle,
  type CombatStyle,
  type RPGSceneLighting,
} from '../Voice31RPGStore';
import { SettingRow, SelectDropdown, ToggleSwitch, SliderRow, ButtonGroup, type SelectOption } from './primitives';

export const RPGTab: React.FC<{ color: string }> = ({ color }) => {
  const rpgSettings = useVoice31RPGStore((s) => s.currentSaveFile?.settings ?? {
    visualQuality: 'auto' as VisualQuality,
    enableDepthParallax: true,
    enableFMDither: true,
    enableBgRemoval: true,
    fmDitherPattern: 'bayer8' as FMDitherPattern,
    fmDitherColorDepth: 4,
    portraitSize: 'auto' as PortraitDisplaySize,
    sceneTransition: 'crt_static' as SceneTransitionType,
    enableFiligree: true,
    filigreeOpacity: 0.6,
    filigreeScale: 1.0,
    narrativeStyle: 'balanced' as NarrativeStyle,
    combatStyle: 'descriptive' as CombatStyle,
    showDiceRolls: true,
    showDamageNumbers: true,
    backgroundTransitionSpeed: 800,
    npcVoiceEnabled: true,
    ambientEffectsEnabled: true,
    hudOpacity: 0.9,
  });

  const updateSettings = useVoice31RPGStore((s) => s.updateSettings);
  const clearFiligree = useVoice31RPGStore((s) => s.clearFiligree);
  const sceneLighting = useVoice31RPGStore((s) => s.activeScene.sceneLighting);
  const setSceneLighting = useVoice31RPGStore((s) => s.setSceneLighting);

  const visualQualityOptions: SelectOption[] = [
    { value: 'auto', label: 'Auto Detect' },
    { value: 'cinematic', label: 'Cinematic' },
    { value: 'balanced', label: 'Balanced' },
    { value: 'safe', label: 'Safe (Low-end)' },
  ];

  const transitionOptions: SelectOption[] = [
    { value: 'crt_static', label: 'CRT Static' },
    { value: 'scanline_wipe', label: 'Scanline Wipe' },
    { value: 'ink_bleed', label: 'Ink Bleed' },
    { value: 'fade', label: 'Fade' },
    { value: 'dissolve', label: 'Dissolve' },
    { value: 'slide', label: 'Slide' },
    { value: 'zoom', label: 'Zoom' },
    { value: 'none', label: 'None' },
  ];

  const ditherPatternOptions: SelectOption[] = [
    { value: 'bayer4', label: 'Bayer 4x4' },
    { value: 'bayer8', label: 'Bayer 8x8' },
    { value: 'bayer16', label: 'Bayer 16x16' },
    { value: 'halftone', label: 'Halftone' },
    { value: 'noise', label: 'Noise' },
  ];

  const portraitSizeOptions: SelectOption[] = [
    { value: 'auto', label: 'Auto' },
    { value: 'small', label: 'Small (30%)' },
    { value: 'medium', label: 'Medium (45%)' },
    { value: 'large', label: 'Large (60%)' },
  ];

  const lightingPresetOptions: SelectOption[] = [
    { value: 'default', label: 'Default' },
    { value: 'fantasy', label: 'Fantasy' },
    { value: 'cyberpunk', label: 'Cyberpunk' },
    { value: 'noir', label: 'Noir' },
    { value: 'fallout', label: 'Fallout' },
    { value: 'medieval', label: 'Medieval' },
    { value: 'scifi', label: 'Sci-Fi' },
  ];

  // Find which preset matches current lighting (if any)
  const currentLightingPreset = (() => {
    if (!sceneLighting) return 'default';
    for (const [key, preset] of Object.entries(RPG_SCENE_LIGHTING_PRESETS)) {
      if (preset.fogDensity === sceneLighting.fogDensity &&
          preset.ambientIntensity === sceneLighting.ambientIntensity &&
          preset.colorTemperature === sceneLighting.colorTemperature) {
        return key;
      }
    }
    return 'custom';
  })();

  const updateLighting = (partial: Partial<RPGSceneLighting>) => {
    const base = sceneLighting || RPG_SCENE_LIGHTING_PRESETS['default'];
    setSceneLighting({ ...base, ...partial });
  };

  const updateGodRays = (partial: Partial<RPGSceneLighting['godRays']>) => {
    const base = sceneLighting || RPG_SCENE_LIGHTING_PRESETS['default'];
    setSceneLighting({ ...base, godRays: { ...base.godRays, ...partial } });
  };

  const lighting = sceneLighting || RPG_SCENE_LIGHTING_PRESETS['default'];

  return (
    <div className="space-y-1">
      {/* Gameplay */}
      <div className="text-xs font-mono uppercase tracking-widest opacity-50 pt-2 pb-1" style={{ color }}>
        Gameplay
      </div>
      <SettingRow label="Narrative Style" description="How detailed the AI narration is" color={color}>
        <ButtonGroup
          value={rpgSettings.narrativeStyle || 'balanced'}
          options={[
            { value: 'verbose', label: 'Verbose' },
            { value: 'balanced', label: 'Balanced' },
            { value: 'minimal', label: 'Minimal' },
          ]}
          onChange={(v) => updateSettings({ narrativeStyle: v as NarrativeStyle })}
          color={color}
        />
      </SettingRow>
      <SettingRow label="Combat Style" description="Level of combat narration detail" color={color}>
        <ButtonGroup
          value={rpgSettings.combatStyle || 'descriptive'}
          options={[
            { value: 'descriptive', label: 'Descriptive' },
            { value: 'quick', label: 'Quick' },
          ]}
          onChange={(v) => updateSettings({ combatStyle: v as CombatStyle })}
          color={color}
        />
      </SettingRow>
      <SettingRow label="Show Dice Rolls" description="Animate dice roll results on screen" color={color}>
        <ToggleSwitch
          enabled={rpgSettings.showDiceRolls !== false}
          onToggle={() => updateSettings({ showDiceRolls: !rpgSettings.showDiceRolls })}
          color={color}
        />
      </SettingRow>
      <SettingRow label="Show Damage Numbers" description="Floating damage/heal numbers" color={color}>
        <ToggleSwitch
          enabled={rpgSettings.showDamageNumbers !== false}
          onToggle={() => updateSettings({ showDamageNumbers: !rpgSettings.showDamageNumbers })}
          color={color}
        />
      </SettingRow>

      {/* Audio */}
      <div className="text-xs font-mono uppercase tracking-widest opacity-50 pt-4 pb-1" style={{ color }}>
        Audio
      </div>
      <SettingRow label="NPC Voices" description="Text-to-speech for NPC dialogue" color={color}>
        <ToggleSwitch
          enabled={rpgSettings.npcVoiceEnabled !== false}
          onToggle={() => updateSettings({ npcVoiceEnabled: !rpgSettings.npcVoiceEnabled })}
          color={color}
        />
      </SettingRow>
      <SettingRow label="Ambient Effects" description="Background sound effects" color={color}>
        <ToggleSwitch
          enabled={rpgSettings.ambientEffectsEnabled !== false}
          onToggle={() => updateSettings({ ambientEffectsEnabled: !rpgSettings.ambientEffectsEnabled })}
          color={color}
        />
      </SettingRow>

      {/* Interface */}
      <div className="text-xs font-mono uppercase tracking-widest opacity-50 pt-4 pb-1" style={{ color }}>
        Interface
      </div>
      <SliderRow
        label="HUD Opacity" description="Transparency of the RPG overlay"
        value={Math.round((rpgSettings.hudOpacity ?? 0.9) * 100)}
        min={0} max={100} step={5} color={color}
        onChange={(v) => updateSettings({ hudOpacity: v / 100 })}
        format={(v) => `${v}%`}
      />
      <SliderRow
        label="Transition Speed" description="Background transition duration"
        value={rpgSettings.backgroundTransitionSpeed ?? 800}
        min={200} max={2000} step={100} color={color}
        onChange={(v) => updateSettings({ backgroundTransitionSpeed: v })}
        format={(v) => `${v}ms`}
      />

      {/* Scene Transitions */}
      <div className="text-xs font-mono uppercase tracking-widest opacity-50 pt-4 pb-1" style={{ color }}>
        Scene Transitions
      </div>
      <SettingRow label="Transition Effect" description="How scenes change between locations" color={color}>
        <SelectDropdown value={rpgSettings.sceneTransition || 'crt_static'} options={transitionOptions}
          onChange={(v) => updateSettings({ sceneTransition: v as SceneTransitionType })} color={color} />
      </SettingRow>

      {/* Filigree */}
      <div className="text-xs font-mono uppercase tracking-widest opacity-50 pt-4 pb-1" style={{ color }}>
        Decorative Filigree
      </div>
      <SettingRow label="Enable Filigree" description="Auto-generate themed decorative elements" color={color}>
        <ToggleSwitch enabled={rpgSettings.enableFiligree !== false}
          onToggle={() => {
            const next = !(rpgSettings.enableFiligree !== false);
            updateSettings({ enableFiligree: next });
            if (!next) clearFiligree();
          }} color={color} />
      </SettingRow>

      {rpgSettings.enableFiligree !== false && (
        <>
          <SliderRow
            label="Filigree Opacity" description="Transparency of decorative elements"
            value={Math.round((rpgSettings.filigreeOpacity ?? 0.6) * 100)}
            min={10} max={100} step={5} color={color}
            onChange={(v) => updateSettings({ filigreeOpacity: v / 100 })}
            format={(v) => `${v}%`}
          />
          <SliderRow
            label="Filigree Scale" description="Size of decorative elements"
            value={Math.round((rpgSettings.filigreeScale ?? 1.0) * 100)}
            min={50} max={200} step={10} color={color}
            onChange={(v) => updateSettings({ filigreeScale: v / 100 })}
            format={(v) => `${v}%`}
          />
        </>
      )}

      {/* Visual Quality */}
      <div className="text-xs font-mono uppercase tracking-widest opacity-50 pt-4 pb-1" style={{ color }}>
        Visual Quality
      </div>
      <SettingRow label="Visual Quality" description="Controls depth, dither, and rendering quality" color={color}>
        <SelectDropdown value={rpgSettings.visualQuality || 'auto'} options={visualQualityOptions}
          onChange={(v) => updateSettings({ visualQuality: v as VisualQuality })} color={color} />
      </SettingRow>
      <SettingRow label="Depth Parallax" description="3D depth effect on scene backgrounds" color={color}>
        <ToggleSwitch enabled={rpgSettings.enableDepthParallax !== false}
          onToggle={() => updateSettings({ enableDepthParallax: !rpgSettings.enableDepthParallax })} color={color} />
      </SettingRow>
      <SettingRow label="FM Dither" description="Persona-style dither post-processing overlay" color={color}>
        <ToggleSwitch enabled={rpgSettings.enableFMDither !== false}
          onToggle={() => updateSettings({ enableFMDither: !rpgSettings.enableFMDither })} color={color} />
      </SettingRow>
      <SettingRow label="Background Removal" description="Remove NPC portrait backgrounds" color={color}>
        <ToggleSwitch enabled={rpgSettings.enableBgRemoval !== false}
          onToggle={() => updateSettings({ enableBgRemoval: !rpgSettings.enableBgRemoval })} color={color} />
      </SettingRow>

      {rpgSettings.enableFMDither && (
        <>
          <SettingRow label="Dither Pattern" description="Pattern used for dithering" color={color}>
            <SelectDropdown value={rpgSettings.fmDitherPattern || 'bayer8'} options={ditherPatternOptions}
              onChange={(v) => updateSettings({ fmDitherPattern: v as FMDitherPattern })} color={color} />
          </SettingRow>
          <SliderRow
            label="Color Depth" description="Dither color depth (2-16 levels)"
            value={rpgSettings.fmDitherColorDepth || 4}
            min={2} max={16} step={1} color={color}
            onChange={(v) => updateSettings({ fmDitherColorDepth: v })}
          />
        </>
      )}

      {/* Portraits */}
      <div className="text-xs font-mono uppercase tracking-widest opacity-50 pt-4 pb-1" style={{ color }}>
        Portraits
      </div>
      <SettingRow label="Portrait Size" description="NPC portrait display size" color={color}>
        <SelectDropdown value={rpgSettings.portraitSize || 'auto'} options={portraitSizeOptions}
          onChange={(v) => updateSettings({ portraitSize: v as PortraitDisplaySize })} color={color} />
      </SettingRow>

      {/* Scene Lighting */}
      <div className="text-xs font-mono uppercase tracking-widest opacity-50 pt-4 pb-1" style={{ color }}>
        Scene Lighting
      </div>
      <SettingRow label="Lighting Preset" description="Theme-based scene lighting" color={color}>
        <SelectDropdown
          value={currentLightingPreset}
          options={[...lightingPresetOptions, ...(currentLightingPreset === 'custom' ? [{ value: 'custom', label: 'Custom' }] : [])]}
          onChange={(v) => {
            const preset = RPG_SCENE_LIGHTING_PRESETS[v];
            if (preset) setSceneLighting(preset);
          }}
          color={color}
        />
      </SettingRow>
      <SliderRow
        label="Fog Density" description="Atmospheric depth fog amount"
        value={Math.round(lighting.fogDensity * 100)}
        min={0} max={100} step={5} color={color}
        onChange={(v) => updateLighting({ fogDensity: v / 100 })}
        format={(v) => `${v}%`}
      />
      <SliderRow
        label="Ambient Intensity" description="Overall scene brightness"
        value={Math.round(lighting.ambientIntensity * 100)}
        min={0} max={200} step={5} color={color}
        onChange={(v) => updateLighting({ ambientIntensity: v / 100 })}
        format={(v) => `${(v / 100).toFixed(2)}`}
      />
      <SliderRow
        label="Color Temperature" description="Cool (blue) to warm (orange)"
        value={Math.round(lighting.colorTemperature * 100)}
        min={-100} max={100} step={5} color={color}
        onChange={(v) => updateLighting({ colorTemperature: v / 100 })}
        format={(v) => {
          const t = v / 100;
          return t < 0 ? `Cool ${Math.abs(t).toFixed(2)}` : t > 0 ? `Warm ${t.toFixed(2)}` : 'Neutral';
        }}
      />
      <SliderRow
        label="Vignette" description="Edge darkening intensity"
        value={Math.round(lighting.vignetteIntensity * 100)}
        min={0} max={100} step={5} color={color}
        onChange={(v) => updateLighting({ vignetteIntensity: v / 100 })}
        format={(v) => `${v}%`}
      />
      <SettingRow label="God Rays" description="Volumetric light beams" color={color}>
        <ToggleSwitch
          enabled={lighting.godRays.enabled}
          onToggle={() => updateGodRays({ enabled: !lighting.godRays.enabled })}
          color={color}
        />
      </SettingRow>
      {lighting.godRays.enabled && (
        <SliderRow
          label="God Ray Intensity" description="Strength of light beams"
          value={Math.round(lighting.godRays.intensity * 100)}
          min={0} max={100} step={5} color={color}
          onChange={(v) => updateGodRays({ intensity: v / 100 })}
          format={(v) => `${v}%`}
        />
      )}
    </div>
  );
};
