/**
 * Speech.FM Theme
 * CRT-inspired design tokens for the mobile app
 */

export const colors = {
  // Base
  background: '#0a0a0a',
  surface: '#111111',
  surfaceLight: '#1a1a1a',
  border: '#222222',
  borderLight: '#333333',

  // CRT Phosphor Colors
  amber: '#FFB000',
  amberDim: '#FFB00066',
  amberGlow: '#FFB00033',
  green: '#00FF41',
  greenDim: '#00FF4166',
  greenGlow: '#00FF4133',
  red: '#FF3333',
  redDim: '#FF333366',
  blue: '#4488FF',
  blueDim: '#4488FF66',
  white: '#E0E0E0',
  whiteDim: '#E0E0E066',

  // Text
  textPrimary: '#E0E0E0',
  textSecondary: '#888888',
  textMuted: '#555555',

  // Status
  success: '#00FF41',
  error: '#FF3333',
  warning: '#FFB000',
  info: '#4488FF',
} as const;

export const phosphorColors = {
  amber: { primary: colors.amber, dim: colors.amberDim, glow: colors.amberGlow },
  green: { primary: colors.green, dim: colors.greenDim, glow: colors.greenGlow },
  red: { primary: colors.red, dim: colors.redDim, glow: '#FF333333' },
  blue: { primary: colors.blue, dim: colors.blueDim, glow: '#4488FF33' },
  white: { primary: colors.white, dim: colors.whiteDim, glow: '#E0E0E033' },
} as const;

export type PhosphorColor = keyof typeof phosphorColors;

export const fonts = {
  mono: 'SpaceMono-Regular',
  monoBold: 'SpaceMono-Bold',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radii = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;
