/**
 * Point Cloud Shader Shim
 *
 * Re-exports the GPU vertex shader and intrinsics computation from the
 * dreams.fm world-engine point-cloud-renderer. This keeps the shader
 * source co-located with the cinematic engine rather than depending
 * on the dreams.fm repo at runtime.
 */

// ---------------------------------------------------------------------------
// Vertex shader — pinhole camera unprojection with dissolve support
// ---------------------------------------------------------------------------

export const POINT_CLOUD_VERTEX_SHADER = /* glsl */ `
uniform sampler2D uColorTexture;
uniform sampler2D uDepthTexture;
uniform vec2 uResolution;
uniform float uFx;
uniform float uFy;
uniform float uCx;
uniform float uCy;
uniform float uPointSize;
uniform float uDepthScale;
uniform float uNearPlane;
uniform float uFlipY;

// Transition uniforms
uniform float uOpacity;
uniform float uDissolveProgress;
uniform float uTurbulence;
uniform float uParticleSpeed;
uniform float uDispersalRadius;
uniform float uTime;

varying vec3 vColor;
varying float vFogDepth;
varying float vAlpha;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

void main() {
  vec2 uv = position.xy;
  vec2 sampleUV = vec2(uv.x, mix(uv.y, 1.0 - uv.y, uFlipY));

  float rawDepth = texture2D(uDepthTexture, sampleUV).r;
  vec3 color = texture2D(uColorTexture, sampleUV).rgb;

  // Invert and remap depth (white=near, black=far for Depth Anything V2)
  float depth = uNearPlane + (1.0 - rawDepth) * uDepthScale;

  // Unproject to 3D using pinhole camera model
  vec2 pixel = uv * uResolution;
  float x = (pixel.x - uCx) * depth / uFx;
  float y = -(pixel.y - uCy) * depth / uFy;
  float z = -depth;

  vec3 worldPos = vec3(x, y, z);

  // Dissolve: scatter points outward based on per-particle noise
  if (uDissolveProgress > 0.0) {
    float seed = hash(uv);
    vec3 scatterDir = normalize(vec3(
      hash(uv + vec2(0.1, 0.0)) - 0.5,
      hash(uv + vec2(0.0, 0.1)) - 0.5,
      hash(uv + vec2(0.1, 0.1)) - 0.5
    ));
    float wobble = sin(uTime * uParticleSpeed * 3.0 + seed * 6.28) * uTurbulence;
    float scatter = uDissolveProgress * uDispersalRadius * (0.5 + seed * 0.5);
    worldPos += scatterDir * scatter + scatterDir * wobble;
  }

  vec4 mvPosition = modelViewMatrix * vec4(worldPos, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  float midDepth = uNearPlane + uDepthScale * 0.5;
  gl_PointSize = clamp(uPointSize * (midDepth / max(-mvPosition.z, 0.1)), 1.0, 24.0);

  vColor = color;
  vFogDepth = -mvPosition.z;

  float dissolveAlpha = 1.0 - smoothstep(0.3, 1.0, uDissolveProgress);
  vAlpha = uOpacity * dissolveAlpha;
}
`;

// ---------------------------------------------------------------------------
// Camera intrinsics
// ---------------------------------------------------------------------------

export interface CameraIntrinsics {
  fx: number;
  fy: number;
  cx: number;
  cy: number;
  width: number;
  height: number;
}

export function computeIntrinsics(
  width: number,
  height: number,
  fovDegrees: number = 60,
): CameraIntrinsics {
  const fovRad = (fovDegrees * Math.PI) / 180;
  const fy = height / (2 * Math.tan(fovRad / 2));
  const fx = fy; // Square pixels
  return { fx, fy, cx: width / 2, cy: height / 2, width, height };
}

// ---------------------------------------------------------------------------
// Point cloud creation options (type only)
// ---------------------------------------------------------------------------

export interface PointCloudOptions {
  pointSize?: number;
  depthScale?: number;
  nearPlane?: number;
  subdivisions?: number;
  flipY?: boolean;
  fogDensity?: number;
  fogColor?: string;
  fov?: number;
}
