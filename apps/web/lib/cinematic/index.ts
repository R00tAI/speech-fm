/**
 * Cinematic Engine — barrel exports
 */

export { type ShaderVariant, getShaderVariant, SHADER_VARIANTS } from './shader-variants';
export {
  type CinematicPresetName,
  type CameraMotionPath,
  type CinematicPreset,
  CINEMATIC_PRESETS,
  getCinematicPreset,
} from './scene-presets';
export { OrbitalDriftCamera } from './orbital-drift-camera';
export { PointCloudStage, type PointCloudStageProps } from './point-cloud-stage';
export { DepthMeshLayer, type DepthMeshLayerProps } from './depth-mesh-layer';
