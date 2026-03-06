/**
 * CRTOverlay - Scanline effect overlay
 * Adds subtle CRT scanline texture over content
 */

import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SCANLINE_COUNT = Math.floor(SCREEN_HEIGHT / 3);

export function CRTOverlay({ intensity = 0.03 }: { intensity?: number }) {
  return (
    <View style={styles.container} pointerEvents="none">
      {Array.from({ length: SCANLINE_COUNT }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.scanline,
            {
              opacity: i % 2 === 0 ? intensity : 0,
              top: i * 3,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  scanline: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#000000',
  },
});
