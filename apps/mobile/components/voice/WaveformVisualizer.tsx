/**
 * WaveformVisualizer - Animated audio waveform bars
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { useVoiceStore } from '@/stores/voice-store';
import { phosphorColors, type PhosphorColor } from '@/lib/theme';

interface WaveformVisualizerProps {
  color?: PhosphorColor;
  barCount?: number;
  height?: number;
}

function WaveformBar({ value, color, maxHeight }: { value: number; color: string; maxHeight: number }) {
  const animatedStyle = useAnimatedStyle(() => ({
    height: withSpring(Math.max(2, value * maxHeight), {
      damping: 15,
      stiffness: 200,
    }),
  }));

  return (
    <Animated.View
      style={[
        styles.bar,
        {
          backgroundColor: color,
          shadowColor: color,
          shadowOpacity: 0.6,
          shadowRadius: 4,
        },
        animatedStyle,
      ]}
    />
  );
}

export function WaveformVisualizer({
  color = 'amber',
  barCount = 16,
  height = 80,
}: WaveformVisualizerProps) {
  const visualizerData = useVoiceStore(s => s.visualizerData);
  const palette = phosphorColors[color];

  return (
    <View style={[styles.container, { height }]}>
      {visualizerData.slice(0, barCount).map((value, i) => (
        <WaveformBar
          key={i}
          value={value}
          color={palette.primary}
          maxHeight={height}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  bar: {
    width: 4,
    borderRadius: 2,
    minHeight: 2,
  },
});
