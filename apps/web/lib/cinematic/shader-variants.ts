/**
 * Cinematic Shader Variants
 *
 * GLSL fragment shader variants for point cloud and depth mesh rendering.
 * Each variant transforms the base color output with a distinct visual style.
 */

export type ShaderVariant =
  | 'default'
  | 'softGlow'
  | 'breathing'
  | 'toon'
  | 'painterly'
  | 'adaptive';

/**
 * Default: Round soft particle with fog blending.
 */
export const SHADER_DEFAULT = /* glsl */ `
precision highp float;
uniform vec3 fogColor;
uniform float fogDensity;
varying vec3 vColor;
varying float vFogDepth;
varying float vAlpha;

void main() {
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);
  if (dist > 0.5) discard;

  float edgeAlpha = 1.0 - smoothstep(0.4, 0.5, dist);
  float fogFactor = 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
  fogFactor = clamp(fogFactor, 0.0, 1.0);

  vec3 finalColor = mix(vColor, fogColor, fogFactor);
  gl_FragColor = vec4(finalColor, edgeAlpha * vAlpha);
}
`;

/**
 * Soft Glow: Gaussian radial falloff with additive bloom feel.
 */
export const SHADER_SOFT_GLOW = /* glsl */ `
precision highp float;
uniform vec3 fogColor;
uniform float fogDensity;
varying vec3 vColor;
varying float vFogDepth;
varying float vAlpha;

void main() {
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);
  if (dist > 0.5) discard;

  // Gaussian falloff for soft glow
  float glow = exp(-dist * dist * 12.0);
  float edgeAlpha = glow;

  float fogFactor = 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
  fogFactor = clamp(fogFactor, 0.0, 1.0);

  vec3 baseColor = mix(vColor, fogColor, fogFactor);
  // Additive glow boost
  vec3 finalColor = baseColor + baseColor * glow * 0.3;
  gl_FragColor = vec4(finalColor, edgeAlpha * vAlpha);
}
`;

/**
 * Breathing: Pulsing opacity based on time uniform, organic feel.
 */
export const SHADER_BREATHING = /* glsl */ `
precision highp float;
uniform vec3 fogColor;
uniform float fogDensity;
uniform float uTime;
varying vec3 vColor;
varying float vFogDepth;
varying float vAlpha;

void main() {
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);
  if (dist > 0.5) discard;

  float edgeAlpha = 1.0 - smoothstep(0.35, 0.5, dist);

  // Breathing pulse per-particle
  float pulse = 0.85 + 0.15 * sin(uTime * 1.5 + vFogDepth * 2.0);

  float fogFactor = 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
  fogFactor = clamp(fogFactor, 0.0, 1.0);

  vec3 finalColor = mix(vColor * pulse, fogColor, fogFactor);
  gl_FragColor = vec4(finalColor, edgeAlpha * vAlpha * pulse);
}
`;

/**
 * Toon: Cel-shaded with quantized color bands and hard edges.
 */
export const SHADER_TOON = /* glsl */ `
precision highp float;
uniform vec3 fogColor;
uniform float fogDensity;
varying vec3 vColor;
varying float vFogDepth;
varying float vAlpha;

void main() {
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);
  if (dist > 0.5) discard;

  // Hard edge circle
  float edgeAlpha = step(dist, 0.45);

  // Quantize color to 4 levels for cel-shaded look
  vec3 quantized = floor(vColor * 4.0 + 0.5) / 4.0;

  float fogFactor = 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
  fogFactor = clamp(fogFactor, 0.0, 1.0);

  vec3 finalColor = mix(quantized, fogColor, fogFactor);
  gl_FragColor = vec4(finalColor, edgeAlpha * vAlpha);
}
`;

/**
 * Painterly: Jittered edges + slight color shift for oil-paint texture.
 */
export const SHADER_PAINTERLY = /* glsl */ `
precision highp float;
uniform vec3 fogColor;
uniform float fogDensity;
uniform float uTime;
varying vec3 vColor;
varying float vFogDepth;
varying float vAlpha;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

void main() {
  vec2 coord = gl_PointCoord - vec2(0.5);

  // Jitter the coord for painterly edge
  float jitter = hash(coord * 100.0 + vec2(uTime * 0.1)) * 0.08;
  float dist = length(coord) + jitter;
  if (dist > 0.5) discard;

  float edgeAlpha = 1.0 - smoothstep(0.3, 0.5, dist);

  // Slight warm/cool shift based on luminance
  float luma = dot(vColor, vec3(0.299, 0.587, 0.114));
  vec3 warmShift = vec3(0.04, 0.02, -0.02) * (1.0 - luma);
  vec3 paintColor = vColor + warmShift;

  float fogFactor = 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
  fogFactor = clamp(fogFactor, 0.0, 1.0);

  vec3 finalColor = mix(paintColor, fogColor, fogFactor);
  gl_FragColor = vec4(finalColor, edgeAlpha * vAlpha);
}
`;

/**
 * Adaptive: Depth-based gradient coloring — near points warm, far points cool.
 */
export const SHADER_ADAPTIVE = /* glsl */ `
precision highp float;
uniform vec3 fogColor;
uniform float fogDensity;
varying vec3 vColor;
varying float vFogDepth;
varying float vAlpha;

void main() {
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);
  if (dist > 0.5) discard;

  float edgeAlpha = 1.0 - smoothstep(0.35, 0.5, dist);

  // Depth-based color gradient
  float depthNorm = clamp(vFogDepth * 0.15, 0.0, 1.0);
  vec3 warmTint = vec3(1.05, 0.98, 0.92);  // Near: warm
  vec3 coolTint = vec3(0.88, 0.92, 1.05);  // Far: cool
  vec3 depthColor = vColor * mix(warmTint, coolTint, depthNorm);

  float fogFactor = 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
  fogFactor = clamp(fogFactor, 0.0, 1.0);

  vec3 finalColor = mix(depthColor, fogColor, fogFactor);
  gl_FragColor = vec4(finalColor, edgeAlpha * vAlpha);
}
`;

/**
 * Map variant name to fragment shader source.
 */
export const SHADER_VARIANTS: Record<ShaderVariant, string> = {
  default: SHADER_DEFAULT,
  softGlow: SHADER_SOFT_GLOW,
  breathing: SHADER_BREATHING,
  toon: SHADER_TOON,
  painterly: SHADER_PAINTERLY,
  adaptive: SHADER_ADAPTIVE,
};

/**
 * Get fragment shader source for a variant, falling back to default.
 */
export function getShaderVariant(variant: ShaderVariant | undefined): string {
  return SHADER_VARIANTS[variant || 'default'] || SHADER_DEFAULT;
}
