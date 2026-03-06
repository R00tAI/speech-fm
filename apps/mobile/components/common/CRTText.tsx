/**
 * CRTText - Phosphor-glow monospace text
 */

import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { colors, phosphorColors, type PhosphorColor } from '@/lib/theme';

interface CRTTextProps extends TextProps {
  color?: PhosphorColor;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  glow?: boolean;
  dim?: boolean;
  bold?: boolean;
}

const sizeMap = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 32,
};

export function CRTText({
  color = 'amber',
  size = 'md',
  glow = false,
  dim = false,
  bold = false,
  style,
  ...props
}: CRTTextProps) {
  const palette = phosphorColors[color];
  const textColor = dim ? palette.dim : palette.primary;

  return (
    <Text
      style={[
        styles.base,
        {
          color: textColor,
          fontSize: sizeMap[size],
          fontWeight: bold ? '700' : '400',
        },
        glow && {
          textShadowColor: palette.glow,
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: 8,
        },
        style,
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: 'SpaceMono-Regular',
    letterSpacing: 0.5,
  },
});
