'use client';

import React from 'react';
import { Voice31RPGBackground } from '../Voice31RPGBackground';
import { Voice31RPGCharacterLayer } from '../Voice31RPGCharacter';
import { Voice31RPGOverlay } from '../Voice31RPGOverlay';
import { Voice31RPGDepthScene } from '../Voice31RPGDepthScene';
import { Voice31RPGDitherOverlay } from '../Voice31RPGDitherOverlay';
import { Voice31RPGFiligreeLayer } from '../Voice31RPGFiligree';
import { useVoice31RPGStore } from '../Voice31RPGStore';
import { useRPGPerformanceProfile } from '../hooks/useRPGPerformanceProfile';
import { useRPGAutoScene } from '../Voice31RPGAutoScene';

/**
 * RPG Visual Layers
 * Depth scene, characters, dither overlay, filigree, and HUD.
 * Supports scene type switching: depthmap, css_only, webgl_dither, parallax_popup.
 */

export const RPGVisualLayers: React.FC<{
  width: number;
  height: number;
  phosphorColor: string;
}> = ({ width, height, phosphorColor }) => {
  const activeScene = useVoice31RPGStore((s) => s.activeScene);
  const settings = useVoice31RPGStore((s) => s.currentSaveFile?.settings);
  const profile = useRPGPerformanceProfile(settings?.visualQuality || 'auto');

  // Auto-detect location changes from narration and generate backgrounds
  useRPGAutoScene();

  const sceneType = activeScene.sceneType || 'depthmap';

  // Determine rendering mode based on scene type + profile
  const useDepthScene = sceneType === 'depthmap'
    && profile.useThreeJS
    && activeScene.depthMapUrl
    && settings?.enableDepthParallax !== false;

  const useDither = profile.useCanvasDither && settings?.enableFMDither !== false;

  // Scene background renderer based on scene type
  const renderSceneBackground = () => {
    // Depth scene with Three.js when both background + depth map are ready
    const canUseDepth = (sceneType === 'depthmap' || sceneType === 'webgl_dither')
      && profile.useThreeJS
      && activeScene.backgroundUrl
      && activeScene.depthMapUrl
      && settings?.enableDepthParallax !== false;

    if (canUseDepth) {
      return (
        <>
          <Voice31RPGDepthScene
            backgroundUrl={activeScene.backgroundUrl}
            depthMapUrl={activeScene.depthMapUrl}
            width={width}
            height={height}
            visualQuality={settings?.visualQuality}
            sceneLighting={activeScene.sceneLighting}
            cameraConfig={activeScene.cameraConfig}
          />
          {/* Hidden CSS background as error fallback if Three.js fails */}
        </>
      );
    }

    // CSS background fallback — always shows the generated image if available
    return (
      <Voice31RPGBackground
        width={width}
        height={height}
        phosphorColor={phosphorColor}
      />
    );
  };

  return (
    <>
      {/* Scene background - type-aware rendering */}
      {renderSceneBackground()}

      {/* FM Dither overlay */}
      {useDither && activeScene.backgroundUrl && (
        <Voice31RPGDitherOverlay
          width={width}
          height={height}
          phosphorColor={phosphorColor}
          pattern={settings?.fmDitherPattern}
          colorDepth={settings?.fmDitherColorDepth}
          intensity={sceneType === 'webgl_dither' ? 0.3 : 0.15}
        />
      )}

      {/* Session filigree decorations */}
      <Voice31RPGFiligreeLayer phosphorColor={phosphorColor} />

      {/* NPC character portraits layer */}
      <Voice31RPGCharacterLayer phosphorColor={phosphorColor} />

      {/* RPG HUD overlay (stats, dialogue options, dice rolls) */}
      <Voice31RPGOverlay
        phosphorColor={phosphorColor}
        width={width}
        height={height}
      />
    </>
  );
};
